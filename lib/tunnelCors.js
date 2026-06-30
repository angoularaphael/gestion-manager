const DEFAULT_ORIGINS = [
  'https://boxingcenter.fr',
  'https://www.boxingcenter.fr',
  'https://gestion-manager.vercel.app',
];

function allowedOrigins() {
  const raw = process.env.TUNNEL_CORS_ORIGINS || process.env.OFFRE_ETE_CORS_ORIGINS || '';
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...fromEnv]);
}

export function tunnelCorsHeaders(request) {
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
