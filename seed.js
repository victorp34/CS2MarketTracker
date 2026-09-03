// Insère quelques skins de test dans la table `skins`
// Usage : node seed.js

const pool = require('./db');

const testSkins = [
  'AK-47 | Redline (Field-Tested)',
  'AWP | Asiimov (Field-Tested)',
  'M4A4 | Howl (Minimal Wear)'
];

(async () => {
  try {
    for (const name of testSkins) {
      await pool.query(
        `INSERT INTO skins (market_hash_name)
         VALUES ($1)
         ON CONFLICT (market_hash_name) DO NOTHING`,
        [name]
      );
      console.log(`Ajouté (ou déjà présent) : ${name}`);
    }
  } catch (err) {
    console.error('Erreur lors du seed :', err);
  } finally {
    await pool.end();
  }
})();
