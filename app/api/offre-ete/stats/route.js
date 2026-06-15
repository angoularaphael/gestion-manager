import { NextResponse } from 'next/server';
import { fetchOffreEteStats } from '../../../../lib/offreEte';
import { isOffreEteResetAllowed } from '../../../../lib/offreEteConfig';
import { getSession } from '../../../../lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const stats = await fetchOffreEteStats();
    return NextResponse.json({
      ...stats,
      allowReset: isOffreEteResetAllowed(),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
