const express = require('express');
const crypto = require('crypto');

const runCatalogIngestion = require('../ingest-catalog');
const runDetailedIngestion = require('../ingest');
const runImagesIngestion = require('../ingest-images');

const router = express.Router();

// Comparaison résistante aux attaques par mesure de temps ("timing attack") :
// évite qu'un attaquant devine le secret caractère par caractère en mesurant
// la vitesse de réponse du serveur.
function isValidSecret(provided) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function requireAdminSecret(req, res, next) {
  const provided = req.headers['x-admin-secret'];
  if (!isValidSecret(provided)) {
    return res.status(401).json({ error: 'Secret invalide ou manquant.' });
  }
  next();
}

router.use(requireAdminSecret);

// POST /api/admin/run-catalog - catalogue complet (léger, tous les items)
router.post('/run-catalog', async (req, res) => {
  try {
    await runCatalogIngestion();
    res.json({ status: 'ok', ran: 'catalog', at: new Date().toISOString() });
  } catch (err) {
    console.error('Erreur ingestion catalogue (déclenchée à distance) :', err);
    res.status(500).json({ error: 'Échec de l\'ingestion du catalogue.' });
  }
});

// POST /api/admin/run-detailed - historique détaillé + vérification des alertes
router.post('/run-detailed', async (req, res) => {
  try {
    await runDetailedIngestion();
    res.json({ status: 'ok', ran: 'detailed', at: new Date().toISOString() });
  } catch (err) {
    console.error('Erreur ingestion détaillée (déclenchée à distance) :', err);
    res.status(500).json({ error: 'Échec de l\'ingestion détaillée.' });
  }
});

// POST /api/admin/run-images - association des images (dataset externe, rarement nécessaire)
router.post('/run-images', async (req, res) => {
  try {
    await runImagesIngestion();
    res.json({ status: 'ok', ran: 'images', at: new Date().toISOString() });
  } catch (err) {
    console.error('Erreur ingestion images (déclenchée à distance) :', err);
    res.status(500).json({ error: 'Échec de l\'ingestion des images.' });
  }
});

module.exports = router;
