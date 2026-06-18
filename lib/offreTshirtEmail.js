import { deliverEmail } from './emailDelivery';
import { buildEmailHtml } from './emailTemplate';
import { RECEPTION_EMAIL } from './site';
import { BOXING_CENTER_SALLES } from './boxingCenterSalles';

const SALLE_LABELS = Object.fromEntries(BOXING_CENTER_SALLES.map((s) => [s.id, s.label]));

function salleLabel(id) {
  return SALLE_LABELS[id] || id || '—';
}

export async function sendOffreTshirtEmail({ prenom, nom, email, phone, salle, source = 'offre_ete_tshirt' }) {
  const fullName = [prenom, nom].filter(Boolean).join(' ') || '—';
  const subject = `[Offre Été] Réservation T-shirt — ${fullName}`;

  const text = [
    'Nouvelle réservation T-shirt offre Été 2026',
    '',
    `Prénom : ${prenom || '—'}`,
    `Nom : ${nom || '—'}`,
    `Email : ${email || '—'}`,
    `Téléphone : ${phone || '—'}`,
    `Salle de récupération : ${salleLabel(salle)}`,
    `Source : ${source}`,
  ].join('\n');

  const htmlBody = text;

  await deliverEmail({
    to: process.env.OFFRE_TSHIRT_NOTIFY_EMAIL || RECEPTION_EMAIL,
    subject,
    text,
    html: buildEmailHtml({ subject, body: htmlBody, recipientName: 'Équipe Boxing Center' }),
    replyTo: email || undefined,
    replyToName: fullName !== '—' ? fullName : undefined,
    allowBotFallback: true,
  });

  return { ok: true };
}
