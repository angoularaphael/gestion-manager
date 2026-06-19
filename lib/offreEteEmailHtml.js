import { OFFRE_ETE_LANDING_URL, OFFRE_ETE_SHOP_URL } from './offreEteConfig';
import { emailOffreHeroImageUrl } from './emailAssets';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailButton(url, label) {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto 8px;border-collapse:collapse;">
  <tr>
    <td align="center" style="border-radius:8px;background:#E30613;">
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.04em;">
        ${safeLabel}
      </a>
    </td>
  </tr>
</table>`;
}

export function buildOffreEteEmailHeroHtml() {
  const hero = escapeHtml(emailOffreHeroImageUrl());
  const shop = escapeHtml(OFFRE_ETE_SHOP_URL);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;border-collapse:collapse;">
  <tr>
    <td align="center" style="padding:0 0 12px;">
      <a href="${shop}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
        <img src="${hero}" alt="Offre été Boxing Center — 89 euros, t-shirt offert"
             width="260" height="auto"
             style="display:block;width:260px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto;" />
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;line-height:1.5;">
      89€ · 3 mois illimités · T-shirt offert (29,99€)
    </td>
  </tr>
</table>`;
}

/** Corps HTML campagne : texte + bouton boutique (meilleur que URL nue en spam). */
export function buildOffreEteEmailBodyHtml(body) {
  const shop = OFFRE_ETE_SHOP_URL;
  const landing = `${OFFRE_ETE_LANDING_URL.replace(/\/$/, '')}/`;
  const raw = String(body || '');

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.includes(shop) && !line.includes(landing));

  const htmlLines = lines.map((line) => escapeHtml(line)).join('<br>\n');

  return `${buildOffreEteEmailHeroHtml()}
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
${htmlLines}
</div>
${emailButton(shop, "Je profite de l'offre — 89€")}
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#64748b;text-align:center;">
  <a href="${escapeHtml(landing)}" style="color:#2563eb;text-decoration:underline;">Voir la présentation de l'offre</a>
</p>`;
}
