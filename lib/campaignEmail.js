import { getSupabase } from './supabase';
import { fetchUnsubscribedEmailSet } from './emailUnsubscribes';
import { clientGreetingName } from './clientDisplay';
import { getOffreEteClientCampaignTemplate } from './offreEteCampaign';
import { pickRandomOffreEteEmailMessage } from './offreEteEmailCampaign';
import { CAMPAIGN_WA_TAG } from './campaignBots';
import { getHourlyLimit } from './mailjetConfig';
import { fetchCampaignSentEmails, logCampaignOutbound } from './campaignOutbound';
import { sendBulkEmails } from './sendEmailBatch';
import { getCampaignEmailDelayMs, isMailjetRateLimitError, sleep } from './emailRateLimiter';

export const CAMPAIGN_EMAIL_TAG = CAMPAIGN_WA_TAG;

export async function fetchClientsWithEmailCount() {
  const sb = getSupabase();
  const { count, error } = await sb
    .from('portet_clients')
    .select('id', { count: 'exact', head: true })
    .not('email', 'is', null)
    .neq('email', '');
  if (error) throw error;
  return count || 0;
}

export async function fetchPendingCampaignEmailClients({ sentEmails, limit = 5000 } = {}) {
  const sb = getSupabase();
  const sent = sentEmails || (await fetchCampaignSentEmails(CAMPAIGN_EMAIL_TAG));
  const unsubscribed = await fetchUnsubscribedEmailSet();
  const pending = [];
  const pageSize = 500;
  let from = 0;

  for (;;) {
    const { data, error } = await sb
      .from('portet_clients')
      .select('id, prenom, nom, email, salle, telephone')
      .not('email', 'is', null)
      .neq('email', '')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const client of data) {
      const email = String(client.email || '')
        .trim()
        .toLowerCase();
      if (!email || sent.has(email) || unsubscribed.has(email)) continue;
      pending.push(client);
      if (pending.length >= limit) return pending;
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return pending;
}

export async function sendCampaignEmailBatch(clients, { maxCount } = {}) {
  const tpl = getOffreEteClientCampaignTemplate();
  const limit = Math.min(clients.length, maxCount ?? getHourlyLimit());
  const batch = clients.slice(0, limit);
  const delayMs = getCampaignEmailDelayMs();
  const results = {
    email: { sent: 0, failed: 0, skipped: 0 },
    errors: [],
    clientIds: [],
    rateLimited: false,
  };

  for (let i = 0; i < batch.length; i++) {
    const client = batch[i];
    const bodyMessage = pickRandomOffreEteEmailMessage({
      prenom: client.prenom,
      nom: client.nom,
      salle: client.salle,
    });

    try {
      const single = await sendBulkEmails({
        recipients: [client],
        getEmail: (c) => c.email,
        getRecipientName: clientGreetingName,
        message: bodyMessage,
        subject: tpl.subject,
        preheader: tpl.preheader,
        isMarketing: true,
        mailjetAccount: 'campaign',
        allowBotFallback: false,
      });

      if (single.email.sent > 0) {
        results.email.sent++;
        results.clientIds.push(client.id);
        await logCampaignOutbound({
          campaign: CAMPAIGN_EMAIL_TAG,
          channel: 'email',
          recipient: String(client.email).trim().toLowerCase(),
          subject: tpl.subject,
          body: bodyMessage.slice(0, 500),
          status: 'sent',
          clientId: client.id,
        });
      } else {
        results.email.failed++;
        const err = single.errors[0]?.error || 'Échec envoi';
        results.errors.push({ client: clientGreetingName(client), error: err });
        if (isMailjetRateLimitError(err)) {
          results.rateLimited = true;
          break;
        }
      }
    } catch (err) {
      results.email.failed++;
      const msg = err.message || String(err);
      results.errors.push({ client: clientGreetingName(client), error: msg });
      if (isMailjetRateLimitError(msg)) {
        results.rateLimited = true;
        break;
      }
    }

    if (i < batch.length - 1 && !results.rateLimited) {
      await sleep(delayMs);
    }
  }

  return results;
}

export async function getCampaignEmailStats() {
  const [sentEmails, clientsWithEmail] = await Promise.all([
    fetchCampaignSentEmails(CAMPAIGN_EMAIL_TAG),
    fetchClientsWithEmailCount(),
  ]);
  const sentCount = sentEmails.size;
  return {
    campaign: CAMPAIGN_EMAIL_TAG,
    sentCount,
    pendingCount: Math.max(0, clientsWithEmail - sentCount),
    hourlyLimit: getHourlyLimit(),
  };
}
