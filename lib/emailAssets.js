const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gestion-manager.vercel.app').replace(
  /\/$/,
  ''
);

/** PNG HTTPS — les clients mail bloquent souvent le SVG et les URLs cassées. */
export function emailLogoUrl() {
  const custom = (process.env.NEXT_PUBLIC_LOGO_URL || '').trim();
  if (custom) return custom;
  return `${siteBase}/offre-d-ete/assets/logo-boxing-center.png`;
}

export function emailOffreHeroImageUrl() {
  const custom = (process.env.NEXT_PUBLIC_EMAIL_HERO_URL || '').trim();
  if (custom) return custom;
  return `${siteBase}/offre-d-ete/assets/shirt.png`;
}
