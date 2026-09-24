import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// En dessous, une réponse lente reste normale : inutile d'alerter
const SHOW_AFTER_S = 3;

function useElapsedSeconds(active) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
    if (!active) return;
    const start = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);

  return seconds;
}

// Le backend (Render, tier gratuit) se met en veille après 15 min d'inactivité :
// le premier appel peut prendre 30 à 60 s. Plutôt que des squelettes muets qui
// ressemblent à une panne, on explique l'attente et on propose de quoi l'occuper.
export default function ServerWakeNotice({ active }) {
  const seconds = useElapsedSeconds(active);
  if (!active || seconds < SHOW_AFTER_S) return null;

  return (
    <div role="status" className="rounded-lg border border-border bg-surface px-4 py-3 mb-6">
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <p className="font-display font-semibold">Le serveur se réveille…</p>
        <span className="font-mono text-sm text-muted tabular-nums shrink-0" aria-hidden="true">
          {seconds} s
        </span>
      </div>
      <p className="text-sm text-muted mb-2">
        Hébergé en offre gratuite, il se met en veille après 15 minutes sans visite. Le premier chargement peut
        prendre 30 à 60 secondes, les suivants sont immédiats.
      </p>
      <Link to="/about" className="text-sm text-gold hover:underline">
        En attendant, découvre comment le projet est construit →
      </Link>
    </div>
  );
}
