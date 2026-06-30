-- Orchestrateur campagne horaire (cron Vercel)
CREATE TABLE IF NOT EXISTS campaign_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  active BOOLEAN NOT NULL DEFAULT FALSE,
  paused_at TIMESTAMPTZ,
  warmup_phase TEXT NOT NULL DEFAULT 'test'
    CHECK (warmup_phase IN ('test', 'ramp', 'full')),
  emails_sent_this_hour INTEGER NOT NULL DEFAULT 0,
  hour_window_start TIMESTAMPTZ,
  last_cron_run_at TIMESTAMPTZ,
  last_cron_result JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO campaign_settings (id, active, warmup_phase)
VALUES ('default', FALSE, 'test')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS outbound_messages_campaign_email_recipient_idx
  ON outbound_messages (campaign, recipient)
  WHERE channel = 'email' AND status IN ('sent', 'pending');
