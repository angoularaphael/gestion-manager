/**
 * Envoi email Brevo depuis Vercel (sans passer par le bot Bothosting).
 * Utile quand Vercel n'atteint pas le port HTTP du bot pour les POST.
 */
import nodemailer from 'nodemailer';

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
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_KEY,
      },
    });
  }
  return transport;
}

export function isBrevoConfiguredOnVercel() {
  return smtpConfigured();
}

export async function sendEmailViaBrevo({ to, subject, html, text }) {
  if (!smtpConfigured()) return null;
  if (!to) throw new Error('Destinataire email manquant');

  const info = await getTransport().sendMail({
    from: `"${senderName()}" <${senderEmail()}>`,
    to,
    subject: subject || 'Message Boxing Center',
    text: text || '',
    html: html || undefined,
  });

  return { success: true, messageId: info.messageId, via: 'brevo-vercel' };
}
