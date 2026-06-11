const BOT = () => process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL?.replace(/\/$/, '') || '';
const SECRET = () => process.env.SITE_API_SECRET || '';

export async function botFetch(path, { method = 'GET', body } = {}) {
  const url = `${BOT()}${path}`;
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
    res = await fetch(url, { ...opts, signal: AbortSignal.timeout(20000) });
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.includes('fetch failed') || msg.includes('abort') || msg.includes('timeout')) {
      throw new Error(
        'Bot inaccessible depuis le site. Vérifiez que le bot Bothosting est en ligne et que NEXT_PUBLIC_WHATSAPP_BOT_URL est correct.'
      );
    }
    throw e;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
