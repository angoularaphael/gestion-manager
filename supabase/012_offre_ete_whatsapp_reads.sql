-- Suivi ouvertures WhatsApp campagne Offre Été (accusés de lecture Baileys)
-- Appliquer via Supabase SQL Editor

ALTER TABLE outbound_messages
  ADD COLUMN IF NOT EXISTS wa_message_id TEXT,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS campaign TEXT;

CREATE INDEX IF NOT EXISTS outbound_messages_wa_message_id_idx
  ON outbound_messages (wa_message_id)
  WHERE wa_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS outbound_messages_campaign_whatsapp_idx
  ON outbound_messages (campaign, sent_at DESC)
  WHERE channel = 'whatsapp' AND campaign IS NOT NULL;
