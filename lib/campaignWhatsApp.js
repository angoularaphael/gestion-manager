import { getSupabase } from './supabase';
import { normalizePhone } from './phone';
import { botFetch, probeBotAt } from './bot';
import {
  CAMPAIGN_WA_TAG,
  MESSAGES_PER_BOT_PER_HOUR,
  getCampaignBots,
} from './campaignBots';

export async function fetchCampaignSentCount(campaign = CAMPAIGN_WA_TAG) {
  const sb = getSupabase();
  const { count, error } = await sb
    .from('outbound_messages')
    .select('id', { count: 'exact', head: true })
    .eq('campaign', campaign)
    .eq('channel', 'whatsapp')
    .eq('status', 'sent');
  if (error) throw error;
  return count || 0;
}

async function fetchClientsWithPhoneCount() {
  const sb = getSupabase();
  const { count, error } = await sb
    .from('portet_clients')
    .select('id', { count: 'exact', head: true })
    .not('telephone', 'is', null)
    .neq('telephone', '');
  if (error) throw error;
  return count || 0;
}

export async function fetchCampaignSentPhones(campaign = CAMPAIGN_WA_TAG) {
  const sb = getSupabase();
  const sent = new Set();
  const pageSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await sb
      .from('outbound_messages')
      .select('recipient')
      .eq('campaign', campaign)
      .eq('channel', 'whatsapp')
      .in('status', ['sent', 'pending'])
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    for (const row of data) {
      const phone = normalizePhone(row.recipient);
      if (phone) sent.add(phone);
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return sent;
}

export async function fetchPendingCampaignClients({ sentPhones, limit = 5000 } = {}) {
  const sb = getSupabase();
  const sent = sentPhones || (await fetchCampaignSentPhones());
  const pending = [];
  const pageSize = 500;
  let from = 0;

  for (;;) {
    const { data, error } = await sb
      .from('portet_clients')
      .select('id, prenom, nom, telephone, salle')
      .not('telephone', 'is', null)
      .neq('telephone', '')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const client of data) {
      const phone = normalizePhone(client.telephone);
      if (!phone || sent.has(phone)) continue;
      pending.push(client);
      if (pending.length >= limit) return pending;
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return pending;
}

export async function probeCampaignBots() {
  const bots = getCampaignBots();
  const results = await Promise.all(
    bots.map(async (bot) => {
      if (!bot.configured) {
        return {
          ...bot,
          reachable: false,
          connected: false,
          connecting: false,
          error: `URL manquante (${bot.envKey})`,
        };
      }
      const probe = await probeBotAt(bot.url);
      return { ...bot, ...probe };
    })
  );
  return results;
}

/**
 * Répartit les clients sur les bots connectés — max 13/h par bot, jamais 2 bots sur le même numéro.
 */
export async function dispatchCampaignWhatsAppWave({ testOnly = false } = {}) {
  const bots = await probeCampaignBots();
  const connected = bots.filter((b) => b.configured && b.reachable && b.connected);
  if (!connected.length) {
    throw new Error('Aucun bot WhatsApp connecté — configurez et scannez les QR sur /admin/campagne-whatsapp');
  }

  if (testOnly) {
    const bot = connected[0];
    const data = await botFetch('/api/send-to-clients', {
      method: 'POST',
      baseUrl: bot.url,
      body: {
        test_only: true,
        channels: ['whatsapp'],
        offre_ete_whatsapp: true,
        message: 'offre-ete-whatsapp',
      },
    });
    return {
      testOnly: true,
      bots: [{ slug: bot.slug, label: bot.label, ...data }],
      pendingRemaining: null,
      dispatchedTotal: 1,
    };
  }

  const sentPhones = await fetchCampaignSentPhones();
  const needed = connected.length * MESSAGES_PER_BOT_PER_HOUR;
  const pending = await fetchPendingCampaignClients({ sentPhones, limit: needed + 20 });
  if (!pending.length) {
    return {
      bots: [],
      pendingRemaining: 0,
      dispatchedTotal: 0,
      warnings: ['Tous les clients avec téléphone ont déjà reçu la campagne WhatsApp.'],
    };
  }

  let offset = 0;
  const dispatched = [];
  const warnings = [];

  for (const bot of connected) {
    const batch = pending.slice(offset, offset + MESSAGES_PER_BOT_PER_HOUR);
    offset += MESSAGES_PER_BOT_PER_HOUR;
    if (!batch.length) break;

    try {
      const data = await botFetch('/api/send-to-clients', {
        method: 'POST',
        baseUrl: bot.url,
        body: {
          client_ids: batch.map((c) => c.id),
          channels: ['whatsapp'],
          offre_ete_whatsapp: true,
          message: 'offre-ete-whatsapp',
        },
        timeoutMs: 12000,
      });
      dispatched.push({
        slug: bot.slug,
        label: bot.label,
        batchSize: batch.length,
        ...data,
      });
      if (data.warnings?.length) warnings.push(...data.warnings.map((w) => `[${bot.label}] ${w}`));
    } catch (err) {
      warnings.push(`[${bot.label}] ${err.message || 'Échec envoi'}`);
      dispatched.push({
        slug: bot.slug,
        label: bot.label,
        batchSize: batch.length,
        error: err.message || 'Échec envoi',
      });
    }
  }

  return {
    bots: dispatched,
    pendingRemaining: Math.max(0, pending.length - offset),
    dispatchedTotal: dispatched.reduce((n, b) => n + (b.batchSize || 0), 0),
    connectedBots: connected.length,
    warnings,
  };
}

export async function fetchCampaignConversations({ limit = 80 } = {}) {
  const sb = getSupabase();

  const { data: outbound, error: outErr } = await sb
    .from('outbound_messages')
    .select(
      'id, recipient, body, status, sent_at, read_at, bot_instance, client_id, created_at, error'
    )
    .eq('campaign', CAMPAIGN_WA_TAG)
    .eq('channel', 'whatsapp')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (outErr) throw outErr;

  const { data: inbound, error: inErr } = await sb
    .from('inbound_messages')
    .select('id, from_phone, from_name, body, is_read, received_at')
    .order('received_at', { ascending: false })
    .limit(limit);

  if (inErr) throw inErr;

  const clientIds = [...new Set((outbound || []).map((m) => m.client_id).filter(Boolean))];
  let clientsById = {};
  if (clientIds.length) {
    const { data: clients } = await sb
      .from('portet_clients')
      .select('id, prenom, nom, telephone, salle')
      .in('id', clientIds);
    clientsById = Object.fromEntries((clients || []).map((c) => [c.id, c]));
  }

  return {
    outbound: (outbound || []).map((row) => ({
      ...row,
      client: row.client_id ? clientsById[row.client_id] || null : null,
      direction: 'out',
    })),
    inbound: (inbound || []).map((row) => ({
      ...row,
      direction: 'in',
    })),
  };
}

export async function getCampaignWhatsAppStats({ includeBots = false } = {}) {
  const [sentCount, clientsWithPhone] = await Promise.all([
    fetchCampaignSentCount(),
    fetchClientsWithPhoneCount(),
  ]);
  const pendingCount = Math.max(0, clientsWithPhone - sentCount);
  const result = {
    campaign: CAMPAIGN_WA_TAG,
    sentCount,
    pendingCount,
    messagesPerBotPerHour: MESSAGES_PER_BOT_PER_HOUR,
    maxPerHour: MESSAGES_PER_BOT_PER_HOUR * getCampaignBots().filter((b) => b.configured).length,
  };
  if (includeBots) {
    result.bots = await probeCampaignBots();
    result.maxPerHour = MESSAGES_PER_BOT_PER_HOUR * result.bots.filter((b) => b.connected).length;
  }
  return result;
}
