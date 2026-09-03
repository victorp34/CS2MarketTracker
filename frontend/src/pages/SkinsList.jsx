import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import SkinImage from '../components/SkinImage.jsx';
import SkinCardSkeleton from '../components/SkinCardSkeleton.jsx';

const FOLLOWED_PAGE_SIZE = 5;

function MoverRow({ skin, isPositive }) {
  return (
    <Link to={`/skins/${skin.id}`} className="rarity-card flex items-center gap-4">
      <SkinImage imageUrl={skin.image_url} name={skin.market_hash_name} />
      <div className="min-w-0 flex-1">
        <span className="font-display font-semibold block truncate">{skin.market_hash_name}</span>
        <span className="text-sm text-muted font-mono">{Number(skin.today_price).toFixed(2)} € (min)</span>
      </div>
      <div className="text-right shrink-0">
        <span className={`font-mono font-semibold text-sm block ${isPositive ? 'text-green-400' : 'text-covert'}`}>
          {isPositive ? '+' : ''}{skin.change_pct}%
        </span>
        <span className="text-xs text-muted">
          depuis le {new Date(skin.prev_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </Link>
  );
}

function FollowedSkinsSection() {
  const [skins, setSkins] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .getFollowedSkins(offset, FOLLOWED_PAGE_SIZE)
      .then((data) => {
        setSkins(data.results);
        setHasMore(data.hasMore);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [offset]);

  const rangeStart = offset + 1;
  const rangeEnd = offset + skins.length;

  if (!loading && skins.length === 0 && offset === 0) {
    return (
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-muted font-display mb-3">Mes skins suivis</p>
        <p className="text-muted">
          Aucun skin suivi pour l'instant. Crée une alerte sur un skin pour le voir apparaître ici.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-muted font-display">Mes skins suivis</p>
        {!loading && skins.length > 0 && (
          <span className="text-xs text-muted font-mono">{rangeStart}–{rangeEnd}</span>
        )}
      </div>

      {error && <p className="text-covert text-sm mb-2">Erreur : {error}</p>}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: FOLLOWED_PAGE_SIZE }).map((_, i) => <SkinCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {skins.map((skin) => (
            <Link key={skin.id} to={`/skins/${skin.id}`} className="rarity-card flex items-center gap-4">
              <SkinImage imageUrl={skin.image_url} name={skin.market_hash_name} />
              <span className="font-display font-semibold">{skin.market_hash_name}</span>
            </Link>
          ))}
        </div>
      )}

      {!loading && (offset > 0 || hasMore) && (
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - FOLLOWED_PAGE_SIZE))}
            disabled={offset === 0}
            className="btn-secondary flex-1"
          >
            ← Précédent
          </button>
          <button
            onClick={() => setOffset((o) => o + FOLLOWED_PAGE_SIZE)}
            disabled={!hasMore}
            className="btn-secondary flex-1"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

export default function SkinsList() {
  const { isLoggedIn } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moversLoading, setMoversLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getTopMovers(5)
      .then((data) => {
        setGainers(data.gainers);
        setLosers(data.losers);
      })
      .catch(() => {})
      .finally(() => setMoversLoading(false));
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasMore(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      api
        .searchSkins(query.trim())
        .then((data) => {
          setResults(data.results);
          setHasMore(data.hasMore);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    api
      .searchSkins(query.trim(), results.length)
      .then((data) => {
        setResults((prev) => [...prev, ...data.results]);
        setHasMore(data.hasMore);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingMore(false));
  };

  const showingSearch = query.trim().length >= 2;
  const noMoversAtAll = gainers.length === 0 && losers.length === 0;

  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-1">Skins</h1>
      <p className="text-muted mb-6">
        Recherche n'importe quel skin du catalogue Skinport, ou découvre les plus grosses variations du moment.
      </p>

      <input
        type="text"
        placeholder="Rechercher un skin (ex: AK-47 Redline)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input-field w-full mb-8"
      />

      {error && <p className="text-covert mb-4">Erreur : {error}</p>}

      {showingSearch ? (
        <>
          {loading && (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => <SkinCardSkeleton key={i} />)}
            </div>
          )}

          {!loading && results.length === 0 && (
            <p className="text-muted">Aucun résultat pour "{query}".</p>
          )}

          {!loading && (
            <div className="grid gap-3">
              {results.map((skin) => (
                <Link key={skin.id} to={`/skins/${skin.id}`} className="rarity-card flex items-center gap-4">
                  <SkinImage imageUrl={skin.image_url} name={skin.market_hash_name} />
                  <span className="font-display font-semibold">{skin.market_hash_name}</span>
                </Link>
              ))}
            </div>
          )}

          {!loading && hasMore && (
            <button onClick={handleLoadMore} disabled={loadingMore} className="btn-secondary mt-4 w-full">
              {loadingMore ? 'Chargement...' : 'Charger plus de résultats'}
            </button>
          )}
        </>
      ) : (
        <>
          {isLoggedIn && <FollowedSkinsSection />}

          {moversLoading && (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => <SkinCardSkeleton key={i} />)}
            </div>
          )}

          {!moversLoading && noMoversAtAll && (
            <p className="text-muted">
              Pas encore assez de données pour calculer les variations (nécessite au moins deux jours d'ingestion, avec au moins 10 offres disponibles par skin).
            </p>
          )}

          {!moversLoading && gainers.length > 0 && (
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wide text-green-400 font-display mb-3">Plus fortes hausses</p>
              <div className="grid gap-3">
                {gainers.map((skin) => <MoverRow key={skin.id} skin={skin} isPositive />)}
              </div>
            </div>
          )}

          {!moversLoading && losers.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-covert font-display mb-3">Plus fortes baisses</p>
              <div className="grid gap-3">
                {losers.map((skin) => <MoverRow key={skin.id} skin={skin} isPositive={false} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
