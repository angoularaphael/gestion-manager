import { NextResponse } from 'next/server';
import { deliverEmail } from '../../../../lib/emailDelivery';
import { buildEmailHtml } from '../../../../lib/emailTemplate';
import { describeBrevoKeyIssue, getBrevoConfig } from '../../../../lib/brevoSend';
import { resolveBoxeursForSend } from '../../../../lib/boxeurs';
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
    boxeur_ids: boxeurIds,
    message,
    subject,
    html,
    test_only: testOnly,
    broadcast,
  } = body;

  if (!message) return json({ error: 'message required' }, 400);

  try {
    const boxeurs = await resolveBoxeursForSend({
      boxeur_ids: boxeurIds,
      test_only: testOnly,
      broadcast,
    });

    if (!boxeurs.length) {
      return json({ error: 'Aucun boxeur trouvé pour cet envoi' }, 400);
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

    for (const bx of boxeurs) {
      if (!bx.email) {
        results.email.skipped++;
        continue;
      }
      try {
        const emailHtml =
          html ||
          buildEmailHtml({
            subject: mailSubject,
            body: message,
            recipientName: bx.nom,
          });
        const delivery = await deliverEmail({
          to: bx.email,
          subject: mailSubject,
          text: message,
          html: emailHtml,
          recipientName: bx.nom,
          allowBotFallback: false,
        });
        results.email.sent++;
        results.destinations.push({
          channel: 'email',
          to: bx.email,
          manager: bx.nom,
          via: delivery?.via || 'brevo-api',
        });
      } catch (err) {
        results.email.failed++;
        results.errors.push({ manager: bx.nom, channel: 'email', error: err.message });
      }
    }

    return json({
      success: true,
      boxeurs: boxeurs.length,
      whatsapp: { sent: 0, failed: 0, skipped: 0 },
      ...results,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
