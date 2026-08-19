/**
 * Com Balma — 14 variantes WhatsApp + e-mail.
 * Même information officielle, tons différents. {prenom} + lien Aventure.
 * WhatsApp : *gras*, pas de ###, lien brut sur sa ligne.
 */

export const AVENTURE_URL = 'https://aventure.boxingcenter.fr';
export const OPERATOR = 'GOTA – La Cour des Miracles';
export const CLUBS_5 =
  'Minimes, Ramonville, Saint-Cyprien, États-Unis et Portet-sur-Garonne';

function wa(lines) {
  return lines.join('\n');
}

/** 14 versions WhatsApp — mêmes faits, formulations différentes. */
export const BALMA_WA_14 = [
  wa([
    'Bonjour {prenom},',
    '',
    'Nous vous informons officiellement d’un changement concernant *Boxing Center Balma Gramont*.',
    '',
    `À la suite de la cession de la salle, Balma est désormais exploitée de manière indépendante par *${OPERATOR}* et ne fait plus partie du réseau Boxing Center.`,
    '',
    '*Que devient votre abonnement ?*',
    '',
    '*VOUS AVEZ UN ABONNEMENT PAR PRÉLÈVEMENT RATTACHÉ À BALMA*',
    '',
    `Votre abonnement et vos prélèvements sont automatiquement transférés à *${OPERATOR}*.`,
    '',
    'Vous avez deux possibilités :',
    '',
    '*1 — Continuer uniquement à Balma*',
    'Aucune démarche. Vous bénéficiez des cours, prestations et équipes de *' +
      OPERATOR +
      '*.',
    `Cet abonnement ne donne plus accès aux *5 clubs Boxing Center : ${CLUBS_5}*.`,
    '',
    '*2 — Continuer Boxing Center (5 salles en illimité)*',
    'Vous pouvez souscrire un nouvel abonnement Boxing Center : cours, coachs, accès libre, *5 clubs en illimité*.',
    '',
    'Offres promos : *29 € / 4 semaines* et *259 € / saison* :',
    '{lien}',
    '',
    `Vous pouvez aussi garder, en parallèle, votre abonnement chez *${OPERATOR}* si vous souhaitez encore aller à Balma.`,
    '',
    '*VOUS AVEZ UN ABONNEMENT PAYÉ COMPTANT (3, 6 OU 12 MOIS)*',
    '',
    '*Rien ne change jusqu’à l’échéance.* Vous gardez les *5 salles Boxing Center* jusqu’à la fin de la période déjà réglée. Ensuite, vous pourrez vous réinscrire chez Boxing Center.',
    '',
    'Merci pour ces années à nos côtés. À bientôt dans nos clubs.',
    '',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    'Bonjour {prenom},',
    '',
    '*Boxing Center Balma Gramont* a changé de propriétaire.',
    '',
    `La salle est maintenant gérée par *${OPERATOR}*, en dehors du réseau Boxing Center.`,
    '',
    'Si vous êtes *en prélèvement rattaché à Balma* : l’abonnement et les prélèvements passent automatiquement chez *' +
      OPERATOR +
      '*.',
    '',
    'Choix 1 : vous restez à Balma seulement — rien à faire, plus d’accès aux 5 salles Boxing Center (*' +
      CLUBS_5 +
      '*).',
    '',
    'Choix 2 : vous restez Boxing Center (cours, coachs, accès libre, 5 clubs). Offres *29 € / 4 semaines* et *259 € / saison* :',
    '{lien}',
    '',
    `Vous pouvez cumuler les deux si vous voulez encore fréquenter Balma chez *${OPERATOR}*.`,
    '',
    'Si vous avez *payé comptant* (3, 6 ou 12 mois) : *rien ne change jusqu’à la date de fin*. Les 5 salles restent ouvertes pour vous jusqu’à cette date.',
    '',
    'Sportivement,',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    '{prenom}, information importante.',
    '',
    'Balma Gramont n’est plus une salle Boxing Center. L’exploitant est désormais *' +
      OPERATOR +
      '*.',
    '',
    '*Prélèvement Balma*',
    `Transfert automatique vers *${OPERATOR}*.`,
    '— Rester seulement à Balma : aucune démarche, plus les 5 clubs BC.',
    '— Rester aux 5 salles Boxing Center : nouvel abo, offres *29 € / 4 sem.* et *259 € / saison*.',
    '{lien}',
    '',
    '*Paiement comptant (3 / 6 / 12 mois)*',
    'Aucun changement jusqu’à l’échéance. Accès 5 salles maintenu jusqu’à la fin de la période payée.',
    '',
    'Merci {prenom}. *Boxing Center*',
  ]),
  wa([
    'Salut {prenom} 👋',
    '',
    'On t’écrit au sujet de *Balma Gramont*.',
    '',
    `La salle appartient maintenant à *${OPERATOR}* (indépendant, plus dans le réseau Boxing Center).`,
    '',
    'Prélèvement Balma → transféré chez eux, automatiquement.',
    'Tu peux rester uniquement à Balma (tu perds Minimes, Ramonville, Saint-Cyprien, États-Unis, Portet).',
    'Ou reprendre un abo Boxing Center pour les *5 salles en illimité* (*29 € / 4 semaines* ou *259 € / saison*) :',
    '{lien}',
    '',
    'Les deux en même temps, c’est possible.',
    '',
    'Abo *comptant* 3, 6 ou 12 mois : tu finis ta période, les 5 salles restent valables jusque-là.',
    '',
    'À bientôt,',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    'Bonjour {prenom},',
    '',
    'Cession de *Boxing Center Balma Gramont* : la salle est exploitée par *' +
      OPERATOR +
      '* et sort du réseau.',
    '',
    'Abonnement *prélèvement Balma*',
    `→ transféré chez *${OPERATOR}*`,
    '1) Balma seulement : rien à faire, plus d’accès aux 5 clubs Boxing Center.',
    '2) Réseau Boxing Center : nouvel abonnement, *29 € / 4 semaines* ou *259 € / saison*.',
    '{lien}',
    '',
    'Abonnement *comptant*',
    '→ inchangé jusqu’à l’échéance, 5 salles jusqu’à cette date.',
    '',
    'Des questions ? On est là.',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    '{prenom},',
    '',
    'Point officiel sur Balma.',
    '',
    `*${OPERATOR}* reprend la salle. Boxing Center n’y est plus l’exploitant.`,
    '',
    'Prélèvement : ça suit Balma chez le nouvel exploitant. Soit tu restes là-bas uniquement, soit tu ouvres un abo Boxing Center pour *' +
      CLUBS_5 +
      '*.',
    '',
    'Promos : *29 € / 4 semaines* · *259 € / saison*',
    '{lien}',
    '',
    'Comptant 3/6/12 mois : tu vas au bout de ce que tu as déjà payé, sur les 5 salles.',
    '',
    'Merci pour ta confiance.',
    '*BOXING CENTER*',
  ]),
  wa([
    'Bonjour {prenom},',
    '',
    'Votre salle *Balma Gramont* change d’enseigne.',
    '',
    `Nouvel exploitant : *${OPERATOR}* (indépendant).`,
    '',
    '*Cas prélèvement*',
    'L’abo et les prélèvements sont transférés automatiquement.',
    `Continuer Balma = aucune action, plus les 5 clubs (${CLUBS_5}).`,
    'Continuer Boxing Center = nouvel abo, cours + coachs + accès libre + 5 salles.',
    '{lien}',
    '',
    '*Cas comptant*',
    'Rien ne change avant la date de fin. Les 5 salles restent ouvertes jusqu’à cette date.',
    '',
    'À très vite dans nos clubs,',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    'Hey {prenom},',
    '',
    'Info Balma, sans détour.',
    '',
    `La salle n’est plus Boxing Center. C’est *${OPERATOR}*.`,
    '',
    'Si tu es prélevé pour Balma : ça part chez eux tout seul.',
    'Tu restes à Balma ? OK, plus de badge sur nos 5 salles.',
    'Tu veux nos 5 salles ? Nouvel abo, *29 € / 4 sem.* ou *259 € / saison* :',
    '{lien}',
    '',
    'Si tu as payé 3, 6 ou 12 mois d’un coup : tu termines ta période sur les 5 salles Boxing Center.',
    '',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    'Bonjour {prenom},',
    '',
    'Nous confirmons la cession de *Boxing Center Balma Gramont*.',
    '',
    `Exploitant actuel : *${OPERATOR}*. La salle n’appartient plus au réseau Boxing Center.`,
    '',
    'Prélèvement rattaché à Balma : transfert auto. Deux options — rester à Balma uniquement, ou souscrire chez Boxing Center pour garder *' +
      CLUBS_5 +
      '*. Offres *29 € / 4 semaines* et *259 € / saison* :',
    '{lien}',
    '',
    'Un abonnement Balma et un abonnement Boxing Center peuvent coexister.',
    '',
    'Paiement comptant : vos droits Boxing Center (5 salles) courent jusqu’à l’échéance déjà payée.',
    '',
    'Merci {prenom}.',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    '{prenom} 🥊',
    '',
    'Balma change de maison.',
    '',
    `*${OPERATOR}* exploite désormais Balma Gramont, hors Boxing Center.`,
    '',
    'Prélevé à Balma → l’abo les suit. Tu peux rester là-bas, ou rejoindre nos 5 clubs (Minimes, Ramonville, Saint-Cyprien, États-Unis, Portet) avec *29 € / 4 semaines* ou *259 € / saison*.',
    '{lien}',
    '',
    'Payé d’avance (3, 6, 12 mois) → tu finis ce que tu as payé, 5 salles incluses jusqu’à la date.',
    '',
    'On reste dispo.',
    '*BOXING CENTER*',
  ]),
  wa([
    'Bonjour {prenom},',
    '',
    'Suite à la cession, *Boxing Center Balma Gramont* est désormais indépendante (*' +
      OPERATOR +
      '*).',
    '',
    '1) *Prélèvement Balma* : transféré au nouvel exploitant. Soit Balma seule (plus les 5 salles BC), soit nouvel abo Boxing Center.',
    '2) *Comptant* : statut quo jusqu’à la fin de la période payée, 5 salles conservées jusque-là.',
    '',
    'Pour les offres *29 € / 4 semaines* et *259 € / saison* :',
    '{lien}',
    '',
    'Vous restez libre de combiner les deux abonnements.',
    '',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    'Coucou {prenom},',
    '',
    'Petite info officielle : Balma n’est plus dans le réseau Boxing Center.',
    '',
    `La salle est chez *${OPERATOR}*.`,
    '',
    'Prélèvement Balma = ça bascule chez eux. Tu restes à Balma (tu perds nos 5 salles) ou tu prends un abo Boxing Center (*29 € / 4 semaines* · *259 € / saison*).',
    '{lien}',
    '',
    'Comptant 3/6/12 mois = tu vas au bout, 5 salles jusqu’à la date de fin.',
    '',
    'Merci d’avoir boxé avec nous.',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    'Bonjour {prenom},',
    '',
    'Changement d’exploitant à *Balma Gramont*.',
    '',
    `*${OPERATOR}* reprend la salle. Boxing Center n’y opère plus.`,
    '',
    'Votre prélèvement Balma est transféré automatiquement. Pour garder *' +
      CLUBS_5 +
      '* il faut un nouvel abonnement Boxing Center.',
    '',
    '*29 € / 4 semaines* ou *259 € / saison* :',
    '{lien}',
    '',
    'Si votre abo est *comptant*, il reste valable jusqu’à son terme, sur les 5 salles.',
    '',
    'À bientôt,',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    '{prenom}, on continue l’aventure — mais plus à Balma sous notre enseigne.',
    '',
    `Balma Gramont = *${OPERATOR}*, hors réseau Boxing Center.`,
    '',
    '*Prélèvement* : transfert auto vers eux. Rester à Balma (plus nos 5 clubs) ou signer chez nous pour l’illimité 5 salles, cours, coachs, accès libre.',
    '{lien}',
    '',
    '*Comptant* : rien ne bouge avant l’échéance. 5 salles jusqu’à cette date, puis réinscription possible.',
    '',
    'Offres : *29 € / 4 semaines* et *259 € / saison*.',
    '',
    'Merci pour ces années.',
    '*L’équipe BOXING CENTER*',
  ]),
];

export const BALMA_EMAIL_SUBJECTS_14 = [
  '{prenom}, information officielle — Boxing Center Balma Gramont',
  '{prenom}, Balma change d’exploitant',
  '{prenom} — que devient votre abonnement Balma ?',
  '{prenom}, cession de Boxing Center Balma Gramont',
  '{prenom}, prélèvement Balma et accès aux 5 salles',
  '{prenom}, deux options après Balma',
  '{prenom} — GOTA reprend Balma Gramont',
  '{prenom}, Boxing Center et Balma : ce qui change',
  '{prenom}, votre abo Balma (prélèvement ou comptant)',
  '{prenom} — 5 salles Boxing Center : comment continuer',
  '{prenom}, transition Balma Gramont',
  '{prenom}, offres 29 € / 259 € si vous restez Boxing Center',
  '{prenom}, point clair sur Balma et vos 5 clubs',
  '{prenom}, on continue l’aventure Boxing Center',
];

export function fillBalmaCopy(template, { prenom, lien } = {}) {
  const name = String(prenom || '').trim() || 'toi';
  const url = lien || AVENTURE_URL;
  return String(template || '')
    .replace(/\{prenom\}/g, name)
    .replace(/\{lien\}/g, url);
}

export function pickBalmaVariant(list, seed = Date.now()) {
  if (!list?.length) return null;
  return list[Math.abs(Number(seed) || Date.now()) % list.length];
}

export function waToEmailText(wa) {
  return String(wa || '').replace(/\*/g, '');
}

export function waToEmailHtml(wa, lien) {
  const url = lien || AVENTURE_URL;
  const blocks = String(wa || '')
    .replace(/\*/g, '')
    .replace(url, '')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const paras = blocks
    .map((b) => `<p style="margin:0 0 14px;line-height:1.55">${b.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return paras;
}
