import { botFetch } from './bot';
import { getCampaignBot } from './campaignBots';
import { normalizePhone } from './phone';

export function buildReferralWhatsAppMessage({ referrerPrenom, referrerNom, potePrenom }) {
  const who = [referrerPrenom, referrerNom].filter(Boolean).join(' ').trim() || 'Un ami';
  const greet = potePrenom ? `Salut ${potePrenom} !` : 'Salut !';
  return `${greet}

${who} vient de s'inscrire chez Boxing Center.

Grâce à lui/elle, tu peux bénéficier de l'offre à 29€/mois au lieu de 44€.

Tu veux t'inscrire ? Dis simplement que tu viens de la part de ${who.split(' ')[0] || who}.

Boxing Center — Toulouse et agglomération`;
}

export async function sendReferralWhatsAppToPote({ potePhone, referrerPrenom, referrerNom, potePrenom }) {
  const phone = normalizePhone(potePhone);
  if (!phone) throw new Error('Numéro du pote invalide');

  const bot = getCampaignBot('minimes');
  if (!bot?.configured) {
    throw new Error('Bot WhatsApp Minimes non configuré (WHATSAPP_BOT_URL_MINIMES)');
  }

  const message = buildReferralWhatsAppMessage({ referrerPrenom, referrerNom, potePrenom });

  return botFetch('/api/send-message', {
    method: 'POST',
    baseUrl: bot.url,
    body: { phone, message },
    timeoutMs: 25000,
  });
}
