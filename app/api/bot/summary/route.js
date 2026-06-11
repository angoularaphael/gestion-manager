import { NextResponse } from 'next/server';
import { botFetch, getBotConfig } from '../../../../lib/bot';
import { getSession } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const config = getBotConfig();
  const summary = {
    config,
    whatsapp: { loading: false, connected: false, connecting: false, error: null },
    email: { loading: false, configured: false, error: null },
  };

  if (!config.configured) {
    summary.whatsapp.error = 'URL du bot non configurée sur Vercel (WHATSAPP_BOT_URL).';
    summary.email.error = 'Configuration incomplète sur Vercel.';
    return NextResponse.json(summary);
  }

  try {
    const status = await botFetch('/api/status');
    summary.whatsapp.connected = Boolean(status.connected);
    summary.whatsapp.connecting = Boolean(status.connecting);
  } catch (e) {
    summary.whatsapp.error = e.message;
  }

  if (!config.hasSecret) {
    summary.email.error = 'SITE_API_SECRET manquant sur Vercel.';
  } else {
    try {
      const email = await botFetch('/api/email-status');
      summary.email.configured = Boolean(email?.configured);
    } catch (e) {
      summary.email.error = e.message;
    }
  }

  return NextResponse.json(summary);
}
