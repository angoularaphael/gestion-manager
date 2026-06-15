import { NextResponse } from 'next/server';
import { fetchChatbotStats } from '../../../../lib/chatbot';
import { getSession } from '../../../../lib/session';
import { isChatbotResetAllowed } from '../../../../lib/chatbotConfig';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const stats = await fetchChatbotStats();
    return NextResponse.json({
      ...stats,
      allowReset: isChatbotResetAllowed(),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
