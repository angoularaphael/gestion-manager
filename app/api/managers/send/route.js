import { NextResponse } from 'next/server';
import { botFetch } from '../../../../lib/bot';
import { deliverEmail } from '../../../../lib/emailDelivery';
import { buildEmailHtml } from '../../../../lib/emailTemplate';
import { resolveManagersForSend } from '../../../../lib/managers';
import { normalizePhone } from '../../../../lib/phone';
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

async function deliverToManager(mgr, { message, subject, html, channels, results }) {
  const mailSubject = subject || 'Message Boxing Center';
  const tasks = [];

  if (channels.includes('whatsapp')) {
    tasks.push((async () => {
      if (!mgr.telephone) {
        results.whatsapp.skipped++;
        return;
      }
      try {
        await botFetch('/api/send-message', {
          method: 'POST',
          body: { phone: mgr.telephone, message, manager_id: mgr.id },
        });
        results.whatsapp.sent++;
        results.destinations.push({
          channel: 'whatsapp',
          to: `+${normalizePhone(mgr.telephone)}`,
          manager: mgr.nom,
        });
      } catch (err) {
        results.whatsapp.failed++;
        results.errors.push({ manager: mgr.nom, channel: 'whatsapp', error: err.message });
      }
    })());
  }

  if (channels.includes('email')) {
    tasks.push((async () => {
      if (!mgr.email) {
        results.email.skipped++;
        return;
      }
      try {
        const emailHtml =
          html ||
          buildEmailHtml({
            subject: mailSubject,
            body: message,
            recipientName: mgr.nom,
          });
        await deliverEmail({
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
      } catch (err) {
        results.email.failed++;
        results.errors.push({ manager: mgr.nom, channel: 'email', error: err.message });
      }
    })());
  }

  await Promise.all(tasks);
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
    channels = ['whatsapp'],
    test_only: testOnly,
    broadcast,
  } = body;

  if (!message) return json({ error: 'message required' }, 400);
  if (!Array.isArray(channels) || !channels.length) {
    return json({ error: 'channels required' }, 400);
  }

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
      whatsapp: { sent: 0, failed: 0, skipped: 0 },
      email: { sent: 0, failed: 0, skipped: 0 },
      errors: [],
      destinations: [],
    };

    const fastBatch = testOnly || managers.length <= 5;
    const ctx = { message, subject, html, channels, results };

    if (fastBatch) {
      await Promise.all(managers.map((mgr) => deliverToManager(mgr, ctx)));
    } else {
      for (const mgr of managers) {
        await deliverToManager(mgr, ctx);
        if (channels.includes('whatsapp')) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    return json({ success: true, managers: managers.length, ...results });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
