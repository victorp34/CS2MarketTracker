export default function SkinImage({ imageUrl, name, size = 'md' }) {
  const dimensions = size === 'lg' ? 'w-full h-48' : 'w-14 h-14';

  if (imageUrl) {
    return (
      <div className={`${dimensions} shrink-0 bg-base rounded flex items-center justify-center overflow-hidden`}>
        <img src={imageUrl} alt={name} className="max-w-full max-h-full object-contain" loading="lazy" />
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
      className={`${dimensions} shrink-0 rounded flex items-center justify-center font-display font-bold text-muted`}
      style={{ background: 'linear-gradient(135deg, #1c1f26 0%, #2a2e38 100%)' }}
    >
      {initials}
    </div>
  );
}
