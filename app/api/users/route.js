import { NextResponse } from 'next/server';
import { createUser } from '../../../lib/auth';
import { getSession } from '../../../lib/session';

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const user = await createUser(body, session.role);
    return NextResponse.json({ success: true, user });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
