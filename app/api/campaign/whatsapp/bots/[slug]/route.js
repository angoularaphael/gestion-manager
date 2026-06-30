import { NextResponse } from 'next/server';
import { getSession } from '../../../../../../lib/session';
import { apiError } from '../../../../../../lib/apiJson';
import { getCampaignBot } from '../../../../../../lib/campaignBots';
import {
  fetchCampaignBotAction,
  fetchCampaignBotStatus,
} from '../../../../../../lib/campaignBotStatus';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    const status = await fetchCampaignBotStatus(bot.url);
    return NextResponse.json({ slug: bot.slug, label: bot.label, ...status });
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
    if (!['start', 'stop', 'logout'].includes(action)) {
      return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await fetchCampaignBotAction(bot.url, action, body);
    return NextResponse.json({ slug: bot.slug, ...result });
  } catch (err) {
    return apiError(err);
  }
}
