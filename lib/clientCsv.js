/** En-têtes CSV historiques (séances d'essai / marketing). */
export const CLIENT_CSV_HEADERS = [
  'Email',
  'Prénom',
  'Nom de famille',
  'Adresse',
  'Cours',
  'Nom de la banque',
  'Date de naissance',
  'Salle',
  "Numéro d'identification fiscale",
  "Nom de l'entreprise",
  'Numéro de téléphone',
  'Pays',
  'Région',
  'Ville',
  'Code postal',
  'Quartier',
  'Numéro de rue',
  'IBAN',
  'Tag',
  'Date Registered',
];

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

function parseRegisteredAt(value) {
  if (!value) return null;
  const m = String(value).match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (!m) return null;
  const d = new Date(`${m[1]}T${m[2]}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseDateOnly(value) {
  if (!value) return null;
  const s = String(value).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function cleanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits || null;
}

export function csvRowToClientFields(row) {
  const email = String(row.Email || row.email || '')
    .trim()
    .toLowerCase();
  return {
    email: email || null,
    prenom: String(row['Prénom'] || row.prenom || '').trim() || null,
    nom: String(row['Nom de famille'] || row.nom || '').trim() || null,
    adresse: String(row.Adresse || '').trim() || null,
    cours: String(row.Cours || '').trim() || null,
    date_naissance: parseDateOnly(row['Date de naissance']),
    salle: String(row.Salle || '').trim() || null,
    pays: String(row.Pays || 'FR').trim() || 'FR',
    region: String(row.Région || '').trim() || null,
    ville: String(row.Ville || '').trim() || null,
    code_postal: String(row['Code postal'] || '').trim() || null,
    quartier: String(row.Quartier || '').trim() || null,
    numero_rue: String(row['Numéro de rue'] || '').trim() || null,
    tag: String(row.Tag || '').trim() || null,
    telephone: cleanPhone(row['Numéro de téléphone'] || row.telephone),
    registered_at: parseRegisteredAt(row['Date Registered']),
    source: 'csv',
  };
}

export function clientToCsvRow(client, { includeSensitive = false } = {}) {
  const row = {
    Email: client.email || '',
    'Prénom': client.prenom || '',
    'Nom de famille': client.nom || '',
    Adresse: client.adresse || '',
    Cours: client.cours || '',
    'Nom de la banque': '',
    'Date de naissance': client.date_naissance || '',
    Salle: client.salle || '',
    "Numéro d'identification fiscale": '',
    "Nom de l'entreprise": '',
    'Numéro de téléphone': client.telephone || '',
    Pays: client.pays || 'FR',
    Région: client.region || '',
    Ville: client.ville || '',
    'Code postal': client.code_postal || '',
    Quartier: client.quartier || '',
    'Numéro de rue': client.numero_rue || '',
    IBAN: includeSensitive ? client.iban || '' : '',
    Tag: client.tag || '',
    'Date Registered': client.registered_at
      ? new Date(client.registered_at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
      : '',
  };
  return row;
}

function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function clientsToCsv(clients, opts = {}) {
  const headers = CLIENT_CSV_HEADERS;
  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const client of clients) {
    const row = clientToCsvRow(client, opts);
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(','));
  }
  return lines.join('\r\n');
}
