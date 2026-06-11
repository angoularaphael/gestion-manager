function botBaseUrl() {
  const raw =
    process.env.WHATSAPP_BOT_URL ||
    process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL ||
    '';
  return raw.replace(/\/$/, '');
}

const SECRET = () => process.env.SITE_API_SECRET || '';

function requireBotUrl() {
  const url = botBaseUrl();
  if (!url) {
    throw new Error(
      'Bot non configuré sur Vercel : ajoutez WHATSAPP_BOT_URL ou NEXT_PUBLIC_WHATSAPP_BOT_URL ' +
        '(ex. http://us2.bot-hosting.net:20042) puis redéployez.'
    );
  }
  return url;
}

async function fetchWithTimeout(url, opts, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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
        'Vérifiez que Bothosting est en ligne et que l’URL du bot est correcte.'
    );
  }
  throw new Error(raw.slice(0, 180) || `Erreur bot HTTP ${res.status}`);
}

export function getBotConfig() {
  const url = botBaseUrl();
  let host = '';
  try {
    host = url ? new URL(url).host : '';
  } catch {
    host = '';
  }
  return {
    configured: Boolean(url),
    host,
    hasSecret: Boolean(SECRET()),
  };
}

export async function probeBot() {
  const config = getBotConfig();
  if (!config.configured) {
    return { ...config, reachable: false, error: 'URL du bot non configurée sur Vercel' };
  }

  try {
    const res = await fetchWithTimeout(`${botBaseUrl()}/api/status`, { cache: 'no-store' }, 12000);
    const data = await readBotJson(res);
    if (!res.ok) {
      return { ...config, reachable: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ...config, reachable: true, connected: Boolean(data.connected) };
  } catch (e) {
    return {
      ...config,
      reachable: false,
      error: String(e.message || e).includes('abort')
        ? 'Le bot ne répond pas (délai dépassé). Bothosting est-il démarré ?'
        : String(e.message || e),
    };
  }
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
    res = await fetchWithTimeout(url, opts, timeoutMs);
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes('fetch failed') || msg.includes('abort') || msg.includes('timeout')) {
      throw new Error(
        'Impossible de joindre le bot Bothosting depuis Vercel. ' +
          'Vérifiez que le bot tourne sur Bothosting et que WHATSAPP_BOT_URL est correct.'
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
