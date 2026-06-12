import { botFetch } from './bot';
import {
  describeBrevoKeyIssue,
  getBrevoConfig,
  isSmtpIpBlockedError,
  sendEmailViaBrevo,
} from './brevoSend';

export async function deliverEmail({
  to,
  subject,
  text,
  html,
  recipientName = '',
  allowBotFallback = true,
}) {
  const botPayload = {
    to,
    subject,
    text: text || '',
    html: html || '',
    recipient_name: recipientName || '',
  };

  const { apiKeyConfigured, onVercel } = getBrevoConfig();

  if (onVercel && !apiKeyConfigured && !allowBotFallback) {
    throw new Error(describeBrevoKeyIssue() || 'BREVO_API_KEY manquante sur Vercel.');
  }

  try {
    const viaBrevo = await sendEmailViaBrevo({
      to,
      subject,
      text: text || '',
      html: html || undefined,
    });
    if (viaBrevo) return viaBrevo;

    if (!allowBotFallback) {
      throw new Error(
        describeBrevoKeyIssue() ||
          'Envoi email impossible via API Brevo. Vérifiez BREVO_API_KEY et redéployez Vercel.'
      );
    }

    return await botFetch('/api/send-email', { method: 'POST', body: botPayload });
  } catch (e) {
    if (apiKeyConfigured) {
      throw new Error(`Brevo API : ${e.message || e}`);
    }
    const msg = e.message || String(e);
    const tryBot =
      allowBotFallback &&
      (isSmtpIpBlockedError(msg) || /brevo|smtp|unauthorized/i.test(msg));
    if (!tryBot) throw e;
    return await botFetch('/api/send-email', { method: 'POST', body: botPayload });
  }
}
