import { OFFRE_ETE_LANDING_URL, OFFRE_ETE_SHOP_URL } from './offreEteConfig';
import { emailOffreHeroFallbackUrl } from './emailAssets';

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
         style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
        ${safeLabel}
      </a>
    </td>
  </tr>
</table>`;
}

export function buildOffreEteEmailHeroHtml({ heroSrc } = {}) {
  const hero = escapeHtml(heroSrc || emailOffreHeroFallbackUrl());
  const shop = escapeHtml(OFFRE_ETE_SHOP_URL);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;border-collapse:collapse;">
  <tr>
    <td align="center" style="padding:0 0 12px;">
      <a href="${shop}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
        <img src="${hero}" alt="Offre ete Boxing Center - t-shirt offert"
             width="260"
             style="display:block;width:260px;max-width:100%;border:0;outline:none;text-decoration:none;margin:0 auto;" />
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#0f172a;line-height:1.5;">
      89€ tout compris — abonnement 3 mois + t-shirt offert
    </td>
  </tr>
</table>`;
}

/** Corps HTML campagne : hero integre + texte + bouton boutique. */
export function buildOffreEteEmailBodyHtml(body, { heroSrc } = {}) {
  const shop = OFFRE_ETE_SHOP_URL;
  const landing = `${OFFRE_ETE_LANDING_URL.replace(/\/$/, '')}/`;
  const raw = String(body || '');

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.includes(shop) && !line.includes(landing));

  const htmlLines = lines.map((line) => escapeHtml(line)).join('<br>\n');

  return `${buildOffreEteEmailHeroHtml({ heroSrc })}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;border-collapse:collapse;">
  <tr>
    <td style="padding:14px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#14532d;">
      <strong style="display:block;margin-bottom:6px;font-size:15px;">89€ tout compris</strong>
      Tu paies <strong>89€ une seule fois</strong>.<br>
      • 3 mois d'abonnement illimité (5 salles, tous les cours)<br>
      • 1 t-shirt offert — <strong>inclus, rien à payer en plus</strong>
    </td>
  </tr>
</table>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#334155;">
${htmlLines}
</div>
${emailButton(shop, 'Commander pour 89€')}
<p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#64748b;text-align:center;">
  <a href="${escapeHtml(landing)}" style="color:#2563eb;text-decoration:underline;">Presentation de l'offre sur boxingcenter.fr</a>
</p>`;
}
