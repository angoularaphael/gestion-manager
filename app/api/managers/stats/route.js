import { NextResponse } from 'next/server';
import { fetchManagerStatsFromDb } from '../../../../lib/managers';
import { getSession } from '../../../../lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const stats = await fetchManagerStatsFromDb();
    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
