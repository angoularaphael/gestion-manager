/** Export / import : nom, prénom, num, email, salle */
import { normalizeFrenchPhone, phoneDedupKey, formatClientPhone } from './phoneFormat';

export const CLIENT_CSV_HEADERS = ['Email', 'Prénom', 'Nom', 'Numéro de téléphone', 'Salle'];

function parseCsvRow(line) {
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
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function cleanPhone(value) {
  return normalizeFrenchPhone(value);
}

/** Clé de dédoublonnage import (email ou 9 derniers chiffres du téléphone). */
export function clientImportIdentityKey(fields) {
  const email = normalizeEmail(fields.email);
  if (email) return `e:${email}`;
  const phone = phoneDedupKey(fields.telephone);
  if (phone) return `t:${phone}`;
  const name = [fields.prenom, fields.nom]
    .filter(Boolean)
    .map((s) => String(s).trim().toLowerCase())
    .join('|');
  if (name && phone) return `n:${name}|${phone}`;
  return null;
}

/** Retire les doublons dans un fichier avant envoi au serveur. */
export function dedupeClientFieldsForImport(rows) {
  const seen = new Set();
  const unique = [];
  let skippedDuplicates = 0;

  for (const raw of rows) {
    const fields = {
      nom: raw.nom?.trim() || null,
      prenom: raw.prenom?.trim() || null,
      telephone: cleanPhone(raw.telephone),
      email: normalizeEmail(raw.email),
      salle: raw.salle?.trim() || null,
      source: raw.source || 'csv',
    };

    if (!fields.email && !fields.telephone) continue;

    const key = clientImportIdentityKey(fields);
    if (!key || seen.has(key)) {
      skippedDuplicates++;
      continue;
    }
    seen.add(key);
    unique.push(fields);
  }

  return { rows: unique, skippedDuplicates };
}

function normalizeEmail(value) {
  const e = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

function cleanCell(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .trim() || null;
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(text) {
  return decodeHtmlEntities(String(text || '').replace(/<[^>]+>/g, '')).trim();
}

export function parseClientCsv(text) {
  const raw = String(text || '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const headers = parseCsvRow(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });
}

/** Export membres (.xls HTML) — colonnes Nom, Prénom, Tél.portable, E-mail, Site */
export function parseMembersXlsHtml(html) {
  const rows = [...String(html || '').matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (!rows.length) return [];

  const tableRows = rows.map((m) =>
    [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripHtml(cell[1]))
  );

  const headers = tableRows[0] || [];
  return tableRows.slice(1).map((cells) => {
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });
}

export function rowToClientFields(row, source = 'csv') {
  const email = normalizeEmail(
    row.Email || row.email || row['E-mail'] || row['e-mail']
  );
  const nom =
    cleanCell(row.Nom || row.nom || row['Nom de famille']) || null;
  const prenom =
    cleanCell(row['Prénom'] || row.Prenom || row.prenom) || null;
  const telephone = cleanPhone(
    row['Numéro de téléphone'] ||
      row.Num ||
      row.num ||
      row.telephone ||
      row['Tél.portable'] ||
      row['Tél.perso'] ||
      row['Tél.urgence']
  );
  const salle =
    cleanCell(row.Salle || row.salle || row.Site || row.site) || null;

  return { nom, prenom, telephone, email, salle, source };
}

export function csvRowToClientFields(row) {
  return rowToClientFields(row, 'csv');
}

export function xlsRowToClientFields(row) {
  return rowToClientFields(row, 'xls');
}

export function clientToCsvRow(client) {
  return {
    Email: client.email || '',
    Prénom: client.prenom || '',
    Nom: client.nom || '',
    'Numéro de téléphone': formatClientPhone(client.telephone) || '',
    Salle: client.salle || '',
  };
}

function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function clientsToCsv(clients) {
  const headers = CLIENT_CSV_HEADERS;
  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const client of clients) {
    const row = clientToCsvRow(client);
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(','));
  }
  return lines.join('\r\n');
}

export function parseClientImportFile(text, filename = '') {
  const lower = String(filename).toLowerCase();
  if (lower.endsWith('.xls') || lower.endsWith('.html') || String(text).includes('<table')) {
    return parseMembersXlsHtml(text).map((row) => xlsRowToClientFields(row));
  }
  return parseClientCsv(text).map((row) => csvRowToClientFields(row));
}
