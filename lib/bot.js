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
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
