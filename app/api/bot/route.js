import { NextResponse } from 'next/server';
import { botFetch } from '../../../lib/bot';
import { getSession } from '../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const path = new URL(request.url).searchParams.get('path') || '/api/status';
  try {
    return NextResponse.json(await botFetch(path), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  try {
    const { path, body } = await request.json();
    return NextResponse.json(await botFetch(path, { method: 'POST', body }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
