// Erreur de chargement avec reprise possible. Le texte reste en blanc (le rouge
// Covert en petit corps n'atteint pas 4,5:1 sur la surface) ; la pastille porte le signal.
export default function ErrorNotice({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
    >
      <p className="flex items-baseline gap-2 text-sm min-w-0">
        <span className="w-2 h-2 rounded-full bg-covert shrink-0 translate-y-[-1px]" aria-hidden="true" />
        <span>{message}</span>
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary shrink-0">
          Réessayer
        </button>
      )}
    </div>
  );
}
