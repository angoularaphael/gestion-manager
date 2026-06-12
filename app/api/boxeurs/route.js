import { NextResponse } from 'next/server';
import { createBoxeurInDb, fetchBoxeursFromDb } from '../../../lib/boxeurs';
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

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  try {
    const boxeur = await createBoxeurInDb(body);
    return NextResponse.json({ success: true, boxeur });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
