import { NextResponse } from 'next/server';
import { probeBot } from '../../../../lib/bot';
import { getSession } from '../../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const health = await probeBot();
  return NextResponse.json(health);
}
