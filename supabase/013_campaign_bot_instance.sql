-- Colonne bot_instance pour savoir quel serveur a envoyé (campagne 3 bots)
ALTER TABLE outbound_messages
  ADD COLUMN IF NOT EXISTS bot_instance TEXT;

CREATE INDEX IF NOT EXISTS outbound_messages_campaign_recipient_idx
  ON outbound_messages (campaign, recipient)
  WHERE channel = 'whatsapp' AND status = 'sent';
