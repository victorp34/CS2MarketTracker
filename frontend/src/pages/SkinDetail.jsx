import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import AlertForm from '../components/AlertForm.jsx';
import AlertCard from '../components/AlertCard.jsx';
import SkinImage from '../components/SkinImage.jsx';
import { rarityDotClass, rarityLabel } from '../rarity.js';

const LINES = [
  { dataKey: 'min', name: 'Prix min (€)', color: '#e0473e', axis: 'price' },
  { dataKey: 'median', name: 'Prix médian (€)', color: '#d4af37', axis: 'price' },
  { dataKey: 'quantity', name: 'Offres disponibles', color: '#8a8f9c', axis: 'quantity' }
];

export default function SkinDetail() {
  const { id } = useParams();
  const { isLoggedIn } = useAuth();
  const [skin, setSkin] = useState(null);
  const [history, setHistory] = useState([]);
  const [skinAlerts, setSkinAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Courbes masquées par l'utilisateur (clic sur la légende) — clé = dataKey
  const [hiddenLines, setHiddenLines] = useState({});

  useEffect(() => {
    const calls = [api.getSkin(id), api.getSkinHistory(id)];
    if (isLoggedIn) calls.push(api.getAlerts());

    Promise.all(calls)
      .then(([skinData, hist, allAlerts]) => {
        setSkin(skinData);
        setHistory(
          hist.map((point) => ({
            date: new Date(point.recorded_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            min: point.min_price !== null ? Number(point.min_price) : null,
            median: point.median_price !== null ? Number(point.median_price) : null,
            quantity: point.quantity
          }))
        );
        if (allAlerts) {
          setSkinAlerts(allAlerts.filter((a) => a.skin_id === Number(id)));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isLoggedIn]);

  const handleAlertUpdated = (updated) => {
    setSkinAlerts((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
  };

  const handleAlertDeleted = (alertId) => {
    setSkinAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleAlertCreated = (newAlert) => {
    setSkinAlerts((prev) => [...prev, newAlert]);
  };

  // Clic sur un libellé de la légende : bascule l'affichage de cette courbe
  const handleLegendClick = (entry) => {
    setHiddenLines((prev) => ({ ...prev, [entry.dataKey]: !prev[entry.dataKey] }));
  };

  // Libellés barrés/grisés quand la courbe correspondante est masquée,
  // pour que ce soit visuellement clair que c'est cliquable et déjà désactivé
  const renderLegendText = (value, entry) => {
    const isHidden = hiddenLines[entry.dataKey];
    return (
      <span style={{ color: isHidden ? '#8a8f9c' : '#fff', textDecoration: isHidden ? 'line-through' : 'none', cursor: 'pointer' }}>
        {value}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-surfaceHover rounded w-1/2 mb-3" />
        <div className="h-4 bg-surfaceHover rounded w-1/3 mb-6" />
        <div className="w-full h-48 bg-surfaceHover rounded mb-8" />
        <div className="h-[340px] bg-surfaceHover rounded" />
      </div>
    );
  }
  if (error) return <p className="text-covert-text">Erreur : {error}</p>;
  if (!skin) return <p className="text-muted">Skin introuvable.</p>;

  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-1">{skin.market_hash_name}</h1>
      {rarityLabel(skin) && (
        // Pastille colorée + nom en blanc : les couleurs de tier n'atteignent pas 4,5:1 en petit texte
        <p className="flex items-center gap-2 text-sm text-muted mb-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${rarityDotClass(skin.rarity)}`} aria-hidden="true" />
          Rareté : <span className="text-white">{rarityLabel(skin)}</span>
        </p>
      )}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <p className="text-muted">Historique sur les {history.length} derniers jours suivis (rétention 90 jours). Clique sur la légende pour afficher/masquer une courbe.</p>
        <div className="flex items-center gap-4 shrink-0">
          {skin.item_page && (
            <a href={skin.item_page} target="_blank" rel="noopener noreferrer" className="text-sm text-gold hover:underline whitespace-nowrap">
              Offre la moins chère ↗
            </a>
          )}
          {skin.market_page && (
            <a href={skin.market_page} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-white transition-colors whitespace-nowrap">
              Toutes les offres ↗
            </a>
          )}
        </div>
      </div>

      <div className="mb-8">
        <SkinImage imageUrl={skin.image_url} name={skin.market_hash_name} size="lg" />
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 mb-2" style={{ height: 360 }}>
        {history.length === 0 ? (
          <p className="text-muted h-full flex items-center justify-center">
            Pas encore assez de données historiques pour ce skin.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid stroke="#2a2e38" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#8a8f9c" fontSize={12} />
              <YAxis yAxisId="price" stroke="#8a8f9c" fontSize={12} unit="€" />
              <YAxis yAxisId="quantity" orientation="right" stroke="#8a8f9c" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1c1f26', border: '1px solid #2a2e38', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend onClick={handleLegendClick} formatter={renderLegendText} />
              {LINES.map((line) => (
                <Line
                  key={line.dataKey}
                  yAxisId={line.axis}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  dot={false}
                  strokeWidth={2}
                  hide={!!hiddenLines[line.dataKey]}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-xs text-muted mb-8">
        Les jours avec trop peu d'annonces actives (marché peu liquide) sont exclus des courbes de prix, pour
        éviter des variations artificielles non représentatives du marché réel.
      </p>

      {isLoggedIn ? (
        <div className="space-y-3">
          {skinAlerts.length > 0 && (
            <div className="grid gap-3 mb-4">
              {skinAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onUpdated={handleAlertUpdated} onDeleted={handleAlertDeleted} />
              ))}
            </div>
          )}
          <AlertForm marketHashName={skin.market_hash_name} onCreated={handleAlertCreated} />
        </div>
      ) : (
        <p className="text-muted">
          <a href="/login" className="text-covert-text hover:underline">Connecte-toi</a> pour créer une alerte de prix sur ce skin.
        </p>
      )}
    </div>
  );
}
