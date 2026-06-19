import { OFFRE_ETE_LANDING_URL, OFFRE_ETE_SHOP_URL } from './offreEteConfig';

export const OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT = 'Boxing Center — Offre été 3 mois à 89 €';

/** Texte promo clients (email + WhatsApp) — ton tutoiement. */
export function getOffreEteClientCampaignTemplate() {
  const landingUrl = `${OFFRE_ETE_LANDING_URL.replace(/\/$/, '')}/`;

  return {
    subject: OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT,
    preheader: '3 mois tous cours + accès libre dans 5 salles. T-shirt offert en commandant en ligne.',
    message: `Pendant 3 mois, profite de tous nos cours collectifs et de l'accès libre dans nos 5 salles pour 89 € au lieu de 150 €.

Boxe, MMA, Grappling, Boxing Fitness, Cross Training… C'est le bon moment pour tester, reprendre ou te remettre en forme avant la rentrée.

T-shirt officiel offert (29,99 €) en passant commande sur la boutique :

${OFFRE_ETE_SHOP_URL}

Plus d'infos sur l'offre :
${landingUrl}`,
    lang: 'fr',
  };
}
