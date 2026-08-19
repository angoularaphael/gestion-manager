-- Un destinataire ne peut pas être contacté par 2 bots (claim pending + sent).
-- Les échecs (failed) restent ré-essayables.
-- Déduplique d’abord les lignes déjà en double (ex. offre_ete_2026 / 33782609998).

UPDATE outbound_messages
SET
  status = 'failed',
  error = 'Doublon historique — une seule com active par destinataire'
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY campaign, channel, recipient
        ORDER BY
          CASE status WHEN 'sent' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
          COALESCE(sent_at, created_at) DESC NULLS LAST,
          id DESC
      ) AS rn
    FROM outbound_messages
    WHERE status IN ('sent', 'pending')
  ) ranked
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS outbound_messages_campaign_channel_recipient_active_uniq
  ON outbound_messages (campaign, channel, recipient)
  WHERE status IN ('sent', 'pending');
