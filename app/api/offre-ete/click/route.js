import { NextResponse } from 'next/server';
import { trackOffreEteEvent } from '../../../../lib/offreEte';
import { OFFRE_ETE_LANDING_URL } from '../../../../lib/offreEteConfig';

function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

function safeRedirectUrl(request, raw) {
  const fallback = OFFRE_ETE_LANDING_URL;
  if (!raw) return fallback;
  try {
    const target = new URL(raw, request.url);
    const origin = new URL(request.url).origin;
    if (target.origin !== origin) return fallback;
    return target.toString();
  } catch {
    return fallback;
  }
}

/** GET — enregistre un clic puis redirige vers la landing (WordPress « En savoir plus »). */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const redirect = safeRedirectUrl(request, searchParams.get('redirect'));
  const source = searchParams.get('source') || 'wordpress';

  try {
    await trackOffreEteEvent({
      eventType: 'click',
      source,
      referrer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      ip: clientIp(request),
    });
  } catch {
    /* redirection même si le tracking échoue */
  }

  return NextResponse.redirect(redirect, { status: 302 });
}
