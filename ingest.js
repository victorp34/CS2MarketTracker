// Script d'ingestion quotidien :
// 1. Lit les skins suivis dans la table `skins` (uniquement ceux ayant une alerte)
// 2. Appelle /v1/sales/history en batchant leurs market_hash_name (pour price_history,
//    conservé pour référence/statistiques, mais plus utilisé pour déclencher les alertes)
// 3. Insère un point du jour dans price_history (pas de doublon si relancé)
// 4. Vérifie les alertes actives en comparant au PRIX MINIMUM ACTUEL (price_daily,
//    alimenté par ingest-catalog.js) plutôt qu'au prix moyen des ventes passées --
//    plus intuitif : "préviens-moi si je peux l'acheter sous X€ maintenant"
//
// Usage : node ingest.js

const pool = require('./db');
const checkAlertsForSkin = require('./notifications/alertChecker');

async function fetchSalesHistory(marketHashNames) {
  const params = new URLSearchParams({
    app_id: 730,
    currency: 'EUR',
    market_hash_name: marketHashNames.join(',')
  });

  const response = await fetch(`https://api.skinport.com/v1/sales/history?${params}`, {
    method: 'GET',
    headers: { 'Accept-Encoding': 'br' }
  });

  if (!response.ok) {
    throw new Error(`Skinport API a renvoyé le statut ${response.status}`);
  }

  return response.json();
}

async function run() {
  // Important : depuis l'ajout du catalogue complet (ingest-catalog.js), la table
  // `skins` contient TOUS les items Skinport (~300k). On ne veut PAS batcher tout ça
  // dans /v1/sales/history (URL trop longue, rate limit explosé) — seulement les
  // skins réellement suivis via au moins une alerte.
  const { rows: skins } = await pool.query(
    `SELECT DISTINCT s.id, s.market_hash_name
     FROM skins s
     JOIN alerts a ON a.skin_id = s.id`
  );

  if (skins.length === 0) {
    console.log('Aucun skin suivi via une alerte pour l\'instant. Rien à faire.');
    return;
  }

  console.log(`${skins.length} skin(s) suivi(s), appel de l'API Skinport...`);

  const skinByName = new Map(skins.map(s => [s.market_hash_name, s.id]));
  const names = skins.map(s => s.market_hash_name);
  const results = await fetchSalesHistory(names);

  const today = new Date().toISOString().slice(0, 10);

  // Prix minimum actuel de chaque skin suivi, tel qu'enregistré par la dernière
  // ingestion du catalogue (price_daily) -- sert de référence pour les alertes.
  const skinIds = skins.map(s => s.id);
  const { rows: latestPrices } = await pool.query(
    `SELECT DISTINCT ON (skin_id) skin_id, min_price
     FROM price_daily
     WHERE skin_id = ANY($1)
     ORDER BY skin_id, recorded_date DESC`,
    [skinIds]
  );
  const minPriceBySkinId = new Map(latestPrices.map(r => [r.skin_id, r.min_price]));

  let inserted = 0;
  let skipped = 0;

  for (const item of results) {
    const skinId = skinByName.get(item.market_hash_name);
    if (!skinId) {
      console.warn(`Skin renvoyé par l'API mais introuvable en base : ${item.market_hash_name}`);
      continue;
    }

    const stats24h = item.last_24_hours;

    await pool.query(
      `INSERT INTO price_history (skin_id, recorded_date, min_24h, avg_24h, median_24h, volume_24h)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (skin_id, recorded_date) DO UPDATE SET
         min_24h = EXCLUDED.min_24h,
         avg_24h = EXCLUDED.avg_24h,
         median_24h = EXCLUDED.median_24h,
         volume_24h = EXCLUDED.volume_24h`,
      [skinId, today, stats24h.min, stats24h.avg, stats24h.median, stats24h.volume]
    );

    if (stats24h.volume === 0) {
      skipped++;
    } else {
      inserted++;
    }

    // Vérifie les alertes actives sur ce skin par rapport au prix minimum ACTUEL
    // (price_daily), pas la moyenne des ventes passées (price_history).
    const currentMinPrice = minPriceBySkinId.get(skinId);
    if (currentMinPrice === undefined) {
      console.warn(`Pas de prix catalogue (price_daily) pour ${item.market_hash_name}, alertes ignorées pour ce cycle.`);
      continue;
    }
    await checkAlertsForSkin(skinId, item.market_hash_name, currentMinPrice !== null ? Number(currentMinPrice) : null);
  }

  console.log(`Terminé : ${inserted} skin(s) avec ventes, ${skipped} sans vente sur 24h.`);
}

if (require.main === module) {
  run()
    .catch(err => console.error('Erreur pendant l\'ingestion :', err))
    .finally(() => pool.end());
}

module.exports = run;
