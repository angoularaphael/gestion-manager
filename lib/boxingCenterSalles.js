/** 5 salles du réseau Boxing Center — alignées sur l'offre été 2026 */
export const BOXING_CENTER_SALLES = [
  { id: 'minimes', label: 'Les Minimes' },
  { id: 'ramonville', label: 'Ramonville' },
  { id: 'saint-cyprien', label: 'Saint-Cyprien' },
  { id: 'portet', label: 'Portet-sur-Garonne' },
  { id: 'etats-unis', label: 'États-Unis' },
];

const SALLE_ALIASES = {
  minimes: ['minimes', 'les minimes'],
  ramonville: ['ramonville', 'ramonville-saint-agne'],
  'saint-cyprien': ['saint-cyprien', 'st cyprien', 'saint cyprien'],
  portet: ['portet', 'portet-sur-garonne'],
  'etats-unis': ['états-unis', 'etats-unis', 'etats unis', 'états unis'],
};

/** Filtre client : valeur importée / chatbot vs id de salle canonique */
export function matchClientSalle(value, salleId) {
  if (!salleId) return true;
  const aliases = SALLE_ALIASES[salleId];
  if (!aliases) return true;
  const v = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  if (!v) return false;
  return aliases.some((a) => v.includes(a) || a.includes(v));
}

export function normalizeClientSalleLabel(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  if (!v) return null;
  for (const salle of BOXING_CENTER_SALLES) {
    if (matchClientSalle(v, salle.id)) return salle.label;
  }
  return String(value).trim() || null;
}
