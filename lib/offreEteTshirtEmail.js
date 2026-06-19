import { deliverEmail } from './emailDelivery';
import { buildEmailHtml } from './emailTemplate';
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
  const subject = `[Offre Été] 89€ + T-shirt — ${name}`;

  const text = [
    'Nouvelle inscription Offre Été 2026 — 89€ + t-shirt offert',
    '',
    `Prénom : ${prenom || '—'}`,
    `Nom : ${nom || '—'}`,
    `Email : ${email || '—'}`,
    `Téléphone : ${phone || '—'}`,
    `Salle de récupération : ${salleLabel}`,
    '',
    'Source : offre_ete_tshirt',
  ].join('\n');

  const htmlBody = [
    `Prénom : ${prenom || '—'}`,
    `Nom : ${nom || '—'}`,
    `Email : ${email || '—'}`,
    `Téléphone : ${phone || '—'}`,
    `Salle de récupération : ${salleLabel}`,
    '',
    'Source : offre_ete_tshirt',
  ].join('\n');

  await deliverEmail({
    to: process.env.OFFRE_ETE_TSHIRT_NOTIFY_EMAIL || RECEPTION_EMAIL,
    subject,
    text,
    html: buildEmailHtml({ subject, body: htmlBody, recipientName: 'Équipe Boxing Center' }),
    replyTo: email || undefined,
    replyToName: name,
    allowBotFallback: true,
    mailjetAccount: 'notify',
  });

  return { ok: true };
}
