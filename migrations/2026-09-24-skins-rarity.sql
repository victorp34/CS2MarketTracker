-- Ajoute la rareté des items (affichée sur le liseré des cartes).
-- À exécuter sur une base existante AVANT de déployer le backend qui lit ces colonnes,
-- puis lancer l'ingestion des images (qui renseigne aussi la rareté).
-- Idempotent : peut être rejoué sans effet.
ALTER TABLE skins ADD COLUMN IF NOT EXISTS rarity TEXT;
ALTER TABLE skins ADD COLUMN IF NOT EXISTS rarity_name TEXT;
