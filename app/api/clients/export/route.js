import { NextResponse } from 'next/server';
import { fetchClientsFromDb } from '../../../lib/clients';
import { clientsToCsv } from '../../../lib/clientCsv';
import { getSession } from '../../../lib/session';

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || '';
  const salle = searchParams.get('salle') || '';

  try {
    const clients = await fetchClientsFromDb({ source, salle });
    const csv = clientsToCsv(clients);
    const filename = `clients-portet-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
