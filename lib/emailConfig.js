import { describeBrevoKeyIssue, getBrevoConfig, isBrevoConfiguredOnVercel } from './brevoSend';
import { describeMailjetIssue, getMailjetConfig, isMailjetConfigured } from './mailjetConfig';

export function getEmailProvider() {
  const explicit = (process.env.EMAIL_PROVIDER || 'auto').trim().toLowerCase();
  if (explicit === 'mailjet') return 'mailjet';
  if (explicit === 'brevo') return 'brevo';
  if (isMailjetConfigured()) return 'mailjet';
  return 'brevo';
}

export function describeEmailProviderIssue() {
  if (getEmailProvider() === 'mailjet') return describeMailjetIssue();
  return describeBrevoKeyIssue();
}

export function isEmailConfiguredOnVercel() {
  if (getEmailProvider() === 'mailjet') return isMailjetConfigured();
  return isBrevoConfiguredOnVercel();
}

export function getEmailConfig() {
  const provider = getEmailProvider();
  const brevo = getBrevoConfig();
  const mailjet = getMailjetConfig();
  const issue = describeEmailProviderIssue();
  const activeMailjetAccount = mailjet.accounts.find((a) => a.configured);

  return {
    provider,
    onVercel: brevo.onVercel,
    ready: !issue,
    issue,
    brevo: { ...brevo, active: provider === 'brevo' },
    mailjet: { ...mailjet, active: provider === 'mailjet' },
    senderEmail:
      provider === 'mailjet'
        ? activeMailjetAccount?.senderEmail || ''
        : brevo.senderEmail,
    senderName:
      provider === 'mailjet'
        ? activeMailjetAccount?.senderName || 'Boxing Center'
        : brevo.senderName,
  };
}
