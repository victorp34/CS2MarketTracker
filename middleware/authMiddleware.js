const jwt = require('jsonwebtoken');

// Vérifie le header "Authorization: Bearer <token>" et attache
// l'id de l'utilisateur à req.userId si le token est valide.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant. Connecte-toi pour accéder à cette ressource.' });
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
}

module.exports = requireAuth;
