/**
 * Resend — envoi email simple (pas de sandbox AWS).
 * https://resend.com — 3 000 mails/mois gratuits, puis 20 $/50 000.
 */
const API = 'https://api.resend.com/emails';

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY || '';
  const senderEmail = process.env.RESEND_SENDER_EMAIL || 'no-reply@boxingcenter.fr';
  const senderName =
    process.env.RESEND_SENDER_NAME || process.env.SES_SENDER_NAME || 'Boxing Center';
  return {
    apiKey,
    senderEmail,
    senderName,
    configured: Boolean(apiKey),
  };
}

export function describeResendIssue() {
  if (!getResendConfig().configured) {
    return 'Resend : RESEND_API_KEY manquant. Compte sur resend.com → Domains → boxingcenter.fr → API Keys.';
  }
  return '';
}

export function isResendConfigured() {
  return getResendConfig().configured;
}

function toResendAttachments(inlinedAttachments) {
  if (!inlinedAttachments?.length) return undefined;
  return inlinedAttachments.map((a) => {
    const contentId = a.ContentID || a.content_id || a.contentId || a.cid;
    const out = {
      filename: a.Filename || a.filename || 'logo.png',
      content_type: a.ContentType || a.content_type || 'image/png',
      content_id: contentId,
    };
    if (a.path) out.path = a.path;
    else out.content = a.Base64Content || a.content;
    return out;
  });
}

export async function sendEmailViaResend({
  to,
  subject,
  text,
  html,
  replyTo,
  customHeaders,
  inlinedAttachments,
}) {
  const cfg = getResendConfig();
  if (!cfg.configured) throw new Error(describeResendIssue());

  const body = {
    from: `${cfg.senderName} <${cfg.senderEmail}>`,
    to: [to],
    subject,
    text: text || undefined,
    html: html || undefined,
    reply_to: replyTo || undefined,
    headers: customHeaders || undefined,
    attachments: toResendAttachments(inlinedAttachments),
  };

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.name || `Resend HTTP ${res.status}`);
  }
  return { provider: 'resend', messageId: data.id, accepted: [to] };
}
