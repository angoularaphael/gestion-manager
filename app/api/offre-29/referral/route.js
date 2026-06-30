import { NextResponse } from 'next/server';
import { getSupabase } from '../../../../lib/supabase';
import { normalizePhone } from '../../../../lib/phone';
import { sendReferralWhatsAppToPote } from '../../../../lib/referralWhatsApp';
import { tunnelCorsHeaders } from '../../../../lib/tunnelCors';

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: tunnelCorsHeaders(request) });
}

function cleanText(v, max = 120) {
  return String(v || '')
    .trim()
    .slice(0, max) || null;
}

/** POST — inscription offre 29€ + notification WA au pote */
export async function POST(request) {
  const cors = tunnelCorsHeaders(request);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400, headers: cors });
  }

  const referrerPrenom = cleanText(body.prenom || body.referrer_prenom);
  const referrerNom = cleanText(body.nom || body.referrer_nom);
  const referrerPhone = normalizePhone(body.telephone || body.referrer_phone);
  const potePrenom = cleanText(body.pote_prenom || body.friend_prenom);
  const poteNom = cleanText(body.pote_nom || body.friend_nom);
  const potePhone = normalizePhone(body.pote_telephone || body.friend_phone);

  if (!referrerPrenom || !referrerPhone) {
    return NextResponse.json(
      { error: 'Votre prénom et téléphone sont requis' },
      { status: 400, headers: cors }
    );
  }
  if (!potePrenom || !potePhone) {
    return NextResponse.json(
      { error: 'Nom et téléphone de votre pote sont requis' },
      { status: 400, headers: cors }
    );
  }

  const sb = getSupabase();
  const row = {
    tunnel: 'offre_29',
    prenom: referrerPrenom,
    nom: referrerNom,
    telephone: referrerPhone,
    referrer_prenom: potePrenom,
    referrer_nom: poteNom,
    referrer_phone: potePhone,
    meta: { source: body.source || 'landing_29' },
  };

  const { data: lead, error: insertErr } = await sb.from('tunnel_leads').insert(row).select('id').single();

  if (insertErr) {
    if (/tunnel_leads/i.test(insertErr.message)) {
      return NextResponse.json(
        { error: 'Table tunnel_leads absente — migration 015_tunnel_leads.sql' },
        { status: 503, headers: cors }
      );
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500, headers: cors });
  }

  let whatsapp = { sent: false };
  try {
    await sendReferralWhatsAppToPote({
      potePhone,
      referrerPrenom,
      referrerNom,
      potePrenom,
    });
    whatsapp.sent = true;

    await sb.from('tunnel_leads').insert({
      tunnel: 'referral_pote',
      prenom: potePrenom,
      nom: poteNom,
      telephone: potePhone,
      referrer_prenom: referrerPrenom,
      referrer_nom: referrerNom,
      referrer_phone: referrerPhone,
      meta: { parent_lead_id: lead.id },
    });
  } catch (waErr) {
    whatsapp.error = waErr.message || 'WhatsApp indisponible';
  }

  return NextResponse.json(
    {
      ok: true,
      lead_id: lead.id,
      price_unlocked: 29,
      whatsapp,
      boutique_url:
        process.env.OFFRE_29_BOUTIQUE_URL ||
        'https://boutique.boxingcenter.fr/',
    },
    { headers: cors }
  );
}
