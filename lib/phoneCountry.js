/** Map international phone digits (sans +) to French country labels (managerCountry.js). */

const PHONE_PREFIX_COUNTRY = [
  ['995', 'Géorgie'],
  ['507', 'Panama'],
  ['420', 'République tchèque'],
  ['380', 'Ukraine'],
  ['376', 'Andorre'],
  ['371', 'Lettonie'],
  ['352', 'Luxembourg'],
  ['351', 'Portugal'],
  ['54', 'Argentine'],
  ['49', 'Allemagne'],
  ['48', 'Pologne'],
  ['44', 'Royaume-Uni'],
  ['43', 'Autriche'],
  ['39', 'Italie'],
  ['34', 'Espagne'],
  ['33', 'France'],
  ['32', 'Belgique'],
  ['31', 'Pays-Bas'],
  ['30', 'Grèce'],
  ['1', 'USA'],
];

export function countryFromPhone(input) {
  if (!input) return null;
  let digits = String(input).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  for (const [prefix, country] of PHONE_PREFIX_COUNTRY) {
    if (digits.startsWith(prefix)) return country;
  }
  return null;
}
