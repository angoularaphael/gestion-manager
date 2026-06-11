import { NextResponse } from 'next/server';
import { fetchBoxeurStatsFromDb } from '../../../../lib/boxeurs';
import { getSession } from '../../../../lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const stats = await fetchBoxeurStatsFromDb();
    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
