import { OFFRE_ETE_SHOP_URL } from './offreEteConfig';

export const OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT = '89€ = 3 mois + t-shirt offert — Boxing Center';

/** Résumé court — même message partout (email, WA, landing). */
export const OFFRE_ETE_CLEAR_PITCH = `Tu paies 89€ une seule fois.
Tu reçois :
• 3 mois d'abonnement illimité (tous les cours + accès libre, 5 salles)
• 1 t-shirt Boxing Center offert — inclus, à récupérer dans la salle de ton choix

Rien d'autre à payer.`;

/** Texte promo clients (email + WhatsApp) — ton tutoiement. */
export function getOffreEteClientCampaignTemplate() {
  return {
    subject: OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT,
    preheader: '89€ tout compris : abonnement 3 mois + t-shirt offert. Pas de supplément.',
    message: `${OFFRE_ETE_CLEAR_PITCH}

Commander pour 89€ (boutique en ligne) :
${OFFRE_ETE_SHOP_URL}

Profite dès maintenant :

OFFRE LIMITEE !`,
    lang: 'fr',
  };
}
