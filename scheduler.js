// Process qui tourne en continu et déclenche les ingestions automatiquement.
// Usage : node scheduler.js  (à laisser tourner en arrière-plan)

const cron = require('node-cron');
const runIngestion = require('./ingest');
const runCatalogIngestion = require('./ingest-catalog');

// Catalogue complet (léger, ~300k items) à 3h : long à traiter, autant le lancer
// avant l'ingestion détaillée pour ne pas les faire se chevaucher.
const CATALOG_SCHEDULE = '0 3 * * *';

// Historique détaillé + vérification des alertes, à 4h (seulement les skins suivis)
const DETAILED_SCHEDULE = '0 4 * * *';

console.log(`Scheduler démarré.`);
console.log(`- Catalogue complet : "${CATALOG_SCHEDULE}" (tous les jours à 3h)`);
console.log(`- Historique détaillé + alertes : "${DETAILED_SCHEDULE}" (tous les jours à 4h)`);

cron.schedule(CATALOG_SCHEDULE, async () => {
  console.log(`\n[${new Date().toISOString()}] Déclenchement de l'ingestion du catalogue...`);
  try {
    await runCatalogIngestion();
    console.log(`[${new Date().toISOString()}] Ingestion du catalogue terminée.`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Erreur pendant l'ingestion du catalogue :`, err);
  }
});

cron.schedule(DETAILED_SCHEDULE, async () => {
  console.log(`\n[${new Date().toISOString()}] Déclenchement de l'ingestion détaillée...`);
  try {
    await runIngestion();
    console.log(`[${new Date().toISOString()}] Ingestion détaillée terminée.`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Erreur pendant l'ingestion détaillée :`, err);
  }
});

// Décommente pour tester immédiatement en dev sans attendre l'heure planifiée :
// runCatalogIngestion().then(() => runIngestion()).catch(err => console.error(err));
