import nodemailer from 'nodemailer';

export function getSesConfig() {
  const host = process.env.SES_SMTP_HOST || 'email-smtp.eu-west-3.amazonaws.com';
  const port = Number(process.env.SES_SMTP_PORT || 587);
  const user = process.env.SES_SMTP_USER || process.env.AWS_SES_SMTP_USER || '';
  const pass = process.env.SES_SMTP_PASS || process.env.AWS_SES_SMTP_PASSWORD || '';
  const senderEmail =
    process.env.SES_SENDER_EMAIL || 'no-reply@mail.boxingcenter.fr';
  const senderName = process.env.SES_SENDER_NAME || 'Boxing Center';
  const region = process.env.SES_REGION || 'eu-west-3';
  return {
    host,
    port,
    user,
    pass,
    senderEmail,
    senderName,
    region,
    configured: Boolean(user && pass),
  };
}

export function describeSesIssue() {
  const cfg = getSesConfig();
  if (!cfg.configured) {
    return 'Amazon SES : SES_SMTP_USER / SES_SMTP_PASS manquants. Vérifiez mail.boxingcenter.fr (SPF+DKIM+DMARC) et sortez du sandbox.';
  }
  return '';
}

export function isSesConfigured() {
  return getSesConfig().configured;
}

function transporter() {
  const cfg = getSesConfig();
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

export async function sendEmailViaSes({
  to,
  subject,
  text,
  html,
  replyTo,
  replyToName,
  customHeaders,
}) {
  const cfg = getSesConfig();
  if (!cfg.configured) {
    throw new Error(describeSesIssue());
  }
  const headers = { ...(customHeaders || {}) };
  const info = await transporter().sendMail({
    from: `${cfg.senderName} <${cfg.senderEmail}>`,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
    replyTo: replyTo
      ? replyToName
        ? `${replyToName} <${replyTo}>`
        : replyTo
      : undefined,
    headers,
  });
  return { provider: 'ses', messageId: info.messageId, accepted: info.accepted };
}
