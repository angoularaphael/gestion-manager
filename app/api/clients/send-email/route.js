import { NextResponse } from 'next/server';
import { deliverEmail } from '../../../../lib/emailDelivery';
import { buildEmailHtml } from '../../../../lib/emailTemplate';
import { describeBrevoKeyIssue, getBrevoConfig } from '../../../../lib/brevoSend';
import { clientDisplayName, resolveClientsForSend } from '../../../../lib/clients';
import { getSession } from '../../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return json({ error: 'Non authentifié' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const { client_ids: clientIds, message, subject, html, test_only: testOnly, broadcast } = body;

  if (!message) return json({ error: 'message required' }, 400);

  try {
    const clients = await resolveClientsForSend({
      client_ids: clientIds,
      test_only: testOnly,
      broadcast,
    });

    if (!clients.length) {
      return json({ error: 'Aucun client trouvé pour cet envoi' }, 400);
    }

    const results = {
      clients: clients.length,
      email: { sent: 0, failed: 0, skipped: 0 },
      errors: [],
      destinations: [],
      warnings: [],
    };

    const mailSubject = subject || 'Message Boxing Center';
    const brevo = getBrevoConfig();
    const keyIssue = describeBrevoKeyIssue();

    if (brevo.onVercel && keyIssue) {
      return json({ error: keyIssue }, 400);
    }

    for (const client of clients) {
      if (!client.email) {
        results.email.skipped++;
        continue;
      }
      try {
        const recipientName = clientDisplayName(client);
        const emailHtml =
          html ||
          buildEmailHtml({
            subject: mailSubject,
            body: message,
            recipientName,
          });
        await deliverEmail({
          to: client.email,
          subject: mailSubject,
          html: emailHtml,
          text: message,
          recipientName,
          allowBotFallback: false,
        });
        results.email.sent++;
        results.destinations.push({
          channel: 'email',
          to: client.email,
          client: recipientName,
        });
      } catch (err) {
        results.email.failed++;
        results.errors.push({
          client: clientDisplayName(client),
          channel: 'email',
          error: err.message,
        });
      }
    }

    return json({ success: true, ...results });
  } catch (e) {
    return json({ error: e.message }, { status: 500 });
  }
}
