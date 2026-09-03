const STACK = [
  { category: 'Frontend', items: 'React 18 (Vite), Tailwind CSS, Recharts, React Router' },
  { category: 'Backend', items: 'Node.js / Express' },
  { category: 'Base de données', items: 'PostgreSQL 16' },
  { category: 'Auth', items: 'JWT, bcrypt' },
  { category: 'Récupération des prix', items: 'node-cron : interroge l\'API Skinport chaque jour, nettoie et enregistre les prix en base' },
  { category: 'Notifications', items: 'Webhook Discord, SMTP' },
  { category: 'Tests', items: 'node:test + supertest' },
  { category: 'Infra', items: 'Docker / Docker Compose (5 services), Nginx' }
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
    title: 'Une métrique de prix trompeuse',
    problem:
      "Le prix minimum d'un item peut être faussé par une seule annonce isolée très en dessous du marché, un skin passant de 100€ à 2€ puis revenant à 100€ ne représente aucune vraie tendance.",
    solution:
      'Les calculs de variation utilisent le prix médian plutôt que le minimum, avec un seuil de liquidité minimal (10 offres) exigé aux deux instantanés comparés pour écarter les marchés trop peu profonds.'
  },
  {
    title: 'Recherche floue sur des noms structurés',
    problem:
      "Une recherche par sous-chaîne exacte échoue sur des requêtes multi-mots dès que le nom réel contient une ponctuation entre les mots (ex. \"AK-47 | Redline\"), chercher \"AK-47 Redline\" ne matchait rien.",
    solution:
      "Chaque mot de la recherche est vérifié indépendamment (tous doivent apparaître, peu importe l'ordre ou les séparateurs), puis les résultats sont classés par similarité via l'extension pg_trgm de Postgres."
  },
  {
    title: "Sourcing des images",
    problem: "L'API de Skinport ne fournit pas d'image.",
    solution:
      "Intégration d'un dataset communautaire externe, avec deux stratégies de correspondance : exacte quand l'identifiant produit est directement fourni, ou avec normalisation du nom sinon."
  }
];

const SECURITY = [
  'CORS restreint à l\'URL du frontend (pas de wildcard) : seul le vrai site peut appeler l\'API',
  'helmet : ajoute automatiquement des protections standards sur les réponses du serveur',
  'express-rate-limit : bloque une adresse qui ferait trop de tentatives de connexion trop vite (anti brute-force)',
  'Validation des entrées (format email, bornes numériques, longueur des mots de passe)',
  'Mots de passe hashés avec bcrypt',
  'Requêtes SQL systématiquement paramétrées',
  'Conteneurs applicatifs exécutés en utilisateur non-root',
  'Outil d\'administration de la base isolé derrière un profil Docker dédié au développement, jamais actif en production'
];

export default function About() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display font-bold text-3xl mb-2">À propos de ce projet</h1>
      <p className="text-muted mb-10">
        C'est un tracker de prix et un système d'alertes pour l'ensemble du catalogue de skins CS2, construit comme
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
          Tous les skins n'ont pas le même niveau de détail enregistré. Pour les ~25 000 skins du catalogue, on
          garde juste l'essentiel chaque jour. Pour les quelques skins
          qu'un utilisateur surveille via une alerte, on garde un historique bien plus complet.
        </p>
        <p className="text-sm text-muted">
          Cette différence vient d'une contrainte de l'API Skinport : le nombre de requêtes détaillées possibles
          est limité, impossible d'avoir le dossier complet pour 25 000 items à la fois.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-display font-semibold text-xl mb-4">Défis techniques</h2>
        <div className="grid gap-3">
          {CHALLENGES.map((c) => (
            <div key={c.title} className="rarity-card">
              <span className="font-display font-semibold block mb-2">{c.title}</span>
              <p className="text-sm text-muted mb-2">
                <span className="text-covert font-semibold">Problème — </span>
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

      <section className="mb-4">
        <h2 className="font-display font-semibold text-xl mb-4">Containerisation & déploiement</h2>
        <p className="text-sm text-muted mb-3">
          L'application tourne sur 5 services Docker orchestrés par Docker Compose : base de données PostgreSQL,
          backend Express, worker de planification (cron) pour les ingestions automatiques, frontend buildé et
          servi par Nginx, et un outil d'administration de base réservé au développement.
        </p>
        <p className="text-sm text-muted mb-3">
          Le frontend est buildé en deux étapes (compilation Vite puis image Nginx finale légère), avec une
          configuration de fallback SPA pour que le routage côté client (React Router) fonctionne correctement
          même sur un rafraîchissement de page.
        </p>
        <p className="text-sm text-muted">
          Le schéma de base de données est entièrement scripté dans un fichier d'initialisation unique, exécuté
          automatiquement à la création du volume, aucune étape manuelle n'est nécessaire pour démarrer l'environnement
          depuis zéro.
        </p>
      </section>
    </div>
  );
}
