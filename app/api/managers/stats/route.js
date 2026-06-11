import { NextResponse } from 'next/server';
import { fetchManagerStatsFromDb } from '../../../../lib/managers';
import { getSession } from '../../../../lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    return NextResponse.json(await fetchManagerStatsFromDb());
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
