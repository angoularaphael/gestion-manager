import { NextResponse } from 'next/server';
import { trackOffreEteEvent } from '../../../../lib/offreEte';
import { offreEteCorsHeaders } from '../../../../lib/offreEteCors';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: offreEteCorsHeaders(request) });
}

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

  const cors = offreEteCorsHeaders(request);
  const eventType = body.event === 'view' ? 'view' : null;
  if (!eventType) {
    return NextResponse.json({ error: 'event invalide (view attendu)' }, { status: 400, headers: cors });
  }

  try {
    await trackOffreEteEvent({
      eventType,
      source: body.source || 'landing',
      referrer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      ip: clientIp(request),
    });
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors });
  }
}
