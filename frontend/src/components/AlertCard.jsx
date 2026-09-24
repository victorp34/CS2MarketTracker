import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Switch from './Switch.jsx';
import { rarityEdgeClass, rarityA11yProps } from '../rarity.js';

export default function AlertCard({ alert, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [targetPrice, setTargetPrice] = useState(alert.target_price);
  const [direction, setDirection] = useState(alert.direction);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateAlert(alert.id, {
        target_price: parseFloat(targetPrice),
        direction
      });
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (newValue) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateAlert(alert.id, { is_active: newValue });
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteAlert(alert.id);
      onDeleted(alert.id);
    } catch (err) {
      setError(err.message);
    }
  };

  // Trois états distincts : déclenchée (prioritaire), active, ou mise en pause par l'utilisateur
  const statusLabel = alert.triggered ? 'Déclenchée' : alert.is_active ? 'Active' : 'En pause';
  const statusStyle = alert.triggered
    ? 'bg-covert/20 text-covert-text'
    : alert.is_active
    ? 'bg-green-900/40 text-green-400'
    : 'bg-surfaceHover text-muted';

  return (
    <div className={`rarity-card ${rarityEdgeClass(alert.rarity)}`} {...rarityA11yProps(alert)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/skins/${alert.skin_id}`}
              className="font-display font-semibold hover:text-covert-text transition-colors truncate"
            >
              {alert.market_hash_name}
            </Link>
            <span className={`text-xs px-2 py-0.5 rounded-full font-display uppercase tracking-wide shrink-0 ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>

          {editing ? (
            <div className="flex gap-2 mt-2">
              <select value={direction} onChange={(e) => setDirection(e.target.value)} className="input-field text-sm">
                <option value="below">Descend sous</option>
                <option value="above">Dépasse</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="input-field text-sm w-28"
              />
            </div>
          ) : (
            <p className="text-sm text-muted font-mono">
              {alert.direction === 'below' ? 'Descend sous' : 'Dépasse'} {Number(alert.target_price).toFixed(2)} €
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="text-sm text-gold hover:underline">
                Enregistrer
              </button>
              <button onClick={() => setEditing(false)} className="text-sm text-muted hover:text-white">
                Annuler
              </button>
            </>
          ) : (
            <>
              <Switch checked={alert.is_active} onChange={handleToggle} disabled={saving} />
              <button onClick={() => setEditing(true)} className="text-sm text-muted hover:text-white transition-colors">
                Modifier
              </button>
              <button onClick={handleDelete} className="text-sm text-muted hover:text-covert-text transition-colors">
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-covert-text mt-2">{error}</p>}
    </div>
  );
}
