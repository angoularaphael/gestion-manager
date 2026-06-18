/** Quand false, le bouton « Réinitialiser » est masqué côté admin chatbot. */
export function isChatbotResetAllowed() {
  const raw = process.env.CHATBOT_ALLOW_RESET;
  if (raw === undefined || raw === '') return true;
  return raw === '1' || raw.toLowerCase() === 'true';
}

/** Origines autorisées pour les appels API publics du chatbot (CORS). */
export function chatbotCorsOrigins() {
  const raw = process.env.CHATBOT_CORS_ORIGINS || '';
  const fromEnv = raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://portet.boxingcenter.fr',
    'https://boxing-center-portet.vercel.app',
  ];
  return [...new Set([...defaults, ...fromEnv])];
}

export function chatbotCorsHeaders(request) {
  const origin = request.headers.get('origin');
  const allowed = chatbotCorsOrigins();
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  } else if (!origin) {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  return headers;
}
