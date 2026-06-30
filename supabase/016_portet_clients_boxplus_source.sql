-- Autoriser les inscriptions BOXPLUS comme source client
ALTER TABLE portet_clients DROP CONSTRAINT IF EXISTS portet_clients_source_check;
ALTER TABLE portet_clients ADD CONSTRAINT portet_clients_source_check
  CHECK (source IN ('chatbot', 'csv', 'xls', 'manual', 'boxplus'));
