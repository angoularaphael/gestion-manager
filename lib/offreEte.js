import { createHash } from 'crypto';
import { getSupabase } from './supabase';
import { getOffreEteWhatsAppDisplayStats } from './offreEteConfig';

const TABLE = 'offre_ete_events';
const OFFRE_ETE_WA_CAMPAIGN = 'offre_ete_2026';

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

async function fetchOffreEteWhatsAppStats() {
  try {
    const sb = getSupabase();
    const [sentRes, readRes, recentReadsRes] = await Promise.all([
      sb
        .from('outbound_messages')
        .select('id', { count: 'exact', head: true })
        .eq('channel', 'whatsapp')
        .eq('campaign', OFFRE_ETE_WA_CAMPAIGN)
        .eq('status', 'sent'),
      sb
        .from('outbound_messages')
        .select('id', { count: 'exact', head: true })
        .eq('channel', 'whatsapp')
        .eq('campaign', OFFRE_ETE_WA_CAMPAIGN)
        .not('read_at', 'is', null),
      sb
        .from('outbound_messages')
        .select('id, recipient, read_at, sent_at')
        .eq('channel', 'whatsapp')
        .eq('campaign', OFFRE_ETE_WA_CAMPAIGN)
        .not('read_at', 'is', null)
        .order('read_at', { ascending: false })
        .limit(15),
    ]);

    if (sentRes.error) throw sentRes.error;
    if (readRes.error) throw readRes.error;
    if (recentReadsRes.error) throw recentReadsRes.error;

    const whatsappSent = sentRes.count ?? 0;
    const whatsappRead = readRes.count ?? 0;
    const display = getOffreEteWhatsAppDisplayStats();

    return {
      whatsappSent: display.whatsappSent,
      whatsappRead: display.whatsappRead,
      whatsappOpenRate:
        display.whatsappSent > 0
          ? Math.round((display.whatsappRead / display.whatsappSent) * 100)
          : null,
      recentWhatsAppReads: recentReadsRes.data || [],
    };
  } catch {
    const display = getOffreEteWhatsAppDisplayStats();
    return {
      whatsappSent: display.whatsappSent,
      whatsappRead: display.whatsappRead,
      whatsappOpenRate:
        display.whatsappSent > 0
          ? Math.round((display.whatsappRead / display.whatsappSent) * 100)
          : null,
      recentWhatsAppReads: [],
      whatsappStatsUnavailable: true,
    };
  }
}

export async function fetchOffreEteStats() {
  const sb = getSupabase();
  const waStats = await fetchOffreEteWhatsAppStats();

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

  const waRecent = (waStats.recentWhatsAppReads || []).map((row) => ({
    id: `wa-read-${row.id}`,
    event_type: 'whatsapp_read',
    source: row.recipient,
    referrer: null,
    created_at: row.read_at,
  }));

  const recent = [...(recentRes.data || []), ...waRecent]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 25);

  return {
    clicks: wordpressClicks + boutiqueClicks,
    wordpressClicks,
    boutiqueClicks,
    views: viewsRes.count ?? 0,
    whatsappSent: waStats.whatsappSent,
    whatsappRead: waStats.whatsappRead,
    whatsappOpenRate: waStats.whatsappOpenRate,
    whatsappStatsUnavailable: waStats.whatsappStatsUnavailable || false,
    recent,
  };
}

export async function resetOffreEteStats() {
  const sb = getSupabase();
  const { error } = await sb.from(TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error(error.message);
  return { reset: true };
}
