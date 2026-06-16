import { deliverEmail } from './emailDelivery';
import { buildEmailHtml } from './emailTemplate';
import { RECEPTION_EMAIL } from './site';
import { isValidFaqTopic, topicLabel } from './offreEteFaqTopics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFaqContactBody(body) {
  if (body._website) {
    return { error: 'Requête refusée' };
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const topic = String(body.topic || '').trim();
  const message = String(body.message || '').trim();

  if (name.length < 2) return { error: 'Indiquez votre nom (2 caractères minimum).' };
  if (!EMAIL_RE.test(email)) return { error: 'Adresse email invalide.' };
  if (!isValidFaqTopic(topic)) return { error: 'Choisissez un sujet dans la liste.' };
  if (message.length < 10) return { error: 'Votre message doit contenir au moins 10 caractères.' };

  return {
    data: {
      name: name.slice(0, 120),
      email: email.slice(0, 320),
      phone: phone.slice(0, 40),
      topic,
      message: message.slice(0, 4000),
      source: String(body.source || 'offre-ete').slice(0, 64),
    },
  };
}

export async function sendOffreEteFaqContact({ name, email, phone, topic, message, source }) {
  const subjectLabel = topicLabel(topic);
  const subject = `[Offre Été 2026 — FAQ] ${subjectLabel} — ${name}`;

  const text = [
    'Nouvelle question depuis la page Offre Été 2026',
    '',
    `Sujet : ${subjectLabel}`,
    `Nom : ${name}`,
    `Email : ${email}`,
    phone ? `Téléphone : ${phone}` : null,
    `Source : ${source}`,
    '',
    'Message :',
    message,
  ]
    .filter(Boolean)
    .join('\n');

  const htmlBody = [
    `Sujet : ${subjectLabel}`,
    `Nom : ${name}`,
    `Email : ${email}`,
    phone ? `Téléphone : ${phone}` : '',
    `Source : ${source}`,
    '',
    'Message :',
    message,
  ]
    .filter((line) => line !== '')
    .join('\n');

  await deliverEmail({
    to: RECEPTION_EMAIL,
    subject,
    text,
    html: buildEmailHtml({ subject, body: htmlBody, recipientName: 'Équipe Boxing Center' }),
    replyTo: email,
    replyToName: name,
    allowBotFallback: true,
  });

  return { ok: true };
}
