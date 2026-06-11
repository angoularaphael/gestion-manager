import { NextResponse } from 'next/server';
import { fetchPromoteurStatsFromDb } from '../../../../lib/promoteurs';
import { getSession } from '../../../../lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const stats = await fetchPromoteurStatsFromDb();
    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
