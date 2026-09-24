// decorative : le nom est déjà écrit à côté (lignes de liste), l'image n'a rien à ajouter pour un lecteur d'écran
export default function SkinImage({ imageUrl, name, size = 'md', decorative = false }) {
  const dimensions = size === 'lg' ? 'w-full h-48' : 'w-14 h-14';

  if (imageUrl) {
    return (
      <div className={`${dimensions} shrink-0 bg-base rounded flex items-center justify-center overflow-hidden`}>
        <img src={imageUrl} alt={decorative ? '' : name} className="max-w-full max-h-full object-contain" loading="lazy" />
      </div>
    );
  }

  // Repli : pas d'image trouvée dans le dataset (fréquent pour stickers, caisses, agents...)
  const initials = name
    .replace(/[★™]/g, '')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`${dimensions} shrink-0 rounded flex items-center justify-center font-display font-bold text-muted bg-gradient-to-br from-surface to-border`}
      aria-hidden={decorative || undefined}
    >
      {initials}
    </div>
  );
}
