-- Extension pour la recherche floue (tolérante aux fautes/à l'ordre des mots)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Catalogue complet des items Skinport (table d'identité partagée par tout le reste)
CREATE TABLE skins (
    id SERIAL PRIMARY KEY,
    market_hash_name TEXT UNIQUE NOT NULL,
    item_page TEXT,
    market_page TEXT,
    image_url TEXT,
    added_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_skins_name_trgm ON skins USING GIN (market_hash_name gin_trgm_ops);

-- Snapshot quotidien léger, pour TOUT le catalogue (alimenté par /v1/items).
-- median_price sert de référence pour les calculs de variation (plus robuste
-- que min_price, qui peut être faussé par une annonce isolée hors marché).
CREATE TABLE price_daily (
    id SERIAL PRIMARY KEY,
    skin_id INT NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    min_price NUMERIC,
    median_price NUMERIC,
    quantity INT,
    UNIQUE (skin_id, recorded_date)
);

CREATE INDEX idx_price_daily_skin_date ON price_daily (skin_id, recorded_date);
CREATE INDEX idx_price_daily_date ON price_daily (recorded_date);

-- Historique détaillé (min/moy/médiane/volume des VENTES), uniquement pour
-- les skins ayant au moins une alerte -- alimenté par /v1/sales/history.
-- Sert exclusivement à la logique de déclenchement des alertes.
CREATE TABLE price_history (
    id SERIAL PRIMARY KEY,
    skin_id INT NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    min_24h NUMERIC,
    avg_24h NUMERIC,
    median_24h NUMERIC,
    volume_24h INT,
    UNIQUE (skin_id, recorded_date)
);

CREATE INDEX idx_price_history_skin_date ON price_history (skin_id, recorded_date);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- is_active : contrôlé par l'utilisateur (switch actif/pause)
-- triggered : le seuil a été franchi au moins une fois depuis la dernière réactivation
-- triggered_unseen : une notification est en attente d'affichage (toast), remis à
--                     false dès que le frontend l'a montrée une fois
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skin_id INT NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
    target_price NUMERIC NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    triggered BOOLEAN NOT NULL DEFAULT false,
    triggered_unseen BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_active ON alerts (is_active) WHERE is_active = true;
