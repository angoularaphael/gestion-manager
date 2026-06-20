import { createHash } from 'crypto';
import { getSupabase } from './supabase';

const TABLE = 'offre_ete_events';

function hashIp(ip) {
  if (!ip) return null;
  return createHash('sha256').update(`${ip}|offre-ete-2026`).digest('hex').slice(0, 16);
}

export async function trackOffreEteEvent({
  eventType,
  source = null,
  referrer = null,
  userAgent = null,
  ip = null,
}) {
  const sb = getSupabase();
  const { error } = await sb.from(TABLE).insert({
    event_type: eventType,
    source,
    referrer: referrer ? String(referrer).slice(0, 512) : null,
    user_agent: userAgent ? String(userAgent).slice(0, 512) : null,
    ip_hash: hashIp(ip),
  });
  if (error) throw new Error(error.message);
}

export async function fetchOffreEteStats() {
  const sb = getSupabase();

  const [wordpressClicksRes, boutiqueClicksRes, viewsRes, recentRes] = await Promise.all([
    sb
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'click')
      .or('source.eq.wordpress,source.is.null'),
    sb
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'click')
      .like('source', 'boutique%'),
    sb.from(TABLE).select('id', { count: 'exact', head: true }).eq('event_type', 'view'),
    sb
      .from(TABLE)
      .select('id, event_type, source, referrer, created_at')
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  if (wordpressClicksRes.error) throw new Error(wordpressClicksRes.error.message);
  if (boutiqueClicksRes.error) throw new Error(boutiqueClicksRes.error.message);
  if (viewsRes.error) throw new Error(viewsRes.error.message);
  if (recentRes.error) throw new Error(recentRes.error.message);

  const wordpressClicks = wordpressClicksRes.count ?? 0;
  const boutiqueClicks = boutiqueClicksRes.count ?? 0;

  return {
    clicks: wordpressClicks + boutiqueClicks,
    wordpressClicks,
    boutiqueClicks,
    views: viewsRes.count ?? 0,
    recent: recentRes.data || [],
  };
}

export async function resetOffreEteStats() {
  const sb = getSupabase();
  const { error } = await sb.from(TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error(error.message);
  return { reset: true };
}
