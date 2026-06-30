import { NextResponse } from 'next/server';
import { getSession } from '../../../../../../lib/session';
import { apiError } from '../../../../../../lib/apiJson';
import { getCampaignBot } from '../../../../../../lib/campaignBots';
import { botFetch, probeBotAt } from '../../../../../../lib/bot';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  try {
    const bot = getCampaignBot(params.slug);
    if (!bot) return NextResponse.json({ error: 'Bot inconnu' }, { status: 404 });
    if (!bot.configured) {
      return NextResponse.json({
        slug: bot.slug,
        label: bot.label,
        configured: false,
        connected: false,
        error: `Variable ${bot.envKey} ou ${bot.comptaEnvKey} manquante sur Vercel (voir compta-boxing)`,
      });
    }
    const status = await probeBotAt(bot.url);
    return NextResponse.json({ slug: bot.slug, label: bot.label, configured: true, ...status });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  try {
    const bot = getCampaignBot(params.slug);
    if (!bot?.configured) {
      return NextResponse.json({ error: 'Bot non configuré' }, { status: 400 });
    }

    const action = new URL(request.url).searchParams.get('action');
    const routes = { start: '/api/start', logout: '/api/logout' };
    const botPath = routes[action];
    if (!botPath) {
      return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const data = await botFetch(botPath, {
      method: 'POST',
      baseUrl: bot.url,
      body: body || {},
      timeoutMs: action === 'logout' ? 12000 : 10000,
    });
    return NextResponse.json({ slug: bot.slug, ...data });
  } catch (err) {
    return apiError(err);
  }
}
