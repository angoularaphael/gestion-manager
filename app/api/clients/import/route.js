import { NextResponse } from 'next/server';
import { importClientFieldsList } from '../../../../lib/clients';
import { parseClientImportFile } from '../../../../lib/clientCsv';
import { getSession } from '../../../../lib/session';

export const maxDuration = 120;

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let text = '';
    let filename = '';

    let fields = [];

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!file || typeof file.text !== 'function') {
        return NextResponse.json({ error: 'Fichier CSV ou XLS requis' }, { status: 400 });
      }
      filename = file.name || '';
      text = await file.text();
    } else {
      const body = await request.json();
      if (Array.isArray(body.fields) && body.fields.length) {
        fields = body.fields;
      } else {
        text = body.csv || body.text || '';
        filename = body.filename || '';
      }
    }

    if (!fields.length) {
      if (!String(text).trim()) {
        return NextResponse.json({ error: 'Contenu vide' }, { status: 400 });
      }
      fields = parseClientImportFile(text, filename);
    }

    if (!fields.length) {
      return NextResponse.json({ error: 'Aucune ligne de données' }, { status: 400 });
    }

    const stats = await importClientFieldsList(fields);
    return NextResponse.json({ success: true, totalRows: fields.length, ...stats });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
