import { getHourlyLimit } from './mailjetConfig';
import { campaignTag, resolveCampaignKind } from './campaigns';
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
  fetchPendingCampaignEmailClients,
  sendCampaignEmailBatch,
  getCampaignEmailStats,
} from './campaignEmail';
import { fetchCampaignSentEmails } from './campaignOutbound';
import { dispatchCampaignWhatsAppWave, getCampaignWhatsAppStats } from './campaignWhatsApp';

export async function runCampaignHourlyTick(kindRaw) {
  const settings = await resetHourWindowIfNeeded(await getCampaignSettings());
  const kind = resolveCampaignKind(
    kindRaw || settings.campaign || process.env.CAMPAIGN_CRON_KIND || process.env.CAMPAIGN_KIND
  );
  const tag = campaignTag(kind);

  if (settings._missingTable) {
    throw new Error(
      'Table campaign_settings absente — exécutez supabase/014_campaign_settings.sql'
    );
  }

  if (!settings.active) {
    return {
      skipped: true,
      kind,
      campaign: tag,
      reason: 'Campagne en pause — activez depuis /admin/campagne-planning',
    };
  }

  const hourlyLimit = getHourlyLimit();
  const alreadyThisHour = settings.emails_sent_this_hour || 0;
  const emailSlots = Math.max(0, hourlyLimit - alreadyThisHour);

  const warmupCap = getWarmupDailyCap(settings.warmup_phase);
  let emailBudget = emailSlots;

  if (warmupCap != null) {
    const sentToday = await countEmailsSentToday(tag);
    emailBudget = Math.min(emailBudget, Math.max(0, warmupCap - sentToday));
    if (emailBudget <= 0) {
      const result = {
        skipped: true,
        kind,
        campaign: tag,
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
    kind,
    campaign: tag,
    warmup_phase: settings.warmup_phase,
    email: { sent: 0, failed: 0, budget: emailBudget },
    whatsapp: null,
    warnings: [],
    clientIdsEmailed: [],
  };

  if (emailBudget > 0) {
    const sentEmails = await fetchCampaignSentEmails(tag);
    const pending = await fetchPendingCampaignEmailClients({
      sentEmails,
      limit: emailBudget + 5,
      kind,
    });

    if (pending.length) {
      const emailResult = await sendCampaignEmailBatch(pending, { maxCount: emailBudget, kind });
      result.email.sent = emailResult.email.sent;
      result.email.failed = emailResult.email.failed;
      result.clientIdsEmailed = emailResult.clientIds || [];
      if (emailResult.rateLimited) {
        result.warnings.push('Limite e-mail détectée — pause cette heure.');
        await setCampaignActive(false);
      }
      if (emailResult.errors?.length) {
        result.warnings.push(...emailResult.errors.slice(0, 5).map((e) => e.error));
      }
      if (emailResult.email.sent > 0) {
        await incrementEmailsSentThisHour(emailResult.email.sent);
      }
    } else {
      result.warnings.push('Aucun client email en attente pour cette campagne.');
    }
  }

  try {
    const wa = await dispatchCampaignWhatsAppWave({
      excludeClientIds: result.clientIdsEmailed,
      kind,
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
    campaign: kind,
  });

  return result;
}

export async function getCampaignPlanningStats(kindRaw) {
  const settings = await getCampaignSettings();
  const kind = resolveCampaignKind(kindRaw || settings.campaign);
  const [emailStats, waStats] = await Promise.all([
    getCampaignEmailStats(kind),
    getCampaignWhatsAppStats({ includeBots: true, kind }),
  ]);

  const refreshed = await resetHourWindowIfNeeded(settings);
  const warmupCap = getWarmupDailyCap(refreshed.warmup_phase);
  let sentToday = null;
  if (warmupCap != null) {
    sentToday = await countEmailsSentToday(campaignTag(kind));
  }

  return {
    settings: refreshed,
    kind,
    campaigns: {
      balma: { href: '/admin/com-balma', label: 'Com Balma' },
      offres: { href: '/admin/com-offres', label: 'Offres promo' },
    },
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
