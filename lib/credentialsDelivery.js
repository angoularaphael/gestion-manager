import { botFetch } from './bot';
import { isSmtpIpBlockedError, sendEmailViaBrevo } from './brevoSend';
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
    const html = buildEmailHtml({ subject, body: text, recipientName: name });
    const botPayload = {
      to: email,
      subject,
      text,
      html,
      recipient_name: name || '',
    };
    try {
      delivery.email = await sendEmailViaBrevo({ to: email, subject, text, html });
      if (!delivery.email) {
        delivery.email = await botFetch('/api/send-email', { method: 'POST', body: botPayload });
      }
    } catch (e) {
      const msg = e.message || String(e);
      const tryBot =
        isSmtpIpBlockedError(msg) ||
        /brevo|smtp|unauthorized/i.test(msg);
      if (tryBot) {
        try {
          delivery.email = await botFetch('/api/send-email', { method: 'POST', body: botPayload });
        } catch (botErr) {
          delivery.errors.push({ channel: 'email', error: botErr.message });
        }
      } else {
        delivery.errors.push({ channel: 'email', error: msg });
      }
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
