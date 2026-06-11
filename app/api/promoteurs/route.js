import { NextResponse } from 'next/server';
import { fetchPromoteursFromDb } from '../../../lib/promoteurs';
import { getSession } from '../../../lib/session';

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const contactType = searchParams.get('contact_type') || searchParams.get('type') || '';

  try {
    const promoteurs = await fetchPromoteursFromDb({ search, contactType });
    return NextResponse.json({ promoteurs });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
