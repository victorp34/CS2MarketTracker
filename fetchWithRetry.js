// Réessaie automatiquement une requête HTTP en cas d'erreur transitoire
// (503 service indisponible, 429 trop de requêtes, 500 erreur serveur générique),
// avec un délai croissant entre chaque tentative. N'insiste pas sur les erreurs
// client (401, 400...), qui ne se résoudront pas en réessayant.
async function fetchWithRetry(url, options = {}, { retries = 3, baseDelayMs = 5000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === retries) {
      throw new Error(`Requête échouée (statut ${response.status}) après ${attempt} tentative(s).`);
    }

    const delayMs = baseDelayMs * attempt; // 5s, 10s, 15s...
    console.warn(`Statut ${response.status} reçu, nouvelle tentative dans ${delayMs / 1000}s (${attempt}/${retries})...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

module.exports = fetchWithRetry;
