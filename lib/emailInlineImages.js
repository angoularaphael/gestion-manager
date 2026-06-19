import fs from 'fs';
import path from 'path';

/** Images intégrées (cid:) — s'affichent même en spam sans charger d'URL externe. */
export const EMAIL_CID_LOGO = 'bc-logo@boxingcenter';
export const EMAIL_CID_HERO = 'bc-hero@boxingcenter';

const ASSETS = [
  { cid: EMAIL_CID_LOGO, file: 'logo-boxing-center.png' },
  { cid: EMAIL_CID_HERO, file: 'shirt.png' },
];

let cachedAttachments = null;

function readAssetBuffer(filename) {
  const filePath = path.join(process.cwd(), 'public', 'offre-d-ete', 'assets', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image email introuvable : public/offre-d-ete/assets/${filename}`);
  }
  return fs.readFileSync(filePath);
}

/** Pièces jointes inline Mailjet v3.1 (HTMLPart avec src="cid:…"). */
export function getEmailInlineAttachments() {
  if (cachedAttachments) return cachedAttachments;

  cachedAttachments = ASSETS.map(({ cid, file }) => ({
    ContentType: 'image/png',
    Filename: file,
    ContentID: cid,
    Base64Content: readAssetBuffer(file).toString('base64'),
  }));

  return cachedAttachments;
}

export function emailCidSrc(contentId) {
  return `cid:${contentId}`;
}
