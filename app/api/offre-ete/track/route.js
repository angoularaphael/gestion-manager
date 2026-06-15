import { NextResponse } from 'next/server';
import { trackOffreEteEvent } from '../../../../lib/offreEte';

function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

/** POST { "event": "view", "source": "landing" } — appelé par la page offre. */
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const eventType = body.event === 'view' ? 'view' : null;
  if (!eventType) {
    return NextResponse.json({ error: 'event invalide (view attendu)' }, { status: 400 });
  }

  try {
    await trackOffreEteEvent({
      eventType,
      source: body.source || 'landing',
      referrer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      ip: clientIp(request),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
