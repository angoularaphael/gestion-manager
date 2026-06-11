/** URL du bot Bothosting — même variable que NYC Cookies. */
function botBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL ||
    process.env.WHATSAPP_BOT_URL ||
    '';
  return raw.replace(/\/$/, '');
}

const SECRET = () => process.env.SITE_API_SECRET || '';

function requireBotUrl() {
  const url = botBaseUrl();
  if (!url) {
    throw new Error(
      'Bot non configuré : ajoutez NEXT_PUBLIC_WHATSAPP_BOT_URL sur Vercel ' +
        '(ex. http://us2.bot-hosting.net:20042) puis redéployez.'
    );
  }
  return url;
}

function botHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const secret = SECRET();
  if (secret) headers['x-api-secret'] = secret;
  return headers;
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

function isHtmlResponse(text) {
  const t = String(text).trim().toLowerCase();
  return t.startsWith('<!doctype html') || t.startsWith('<html');
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
  if (isHtmlResponse(trimmed)) {
    throw new Error(
      'Bot inaccessible (page HTML reçue). Vérifiez que Bothosting tourne et que ' +
        'NEXT_PUBLIC_WHATSAPP_BOT_URL=http://us2.bot-hosting.net:20042 sur Vercel.'
    );
  }
  throw new Error(trimmed.slice(0, 180) || `Erreur bot HTTP ${res.status}`);
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
    return { ...config, reachable: false, error: 'NEXT_PUBLIC_WHATSAPP_BOT_URL manquant sur Vercel' };
  }

  try {
    const res = await fetchWithTimeout(
      `${botBaseUrl()}/api/status`,
      { headers: botHeaders(), cache: 'no-store' },
      12000
    );
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
        ? 'Le bot ne répond pas. Bothosting est-il démarré ?'
        : String(e.message || e),
    };
  }
}

function botTimeoutMs(path) {
  if (
    path === '/api/send-to-managers' ||
    path === '/api/send-to-promoteurs' ||
    path === '/api/send-to-boxeurs'
  ) {
    return 90000;
  }
  if (path.startsWith('/api/send-')) return 45000;
  return 20000;
}

export async function botFetch(path, { method = 'GET', body } = {}, attempt = 0) {
  const url = `${requireBotUrl()}${path}`;
  const timeoutMs = botTimeoutMs(path);
  const opts = {
    method,
    headers: botHeaders(),
    cache: 'no-store',
  };
  if (body) opts.body = JSON.stringify(body);

  if (method !== 'GET' && !SECRET()) {
    throw new Error(
      'SITE_API_SECRET manquant sur Vercel — doit être identique au bot Bothosting.'
    );
  }

  let res;
  try {
    res = await fetchWithTimeout(url, opts, timeoutMs);
  } catch (e) {
    const msg = String(e.message || e);
    const transient =
      msg.includes('fetch failed') || msg.includes('abort') || msg.includes('timeout');
    if (transient && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      return botFetch(path, { method, body }, attempt + 1);
    }
    if (transient) {
      throw new Error(
        'Bot inaccessible depuis Vercel (réseau ou délai). Vérifiez NEXT_PUBLIC_WHATSAPP_BOT_URL ' +
          '(http://us2.bot-hosting.net:20042), que Bothosting tourne, puis redéployez.'
      );
    }
    throw e;
  }

  const data = await readBotJson(res);
  if (res.status === 401) {
    throw new Error('SITE_API_SECRET incorrect sur Vercel ou sur le bot Bothosting.');
  }
  if (!res.ok) throw new Error(data.error || res.statusText || `Erreur HTTP ${res.status}`);
  return data;
}

export async function parseClientJson(res) {
  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch {
    if (isHtmlResponse(raw)) {
      throw new Error('Bot inaccessible — vérifiez Bothosting et NEXT_PUBLIC_WHATSAPP_BOT_URL sur Vercel.');
    }
    throw new Error('Réponse invalide du serveur.');
  }
}
