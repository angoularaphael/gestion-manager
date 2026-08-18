/**
 * Import Deciplus Balma — CSV « ; » UTF-8.
 * Ne jamais copier IBAN / BIC / rum / n° de compte / notes compta.
 */
import { normalizeFrenchPhone } from './phoneFormat';

export const BALMA_IMPORT_TAG = 'balma_cession_2026';
export const PORTET_IMPORT_TAG = 'portet_rentree_2026';

const SKIP_CATEGORIES = new Set(['staff', 'prospect']);
const SECRET_HEADERS = /iban|bic|rum|compte|mandat|guichet|etablissement|cle|notes\.compta|nom rib|nom banque/i;

function parseSemiCsvRow(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ';' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.replace(/^"|"$/g, '').trim());
}

function normalizeEmail(value) {
  const e = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

function ageFromFrDate(value) {
  const m = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dt = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (Number.isNaN(dt.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dt.getFullYear();
  const md = now.getMonth() - dt.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < dt.getDate())) age -= 1;
  return age;
}

function isDeciplusMembersCsv(text) {
  const head = String(text || '')
    .split(/\r?\n/)[0]
    .toLowerCase();
  return head.includes('id_client') && (head.includes('tél.portable') || head.includes('ok.mailing'));
}

export function parseBalmaDeciplusCsv(text, { wave = 'all' } = {}) {
  const raw = String(text || '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { rows: [], skipped: 0, stats: {} };

  const headers = parseSemiCsvRow(lines[0]);
  const safeIdx = headers.map((h, i) => ({ h, i })).filter(({ h }) => !SECRET_HEADERS.test(h));

  let skipped = 0;
  const stats = { client: 0, ancien: 0, staff: 0, prospect: 0, empty: 0, mailingN: 0, minor: 0 };
  const rows = [];

  for (const line of lines.slice(1)) {
    const values = parseSemiCsvRow(line);
    const rec = {};
    for (const { h, i } of safeIdx) rec[h] = values[i] || '';

    const nom = String(rec.Nom || '').trim();
    const prenom = String(rec['Prénom'] || rec.Prenom || '').trim();
    const cat = String(rec.Catégorie || rec.Categorie || '').trim();
    const catKey = cat.toLowerCase();
    if (!nom && !prenom) {
      skipped += 1;
      stats.empty += 1;
      continue;
    }
    if (SKIP_CATEGORIES.has(catKey)) {
      skipped += 1;
      if (catKey === 'staff') stats.staff += 1;
      else stats.prospect += 1;
      continue;
    }
    if (wave === 'client' && catKey !== 'client') {
      skipped += 1;
      continue;
    }
    if (wave === 'ancien' && catKey !== 'ancien client') {
      skipped += 1;
      continue;
    }
    if (catKey === 'client') stats.client += 1;
    if (catKey === 'ancien client') stats.ancien += 1;

    const okMail = String(rec['OK.mailing'] || rec['OK mailing'] || 'O')
      .trim()
      .toUpperCase();
    if (okMail === 'N') stats.mailingN += 1;

    const age = ageFromFrDate(rec['D.naissance']);
    const minor = age != null && age < 18;
    if (minor) stats.minor += 1;

    const email = okMail === 'O' ? normalizeEmail(rec['E-mail'] || rec.Email) : null;
    const telephone = normalizeFrenchPhone(rec['Tél.portable'] || rec['Tél.perso']);

    if (!email && !telephone) {
      skipped += 1;
      continue;
    }

    rows.push({
      nom,
      prenom,
      telephone: minor ? null : telephone,
      email,
      salle: rec.Site || 'BOXING CENTER Balma',
      source: BALMA_IMPORT_TAG,
      categorie: cat,
      deciplus_id: rec.Id_client || null,
      ok_mailing: okMail,
      minor,
    });
  }

  return { rows, skipped, stats };
}

export function parseCampaignImportFile(text, filename = '', { wave = 'all' } = {}) {
  if (isDeciplusMembersCsv(text) || /membres/i.test(filename)) {
    return parseBalmaDeciplusCsv(text, { wave });
  }
  return null;
}
