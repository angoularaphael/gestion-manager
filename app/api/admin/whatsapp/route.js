import { NextResponse } from 'next/server';
import { botFetch } from '../../../../lib/bot';
import { getSession } from '../../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Proxy Vercel → bot (même modèle que NYC Cookies /api/admin/whatsapp). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    return NextResponse.json(await botFetch('/api/status'));
  } catch (e) {
    const message = e.message || 'Bot inaccessible';
    return NextResponse.json({
      connected: false,
      connecting: false,
      qr: null,
      pairingCode: null,
      qrError: null,
      error: message,
    });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const action = new URL(request.url).searchParams.get('action');
  const routes = {
    start: '/api/start',
    logout: '/api/logout',
  };

  const botPath = routes[action];
  if (!botPath) {
    return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
  }

  let body = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  try {
    return NextResponse.json(await botFetch(botPath, { method: 'POST', body: body || {} }));
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Bot inaccessible' }, { status: 502 });
  }
}
