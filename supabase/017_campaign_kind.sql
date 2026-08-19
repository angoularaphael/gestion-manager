-- Campagne auto (cron) : une seule à la fois (balma | offres).
ALTER TABLE campaign_settings
  ADD COLUMN IF NOT EXISTS campaign TEXT NOT NULL DEFAULT 'balma';
