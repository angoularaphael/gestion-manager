import { NextResponse } from 'next/server';
import { getEntraineursPortetList, getEntraineursPortetMeta } from '../../../lib/entraineursPortet';

export async function GET() {
  try {
    const meta = getEntraineursPortetMeta();
    const entraineurs = getEntraineursPortetList();
    return NextResponse.json({ ...meta, entraineurs });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erreur lecture équipe' }, 500);
  }
}
