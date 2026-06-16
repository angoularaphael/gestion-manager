import { NextResponse } from 'next/server';
import { offreEteCorsHeaders } from '../../../../lib/offreEteCors';
import { sendOffreEteFaqContact, validateFaqContactBody } from '../../../../lib/offreEteFaqContact';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: offreEteCorsHeaders(request) });
}

/** POST — question FAQ depuis la landing Offre Été (public, CORS boxingcenter.fr). */
export async function POST(request) {
  const cors = offreEteCorsHeaders(request);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400, headers: cors });
  }

  const validated = validateFaqContactBody(body);
  if (validated.error) {
    const status = validated.error === 'Requête refusée' ? 400 : 400;
    return NextResponse.json({ error: validated.error }, { status, headers: cors });
  }

  try {
    await sendOffreEteFaqContact(validated.data);
    return NextResponse.json({ ok: true }, { headers: cors });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Envoi impossible' }, { status: 500, headers: cors });
  }
}
