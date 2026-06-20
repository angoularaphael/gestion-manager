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

/** POST { "event": "view"|"boutique_click", "source": "..." } — page offre (boxingcenter.fr). */
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const cors = offreEteCorsHeaders(request);
  let eventType = null;
  let source = body.source || null;

  if (body.event === 'view') {
    eventType = 'view';
    source = source || 'landing';
  } else if (body.event === 'boutique_click') {
    eventType = 'click';
    source = source || 'boutique';
  }

  if (!eventType) {
    return NextResponse.json(
      { error: 'event invalide (view ou boutique_click attendu)' },
      { status: 400, headers: cors }
    );
  }

  try {
    await trackOffreEteEvent({
      eventType,
      source,
      referrer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      ip: clientIp(request),
    });
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: cors });
  }
}
