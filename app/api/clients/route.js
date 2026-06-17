import { NextResponse } from 'next/server';
import { createClientInDb, fetchClientsFromDb } from '../../../lib/clients';
import { getSession } from '../../../lib/session';

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const source = searchParams.get('source') || '';
  const salle = searchParams.get('salle') || '';

  try {
    const clients = await fetchClientsFromDb({ search, source, salle });
    return NextResponse.json({ clients });
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
    const client = await createClientInDb(body);
    return NextResponse.json({ success: true, client });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
