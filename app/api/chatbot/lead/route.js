import { NextResponse } from 'next/server';
import { createChatbotLead, trackChatbotEvent } from '../../../../lib/chatbot';
import { chatbotCorsHeaders } from '../../../../lib/chatbotConfig';

function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

const TRACK_EVENTS = new Set([
  'chat_started',
  'lead_collected',
  'faq_hit',
  'faq_miss',
  'escalation',
]);

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: chatbotCorsHeaders(request) });
}

/**
 * POST body examples:
 * - { "event": "chat_started", "sessionId": "..." }
 * - { "event": "faq_hit", "sessionId": "...", "faqQuestion": "..." }
 * - { "name", "email", "phone", "metier", "message", "recontactRequested", "sessionId" }
 */
export async function POST(request) {
  const cors = chatbotCorsHeaders(request);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400, headers: cors });
  }

  const sessionId = body.sessionId ? String(body.sessionId).slice(0, 64) : null;
  const meta = {
    sessionId,
    source: body.source || 'portet',
    referrer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent'),
    ip: clientIp(request),
  };

  try {
    if (body.event && TRACK_EVENTS.has(body.event)) {
      await trackChatbotEvent({
        eventType: body.event,
        faqQuestion: body.faqQuestion || body.question || null,
        ...meta,
      });
    }

    const hasLeadFields =
      body.name || body.email || body.phone || body.metier || body.message || body.recontactRequested;

    if (hasLeadFields) {
      const lead = await createChatbotLead({
        sessionId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        metier: body.metier,
        message: body.message,
        recontactRequested: body.recontactRequested,
        source: body.source || 'portet',
      });

      if (body.event !== 'lead_collected' && body.event !== 'escalation') {
        await trackChatbotEvent({ eventType: 'lead_collected', ...meta });
      }

      return NextResponse.json({ ok: true, lead }, { headers: cors });
    }

    if (!body.event) {
      return NextResponse.json({ error: 'event ou champs lead requis' }, { status: 400, headers: cors });
    }

    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors });
  }
}
