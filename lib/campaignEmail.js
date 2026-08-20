import { getSupabase } from './supabase';
import { fetchUnsubscribedEmailSet } from './emailUnsubscribes';
import { clientGreetingName } from './clientDisplay';
import { campaignTag, resolveCampaignKind } from './campaigns';
import { getHourlyLimit } from './mailjetConfig';
import { fetchCampaignSentEmails, claimCampaignRecipient, markCampaignOutboundSent, markCampaignOutboundFailed } from './campaignOutbound';
import { sendBulkEmails } from './sendEmailBatch';
import { getCampaignEmailDelayMs, isMailjetRateLimitError, sleep } from './emailRateLimiter';
import { renderEmail } from './campaignTemplates';
import { clientInCampaignAudience } from './campaignAudience';

export function campaignEmailTag(kind = 'balma') {
  return campaignTag(kind);
}

/** @deprecated utilise campaignEmailTag(kind) — défaut Balma. */
export const CAMPAIGN_EMAIL_TAG = campaignTag('balma');

const DEFAULT_SUBJECT =
  process.env.CAMPAIGN_EMAIL_SUBJECT || 'Message Boxing Center';
const DEFAULT_MESSAGE =
  process.env.CAMPAIGN_EMAIL_MESSAGE ||
  'Bonjour,\n\nNous vous contactons de la part de Boxing Center.\n\nÀ bientôt.';

function clickWaveLimit() {
  const n = parseInt(process.env.CAMPAIGN_CLICK_WAVE || '10', 10);
  return Math.min(getHourlyLimit(), Number.isFinite(n) && n > 0 ? n : 10);
}

export async function fetchClientsWithEmailCount(kind = 'balma') {
  const sb = getSupabase();
  const k = resolveCampaignKind(kind);
  let q = sb
    .from('portet_clients')
    .select('id, salle')
    .not('email', 'is', null)
    .neq('email', '');
  if (k === 'balma') q = q.ilike('salle', '%balma%');
  const { data, error } = await q.range(0, 9999);
  if (error) throw error;
  const rows = data || [];
  if (k === 'balma') return rows.length;
  return rows.filter((c) => clientInCampaignAudience(c, k)).length;
}

export async function fetchPendingCampaignEmailClients({ sentEmails, limit = 5000, kind = 'balma' } = {}) {
  const sb = getSupabase();
  const k = resolveCampaignKind(kind);
  const sent = sentEmails || (await fetchCampaignSentEmails(campaignEmailTag(k)));
  const unsubscribed = await fetchUnsubscribedEmailSet();
  const pending = [];
  const pageSize = 500;
  let from = 0;

  for (;;) {
    let q = sb
      .from('portet_clients')
      .select('id, prenom, nom, email, salle, telephone, source')
      .not('email', 'is', null)
      .neq('email', '')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    if (k === 'balma') q = q.ilike('salle', '%balma%');

    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;

    for (const client of data) {
      const email = String(client.email || '')
        .trim()
        .toLowerCase();
      if (!email || sent.has(email) || unsubscribed.has(email)) continue;
      if (!clientInCampaignAudience(client, k)) continue;
      pending.push(client);
      if (pending.length >= limit) return pending;
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return pending;
}

export async function sendCampaignEmailBatch(
  clients,
  {
    maxCount,
    subject = DEFAULT_SUBJECT,
    message = DEFAULT_MESSAGE,
    kind: kindRaw = 'balma',
    delayMs,
  } = {}
) {
  const kind = resolveCampaignKind(kindRaw);
  const tag = campaignEmailTag(kind);
  const limit = Math.min(clients.length, maxCount ?? getHourlyLimit());
  const batch = clients.slice(0, limit);
  const waitMs = delayMs != null ? Number(delayMs) : getCampaignEmailDelayMs();
  const results = {
    email: { sent: 0, failed: 0, skipped: 0 },
    errors: [],
    clientIds: [],
    rateLimited: false,
  };

  for (let i = 0; i < batch.length; i++) {
    const client = batch[i];
    const rendered = renderEmail(kind, { prenom: client.prenom, seed: client.id });
    const bodyMessage = rendered.text || message;
    const mailSubject = rendered.subject || subject;

    const email = String(client.email || '')
      .trim()
      .toLowerCase();
    const claim = await claimCampaignRecipient({
      campaign: tag,
      channel: 'email',
      recipient: email,
      clientId: client.id,
      subject: mailSubject,
      body: bodyMessage.slice(0, 500),
    });
    if (!claim) {
      results.email.skipped++;
      continue;
    }

    try {
      const single = await sendBulkEmails({
        recipients: [client],
        getEmail: (c) => c.email,
        getRecipientName: clientGreetingName,
        message: bodyMessage,
        subject: mailSubject,
        html: rendered.html,
        isMarketing: true,
        mailjetAccount: 'campaign',
        allowBotFallback: false,
      });

      if (single.email.sent > 0) {
        results.email.sent++;
        results.clientIds.push(client.id);
        await markCampaignOutboundSent(claim.id);
      } else {
        results.email.failed++;
        const err = single.errors[0]?.error || 'Échec envoi';
        results.errors.push({ client: clientGreetingName(client), error: err });
        await markCampaignOutboundFailed(claim.id, err);
        if (isMailjetRateLimitError(err)) {
          results.rateLimited = true;
          break;
        }
      }
    } catch (err) {
      results.email.failed++;
      const msg = err.message || String(err);
      results.errors.push({ client: clientGreetingName(client), error: msg });
      await markCampaignOutboundFailed(claim.id, msg);
      if (isMailjetRateLimitError(msg)) {
        results.rateLimited = true;
        break;
      }
    }

    if (i < batch.length - 1 && !results.rateLimited && waitMs > 0) {
      await sleep(waitMs);
    }
  }

  return results;
}

export async function sendCampaignEmailWave(kind = 'balma') {
  const k = resolveCampaignKind(kind);
  const sentEmails = await fetchCampaignSentEmails(campaignEmailTag(k));
  const pending = await fetchPendingCampaignEmailClients({
    sentEmails,
    limit: clickWaveLimit(),
    kind: k,
  });
  if (!pending.length) {
    return { email: { sent: 0, failed: 0, skipped: 0 }, errors: [], empty: true, kind: k };
  }
  return sendCampaignEmailBatch(pending, {
    maxCount: clickWaveLimit(),
    kind: k,
    delayMs: 250,
  });
}

export async function sendCampaignEmailTest(kind = 'balma') {
  const { fetchExistingTestClients } = await import('./campaignWhatsApp');
  const testers = await fetchExistingTestClients({ withEmail: true, limit: 8 });
  const k = resolveCampaignKind(kind);
  const match = testers.find((c) => clientInCampaignAudience(c, k)) || testers[0];
  if (!match) {
    throw new Error(
      k === 'balma'
        ? 'Aucun client Balma test en base (e-mail). Importez une fiche salle Balma.'
        : 'Aucun client test existant en base (e-mail boxplus-test / Aventure).'
    );
  }
  return sendCampaignEmailBatch([match], { maxCount: 1, kind: k, delayMs: 0 });
}

export async function getCampaignEmailStats(kind = 'balma') {
  const k = resolveCampaignKind(kind);
  const [sentEmails, clientsWithEmail] = await Promise.all([
    fetchCampaignSentEmails(campaignEmailTag(k)),
    fetchClientsWithEmailCount(k),
  ]);
  const sentCount = sentEmails.size;
  return {
    campaign: campaignEmailTag(k),
    kind: k,
    sentCount,
    pendingCount: Math.max(0, clientsWithEmail - sentCount),
    hourlyLimit: getHourlyLimit(),
    audience: k === 'balma' ? 'salle Balma' : '5 salles Boxing Center (hors Balma)',
  };
}
