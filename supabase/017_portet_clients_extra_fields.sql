-- Champs supplémentaires pour les inscriptions BOXPLUS
ALTER TABLE portet_clients ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE portet_clients ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE portet_clients ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE portet_clients ADD COLUMN IF NOT EXISTS ville TEXT;
ALTER TABLE portet_clients ADD COLUMN IF NOT EXISTS contact_urgence TEXT;
ALTER TABLE portet_clients ADD COLUMN IF NOT EXISTS info_medicale TEXT;
ALTER TABLE portet_clients ADD COLUMN IF NOT EXISTS offre TEXT;
