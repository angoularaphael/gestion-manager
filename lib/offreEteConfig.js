const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gestion-manager.vercel.app').replace(
  /\/$/,
  ''
);

export const OFFRE_ETE_SLUG = 'offre-ete-2026';

export const OFFRE_ETE_LANDING_PATH = `/${OFFRE_ETE_SLUG}`;

export const OFFRE_ETE_LANDING_URL = `${siteBase}${OFFRE_ETE_LANDING_PATH}`;

export const OFFRE_ETE_CLICK_URL = `${siteBase}/api/offre-ete/click`;

/** Quand false, le bouton « Réinitialiser » est masqué côté admin. */
export function isOffreEteResetAllowed() {
  const raw = process.env.OFFRE_ETE_ALLOW_RESET;
  if (raw === undefined || raw === '') return true;
  return raw === '1' || raw.toLowerCase() === 'true';
}
