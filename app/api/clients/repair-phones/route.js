import { NextResponse } from 'next/server';
import {
  repairPortetClientPhonesInDb,
  repairPortetClientEmailsInDb,
  countValidFrenchPhones,
} from '../../../lib/repairClientPhones';
import { getSession } from '../../../lib/session';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const [phones, emails] = await Promise.all([
      repairPortetClientPhonesInDb(),
      repairPortetClientEmailsInDb(),
    ]);
    const withPhone = await countValidFrenchPhones();
    return NextResponse.json({ success: true, phones, emails, withPhone });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
