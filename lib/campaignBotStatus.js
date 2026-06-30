/**
 * Statut / actions bots campagne.
 * Une seule requête /api/status (≤9s) — compatible Vercel Hobby (limite 10s).
 * Même modèle que /api/admin/whatsapp qui fonctionne.
 */
import { botFetch } from './bot';

/** Délai max bot depuis une fonction Vercel Hobby (~10s total). */
const STATUS_TIMEOUT_MS = 9000;
const HEALTH_TIMEOUT_MS = 4000;
const START_TIMEOUT_MS = 4000;

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
    msg.includes('network') ||
    msg.includes('inaccessible')
  );
}

function statusFromPayload(data) {
  return {
    configured: true,
    reachable: true,
    connected: Boolean(data?.connected),
    connecting: Boolean(data?.connecting),
    botInstance: data?.bot_instance || data?.location || null,
    qr: data?.qr || null,
    qrError: data?.qrError || null,
    pairingCode: data?.pairingCode || null,
    error: data?.qrError || data?.error || null,
  };
}

export async function fetchCampaignBotStatus(botUrl) {
  const url = String(botUrl || '').trim().replace(/\/$/, '');
  if (!url) {
    return {
      configured: false,
      reachable: false,
      connected: false,
      connecting: false,
      qr: null,
      error: 'URL manquante',
    };
  }

  try {
    const data = await botFetch('/api/status', { baseUrl: url, timeoutMs: STATUS_TIMEOUT_MS });

    if (!data.qr && data.connecting && !data.connected) {
      try {
        const qrRes = await botFetch('/api/qr', { baseUrl: url, timeoutMs: 4000 });
        if (qrRes.qr) data.qr = qrRes.qr;
      } catch {
        /* boxing-center-bot : QR sur /api/status */
      }
    }

    return statusFromPayload(data);
  } catch (statusErr) {
    const statusMsg = String(statusErr.message || statusErr);
    try {
      const health = await botFetch('/api/health', { baseUrl: url, timeoutMs: HEALTH_TIMEOUT_MS });
      if (health.connected) {
        return statusFromPayload({ ...health, qr: null, qrError: null });
      }
    } catch {
      /* ignore */
    }

    return {
      configured: true,
      reachable: !isTransientNetworkError(statusMsg),
      connected: false,
      connecting: false,
      qr: null,
      error: isTransientNetworkError(statusMsg)
        ? 'Bot inaccessible depuis Vercel — vérifiez Bothosting puis Actualiser.'
        : statusMsg || 'Impossible de joindre le bot',
    };
  }
}

export async function fetchCampaignBotAction(botUrl, action, body = {}) {
  const routes = {
    start: '/api/start',
    stop: '/api/stop',
    logout: '/api/logout',
  };
  const path = routes[action];
  if (!path) throw new Error(`Action inconnue: ${action}`);

  const url = String(botUrl || '').trim().replace(/\/$/, '');
  if (!url) throw new Error('URL du bot manquante');

  if (action === 'start') {
    botFetch(path, {
      method: 'POST',
      baseUrl: url,
      body: { method: 'qr', forceQr: true, ...body },
      timeoutMs: START_TIMEOUT_MS,
    }).catch(() => {});
    return { success: true, message: 'Démarrage en cours — attendez le QR.' };
  }

  if (action === 'stop') {
    botFetch(path, { method: 'POST', baseUrl: url, body: {}, timeoutMs: START_TIMEOUT_MS }).catch(() => {});
    return { success: true, message: 'Arrêt demandé.' };
  }

  return botFetch(path, {
    method: 'POST',
    baseUrl: url,
    body: body || {},
    timeoutMs: action === 'logout' ? 8000 : 8000,
  });
}
