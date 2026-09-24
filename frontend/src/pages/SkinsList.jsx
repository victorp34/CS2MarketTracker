import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, isAbortError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import SkinImage from '../components/SkinImage.jsx';
import SkinCardSkeleton from '../components/SkinCardSkeleton.jsx';
import ServerWakeNotice from '../components/ServerWakeNotice.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import { rarityEdgeClass, rarityLabel, rarityA11yProps } from '../rarity.js';
import { parseItemName, itemVariantLabel } from '../itemName.js';
import Sparkline from '../components/Sparkline.jsx';

const FOLLOWED_PAGE_SIZE = 5;
const MOVERS_LIMIT = 5;
const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

function SkeletonList({ count }) {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <SkinCardSkeleton key={i} />)}
    </div>
  );
}

// Nom du tier lu par les lecteurs d'écran (le liseré coloré n'est pas perçu)
function RarityText({ skin }) {
  const label = rarityLabel(skin);
  return label ? <span className="sr-only">, rareté {label}</span> : null;
}

// "2026-08-30" -> "30 août" (date texte renvoyée par l'API, sans conversion de fuseau)
function formatDayMonth(isoDay) {
  const [year, month, day] = isoDay.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

const periodKey = (skin) => `${skin.prev_day}|${skin.today_day}`;

// Période partagée par la majorité des lignes : affichée une seule fois en tête du classement.
// Un item absent d'un relevé peut être comparé sur une autre période : sa ligne le précise alors.
function dominantPeriod(skins) {
  const counts = new Map();
  for (const skin of skins) counts.set(periodKey(skin), (counts.get(periodKey(skin)) ?? 0) + 1);
  let best = null;
  for (const [key, count] of counts) if (!best || count > best.count) best = { key, count };
  if (!best) return null;
  const [prevDay, todayDay] = best.key.split('|');
  return { key: best.key, prevDay, todayDay };
}

// Nom de base sur deux lignes max, puis usure et variante sur leur propre ligne, jamais tronquées :
// dans une même famille (AK-47 | Redline), ce sont elles qui distinguent les lignes
function ItemName({ skin }) {
  const parsed = parseItemName(skin.market_hash_name);
  const variantLabel = itemVariantLabel(parsed);
  return (
    <>
      <span className="font-display font-semibold line-clamp-2 break-words">
        {parsed.base}
        {variantLabel && <span className="sr-only">, {variantLabel}</span>}
        <RarityText skin={skin} />
      </span>
      {variantLabel && (
        <span className="block text-xs text-muted" aria-hidden="true">
          {variantLabel}
        </span>
      )}
    </>
  );
}

function MoverRow({ skin, isPositive, period }) {
  // Variation absolue à côté du pourcentage : l'ordre de grandeur réel du mouvement
  const delta = Number(skin.today_price) - Number(skin.prev_price);
  const ownPeriod = period && periodKey(skin) !== period.key;
  const tone = isPositive ? "text-green-400" : "text-covert-text";

  return (
    <Link
      to={`/skins/${skin.id}`}
      className={`rarity-card ${rarityEdgeClass(skin.rarity)} flex items-center gap-4`}
      {...rarityA11yProps(skin)}
    >
      <SkinImage imageUrl={skin.image_url} name={skin.market_hash_name} decorative />
      <div className="min-w-0 flex-1">
        <ItemName skin={skin} />
        <span className="text-sm text-muted">
          <span className="font-mono">{Number(skin.today_price).toFixed(2)} €</span> · prix minimum
        </span>
        <Sparkline points={skin.history ?? []} highlightFrom={skin.prev_day} tone={tone} className="mt-2" />
      </div>
      <div className="text-right shrink-0">
        <span className={`font-mono font-semibold text-sm block ${tone}`}>
          {isPositive ? "+" : ""}{Number(skin.change_pct).toFixed(1)}%
        </span>
        <span className="font-mono text-xs text-muted block">
          {delta >= 0 ? "+" : "−"}{Math.abs(delta).toFixed(2)} €
        </span>
        {ownPeriod && <span className="text-xs text-muted">depuis le {formatDayMonth(skin.prev_day)}</span>}
      </div>
    </Link>
  );
}

function SkinRow({ skin }) {
  return (
    <Link
      to={`/skins/${skin.id}`}
      className={`rarity-card ${rarityEdgeClass(skin.rarity)} flex items-center gap-4`}
      {...rarityA11yProps(skin)}
    >
      <SkinImage imageUrl={skin.image_url} name={skin.market_hash_name} decorative />
      <div className="min-w-0 flex-1">
        <ItemName skin={skin} />
      </div>
      {/* Colonne toujours présente : sans offre en cours, un tiret plutôt qu'un trou qui casse l'alignement */}
      <span className="text-right shrink-0">
        <span className="font-mono text-sm block">
          {skin.min_price != null ? `${Number(skin.min_price).toFixed(2)} €` : "—"}
        </span>
        <span className="text-xs text-muted">{skin.min_price != null ? "prix minimum" : "aucune offre"}</span>
      </span>
    </Link>
  );
}

function FollowedSkinsSection() {
  const [skins, setSkins] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .getFollowedSkins(offset, FOLLOWED_PAGE_SIZE, { signal: controller.signal })
      .then((data) => {
        setSkins(data.results);
        setHasMore(data.hasMore);
        setLoading(false);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [offset, attempt]);

  const rangeStart = offset + 1;
  const rangeEnd = offset + skins.length;
  const heading = <h2 className="font-display font-semibold text-xl">Mes skins suivis</h2>;

  // L'erreur passe avant l'état vide : une liste qui n'a pas pu charger n'est pas une liste vide
  if (error) {
    return (
      <section className="mb-12">
        <div className="mb-3">{heading}</div>
        <ErrorNotice
          message={`Tes skins suivis n'ont pas pu être chargés. ${error}`}
          onRetry={() => setAttempt((a) => a + 1)}
        />
      </section>
    );
  }

  if (!loading && skins.length === 0 && offset === 0) {
    return (
      <section className="mb-12">
        <div className="mb-3">{heading}</div>
        <p className="text-muted">
          Aucun skin suivi pour l'instant. Crée une alerte sur un skin pour le voir apparaître ici.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-12" aria-busy={loading}>
      <div className="flex items-baseline justify-between mb-3">
        {heading}
        {!loading && skins.length > 0 && (
          <span className="text-xs text-muted font-mono">{rangeStart}–{rangeEnd}</span>
        )}
      </div>

      {loading ? (
        <SkeletonList count={FOLLOWED_PAGE_SIZE} />
      ) : (
        <div className="grid gap-3">
          {skins.map((skin) => <SkinRow key={skin.id} skin={skin} />)}
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
    </section>
  );
}

function MoversSection({ title, tone, skins, loading, isPositive, period }) {
  if (!loading && skins.length === 0) return null;
  return (
    <section aria-busy={loading} className="min-w-0">
      <h3 className={`text-xs uppercase tracking-wide font-display mb-3 ${tone}`}>{title}</h3>
      {loading ? (
        <SkeletonList count={MOVERS_LIMIT} />
      ) : (
        <div className="grid gap-3">
          {skins.map((skin) => <MoverRow key={skin.id} skin={skin} isPositive={isPositive} period={period} />)}
        </div>
      )}
    </section>
  );
}

// "2026-09-23" -> "23 septembre 2026", construit en date locale pour éviter un décalage de fuseau
function formatRecordDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Jours écoulés entre un relevé ("2026-09-03") et aujourd'hui, en dates locales
function daysSince(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((todayMidnight - new Date(year, month - 1, day)) / 86_400_000);
}

// La collecte tourne chaque nuit (3h UTC) : la veille est encore normale au petit matin,
// au-delà la promesse « mis à jour chaque jour » n'est plus tenue et on le dit
const STALE_AFTER_DAYS = 1;

// Fraîcheur réelle des données : les prix sont un relevé quotidien, pas du temps réel.
// En cas d'échec, la ligne reste vide (l'erreur est déjà signalée par la section des variations).
function CatalogFreshness() {
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    const controller = new AbortController();
    api
      .getCatalogMeta({ signal: controller.signal })
      .then((data) => {
        setMeta(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (!isAbortError(err)) setStatus('error');
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs mb-6 min-h-4">
      {status === 'loading' && <span className="text-muted">Chargement du dernier relevé…</span>}
      {meta?.last_recorded_date &&
        (daysSince(meta.last_recorded_date) > STALE_AFTER_DAYS ? (
          <span className="flex items-baseline gap-2 text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-covert shrink-0 translate-y-[-1px]" aria-hidden="true" />
            <span>
              Prix du {formatRecordDate(meta.last_recorded_date)} · collecte en retard de{' '}
              {daysSince(meta.last_recorded_date)} jours
            </span>
          </span>
        ) : (
          <span className="text-muted">
            Relevé du {formatRecordDate(meta.last_recorded_date)} · {meta.item_count.toLocaleString('fr-FR')} items
            cotés · mis à jour chaque jour
          </span>
        ))}
      <Link to="/about" className="text-gold hover:underline">
        Comment ce projet est construit →
      </Link>
    </div>
  );
}

const IDLE_SEARCH = { status: 'idle', forQuery: '', results: [], hasMore: false, suggestions: [], error: null };

// Proposées quand une recherche ne donne rien et qu'aucune suggestion proche n'existe
// (noms anglais : c'est la langue du catalogue Skinport)
const EXAMPLE_SEARCHES = ['AK-47 Redline', 'Karambit', 'Sport Gloves', 'AWP Asiimov'];

// scroll : rangée unique défilante sur mobile (exemples sous le champ) ; sinon passage à la ligne
function SearchChips({ items, onPick, scroll = false }) {
  return (
    <ul className={scroll ? "flex gap-2 sm:flex-wrap" : "flex flex-wrap gap-2"}>
      {items.map((item) => (
        <li key={item}>
          <button
            type="button"
            onClick={() => onPick(item)}
            className="min-h-9 whitespace-nowrap rounded-full border border-border bg-surface px-3 text-sm hover:bg-surfaceHover transition-colors"
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function SkinsList() {
  const { isLoggedIn } = useAuth();

  // La requête vit dans l'URL (?q=) : elle survit au retour arrière depuis une fiche
  // et une recherche peut se partager par lien
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const trimmedQuery = query.trim();
  const showingSearch = trimmedQuery.length >= SEARCH_MIN_LENGTH;
  const tooShortQuery = trimmedQuery.length > 0 && !showingSearch;

  // status : idle | pending | ready | error — forQuery = requête qui a produit ces résultats
  const [search, setSearch] = useState(IDLE_SEARCH);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const loadMoreController = useRef(null);

  // status : loading | ready | error
  const [movers, setMovers] = useState({ status: 'loading', gainers: [], losers: [], error: null });
  const [moversAttempt, setMoversAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setMovers((m) => ({ ...m, status: 'loading', error: null }));
    api
      .getTopMovers(MOVERS_LIMIT, { signal: controller.signal })
      .then((data) => setMovers({ status: 'ready', gainers: data.gainers, losers: data.losers, error: null }))
      .catch((err) => {
        if (isAbortError(err)) return;
        setMovers({ status: 'error', gainers: [], losers: [], error: err.message });
      });
    return () => controller.abort();
  }, [moversAttempt]);

  useEffect(() => {
    // Toute nouvelle requête rend obsolète un « Charger plus » en cours sur l'ancienne
    loadMoreController.current?.abort();
    setLoadingMore(false);
    setLoadMoreError(null);

    if (trimmedQuery.length < SEARCH_MIN_LENGTH) {
      setSearch(IDLE_SEARCH);
      return;
    }

    // Les anciens résultats restent affichés (atténués) pendant la saisie :
    // pas de squelettes qui clignotent à chaque frappe
    setSearch((s) => ({ ...s, status: 'pending', error: null }));
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      api
        .searchSkins(trimmedQuery, 0, { signal: controller.signal })
        .then((data) =>
          setSearch({
            status: 'ready',
            forQuery: trimmedQuery,
            results: data.results,
            hasMore: data.hasMore,
            suggestions: data.suggestions ?? [],
            error: null
          })
        )
        .catch((err) => {
          if (isAbortError(err)) return;
          setSearch({ ...IDLE_SEARCH, status: 'error', forQuery: trimmedQuery, error: err.message });
        });
    }, SEARCH_DEBOUNCE_MS);

    // Une réponse lente d'une frappe précédente ne peut plus écraser la plus récente
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery, searchAttempt]);

  const setQuery = (value) => {
    setSearchParams(value ? { q: value } : {}, { replace: true });
  };

  const handleLoadMore = () => {
    const forQuery = search.forQuery;
    const controller = new AbortController();
    loadMoreController.current = controller;
    setLoadingMore(true);
    setLoadMoreError(null);
    api
      .searchSkins(forQuery, search.results.length, { signal: controller.signal })
      .then((data) => {
        setSearch((s) =>
          s.forQuery === forQuery ? { ...s, results: [...s.results, ...data.results], hasMore: data.hasMore } : s
        );
        setLoadingMore(false);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setLoadMoreError(err.message);
        setLoadingMore(false);
      });
  };

  const searchPending = showingSearch && search.status === 'pending';
  const hasPreviousResults = search.results.length > 0;
  const waitingOnServer = showingSearch ? searchPending : movers.status === 'loading';

  const moversLoading = movers.status === 'loading';
  const moversPeriod = dominantPeriod([...movers.gainers, ...movers.losers]);
  const noMoversAtAll = movers.status === 'ready' && movers.gainers.length === 0 && movers.losers.length === 0;

  let searchAnnouncement = '';
  if (showingSearch && searchPending) searchAnnouncement = 'Recherche en cours…';
  if (!showingSearch && movers.status === 'loading') searchAnnouncement = 'Chargement des variations du marché…';
  if (showingSearch && search.status === 'ready') {
    const n = search.results.length;
    searchAnnouncement = n === 0 ? 'Aucun résultat. Des suggestions sont proposées.' : `${n} résultat${n > 1 ? 's' : ''} affiché${n > 1 ? 's' : ''}.`;
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-2 text-balance">Suivi des prix de tout le catalogue CS2</h1>
      <p className="text-muted mb-3 max-w-2xl">
        Prix, historique sur 90 jours et alertes Discord ou e-mail pour chaque item du marché. Site indépendant,
        basé sur les données publiques de Skinport.
      </p>
      <CatalogFreshness />

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
        type="search"
        enterKeyHint="search"
        aria-label="Rechercher un item"
        placeholder="Skin, couteau, gants, sticker…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && query) {
            e.preventDefault();
            setQuery('');
          }
        }}
        aria-describedby={tooShortQuery ? 'search-hint' : undefined}
        className="input-field w-full text-lg py-3 pl-12"
        />
      </div>
      {/* Hauteur réservée : l'indice ou les exemples apparaissent sans décaler la page */}
      <div className={showingSearch ? "mb-8" : "mt-3 mb-12 min-h-9"}>
        {tooShortQuery ? (
          <p id="search-hint" className="text-sm text-muted leading-9">
            Tape au moins 2 caractères pour lancer la recherche.
          </p>
        ) : (
          !query && (
            // Sur mobile, une seule ligne qui défile horizontalement plutôt que trois lignes de pastilles
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
              <span className="text-sm text-muted mr-1 shrink-0">Exemples</span>
              <SearchChips items={EXAMPLE_SEARCHES} onPick={setQuery} scroll />
            </div>
          )
        )}
      </div>

      <p className="sr-only" aria-live="polite">{searchAnnouncement}</p>

      <ServerWakeNotice active={waitingOnServer} />

      {showingSearch ? (
        <section aria-busy={searchPending} aria-labelledby="results-heading">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="results-heading" className="font-display font-semibold text-xl">Résultats</h2>
            {search.results.length > 0 && (
              <span className="text-sm text-muted">
                {search.hasMore
                  ? `${search.results.length} premiers résultats`
                  : `${search.results.length} résultat${search.results.length > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
          {search.status === 'error' && (
            <ErrorNotice
              message={`La recherche a échoué. ${search.error}`}
              onRetry={() => setSearchAttempt((a) => a + 1)}
            />
          )}

          {searchPending && !hasPreviousResults && <SkeletonList count={5} />}

          {search.status === 'ready' && search.results.length === 0 && (
            <div>
              <p className="text-muted mb-4">Aucun résultat pour « {search.forQuery} ».</p>
              {search.suggestions.length > 0 ? (
                <>
                  <p className="text-sm text-muted mb-2">Tu cherchais peut-être :</p>
                  <SearchChips items={search.suggestions} onPick={setQuery} />
                </>
              ) : (
                <>
                  <p className="text-sm text-muted mb-2">
                    Les noms suivent le catalogue Skinport, en anglais. Essaie par exemple :
                  </p>
                  <SearchChips items={EXAMPLE_SEARCHES} onPick={setQuery} />
                </>
              )}
            </div>
          )}

          {hasPreviousResults && (
            <div className={`grid gap-3 transition-opacity ${searchPending ? 'opacity-50' : ''}`}>
              {search.results.map((skin) => <SkinRow key={skin.id} skin={skin} />)}
            </div>
          )}

          {search.status === 'ready' && search.hasMore && (
            <div className="mt-4">
              {loadMoreError ? (
                <ErrorNotice
                  message={`Les résultats suivants n'ont pas pu être chargés. ${loadMoreError}`}
                  onRetry={handleLoadMore}
                />
              ) : (
                <button onClick={handleLoadMore} disabled={loadingMore} className="btn-secondary w-full">
                  {loadingMore ? 'Chargement…' : 'Charger plus de résultats'}
                </button>
              )}
            </div>
          )}
        </section>
      ) : (
        <>
          {isLoggedIn && <FollowedSkinsSection />}

          <section aria-labelledby="market-heading">
          <div className="mb-5">
            <h2 id="market-heading" className="font-display font-semibold text-xl">
              Variations du marché
            </h2>
            <p className="text-sm text-muted">
              {moversPeriod ? (
                <>
                  Prix minimum, entre le relevé du{' '}
                  <span className="text-white">{formatDayMonth(moversPeriod.prevDay)}</span> et celui du{' '}
                  <span className="text-white">{formatDayMonth(moversPeriod.todayDay)}</span>
                </>
              ) : (
                'Prix minimum, entre les deux derniers relevés'
              )}
            </p>
            <details className="mt-2 text-sm text-muted max-w-prose">
              <summary className="cursor-pointer w-fit hover:text-white transition-colors">
                Comment ce classement est filtré
              </summary>
              <p className="mt-2">
                Seuls les items à 5 € ou plus, avec au moins 10 offres aux deux dates, sont classés : cela écarte
                les marchés trop minces et les objets à quelques centimes, où un petit mouvement suffit à faire
                bondir le pourcentage. La variation en euros, sous le pourcentage, donne l'ordre de grandeur
                réel. La courbe montre le prix minimum sur 90 jours ; le trait coloré est la période comparée,
                les trous sont des jours sans prix fiable.
              </p>
            </details>
          </div>

          {movers.status === 'error' && (
            <ErrorNotice
              message={`Les variations du marché n'ont pas pu être chargées. ${movers.error}`}
              onRetry={() => setMoversAttempt((a) => a + 1)}
            />
          )}

          {noMoversAtAll && (
            <p className="text-muted">
              Aucune variation à afficher pour l'instant. Le classement compare les deux derniers relevés
              quotidiens : il faut au moins deux jours de données, et des items qui passent les filtres ci-dessus.
            </p>
          )}

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-6">
          <MoversSection
            title="Plus fortes hausses"
            tone="text-green-400"
            skins={movers.gainers}
            loading={moversLoading}
            isPositive
            period={moversPeriod}
          />
          <MoversSection
            title="Plus fortes baisses"
            tone="text-covert-text"
            skins={movers.losers}
            loading={moversLoading}
            isPositive={false}
            period={moversPeriod}
          />
          </div>
          </section>
        </>
      )}
    </div>
  );
}
