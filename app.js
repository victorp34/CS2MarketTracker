const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const skinsRoutes = require('./routes/skins');
const alertsRoutes = require('./routes/alerts');
const adminRoutes = require('./routes/admin');

const app = express();

// Render (comme la plupart des hébergeurs) place l'app derrière un proxy inverse.
// Sans ça, express-rate-limit ne peut pas identifier correctement l'IP de chaque
// visiteur (il verrait l'IP interne du proxy pour tout le monde).
app.set('trust proxy', 1);

// En dev, autorise le frontend local par défaut. En prod, FRONTEND_URL doit
// pointer vers l'URL réelle du frontend déployé (définie en variable d'env).
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/skins', skinsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
