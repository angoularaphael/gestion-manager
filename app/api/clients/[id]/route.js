import { NextResponse } from 'next/server';
import { deleteClientInDb, fetchClientById, updateClientInDb } from '../../../../lib/clients';
import { getSession } from '../../../../lib/session';

export async function GET(_request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const client = await fetchClientById(params.id);
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    return NextResponse.json({ client });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  try {
    const client = await updateClientInDb(params.id, body);
    return NextResponse.json({ success: true, client });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    await deleteClientInDb(params.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
