import { OFFRE_ETE_LANDING_URL } from './offreEteConfig';

export const OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT =
  'Offre Été Boxing Center — 3 mois illimités à 89 €';

/** Texte promo clients (email + WhatsApp) — ton tutoiement. */
export function getOffreEteClientCampaignTemplate() {
  const landingUrl = `${OFFRE_ETE_LANDING_URL.replace(/\/$/, '')}/`;

  return {
    subject: OFFRE_ETE_CLIENT_CAMPAIGN_SUBJECT,
    preheader: 'Tous nos cours + accès libre dans 5 salles — offre limitée avant la rentrée.',
    message: `Pendant 3 mois, profite de tous nos cours collectifs et de l'accès libre dans nos 5 salles pour 89 € au lieu de 150 €.

Boxe, MMA, Grappling, Boxing Fitness, Cross Training… C'est le bon moment pour tester, reprendre ou te remettre en forme avant la rentrée.

Offre limitée — je profite de l'offre ici :
${landingUrl}`,
    lang: 'fr',
  };
}
