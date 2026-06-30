/**
 * Statut / actions bots campagne — même logique que compta-boxing/lib/bots.js
 * (health → status → /api/qr, start fire-and-forget).
 */
import { botFetch } from './bot';

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
    let data;
    try {
      data = await botFetch('/api/health', { baseUrl: url, timeoutMs: 8000 });
      if (data.connected) {
        return statusFromPayload({ ...data, qr: null, qrError: null });
      }
    } catch {
      data = null;
    }

    data = await botFetch('/api/status', { baseUrl: url, timeoutMs: 22000 });

    if (!data.qr && data.connecting && !data.connected) {
      try {
        const qrRes = await botFetch('/api/qr', { baseUrl: url, timeoutMs: 22000 });
        if (qrRes.qr) data.qr = qrRes.qr;
      } catch {
        /* boxing-center-bot : QR uniquement sur /api/status */
      }
    }

    return statusFromPayload(data);
  } catch (statusErr) {
    const statusMsg = String(statusErr.message || statusErr);
    if (isTransientNetworkError(statusMsg)) {
      try {
        const health = await botFetch('/api/health', { baseUrl: url, timeoutMs: 8000 });
        return {
          configured: true,
          reachable: true,
          connected: Boolean(health.connected),
          connecting: Boolean(health.connecting),
          botInstance: health.bot_instance || health.location || null,
          qr: null,
          qrError: null,
          error: null,
        };
      } catch {
        /* health aussi en échec */
      }
    }
    return {
      configured: true,
      reachable: false,
      connected: false,
      connecting: false,
      qr: null,
      error: statusMsg || 'Impossible de joindre le bot',
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
      timeoutMs: 22000,
    }).catch(() => {});
    return { success: true, message: 'Démarrage en cours — attendez le QR.' };
  }

  if (action === 'stop') {
    botFetch(path, { method: 'POST', baseUrl: url, body: {}, timeoutMs: 10000 }).catch(() => {});
    return { success: true, message: 'Arrêt demandé.' };
  }

  return botFetch(path, {
    method: 'POST',
    baseUrl: url,
    body: body || {},
    timeoutMs: action === 'logout' ? 12000 : 10000,
  });
}
