const params = new URLSearchParams({
  app_id: 730,
  currency: 'EUR',
  tradable: 0
});

(async () => {
  const response = await fetch(`https://api.skinport.com/v1/items?${params}`, {
    method: 'GET',
    headers: {
      'Accept-Encoding': 'br'
    }
  });

  // Headers utiles pour le rate limiting (à surveiller dès maintenant)
  console.log('--- Rate limit headers ---');
  console.log('X-RateLimit-Limit:', response.headers.get('x-ratelimit-limit'));
  console.log('X-RateLimit-Remaining:', response.headers.get('x-ratelimit-remaining'));
  console.log('X-RateLimit-Reset:', response.headers.get('x-ratelimit-reset'));
  console.log('Status:', response.status);

  const data = await response.json();

  console.log('\n--- Aperçu général ---');
  console.log('Nombre total d\'items reçus:', data.length);

  console.log('\n--- Exemple d\'un item ---');
  console.log(JSON.stringify(data[0], null, 2));

  // Vérifie combien d'items ont des champs null (utile pour savoir
  // comment gérer les cas "pas de prix dispo" plus tard en base)
  const nullPriceCount = data.filter(item => item.min_price === null).length;
  console.log(`\nItems avec min_price null: ${nullPriceCount} / ${data.length}`);

  // Sauvegarde le résultat brut dans un fichier pour pouvoir l'inspecter
  // tranquillement sans re-fetch l'API
  const fs = require('fs');
  fs.writeFileSync('skinport-sample.json', JSON.stringify(data, null, 2));
  console.log('\nDonnées complètes sauvegardées dans skinport-sample.json');
})();
