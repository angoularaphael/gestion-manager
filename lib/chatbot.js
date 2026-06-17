import { createHash } from 'crypto';
import { getSupabase } from './supabase';
import { fetchRecentClients, upsertClientFromChatbotLead } from './clients';

const EVENTS_TABLE = 'chatbot_events';
const LEADS_TABLE = 'chatbot_leads';

function hashIp(ip) {
  if (!ip) return null;
  return createHash('sha256').update(`${ip}|chatbot-portet`).digest('hex').slice(0, 16);
}

export async function trackChatbotEvent({
  eventType,
  sessionId = null,
  faqQuestion = null,
  source = 'portet',
  referrer = null,
  userAgent = null,
  ip = null,
}) {
  const sb = getSupabase();
  const { error } = await sb.from(EVENTS_TABLE).insert({
    event_type: eventType,
    session_id: sessionId,
    faq_question: faqQuestion ? String(faqQuestion).slice(0, 512) : null,
    source,
    referrer: referrer ? String(referrer).slice(0, 512) : null,
    user_agent: userAgent ? String(userAgent).slice(0, 512) : null,
    ip_hash: hashIp(ip),
  });
  if (error) throw new Error(error.message);
}

export async function createChatbotLead({
  sessionId = null,
  name = null,
  prenom = null,
  nom = null,
  email = null,
  phone = null,
  salle = null,
  metier = null,
  message = null,
  recontactRequested = false,
  source = 'portet',
}) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(LEADS_TABLE)
    .insert({
      session_id: sessionId,
      name: name ? String(name).slice(0, 200) : null,
      email: email ? String(email).slice(0, 320) : null,
      phone: phone ? String(phone).slice(0, 40) : null,
      metier: metier ? String(metier).slice(0, 200) : null,
      message: message ? String(message).slice(0, 4000) : null,
      recontact_requested: !!recontactRequested,
      source,
    })
    .select('id, created_at')
    .single();
  if (error) throw new Error(error.message);
  try {
    await upsertClientFromChatbotLead({
      name,
      prenom,
      nom,
      email,
      phone,
      salle,
      metier,
      message,
      recontact_requested: !!recontactRequested,
      id: data.id,
      created_at: data.created_at,
    });
  } catch (syncErr) {
    console.error('[chatbot] client upsert failed:', syncErr.message);
  }
  return data;
}

export async function fetchChatbotStats() {
  const sb = getSupabase();

  const [startedRes, leadsRes, faqHitRes, faqMissRes, escalationRes, leadsListRes, recentClientsRes] =
    await Promise.all([
      sb.from(EVENTS_TABLE).select('id', { count: 'exact', head: true }).eq('event_type', 'chat_started'),
      sb.from(EVENTS_TABLE).select('id', { count: 'exact', head: true }).eq('event_type', 'lead_collected'),
      sb.from(EVENTS_TABLE).select('id', { count: 'exact', head: true }).eq('event_type', 'faq_hit'),
      sb.from(EVENTS_TABLE).select('id', { count: 'exact', head: true }).eq('event_type', 'faq_miss'),
      sb.from(EVENTS_TABLE).select('id', { count: 'exact', head: true }).eq('event_type', 'escalation'),
      sb
        .from(LEADS_TABLE)
        .select(
          'id, session_id, name, email, phone, metier, message, recontact_requested, source, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(100),
      fetchRecentClients(25).catch(() => []),
    ]);

  const errors = [
    startedRes.error,
    leadsRes.error,
    faqHitRes.error,
    faqMissRes.error,
    escalationRes.error,
    leadsListRes.error,
  ].filter(Boolean);
  if (errors.length) throw new Error(errors[0].message);

  return {
    chatsStarted: startedRes.count ?? 0,
    leadsCollected: leadsRes.count ?? 0,
    faqHits: faqHitRes.count ?? 0,
    faqMisses: faqMissRes.count ?? 0,
    escalations: escalationRes.count ?? 0,
    leads: leadsListRes.data || [],
    recentClients: Array.isArray(recentClientsRes) ? recentClientsRes : [],
  };
}

export async function resetChatbotStats() {
  const sb = getSupabase();
  const sentinel = '00000000-0000-0000-0000-000000000000';
  const [evErr, leadErr] = await Promise.all([
    sb.from(EVENTS_TABLE).delete().neq('id', sentinel),
    sb.from(LEADS_TABLE).delete().neq('id', sentinel),
  ]);
  if (evErr.error) throw new Error(evErr.error.message);
  if (leadErr.error) throw new Error(leadErr.error.message);
  return { reset: true };
}
