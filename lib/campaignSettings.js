import { getSupabase } from './supabase';

const ROW_ID = 'default';

const WARMUP_DAILY_CAPS = {
  test: 50,
  ramp: 200,
  full: null,
};

function defaultSettings() {
  return {
    id: ROW_ID,
    active: false,
    paused_at: null,
    warmup_phase: 'test',
    emails_sent_this_hour: 0,
    hour_window_start: null,
    last_cron_run_at: null,
    last_cron_result: null,
    updated_at: new Date().toISOString(),
  };
}

export async function getCampaignSettings() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('campaign_settings')
    .select('*')
    .eq('id', ROW_ID)
    .maybeSingle();

  if (error) {
    if (/campaign_settings/i.test(error.message)) {
      return { ...defaultSettings(), _missingTable: true };
    }
    throw error;
  }

  return data || defaultSettings();
}

export async function updateCampaignSettings(patch) {
  const sb = getSupabase();
  const payload = {
    ...patch,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('campaign_settings')
    .upsert({ id: ROW_ID, ...payload }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function setCampaignActive(active) {
  return updateCampaignSettings({
    active: Boolean(active),
    paused_at: active ? null : new Date().toISOString(),
  });
}

export async function setWarmupPhase(phase) {
  const allowed = ['test', 'ramp', 'full'];
  if (!allowed.includes(phase)) throw new Error(`warmup_phase invalide: ${phase}`);
  return updateCampaignSettings({ warmup_phase: phase });
}

export function getWarmupDailyCap(phase) {
  return WARMUP_DAILY_CAPS[phase] ?? WARMUP_DAILY_CAPS.test;
}

function hourWindowStart(now = new Date()) {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

export async function resetHourWindowIfNeeded(settings) {
  const windowStart = hourWindowStart();
  if (!settings.hour_window_start || settings.hour_window_start < windowStart) {
    return updateCampaignSettings({
      emails_sent_this_hour: 0,
      hour_window_start: windowStart,
    });
  }
  return settings;
}

export async function incrementEmailsSentThisHour(count) {
  const settings = await getCampaignSettings();
  const refreshed = await resetHourWindowIfNeeded(settings);
  return updateCampaignSettings({
    emails_sent_this_hour: (refreshed.emails_sent_this_hour || 0) + count,
    hour_window_start: refreshed.hour_window_start || hourWindowStart(),
  });
}

export async function countEmailsSentToday(campaign) {
  const sb = getSupabase();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { count, error } = await sb
    .from('outbound_messages')
    .select('id', { count: 'exact', head: true })
    .eq('campaign', campaign)
    .eq('channel', 'email')
    .eq('status', 'sent')
    .gte('sent_at', start.toISOString());

  if (error) throw error;
  return count || 0;
}
