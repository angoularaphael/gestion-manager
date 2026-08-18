/**
 * 12 variantes WhatsApp + e-mail — campagnes Balma (cession) et Portet (rentrée).
 * {prenom} est remplacé à l’envoi. Jamais d’IBAN dans ces textes.
 */

export const AVENTURE_URL = 'https://aventure.boxingcenter.fr';
export const COUR_DES_MIRACLES_EMAIL = 'contactgotatoulouse@gmail.com';
export const BALMA_CAMPAIGN_TAG = 'balma_cession_2026';
export const PORTET_CAMPAIGN_TAG = 'portet_rentree_2026';

const BALMA_WA = [
  `Salut {prenom} 👋

Rentrée Boxing Center : *29,99€ / 4 semaines* (sans engagement) ou *259€ / 12 mois*.

En parallèle : envoie un mail à ${COUR_DES_MIRACLES_EMAIL} pour résilier chez Cour des Miracles.

Pour rester aux 5 salles Boxing Center :
{lien}`,
  `Bonjour {prenom},

Deux offres rentrée : *29,99€ les 4 semaines* ou *259€ l’année*.

Résilie Cour des Miracles par mail : ${COUR_DES_MIRACLES_EMAIL}

Puis bascule ici (prélèvement uniquement) :
{lien}`,
  `{prenom}, Boxing Center continue.

*29,99€ / 4 sem.* ou *259€ / 12 mois* — 5 salles, tous les cours.

Mail de résiliation Cour des Miracles : ${COUR_DES_MIRACLES_EMAIL}

Lien pour basculer :
{lien}`,
  `Hey {prenom} !

On te garde : offre *29€* sans engagement ou *259€* à l’année.

Écris à ${COUR_DES_MIRACLES_EMAIL} pour résilier l’autre opérateur, puis clique :
{lien}`,
  `Coucou {prenom},

Balma a changé d’opérateur. Pour rester Boxing Center :

1. Offre 29,99€ / 4 sem. ou 259€ / an
2. Mail de résiliation : ${COUR_DES_MIRACLES_EMAIL}
3. Formulaire : {lien}`,
  `{prenom} 🥊

Rentrée : *29,99€* (4 semaines) ou *259€* (12 mois). Accès 5 salles.

Résilie Cour des Miracles (${COUR_DES_MIRACLES_EMAIL}) et bascule ici :
{lien}`,
  `Bonjour {prenom},

On ne te lâche pas. Offres rentrée 29,99€ / 259€.

Résiliation Cour des Miracles : ${COUR_DES_MIRACLES_EMAIL}

Lien (prélèvement uniquement) :
{lien}`,
  `{prenom} ! Boxing Center t’attend.

*29,99€ / 4 semaines* ou *259€ / 12 mois*.

Mail : ${COUR_DES_MIRACLES_EMAIL}
Bascule : {lien}`,
  `Salut {prenom},

Pour rester aux 5 salles : choisis 29,99€ sans engagement ou 259€ l’année, envoie ta résiliation à ${COUR_DES_MIRACLES_EMAIL}, puis ouvre :
{lien}`,
  `{prenom}, info claire.

Offres : 29,99€ / 4 sem. · 259€ / an.
Résilie Cour des Miracles : ${COUR_DES_MIRACLES_EMAIL}
Formulaire Boxing Center : {lien}`,
  `Hello {prenom} 👊

Rentrée Boxing Center — 29,99€ ou 259€.

Résiliation parallèle : ${COUR_DES_MIRACLES_EMAIL}

On s’occupe de ta fiche ici :
{lien}`,
  `{prenom}, on continue l’aventure.

29,99€ / 4 semaines ou 259€ / 12 mois.
Mail Cour des Miracles : ${COUR_DES_MIRACLES_EMAIL}
Lien : {lien}`,
];

const PORTET_WA = [
  `Salut {prenom} 👋

Rentrée Boxing Center Portet : *29,99€ / 4 semaines* ou *259€ / 12 mois*. Tous les cours, accès libre.

👉 {lien}`,
  `Bonjour {prenom},

Offre rentrée : 29,99€ sans engagement (4 sem.) ou 259€ l’année.

Inscription : {lien}`,
  `{prenom}, c’est le moment 🥊

*29,99€ / 4 semaines* · *259€ / 12 mois* — Boxing Center.

{lien}`,
  `Hey {prenom} !

Rentrée 2026 : 29,99€ ou 259€. 5 salles, débutants bienvenus.

{lien}`,
  `Coucou {prenom},

Tu paies 29,99€ / 4 sem. ou 259€ l’année. Cours + accès libre.

{lien}`,
  `{prenom}, offre rentrée Boxing Center.

29,99€ sans engagement ou 259€ / 12 mois.

{lien}`,
  `Bonjour {prenom},

Rejoins (ou reviens) : 29,99€ les 4 semaines, ou 259€ l’année.

{lien}`,
  `{prenom} ! Rentrée boxe 👊

29,99€ / 4 sem. · 259€ / an. Lien :
{lien}`,
  `Salut {prenom},

Offres rentrée : 29,99€ ou 259€. Toutes disciplines.

{lien}`,
  `{prenom}, info rentrée :

29,99€ / 4 semaines (sans engagement) ou 259€ / 12 mois.

{lien}`,
  `Hello {prenom},

Boxing Center — 29,99€ ou 259€. Inscris-toi :
{lien}`,
  `{prenom}, on t’attend.

29,99€ / 4 sem. ou 259€ / 12 mois → {lien}`,
];

function emailShell({ title, paragraphs, ctaLabel, lien }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.5">${p}</p>`).join('');
  return `<!DOCTYPE html><html><body style="font-family:Montserrat,Arial,sans-serif;color:#161A2E">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <p style="letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:#6D3111">Boxing Center</p>
    <h1 style="font-family:'Barlow Condensed',Arial,sans-serif;font-size:28px">${title}</h1>
    ${body}
    <p><a href="${lien}" style="display:inline-block;background:#E8001C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">${ctaLabel}</a></p>
  </div>
</body></html>`;
}

const BALMA_EMAIL = [
  {
    subject: '{prenom}, rentrée Boxing Center — 29,99€ ou 259€',
    text: `Bonjour {prenom},\n\nRentrée Boxing Center : 29,99€ / 4 semaines (sans engagement) ou 259€ / 12 mois.\n\nEn parallèle, envoie un mail à ${COUR_DES_MIRACLES_EMAIL} pour résilier chez Cour des Miracles.\n\nPour rester aux 5 salles Boxing Center (prélèvement uniquement) :\n{lien}\n`,
    html: (lien) =>
      emailShell({
        title: 'On continue l’aventure',
        paragraphs: [
          'Bonjour {prenom},',
          'Rentrée Boxing Center : <strong>29,99€ / 4 semaines</strong> ou <strong>259€ / 12 mois</strong>.',
          `En parallèle, envoie un mail à <a href="mailto:${COUR_DES_MIRACLES_EMAIL}">${COUR_DES_MIRACLES_EMAIL}</a> pour résilier chez Cour des Miracles.`,
          'Ensuite, bascule ta fiche Boxing Center (prélèvement uniquement).',
        ],
        ctaLabel: 'Basculer vers Boxing Center',
        lien,
      }),
  },
];

function expandEmailVariants(kind) {
  if (kind === 'balma') {
    const base = BALMA_EMAIL[0];
    return BALMA_WA.map((wa, i) => ({
      id: i + 1,
      subject: i % 2 === 0 ? base.subject : `{prenom}, Boxing Center t’attend — offres 29 / 259`,
      text: wa.replace(/\*/g, ''),
      html: (lien) =>
        emailShell({
          title: 'Boxing Center — rentrée',
          paragraphs: wa
            .replace(/\*/g, '')
            .replace('{lien}', '')
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .slice(0, 6),
          ctaLabel: 'Continuer l’aventure',
          lien,
        }),
    }));
  }
  return PORTET_WA.map((wa, i) => ({
    id: i + 1,
    subject:
      i % 2 === 0
        ? '{prenom}, rentrée Boxing Center — 29,99€ ou 259€'
        : '{prenom}, offres rentrée 29 / 259',
    text: wa.replace(/\*/g, ''),
    html: (lien) =>
      emailShell({
        title: 'Rentrée Boxing Center',
        paragraphs: wa
          .replace(/\*/g, '')
          .replace('{lien}', '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 6),
        ctaLabel: 'Je m’inscris',
        lien,
      }),
  }));
}

export const TEMPLATES = {
  balma: {
    tag: BALMA_CAMPAIGN_TAG,
    lien: AVENTURE_URL,
    whatsapp: BALMA_WA,
    email: expandEmailVariants('balma'),
  },
  portet: {
    tag: PORTET_CAMPAIGN_TAG,
    lien: 'https://boutique.boxingcenter.fr/inscription?product=offre-duo',
    whatsapp: PORTET_WA,
    email: expandEmailVariants('portet'),
  },
};

export function fillTemplate(template, { prenom, lien } = {}) {
  const name = String(prenom || '').trim() || 'toi';
  const url = lien || AVENTURE_URL;
  return String(template || '')
    .replace(/\{prenom\}/g, name)
    .replace(/\{lien\}/g, url);
}

export function pickVariant(list, seed = Date.now()) {
  if (!list?.length) return null;
  const i = Math.abs(Number(seed) || Date.now()) % list.length;
  return list[i];
}

export function campaignKindFromSource(source) {
  const s = String(source || '').toLowerCase();
  if (s.includes('balma')) return 'balma';
  if (s.includes('portet')) return 'portet';
  return process.env.CAMPAIGN_KIND || 'balma';
}

export function renderWhatsApp(kind, { prenom, seed } = {}) {
  const pack = TEMPLATES[kind] || TEMPLATES.balma;
  const tpl = pickVariant(pack.whatsapp, seed);
  return fillTemplate(tpl, { prenom, lien: pack.lien });
}

export function renderEmail(kind, { prenom, seed } = {}) {
  const pack = TEMPLATES[kind] || TEMPLATES.balma;
  const tpl = pickVariant(pack.email, seed);
  const subject = fillTemplate(tpl.subject, { prenom, lien: pack.lien });
  const text = fillTemplate(tpl.text, { prenom, lien: pack.lien });
  const html = fillTemplate(tpl.html(pack.lien), { prenom, lien: pack.lien });
  return { subject, text, html, tag: pack.tag };
}

export function templateCount(kind = 'balma') {
  const pack = TEMPLATES[kind] || TEMPLATES.balma;
  return { whatsapp: pack.whatsapp.length, email: pack.email.length };
}
