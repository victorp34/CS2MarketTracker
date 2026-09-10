# CS2 Market Tracker

> Suivi de prix, recherche et alertes personnalisées sur l'ensemble du catalogue de skins CS2 — basé sur les données publiques de [Skinport](https://skinport.com).

**🔗 [Voir le site en ligne](https://cs2markettracker-1.onrender.com)**
Pour le détail de l'architecture, des choix techniques et des défis rencontrés pendant le développement, voir la page [**À propos**](https://cs2markettracker-1.onrender.com/about) du site.

---

## Fonctionnalités

- **Recherche** dans tout le catalogue Skinport (~25 000 items : skins, couteaux, gants, stickers, patches, agents, music kits, graffitis, breloques), avec correspondance floue tolérante aux fautes/à l'ordre des mots
- **Images** des items via le dataset communautaire [ByMykel/CSGO-API](https://github.com/ByMykel/CSGO-API)
- **Historique de prix** (90 jours glissants) sur n'importe quel item du catalogue, même jamais suivi, avec courbes cliquables (prix min, prix médian, quantité d'offres)
- **Top variations** en page d'accueil : les 5 plus fortes hausses et les 5 plus fortes baisses de prix, en écartant les marchés trop peu liquides et les objets à prix négligeable
- **Skins suivis** paginés en page d'accueil pour les utilisateurs connectés
- **Alertes de prix personnalisées** sur le prix minimum actuellement affiché, avec activation/désactivation, modification, recherche/filtre, badge de statut
- **Notifications** Discord + email, avec lien direct vers l'offre concernée
- **Comptes utilisateurs** (JWT) — navigation libre, alertes réservées aux comptes connectés
- **Ingestion automatique quotidienne**, résiliente aux erreurs transitoires de l'API (nouvelles tentatives automatiques)

## Stack technique

| Composant | Techno |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + Recharts, servi en production par Nginx (dev) / Render Static Site (prod) |
| Backend API | Node.js / Express, `helmet` + `express-rate-limit` |
| Base de données | PostgreSQL (`pg_trgm` pour la recherche floue) — Neon en production |
| Ingestion des prix | Scripts Node, planifiés via `node-cron` (dev) ou GitHub Actions (prod) |
| Auth | JWT + bcrypt |
| Notifications | Webhook Discord + SMTP (nodemailer) |
| Tests | `node --test` + `supertest` |
| Conteneurisation (dev) | Docker / Docker Compose (5 services) |
| Hébergement (prod) | Render (backend + frontend), Neon (base de données), GitHub Actions (planification) |

## Architecture des données

| Table | Portée | Alimentée par | Fréquence |
|---|---|---|---|
| `skins` | Tout le catalogue (~25k items), table d'identité partagée | `/v1/items` | 1x/jour |
| `price_daily` | Tout le catalogue — prix min, prix médian, quantité. Sert les graphiques ET les alertes | `/v1/items` | 1x/jour |
| `price_history` | Uniquement les skins avec ≥1 alerte — min/moy/médiane/volume de ventes réelles. Conservée pour une évolution future, non exploitée dans l'interface actuellement | `/v1/sales/history` | 1x/jour |

Les alertes comparent leur seuil au **prix minimum actuel** (`price_daily.min_price`) — une seule annonce isolée en dessous du seuil déclenche bien la notification (comportement voulu : signaler une opportunité d'achat réelle).

R�tention : 90 jours glissants sur `price_daily` et `price_history`, purge automatique à chaque ingestion catalogue.

## Architecture des services

```
comparateur-prix-cs2/
├── docker-compose.yml          # Orchestration des 5 services (dev)
├── Dockerfile                   # Image backend/scheduler (Node, utilisateur non-root)
├── init.sql                     # Schéma complet de la base
├── .env                         # Variables d'environnement (à créer, voir .env.example)
├── .gitignore
├── app.js                       # Configuration Express (routes, middlewares) — testable
├── server.js                    # Démarre le serveur réseau à partir de app.js
├── db.js                        # Pool de connexion PostgreSQL (SSL conditionnel pour Neon)
├── bulkInsert.js                 # Helper d'insertion en masse par lots
├── fetchWithRetry.js             # Nouvelles tentatives automatiques sur erreur API transitoire
├── seed.js                      # Insère quelques skins de test
├── ingest.js                    # Historique détaillé (skins avec alertes) + vérif. alertes
├── ingest-catalog.js            # Catalogue complet quotidien (prix + quantité) + purge 90j
├── ingest-images.js             # Association des images (dataset CSGO-API)
├── scheduler.js                  # Planification automatique en dev (node-cron, dans Docker)
├── middleware/
│   ├── authMiddleware.js         # Vérification du token JWT
│   └── rateLimiter.js            # Limiteurs de requêtes (auth strict, API générale)
├── notifications/
│   ├── alertChecker.js           # Compare les prix aux seuils, déclenche les notifs
│   ├── discord.js                 # Envoi via webhook Discord
│   └── email.js                   # Envoi via SMTP
├── routes/
│   ├── auth.js                    # Inscription / connexion
│   ├── skins.js                    # Recherche, détail, historique, top-movers (public)
│   ├── alerts.js                   # Gestion des alertes + skins suivis (protégé)
│   └── admin.js                    # Déclenchement à distance des ingestions (prod, protégé par secret)
├── tests/
│   ├── auth.test.js
│   └── alerts.test.js
├── .github/workflows/
│   ├── ingest-catalog.yml          # Planification prod : catalogue complet (3h UTC)
│   └── ingest-detailed.yml         # Planification prod : historique détaillé + alertes (4h UTC)
└── frontend/                     # Application React
    ├── Dockerfile                  # Build Vite + service Nginx (dev)
    ├── nginx.conf                   # Fallback SPA pour React Router (dev)
    └── src/
        ├── pages/                   # dont About.jsx : page technique publique
        ├── components/
        └── api.js
```

## Prérequis (développement local)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- (Optionnel) Un webhook Discord et/ou des identifiants SMTP pour les notifications

## Installation en local

### 1. Variables d'environnement

Copie `.env.example` en `.env` à la racine et ajuste au besoin (les valeurs par défaut fonctionnent telles quelles pour un usage local).

### 2. Démarrer les services

```bash
docker compose --profile dev up -d --build
```

`init.sql` s'exécute automatiquement à la création du volume — aucune migration manuelle nécessaire.

### 3. Premier peuplement des données

```bash
docker compose exec backend node ingest-catalog.js
docker compose exec backend node ingest-images.js
```

### 4. Accéder à l'application

[http://localhost:5173](http://localhost:5173)

## Déploiement en production

Architecture pensée pour rester gratuite : base de données sur **Neon** (tier gratuit permanent), backend + frontend sur **Render** (Web Service + Static Site gratuits), et planification via **GitHub Actions** plutôt qu'un service "toujours actif" payant — deux routes protégées par secret (`/api/admin/run-catalog`, `/api/admin/run-detailed`) sont appelées chaque jour par deux workflows GitHub Actions séparés.

Compromis assumé : le backend en tier gratuit Render se met en veille après 15 minutes d'inactivité (le premier chargement après une pause prend 30-60 secondes).

## Résumé des ports (développement)

| Service | Port |
|---|---|
| Frontend (Nginx) | 5173 |
| Backend API (Express) | 3000 |
| PostgreSQL | 5433 |
| Adminer (profil `dev` uniquement) | 8080 |

## Sécurité

- CORS restreint à l'URL du frontend (pas de wildcard)
- `helmet` pour les en-têtes de sécurité HTTP standards
- Rate limiting : strict sur `/api/auth/*`, plus large sur le reste de l'API
- Routes d'administration (déclenchement d'ingestion) protégées par un secret comparé de façon résistante aux attaques par mesure de temps
- Adminer derrière un profil Docker Compose `dev` — jamais actif en production
- Conteneurs backend/scheduler exécutés en utilisateur non-root
- Validation des entrées, mots de passe hashés (bcrypt), requêtes SQL systématiquement paramétrées

## Tests

```bash
npm install
docker compose up -d postgres
npm test
```

## Dépannage

**Le port 5433 (ou un autre) est déjà utilisé**
Change le port exposé dans `docker-compose.yml` et adapte `DATABASE_URL` dans `.env`, puis `docker compose down -v && docker compose --profile dev up -d --build`.

**Erreur CORS**
Vérifie que `FRONTEND_URL` (variable d'environnement backend) correspond exactement à l'URL utilisée dans le navigateur.

**Après modification du code frontend, rien ne change (Docker)**
Le frontend est buildé en fichiers statiques par Nginx, pas de hot-reload. Il faut rebuilder : `docker compose up -d --build frontend`.

## Notes sur les rate limits de l'API Skinport

- `/v1/items` (catalogue complet) : un seul appel couvre tous les items, aucun souci de rate limit
- `/v1/sales/history` (historique détaillé) : réservé aux skins ayant une alerte, jamais utilisé sur l'ensemble du catalogue
- Les deux scripts réessaient automatiquement (délai croissant) en cas d'erreur transitoire (503/429/5xx)
