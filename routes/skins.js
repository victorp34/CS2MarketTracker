const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/skins/top-movers?limit=5 - skins avec la plus grosse variation de PRIX MINIMUM
// entre les deux derniers instantanés disponibles. Deux garde-fous combinés :
// - MIN_QUANTITY : écarte les marchés trop peu liquides (variation calculée sur trop peu d'annonces)
// - MIN_PRICE_EUR : écarte les objets à quelques centimes, où une petite variation en valeur
//   absolue produit un pourcentage disproportionné (11 -> 50 centimes = +354%) sans réelle
//   portée économique. Le plancher s'applique aux DEUX instantanés comparés, pas seulement
//   au plus récent, pour ne pas non plus rater une vraie sortie de la zone "objet anecdotique".
router.get('/top-movers', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 25);
  const MIN_QUANTITY = 10;
  const MIN_PRICE_EUR = 1;

  try {
    const { rows } = await pool.query(
      `WITH ranked AS (
         SELECT skin_id, recorded_date, min_price, quantity,
                ROW_NUMBER() OVER (PARTITION BY skin_id ORDER BY recorded_date DESC) AS rn
         FROM price_daily
         WHERE min_price IS NOT NULL AND recorded_date >= CURRENT_DATE - INTERVAL '30 days'
       ),
       latest AS (SELECT skin_id, min_price AS today_price, quantity AS today_quantity, recorded_date AS today_date FROM ranked WHERE rn = 1),
       previous AS (SELECT skin_id, min_price AS prev_price, quantity AS prev_quantity, recorded_date AS prev_date FROM ranked WHERE rn = 2),
       changes AS (
         SELECT s.id, s.market_hash_name, s.image_url,
                l.today_price, p.prev_price, l.today_date, p.prev_date,
                ROUND(((l.today_price - p.prev_price) / p.prev_price) * 100, 2) AS change_pct
         FROM latest l
         JOIN previous p ON p.skin_id = l.skin_id
         JOIN skins s ON s.id = l.skin_id
         WHERE p.prev_price > 0
           AND l.today_quantity >= $2
           AND p.prev_quantity >= $2
           AND l.today_price >= $3
           AND p.prev_price >= $3
       )
       (SELECT *, 'gainer' AS move_type FROM changes WHERE change_pct > 0 ORDER BY change_pct DESC LIMIT $1)
       UNION ALL
       (SELECT *, 'loser' AS move_type FROM changes WHERE change_pct < 0 ORDER BY change_pct ASC LIMIT $1)`,
      [limit, MIN_QUANTITY, MIN_PRICE_EUR]
    );

    res.json({
      gainers: rows.filter(r => r.move_type === 'gainer'),
      losers: rows.filter(r => r.move_type === 'loser')
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/skins?search=terme - recherche dans le catalogue (limité, jamais tout)
// Sans "search", renvoie seulement les skins déjà suivis (au moins une alerte),
// pour ne pas essayer de lister les ~300k items du catalogue complet.
router.get('/', async (req, res) => {
  const { search, offset = 0 } = req.query;
  const PAGE_SIZE = 20;

  try {
    if (search && search.trim().length >= 2) {
      // Découpe la recherche en mots et exige que CHACUN apparaisse quelque part
      // dans le nom, peu importe l'ordre ou les séparateurs entre eux.
      const words = search.trim().split(/\s+/).filter(Boolean);

      const conditions = words.map((_, i) => `market_hash_name ILIKE '%' || $${i + 1} || '%'`).join(' AND ');
      const params = [...words, search.trim()];
      const similarityParamIndex = params.length;
      const offsetParamIndex = similarityParamIndex + 1;
      const limitParamIndex = offsetParamIndex + 1;

      const { rows } = await pool.query(
        `SELECT id, market_hash_name, item_page, market_page, image_url
         FROM skins
         WHERE ${conditions}
         ORDER BY similarity(market_hash_name, $${similarityParamIndex}) DESC
         OFFSET $${offsetParamIndex} LIMIT $${limitParamIndex}`,
        [...params, Number(offset), PAGE_SIZE + 1]
      );

      const hasMore = rows.length > PAGE_SIZE;
      return res.json({ results: rows.slice(0, PAGE_SIZE), hasMore });
    }

    // Pas de recherche : renvoie les skins suivis (utile pour la page d'accueil)
    const { rows } = await pool.query(
      `SELECT DISTINCT s.id, s.market_hash_name, s.item_page, s.market_page, s.image_url
       FROM skins s
       JOIN alerts a ON a.skin_id = s.id
       ORDER BY s.market_hash_name
       LIMIT 50`
    );
    res.json({ results: rows, hasMore: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/skins/:id - un skin précis (utilisé par la page détail)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT id, market_hash_name, item_page, market_page, image_url FROM skins WHERE id = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Skin introuvable.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/skins/:id/history - historique de prix (catalogue complet, via price_daily)
// Les prix (min/médian) d'un jour avec trop peu d'annonces actives sont exclus :
// un "prix médian" calculé sur 1-2 annonces n'a pas de vraie signification et peut
// créer des variations artificielles qui n'existent pas sur le marché réel.
const MIN_QUANTITY_FOR_RELIABLE_PRICE = 5;

router.get('/:id/history', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT recorded_date,
              CASE WHEN quantity >= $2 THEN min_price ELSE NULL END AS min_price,
              CASE WHEN quantity >= $2 THEN median_price ELSE NULL END AS median_price,
              quantity
       FROM price_daily
       WHERE skin_id = $1
       ORDER BY recorded_date ASC`,
      [id, MIN_QUANTITY_FOR_RELIABLE_PRICE]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
