-- Documents: Devis & Factures
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('devis', 'facture')),
  numero TEXT NOT NULL,
  societe TEXT NOT NULL CHECK (societe IN ('asso_tmbc', 'boxing_center', 'distrix')),
  client_nom TEXT NOT NULL,
  client_email TEXT,
  client_adresse TEXT,
  client_telephone TEXT,
  prestation TEXT NOT NULL,
  montant NUMERIC NOT NULL,
  date_document DATE NOT NULL,
  reference TEXT,
  conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS documents_numero_idx ON documents (numero);

CREATE INDEX IF NOT EXISTS documents_type_created_idx
  ON documents (type, created_at DESC);

CREATE INDEX IF NOT EXISTS documents_societe_idx ON documents (societe);
