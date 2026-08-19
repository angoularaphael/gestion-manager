'use client';

import Link from 'next/link';

export default function CampaignBulkHint({ visible, emailCount = 0, phoneCount = 0, campaignMode = false }) {
  if (!visible) return null;
  return (
    <div className="send-wa-hint campaign-bulk-hint">
      <p>
        <strong>Grande campagne — pour que tout le monde reçoive le message :</strong>
      </p>
      <ul>
        <li>
          <strong>Email</strong> : par vagues (cron auto sur{' '}
          <Link href="/admin/campagne-planning">Planning campagne</Link>) — Resend Pro.
        </li>
        <li>
          <strong>WhatsApp</strong> : 12 numéros / 30 min / bot (6 bots) — voir{' '}
          <Link href="/admin/campagne-whatsapp">Campagne WA</Link>. Com Balma et Offres promo sont
          deux campagnes séparées.
        </li>
      </ul>
      {campaignMode ? (
        <p className="muted">
          L&apos;envoi email se fait par lots automatiques pour éviter les timeouts Vercel.
        </p>
      ) : null}
    </div>
  );
}
