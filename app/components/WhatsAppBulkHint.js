'use client';

export default function WhatsAppBulkHint({ visible }) {
  if (!visible) return null;
  return (
    <p className="send-wa-hint muted">
      WhatsApp en masse : 3 bots en parallèle, 12 messages / 30 min / bot (~2m30 entre envois), 13 textes
      différents. Un numéro ne reçoit jamais 2 fois la campagne. Configurez les bots sur{' '}
      <a href="/admin/campagne-whatsapp">Campagne WA 3 bots</a> ·{' '}
      <a href="/admin/campagne-wa-envoyes">voir déjà envoyés</a>.
    </p>
  );
}
