// Mini-courbe du prix minimum : l'historique de l'item, visible sans ouvrir sa fiche.
// Abscisse = vraies dates (un trou de collecte reste un écart visible, pas une compression),
// un jour à prix non fiable (trop peu d'annonces) coupe la ligne au lieu d'inventer un point.
// Le dernier segment, celui que mesure le pourcentage, est tracé dans la couleur de la tendance.

const WIDTH = 120;
const HEIGHT = 28;
const PAD = 3;

const toTime = (isoDay) => {
  const [y, m, d] = isoDay.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

const formatDay = (isoDay) => {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

export default function Sparkline({ points, highlightFrom, tone, className = '' }) {
  const valid = points.filter(([, price]) => price !== null);
  if (valid.length < 2) return null;

  const t0 = toTime(points[0][0]);
  const t1 = toTime(points[points.length - 1][0]);
  const prices = valid.map(([, price]) => price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  const x = (day) => (t1 === t0 ? WIDTH / 2 : ((toTime(day) - t0) / (t1 - t0)) * (WIDTH - 2 * PAD) + PAD);
  const y = (price) =>
    max === min ? HEIGHT / 2 : PAD + (1 - (price - min) / (max - min)) * (HEIGHT - 2 * PAD);

  // Segments continus entre deux jours fiables consécutifs dans la série
  let base = '';
  let highlight = '';
  for (let i = 1; i < points.length; i++) {
    const [dayA, a] = points[i - 1];
    const [dayB, b] = points[i];
    if (a === null || b === null) continue;
    const seg = `M${x(dayA).toFixed(1)},${y(a).toFixed(1)}L${x(dayB).toFixed(1)},${y(b).toFixed(1)}`;
    if (highlightFrom && dayA >= highlightFrom) highlight += seg;
    else base += seg;
  }

  const [firstDay, firstPrice] = valid[0];
  const [lastDay, lastPrice] = valid[valid.length - 1];
  const label =
    `Prix minimum : ${firstPrice.toFixed(2)} € le ${formatDay(firstDay)}, ` +
    `${lastPrice.toFixed(2)} € le ${formatDay(lastDay)}`;

  return (
    <svg
      role="img"
      aria-label={label}
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`block overflow-visible ${className}`}
    >
      <path d={base} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted" />
      <path d={highlight} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={tone} />
      <circle cx={x(lastDay)} cy={y(lastPrice)} r="2.5" fill="currentColor" className={tone} />
    </svg>
  );
}
