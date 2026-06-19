import { OFFRE_ETE_SHOP_URL } from './offreEteConfig';

const SHOP = OFFRE_ETE_SHOP_URL;

/** 13 variantes WhatsApp — tirage aléatoire par destinataire (anti-spam). */
const OFFRE_ETE_WHATSAPP_TEMPLATES = [
  `Salut {prenom} 👋

Offre Été Boxing Center : *3 mois illimités à 89€* (au lieu de 150€).
Bonus : *t-shirt officiel offert* (valeur 29,99€) si tu commandes via le lien.

👉 {lien}

5 salles, tous les cours. Offre limitée.`,

  `Bonjour {prenom},

Tu veux te remettre en forme cet été ? *89€ = 3 mois* d'accès illimité chez Boxing Center (boxe, MMA, cross…).

En passant par ce lien, le *t-shirt est offert* (29,99€ d'habitude) :
{lien}

À très vite sur les tapis !`,

  `{prenom}, petite info pour toi ☀️

*Offre Été* : 3 mois tous cours + accès libre dans nos 5 salles pour *89€*.
+ *T-shirt Boxing Center offert* en commandant ici :
{lien}

Questions ? Réponds à ce message.`,

  `Hey {prenom} !

Boxing Center lance l'offre été : *89€ les 3 mois* au lieu de 150€.
T-shirt officiel *offert* (29,99€) en cliquant ici :
{lien}

Boxe, grappling, boxing fitness… tout est inclus.`,

  `Coucou {prenom},

Profite de l'été pour t'entraîner sans limite : *89€ / 3 mois* chez Boxing Center Toulouse & agglo.

🎁 *T-shirt offert* si tu prends l'offre sur :
{lien}

Places limitées pour le t-shirt.`,

  `{prenom}, c'est le bon moment 🥊

*3 mois illimités à 89€* — toutes nos salles, tous les cours.
Commande via le lien et récupère ton *t-shirt offert* (29,99€) :
{lien}`,

  `Bonjour {prenom},

Notre *Offre Été 2026* : accès illimité 3 mois pour *89€* + *t-shirt offert*.

Je profite de l'offre :
{lien}

Minimes, Ramonville, St-Cyprien, Portet, États-Unis — un seul pass.`,

  `{prenom} ! Offre spéciale Boxing Center ☀️

*89€* = 3 mois de cours + accès libre.
*T-shirt offert* en passant par :
{lien}

Clique, choisis ta salle et c'est parti.`,

  `Salut {prenom},

On te propose *3 mois à 89€* (au lieu de 150€) pour t'entraîner chez Boxing Center.

Le plus : *t-shirt offert* via ce lien boutique :
{lien}

Offre limitée dans le temps.`,

  `{prenom}, prêt(e) pour l'été ? 💪

*89€ — 3 mois illimités* dans nos 5 clubs.
*T-shirt Boxing Center offert* (29,99€) en commandant ici :
{lien}`,

  `Hello {prenom},

Boxing Center : *Offre Été 89€* pour 3 mois tous cours inclus.

🎁 T-shirt offert en cliquant :
{lien}

Rejoins-nous avant la fin de l'offre !`,

  `{prenom}, info exclusive Boxing Center

*3 mois illimités à 89€* + *t-shirt offert* si tu commandes sur :
{lien}

Boxe anglaise, MMA, cross training… à toi de jouer.`,

  `Bonjour {prenom} 👊

Dernière ligne droite pour l'*Offre Été* :
• 3 mois à *89€*
• *T-shirt offert* (29,99€)
• 5 salles Toulouse & agglo

👉 {lien}`,
];

function greetingName(prenom, nom) {
  const p = String(prenom || '').trim();
  if (p) return p;
  const n = String(nom || '').trim();
  if (n) return n.split(/\s+/)[0];
  return 'toi';
}

export function formatOffreEteWhatsAppMessage(template, { prenom, nom } = {}) {
  const name = greetingName(prenom, nom);
  return template.replace(/\{prenom\}/g, name).replace(/\{lien\}/g, SHOP);
}

export function getOffreEteWhatsAppTemplates() {
  return [...OFFRE_ETE_WHATSAPP_TEMPLATES];
}

export function pickRandomOffreEteWhatsAppMessage({ prenom, nom } = {}) {
  const template =
    OFFRE_ETE_WHATSAPP_TEMPLATES[
      Math.floor(Math.random() * OFFRE_ETE_WHATSAPP_TEMPLATES.length)
    ];
  return formatOffreEteWhatsAppMessage(template, { prenom, nom });
}

export function getOffreEteWhatsAppPreviewMessage() {
  return pickRandomOffreEteWhatsAppMessage({ prenom: 'Client' });
}

export const OFFRE_ETE_WHATSAPP_VARIANT_COUNT = OFFRE_ETE_WHATSAPP_TEMPLATES.length;
