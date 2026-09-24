import { Link } from 'react-router-dom';

// Crédits des sources et absence d'affiliation : engagement produit (PRODUCT.md),
// présent sur chaque page plutôt que seulement dans le texte d'accueil
export default function Footer() {
  return (
    <footer className="border-t border-border mt-6">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between text-sm text-muted">
        <div className="max-w-prose space-y-1">
          <p>
            Prix : API publique{' '}
            <a href="https://skinport.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
              Skinport
            </a>
            . Images et raretés :{' '}
            <a
              href="https://github.com/ByMykel/CSGO-API"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline"
            >
              ByMykel/CSGO-API
            </a>
            .
          </p>
          <p>Projet indépendant, non affilié à Skinport ni à Valve.</p>
        </div>
        <nav aria-label="Liens du projet" className="flex gap-4 shrink-0">
          <Link to="/about" className="hover:text-white transition-colors">
            À propos
          </Link>
          <a
            href="https://github.com/victorp34/CS2MarketTracker"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Code source ↗
          </a>
        </nav>
      </div>
    </footer>
  );
}
