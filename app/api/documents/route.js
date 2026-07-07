import { NextResponse } from 'next/server';
import { fetchDocuments, createDocument } from '../../../lib/documents';
import { getSession } from '../../../lib/session';

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const search = searchParams.get('search') || '';

  try {
    const documents = await fetchDocuments({ type, search });
    return NextResponse.json({ documents });
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
    const doc = await createDocument({ ...body, created_by: session.email });
    return NextResponse.json({ success: true, document: doc });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
