import { OFFRE_ETE_LANDING_URL } from './offreEteConfig';

export const OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT = 'Offre Été Boxing Center ☀️';

/** Texte promo clients (email + WhatsApp) — ton tutoiement. */
export function getOffreEteClientCampaignTemplate() {
  const landingUrl = `${OFFRE_ETE_LANDING_URL.replace(/\/$/, '')}/`;

  return {
    subject: OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT,
    message: `Offre Été Boxing Center ☀️

Pendant 3 mois, profite de tous nos cours collectifs + accès libre dans nos 5 salles pour seulement 89 € au lieu de 150 €.

Boxe, MMA, Grappling, Boxing Fitness, Cross Training… c'est le bon moment pour tester, reprendre ou te remettre en forme avant la rentrée.

Offre limitée.

Je profite de l'offre ici :
${landingUrl}`,
    lang: 'fr',
  };
}
