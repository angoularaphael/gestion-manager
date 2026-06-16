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

export function buildCountriesQuery(countries = [], { region = '' } = {}) {
  const unique = [...new Set(countries.filter(Boolean))];
  const parts = unique.map((c) => `country=${encodeURIComponent(c)}`);
  if (region) parts.push(`region=${encodeURIComponent(region)}`);
  if (!parts.length) return '';
  return parts.join('&');
}

export function parseRegionFromSearch(search = '') {
  if (typeof window !== 'undefined' && !search) {
    search = window.location.search;
  }
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const region = params.get('region');
  return region && ['francophone', 'anglo', 'hispanique', 'reste'].includes(region)
    ? region
    : '';
}

export function formatCountriesLabel(countries = [], { max = 3 } = {}) {
  if (!countries.length) return '';
  if (countries.length <= max) return countries.join(', ');
  return `${countries.slice(0, max).join(', ')} +${countries.length - max}`;
}
