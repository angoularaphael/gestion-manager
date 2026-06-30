import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import {
  getCampaignPlanningStats,
  runCampaignHourlyTick,
} from '../../../../lib/campaignHourly';
import {
  setCampaignActive,
  setWarmupPhase,
  updateCampaignSettings,
} from '../../../../lib/campaignSettings';

export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  const session = await getSession();
  if (!session) return json({ error: 'Non authentifié' }, 401);

  try {
    const stats = await getCampaignPlanningStats();
    return json(stats);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return json({ error: 'Non authentifié' }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = body.action || 'stats';

  try {
    if (action === 'start') {
      await setCampaignActive(true);
      return json({ ok: true, message: 'Campagne horaire activée (cron chaque heure).' });
    }
    if (action === 'pause') {
      await setCampaignActive(false);
      return json({ ok: true, message: 'Campagne mise en pause.' });
    }
    if (action === 'warmup') {
      const phase = body.phase;
      await setWarmupPhase(phase);
      return json({ ok: true, phase });
    }
    if (action === 'run_now') {
      const result = await runCampaignHourlyTick();
      return json({ ok: true, result });
    }
    if (action === 'reset_hour') {
      await updateCampaignSettings({
        emails_sent_this_hour: 0,
        hour_window_start: new Date().toISOString(),
      });
      return json({ ok: true });
    }

    const stats = await getCampaignPlanningStats();
    return json(stats);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
