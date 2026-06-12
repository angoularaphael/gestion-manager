const COUNTRY_ALIASES = {
  usa: 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  uk: 'Royaume-Uni',
  'united kingdom': 'Royaume-Uni',
  england: 'Royaume-Uni',
  scotland: 'Royaume-Uni',
  wales: 'Royaume-Uni',
  uae: 'Émirats arabes unis',
  'united arab emirates': 'Émirats arabes unis',
  deutschland: 'Allemagne',
  germany: 'Allemagne',
  france: 'France',
  mexico: 'Mexique',
  méxico: 'Mexique',
  spain: 'Espagne',
  españa: 'Espagne',
  italy: 'Italie',
  italia: 'Italie',
  netherlands: 'Pays-Bas',
  australia: 'Australie',
  canada: 'Canada',
  latvia: 'Lettonie',
  poland: 'Pologne',
  austria: 'Autriche',
  ghana: 'Ghana',
  nigeria: 'Nigeria',
  colombia: 'Colombie',
  argentina: 'Argentine',
  venezuela: 'Venezuela',
  ecuador: 'Équateur',
  'puerto rico': 'Porto Rico',
  dubai: 'Émirats arabes unis',
};

const US_STATES = new Set([
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
]);

const DE_REGIONS = new Set([
  'Baden-Württemberg', 'Baden-Wurttemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen',
  'Rheinland-Pfalz', 'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein',
  'Thüringen', 'Thuringen', 'Germany',
]);

const ES_REGIONS = new Set([
  'Comunidad de Madrid', 'Comunidad Valenciana', 'Cataluña', 'Catalonia', 'Andalucía',
  'España', 'Spain',
]);

const AR_REGIONS = new Set(['Buenos Aires', 'Distrito Federal', 'Argentina']);

const MX_REGIONS = new Set(['Distrito Federal', 'Mexico', 'México']);

const CITY_COUNTRY = {
  Geneva: 'Suisse',
  Zurich: 'Suisse',
  Bern: 'Suisse',
  Plzen: 'République tchèque',
  Prague: 'République tchèque',
  Ljubljana: 'Slovénie',
  Berlin: 'Allemagne',
  Hamburg: 'Allemagne',
  Munich: 'Allemagne',
  Paris: 'France',
  London: 'Royaume-Uni',
  Dublin: 'Irlande',
  'San Juan': 'Porto Rico',
  Montreal: 'Canada',
  Toronto: 'Canada',
  Quebec: 'Canada',
  Sydney: 'Australie',
  Melbourne: 'Australie',
};

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function labelFromAlias(key) {
  return COUNTRY_ALIASES[key] || null;
}

function matchCountry(segment) {
  const key = normalizeKey(segment);
  if (!key) return null;
  if (labelFromAlias(key)) return labelFromAlias(key);
  for (const [alias, label] of Object.entries(COUNTRY_ALIASES)) {
    if (key === normalizeKey(alias)) return label;
  }
  return null;
}

export function extractCountry(manager) {
  const loc = String(manager?.localisation || '').trim();
  const addr = String(manager?.adresse || '').trim();
  const sources = [loc, addr].filter(Boolean);

  for (const source of sources) {
    const parts = source.split(',').map((p) => p.trim()).filter(Boolean);
    const candidates = [...parts].reverse();
    if (!parts.length) candidates.push(source);

    for (const part of candidates) {
      const direct = matchCountry(part);
      if (direct) return direct;
      if (US_STATES.has(part)) return 'USA';
      if (DE_REGIONS.has(part)) return 'Allemagne';
      if (ES_REGIONS.has(part)) return 'Espagne';
      if (AR_REGIONS.has(part)) return 'Argentine';
      if (MX_REGIONS.has(part) && normalizeKey(part) !== 'distrito federal') return 'Mexique';
      if (CITY_COUNTRY[part]) return CITY_COUNTRY[part];
    }

    const whole = matchCountry(source);
    if (whole) return whole;
  }

  if (loc) {
    const last = loc.split(',').pop()?.trim();
    if (last && last.length > 2) return last;
  }

  return '—';
}

export function enrichManager(manager) {
  return { ...manager, pays: extractCountry(manager) };
}

export function listCountries(managers) {
  const counts = new Map();
  for (const m of managers) {
    const pays = extractCountry(m);
    if (pays === '—') continue;
    counts.set(pays, (counts.get(pays) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
    .map(([name, count]) => ({ name, count }));
}

export function filterManagers(managers, { search = '', type = '', country = '', countries = [] } = {}) {
  const q = search.trim().toLowerCase();
  const selected = countries?.length
    ? countries
    : country.trim()
      ? [country.trim()]
      : [];

  return managers.filter((m) => {
    if (type === 'both' && !(m.email && m.telephone)) return false;
    if (type === 'phone_only' && !(m.telephone && !m.email)) return false;
    if (type === 'email_only' && !(m.email && !m.telephone)) return false;
    if (type === 'none' && (m.email || m.telephone)) return false;

    if (selected.length && !selected.includes(extractCountry(m))) return false;

    if (!q) return true;
    return (
      m.nom?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.telephone?.toLowerCase().includes(q) ||
      m.localisation?.toLowerCase().includes(q) ||
      extractCountry(m).toLowerCase().includes(q)
    );
  });
}

export function contactLabel(manager) {
  if (manager.email && manager.telephone) return 'Email + tél.';
  if (manager.email) return 'Email';
  if (manager.telephone) return 'Téléphone';
  return 'Sans contact';
}
