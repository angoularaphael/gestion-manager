/** Bots WhatsApp campagne — 6 serveurs gestion-manager-* (partagés Balma + offres promo). */

import { campaignTag, DEFAULT_CAMPAIGN_KIND } from './campaigns';

export const CAMPAIGN_WA_TAG = campaignTag(DEFAULT_CAMPAIGN_KIND);

/** URLs des bots club — ne pas mixer avec la campagne Balma. */
export const COMPTA_BOT_URLS = {
  minimes: 'http://prem-eu4.bot-hosting.net:20125',
  st_cyprien: 'http://prem-eu2.bot-hosting.net:20405',
  ramonville: 'http://prem-eu4.bot-hosting.net:21357',
};

export const CAMPAIGN_WA_WINDOW_MINUTES = Math.max(
  1,
  Number(process.env.CAMPAIGN_WA_WINDOW_MINUTES || 30)
);

export const MESSAGES_PER_BOT_PER_WAVE = Math.max(
  1,
  Number(process.env.CAMPAIGN_WA_PER_BOT_WAVE || process.env.CAMPAIGN_WA_PER_BOT_HOUR || 12)
);

export const MESSAGES_PER_BOT_PER_HOUR = MESSAGES_PER_BOT_PER_WAVE;

/** 6 SIM Bothosting — un serveur = un bot, jamais la même URL. */
export const CAMPAIGN_SIM_BOTS = [
  {
    slug: 'sim1',
    label: 'gestion-manager-1',
    envKey: 'WHATSAPP_CAMPAIGN_BOT_URL_1',
    defaultUrl: 'http://prem-eu4.bot-hosting.net:21357',
  },
  {
    slug: 'sim2',
    label: 'gestion-manager-2',
    envKey: 'WHATSAPP_CAMPAIGN_BOT_URL_2',
    defaultUrl: 'http://prem-eu2.bot-hosting.net:20405',
  },
  {
    slug: 'sim3',
    label: 'gestion-manager-3',
    envKey: 'WHATSAPP_CAMPAIGN_BOT_URL_3',
    defaultUrl: 'http://prem-eu4.bot-hosting.net:20695',
  },
  {
    slug: 'sim4',
    label: 'gestion-manager-4',
    envKey: 'WHATSAPP_CAMPAIGN_BOT_URL_4',
    defaultUrl: 'http://prem-eu2.bot-hosting.net:21774',
  },
  {
    slug: 'sim5',
    label: 'gestion-manager-5',
    envKey: 'WHATSAPP_CAMPAIGN_BOT_URL_5',
    defaultUrl: 'http://prem-eu2.bot-hosting.net:21871',
  },
  {
    slug: 'sim6',
    label: 'gestion-manager-6',
    envKey: 'WHATSAPP_CAMPAIGN_BOT_URL_6',
    defaultUrl: 'http://prem-eu2.bot-hosting.net:21724',
  },
];

export const CLUB_CAMPAIGN_BOTS = [
  {
    slug: 'minimes',
    label: 'Minimes / États-Unis (club)',
    envKey: 'WHATSAPP_BOT_URL_MINIMES',
    comptaEnvKey: 'BOT_URL_MINIMES',
    legacyEnv: 'NEXT_PUBLIC_WHATSAPP_BOT_URL',
    defaultUrl: COMPTA_BOT_URLS.minimes,
  },
  {
    slug: 'st_cyprien',
    label: 'Saint-Cyprien (club)',
    envKey: 'WHATSAPP_BOT_URL_ST_CYPRIEN',
    comptaEnvKey: 'BOT_URL_ST_CYPRIEN',
    defaultUrl: COMPTA_BOT_URLS.st_cyprien,
  },
  {
    slug: 'ramonville',
    label: 'Ramonville (club)',
    envKey: 'WHATSAPP_BOT_URL_RAMONVILLE',
    comptaEnvKey: 'BOT_URL_RAMONVILLE',
    defaultUrl: COMPTA_BOT_URLS.ramonville,
  },
];

export const CAMPAIGN_BOTS = CAMPAIGN_SIM_BOTS;

function normalizeBotUrl(raw) {
  let url = String(raw || '')
    .trim()
    .replace(/\/$/, '');
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  return url;
}

export function campaignBotUrl(bot) {
  const candidates = [process.env[bot.envKey], bot.comptaEnvKey ? process.env[bot.comptaEnvKey] : '', bot.legacyEnv ? process.env[bot.legacyEnv] : '', bot.defaultUrl];
  for (const raw of candidates) {
    const url = normalizeBotUrl(raw);
    if (url) return url;
  }
  return '';
}

export function getCampaignBots() {
  if (String(process.env.CAMPAIGN_USE_CLUB_BOTS || '0') === '1') {
    return CLUB_CAMPAIGN_BOTS.map((bot) => ({
      ...bot,
      url: campaignBotUrl(bot),
      configured: Boolean(campaignBotUrl(bot)),
    })).filter((b) => b.configured);
  }

  const byUrl = new Map();
  for (const bot of CAMPAIGN_SIM_BOTS) {
    const url = campaignBotUrl(bot);
    if (!url || byUrl.has(url)) continue;
    byUrl.set(url, { ...bot, url, configured: true });
  }
  return [...byUrl.values()];
}

export function getCampaignBot(slug) {
  const listed = getCampaignBots().find((b) => b.slug === slug);
  if (listed) return listed;
  const all = [...CAMPAIGN_SIM_BOTS, ...CLUB_CAMPAIGN_BOTS];
  const bot = all.find((b) => b.slug === slug);
  if (!bot) return null;
  const url = campaignBotUrl(bot);
  return { ...bot, url, configured: Boolean(url) };
}
