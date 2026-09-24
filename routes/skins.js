const express = require('express');
const pool = require('../db');

const router = express.Router();

// Les prix (min/médian) d'un jour avec trop peu d'annonces actives sont exclus des courbes :
// un "prix médian" calculé sur 1-2 annonces n'a pas de vraie signification et peut
// créer des variations artificielles qui n'existent pas sur le marché réel.
const MIN_QUANTITY_FOR_RELIABLE_PRICE = 5;

// GET /api/skins/top-movers?limit=5 - skins avec la plus grosse variation de PRIX MINIMUM
// entre les deux derniers instantanés disponibles. Deux garde-fous combinés :
// - MIN_QUANTITY : écarte les marchés trop peu liquides (variation calculée sur trop peu d'annonces)
// - MIN_PRICE_EUR : écarte les objets à quelques centimes, où une petite variation en valeur
//   absolue produit un pourcentage disproportionné (11 -> 50 centimes = +354%) sans réelle
//   portée économique. Le plancher s'applique aux DEUX instantanés comparés, pas seulement
//   au plus récent, pour ne pas non plus rater une vraie sortie de la zone "objet anecdotique".
//   Relevé de 1 € à 5 € : à 1 €, le classement était dominé par des stickers passant de 1 € à 4 €
//   (+250 %), un bruit sans portée ; à 5 €, il mêle armes et stickers avec des écarts significatifs.
// Chaque item classé embarque aussi son historique de prix minimum (mini-courbe de l'accueil).
const SPARKLINE_DAYS = 90;

router.get('/top-movers', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 25);
  const MIN_QUANTITY = 10;
  const MIN_PRICE_EUR = 5;

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
         SELECT s.id, s.market_hash_name, s.image_url, s.rarity, s.rarity_name,
                l.today_price, p.prev_price, l.today_date, p.prev_date,
                -- Dates en texte (YYYY-MM-DD) : affichées telles quelles, sans conversion de fuseau
                to_char(l.today_date, 'YYYY-MM-DD') AS today_day, to_char(p.prev_date, 'YYYY-MM-DD') AS prev_day,
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

    // Historique des items classés, en une seule requête (index skin_id + recorded_date).
    // Même règle que la page détail : un jour à trop peu d'annonces n'a pas de prix fiable,
    // il devient un trou dans la courbe plutôt qu'un point trompeur.
    const history = new Map(rows.map((r) => [r.id, []]));
    if (rows.length > 0) {
      const { rows: points } = await pool.query(
        `SELECT skin_id, to_char(recorded_date, 'YYYY-MM-DD') AS day,
                CASE WHEN quantity >= $3 THEN min_price END AS min_price
         FROM price_daily
         WHERE skin_id = ANY($1) AND recorded_date >= CURRENT_DATE - $2::int
         ORDER BY skin_id, recorded_date`,
        [rows.map((r) => r.id), SPARKLINE_DAYS, MIN_QUANTITY_FOR_RELIABLE_PRICE]
      );
      for (const pt of points) {
        history.get(pt.skin_id).push([pt.day, pt.min_price === null ? null : Number(pt.min_price)]);
      }
    }
    const withHistory = (r) => ({ ...r, history: history.get(r.id) });

    res.json({
      gainers: rows.filter(r => r.move_type === 'gainer').map(withHistory),
      losers: rows.filter(r => r.move_type === 'loser').map(withHistory),
      minPriceEur: MIN_PRICE_EUR,
      minQuantity: MIN_QUANTITY
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/skins/meta - fraîcheur des données affichée en page d'accueil :
// date du dernier relevé quotidien et nombre d'items cotés ce jour-là.
// La date est renvoyée en texte (YYYY-MM-DD) pour éviter tout décalage de fuseau
// lors de la conversion d'un DATE Postgres en objet Date JavaScript.
router.get('/meta', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `WITH last AS (SELECT MAX(recorded_date) AS d FROM price_daily)
       SELECT to_char(last.d, 'YYYY-MM-DD') AS last_recorded_date,
              (SELECT COUNT(*) FROM price_daily p WHERE p.recorded_date = last.d)::int AS item_count
       FROM last`
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/skins?search=terme - recherche dans le catalogue (limité, jamais tout)
// Sans "search", renvoie seulement les skins déjà suivis (au moins une alerte),
// pour ne pas essayer de lister les ~300k items du catalogue complet.
const MAX_SEARCH_LENGTH = 100;
const MAX_SEARCH_WORDS = 8;

// --- Correction des fautes de frappe, mot par mot ---
// Vocabulaire du catalogue (mots des noms d'items, avec leur fréquence), gardé en mémoire :
// il ne change qu'à l'ingestion quotidienne, inutile de le relire à chaque recherche.
const VOCABULARY_TTL_MS = 6 * 60 * 60 * 1000;
let vocabularyCache = null;

async function getVocabulary() {
  if (vocabularyCache && Date.now() - vocabularyCache.loadedAt < VOCABULARY_TTL_MS) {
    return vocabularyCache.words;
  }
  const { rows } = await pool.query(
    `SELECT lower(w) AS word, COUNT(*)::int AS freq
     FROM skins, regexp_split_to_table(market_hash_name, '[[:space:]|()]+') AS w
     WHERE length(w) >= 3
     GROUP BY lower(w)`
  );
  vocabularyCache = { words: new Map(rows.map((r) => [r.word, r.freq])), loadedAt: Date.now() };
  return vocabularyCache.words;
}

// Distance d'édition où l'inversion de deux lettres voisines compte pour 1 (Damerau restreinte),
// avec abandon anticipé au-delà de `max` : la plupart des mots du vocabulaire sont écartés tôt
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prevPrev = null;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prevPrev && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, prevPrev[j - 2] + 1);
      }
      cur.push(d);
      rowMin = Math.min(rowMin, d);
    }
    if (rowMin > max) return max + 1;
    prevPrev = prev;
    prev = cur;
  }
  return prev[b.length];
}

// Remplace chaque mot absent du catalogue par le plus proche (1 faute jusqu'à 5 lettres, 2 au-delà ;
// à égalité, le mot le plus fréquent). Renvoie null si rien n'a été corrigé.
function correctQuery(query, vocabulary) {
  let changed = false;
  const words = query.split(/\s+/).filter(Boolean).map((word) => {
    const lower = word.toLowerCase();
    if (lower.length < 3 || vocabulary.has(lower)) return word;
    const max = lower.length <= 5 ? 1 : 2;
    let best = null;
    for (const [candidate, freq] of vocabulary) {
      const d = editDistance(lower, candidate, max);
      if (d <= max && (!best || d < best.d || (d === best.d && freq > best.freq))) {
        best = { candidate, d, freq };
      }
    }
    if (!best) return word;
    changed = true;
    return best.candidate;
  });
  return changed ? words.join(' ') : null;
}

router.get('/', async (req, res) => {
  const { search, offset = 0 } = req.query;
  const PAGE_SIZE = 20;

  try {
    // typeof : ?search=a&search=b donne un tableau, qui ferait planter .trim()
    if (typeof search === 'string' && search.trim().length >= 2) {
      // Découpe la recherche en mots et exige que CHACUN apparaisse quelque part
      // dans le nom, peu importe l'ordre ou les séparateurs entre eux.
      // Bornes : une requête démesurée ne sert à rien et coûte un ILIKE par mot
      const query = search.trim().slice(0, MAX_SEARCH_LENGTH);
      const words = query.split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_WORDS);

      // % et _ sont des jokers pour ILIKE : échappés pour être cherchés littéralement
      // (sinon "__" correspondrait à tout nom d'au moins 2 caractères, donc à tout le catalogue)
      const escapeLike = (word) => word.replace(/[\\%_]/g, '\\$&');
      const conditions = words
        .map((_, i) => `market_hash_name ILIKE '%' || $${i + 1} || '%' ESCAPE '\\'`)
        .join(' AND ');
      const params = [...words.map(escapeLike), query];
      const similarityParamIndex = params.length;
      const offsetParamIndex = similarityParamIndex + 1;
      const limitParamIndex = offsetParamIndex + 1;

      // Tri par famille : la pertinence se mesure sur le nom de base (sans usure ni StatTrak/Souvenir),
      // puis les variantes d'un même item se suivent (normal, StatTrak, Souvenir), chacune dans
      // l'ordre canonique des usures (Factory New -> Battle-Scarred). Le nom complet en dernier
      // départage garantit un ordre total, donc une pagination stable.
      // Pagination d'abord, puis dernier prix minimum connu de chaque résultat de la page
      // (une recherche courte comme "ak" matche des milliers d'items : inutile de chercher leur prix à tous)
      const { rows } = await pool.query(
        `WITH matched AS (
           SELECT id, market_hash_name, item_page, market_page, image_url, rarity, rarity_name,
                  regexp_replace(
                    regexp_replace(market_hash_name, ' [(](Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)[)]$', ''),
                    'StatTrak™ |^Souvenir ', '', 'g'
                  ) AS base_name,
                  CASE WHEN market_hash_name LIKE '%StatTrak™%' THEN 1
                       WHEN market_hash_name LIKE 'Souvenir %' THEN 2
                       ELSE 0 END AS variant_rank,
                  CASE WHEN market_hash_name LIKE '%(Factory New)' THEN 1
                       WHEN market_hash_name LIKE '%(Minimal Wear)' THEN 2
                       WHEN market_hash_name LIKE '%(Field-Tested)' THEN 3
                       WHEN market_hash_name LIKE '%(Well-Worn)' THEN 4
                       WHEN market_hash_name LIKE '%(Battle-Scarred)' THEN 5
                       ELSE 0 END AS wear_rank
           FROM skins
           WHERE ${conditions}
         ),
         page AS (
           SELECT *, similarity(base_name, $${similarityParamIndex}) AS sim
           FROM matched
           ORDER BY sim DESC, base_name, variant_rank, wear_rank, market_hash_name
           OFFSET $${offsetParamIndex} LIMIT $${limitParamIndex}
         )
         SELECT page.id, page.market_hash_name, page.item_page, page.market_page, page.image_url,
                page.rarity, page.rarity_name, lp.min_price
         FROM page
         LEFT JOIN LATERAL (
           SELECT min_price FROM price_daily pd
           WHERE pd.skin_id = page.id
           ORDER BY pd.recorded_date DESC
           LIMIT 1
         ) lp ON true
         ORDER BY page.sim DESC, page.base_name, page.variant_rank, page.wear_rank, page.market_hash_name`,
        [...params, Number(offset), PAGE_SIZE + 1]
      );

      const hasMore = rows.length > PAGE_SIZE;

      // Aucun résultat en première page : suggestions par similarité de mots (pg_trgm),
      // tolérantes aux fautes ("karambitt", "ak47 redlin"). Proposées comme nouvelles
      // recherches, sans l'état d'usure, pour regrouper les variantes d'un même item.
      let suggestions = [];
      if (rows.length === 0 && Number(offset) === 0) {
        const { rows: similar } = await pool.query(
          `SELECT market_hash_name
           FROM skins
           WHERE $1 <% market_hash_name
           ORDER BY word_similarity($1, market_hash_name) DESC, length(market_hash_name)
           LIMIT 20`,
          [query]
        );
        const baseNames = similar.map((r) => r.market_hash_name.replace(/\s*\([^)]*\)\s*$/, '').trim());

        // Les trigrammes ratent les inversions dans les mots courts ("glvoes" ressemble plus à
        // "Glitter" qu'à "Gloves") : la requête corrigée mot par mot passe en tête des suggestions
        const corrected = correctQuery(query, await getVocabulary());
        suggestions = [...new Set([...(corrected ? [corrected] : []), ...baseNames])].slice(0, 4);
      }

      return res.json({ results: rows.slice(0, PAGE_SIZE), hasMore, suggestions });
    }

    // Pas de recherche : renvoie les skins suivis (utile pour la page d'accueil)
    const { rows } = await pool.query(
      `SELECT DISTINCT s.id, s.market_hash_name, s.item_page, s.market_page, s.image_url, s.rarity, s.rarity_name
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
      'SELECT id, market_hash_name, item_page, market_page, image_url, rarity, rarity_name FROM skins WHERE id = $1',
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
// Les prix d'un jour à trop peu d'annonces sont exclus (voir MIN_QUANTITY_FOR_RELIABLE_PRICE).
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
