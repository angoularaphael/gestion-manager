import { NextResponse } from 'next/server';
import { getSession } from '../../../../../../../lib/session';
import { getCampaignBot } from '../../../../../../../lib/campaignBots';
import { botFetch } from '../../../../../../../lib/bot';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/** Image QR — évite un JSON énorme sur /bots/[slug] (limite Vercel Hobby). */
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const bot = getCampaignBot(params.slug);
  if (!bot?.configured) {
    return NextResponse.json({ error: 'Bot non configuré' }, { status: 400 });
  }

  try {
    const data = await botFetch('/api/status', { baseUrl: bot.url, timeoutMs: 8000 });
    const qr = data?.qr;
    if (!qr || data?.connected) {
      return NextResponse.json({ error: 'QR indisponible' }, { status: 404 });
    }
    const match = String(qr).match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: 'Format QR invalide' }, { status: 502 });
    }
    const [, type, b64] = match;
    const buf = Buffer.from(b64, 'base64');
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': `image/${type}`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Bot inaccessible' }, { status: 502 });
  }
}
