import { NextResponse } from 'next/server';
import { repairPortetClientPhonesInDb, countValidFrenchPhones } from '../../../lib/repairClientPhones';
import { getSession } from '../../../lib/session';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const result = await repairPortetClientPhonesInDb();
    const withPhone = await countValidFrenchPhones();
    return NextResponse.json({ success: true, ...result, withPhone });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
