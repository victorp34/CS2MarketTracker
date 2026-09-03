// Récupère TOUT le catalogue Skinport (~300k lignes) en un seul appel API,
// et stocke un point léger par item par jour (min_price, median_price, quantity).
// Sert la recherche + les graphiques de n'importe quel skin, même jamais suivi.
//
// Usage : node ingest-catalog.js

const pool = require('./db');
const bulkInsert = require('./bulkInsert');

const RETENTION_DAYS = 90;

async function fetchFullCatalog() {
  const params = new URLSearchParams({ app_id: 730, currency: 'EUR' });

  const response = await fetch(`https://api.skinport.com/v1/items?${params}`, {
    method: 'GET',
    headers: { 'Accept-Encoding': 'br' }
  });

  if (!response.ok) {
    throw new Error(`Skinport API a renvoyé le statut ${response.status}`);
  }

  return response.json();
}

async function run() {
  console.log('Récupération du catalogue complet Skinport...');
  const rawItems = await fetchFullCatalog();
  console.log(`${rawItems.length} items reçus.`);

  // L'API renvoie parfois plusieurs entrées avec le même market_hash_name
  // (variantes de listing). ON CONFLICT DO UPDATE ne supporte pas de traiter
  // la même clé deux fois dans un même lot -> on déduplique en amont.
  const itemByName = new Map();
  for (const item of rawItems) {
    itemByName.set(item.market_hash_name, item); // garde la dernière occurrence
  }
  const items = Array.from(itemByName.values());
  console.log(`${items.length} items uniques après déduplication.`);

  // 1. Upsert en masse de tous les items dans `skins` (table d'identité partagée)
  console.log('Upsert des skins en base (par lots)...');
  const skinRows = await bulkInsert(pool, {
    table: 'skins',
    columns: ['market_hash_name', 'item_page', 'market_page'],
    rows: items.map(i => ({
      market_hash_name: i.market_hash_name,
      item_page: i.item_page || null,
      market_page: i.market_page || null
    })),
    conflictTarget: '(market_hash_name)',
    conflictAction: 'DO UPDATE SET item_page = EXCLUDED.item_page, market_page = EXCLUDED.market_page',
    returning: 'id, market_hash_name'
  });

  const idByName = new Map(skinRows.map(r => [r.market_hash_name, r.id]));
  console.log(`${idByName.size} skin(s) upsertés.`);

  // 2. Insertion en masse du point de prix du jour pour tous les items
  //    (min_price ET median_price : le prix min est fragile à une annonce
  //    isolée à bas prix, la médiane sert de référence plus robuste pour
  //    les calculs de variation, ex. top hausses/baisses)
  const today = new Date().toISOString().slice(0, 10);
  const priceDailyRows = items
    .map(i => ({
      skin_id: idByName.get(i.market_hash_name),
      recorded_date: today,
      min_price: i.min_price ?? null,
      median_price: i.median_price ?? null,
      quantity: i.quantity ?? null
    }))
    .filter(r => r.skin_id); // sécurité si un nom n'a pas matché

  console.log('Insertion des prix du jour (par lots)...');
  await bulkInsert(pool, {
    table: 'price_daily',
    columns: ['skin_id', 'recorded_date', 'min_price', 'median_price', 'quantity'],
    rows: priceDailyRows,
    conflictTarget: '(skin_id, recorded_date)',
    conflictAction: 'DO UPDATE SET min_price = EXCLUDED.min_price, median_price = EXCLUDED.median_price, quantity = EXCLUDED.quantity'
  });

  // 3. Purge des données de plus de 90 jours (les deux tables d'historique)
  console.log(`Purge des données de plus de ${RETENTION_DAYS} jours...`);
  const { rowCount: purgedDaily } = await pool.query(
    `DELETE FROM price_daily WHERE recorded_date < CURRENT_DATE - INTERVAL '${RETENTION_DAYS} days'`
  );
  const { rowCount: purgedHistory } = await pool.query(
    `DELETE FROM price_history WHERE recorded_date < CURRENT_DATE - INTERVAL '${RETENTION_DAYS} days'`
  );

  console.log(`Terminé. ${priceDailyRows.length} prix insérés/mis à jour. Purgé : ${purgedDaily} (price_daily) + ${purgedHistory} (price_history).`);
}

if (require.main === module) {
  run()
    .catch(err => console.error('Erreur pendant l\'ingestion du catalogue :', err))
    .finally(() => pool.end());
}

module.exports = run;
