import { NextResponse } from 'next/server';
import { getSupabase } from '../../../../lib/supabase';
import { normalizePhone } from '../../../../lib/phone';
import { tunnelCorsHeaders } from '../../../../lib/tunnelCors';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: tunnelCorsHeaders(request) });
}

function cleanText(v, max = 120) {
  return String(v || '')
    .trim()
    .slice(0, max) || null;
}

function normalizeEmail(email) {
  const e = String(email || '')
    .trim()
    .toLowerCase();
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

/** POST — lead séance d'essai gratuite ou intérêt offre 259€ */
export async function POST(request) {
  const cors = tunnelCorsHeaders(request);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400, headers: cors });
  }

  const tunnel = body.tunnel === 'offre_259' ? 'offre_259' : 'seance_essai';
  const prenom = cleanText(body.prenom);
  const nom = cleanText(body.nom);
  const telephone = normalizePhone(body.telephone);
  const email = normalizeEmail(body.email);
  const salle = cleanText(body.salle, 80);

  if (!prenom || !telephone) {
    return NextResponse.json(
      { error: 'Prénom et téléphone requis' },
      { status: 400, headers: cors }
    );
  }

  const sb = getSupabase();
  const { data, error } = await sb
    .from('tunnel_leads')
    .insert({
      tunnel,
      prenom,
      nom,
      telephone,
      email,
      salle,
      meta: { source: body.source || tunnel },
    })
    .select('id')
    .single();

  if (error) {
    if (/tunnel_leads/i.test(error.message)) {
      return NextResponse.json(
        { error: 'Table tunnel_leads absente — migration 015_tunnel_leads.sql' },
        { status: 503, headers: cors }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  }

  return NextResponse.json(
    {
      ok: true,
      lead_id: data.id,
      message:
        tunnel === 'seance_essai'
          ? 'Merci ! Nous vous recontactons pour planifier votre séance gratuite.'
          : 'Merci ! Nous vous recontactons pour l\'offre 259€.',
    },
    { headers: cors }
  );
}
