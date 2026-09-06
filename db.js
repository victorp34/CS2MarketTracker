require('dotenv').config();
const { Pool } = require('pg');

// Neon (et la plupart des hébergeurs Postgres en ligne) exigent une connexion
// chiffrée. En local avec Docker, ce n'est pas nécessaire. On active le SSL
// uniquement si DATABASE_SSL=true est défini (à mettre dans les variables
// d'environnement de production, pas dans le .env local).
const useSsl = process.env.DATABASE_SSL === 'true';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
});

module.exports = pool;
