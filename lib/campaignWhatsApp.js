import { getSupabase } from './supabase';
import { normalizePhone } from './phone';
import { botFetch } from './bot';
import { fetchCampaignBotStatus } from './campaignBotStatus';
import { getTestSendPhone } from './testSendTargets';
import {
  CAMPAIGN_WA_TAG,
  CAMPAIGN_WA_WINDOW_MINUTES,
  MESSAGES_PER_BOT_PER_WAVE,
  getCampaignBots,
} from './campaignBots';

function clientLabel(client) {
  const full = [client.prenom, client.nom].filter(Boolean).join(' ').trim();
  return full || client.telephone || 'Client';
}

export async function fetchCampaignSentCount(campaign = CAMPAIGN_WA_TAG) {
  try {
    const sb = getSupabase();
    const { count, error } = await sb
      .from('outbound_messages')
      .select('id', { count: 'exact', head: true })
      .eq('campaign', campaign)
      .eq('channel', 'whatsapp')
      .eq('status', 'sent');
    if (error) throw error;
    return count || 0;
  } catch {
    return 0;
  }
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
      const probe = await fetchCampaignBotStatus(bot.url);
      return { ...bot, ...probe };
    })
  );
  return results;
}

/**
 * Répartit les clients sur les bots connectés — max 12/30 min par bot, jamais 2 bots sur le même numéro.
 */
export async function dispatchCampaignWhatsAppWave({
  testOnly = false,
  excludeClientIds = [],
} = {}) {
  const bots = await probeCampaignBots();
  const connected = bots.filter((b) => b.configured && b.reachable && b.connected);
  if (!connected.length) {
    throw new Error('Aucun bot WhatsApp connecté — configurez et scannez les QR sur /admin/campagne-whatsapp');
  }

  if (testOnly) {
    const bot = connected[0];
    const testPhone = getTestSendPhone();
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
      recipients: [
        {
          name: 'Test',
          phone: testPhone,
          bot: bot.label,
          status: 'envoyé',
        },
      ],
      pendingRemaining: null,
      dispatchedTotal: 1,
    };
  }

  const excludeIds = new Set((excludeClientIds || []).map(String));
  const sentPhones = await fetchCampaignSentPhones();
  const needed = connected.length * MESSAGES_PER_BOT_PER_WAVE;
  const pendingRaw = await fetchPendingCampaignClients({ sentPhones, limit: needed + 50 });
  const pending = pendingRaw.filter((c) => !excludeIds.has(String(c.id)));
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
  const recipients = [];
  const warnings = [];

  for (const bot of connected) {
    const batch = pending.slice(offset, offset + MESSAGES_PER_BOT_PER_WAVE);
    offset += MESSAGES_PER_BOT_PER_WAVE;
    if (!batch.length) break;

    for (const client of batch) {
      recipients.push({
        id: client.id,
        name: clientLabel(client),
        phone: client.telephone,
        salle: client.salle || null,
        bot: bot.label,
        status: 'en cours',
      });
    }

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
      for (const r of recipients.filter((x) => x.bot === bot.label && x.status === 'en cours')) {
        r.status = data.error ? 'erreur' : 'envoyé';
      }
      dispatched.push({
        slug: bot.slug,
        label: bot.label,
        batchSize: batch.length,
        recipients: batch.map((c) => ({
          id: c.id,
          name: clientLabel(c),
          phone: c.telephone,
          salle: c.salle || null,
        })),
        ...data,
      });
      if (data.warnings?.length) warnings.push(...data.warnings.map((w) => `[${bot.label}] ${w}`));
    } catch (err) {
      warnings.push(`[${bot.label}] ${err.message || 'Échec envoi'}`);
      for (const r of recipients.filter((x) => x.bot === bot.label && x.status === 'en cours')) {
        r.status = 'erreur';
      }
      dispatched.push({
        slug: bot.slug,
        label: bot.label,
        batchSize: batch.length,
        recipients: batch.map((c) => ({
          id: c.id,
          name: clientLabel(c),
          phone: c.telephone,
          salle: c.salle || null,
        })),
        error: err.message || 'Échec envoi',
      });
    }
  }

  return {
    bots: dispatched,
    recipients,
    pendingRemaining: Math.max(0, pending.length - offset),
    dispatchedTotal: dispatched.reduce((n, b) => n + (b.batchSize || 0), 0),
    connectedBots: connected.length,
    warnings,
  };
}

function isCampaignSchemaError(error) {
  const msg = String(error?.message || error || '');
  return (
    error?.code === '42703' ||
    error?.code === '42P01' ||
    msg.includes('does not exist') ||
    msg.includes('campaign') ||
    msg.includes('inbound_messages')
  );
}

function campaignSchemaMigrationError() {
  const err = new Error(
    'Discussions campagne indisponibles — exécutez les migrations Supabase 012_offre_ete_whatsapp_reads.sql et 013_campaign_bot_instance.sql.'
  );
  err.status = 503;
  return err;
}

export async function fetchCampaignConversations({ limit = 80 } = {}) {
  try {
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

    if (outErr) {
      if (isCampaignSchemaError(outErr)) throw campaignSchemaMigrationError();
      throw outErr;
    }

    const { data: inbound, error: inErr } = await sb
      .from('inbound_messages')
      .select('id, from_phone, from_name, body, is_read, received_at')
      .order('received_at', { ascending: false })
      .limit(limit * 3);

    if (inErr) {
      if (isCampaignSchemaError(inErr)) throw campaignSchemaMigrationError();
      throw inErr;
    }

    const campaignPhones = new Set(
      (outbound || [])
        .map((m) => normalizePhone(m.recipient))
        .filter(Boolean)
    );
    const filteredInbound = (inbound || []).filter((row) =>
      campaignPhones.has(normalizePhone(row.from_phone))
    );

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
      inbound: filteredInbound.slice(0, limit).map((row) => ({
        ...row,
        direction: 'in',
      })),
    };
  } catch (err) {
    if (isCampaignSchemaError(err) || err?.status === 503) {
      return {
        outbound: [],
        inbound: [],
        schemaWarning:
          err?.message ||
          'Discussions indisponibles — migrations Supabase 012 et 013 requises.',
      };
    }
    throw err;
  }
}

export async function fetchCampaignSentRecipients({ page = 1, limit = 50, status = 'sent' } = {}) {
  const sb = getSupabase();
  const safeLimit = Math.min(200, Math.max(1, limit));
  const from = (Math.max(1, page) - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = sb
    .from('outbound_messages')
    .select(
      'id, recipient, status, sent_at, read_at, bot_instance, client_id, created_at, error',
      { count: 'exact' }
    )
    .eq('campaign', CAMPAIGN_WA_TAG)
    .eq('channel', 'whatsapp');

  if (status === 'sent') {
    query = query.eq('status', 'sent');
  } else if (status === 'all') {
    query = query.in('status', ['sent', 'pending', 'failed']);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    const msg = String(error.message || error);
    if (
      error.code === '42703' ||
      error.code === '42P01' ||
      msg.includes('does not exist') ||
      msg.includes('campaign')
    ) {
      const migrationErr = new Error(
        'Historique WhatsApp indisponible — exécutez les migrations Supabase 012_offre_ete_whatsapp_reads.sql et 013_campaign_bot_instance.sql.'
      );
      migrationErr.status = 503;
      throw migrationErr;
    }
    throw error;
  }

  const clientIds = [...new Set((data || []).map((m) => m.client_id).filter(Boolean))];
  let clientsById = {};
  if (clientIds.length) {
    const { data: clients } = await sb
      .from('portet_clients')
      .select('id, prenom, nom, telephone, salle')
      .in('id', clientIds);
    clientsById = Object.fromEntries((clients || []).map((c) => [c.id, c]));
  }

  const botLabels = Object.fromEntries(getCampaignBots().map((b) => [b.slug, b.label]));

  return {
    page: Math.max(1, page),
    limit: safeLimit,
    total: count ?? 0,
    items: (data || []).map((row) => {
      const client = row.client_id ? clientsById[row.client_id] || null : null;
      return {
        id: row.id,
        recipient: row.recipient,
        name: client ? clientLabel(client) : row.recipient,
        phone: client?.telephone || row.recipient,
        salle: client?.salle || null,
        bot: botLabels[row.bot_instance] || row.bot_instance || '—',
        status: row.status,
        sentAt: row.sent_at || row.created_at,
        readAt: row.read_at,
        error: row.error,
      };
    }),
  };
}

export async function resetCampaignWhatsAppTracking() {
  const sb = getSupabase();
  const { error } = await sb
    .from('outbound_messages')
    .delete()
    .eq('campaign', CAMPAIGN_WA_TAG)
    .eq('channel', 'whatsapp');
  if (error) throw error;
  return { reset: true };
}

/** Supprime toutes les réponses WhatsApp affichées (spam / hors campagne). */
export async function clearCampaignDiscussions() {
  const sb = getSupabase();
  const { error } = await sb.from('inbound_messages').delete().not('id', 'is', null);
  if (error) throw error;
  return { cleared: true };
}

export async function getCampaignWhatsAppStats({ includeBots = false } = {}) {
  const [sentCount, clientsWithPhone] = await Promise.all([
    fetchCampaignSentCount(),
    fetchClientsWithPhoneCount(),
  ]);
  const pendingCount = Math.max(0, clientsWithPhone - sentCount);
  const wavesPerHour = 60 / CAMPAIGN_WA_WINDOW_MINUTES;
  const maxPerHourPerBot = Math.round(MESSAGES_PER_BOT_PER_WAVE * wavesPerHour);
  const result = {
    campaign: CAMPAIGN_WA_TAG,
    sentCount,
    pendingCount,
    messagesPerBotPerWave: MESSAGES_PER_BOT_PER_WAVE,
    windowMinutes: CAMPAIGN_WA_WINDOW_MINUTES,
    messagesPerBotPerHour: maxPerHourPerBot,
    maxPerHour: maxPerHourPerBot * getCampaignBots().filter((b) => b.configured).length,
  };
  if (includeBots) {
    result.bots = await probeCampaignBots();
    result.maxPerHour = maxPerHourPerBot * result.bots.filter((b) => b.connected).length;
  }
  return result;
}
