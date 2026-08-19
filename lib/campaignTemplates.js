/**
 * 14 variantes WhatsApp + e-mail — Balma (cession) et Offres promo (29 / 259).
 * {prenom} est remplacé à l’envoi. Jamais d’IBAN dans ces textes.
 */

import { EMAIL_CID_LOGO, emailCidSrc } from './emailInlineCids';
import {
  AVENTURE_URL,
  BALMA_WA_14,
  BALMA_EMAIL_SUBJECTS_14,
  fillBalmaCopy,
  pickBalmaVariant,
  waToEmailHtml,
  waToEmailText,
} from './balmaComCopy';
import { OFFRES_EMAIL_SUBJECTS_14, OFFRES_WA_14 } from './offresComCopy';
import { campaignTag, getCampaign, resolveCampaignKind } from './campaigns';

export { AVENTURE_URL };
export const COUR_DES_MIRACLES_EMAIL = 'contactgotatoulouse@gmail.com';
export const BALMA_CAMPAIGN_TAG = campaignTag('balma');
export const OFFRES_CAMPAIGN_TAG = campaignTag('offres');
/** @deprecated alias — la campagne promo n’est plus « Portet rentrée ». */
export const PORTET_CAMPAIGN_TAG = OFFRES_CAMPAIGN_TAG;

const BALMA_WA = BALMA_WA_14;
const OFFRES_WA = OFFRES_WA_14;

function emailShell({ title, paragraphs = [], bodyHtml = '', ctaLabel, lien }) {
  const logo = emailCidSrc(EMAIL_CID_LOGO);
  const body =
    bodyHtml ||
    paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.5">${p}</p>`).join('');
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Montserrat,Arial,sans-serif;color:#161A2E">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px">
      <tr>
        <td valign="middle" style="padding-right:12px">
          <img src="${logo}" alt="Boxing Center" width="48" height="48" border="0"
            style="display:block;width:48px;height:48px;border:0;border-radius:50%;background:#ffffff" />
        </td>
        <td valign="middle">
          <p style="margin:0;letter-spacing:.16em;text-transform:uppercase;font-size:12px;color:#6D3111">Boxing Center</p>
        </td>
      </tr>
    </table>
    <h1 style="font-family:'Barlow Condensed',Arial,sans-serif;font-size:28px">${title}</h1>
    ${body}
    <p><a href="${lien}" style="display:inline-block;background:#E8001C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">${ctaLabel}</a></p>
  </div>
</body></html>`;
}

function expandEmailVariants(kind) {
  if (kind === 'balma') {
    return BALMA_WA.map((wa, i) => ({
      id: i + 1,
      subject: BALMA_EMAIL_SUBJECTS_14[i] || '{prenom}, information Boxing Center Balma',
      text: waToEmailText(wa),
      html: (lien) =>
        emailShell({
          title: 'Information officielle — Balma Gramont',
          bodyHtml: waToEmailHtml(wa, lien),
          ctaLabel: 'Continuer chez Boxing Center',
          lien,
        }),
    }));
  }
  return OFFRES_WA.map((wa, i) => ({
    id: i + 1,
    subject: OFFRES_EMAIL_SUBJECTS_14[i] || '{prenom}, offres Boxing Center — 29 € ou 259 €',
    text: waToEmailText(wa),
    html: (lien) =>
      emailShell({
        title: 'Offres Boxing Center',
        bodyHtml: waToEmailHtml(wa, lien),
        ctaLabel: 'Je m’inscris',
        lien,
      }),
  }));
}

const offresPack = {
  tag: OFFRES_CAMPAIGN_TAG,
  lien: getCampaign('offres').lien,
  whatsapp: OFFRES_WA,
  email: expandEmailVariants('offres'),
};

export const TEMPLATES = {
  balma: {
    tag: BALMA_CAMPAIGN_TAG,
    lien: AVENTURE_URL,
    whatsapp: BALMA_WA,
    email: expandEmailVariants('balma'),
  },
  offres: offresPack,
  portet: offresPack,
};

export function fillTemplate(template, { prenom, lien } = {}) {
  return fillBalmaCopy(template, { prenom, lien });
}

export function pickVariant(list, seed = Date.now()) {
  return pickBalmaVariant(list, seed);
}

export function campaignKindFromSource(source) {
  const s = String(source || '').toLowerCase();
  if (s.includes('balma')) return 'balma';
  if (s.includes('portet') || s.includes('promo') || s.includes('offre')) return 'offres';
  return resolveCampaignKind(process.env.CAMPAIGN_KIND);
}

export function renderWhatsApp(kind, { prenom, seed } = {}) {
  const pack = TEMPLATES[resolveCampaignKind(kind)] || TEMPLATES.balma;
  const tpl = pickVariant(pack.whatsapp, seed);
  return fillTemplate(tpl, { prenom, lien: pack.lien });
}

export function renderEmail(kind, { prenom, seed } = {}) {
  const pack = TEMPLATES[resolveCampaignKind(kind)] || TEMPLATES.balma;
  const tpl = pickVariant(pack.email, seed);
  const subject = fillTemplate(tpl.subject, { prenom, lien: pack.lien });
  const text = fillTemplate(tpl.text, { prenom, lien: pack.lien });
  const html = fillTemplate(tpl.html(pack.lien), { prenom, lien: pack.lien });
  return { subject, text, html, tag: pack.tag };
}

export function templateCount(kind = 'balma') {
  const pack = TEMPLATES[resolveCampaignKind(kind)] || TEMPLATES.balma;
  return { whatsapp: pack.whatsapp.length, email: pack.email.length };
}
