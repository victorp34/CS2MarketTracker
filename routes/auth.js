const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function validateCredentials(email, password) {
  if (!email || !password) return 'Email et mot de passe requis.';
  if (!EMAIL_REGEX.test(email)) return 'Format d\'email invalide.';
  if (password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
  if (password.length > 72) return 'Le mot de passe est trop long (72 caractères max, limite bcrypt).';
  return null;
}

router.post('/register', authLimiter, async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  const validationError = validateCredentials(email, password);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2)
       RETURNING id`,
      [email, passwordHash]
    );

    const token = generateToken(rows[0].id);
    res.status(201).json({ token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email]
    );

    // Réponse volontairement identique que l'email existe ou non,
    // pour ne pas révéler quels emails sont enregistrés (énumération de comptes)
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const validPassword = await bcrypt.compare(password, rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const token = generateToken(rows[0].id);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

module.exports = router;
