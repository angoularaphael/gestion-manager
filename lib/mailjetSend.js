import { getMailjetAccount } from './mailjetConfig';

function defaultReplyTo() {
  return (
    process.env.MAILJET_REPLY_TO ||
    process.env.BREVO_REPLY_TO ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    'boxingcenter31@gmail.com'
  );
}

export async function sendEmailViaMailjet({
  to,
  subject,
  html,
  text,
  replyTo,
  replyToName,
  mailjetAccount,
  customHeaders,
  inlinedAttachments,
}) {
  if (!to) throw new Error('Destinataire email manquant');

  const account = getMailjetAccount(mailjetAccount);
  const auth = Buffer.from(`${account.apiKey}:${account.secretKey}`).toString('base64');
  const replyEmail = replyTo || defaultReplyTo();

  const message = {
    From: { Email: account.senderEmail, Name: account.senderName },
    To: [{ Email: to }],
    ReplyTo: {
      Email: replyEmail,
      Name: replyToName || account.senderName,
    },
    Subject: subject || 'Message Boxing Center',
    TextPart: text || undefined,
    HTMLPart: html || undefined,
    TrackOpens: 'disabled',
    TrackClicks: 'disabled',
  };

  if (customHeaders && Object.keys(customHeaders).length) {
    message.Headers = customHeaders;
  }

  if (inlinedAttachments?.length) {
    message.InlinedAttachments = inlinedAttachments;
  }

  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      Messages: [message],
    }),
  });

  const raw = await res.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw.slice(0, 200) };
  }

  if (!res.ok) {
    const errMsg =
      data.ErrorMessage ||
      data.message ||
      (Array.isArray(data.Messages) && data.Messages[0]?.Errors?.[0]?.ErrorMessage) ||
      `Mailjet HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  const messageId = data.Messages?.[0]?.To?.[0]?.MessageID || data.Messages?.[0]?.MessageID;

  return {
    success: true,
    messageId,
    via: 'mailjet',
    mailjetAccount: account.slot,
    senderEmail: account.senderEmail,
  };
}
