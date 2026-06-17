import { NextResponse } from 'next/server';
import { importClientsFromCsvRows } from '../../../lib/clients';
import { parseClientCsv } from '../../../lib/clientCsv';
import { getSession } from '../../../lib/session';

export const maxDuration = 120;

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let text = '';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!file || typeof file.text !== 'function') {
        return NextResponse.json({ error: 'Fichier CSV requis' }, { status: 400 });
      }
      text = await file.text();
    } else {
      const body = await request.json();
      text = body.csv || body.text || '';
    }

    if (!String(text).trim()) {
      return NextResponse.json({ error: 'Contenu CSV vide' }, { status: 400 });
    }

    const rows = parseClientCsv(text);
    if (!rows.length) {
      return NextResponse.json({ error: 'Aucune ligne de données dans le CSV' }, { status: 400 });
    }

    const stats = await importClientsFromCsvRows(rows);
    return NextResponse.json({ success: true, totalRows: rows.length, ...stats });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
