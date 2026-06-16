const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gestion-manager.vercel.app').replace(
  /\/$/,
  ''
);

export const OFFRE_ETE_SLUG = 'offre-ete-2026';

/** Chemin public sur boxingcenter.fr (page WordPress / dossier statique). */
export const OFFRE_ETE_WORDPRESS_PATH = '/offre-d-ete';

export const OFFRE_ETE_LANDING_PATH = `/${OFFRE_ETE_SLUG}`;

/** Landing hébergée sur le site principal — pas sur gestion-manager. */
export const OFFRE_ETE_LANDING_URL = (
  process.env.NEXT_PUBLIC_OFFRE_ETE_LANDING_URL || 'https://boxingcenter.fr/offre-d-ete'
).replace(/\/$/, '');

export const OFFRE_ETE_CLICK_URL = `${siteBase}/api/offre-ete/click`;

/** Boutique PrestaShop — boutons « Je profite de l'offre » */
export const OFFRE_ETE_SHOP_URL =
  'https://boutique.boxingcenter.fr/accueil/156-2424-offre-ete-2026-3-mois-illimites-a-89-.html#/31-salle_principale_d_entrainement-toulouse_st_cyprien';

/** Quand false, le bouton « Réinitialiser » est masqué côté admin. */
export function isOffreEteResetAllowed() {
  const raw = process.env.OFFRE_ETE_ALLOW_RESET;
  if (raw === undefined || raw === '') return true;
  return raw === '1' || raw.toLowerCase() === 'true';
}
