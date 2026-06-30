import { getHourlyLimit } from './mailjetConfig';
import { CAMPAIGN_WA_TAG } from './campaignBots';
import {
  countEmailsSentToday,
  getCampaignSettings,
  getWarmupDailyCap,
  incrementEmailsSentThisHour,
  resetHourWindowIfNeeded,
  setCampaignActive,
  updateCampaignSettings,
} from './campaignSettings';
import {
  CAMPAIGN_EMAIL_TAG,
  fetchPendingCampaignEmailClients,
  sendCampaignEmailBatch,
  getCampaignEmailStats,
} from './campaignEmail';
import { fetchCampaignSentEmails } from './campaignOutbound';
import { dispatchCampaignWhatsAppWave, getCampaignWhatsAppStats } from './campaignWhatsApp';

export async function runCampaignHourlyTick() {
  const settings = await resetHourWindowIfNeeded(await getCampaignSettings());

  if (settings._missingTable) {
    throw new Error(
      'Table campaign_settings absente — exécutez supabase/014_campaign_settings.sql'
    );
  }

  if (!settings.active) {
    return {
      skipped: true,
      reason: 'Campagne en pause — activez depuis /admin/campagne-planning',
    };
  }

  const hourlyLimit = getHourlyLimit();
  const alreadyThisHour = settings.emails_sent_this_hour || 0;
  const emailSlots = Math.max(0, hourlyLimit - alreadyThisHour);

  const warmupCap = getWarmupDailyCap(settings.warmup_phase);
  let emailBudget = emailSlots;

  if (warmupCap != null) {
    const sentToday = await countEmailsSentToday(CAMPAIGN_EMAIL_TAG);
    emailBudget = Math.min(emailBudget, Math.max(0, warmupCap - sentToday));
    if (emailBudget <= 0) {
      const result = {
        skipped: true,
        reason: `Plafond réchauffage (${settings.warmup_phase}: ${warmupCap}/jour) atteint`,
        warmup_phase: settings.warmup_phase,
        sentToday,
      };
      await updateCampaignSettings({
        last_cron_run_at: new Date().toISOString(),
        last_cron_result: result,
      });
      return result;
    }
  }

  const result = {
    campaign: CAMPAIGN_WA_TAG,
    warmup_phase: settings.warmup_phase,
    email: { sent: 0, failed: 0, budget: emailBudget },
    whatsapp: null,
    warnings: [],
    clientIdsEmailed: [],
  };

  if (emailBudget > 0) {
    const sentEmails = await fetchCampaignSentEmails(CAMPAIGN_EMAIL_TAG);
    const pending = await fetchPendingCampaignEmailClients({
      sentEmails,
      limit: emailBudget + 5,
    });

    if (pending.length) {
      const emailResult = await sendCampaignEmailBatch(pending, { maxCount: emailBudget });
      result.email.sent = emailResult.email.sent;
      result.email.failed = emailResult.email.failed;
      result.clientIdsEmailed = emailResult.clientIds || [];
      if (emailResult.rateLimited) {
        result.warnings.push('Mailjet : limite détectée — pause email cette heure.');
        await setCampaignActive(false);
      }
      if (emailResult.errors?.length) {
        result.warnings.push(...emailResult.errors.slice(0, 5).map((e) => e.error));
      }
      if (emailResult.email.sent > 0) {
        await incrementEmailsSentThisHour(emailResult.email.sent);
      }
    } else {
      result.warnings.push('Aucun client email en attente pour la campagne.');
    }
  }

  try {
    const wa = await dispatchCampaignWhatsAppWave({
      excludeClientIds: result.clientIdsEmailed,
    });
    result.whatsapp = {
      dispatchedTotal: wa.dispatchedTotal,
      connectedBots: wa.connectedBots,
      pendingRemaining: wa.pendingRemaining,
      warnings: wa.warnings,
    };
    if (wa.warnings?.length) result.warnings.push(...wa.warnings);
  } catch (err) {
    result.whatsapp = { error: err.message || 'Échec dispatch WA' };
    result.warnings.push(result.whatsapp.error);
  }

  await updateCampaignSettings({
    last_cron_run_at: new Date().toISOString(),
    last_cron_result: result,
  });

  return result;
}

export async function getCampaignPlanningStats() {
  const [settings, emailStats, waStats] = await Promise.all([
    getCampaignSettings(),
    getCampaignEmailStats(),
    getCampaignWhatsAppStats({ includeBots: true }),
  ]);

  const refreshed = await resetHourWindowIfNeeded(settings);
  const warmupCap = getWarmupDailyCap(refreshed.warmup_phase);
  let sentToday = null;
  if (warmupCap != null) {
    sentToday = await countEmailsSentToday(CAMPAIGN_EMAIL_TAG);
  }

  return {
    settings: refreshed,
    email: emailStats,
    whatsapp: waStats,
    hourlyLimit: getHourlyLimit(),
    warmupDailyCap: warmupCap,
    emailsSentToday: sentToday,
    emailsRemainingThisHour: Math.max(
      0,
      getHourlyLimit() - (refreshed.emails_sent_this_hour || 0)
    ),
  };
}
