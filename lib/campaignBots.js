/** 3 bots WhatsApp campagne clients (une salle / numéro par serveur Bothosting). */

export const CAMPAIGN_WA_TAG = 'offre_ete_2026';
export const MESSAGES_PER_BOT_PER_HOUR = Math.max(
  1,
  Number(process.env.CAMPAIGN_WA_PER_BOT_HOUR || 13)
);

export const CAMPAIGN_BOTS = [
  {
    slug: 'minimes',
    label: 'Minimes',
    envKey: 'WHATSAPP_BOT_URL_MINIMES',
    legacyEnv: 'NEXT_PUBLIC_WHATSAPP_BOT_URL',
  },
  {
    slug: 'st_cyprien',
    label: 'Saint-Cyprien',
    envKey: 'WHATSAPP_BOT_URL_ST_CYPRIEN',
  },
  {
    slug: 'ramonville',
    label: 'Ramonville',
    envKey: 'WHATSAPP_BOT_URL_RAMONVILLE',
  },
];

export function campaignBotUrl(bot) {
  const primary = String(process.env[bot.envKey] || '').trim().replace(/\/$/, '');
  if (primary) return primary;
  if (bot.legacyEnv) {
    return String(process.env[bot.legacyEnv] || '').trim().replace(/\/$/, '');
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
