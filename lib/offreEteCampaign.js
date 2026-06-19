import { OFFRE_ETE_LANDING_URL, OFFRE_ETE_SHOP_URL } from './offreEteConfig';

export const OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT = 'Boxing Center Toulouse — offre ete salle de sport';

/** Texte promo clients (email + WhatsApp) — ton tutoiement. */
export function getOffreEteClientCampaignTemplate() {
  const landingUrl = `${OFFRE_ETE_LANDING_URL.replace(/\/$/, '')}/`;

  return {
    subject: OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT,
    preheader: '3 mois tous cours et acces libre dans 5 salles toulousaines.',
    message: `Pendant 3 mois, profite de tous nos cours collectifs et de l'acces libre dans nos 5 salles pour 89 euros au lieu de 150 euros.

Boxe, MMA, Grappling, Boxing Fitness, Cross Training : c'est le bon moment pour tester ou reprendre avant la rentree.

T-shirt officiel offert (29,99 euros) en commandant sur la boutique en ligne.

Boutique :
${OFFRE_ETE_SHOP_URL}

Details :
${landingUrl}`,
    lang: 'fr',
  };
}
