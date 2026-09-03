import { useState } from 'react';
import { api } from '../api.js';

export default function AlertForm({ marketHashName, onCreated }) {
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState('below');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const created = await api.createAlert(marketHashName, parseFloat(targetPrice), direction);
      setStatus('success');
      setTargetPrice('');
      onCreated?.(created);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-5 max-w-md">
      <h2 className="font-display font-semibold text-lg mb-4">Créer une alerte</h2>

      <div className="flex gap-3 mb-4">
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="input-field"
        >
          <option value="below">Descend sous</option>
          <option value="above">Dépasse</option>
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Prix en €"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          className="input-field flex-1"
        />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Création...' : 'Créer l\'alerte'}
      </button>

      {status === 'success' && (
        <p className="text-sm text-gold mt-3">Alerte créée avec succès.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-covert mt-3">Erreur : {errorMsg}</p>
      )}
    </form>
  );
}
