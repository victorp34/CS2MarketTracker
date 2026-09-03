# CS2 Market Tracker

Suivi de prix, recherche et alertes pour l'ensemble du catalogue de skins CS2, basé sur les données publiques de [Skinport](https://skinport.com).

## Fonctionnalités

- **Recherche** dans tout le catalogue Skinport (~25 000 items : skins, couteaux, gants, stickers, patches, agents, music kits, graffitis, breloques), avec correspondance floue tolérante aux fautes/à l'ordre des mots
- **Images** des items via le dataset communautaire [ByMykel/CSGO-API](https://github.com/ByMykel/CSGO-API)
- **Historique de prix** (90 jours glissants) sur n'importe quel item du catalogue, même jamais suivi, avec courbe de prix minimum et de quantité d'offres disponibles
- **Top variations** en page d'accueil : les 5 plus fortes hausses et les 5 plus fortes baisses de prix médian, en écartant les marchés trop peu liquides (< 10 offres)
- **Skins suivis** paginés (5 par page) en page d'accueil pour les utilisateurs connectés
- **Alertes de prix personnalisées** : création, switch actif/pause, modification du seuil, recherche/filtre dans sa propre liste d'alertes, badge de statut (Active/Déclenchée/En pause)
- **Notifications** Discord + email, déclenchées une seule fois par franchissement de seuil, avec toast in-app marqué comme vu côté serveur (ne réapparaît pas après un refresh)
- **Comptes utilisateurs** (JWT) — navigation et consultation libres, alertes réservées aux comptes connectés
- **Ingestion automatique quotidienne** via cron, à trois niveaux de granularité (voir architecture des données)

## Stack technique

| Composant | Techno |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + Recharts, servi en production par Nginx |
| Backend API | Node.js / Express, `helmet` + `express-rate-limit` |
| Base de données | PostgreSQL (`pg_trgm` pour la recherche floue) |
| Ingestion des prix | Scripts Node + `node-cron`, API Skinport |
| Auth | JWT + bcrypt |
| Notifications | Webhook Discord + SMTP (nodemailer) |
| Tests | `node --test` + `supertest` |
| Conteneurisation | Docker / Docker Compose (5 services) |

## Architecture des données

Le projet distingue volontairement trois niveaux de granularité, pour ne jamais surcharger le rate limit Skinport (8 requêtes/5min) :

| Table | Portée | Alimentée par | Fréquence |
|---|---|---|---|
| `skins` | Tout le catalogue (~25k items), table d'identité partagée | `/v1/items` | 1x/jour |
| `price_daily` | Tout le catalogue — prix min, prix médian, quantité | `/v1/items` | 1x/jour |
| `price_history` | Uniquement les skins avec ≥1 alerte — min/moy/médiane/volume, sert au déclenchement des alertes | `/v1/sales/history` | 1x/jour |

Le prix **médian** (`price_daily.median_price`) sert de référence pour les calculs de variation (top hausses/baisses) plutôt que le prix minimum, qui peut être faussé par une seule annonce isolée hors marché.

R�tention : les données de `price_daily` et `price_history` de plus de **90 jours** sont purgées automatiquement à chaque ingestion du catalogue.

## Architecture des services

```
comparateur-prix-cs2/
├── docker-compose.yml        # Orchestration des 5 services
├── Dockerfile                 # Image backend/scheduler (Node, utilisateur non-root)
├── init.sql                   # Schéma complet de la base (tout consolidé)
├── .env                       # Variables d'environnement (à créer, voir .env.example)
├── .gitignore
├── app.js                     # Configuration Express (routes, middlewares) — testable
├── server.js                  # Démarre le serveur réseau à partir de app.js
├── db.js                      # Pool de connexion PostgreSQL
├── bulkInsert.js               # Helper d'insertion en masse par lots
├── seed.js                    # Insère quelques skins de test
├── ingest.js                  # Historique détaillé (skins avec alertes) + vérif. alertes
├── ingest-catalog.js          # Catalogue complet quotidien (prix + quantité) + purge 90j
├── ingest-images.js           # Association des images (dataset CSGO-API)
├── scheduler.js                # Déclenche les ingestions automatiquement (cron)
├── middleware/
│   ├── authMiddleware.js       # Vérification du token JWT
│   └── rateLimiter.js          # Limiteurs de requêtes (auth strict, API générale)
├── notifications/
│   ├── alertChecker.js         # Compare les prix aux seuils, déclenche les notifs
│   ├── discord.js               # Envoi via webhook Discord
│   └── email.js                 # Envoi via SMTP
├── routes/
│   ├── auth.js                  # Inscription / connexion
│   ├── skins.js                  # Recherche, détail, historique, top-movers (public)
│   └── alerts.js                 # Gestion des alertes + skins suivis (protégé)
├── tests/
│   ├── auth.test.js
│   └── alerts.test.js
└── frontend/                   # Application React
    ├── Dockerfile                # Build Vite + service Nginx
    ├── nginx.conf                 # Fallback SPA pour React Router
    └── src/
        ├── pages/
        ├── components/
        └── api.js
```

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- (Optionnel) Un webhook Discord et/ou des identifiants SMTP pour les notifications

## Installation

### 1. Configurer les variables d'environnement

Copie `.env.example` en `.env` à la racine du projet et ajuste au besoin. En dev, les valeurs par défaut fonctionnent telles quelles (sauf si tu veux activer les notifications).

### 2. Démarrer les services

En **développement** (inclut Adminer, l'interface d'administration de la base) :

```bash
docker compose --profile dev up -d --build
```

En **production** (n'inclut PAS Adminer — il ne doit jamais être exposé publiquement) :

```bash
docker compose up -d --build
```

Vérifie que les conteneurs tournent :

```bash
docker compose ps
```

`init.sql` s'exécute automatiquement à la création du volume Postgres — aucune migration manuelle n'est nécessaire pour une installation neuve.

### 3. Premier peuplement des données

Ces scripts tournent normalement automatiquement via le scheduler (3h et 4h du matin), mais pour ne pas attendre lors d'une première installation :

```bash
docker compose exec backend node ingest-catalog.js
docker compose exec backend node ingest-images.js
```

### 4. Accéder à l'application

Ouvre [http://localhost:5173](http://localhost:5173).

## Résumé des ports

| Service | Port | Rôle |
|---|---|---|
| Frontend (Nginx) | 5173 | Application React |
| Backend API (Express) | 3000 | API REST |
| PostgreSQL | 5433 | Base de données (accès externe, ex. Adminer/DBeaver) |
| Adminer (profil `dev` uniquement) | 8080 | Interface web pour explorer la base |

## Sécurité

- **CORS** restreint à l'URL définie dans `FRONTEND_URL` (pas de wildcard)
- **`helmet`** pour les en-têtes de sécurité HTTP standards
- **Rate limiting** : 10 tentatives/15min sur `/api/auth/*`, 120 requêtes/min sur le reste de l'API
- **Adminer** derrière un profil Docker Compose `dev` — ne démarre jamais avec un `docker compose up` classique (donc jamais accidentellement en prod)
- **Conteneurs backend/scheduler** exécutés en utilisateur non-root
- **Validation des entrées** : format email, bornes sur `target_price` (0 < prix ≤ 1 000 000), longueur du mot de passe (8-72 caractères)
- Toutes les requêtes SQL sont paramétrées (aucune concaténation de valeurs utilisateur)

## Tests

```bash
npm install
docker compose up -d postgres   # la base doit être accessible
npm test
```

## Commandes utiles

```bash
# Relancer manuellement une ingestion
docker compose exec backend node ingest-catalog.js   # catalogue complet (léger)
docker compose exec backend node ingest.js             # historique détaillé + alertes
docker compose exec backend node ingest-images.js      # ré-association des images

# Logs d'un service
docker compose logs backend --tail 50
docker compose logs scheduler --tail 50

# Rebuild après modification du code
docker compose --profile dev up -d --build   # en dev (avec Adminer)
docker compose up -d --build                  # en prod (sans Adminer)

# Rebuild un seul service
docker compose up -d --build backend
docker compose up -d --build frontend

# Tout arrêter
docker compose down

# Tout arrêter ET supprimer les données (reset complet)
docker compose down -v
```

## Dépannage

**Le port 5433 (ou un autre) est déjà utilisé**
Un autre PostgreSQL tourne peut-être déjà sur ta machine. Change le port exposé dans `docker-compose.yml` (`"5434:5432"` par exemple) et adapte `DATABASE_URL` dans `.env` en conséquence, puis `docker compose down -v && docker compose --profile dev up -d --build`.

**Erreur d'authentification PostgreSQL**
Si `.env` a été modifié après le premier démarrage, le volume garde les anciens identifiants. Réinitialise avec `docker compose down -v` (⚠️ supprime les données) puis relance.

**Le frontend affiche "Erreur serveur" ou une erreur CORS partout**
Vérifie que `FRONTEND_URL` dans `.env` correspond exactement à l'URL utilisée dans le navigateur (`http://localhost:5173`, pas `127.0.0.1:5173`). Vérifie aussi les logs du backend (`docker compose logs backend`).

**Après modification du code frontend, rien ne change**
Le frontend est buildé en fichiers statiques par Nginx, pas de hot-reload comme avec `npm run dev`. Il faut rebuilder : `docker compose up -d --build frontend`.

**Adminer inaccessible**
Normal si tu as lancé `docker compose up` sans `--profile dev`. Relance avec `docker compose --profile dev up -d`.

## Notes sur les rate limits de l'API Skinport

- `/v1/items` (catalogue complet) : un seul appel renvoie tous les items, quel que soit leur nombre — aucun souci de rate limit
- `/v1/sales/history` (historique détaillé) : batché par virgule dans l'URL, réservé aux skins ayant au moins une alerte — ne jamais l'utiliser sur l'ensemble du catalogue (dépasserait largement les 8 requêtes/5min)
