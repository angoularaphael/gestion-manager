import { NextResponse } from 'next/server';
import { getGroupeChabaneContacts, getGroupeChabaneMeta } from '../../../lib/groupeChabane';
import { getSession } from '../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  try {
    return NextResponse.json({
      ...getGroupeChabaneMeta(),
      contacts: getGroupeChabaneContacts(),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
