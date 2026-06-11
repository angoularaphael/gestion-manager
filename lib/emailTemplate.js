import { RECEPTION_EMAIL } from './site';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildEmailHtml({ subject = '', body = '', recipientName = '' }) {
  const safeBody = escapeHtml(body).replace(/\n/g, '<br>');
  const greeting = recipientName
    ? `<p>Bonjour ${escapeHtml(recipientName)},</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;">
  <p style="margin:0 0 8px;font-weight:bold;">Boxing Center</p>
  ${greeting}
  ${subject ? `<p style="margin:16px 0 8px;font-weight:bold;">${escapeHtml(subject)}</p>` : ''}
  <div style="margin:0 0 24px;">${safeBody || '&nbsp;'}</div>
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">
  <p style="margin:0;font-size:13px;color:#666;">
    Boxing Center — pour répondre : ${escapeHtml(RECEPTION_EMAIL)}
  </p>
</body>
</html>`;
}
