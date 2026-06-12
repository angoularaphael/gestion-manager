export function parseCountriesFromSearch(search = '') {
  if (typeof window !== 'undefined' && !search) {
    search = window.location.search;
  }
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const repeated = params.getAll('country').map((c) => c.trim()).filter(Boolean);
  if (repeated.length) return [...new Set(repeated)];
  const csv = params.get('countries');
  if (csv) {
    return [...new Set(csv.split(',').map((c) => decodeURIComponent(c.trim())).filter(Boolean))];
  }
  return [];
}

export function buildCountriesQuery(countries = []) {
  const unique = [...new Set(countries.filter(Boolean))];
  if (!unique.length) return '';
  return unique.map((c) => `country=${encodeURIComponent(c)}`).join('&');
}

export function formatCountriesLabel(countries = [], { max = 3 } = {}) {
  if (!countries.length) return '';
  if (countries.length <= max) return countries.join(', ');
  return `${countries.slice(0, max).join(', ')} +${countries.length - max}`;
}
