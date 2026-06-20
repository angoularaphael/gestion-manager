/** Base HTTPS fiable — boxingcenter.fr renvoie du HTML à la place des PNG. */
const TRUSTED_IMAGE_BASE = (
  process.env.EMAIL_IMAGE_CDN_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://gestion-manager.vercel.app'
).replace(/\/$/, '');

function isLikelyImageUrl(url) {
  if (!url) return false;
  if (/boxingcenter\.fr/i.test(url)) return false;
  return /^https:\/\//i.test(url);
}

/** URL de secours si le client mail ignore les cid: (rare). */
export function emailLogoFallbackUrl() {
  const custom = (process.env.NEXT_PUBLIC_LOGO_URL || '').trim();
  if (isLikelyImageUrl(custom)) return custom;
  return `${TRUSTED_IMAGE_BASE}/offre-d-ete/assets/logo-boxing-center.png`;
}

export function emailOffreHeroFallbackUrl() {
  const custom = (process.env.NEXT_PUBLIC_EMAIL_HERO_URL || '').trim();
  if (isLikelyImageUrl(custom)) return custom;
  return `${TRUSTED_IMAGE_BASE}/offre-d-ete/assets/email-offre.jpg`;
}

/** @deprecated utiliser emailLogoFallbackUrl — conservé pour compat. */
export function emailLogoUrl() {
  return emailLogoFallbackUrl();
}

export function emailOffreHeroImageUrl() {
  return emailOffreHeroFallbackUrl();
}
