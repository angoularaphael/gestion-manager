import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { apiError } from '../../../../lib/apiJson';
import {
  dispatchCampaignWhatsAppWave,
  fetchCampaignConversations,
  getCampaignWhatsAppStats,
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
    return NextResponse.json(await getCampaignWhatsAppStats());
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

    return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
  } catch (err) {
    return apiError(err);
  }
}
