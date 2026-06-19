import { botFetch } from './bot';
import {
  describeBrevoKeyIssue,
  getBrevoConfig,
  isSmtpIpBlockedError,
  sendEmailViaBrevo,
} from './brevoSend';
import { describeEmailProviderIssue, getEmailProvider } from './emailConfig';
import { sendEmailViaMailjet } from './mailjetSend';

export async function deliverEmail({
  to,
  subject,
  text,
  html,
  recipientName = '',
  replyTo = '',
  replyToName = '',
  allowBotFallback = true,
  mailjetAccount,
  customHeaders,
  isMarketing = false,
}) {
  const botPayload = {
    to,
    subject,
    text: text || '',
    html: html || '',
    recipient_name: recipientName || '',
    reply_to: replyTo || '',
  };

  const provider = getEmailProvider();
  const { onVercel } = getBrevoConfig();
  const providerIssue = describeEmailProviderIssue();

  if (onVercel && providerIssue && !allowBotFallback) {
    throw new Error(providerIssue);
  }

  if (provider === 'mailjet') {
    try {
      return await sendEmailViaMailjet({
        to,
        subject,
        text: text || '',
        html: html || undefined,
        replyTo: replyTo || undefined,
        replyToName: replyToName || undefined,
        mailjetAccount,
        customHeaders: isMarketing ? customHeaders : undefined,
      });
    } catch (e) {
      if (!allowBotFallback) {
        throw new Error(`Mailjet : ${e.message || e}`);
      }
      return await botFetch('/api/send-email', { method: 'POST', body: botPayload });
    }
  }

  const { apiKeyConfigured } = getBrevoConfig();

  try {
    const viaBrevo = await sendEmailViaBrevo({
      to,
      subject,
      text: text || '',
      html: html || undefined,
      replyTo: replyTo || undefined,
      replyToName: replyToName || undefined,
      customHeaders: isMarketing ? customHeaders : undefined,
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
