'use client';

export function getPublicBotUrl() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL || '';
  return raw.replace(/\/$/, '');
}

/** Message affiché quand l’URL bot n’est pas joignable depuis Vercel / le navigateur. */
export function getBotUrlHint() {
  const url = getPublicBotUrl();
  if (!url) {
    return (
      'NEXT_PUBLIC_WHATSAPP_BOT_URL manquant sur Vercel. ' +
      'Ajoutez la variable puis redéployez (Deployments → Redeploy).'
    );
  }

  try {
    const bot = new URL(url);
    const onHttps =
      typeof window !== 'undefined' && window.location.protocol === 'https:';
    const nonStandardPort = bot.port && !['80', '443', ''].includes(bot.port);

    if (bot.protocol === 'http:' && onHttps && nonStandardPort) {
      return (
        `Le bot est en HTTP sur le port ${bot.port} (${bot.host}). ` +
        'Vercel et le navigateur n’y accèdent pas depuis un site HTTPS. ' +
        'Exposez le bot en HTTPS (port 443) avec un tunnel Cloudflare, puis mettez à jour ' +
        'WHATSAPP_BOT_URL et NEXT_PUBLIC_WHATSAPP_BOT_URL avec l’URL https://…'
      );
    }
  } catch {
    return 'URL du bot invalide dans NEXT_PUBLIC_WHATSAPP_BOT_URL.';
  }

  return null;
}

async function readJson(res) {
  const raw = await res.text();
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  throw new Error('Réponse du bot illisible.');
}

export async function publicBotFetch(path, { method = 'GET', body, timeoutMs = 20000 } = {}) {
  const hint = getBotUrlHint();
  if (hint) throw new Error(hint);

  const url = `${getPublicBotUrl()}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || `Erreur HTTP ${res.status}`);
    return data;
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes('abort') || msg.includes('Failed to fetch')) {
      throw new Error(
        'Connexion au bot impossible depuis le navigateur. ' +
          'Vérifiez que Bothosting est démarré et que l’URL du bot est en HTTPS (port 443).'
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
