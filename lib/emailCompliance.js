import { buildEmailHtml } from './emailTemplate';
import { BOXING_CENTER_CONTACT_EMAIL, BOXING_CENTER_SITE } from './site';
import { buildUnsubscribeUrl } from './emailUnsubscribe';

export function legalSenderAddress() {
  return (
    process.env.NEXT_PUBLIC_LEGAL_ADDRESS ||
    'Boxing Center — clubs de boxe à Toulouse et agglomération (France)'
  );
}

export function buildListUnsubscribeHeaders(unsubscribeUrl) {
  const contact = BOXING_CENTER_CONTACT_EMAIL;
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:${contact}?subject=${encodeURIComponent('Désabonnement')}&body=${encodeURIComponent('Merci de me désabonner de vos emails.')}`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    Precedence: 'bulk',
  };
}

export function buildComplianceTextFooter({ unsubscribeUrl }) {
  return [
    '',
    '—',
    legalSenderAddress(),
    `Contact : ${BOXING_CENTER_CONTACT_EMAIL}`,
    `Site : ${BOXING_CENTER_SITE}`,
    `Se désabonner : ${unsubscribeUrl}`,
    '',
    'Vous recevez cet email car vous êtes client ou contact Boxing Center.',
  ].join('\n');
}

export function buildComplianceHtmlFooter({ unsubscribeUrl }) {
  const site = BOXING_CENTER_SITE.replace(/\/$/, '');
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:18px;border-collapse:collapse;">
  <tr>
    <td style="padding:16px 0 0;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#64748b;">
      <p style="margin:0 0 8px;">${legalSenderAddress()}</p>
      <p style="margin:0 0 8px;">
        <a href="${site}" style="color:#2563eb;text-decoration:none;">boxingcenter.fr</a>
        · <a href="mailto:${BOXING_CENTER_CONTACT_EMAIL}" style="color:#2563eb;text-decoration:none;">${BOXING_CENTER_CONTACT_EMAIL}</a>
      </p>
      <p style="margin:0;">
        <a href="${unsubscribeUrl}" style="color:#64748b;text-decoration:underline;">Se désabonner</a>
        — vous ne recevrez plus nos emails promotionnels.
      </p>
    </td>
  </tr>
</table>`;
}

export function buildMarketingEmailParts({
  subject,
  body,
  recipientName = '',
  clientId = null,
  email,
  preheader = '',
}) {
  const unsubscribeUrl = buildUnsubscribeUrl({ clientId, email });
  const textFooter = buildComplianceTextFooter({ unsubscribeUrl });
  const htmlFooter = buildComplianceHtmlFooter({ unsubscribeUrl });
  const headers = buildListUnsubscribeHeaders(unsubscribeUrl);

  const html = buildEmailHtml({
    subject,
    body,
    recipientName,
    preheader,
    extraFooterHtml: htmlFooter,
  });

  const text = `${body}${textFooter}`;

  return { html, text, headers, unsubscribeUrl };
}
