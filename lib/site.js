import { emailLogoFallbackUrl } from './emailAssets';

export const BOXING_CENTER_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'boxingcenter31@gmail.com';

export const BREVO_SENDER_EMAIL =
  process.env.NEXT_PUBLIC_BREVO_SENDER_EMAIL || 'suzinabot@11426075.brevosend.com';

export const RECEPTION_EMAIL =
  process.env.NEXT_PUBLIC_RECEPTION_EMAIL || BOXING_CENTER_CONTACT_EMAIL;

export const BOXING_CENTER_SITE =
  process.env.NEXT_PUBLIC_BOXING_CENTER_SITE || 'https://boxingcenter.fr/';

export const BOXING_CENTER_LOGO_URL = emailLogoFallbackUrl();
