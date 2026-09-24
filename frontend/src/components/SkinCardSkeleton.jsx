// Même anatomie que les lignes chargées (vignette, nom, donnée à droite) : pas de saut de mise en page
export default function SkinCardSkeleton() {
  return (
    <div className="rarity-card rarity-unknown flex items-center gap-4 animate-pulse">
      <div className="w-14 h-14 shrink-0 rounded bg-surfaceHover" />
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-surfaceHover rounded w-2/3 mb-2" />
        <div className="h-3 bg-surfaceHover rounded w-1/3" />
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <div className="h-4 bg-surfaceHover rounded w-14" />
        <div className="h-3 bg-surfaceHover rounded w-10" />
      </div>
    </div>
  );
}
