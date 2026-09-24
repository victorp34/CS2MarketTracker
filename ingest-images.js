// Récupère les URLs d'images et la rareté depuis le dataset communautaire ByMykel/CSGO-API
// et les associe à nos skins. Deux stratégies de correspondance :
// 1. Match EXACT via market_hash_name (stickers, patches, agents, music kits, graffiti, breloques)
// 2. Match APPROXIMATIF via nom normalisé (skins.json, armes/couteaux/gants)
//
// Usage : node ingest-images.js

const pool = require('./db');
const fetchWithRetry = require('./fetchWithRetry');

const BASE_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en';
const EXACT_MATCH_FILES = ['stickers', 'patches', 'agents', 'music_kits', 'graffiti', 'keychains'];
const SKINS_FILE = 'skins';

// Le dataset donne pour chaque item un tier de rareté avec sa couleur officielle du jeu.
// Les noms varient selon le type d'item (un "Mil-Spec Grade" d'arme et un "High Grade" de
// sticker partagent le même bleu) : la couleur est la clé la plus stable pour normaliser le tier.
const RARITY_TIER_BY_COLOR = {
  '#b0c3d9': 'consumer',
  '#5e98d9': 'industrial',
  '#4b69ff': 'milspec',
  '#8847ff': 'restricted',
  '#d32ce6': 'classified',
  '#eb4b4b': 'covert',
  '#e4ae39': 'contraband'
};

function toItemInfo(entry) {
  const rarity = RARITY_TIER_BY_COLOR[entry.rarity?.color?.toLowerCase()] ?? null;
  return {
    image_url: entry.image ?? null,
    rarity,
    rarity_name: rarity ? entry.rarity.name : null
  };
}

function normalizeForMatch(marketHashName) {
  return marketHashName
    .replace(/StatTrak™\s*/, '')
    .replace(/Souvenir\s*/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

async function fetchJson(filename) {
  const response = await fetchWithRetry(`${BASE_URL}/${filename}.json`);
  return response.json();
}

async function bulkUpdateItemInfo(rows, batchSize = 500) {
  let updated = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let idx = 1;

    for (const row of batch) {
      values.push(`($${idx++}::int, $${idx++}::text, $${idx++}::text, $${idx++}::text)`);
      params.push(row.id, row.image_url, row.rarity, row.rarity_name);
    }

    await pool.query(
      `UPDATE skins
       SET image_url = COALESCE(data.image_url, skins.image_url),
           rarity = data.rarity,
           rarity_name = data.rarity_name
       FROM (VALUES ${values.join(', ')}) AS data(id, image_url, rarity, rarity_name)
       WHERE skins.id = data.id`,
      params
    );
    updated += batch.length;
  }
  return updated;
}

async function run() {
  const exactInfoByName = new Map();
  for (const filename of EXACT_MATCH_FILES) {
    console.log(`Téléchargement de ${filename}.json...`);
    const entries = await fetchJson(filename);
    let count = 0;
    for (const entry of entries) {
      if (entry.market_hash_name && (entry.image || entry.rarity)) {
        exactInfoByName.set(entry.market_hash_name.trim(), toItemInfo(entry));
        count++;
      }
    }
    console.log(`  -> ${count} entrée(s) avec market_hash_name + image/rareté.`);
  }

  console.log(`Téléchargement de ${SKINS_FILE}.json...`);
  const skinEntries = await fetchJson(SKINS_FILE);
  const approxInfoByName = new Map();
  for (const entry of skinEntries) {
    if (entry.name && (entry.image || entry.rarity)) {
      approxInfoByName.set(entry.name.trim(), toItemInfo(entry));
    }
  }
  console.log(`  -> ${approxInfoByName.size} entrée(s) avec image/rareté.`);

  console.log('Lecture des skins en base...');
  const { rows: skins } = await pool.query('SELECT id, market_hash_name FROM skins');
  console.log(`${skins.length} skins en base à traiter.`);

  const matched = [];
  let exactCount = 0;
  let approxCount = 0;

  for (const skin of skins) {
    const exactInfo = exactInfoByName.get(skin.market_hash_name);
    if (exactInfo) {
      matched.push({ id: skin.id, ...exactInfo });
      exactCount++;
      continue;
    }

    const approxInfo = approxInfoByName.get(normalizeForMatch(skin.market_hash_name));
    if (approxInfo) {
      matched.push({ id: skin.id, ...approxInfo });
      approxCount++;
    }
  }

  console.log(`${matched.length} skin(s) matché(s) au total (${exactCount} exacts, ${approxCount} approximatifs) sur ${skins.length} (${((matched.length / skins.length) * 100).toFixed(1)}%).`);
  console.log('Mise à jour en base (par lots)...');
  const updated = await bulkUpdateItemInfo(matched);
  const withRarity = matched.filter((m) => m.rarity).length;

  console.log(`Terminé. ${updated} skin(s) mis à jour (${withRarity} avec une rareté).`);
}

if (require.main === module) {
  run()
    .catch(err => console.error('Erreur pendant l\'ingestion des images :', err))
    .finally(() => pool.end());
}

module.exports = run;
