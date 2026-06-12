import { NextResponse } from 'next/server';
import { createUser, deleteUser } from '../../../lib/auth';
import { deliverCredentials } from '../../../lib/credentialsDelivery';
import { getSession } from '../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 90;

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const sendEmail = Boolean(body.send_email);
  const sendWhatsApp = Boolean(body.send_whatsapp);
  const password = String(body.password || '');

  let user;
  try {
    user = await createUser(
      {
        email: body.email,
        password,
        name: body.name,
        phone: body.phone,
      },
      session.role
    );
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Erreur création' }, { status: 400 });
  }

  let delivery = null;
  if (sendEmail || sendWhatsApp) {
    try {
      delivery = await deliverCredentials({
        email: user.email,
        password,
        name: user.name,
        phone: user.phone,
        sendEmail,
        sendWhatsApp,
      });
    } catch (e) {
      delivery = {
        email: null,
        whatsapp: null,
        errors: [{ channel: 'delivery', error: e.message || 'Envoi impossible' }],
      };
    }
  }

  return NextResponse.json({ success: true, user, delivery });
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const result = await deleteUser(body.email, session.email, session.role);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
