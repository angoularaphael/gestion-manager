const BOT = () => process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL?.replace(/\/$/, '') || '';
const SECRET = () => process.env.SITE_API_SECRET || '';

function requireBotUrl() {
  const url = BOT();
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_WHATSAPP_BOT_URL manquant sur Vercel (ex. http://us2.bot-hosting.net:20042).'
    );
  }
  return url;
}

async function readBotJson(res) {
  const raw = await res.text();
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error('Réponse du bot illisible (JSON invalide).');
    }
  }
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    throw new Error(
      `Le bot a renvoyé une page HTML (HTTP ${res.status}). ` +
        'Vérifiez que Bothosting est en ligne et que NEXT_PUBLIC_WHATSAPP_BOT_URL est correct.'
    );
  }
  throw new Error(raw.slice(0, 180) || `Erreur bot HTTP ${res.status}`);
}

export async function botFetch(path, { method = 'GET', body } = {}) {
  const url = `${requireBotUrl()}${path}`;
  const timeoutMs = path === '/api/send-to-managers' ? 90000 : 20000;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  };
  const publicPaths = ['/api/status', '/api/start', '/api/logout'];
  if (!publicPaths.includes(path)) {
    opts.headers['x-api-secret'] = SECRET();
  }
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes('fetch failed') || msg.includes('abort') || msg.includes('timeout')) {
      throw new Error(
        'Bot inaccessible ou trop lent. Vérifiez Bothosting et NEXT_PUBLIC_WHATSAPP_BOT_URL.'
      );
    }
    throw e;
  }

  const data = await readBotJson(res);
  if (!res.ok) throw new Error(data.error || res.statusText || `Erreur HTTP ${res.status}`);
  return data;
}

export async function parseClientJson(res) {
  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch {
    if (raw.trim().startsWith('<!DOCTYPE') || raw.trim().startsWith('<html')) {
      throw new Error(
        `Erreur serveur (${res.status}) — délai Vercel dépassé ou API indisponible. Réessayez ou redémarrez le bot.`
      );
    }
    throw new Error('Réponse invalide du serveur.');
  }
}
