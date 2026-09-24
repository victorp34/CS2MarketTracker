const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('token');
}

// Appelé quand le token est invalide/expiré : nettoie la session et renvoie
// vers /login avec un message clair, plutôt que de laisser l'app dans un état
// bloqué avec des 401 silencieux à chaque appel.
function handleExpiredSession() {
  localStorage.removeItem('token');
  sessionStorage.setItem('authMessage', 'Ta session a expiré. Reconnecte-toi pour continuer.');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// Au-delà, on abandonne : un réveil de Render en tier gratuit prend 30 à 60 s,
// 90 s laisse de la marge sans laisser une requête pendre indéfiniment.
const DEFAULT_TIMEOUT_MS = 90_000;

// Annulation volontaire (requête devenue obsolète) : à ignorer silencieusement côté UI
export const isAbortError = (err) => err?.name === 'AbortError';

async function request(path, { signal, timeoutMs = DEFAULT_TIMEOUT_MS, ...options } = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  // Un seul contrôleur pour les deux causes d'abandon : le signal de l'appelant
  // (requête remplacée par une plus récente) et le délai maximal
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', forwardAbort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
  } catch (networkErr) {
    if (timedOut) {
      throw new Error("Le serveur n'a pas répondu à temps. Il est peut-être encore en train de démarrer : réessaie dans un instant.");
    }
    if (isAbortError(networkErr)) throw networkErr;
    throw new Error('Impossible de joindre le serveur. Vérifie ta connexion ou réessaie dans un instant.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      handleExpiredSession();
    }
    throw new Error(data?.error || `Erreur ${response.status}`);
  }
  return data;
}

export const api = {
  register: (email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getSkins: () => request('/skins'),

  searchSkins: (query, offset = 0, opts) =>
    request(`/skins?search=${encodeURIComponent(query)}&offset=${offset}`, opts),

  getCatalogMeta: (opts) => request('/skins/meta', opts),

  getTopMovers: (limit = 5, opts) => request(`/skins/top-movers?limit=${limit}`, opts),

  getFollowedSkins: (offset = 0, limit = 5, opts) =>
    request(`/alerts/followed-skins?offset=${offset}&limit=${limit}`, opts),

  getSkin: (id) => request(`/skins/${id}`),

  getSkinHistory: (skinId) => request(`/skins/${skinId}/history`),

  getAlerts: () => request('/alerts'),

  createAlert: (marketHashName, targetPrice, direction) =>
    request('/alerts', {
      method: 'POST',
      body: JSON.stringify({ market_hash_name: marketHashName, target_price: targetPrice, direction })
    }),

  updateAlert: (id, changes) =>
    request(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),

  deleteAlert: (id) => request(`/alerts/${id}`, { method: 'DELETE' })
};
