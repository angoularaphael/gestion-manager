'use client';

export default function CampaignBulkHint({ visible, emailCount = 0, phoneCount = 0, campaignMode = false }) {
  if (!visible) return null;
  return (
    <div className="send-wa-hint campaign-bulk-hint">
      <p>
        <strong>Grande campagne — pour que tout le monde reçoive le message :</strong>
      </p>
      <ul>
        <li>
          <strong>Email</strong> : canal fiable pour toucher{' '}
          {emailCount > 0 ? `${emailCount} contact(s) avec email` : 'toute la liste'} (recommandé en
          premier).
        </li>
        <li>
          <strong>WhatsApp</strong> : limité (~12 numéros/heure sur le bot) — impossible d&apos;envoyer
          à {phoneCount || 'toute la liste'} d&apos;un coup sans blocage. À réserver aux relances ou
          aux petits groupes.
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
