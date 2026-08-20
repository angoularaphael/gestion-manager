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
import { resolveCampaignKind } from '../../../../lib/campaigns';

export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function kindFrom(request, body = {}) {
  const q = new URL(request.url).searchParams.get('kind');
  const raw = body.kind || q;
  if (!raw) return undefined;
  return resolveCampaignKind(raw);
}

export async function GET(request) {
  const session = await getSession();
  if (!session) return json({ error: 'Non authentifié' }, 401);

  try {
    const stats = await getCampaignPlanningStats(kindFrom(request));
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
  const kind = kindFrom(request, body);

  try {
    if (action === 'start') {
      await setCampaignActive(true, kind);
      return json({
        ok: true,
        kind,
        message: `Campagne horaire activée (${kind === 'offres' ? 'offres promo' : 'Com Balma'}).`,
      });
    }
    if (action === 'pause' || action === 'stop') {
      await setCampaignActive(false);
      return json({ ok: true, message: 'Campagne arrêtée.' });
    }
    if (action === 'reset') {
      const { resetCampaignTracking } = await import('../../../../lib/campaignOutbound');
      await setCampaignActive(false, kind);
      const reset = await resetCampaignTracking(kind || 'balma');
      return json({
        ok: true,
        ...reset,
        message: 'Campagne arrêtée et réinitialisée — les destinataires peuvent être recontactés.',
      });
    }
    if (action === 'warmup') {
      const phase = body.phase;
      await setWarmupPhase(phase);
      return json({ ok: true, phase });
    }
    if (action === 'email_test') {
      const { sendCampaignEmailTest } = await import('../../../../lib/campaignEmail');
      const result = await sendCampaignEmailTest(kind);
      return json({ ok: true, test: true, kind, result, message: 'Test e-mail envoyé (client existant).' });
    }
    if (action === 'email_wave') {
      const { sendCampaignEmailWave } = await import('../../../../lib/campaignEmail');
      const result = await sendCampaignEmailWave(kind);
      return json({
        ok: true,
        kind,
        result,
        message: result.empty
          ? 'Aucun e-mail restant pour cette campagne.'
          : `Vague e-mail : ${result.email?.sent || 0} envoyé(s).`,
      });
    }
    if (action === 'run_now') {
      const result = await runCampaignHourlyTick(kind);
      return json({ ok: true, result, message: 'Vague e-mail / WhatsApp lancée.' });
    }
    if (action === 'reset_hour') {
      await updateCampaignSettings({
        emails_sent_this_hour: 0,
        hour_window_start: new Date().toISOString(),
      });
      return json({ ok: true });
    }

    const stats = await getCampaignPlanningStats(kind);
    return json(stats);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
