const rateLimit = require('express-rate-limit');

// Limite stricte sur l'auth : empêche le brute-force sur /login et le spam sur /register.
// 10 tentatives / 15 min / IP est large pour un usage légitime, mais bloque un script.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives. Réessaie dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Limite plus large sur le reste de l'API, pour éviter un abus grossier
// sans gêner un usage normal du frontend.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Trop de requêtes. Réessaie dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, apiLimiter };
