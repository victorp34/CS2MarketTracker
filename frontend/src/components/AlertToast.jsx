import { Link } from 'react-router-dom';

export default function AlertToast({ notifications, onDismiss }) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {notifications.map((alert) => (
        <div key={alert.id} className="rarity-card shadow-lg animate-in">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-covert font-display mb-1">
                Alerte déclenchée
              </p>
              <Link
                to={`/skins/${alert.skin_id}`}
                onClick={() => onDismiss(alert.id)}
                className="font-display font-semibold text-sm hover:text-covert transition-colors block truncate"
              >
                {alert.market_hash_name}
              </Link>
              <p className="text-xs text-muted font-mono mt-1">
                {alert.direction === 'below' ? 'Descendu sous' : 'Dépassé'} {Number(alert.target_price).toFixed(2)} €
              </p>
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className="text-muted hover:text-white text-lg leading-none shrink-0"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
