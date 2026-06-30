/**
 * Statut / actions bots campagne — proxy léger compatible Vercel Hobby (≤10s).
 */
import { botFetch } from './bot';

const STATUS_TIMEOUT_MS = 8000;

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
    hasQr: Boolean(data?.qr) && !data?.connected,
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
      hasQr: false,
      error: 'URL manquante',
    };
  }

  try {
    const data = await botFetch('/api/status', { baseUrl: url, timeoutMs: STATUS_TIMEOUT_MS });
    return statusFromPayload(data);
  } catch (statusErr) {
    const statusMsg = String(statusErr.message || statusErr);
    return {
      configured: true,
      reachable: !isTransientNetworkError(statusMsg),
      connected: false,
      connecting: false,
      hasQr: false,
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

  if (action === 'start' || action === 'stop') {
    try {
      botFetch(path, {
        method: 'POST',
        baseUrl: url,
        body: action === 'start' ? { method: 'qr', forceQr: true, ...body } : {},
        timeoutMs: 4000,
      }).catch(() => {});
    } catch {
      /* secret ou réseau — on renvoie quand même succès, le poll affichera le QR */
    }
    return {
      success: true,
      message: action === 'start' ? 'Démarrage en cours — attendez le QR.' : 'Arrêt demandé.',
    };
  }

  return botFetch(path, {
    method: 'POST',
    baseUrl: url,
    body: body || {},
    timeoutMs: 8000,
  });
}
