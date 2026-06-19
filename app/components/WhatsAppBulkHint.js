'use client';

export default function WhatsAppBulkHint({ visible }) {
  if (!visible) return null;
  return (
    <p className="send-wa-hint muted">
      WhatsApp en masse : ~1 min entre chaque numéro, max 12/h, 13 textes différents tirés au
      hasard. Pour une large diffusion, privilégiez l&apos;email par vagues.
    </p>
  );
}
