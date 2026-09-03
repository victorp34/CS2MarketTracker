export default function SkinCardSkeleton() {
  return (
    <div className="rarity-card flex items-center gap-4 animate-pulse">
      <div className="w-14 h-14 shrink-0 rounded bg-surfaceHover" />
      <div className="h-4 bg-surfaceHover rounded w-2/3" />
    </div>
  );
}
