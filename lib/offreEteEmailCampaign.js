import { OFFRE_ETE_SHOP_URL } from './offreEteConfig';
import { greetingNameOrFallback } from './greetingName';

const SHOP = OFFRE_ETE_SHOP_URL;
const FOOTER = `OFFRE LIMITEE !`;

/** Variantes corps email — prénom + formulation différente (anti-spam). */
const OFFRE_ETE_EMAIL_TEMPLATES = [
  `{prenom}, tu paies 89€ une seule fois.
Tu reçois :
• 3 mois d'abonnement illimité (tous les cours + accès libre, 5 salles)
• 1 t-shirt Boxing Center offert — inclus, à récupérer dans la salle de ton choix

Rien d'autre à payer.

Commander pour 89€ :
{lien}

Profite dès maintenant :

${FOOTER}`,

  `Bonjour {prenom},

89€ tout compris chez Boxing Center :
→ 3 mois illimités dans nos 5 salles
→ 1 t-shirt offert (inclus dans les 89€, à récupérer en salle)

Une seule commande :
{lien}

${FOOTER}`,

  `{prenom}, offre été Boxing Center

Tu paies 89€ une fois = abonnement 3 mois + t-shirt offert.
Pas de supplément pour le t-shirt.

{lien}

${FOOTER}`,

  `Hey {prenom},

Boxing Center : 89€ tout compris
• 3 mois illimités (boxe, MMA, cross…)
• T-shirt offert inclus

Commander :
{lien}

${FOOTER}`,

  `{prenom}, c'est simple :

89€ = 3 mois dans toutes nos salles + le t-shirt offert.
Tu ne paies rien en plus pour le t-shirt.

{lien}

${FOOTER}`,

  `Coucou {prenom},

Tu paies 89€. Tu as 3 mois illimités + le t-shirt Boxing Center offert.
Le t-shirt est inclus, pas en plus.

{lien}

${FOOTER}`,

  `{prenom}, prêt(e) pour l'été ?

89€ tout compris : abonnement 3 mois + t-shirt offert.
5 salles, tous les cours.

{lien}

${FOOTER}`,

  `Bonjour {prenom},

Info claire : 89€ une seule fois.
• Abonnement 3 mois illimité
• T-shirt offert à récupérer en salle

{lien}

${FOOTER}`,

  `{prenom} !

Boxing Center — 89€ = 3 mois + t-shirt offert.
Rien d'autre à payer.

{lien}

${FOOTER}`,

  `Salut {prenom},

89€ pour 3 mois illimités chez Boxing Center.
Le t-shirt est offert et inclus dans le prix.

{lien}

${FOOTER}`,

  `{prenom}, dernière ligne droite avant l'été 💪

89€ tout compris : 3 mois + t-shirt offert.

{lien}

${FOOTER}`,

  `Hello {prenom},

Tu paies 89€ une fois, tu reçois 3 mois illimités + 1 t-shirt offert.
{salle_line}

{lien}

${FOOTER}`,
];

function salleLine(salle) {
  const s = String(salle || '').trim();
  if (!s) return '';
  return `Ta salle : ${s}.`;
}

export function formatOffreEteEmailMessage(template, { prenom, nom, salle } = {}) {
  const name = greetingNameOrFallback(prenom, nom, 'ami');
  return template
    .replace(/\{prenom\}/g, name)
    .replace(/\{lien\}/g, SHOP)
    .replace(/\{salle_line\}/g, salleLine(salle))
    .replace(/\n{3,}/g, '\n\n');
}

export function pickRandomOffreEteEmailMessage({ prenom, nom, salle } = {}) {
  const template =
    OFFRE_ETE_EMAIL_TEMPLATES[Math.floor(Math.random() * OFFRE_ETE_EMAIL_TEMPLATES.length)];
  return formatOffreEteEmailMessage(template, { prenom, nom, salle });
}

export const OFFRE_ETE_EMAIL_VARIANT_COUNT = OFFRE_ETE_EMAIL_TEMPLATES.length;

export function isOffreEteCampaignSubject(subject) {
  return String(subject || '').includes('89€') && String(subject || '').includes('t-shirt');
}
