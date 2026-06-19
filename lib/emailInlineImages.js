import fs from 'fs';
import path from 'path';
import { EMAIL_CID_HERO, EMAIL_CID_LOGO } from './emailInlineCids';

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

/** Pièces jointes inline Mailjet v3.1 — serveur uniquement (API routes). */
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
