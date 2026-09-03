// Récupère les URLs d'images depuis le dataset communautaire ByMykel/CSGO-API
// et les associe à nos skins. Deux stratégies de correspondance :
//
// 1. Match EXACT via market_hash_name (stickers, patches, agents, music kits,
//    graffiti, breloques) — le dataset fournit directement le même identifiant
//    que Skinport pour ces catégories, donc correspondance fiable à 100%.
// 2. Match APPROXIMATIF via nom normalisé (skins.json) — ce fichier ne couvre
//    que les skins d'armes/couteaux/gants, et ne donne pas le market_hash_name
//    (pas de StatTrak/usure dans son "name"), d'où la normalisation.
//
// À exécuter occasionnellement (le dataset change peu) : node ingest-images.js

const pool = require('./db');

const BASE_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en';

// Fichiers avec market_hash_name direct -> match exact
const EXACT_MATCH_FILES = ['stickers', 'patches', 'agents', 'music_kits', 'graffiti', 'keychains'];

// Fichier sans market_hash_name -> nécessite une normalisation du nom Skinport
const SKINS_FILE = 'skins';

function normalizeForMatch(marketHashName) {
  return marketHashName
    .replace(/StatTrak™\s*/, '')
    .replace(/Souvenir\s*/, '')
    .replace(/\s*\([^)]*\)\s*$/, '') // retire le "(Field-Tested)" final
    .trim();
}

async function fetchJson(filename) {
  const response = await fetch(`${BASE_URL}/${filename}.json`);
  if (!response.ok) {
    throw new Error(`Échec du téléchargement de ${filename}.json : statut ${response.status}`);
  }
  return response.json();
}

async function bulkUpdateImages(rows, batchSize = 500) {
  let updated = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let idx = 1;

    for (const row of batch) {
      values.push(`($${idx++}::int, $${idx++}::text)`);
      params.push(row.id, row.image_url);
    }

    await pool.query(
      `UPDATE skins SET image_url = data.image_url
       FROM (VALUES ${values.join(', ')}) AS data(id, image_url)
       WHERE skins.id = data.id`,
      params
    );
    updated += batch.length;
  }
  return updated;
}

async function run() {
  const exactImageByName = new Map();
  for (const filename of EXACT_MATCH_FILES) {
    console.log(`Téléchargement de ${filename}.json...`);
    const entries = await fetchJson(filename);
    let count = 0;
    for (const entry of entries) {
      if (entry.market_hash_name && entry.image) {
        exactImageByName.set(entry.market_hash_name.trim(), entry.image);
        count++;
      }
    }
    console.log(`  -> ${count} entrée(s) avec market_hash_name + image.`);
  }

  console.log(`Téléchargement de ${SKINS_FILE}.json...`);
  const skinEntries = await fetchJson(SKINS_FILE);
  const approxImageByName = new Map();
  for (const entry of skinEntries) {
    if (entry.name && entry.image) {
      approxImageByName.set(entry.name.trim(), entry.image);
    }
  }
  console.log(`  -> ${approxImageByName.size} entrée(s) avec image.`);

  console.log('Lecture des skins en base...');
  const { rows: skins } = await pool.query('SELECT id, market_hash_name FROM skins');
  console.log(`${skins.length} skins en base à traiter.`);

  const matched = [];
  let exactCount = 0;
  let approxCount = 0;

  for (const skin of skins) {
    const exactUrl = exactImageByName.get(skin.market_hash_name);
    if (exactUrl) {
      matched.push({ id: skin.id, image_url: exactUrl });
      exactCount++;
      continue;
    }

    const approxUrl = approxImageByName.get(normalizeForMatch(skin.market_hash_name));
    if (approxUrl) {
      matched.push({ id: skin.id, image_url: approxUrl });
      approxCount++;
    }
  }

  console.log(`${matched.length} skin(s) matché(s) au total (${exactCount} exacts, ${approxCount} approximatifs) sur ${skins.length} (${((matched.length / skins.length) * 100).toFixed(1)}%).`);
  console.log('Mise à jour en base (par lots)...');
  const updated = await bulkUpdateImages(matched);

  console.log(`Terminé. ${updated} skin(s) mis à jour avec une image.`);
}

if (require.main === module) {
  run()
    .catch(err => console.error('Erreur pendant l\'ingestion des images :', err))
    .finally(() => pool.end());
}

module.exports = run;
