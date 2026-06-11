import { botFetch } from './bot';
import { buildEmailHtml } from './emailTemplate';
import { normalizePhone } from './phone';

const LOGIN_URL = () =>
  `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://gestion-manager.vercel.app').replace(/\/$/, '')}/login`;

function credentialsBody({ name, email, password }) {
  const greeting = name ? `Bonjour ${name},` : 'Bonjour,';
  return [
    greeting,
    '',
    'Votre accès à la console Boxing Center a été créé.',
    '',
    `Lien de connexion : ${LOGIN_URL()}`,
    `Email : ${email}`,
    `Mot de passe : ${password}`,
    '',
    'Conservez ces identifiants en lieu sûr.',
  ].join('\n');
}

function credentialsWhatsApp({ name, email, password }) {
  const greeting = name ? `Bonjour *${name}*,` : 'Bonjour,';
  return [
    greeting,
    '',
    '🥊 *Boxing Center* — accès console',
    '',
    `🌐 Connexion : ${LOGIN_URL()}`,
    `✉️ Email : ${email}`,
    `🔑 Mot de passe : ${password}`,
    '',
    '_Message automatique — ne pas transférer._',
  ].join('\n');
}

export async function deliverCredentials({ email, password, name, phone, sendEmail, sendWhatsApp }) {
  const delivery = { email: null, whatsapp: null, errors: [] };
  const text = credentialsBody({ name, email, password });
  const subject = 'Vos identifiants — Boxing Center';

  if (sendEmail) {
    try {
      delivery.email = await botFetch('/api/send-email', {
        method: 'POST',
        body: {
          to: email,
          subject,
          text,
          html: buildEmailHtml({ subject, body: text, recipientName: name }),
          recipient_name: name || '',
        },
      });
    } catch (e) {
      delivery.errors.push({ channel: 'email', error: e.message });
    }
  }

  const cleanPhone = normalizePhone(phone);
  if (sendWhatsApp) {
    if (!cleanPhone) {
      delivery.errors.push({ channel: 'whatsapp', error: 'Numéro de téléphone requis' });
    } else {
      try {
        delivery.whatsapp = await botFetch('/api/send-message', {
          method: 'POST',
          body: { phone: cleanPhone, message: credentialsWhatsApp({ name, email, password }) },
        });
      } catch (e) {
        delivery.errors.push({ channel: 'whatsapp', error: e.message });
      }
    }
  }

  return delivery;
}
