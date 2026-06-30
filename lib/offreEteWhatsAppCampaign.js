import { OFFRE_ETE_SHOP_URL } from './offreEteConfig';
import { greetingNameOrFallback } from './greetingName';

const SHOP = OFFRE_ETE_SHOP_URL;

/** 13 variantes WhatsApp — 89€ : 3 mois cours + accès libre (5 salles). */
const OFFRE_ETE_WHATSAPP_TEMPLATES = [
  `Salut {prenom} 👋

*Offre été Boxing Center* — Toulouse & agglo ☀️

*89€* au lieu de 150€ :
• *3 mois* de cours illimités
• *Accès libre* à la salle
• *5 salles* — boxe, MMA, muay thai, cross…

👉 {lien}`,

  `Bonjour {prenom},

Tu paies *89€ une fois* (au lieu de 150€).
*3 mois* de cours + *accès libre* dans nos *5 salles*.

Commander :
{lien}`,

  `{prenom}, offre été Boxing Center ☀️

*89€ = 3 mois cours + accès libre.*
Économise *61€* sur l'été.

{lien}`,

  `Hey {prenom} !

Boxing Center : *89€* (~~150€~~)
→ *3 mois* cours illimités
→ *Accès libre* salle
→ *5 salles* Toulouse & agglo

{lien}`,

  `Coucou {prenom},

*Tu paies 89€.* Tu as *3 mois* : tous les cours + accès libre dans *5 salles*.

{lien}`,

  `{prenom}, c'est simple 🥊

*89€ une fois* = *3 mois cours + accès libre* chez Boxing Center.

{lien}`,

  `Bonjour {prenom},

Offre été *89€* (au lieu de 150€) :
• Cours illimités *3 mois*
• *Accès libre*
• *5 salles*

{lien}`,

  `{prenom} ! Offre Boxing Center ☀️

*89€* pour *3 mois* : cours + accès libre. *5 salles*, une seule commande.

{lien}`,

  `Salut {prenom},

*89€* — *3 mois* cours & accès libre. Boxe, MMA, cross… *5 salles*.

{lien}`,

  `{prenom}, prêt(e) pour l'été ? 💪

*89€ tout compris* : *3 mois* cours + accès libre. Économise *61€*.

{lien}`,

  `Hello {prenom},

Boxing Center — *89€ = 3 mois cours + accès libre*.
5 salles, tous les cours inclus.

{lien}`,

  `{prenom}, info claire :

Tu paies *89€ une seule fois* (au lieu de 150€).
*3 mois* cours illimités + accès libre.

{lien}`,

  `Bonjour {prenom} 👊

Offre été 2026 :
• *89€* (~~150€~~)
• *3 mois* — cours + accès libre
• *5 salles* Toulouse & agglo

👉 {lien}`,

  `{prenom}, {salle_line}

*89€* — *3 mois cours + accès libre* (5 salles).

{lien}`,
];

function salleLine(salle) {
  const s = String(salle || '').trim();
  if (!s) return '';
  return `Ta salle : ${s}.`;
}

export function formatOffreEteWhatsAppMessage(template, { prenom, nom, salle } = {}) {
  const name = greetingNameOrFallback(prenom, nom, 'toi');
  return template
    .replace(/\{prenom\}/g, name)
    .replace(/\{lien\}/g, SHOP)
    .replace(/\{salle_line\}/g, salleLine(salle));
}

export function getOffreEteWhatsAppTemplates() {
  return [...OFFRE_ETE_WHATSAPP_TEMPLATES];
}

export function pickRandomOffreEteWhatsAppMessage({ prenom, nom, salle } = {}) {
  const template =
    OFFRE_ETE_WHATSAPP_TEMPLATES[
      Math.floor(Math.random() * OFFRE_ETE_WHATSAPP_TEMPLATES.length)
    ];
  return formatOffreEteWhatsAppMessage(template, { prenom, nom, salle });
}

export function getOffreEteWhatsAppPreviewMessage() {
  return pickRandomOffreEteWhatsAppMessage({ prenom: 'Client' });
}

export const OFFRE_ETE_WHATSAPP_VARIANT_COUNT = OFFRE_ETE_WHATSAPP_TEMPLATES.length;
