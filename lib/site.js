export const RECEPTION_EMAIL =
  process.env.NEXT_PUBLIC_RECEPTION_EMAIL || 'farenogig05@gmail.com';

export const BOXING_CENTER_SITE =
  process.env.NEXT_PUBLIC_BOXING_CENTER_SITE || 'https://boxingcenter.fr/';

export const BOXING_CENTER_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'boxingcenter31@gmail.com';

const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gestion-manager.vercel.app').replace(
  /\/$/,
  ''
);

export const BOXING_CENTER_LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL || `${siteBase}/logo.png`;
