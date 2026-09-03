// Test de l'endpoint /v1/sales/history
// Objectif : vérifier le batching via virgules + la structure exacte de la réponse

const marketHashNames = [
  'AK-47 | Redline (Field-Tested)',
  'AWP | Asiimov (Field-Tested)',
  'M4A4 | Howl (Minimal Wear)'
].join(',');

const params = new URLSearchParams({
  app_id: 730,
  currency: 'EUR',
  market_hash_name: marketHashNames
});

(async () => {
  const response = await fetch(`https://api.skinport.com/v1/sales/history?${params}`, {
    method: 'GET',
    headers: {
      'Accept-Encoding': 'br'
    }
  });

  console.log('--- Rate limit headers ---');
  console.log('X-RateLimit-Limit:', response.headers.get('x-ratelimit-limit'));
  console.log('X-RateLimit-Remaining:', response.headers.get('x-ratelimit-remaining'));
  console.log('X-RateLimit-Reset:', response.headers.get('x-ratelimit-reset'));
  console.log('Status:', response.status);

  const data = await response.json();

  console.log('\n--- Nombre d\'items renvoyés ---');
  console.log(Array.isArray(data) ? data.length : 'Réponse non-array, voir ci-dessous');

  console.log('\n--- Réponse complète ---');
  console.log(JSON.stringify(data, null, 2));

  // Vérifie si on retrouve bien les 3 items demandés => confirme le batching
  if (Array.isArray(data)) {
    const namesReturned = data.map(item => item.market_hash_name);
    console.log('\n--- Items demandés vs reçus ---');
    console.log('Demandés:', marketHashNames.split(','));
    console.log('Reçus:', namesReturned);
  }

  const fs = require('fs');
  fs.writeFileSync('skinport-history-sample.json', JSON.stringify(data, null, 2));
  console.log('\nSauvegardé dans skinport-history-sample.json');
})();
