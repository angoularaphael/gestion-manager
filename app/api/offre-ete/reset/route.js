import { NextResponse } from 'next/server';
import { resetOffreEteStats } from '../../../../lib/offreEte';
import { isOffreEteResetAllowed } from '../../../../lib/offreEteConfig';
import { getSession } from '../../../../lib/session';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  if (!isOffreEteResetAllowed()) {
    return NextResponse.json({ error: 'Réinitialisation désactivée' }, { status: 403 });
  }

  try {
    await resetOffreEteStats();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
