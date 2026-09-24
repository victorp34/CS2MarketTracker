const STACK = [
  { category: 'Frontend', items: 'React 18 (Vite), Tailwind CSS, Recharts, React Router' },
  { category: 'Backend', items: 'Node.js / Express' },
  { category: 'Base de données', items: 'PostgreSQL (Neon en production)' },
  { category: 'Auth', items: 'JWT, bcrypt' },
  { category: 'Récupération des prix', items: 'Scripts planifiés qui interrogent l\'API Skinport, nettoient et enregistrent les prix en base' },
  { category: 'Notifications', items: 'Webhook Discord, SMTP' },
  { category: 'Tests', items: 'node:test + supertest' },
  { category: 'Infra (dev)', items: 'Docker / Docker Compose (5 services), Nginx' },
  { category: 'Infra (prod)', items: 'Render (backend + frontend), Neon (base de données), GitHub Actions (planification)' }
];

const CHALLENGES = [
  {
    title: 'Rate limit API à 8 requêtes / 5 minutes',
    problem:
      "L'endpoint qui donne les statistiques détaillées de vente (min/moy/médiane/volume) ne supporte pas de requêter les ~25 000 items du catalogue en une fois.",
    solution:
      "Architecture à deux niveaux : un endpoint léger couvre tout le catalogue en un seul appel quotidien pour la recherche et les graphiques ; l'endpoint détaillé n'est utilisé que pour les skins ayant réellement une alerte active, un ensemble bien plus restreint."
  },
  {
    title: 'Insertion de ~25 000 lignes par jour',
    problem:
      "Une requête SQL par ligne aurait pris plusieurs dizaines de minutes à l'échelle du catalogue complet, avec un vrai risque de saturer le pool de connexions.",
    solution:
      "Un helper d'insertion en masse construit des requêtes multi-lignes par lots de 500 à 1000, ramenant l'opération complète à quelques secondes."
  },
  {
    title: 'Doublons dans la réponse de l\'API',
    problem:
      "L'API renvoie parfois plusieurs entrées avec le même identifiant produit dans une même réponse, ce qui fait échouer un upsert multi-lignes (Postgres refuse de mettre à jour la même ligne deux fois dans une seule commande).",
    solution: 'Déduplication en mémoire avant l\'insertion, sur la clé identifiant.'
  },
  {
    title: 'Une métrique de prix trompeuse (trois itérations)',
    problem:
      "Le prix minimum d'un item peut être faussé par une seule annonce isolée très en dessous du marché — un skin passant de 100€ à 2€ puis revenant à 100€ ne représente aucune vraie tendance. Premier correctif : utiliser le prix médian plutôt que le minimum. Mais un second cas est apparu sur des objets très bon marché (un sticker passant de 0,11€ à 0,50€ affichait +354%, un chiffre réel mais sans aucune portée économique).",
    solution:
      "Le calcul final combine un plancher de liquidité (au moins 10 offres actives aux deux instants comparés) et un plancher de prix absolu (5€ minimum des deux côtés ; d'abord fixé à 1€, il laissait encore des stickers passant de 1€ à 4€ dominer le classement à +250%), sur le prix minimum plutôt que la médiane — cette dernière n'était en fait pas le vrai problème, tous les prix bas souffrent du même effet de pourcentage disproportionné."
  },
  {
    title: 'Quel prix utiliser pour déclencher une alerte ?',
    problem:
      "Première version : comparer le seuil au prix moyen des ventes réelles des dernières 24h. Problème découvert à l'usage : une alerte doit répondre à \"puis-je l'acheter sous X€ maintenant ?\", pas \"le marché a-t-il vendu en moyenne sous X€ hier ?\" — deux questions différentes.",
    solution:
      "Les alertes comparent maintenant le seuil au prix minimum actuellement affiché en vente. Une seule annonce isolée à bas prix déclenche bien l'alerte — c'est le comportement voulu ici (contrairement au classement des variations) : une opportunité d'achat réelle, même ponctuelle, mérite d'être signalée."
  },
  {
    title: 'Recherche floue sur des noms structurés',
    problem:
      "Une recherche par sous-chaîne exacte échoue sur des requêtes multi-mots dès que le nom réel contient une ponctuation entre les mots (ex. \"AK-47 | Redline\") — chercher \"AK-47 Redline\" ne matchait rien.",
    solution:
      "Chaque mot de la recherche est vérifié indépendamment (tous doivent apparaître, peu importe l'ordre ou les séparateurs). Les résultats sont ensuite classés par famille : pertinence calculée sur le nom de base via l'extension pg_trgm de Postgres, puis variantes (normale, StatTrak™, Souvenir) et usures dans l'ordre du jeu, de Factory New à Battle-Scarred. Le tri se fait côté serveur, pour que la pagination reste stable d'une page à l'autre."
  },
  {
    title: 'Fautes de frappe dans la recherche',
    problem:
      "La similarité par trigrammes (pg_trgm) tolère mal les inversions de lettres dans les mots courts : \"glvoes\" ressemble plus à \"Glitter\" qu'à \"Gloves\", et abaisser le seuil ne fait qu'ajouter du bruit.",
    solution:
      "Quand une recherche ne donne rien, chaque mot inconnu est corrigé vers le mot le plus proche du vocabulaire du catalogue (distance d'édition où une inversion compte pour une seule faute, avec abandon anticipé du calcul). Ce vocabulaire est gardé en mémoire, puisqu'il ne change qu'à l'ingestion. La requête corrigée est proposée en tête des suggestions, en une dizaine de millisecondes, sans extension ni migration supplémentaire."
  },
  {
    title: 'Sourcing des images et des raretés',
    problem: "L'API de Skinport ne fournit ni image ni rareté.",
    solution:
      "Intégration d'un dataset communautaire externe, avec deux stratégies de correspondance : exacte quand l'identifiant produit est directement fourni, ou avec normalisation du nom sinon. La rareté vient du même dataset. Elle est normalisée à partir de la couleur officielle du tier plutôt que de son nom, puisqu'un sticker \"High Grade\" et une arme \"Mil-Spec\" partagent le même bleu. Elle colore le liseré de chaque carte, et le nom du tier reste lisible par les lecteurs d'écran."
  },
  {
    title: "Le réveil du serveur en hébergement gratuit",
    problem:
      "Le backend en tier gratuit se met en veille après 15 minutes sans visite : le premier chargement peut prendre 30 à 60 secondes. Avec de simples squelettes de chargement, l'attente ressemble à une panne.",
    solution:
      "Au-delà de 3 secondes d'attente, l'accueil explique le réveil du serveur avec un compteur de secondes et propose de lire cette page en attendant. Chaque requête a un délai maximal de 90 secondes, avec un message dédié. Un échec affiche une erreur avec un bouton pour réessayer, jamais un faux état vide."
  },
  {
    title: 'Des données qui peuvent vieillir sans prévenir',
    problem:
      "Si une ingestion quotidienne échoue, le site continue d'afficher les derniers prix connus. \"Mis à jour chaque jour\" deviendrait alors une promesse fausse.",
    solution:
      "L'accueil affiche la date réelle du dernier relevé et le nombre d'items cotés. Au-delà d'un jour de retard, la ligne l'indique explicitement (\"collecte en retard de N jours\"). Le classement des variations annonce aussi les deux dates qu'il compare, plutôt qu'un vague \"du jour\"."
  }
];

const SECURITY = [
  'CORS restreint à l\'URL du frontend (pas de wildcard) : seul le vrai site peut appeler l\'API',
  'helmet : ajoute automatiquement des protections standards sur les réponses du serveur',
  'express-rate-limit : bloque une adresse qui ferait trop de tentatives de connexion trop vite (anti brute-force)',
  'Validation des entrées (format email, bornes numériques, longueur des mots de passe)',
  'Mots de passe hashés avec bcrypt',
  'Requêtes SQL systématiquement paramétrées',
  'Recherche bornée (longueur et nombre de mots) et jokers % et _ échappés dans les ILIKE : une saisie comme "__" ne peut pas renvoyer tout le catalogue',
  'Conteneurs applicatifs exécutés en utilisateur non-root',
  'Outil d\'administration de la base isolé derrière un profil Docker dédié au développement, jamais actif en production',
  'Routes de déclenchement d\'ingestion (utilisées en production) protégées par un secret dédié, comparé de façon résistante aux attaques par mesure de temps'
];

export default function About() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display font-bold text-3xl mb-2">À propos de ce projet</h1>
      <p className="text-muted mb-10">
        Un tracker de prix et un système d'alertes pour l'ensemble du catalogue de skins CS2, construit comme
        projet de portfolio. Cette page détaille les choix techniques, les contraintes rencontrées et comment
        elles ont été traitées.
      </p>

      <section className="mb-10">
        <h2 className="font-display font-semibold text-xl mb-4">Stack technique</h2>
        <div className="rounded-lg border border-border overflow-hidden">
          {STACK.map((row, i) => (
            <div
              key={row.category}
              className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3 ${i % 2 === 0 ? 'bg-surface' : 'bg-base'}`}
            >
              <span className="font-display font-semibold text-sm w-full sm:w-40 shrink-0">{row.category}</span>
              <span className="text-sm text-muted">{row.items}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display font-semibold text-xl mb-4">Architecture des données</h2>
        <p className="text-sm text-muted mb-3">
          Le prix affiché sur le graphique et utilisé pour les alertes (prix minimum, quantité d'offres) est
          calculé de la même façon pour tous les ~25 000 skins du catalogue, suivis ou non — une seule requête
          quotidienne à l'API suffit à couvrir l'ensemble.
        </p>
        <p className="text-sm text-muted mb-3">
          Ce même historique alimente les mini-courbes de l'accueil, récupérées en une seule requête pour les items
          classés. Un jour à moins de 5 offres coupe la courbe au lieu d'y placer un point trompeur, et l'axe suit
          les vraies dates, si bien qu'un trou de collecte reste visible au lieu d'être gommé.
        </p>
        <p className="text-sm text-muted">
          Une donnée plus détaillée (moyenne des ventes réelles, volume de ventes) reste calculée séparément pour
          les skins ayant une alerte, à cause d'une limite de l'API (impossible de la demander pour 25 000 items
          à la fois). Elle n'est pas exploitée dans l'interface actuellement — un choix d'architecture posé pour
          une évolution future plutôt qu'un besoin immédiat.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-display font-semibold text-xl mb-4">Défis techniques</h2>
        <div className="grid gap-3">
          {CHALLENGES.map((c) => (
            <div key={c.title} className="rarity-card">
              <span className="font-display font-semibold block mb-2">{c.title}</span>
              <p className="text-sm text-muted mb-2">
                <span className="text-covert-text font-semibold">Problème — </span>
                {c.problem}
              </p>
              <p className="text-sm text-muted">
                <span className="text-gold font-semibold">Solution — </span>
                {c.solution}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display font-semibold text-xl mb-4">Sécurité</h2>
        <ul className="grid gap-2">
          {SECURITY.map((item) => (
            <li key={item} className="text-sm text-muted flex gap-2">
              <span className="text-gold shrink-0">▸</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-display font-semibold text-xl mb-4">Containerisation (développement)</h2>
        <p className="text-sm text-muted mb-3">
          En local, l'application tourne sur 5 services Docker orchestrés par Docker Compose : base de données
          PostgreSQL, backend Express, worker de planification (cron) pour les ingestions automatiques, frontend
          buildé et servi par Nginx, et un outil d'administration de base réservé au développement.
        </p>
        <p className="text-sm text-muted mb-3">
          Le frontend est buildé en deux étapes (compilation Vite puis image Nginx finale légère), avec une
          configuration de fallback SPA pour que le routage côté client (React Router) fonctionne correctement
          même sur un rafraîchissement de page.
        </p>
        <p className="text-sm text-muted">
          Le schéma de base de données est entièrement scripté dans un fichier d'initialisation unique, exécuté
          automatiquement à la création du volume — aucune étape manuelle nécessaire pour démarrer l'environnement
          depuis zéro. Une base existante évolue par des migrations idempotentes, appliquées avant le déploiement
          du code qui en dépend.
        </p>
      </section>

      <section className="mb-4">
        <h2 className="font-display font-semibold text-xl mb-4">Mise en production</h2>
        <p className="text-sm text-muted mb-3">
          L'hébergement en continu de 5 services Docker a un coût mensuel réel sur la plupart des plateformes
          actuelles. Pour un projet de portfolio, l'architecture de production a été repensée pour rester
          entièrement gratuite, quitte à accepter un compromis assumé.
        </p>
        <div className="grid gap-3 mb-3">
          <div className="rarity-card">
            <span className="font-display font-semibold block mb-1">Base de données</span>
            <p className="text-sm text-muted">
              PostgreSQL hébergé chez Neon, dont le tier gratuit est permanent (contrairement à celui de la
              plupart des hébergeurs classiques, limité dans le temps).
            </p>
          </div>
          <div className="rarity-card">
            <span className="font-display font-semibold block mb-1">Backend et frontend</span>
            <p className="text-sm text-muted">
              Backend en Web Service gratuit sur Render (se met en veille après 15 minutes d'inactivité — premier
              chargement plus lent après une pause, compromis accepté pour une démo), frontend en site statique
              gratuit sur la même plateforme.
            </p>
          </div>
          <div className="rarity-card">
            <span className="font-display font-semibold block mb-1">Planification sans service payant</span>
            <p className="text-sm text-muted">
              Un service "toujours actif" dédié à la planification (comme en développement) implique un coût
              fixe. À la place, deux routes protégées par un secret déclenchent les ingestions à distance,
              appelées chaque jour par deux workflows GitHub Actions planifiés (le catalogue à 3h UTC, puis
              l'historique détaillé et les alertes à 4h UTC) — gratuit, sans service supplémentaire à faire tourner
              en continu. Une troisième route, pour les images et les raretés, se lance à la demande.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
