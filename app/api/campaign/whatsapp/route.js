import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { apiError } from '../../../../lib/apiJson';
import {
  dispatchCampaignWhatsAppWave,
  fetchCampaignConversations,
  fetchCampaignSentRecipients,
  getCampaignWhatsAppStats,
  resetCampaignWhatsAppTracking,
  clearCampaignDiscussions,
} from '../../../../lib/campaignWhatsApp';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  try {
    const view = new URL(request.url).searchParams.get('view');
    if (view === 'conversations') {
      const limit = Number(new URL(request.url).searchParams.get('limit') || 80);
      return NextResponse.json(await fetchCampaignConversations({ limit }));
    }
    if (view === 'sent') {
      const { searchParams } = new URL(request.url);
      return NextResponse.json(
        await fetchCampaignSentRecipients({
          page: Number(searchParams.get('page') || 1),
          limit: Number(searchParams.get('limit') || 50),
          status: searchParams.get('status') || 'sent',
        })
      );
    }
    return NextResponse.json(await getCampaignWhatsAppStats({ includeBots: false }));
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'dispatch';

    if (action === 'dispatch') {
      const result = await dispatchCampaignWhatsAppWave({
        testOnly: Boolean(body.test_only),
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'reset') {
      await resetCampaignWhatsAppTracking();
      return NextResponse.json({ ok: true, reset: true });
    }

    if (action === 'clear_discussions') {
      await clearCampaignDiscussions();
      return NextResponse.json({ ok: true, cleared: true });
    }

    return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
  } catch (err) {
    return apiError(err);
  }
}
