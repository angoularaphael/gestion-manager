import { describeBrevoKeyIssue, getBrevoConfig, isBrevoConfiguredOnVercel } from './brevoSend';
import { describeMailjetIssue, getMailjetConfig, isMailjetConfigured } from './mailjetConfig';
import { describeResendIssue, getResendConfig, isResendConfigured } from './resendSend';
import { describeSesIssue, getSesConfig, isSesConfigured } from './sesSend';

export function getEmailProvider() {
  const explicit = (process.env.EMAIL_PROVIDER || 'auto').trim().toLowerCase();
  if (explicit === 'resend') return 'resend';
  if (explicit === 'ses') return 'ses';
  if (explicit === 'mailjet') return 'mailjet';
  if (explicit === 'brevo') return 'brevo';
  if (isResendConfigured()) return 'resend';
  if (isSesConfigured()) return 'ses';
  if (isMailjetConfigured()) return 'mailjet';
  return 'brevo';
}

export function describeEmailProviderIssue() {
  if (getEmailProvider() === 'resend') return describeResendIssue();
  if (getEmailProvider() === 'ses') return describeSesIssue();
  if (getEmailProvider() === 'mailjet') return describeMailjetIssue();
  return describeBrevoKeyIssue();
}

export function isEmailConfiguredOnVercel() {
  if (getEmailProvider() === 'resend') return isResendConfigured();
  if (getEmailProvider() === 'ses') return isSesConfigured();
  if (getEmailProvider() === 'mailjet') return isMailjetConfigured();
  return isBrevoConfiguredOnVercel();
}

export function getEmailConfig() {
  const provider = getEmailProvider();
  const brevo = getBrevoConfig();
  const mailjet = getMailjetConfig();
  const ses = getSesConfig();
  const resend = getResendConfig();
  const issue = describeEmailProviderIssue();
  const activeMailjetAccount = mailjet.accounts.find((a) => a.configured);

  return {
    provider,
    onVercel: brevo.onVercel,
    ready: !issue,
    issue,
    brevo: { ...brevo, active: provider === 'brevo' },
    mailjet: { ...mailjet, active: provider === 'mailjet' },
    ses: { ...ses, active: provider === 'ses' },
    resend: { ...resend, apiKey: undefined, active: provider === 'resend' },
    senderEmail:
      provider === 'resend'
        ? resend.senderEmail
        : provider === 'ses'
          ? ses.senderEmail
          : provider === 'mailjet'
            ? activeMailjetAccount?.senderEmail || ''
            : brevo.senderEmail,
    senderName:
      provider === 'resend'
        ? resend.senderName
        : provider === 'ses'
          ? ses.senderName
          : provider === 'mailjet'
            ? activeMailjetAccount?.senderName || 'Boxing Center'
            : brevo.senderName,
  };
}
