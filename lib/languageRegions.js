/** Pays francophones */
export const FRANCOPHONE_COUNTRIES = new Set([
  'France',
  'Belgique',
  'Luxembourg',
  'Andorre',
  'Monaco',
  'Suisse',
  'Sénégal',
  'Mali',
  "Côte d'Ivoire",
  'Cameroun',
  'Tunisie',
  'Maroc',
  'Algérie',
  'Haïti',
  'Réunion',
  'Guadeloupe',
  'Martinique',
  'Burkina Faso',
  'Bénin',
  'Togo',
  'Madagascar',
]);

/** Pays anglophones */
export const ANGLO_COUNTRIES = new Set([
  'USA',
  'Royaume-Uni',
  'Irlande',
  'Australie',
  'Canada',
  'Ghana',
  'Nigeria',
  'Afrique du Sud',
  'Nouvelle-Zélande',
  'Jamaïque',
  'Philippines',
]);

/** Pays hispanophones */
export const HISPANIC_COUNTRIES = new Set([
  'Espagne',
  'Argentine',
  'Mexique',
  'Colombie',
  'Venezuela',
  'Équateur',
  'Panama',
  'Porto Rico',
  'Chili',
  'Pérou',
  'Bolivie',
  'Uruguay',
  'Paraguay',
  'Costa Rica',
  'Cuba',
  'République dominicaine',
  'Guatemala',
  'Honduras',
  'Nicaragua',
  'Salvador',
]);

export const LANGUAGE_REGIONS = [
  {
    id: 'francophone',
    label: 'Francophones',
    lang: 'fr',
    langLabel: 'Message en français',
    description: 'France, Belgique, Luxembourg…',
  },
  {
    id: 'anglo',
    label: 'Anglophones',
    lang: 'en',
    langLabel: 'Message en anglais',
    description: 'USA, Royaume-Uni, Australie…',
  },
  {
    id: 'hispanique',
    label: 'Hispanophones',
    lang: 'es',
    langLabel: 'Message en espagnol',
    description: 'Espagne, Argentine, Panama…',
  },
  {
    id: 'reste',
    label: 'Reste du monde',
    lang: 'en',
    langLabel: 'Anglais par défaut',
    description: 'Allemagne, Italie, Pologne, Ukraine…',
  },
];

const REGION_SETS = {
  francophone: FRANCOPHONE_COUNTRIES,
  anglo: ANGLO_COUNTRIES,
  hispanique: HISPANIC_COUNTRIES,
};

export function getCountryRegion(country) {
  const name = String(country || '').trim();
  if (!name || name === '—') return 'reste';
  if (FRANCOPHONE_COUNTRIES.has(name)) return 'francophone';
  if (HISPANIC_COUNTRIES.has(name)) return 'hispanique';
  if (ANGLO_COUNTRIES.has(name)) return 'anglo';
  return 'reste';
}

/** Langue du message à envoyer (reste → anglais). */
export function getMessageLanguageForCountry(country) {
  const region = getCountryRegion(country);
  const meta = LANGUAGE_REGIONS.find((r) => r.id === region);
  return meta?.lang || 'en';
}

export function getRegionMeta(regionId) {
  return LANGUAGE_REGIONS.find((r) => r.id === regionId) || LANGUAGE_REGIONS[3];
}

export function resolveCountriesForRegion(availableNames = [], regionId) {
  const available = [...new Set(availableNames.filter(Boolean))];
  if (!available.length) return [];

  if (regionId === 'reste') {
    return available.filter((name) => getCountryRegion(name) === 'reste');
  }

  const set = REGION_SETS[regionId];
  if (!set) return [];
  return available.filter((name) => set.has(name));
}

export function countContactsForRegion(availableNames = [], regionId) {
  return resolveCountriesForRegion(availableNames, regionId).length;
}

export function detectActiveRegion(selectedCountries = [], availableNames = []) {
  if (!selectedCountries.length) return null;
  const selected = [...selectedCountries].sort().join('|');
  for (const region of LANGUAGE_REGIONS) {
    const resolved = resolveCountriesForRegion(availableNames, region.id).sort().join('|');
    if (resolved && resolved === selected) return region.id;
  }
  return null;
}

export function suggestMessageLanguage(selectedCountries = []) {
  if (!selectedCountries.length) return 'en';
  const langs = new Set(selectedCountries.map((c) => getMessageLanguageForCountry(c)));
  if (langs.size === 1) return [...langs][0];
  if (langs.has('fr') && langs.size === 1) return 'fr';
  return 'en';
}

export const JOHNSON_SUFFO_SUBJECTS = {
  fr: 'Recherche combat — Johnson SUFFO (70–73 kg)',
  en: 'Fight opportunity — Johnson SUFFO (70–73 kg)',
  es: 'Búsqueda de combate — Johnson SUFFO (70–73 kg)',
};

export const JOHNSON_SUFFO_MESSAGES = {
  fr: `Bonjour,

Nous sommes actuellement à la recherche d'un combat pour notre boxeur Johnson SUFFO :
https://boxrec.com/en/box-pro/1197459

Catégorie : 70 à 73 kg.
Disponible immédiatement.

N'hésitez pas à nous contacter si vous recherchez un boxeur correspondant à ce profil.

Sportivement,
Boxing Center`,

  en: `Hello,

We are currently looking for a fight for our boxer Johnson SUFFO:
https://boxrec.com/en/box-pro/1197459

Weight class: 70 to 73 kg.
Available immediately.

Please feel free to contact us if you are looking for a boxer matching this profile.

Best regards,
Boxing Center`,

  es: `Hola,

Actualmente buscamos un combate para nuestro boxeador Johnson SUFFO:
https://boxrec.com/en/box-pro/1197459

Categoría: 70 a 73 kg.
Disponible de inmediato.

No dude en contactarnos si busca un boxeador que corresponda a este perfil.

Saludos,
Boxing Center`,
};

export function getJohnsonSuffoTemplate(lang = 'en') {
  const key = ['fr', 'en', 'es'].includes(lang) ? lang : 'en';
  return {
    subject: JOHNSON_SUFFO_SUBJECTS[key],
    message: JOHNSON_SUFFO_MESSAGES[key],
    lang: key,
  };
}
