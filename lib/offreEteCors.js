import { OFFRE_ETE_LANDING_URL } from './offreEteConfig';

function allowedOrigins() {
  const raw = process.env.OFFRE_ETE_CORS_ORIGINS || '';
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = ['https://boxingcenter.fr', 'https://www.boxingcenter.fr'];
  try {
    defaults.push(new URL(OFFRE_ETE_LANDING_URL).origin);
  } catch {
    /* ignore */
  }
  return new Set([...defaults, ...fromEnv]);
}

export function offreEteCorsHeaders(request) {
  const origin = request.headers.get('origin');
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin && allowedOrigins().has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  return headers;
}
