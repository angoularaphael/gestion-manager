/**
 * Envoi email Brevo depuis Vercel.
 * Préfère l'API REST (pas de blocage IP Vercel) ; repli SMTP si configuré.
 */
import nodemailer from 'nodemailer';

function readApiKey() {
  return (process.env.BREVO_API_KEY || '').trim().replace(/^["']|["']$/g, '');
}

function apiKeyConfigured() {
  return readApiKey().startsWith('xkeysib-');
}

export function getBrevoConfig() {
  const key = readApiKey();
  let keyStatus = 'missing';
  if (key.startsWith('xkeysib-')) keyStatus = 'api';
  else if (key.startsWith('xsmtpsib-')) keyStatus = 'smtp_in_api_slot';
  else if (key) keyStatus = 'invalid_prefix';

  return {
    apiKeyConfigured: keyStatus === 'api',
    keyStatus,
    onVercel: onVercel(),
    senderEmail: senderEmail(),
    senderName: senderName(),
  };
}

export function describeBrevoKeyIssue() {
  const { keyStatus, onVercel: onV } = getBrevoConfig();
  if (keyStatus === 'api') return null;
  if (keyStatus === 'smtp_in_api_slot') {
    return 'BREVO_API_KEY contient une clé SMTP (xsmtpsib-…). Créez une clé API v3 (xkeysib-…) dans Brevo → SMTP & API → Clés API.';
  }
  if (keyStatus === 'invalid_prefix') {
    return 'BREVO_API_KEY invalide : doit commencer par xkeysib- (clé API Brevo v3).';
  }
  if (onV) {
    return 'BREVO_API_KEY absente sur Vercel. Ajoutez la clé xkeysib-… puis Redeploy (obligatoire après chaque changement de variable).';
  }
  return 'BREVO_API_KEY absente.';
}

function smtpConfigured() {
  return Boolean(process.env.BREVO_SMTP_LOGIN && process.env.BREVO_SMTP_KEY);
}

function senderEmail() {
  return (
    process.env.BREVO_SENDER_EMAIL ||
    process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL ||
    'suzinabot@11426075.brevosend.com'
  );
}

function senderName() {
  return process.env.BREVO_SENDER_NAME || 'Boxing Center';
}

let transport = null;

function getTransport() {
  if (!transport) {
    const port = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
    transport = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port,
      secure: port === 465,
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 15_000,
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_KEY,
      },
    });
  }
  return transport;
}

function onVercel() {
  return Boolean(process.env.VERCEL);
}

export function isBrevoConfiguredOnVercel() {
  return apiKeyConfigured() || smtpConfigured();
}

async function sendViaRestApi({ to, subject, html, text, replyTo, replyToName }) {
  const apiKey = readApiKey();
  const defaultReply =
    process.env.BREVO_REPLY_TO ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    'boxingcenter31@gmail.com';
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName(), email: senderEmail() },
      to: [{ email: to }],
      replyTo: {
        email: replyTo || defaultReply,
        name: replyToName || senderName(),
      },
      subject: subject || 'Message Boxing Center',
      htmlContent: html || undefined,
      textContent: text || undefined,
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
    throw new Error(data.message || data.error || `Brevo API HTTP ${res.status}`);
  }

  return { success: true, messageId: data.messageId, via: 'brevo-api' };
}

async function sendViaSmtp({ to, subject, html, text, replyTo }) {
  const info = await getTransport().sendMail({
    from: `"${senderName()}" <${senderEmail()}>`,
    to,
    replyTo: replyTo || undefined,
    subject: subject || 'Message Boxing Center',
    text: text || '',
    html: html || undefined,
  });
  return { success: true, messageId: info.messageId, via: 'brevo-smtp' };
}

export async function sendEmailViaBrevo({ to, subject, html, text, replyTo, replyToName }) {
  if (!to) throw new Error('Destinataire email manquant');
  if (!apiKeyConfigured() && !smtpConfigured()) return null;

  if (apiKeyConfigured()) {
    return sendViaRestApi({ to, subject, html, text, replyTo, replyToName });
  }

  // SMTP depuis Vercel → souvent 525 IP bloquée ; passer au bot sans attendre
  if (onVercel()) {
    return null;
  }

  return sendViaSmtp({ to, subject, html, text, replyTo });
}

export function isSmtpIpBlockedError(message) {
  return /525|5\.7\.1|Unauthorized IP/i.test(String(message || ''));
}
