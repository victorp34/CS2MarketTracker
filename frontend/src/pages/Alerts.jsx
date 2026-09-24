import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import AlertCard from '../components/AlertCard.jsx';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getAlerts()
      .then(setAlerts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdated = (updated) => {
    setAlerts((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
  };

  const handleDeleted = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Filtre côté client : la liste d'alertes d'un utilisateur reste petite,
  // pas besoin d'un aller-retour API pour ça.
  const filteredAlerts = useMemo(() => {
    if (query.trim().length < 1) return alerts;
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return alerts.filter((alert) => {
      const name = alert.market_hash_name.toLowerCase();
      return words.every((w) => name.includes(w));
    });
  }, [alerts, query]);

  if (loading) return <p className="text-muted">Chargement…</p>;
  if (error) return <p className="text-covert-text">Erreur : {error}</p>;

  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-1">Mes alertes</h1>
      <p className="text-muted mb-6">Tu seras notifié quand un skin franchit ton seuil de prix.</p>

      {alerts.length > 0 && (
        <input
          type="text"
          placeholder="Filtrer mes alertes par nom de skin…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field w-full mb-6"
        />
      )}

      {alerts.length === 0 ? (
        <p className="text-muted">
          Aucune alerte pour l'instant.{' '}
          <Link to="/" className="text-covert-text hover:underline">Parcours les skins</Link> pour en créer une.
        </p>
      ) : filteredAlerts.length === 0 ? (
        <p className="text-muted">Aucune alerte ne correspond à "{query}".</p>
      ) : (
        <div className="grid gap-3">
          {filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
