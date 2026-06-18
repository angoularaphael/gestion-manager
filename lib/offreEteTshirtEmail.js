import { deliverEmail } from './emailDelivery';
import { RECEPTION_EMAIL } from './site';

const SALLE_LABELS = {
  minimes: 'Les Minimes',
  ramonville: 'Ramonville',
  'saint-cyprien': 'Saint-Cyprien',
  portet: 'Portet-sur-Garonne',
  'etats-unis': 'États-Unis',
};

export async function sendOffreEteTshirtEmail({ prenom, nom, email, phone, salle }) {
  const name = [prenom, nom].filter(Boolean).join(' ') || 'Visiteur';
  const salleLabel = SALLE_LABELS[salle] || salle || '—';
  const subject = `[Offre Été T-shirt] ${email || 'sans email'} — ${name}`;

  const text = [
    'Nouvelle inscription Offre Été 2026 — 89€ + t-shirt offert',
    '',
    `EMAIL : ${email || '—'}`,
    `NOM COMPLET : ${name}`,
    '',
    `Prénom : ${prenom || '—'}`,
    `Nom : ${nom || '—'}`,
    `Téléphone : ${phone || '—'}`,
    `Salle de récupération : ${salleLabel}`,
    '',
    'Source : offre_ete_tshirt',
  ].join('\n');

  const html = buildOffreEteTshirtEmailHtml({ prenom, nom, email, phone, salleLabel, name });

  await deliverEmail({
    to: process.env.OFFRE_ETE_TSHIRT_NOTIFY_EMAIL || RECEPTION_EMAIL,
    subject,
    text,
    html,
    replyTo: email || undefined,
    replyToName: name,
    allowBotFallback: true,
  });

  return { ok: true };
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildOffreEteTshirtEmailHtml({ prenom, nom, email, phone, salleLabel, name }) {
  const safeEmail = escapeHtml(email || '—');
  const safeName = escapeHtml(name || '—');
  const mailto = email ? `mailto:${escapeHtml(email)}` : '#';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Offre Été T-shirt</title></head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <tr><td style="height:4px;background:#E30613;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="padding:24px 24px 8px;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Nouvelle réservation — 89€ + t-shirt</p>
        <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Email</p>
        <p style="margin:0 0 18px;font-size:22px;font-weight:700;line-height:1.3;">
          <a href="${mailto}" style="color:#E30613;text-decoration:none;">${safeEmail}</a>
        </p>
        <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Nom complet</p>
        <p style="margin:0 0 22px;font-size:20px;font-weight:700;color:#0f172a;">${safeName}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 24px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#334155;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b;width:38%;">Prénom</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${escapeHtml(prenom || '—')}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b;">Nom</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${escapeHtml(nom || '—')}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b;">Téléphone</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;">${escapeHtml(phone || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Salle</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(salleLabel)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
