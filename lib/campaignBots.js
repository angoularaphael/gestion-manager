/** 3 bots WhatsApp campagne — mêmes serveurs Bothosting que compta-boxing. */

export const CAMPAIGN_WA_TAG = 'offre_ete_2026';

/** URLs par défaut (compta-boxing/.env.example + supabase/004_bot_urls.sql). */
export const COMPTA_BOT_URLS = {
  minimes: 'http://us2.bot-hosting.net:21334',
  st_cyprien: 'http://prem-eu2.bot-hosting.net:20405',
  ramonville: 'http://prem-eu4.bot-hosting.net:21357',
};

/** Fenêtre d'envoi WhatsApp campagne (minutes). */
export const CAMPAIGN_WA_WINDOW_MINUTES = Math.max(
  1,
  Number(process.env.CAMPAIGN_WA_WINDOW_MINUTES || 30)
);

/** Messages max par bot et par fenêtre (défaut 12 / 30 min). */
export const MESSAGES_PER_BOT_PER_WAVE = Math.max(
  1,
  Number(
    process.env.CAMPAIGN_WA_PER_BOT_WAVE ||
      process.env.CAMPAIGN_WA_PER_BOT_HOUR ||
      12
  )
);

/** Alias historique — même valeur que MESSAGES_PER_BOT_PER_WAVE. */
export const MESSAGES_PER_BOT_PER_HOUR = MESSAGES_PER_BOT_PER_WAVE;

export const CAMPAIGN_BOTS = [
  {
    slug: 'minimes',
    label: 'Minimes / États-Unis',
    envKey: 'WHATSAPP_BOT_URL_MINIMES',
    comptaEnvKey: 'BOT_URL_MINIMES',
    legacyEnv: 'NEXT_PUBLIC_WHATSAPP_BOT_URL',
    defaultUrl: COMPTA_BOT_URLS.minimes,
  },
  {
    slug: 'st_cyprien',
    label: 'Saint-Cyprien',
    envKey: 'WHATSAPP_BOT_URL_ST_CYPRIEN',
    comptaEnvKey: 'BOT_URL_ST_CYPRIEN',
    defaultUrl: COMPTA_BOT_URLS.st_cyprien,
  },
  {
    slug: 'ramonville',
    label: 'Ramonville',
    envKey: 'WHATSAPP_BOT_URL_RAMONVILLE',
    comptaEnvKey: 'BOT_URL_RAMONVILLE',
    defaultUrl: COMPTA_BOT_URLS.ramonville,
  },
];

export function campaignBotUrl(bot) {
  const candidates = [
    process.env[bot.envKey],
    bot.comptaEnvKey ? process.env[bot.comptaEnvKey] : '',
    bot.legacyEnv ? process.env[bot.legacyEnv] : '',
    bot.defaultUrl,
  ];
  for (const raw of candidates) {
    const url = String(raw || '').trim().replace(/\/$/, '');
    if (url) return url;
  }
  return '';
}

export function getCampaignBots() {
  return CAMPAIGN_BOTS.map((bot) => ({
    ...bot,
    url: campaignBotUrl(bot),
    configured: Boolean(campaignBotUrl(bot)),
  }));
}

export function getCampaignBot(slug) {
  const bot = CAMPAIGN_BOTS.find((b) => b.slug === slug);
  if (!bot) return null;
  const url = campaignBotUrl(bot);
  return { ...bot, url, configured: Boolean(url) };
}
