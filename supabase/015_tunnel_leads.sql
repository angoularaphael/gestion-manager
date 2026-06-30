-- Leads tunnels marketing (offre 29€, 259€, séance d'essai, parrainage pote)
CREATE TABLE IF NOT EXISTS tunnel_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tunnel TEXT NOT NULL
    CHECK (tunnel IN ('offre_29', 'offre_259', 'seance_essai', 'referral_pote')),
  prenom TEXT,
  nom TEXT,
  telephone TEXT,
  email TEXT,
  salle TEXT,
  referrer_prenom TEXT,
  referrer_nom TEXT,
  referrer_phone TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tunnel_leads_tunnel_created_idx
  ON tunnel_leads (tunnel, created_at DESC);

CREATE INDEX IF NOT EXISTS tunnel_leads_telephone_idx
  ON tunnel_leads (telephone)
  WHERE telephone IS NOT NULL AND telephone <> '';
