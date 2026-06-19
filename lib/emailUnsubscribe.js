import crypto from 'crypto';

function signingSecret() {
  return (
    process.env.EMAIL_UNSUBSCRIBE_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.SITE_API_SECRET ||
    ''
  );
}

function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://gestion-manager.vercel.app').replace(
    /\/$/,
    ''
  );
}

export function createUnsubscribeToken({ clientId = null, email }) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalized) throw new Error('Email requis pour le lien de désabonnement');

  const secret = signingSecret();
  if (!secret) throw new Error('SESSION_SECRET manquant pour signer les liens de désabonnement');

  const exp = Date.now() + 365 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ id: clientId || null, email: normalized, exp })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyUnsubscribeToken(token) {
  const secret = signingSecret();
  if (!secret || !token || typeof token !== 'string') return null;

  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data?.email || !data?.exp || Date.now() > data.exp) return null;
    return { clientId: data.id || null, email: String(data.email).toLowerCase() };
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl({ clientId = null, email }) {
  const token = createUnsubscribeToken({ clientId, email });
  return `${siteBase()}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}
