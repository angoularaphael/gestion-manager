'use client';

export default function WhatsAppBulkHint({ visible }) {
  if (!visible) return null;
  return (
    <p className="send-wa-hint muted">
      WhatsApp en masse : 3 bots en parallèle, ~13 messages/heure/bot, 13 textes différents.
      Un numéro ne reçoit jamais 2 fois la campagne. Configurez les bots sur{' '}
      <a href="/admin/campagne-whatsapp">Campagne WA 3 bots</a>.
    </p>
  );
}
