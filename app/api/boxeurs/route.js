import { NextResponse } from 'next/server';
import { fetchBoxeursFromDb } from '../../../lib/boxeurs';
import { getSession } from '../../../lib/session';

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const contactType = searchParams.get('contact_type') || searchParams.get('type') || '';
  const categorie = searchParams.get('categorie') || '';

  try {
    const boxeurs = await fetchBoxeursFromDb({ search, contactType, categorie });
    return NextResponse.json({ boxeurs });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
