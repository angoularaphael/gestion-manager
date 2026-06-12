import { NextResponse } from 'next/server';
import { deliverEmail } from '../../../../lib/emailDelivery';
import { buildEmailHtml } from '../../../../lib/emailTemplate';
import { describeBrevoKeyIssue, getBrevoConfig } from '../../../../lib/brevoSend';
import { resolvePromoteursForSend } from '../../../../lib/promoteurs';
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

  const {
    promoter_ids: promoterIds,
    message,
    subject,
    html,
    test_only: testOnly,
    broadcast,
  } = body;

  if (!message) return json({ error: 'message required' }, 400);

  try {
    const promoteurs = await resolvePromoteursForSend({
      promoter_ids: promoterIds,
      test_only: testOnly,
      broadcast,
    });

    if (!promoteurs.length) {
      return json({ error: 'Aucun promoteur trouvé pour cet envoi' }, 400);
    }

    const results = {
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

    for (const prom of promoteurs) {
      if (!prom.email) {
        results.email.skipped++;
        continue;
      }
      try {
        const emailHtml =
          html ||
          buildEmailHtml({
            subject: mailSubject,
            body: message,
            recipientName: prom.nom,
          });
        const delivery = await deliverEmail({
          to: prom.email,
          subject: mailSubject,
          text: message,
          html: emailHtml,
          recipientName: prom.nom,
          allowBotFallback: false,
        });
        results.email.sent++;
        results.destinations.push({
          channel: 'email',
          to: prom.email,
          manager: prom.nom,
          via: delivery?.via || 'brevo-api',
        });
      } catch (err) {
        results.email.failed++;
        results.errors.push({ manager: prom.nom, channel: 'email', error: err.message });
      }
    }

    return json({
      success: true,
      promoteurs: promoteurs.length,
      whatsapp: { sent: 0, failed: 0, skipped: 0 },
      ...results,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
