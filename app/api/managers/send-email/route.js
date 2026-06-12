import { NextResponse } from 'next/server';
import { deliverEmail } from '../../../../lib/emailDelivery';
import { buildEmailHtml } from '../../../../lib/emailTemplate';
import { resolveManagersForSend } from '../../../../lib/managers';
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
    manager_ids: managerIds,
    message,
    subject,
    html,
    test_only: testOnly,
    broadcast,
  } = body;

  if (!message) return json({ error: 'message required' }, 400);

  try {
    const managers = await resolveManagersForSend({
      manager_ids: managerIds,
      test_only: testOnly,
      broadcast,
    });

    if (!managers.length) {
      return json({ error: 'Aucun manager trouvé pour cet envoi' }, 400);
    }

    const results = {
      email: { sent: 0, failed: 0, skipped: 0 },
      errors: [],
      destinations: [],
      warnings: [],
    };

    const mailSubject = subject || 'Message Boxing Center';
    const apiKeyOnVercel = Boolean((process.env.BREVO_API_KEY || '').trim().startsWith('xkeysib-'));

    for (const mgr of managers) {
      if (!mgr.email) {
        results.email.skipped++;
        continue;
      }
      try {
        const emailHtml =
          html ||
          buildEmailHtml({
            subject: mailSubject,
            body: message,
            recipientName: mgr.nom,
          });
        const delivery = await deliverEmail({
          to: mgr.email,
          subject: mailSubject,
          text: message,
          html: emailHtml,
          recipientName: mgr.nom,
        });
        results.email.sent++;
        results.destinations.push({
          channel: 'email',
          to: mgr.email,
          manager: mgr.nom,
        });
        if (!apiKeyOnVercel || delivery?.via !== 'brevo-api') {
          results.warnings.push({
            manager: mgr.nom,
            hint:
              'Email transmis via le bot (SMTP). Pour une meilleure délivrabilité Gmail, ajoutez BREVO_API_KEY (xkeysib-…) sur Vercel.',
          });
        }
      } catch (err) {
        results.email.failed++;
        results.errors.push({ manager: mgr.nom, channel: 'email', error: err.message });
      }
    }

    return json({
      success: true,
      managers: managers.length,
      whatsapp: { sent: 0, failed: 0, skipped: 0 },
      ...results,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
