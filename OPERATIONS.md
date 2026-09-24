## Liens

| Service | Lien |
|---|---|
| Site en ligne (frontend) | https://cs2markettracker-1.onrender.com |
| API backend | https://cs2markettracker.onrender.com |
| Dashboard Render | https://dashboard.render.com |
| Console Neon (base de données) | https://console.neon.tech |
| Repo GitHub | `https://github.com/victorp34/CS2MarketTracker` |
| Onglet Actions du repo | `https://github.com/victorp34/CS2MarketTracker/actions` |
| Secrets du repo (Settings → Secrets and variables → Actions) | `https://github.com/victorp34/CS2MarketTracker/settings/secrets/actions` |
| Webhooks Discord (à faire depuis le salon Discord concerné) | Paramètres du salon → Intégrations → Webhooks |
| Mots de passe d'application Gmail | https://myaccount.google.com/apppasswords |

## Développement local (Docker)

```powershell
# Tout démarrer (avec Adminer)
docker compose --profile dev up -d --build

# Tout démarrer (sans Adminer, comme en prod)
docker compose up -d --build

# Voir l'état des conteneurs
docker compose ps

# Logs d'un service
docker compose logs backend --tail 50
docker compose logs scheduler --tail 50

# Rebuild un seul service après modif
docker compose up -d --build backend
docker compose up -d --build frontend

# Tout arrêter
docker compose down

# Tout arrêter ET supprimer les données (reset complet, irréversible)
docker compose down -v
```

## Ingestion manuelle en local (Docker)

```powershell
docker compose exec backend node ingest-catalog.js   # catalogue complet
docker compose exec backend node ingest.js             # historique détaillé + alertes
docker compose exec backend node ingest-images.js      # association des images
```

## Migrations de schéma (base existante)

`init.sql` ne s'exécute que sur une base neuve. Pour une base existante (Docker local déjà initialisé, Neon en production), appliquer les fichiers de `migrations/` dans l'ordre. Ils sont idempotents.

⚠️ Appliquer la migration **avant** de déployer le backend qui lit les nouvelles colonnes, sinon les routes concernées renvoient une erreur 500.

```powershell
# Local (Docker)
Get-Content migrations/2026-09-24-skins-rarity.sql | docker exec -i cs2-market-db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Production (Neon) : coller le contenu du fichier dans le SQL Editor de console.neon.tech
```

`2026-09-24-skins-rarity.sql` ajoute `skins.rarity` et `skins.rarity_name`. Après l'avoir appliquée, lancer l'ingestion des images (`run-images`) pour les renseigner. Tant qu'elle n'a pas tourné, les cartes affichent le liseré gris « non classé ».

## Ingestion manuelle en PRODUCTION

Nécessite `ADMIN_SECRET` (valeur définie dans les variables d'environnement du backend sur Render).

```powershell
$secret = "<ton-admin-secret>"
$backend = "https://cs2markettracker.onrender.com"

curl.exe -X POST -H "x-admin-secret: $secret" "$backend/api/admin/run-catalog"
curl.exe -X POST -H "x-admin-secret: $secret" "$backend/api/admin/run-detailed"
curl.exe -X POST -H "x-admin-secret: $secret" "$backend/api/admin/run-images"
```

⚠️ Toujours lancer `run-catalog` avant `run-detailed` (les alertes comparent au prix du catalogue, qui doit exister pour aujourd'hui).

## Déclenchement manuel du workflow GitHub Actions

Pas besoin de curl — depuis l'onglet **Actions** du repo :
1. Sélectionne le workflow **"Ingestion quotidienne des prix"**
2. Bouton **Run workflow** → confirmer

Planification automatique : tous les jours à 3h et 4h **UTC** (`.github/workflows/scheduled-ingestion.yml`).

## Tests

```powershell
npm install
docker compose up -d postgres   # la base doit être accessible
npm test
```

## Base de données

```powershell
# Se connecter à la base locale via Adminer
# http://localhost:8080 — serveur: postgres, user/pass/db: voir .env

# Se connecter à Neon (prod) : utiliser le SQL Editor sur console.neon.tech,
# ou psql si installé en local :
psql "<connection-string-neon>" -f init.sql   # uniquement sur une base neuve
```

## Git

```powershell
git status                      # vérifier AVANT de commit que .env n'apparaît pas
git add .
git commit -m "Message clair"
git push
```

Un push sur `main` redéploie automatiquement le backend ET le frontend sur Render (aucune action manuelle nécessaire côté Render).

## Variables d'environnement à connaître

Voir `.env.example` pour la liste complète et les commentaires. Les plus critiques à ne jamais perdre :

| Variable | Où la retrouver si perdue |
|---|---|
| `JWT_SECRET` | Générer une nouvelle valeur casse les sessions actives de tous les utilisateurs (à éviter en prod sauf nécessité) |
| `ADMIN_SECRET` | Doit être identique sur Render (backend) ET dans les secrets GitHub Actions |
| `SMTP_PASS` | Mot de passe d'application Gmail — irrécupérable une fois perdu, il faut en régénérer un |
| `DATABASE_URL` (prod) | Console Neon → Connection string (variante "Pooled") |

## Dépannage rapide

| Symptôme | Cause probable | Où regarder |
|---|---|---|
| Erreur CORS dans le navigateur | `FRONTEND_URL` (backend) ne correspond pas exactement à l'URL du frontend | Variables d'environnement backend sur Render |
| Notification manquante | Variable Discord/SMTP absente ou mal formée sur Render | Logs backend Render, chercher "non configuré" ou "Erreur lors de l'envoi" |
| Refresh d'une page → 404 ou redirige vers /index.html visible dans l'URL | Règle de réécriture frontend mal configurée | Render → frontend → Redirects/Rewrites → doit être en mode "Rewrite", pas "Redirect" |
| Site à jour mais anciennes données | Le workflow GitHub Actions n'a pas tourné | Onglet Actions du repo → vérifier le dernier run et ses logs |
| Alerte ne se déclenche jamais malgré un prix qui a l'air bon | Le prix comparé est `price_daily.min_price`, pas le prix affiché sur Skinport à l'instant T (mise à jour quotidienne, pas temps réel) | Vérifier la date de la dernière ingestion catalogue |

## Rappels d'architecture (pour se remettre dans le bain après une pause)

- `skins` : identité de tous les items du catalogue (~25k)
- `price_daily` : prix min/médian + quantité, pour TOUS les items, 1x/jour → sert les graphiques ET les alertes
- `price_history` : moyenne/médiane/volume des ventes réelles, seulement pour les skins avec alerte → actuellement non exploitée dans l'interface, conservée pour une évolution future
- Rétention : 90 jours sur `price_daily` et `price_history`, purge automatique à chaque ingestion catalogue
