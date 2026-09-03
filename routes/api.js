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

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (networkErr) {
    throw new Error('Impossible de joindre le serveur. Vérifie ta connexion ou réessaie dans un instant.');
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

  searchSkins: (query, offset = 0) => request(`/skins?search=${encodeURIComponent(query)}&offset=${offset}`),

  getTopMovers: (limit = 5) => request(`/skins/top-movers?limit=${limit}`),

  getFollowedSkins: (offset = 0, limit = 5) => request(`/alerts/followed-skins?offset=${offset}&limit=${limit}`),

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
