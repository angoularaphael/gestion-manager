import { NextResponse } from 'next/server';
import { runCampaignHourlyTick } from '../../../../lib/campaignHourly';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

function authorized(request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get('x-cron-secret') === secret;
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const result = await runCampaignHourlyTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron/campaign-hourly]', e);
    return NextResponse.json({ error: e.message || 'Erreur cron' }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
