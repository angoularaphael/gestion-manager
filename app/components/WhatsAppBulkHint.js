'use client';

export default function WhatsAppBulkHint({ visible }) {
  if (!visible) return null;
  return (
    <p className="send-wa-hint muted">
      WhatsApp en masse : envoi espacé (~1 min entre chaque numéro, max ~12/h) pour éviter le
      blocage 24 h. Pour une large diffusion, privilégiez l&apos;email.
    </p>
  );
}
