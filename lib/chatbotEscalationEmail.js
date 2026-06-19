import { deliverEmail } from './emailDelivery';
import { buildEmailHtml } from './emailTemplate';
import { RECEPTION_EMAIL } from './site';

export const CHATBOT_ESCALATION_TOPICS = [
  { id: 'contact', label: 'Contact et essais' },
  { id: 'membre', label: 'Devenir membre et paiement' },
  { id: 'cours', label: 'Nos cours et programmes' },
  { id: 'resiliation', label: 'Modification et résiliation' },
  { id: 'abonnement', label: 'Inscription et abonnements' },
  { id: 'autre', label: 'Autre question' },
];

export function chatbotTopicLabel(topicId) {
  return CHATBOT_ESCALATION_TOPICS.find((t) => t.id === topicId)?.label || topicId || 'Question libre';
}

export async function sendChatbotEscalationEmail({
  name,
  email,
  phone,
  metier,
  topic,
  message,
  source = 'portet',
}) {
  const subjectLabel = chatbotTopicLabel(topic);
  const subject = `[Chatbot Portet] ${subjectLabel} — ${name || 'Visiteur'}`;

  const text = [
    'Nouvelle question depuis le chatbot Boxing Center Portet',
    '',
    `Sujet : ${subjectLabel}`,
    `Nom : ${name || '—'}`,
    `Email : ${email || '—'}`,
    phone ? `Téléphone : ${phone}` : null,
    metier ? `Profil : ${metier}` : null,
    `Source : ${source}`,
    '',
    'Message :',
    message,
  ]
    .filter(Boolean)
    .join('\n');

  const htmlBody = [
    `Sujet : ${subjectLabel}`,
    `Nom : ${name || '—'}`,
    `Email : ${email || '—'}`,
    phone ? `Téléphone : ${phone}` : '',
    metier ? `Profil : ${metier}` : '',
    `Source : ${source}`,
    '',
    'Message :',
    message,
  ]
    .filter((line) => line !== '')
    .join('\n');

  await deliverEmail({
    to: process.env.CHATBOT_NOTIFY_EMAIL || RECEPTION_EMAIL,
    subject,
    text,
    html: buildEmailHtml({ subject, body: htmlBody, recipientName: 'Équipe Boxing Center' }),
    replyTo: email || undefined,
    replyToName: name || undefined,
    allowBotFallback: true,
    mailjetAccount: 'notify',
  });

  return { ok: true };
}
