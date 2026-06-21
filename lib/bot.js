import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';

/** Vercel/Node 18+ : préférer IPv4 vers Bothosting (HTTP). */
dns.setDefaultResultOrder('ipv4first');

/** URL du bot Bothosting — même variable que NYC Cookies. */
function botBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL ||
    process.env.WHATSAPP_BOT_URL ||
    '';
  return raw.trim().replace(/\/$/, '');
}

const SECRET = () => process.env.SITE_API_SECRET || '';

function requireBotUrl(override) {
  const url = (override || botBaseUrl()).trim().replace(/\/$/, '');
  if (!url) {
    throw new Error(
      'Bot non configuré : ajoutez NEXT_PUBLIC_WHATSAPP_BOT_URL ou WHATSAPP_BOT_URL_* sur Vercel ' +
        '(ex. http://us2.bot-hosting.net:20042) puis redéployez.'
    );
  }
  if (url.startsWith('https://')) {
    throw new Error(
      'L\'URL du bot doit être en HTTP (ex. http://us2.bot-hosting.net:20042). ' +
        'Bothosting n\'expose pas HTTPS sur le port du bot.'
    );
  }
  return url;
}

function botHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'gestion-manager/2.0',
    Connection: 'close',
  };
  const secret = SECRET();
  if (secret) headers['x-api-secret'] = secret;
  return headers;
}

function isTransientNetworkError(message) {
  const msg = String(message || '').toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('abort') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') ||
    msg.includes('eai_again') ||
    msg.includes('socket hang up') ||
    msg.includes('network')
  );
}

function botResponse(body, statusCode, statusMessage = '') {
  const text = typeof body === 'string' ? body : '';
  return {
    ok: statusCode >= 200 && statusCode < 300,
    status: statusCode,
    statusText: statusMessage,
    text: async () => text,
  };
}

/**
 * Requête HTTP(S) via module natif Node — plus fiable que fetch() depuis Vercel
 * vers un backend HTTP (Bothosting, port personnalisé, IPv4).
 */
async function nodeHttpRequest(url, { method = 'GET', headers = {}, body } = {}, timeoutMs = 20000) {
  const parsed = new URL(url);
  const isHttps = parsed.protocol === 'https:';
  const lib = isHttps ? https : http;
  const port = parsed.port ? Number(parsed.port) : isHttps ? 443 : 80;
  const path = `${parsed.pathname}${parsed.search}`;

  let hostname = parsed.hostname;
  try {
    const resolved = await lookup(parsed.hostname, { family: 4 });
    hostname = resolved.address;
  } catch {
    /* garde le hostname d'origine */
  }

  const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
  const reqHeaders = {
    ...headers,
    Host: parsed.host,
    ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname,
        port,
        path,
        method,
        headers: reqHeaders,
        family: 4,
        servername: isHttps ? parsed.hostname : undefined,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve(botResponse(Buffer.concat(chunks).toString('utf8'), res.statusCode || 0, res.statusMessage || ''));
        });
      }
    );

    const timer = setTimeout(() => {
      req.destroy(new Error('timeout'));
    }, timeoutMs);

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    req.on('close', () => clearTimeout(timer));

    if (payload) req.write(payload);
    req.end();
  });
}

async function fetchWithTimeout(url, opts, timeoutMs) {
  try {
    return await nodeHttpRequest(
      url,
      {
        method: opts.method || 'GET',
        headers: opts.headers || {},
        body: opts.body,
      },
      timeoutMs
    );
  } catch (nodeErr) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...opts, signal: controller.signal });
    } catch (fetchErr) {
      throw nodeErr || fetchErr;
    } finally {
      clearTimeout(timer);
    }
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

export async function probeBotAt(baseUrl) {
  if (!baseUrl) {
    return { configured: false, reachable: false, connected: false, error: 'URL manquante' };
  }
  const base = String(baseUrl).replace(/\/$/, '');
  const attempts = [
    { path: '/api/health', timeoutMs: 8000 },
    { path: '/api/status', timeoutMs: 18000 },
  ];

  let lastError = null;
  for (const { path, timeoutMs } of attempts) {
    try {
      const res = await fetchWithTimeout(
        `${base}${path}`,
        { headers: botHeaders(), cache: 'no-store' },
        timeoutMs
      );
      const data = await readBotJson(res);
      if (!res.ok) {
        lastError = data.error || `HTTP ${res.status}`;
        continue;
      }
      return {
        configured: true,
        reachable: true,
        connected: Boolean(data.connected),
        connecting: Boolean(data.connecting),
        botInstance: data.bot_instance || null,
        qr: data.qr || null,
        qrError: data.qrError || null,
        pairingCode: data.pairingCode || null,
      };
    } catch (e) {
      lastError = isTransientNetworkError(e.message)
        ? 'Le bot ne répond pas depuis Vercel. Bothosting est-il démarré ?'
        : String(e.message || e);
    }
  }

  return {
    configured: true,
    reachable: false,
    connected: false,
    error: lastError || 'Bot inaccessible',
  };
}

export async function probeBot() {
  const config = getBotConfig();
  if (!config.configured) {
    return { ...config, reachable: false, error: 'NEXT_PUBLIC_WHATSAPP_BOT_URL manquant sur Vercel' };
  }
  const probe = await probeBotAt(botBaseUrl());
  return { ...config, ...probe };
}

function botTimeoutMs(path, body) {
  const custom = Number(process.env.BOT_SEND_TIMEOUT_MS);
  /** Vercel Hobby coupe à ~10 s — rester en dessous pour renvoyer une erreur JSON claire. */
  const sendTimeout = Number.isFinite(custom) && custom > 5000 ? custom : 9000;
  if (path === '/api/status') return 18000;
  if (path === '/api/health') return 8000;
  if (path === '/api/start') return 8000;
  if (path === '/api/logout') return 10000;
  if (body?.test_only) return Math.min(sendTimeout, 8000);
  if (
    path === '/api/send-to-managers' ||
    path === '/api/send-to-clients' ||
    path === '/api/send-to-promoteurs' ||
    path === '/api/send-to-boxeurs' ||
    path === '/api/send-to-groupe-chabane' ||
    path === '/api/send-message' ||
    path === '/api/send-email'
  ) {
    return sendTimeout;
  }
  if (path.startsWith('/api/send-')) return 30000;
  return 20000;
}

function unreachableMessage(cause) {
  const base =
    'Bot inaccessible depuis Vercel (réseau ou délai). Vérifiez NEXT_PUBLIC_WHATSAPP_BOT_URL ' +
    '(http://us2.bot-hosting.net:20042), que Bothosting tourne, puis redéployez.';
  if (!cause || cause === base) return base;
  return `${base} (${cause})`;
}

function isMutatingSendPath(path, method) {
  return (
    method === 'POST' &&
    (path.startsWith('/api/send-to-') ||
      path === '/api/send-message' ||
      path === '/api/send-email')
  );
}

export async function botFetch(path, { method = 'GET', body, timeoutMs: timeoutOverride, baseUrl } = {}, attempt = 0) {
  const url = `${requireBotUrl(baseUrl)}${path}`;
  const timeoutMs = timeoutOverride ?? botTimeoutMs(path, body);
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
    const skipRetry = path === '/api/status' || path === '/api/start';
    if (isTransientNetworkError(msg) && attempt < 2 && !isMutatingSendPath(path, method) && !skipRetry) {
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      return botFetch(path, { method, body }, attempt + 1);
    }
    if (isTransientNetworkError(msg)) {
      throw new Error(unreachableMessage(msg));
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
