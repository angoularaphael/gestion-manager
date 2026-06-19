/** Identifiants cid: pour images intégrées dans les emails (sans fs — safe client). */
export const EMAIL_CID_LOGO = 'bc-logo@boxingcenter';
export const EMAIL_CID_HERO = 'bc-hero@boxingcenter';

export function emailCidSrc(contentId) {
  return `cid:${contentId}`;
}
