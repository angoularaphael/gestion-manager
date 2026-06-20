import { deliverEmail } from './emailDelivery';
import { buildMarketingEmailParts } from './emailCompliance';
import { buildEmailHtml } from './emailTemplate';
import { pickMailjetAccountForIndex, resolveMailjetAccountSlot } from './mailjetConfig';

export async function sendBulkEmails({
  recipients,
  getEmail,
  getRecipientName,
  getMessage,
  getClientId = () => null,
  message,
  subject,
  html,
  preheader = '',
  isMarketing = false,
  mailjetAccount,
  mailjetRotateAccounts = false,
  mailjetStartIndex = 0,
  allowBotFallback = false,
}) {
  const results = {
    email: { sent: 0, failed: 0, skipped: 0 },
    errors: [],
    destinations: [],
  };

  const mailSubject = subject || 'Message Boxing Center';
  let index = mailjetStartIndex;

  for (const recipient of recipients) {
    const email = getEmail(recipient);
    if (!email) {
      results.email.skipped++;
      continue;
    }

    const recipientName = getRecipientName(recipient);
    const clientId = getClientId(recipient);
    const bodyMessage =
      (typeof getMessage === 'function' ? getMessage(recipient) : null) || message;
    const accountSlot = mailjetRotateAccounts
      ? pickMailjetAccountForIndex(index++)
      : resolveMailjetAccountSlot(mailjetAccount || 'campaign');

    try {
      let emailHtml = html;
      let textBody = message;
      let customHeaders;
      let inlinedAttachments;

      const useMarketingTemplate = isMarketing || (!html && preheader);

      if (!emailHtml && useMarketingTemplate) {
        const parts = buildMarketingEmailParts({
          subject: mailSubject,
          body: bodyMessage,
          recipientName,
          clientId,
          email,
          preheader,
        });
        emailHtml = parts.html;
        textBody = parts.text;
        customHeaders = parts.headers;
        inlinedAttachments = parts.inlinedAttachments;
      } else if (!emailHtml) {
        emailHtml = buildEmailHtml({
          subject: mailSubject,
          body: bodyMessage,
          recipientName,
          preheader,
        });
      }

      await deliverEmail({
        to: email,
        subject: mailSubject,
        html: emailHtml,
        text: textBody,
        recipientName,
        allowBotFallback,
        mailjetAccount: accountSlot,
        customHeaders,
        isMarketing: useMarketingTemplate,
        inlinedAttachments,
      });

      results.email.sent++;
      results.destinations.push({
        channel: 'email',
        to: email,
        client: recipientName,
        mailjetAccount: accountSlot,
      });
    } catch (err) {
      results.email.failed++;
      results.errors.push({
        client: recipientName,
        channel: 'email',
        error: err.message,
      });
    }
  }

  return results;
}
