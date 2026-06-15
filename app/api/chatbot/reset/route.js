import { NextResponse } from 'next/server';
import { resetChatbotStats } from '../../../../lib/chatbot';
import { getSession } from '../../../../lib/session';
import { isChatbotResetAllowed } from '../../../../lib/chatbotConfig';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  if (!isChatbotResetAllowed()) {
    return NextResponse.json({ error: 'Réinitialisation désactivée' }, { status: 403 });
  }

  try {
    await resetChatbotStats();
    return NextResponse.json({ ok: true, reset: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
