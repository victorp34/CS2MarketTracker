const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

const MAX_TARGET_PRICE = 1_000_000; // borne large mais raisonnable (skins les plus chers ~10-20k€)

function validateTargetPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return 'target_price doit être un nombre.';
  if (price <= 0) return 'target_price doit être strictement positif.';
  if (price > MAX_TARGET_PRICE) return `target_price ne peut pas dépasser ${MAX_TARGET_PRICE}.`;
  return null;
}

router.use(requireAuth);

// GET /api/alerts/followed-skins?offset=0&limit=5 - skins suivis PAR L'UTILISATEUR CONNECTÉ,
// paginés par lots (utilisé sur la page d'accueil). Placé avant les routes /:id pour éviter
// toute ambiguïté de routage.
router.get('/followed-skins', async (req, res) => {
  const offset = Number(req.query.offset) || 0;
  const limit = Math.min(Number(req.query.limit) || 5, 20);

  try {
    // On demande un résultat de plus que la page pour savoir s'il y a une page
    // suivante, sans COUNT(*) séparé.
    const { rows } = await pool.query(
      `SELECT DISTINCT s.id, s.market_hash_name, s.image_url
       FROM skins s
       JOIN alerts a ON a.skin_id = s.id
       WHERE a.user_id = $1
       ORDER BY s.market_hash_name
       OFFSET $2 LIMIT $3`,
      [req.userId, offset, limit + 1]
    );

    const hasMore = rows.length > limit;
    res.json({ results: rows.slice(0, limit), hasMore, offset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/alerts - crée une alerte (ajoute le skin s'il n'est pas encore suivi)
router.post('/', async (req, res) => {
  const { market_hash_name, target_price, direction } = req.body;

  if (!market_hash_name || target_price === undefined || !direction) {
    return res.status(400).json({ error: 'market_hash_name, target_price et direction sont requis.' });
  }
  if (!['above', 'below'].includes(direction)) {
    return res.status(400).json({ error: 'direction doit être "above" ou "below".' });
  }
  const priceError = validateTargetPrice(target_price);
  if (priceError) {
    return res.status(400).json({ error: priceError });
  }

  try {
    const skinResult = await pool.query(
      `INSERT INTO skins (market_hash_name) VALUES ($1)
       ON CONFLICT (market_hash_name) DO UPDATE SET market_hash_name = EXCLUDED.market_hash_name
       RETURNING id`,
      [market_hash_name]
    );
    const skinId = skinResult.rows[0].id;

    const alertResult = await pool.query(
      `INSERT INTO alerts (user_id, skin_id, target_price, direction)
       VALUES ($1, $2, $3, $4)
       RETURNING id, target_price, direction, is_active, triggered, triggered_unseen, created_at`,
      [req.userId, skinId, target_price, direction]
    );

    res.status(201).json({ ...alertResult.rows[0], skin_id: skinId, market_hash_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l\'alerte.' });
  }
});

// GET /api/alerts - liste les alertes de l'utilisateur connecté (actives et déclenchées)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.target_price, a.direction, a.is_active, a.triggered, a.triggered_unseen, a.created_at,
              s.id AS skin_id, s.market_hash_name
       FROM alerts a
       JOIN skins s ON s.id = a.skin_id
       WHERE a.user_id = $1
       ORDER BY a.is_active DESC, a.created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PATCH /api/alerts/:id - modifie une alerte (seuil, direction, activation, accusé de réception)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { target_price, direction, is_active, triggered_unseen } = req.body;

  if (direction !== undefined && !['above', 'below'].includes(direction)) {
    return res.status(400).json({ error: 'direction doit être "above" ou "below".' });
  }
  if (target_price !== undefined) {
    const priceError = validateTargetPrice(target_price);
    if (priceError) {
      return res.status(400).json({ error: priceError });
    }
  }
  if ([target_price, direction, is_active, triggered_unseen].every((v) => v === undefined)) {
    return res.status(400).json({ error: 'Au moins un champ à modifier est requis.' });
  }

  try {
    const { rows: current } = await pool.query(
      'SELECT * FROM alerts WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (current.length === 0) {
      return res.status(404).json({ error: 'Alerte introuvable ou ne t\'appartenant pas.' });
    }
    const existing = current[0];

    const newTargetPrice = target_price ?? existing.target_price;
    const newDirection = direction ?? existing.direction;
    const newIsActive = is_active ?? existing.is_active;

    const reactivating = is_active === true && existing.is_active === false;
    const newTriggered = reactivating ? false : existing.triggered;
    const newTriggeredUnseen = reactivating ? false : (triggered_unseen ?? existing.triggered_unseen);

    const { rows } = await pool.query(
      `UPDATE alerts SET
         target_price = $1,
         direction = $2,
         is_active = $3,
         triggered = $4,
         triggered_unseen = $5
       WHERE id = $6 AND user_id = $7
       RETURNING id, target_price, direction, is_active, triggered, triggered_unseen, created_at`,
      [newTargetPrice, newDirection, newIsActive, newTriggered, newTriggeredUnseen, id, req.userId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour.' });
  }
});

// DELETE /api/alerts/:id - supprime une alerte, seulement si elle appartient à l'utilisateur
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM alerts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerte introuvable ou ne t\'appartenant pas.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
