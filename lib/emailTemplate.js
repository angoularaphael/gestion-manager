import {
  BOXING_CENTER_CONTACT_EMAIL,
  BOXING_CENTER_SITE,
} from './site';
import { EMAIL_CID_LOGO, emailCidSrc } from './emailInlineCids';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function siteHost() {
  try {
    return new URL(BOXING_CENTER_SITE).host;
  } catch {
    return 'boxingcenter.fr';
  }
}

function buildEmailSignatureHtml(logoSrc) {
  const site = escapeHtml(BOXING_CENTER_SITE);
  const host = escapeHtml(siteHost());
  const email = escapeHtml(BOXING_CENTER_CONTACT_EMAIL);
  const logo = escapeHtml(logoSrc || emailCidSrc(EMAIL_CID_LOGO));

  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;border-collapse:collapse;">
  <tr>
    <td style="padding:20px 22px;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);border-radius:14px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td width="80" valign="middle" style="padding-right:14px;">
            <img src="${logo}" alt="Boxing Center" width="64" height="64" border="0"
              style="display:block;width:64px;height:64px;border:0;border-radius:10px;background:#ffffff;padding:5px;" />
          </td>
          <td valign="middle" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
            <p style="margin:0 0 4px;font-size:17px;font-weight:700;">Boxing Center</p>
            <p style="margin:0 0 2px;font-size:13px;line-height:1.45;">
              <a href="${site}" style="color:#93c5fd;text-decoration:none;">${host}</a>
            </p>
            <p style="margin:0;font-size:13px;line-height:1.45;">
              <a href="mailto:${email}" style="color:#e2e8f0;text-decoration:none;">${email}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function buildEmailHtml({
  subject = '',
  body = '',
  recipientName = '',
  preheader = '',
  extraFooterHtml = '',
  contentHtml = '',
  logoSrc = '',
}) {
  const safeBody = contentHtml || escapeHtml(body).replace(/\n/g, '<br>');
  const greeting = recipientName
    ? `<p style="margin:0 0 14px;font-size:16px;color:#0f172a;">Bonjour <strong>${escapeHtml(recipientName)}</strong>,</p>`
    : '';
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject || 'Boxing Center')}</title>
</head>
<body style="margin:0;padding:0 0 12px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  ${preheaderHtml}
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;border-collapse:collapse;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#2563eb,#0f172a);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:26px 26px 10px;font-size:15px;line-height:1.65;color:#334155;">
              ${greeting}
              <div style="margin:0;">${safeBody || '&nbsp;'}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 26px 24px;">
              ${buildEmailSignatureHtml(logoSrc)}
              ${extraFooterHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
