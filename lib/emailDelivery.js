import { botFetch } from './bot';
import { isSmtpIpBlockedError, sendEmailViaBrevo } from './brevoSend';

export async function deliverEmail({ to, subject, text, html, recipientName = '' }) {
  const botPayload = {
    to,
    subject,
    text: text || '',
    html: html || '',
    recipient_name: recipientName || '',
  };

  try {
    const viaBrevo = await sendEmailViaBrevo({
      to,
      subject,
      text: text || '',
      html: html || undefined,
    });
    if (viaBrevo) return viaBrevo;
    return await botFetch('/api/send-email', { method: 'POST', body: botPayload });
  } catch (e) {
    const msg = e.message || String(e);
    const tryBot =
      isSmtpIpBlockedError(msg) || /brevo|smtp|unauthorized/i.test(msg);
    if (!tryBot) throw e;
    return await botFetch('/api/send-email', { method: 'POST', body: botPayload });
  }
}
