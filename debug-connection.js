// Script de debug : connexion explicite sans passer par DATABASE_URL,
// pour isoler si le problème vient du parsing de l'URL ou d'autre chose.

const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'cs2user',
  password: 'cs2password',
  database: 'cs2_market'
});

client.connect()
  .then(() => {
    console.log('Connexion réussie !');
    return client.query('SELECT current_user, current_database()');
  })
  .then(res => {
    console.log(res.rows);
    return client.end();
  })
  .catch(err => {
    console.error('Échec de connexion :', err.message);
    console.error(err);
  });
