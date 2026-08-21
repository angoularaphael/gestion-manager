function toInt(n) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
}

export function formatFrInt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return Math.round(v).toLocaleString('fr-FR');
}

export function formatFrRate(rate) {
  const v = Number(rate);
  if (!Number.isFinite(v) || v <= 0) return '—';
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

/** Taux d'ouverture WhatsApp affiché (fictif). */
export const WHATSAPP_OPEN_RATE = 9.2;

export function fictionalWhatsAppOpenStats(volume, kind = 'balma') {
  const { rate, reads } = fictionalReads(volume, { kind, channel: 'whatsapp' });
  return { openRate: rate, openedCount: reads };
}

export function fictionalReads(volume, { kind = 'balma', channel = 'whatsapp' } = {}) {
  const sent = toInt(volume);
  if (!sent) return { rate: 0, reads: 0 };
  if (channel === 'whatsapp') {
    return { rate: WHATSAPP_OPEN_RATE, reads: Math.round((sent * WHATSAPP_OPEN_RATE) / 100) };
  }
  const base = kind === 'offres' ? 33.6 : 36.2;
  const wobble = ((sent * 13) % 17) / 10;
  const rate = Math.round((base + wobble) * 10) / 10;
  return { rate, reads: Math.round((sent * rate) / 100) };
}

export function campaignReachFromStats(stats, kind = 'balma') {
  const wa = stats?.whatsapp || stats || {};
  const waSent = toInt(wa.sentCount);
  const volume = toInt(wa.clientsWithPhone);
  const waPending = toInt(wa.pendingCount);
  const reads = fictionalReads(volume, { kind, channel: 'whatsapp' });
  const emailSent = toInt(stats?.email?.sentCount);
  const email = fictionalReads(emailSent, { kind, channel: 'email' });
  return {
    whatsapp: {
      volume,
      sent: waSent,
      pending: waPending,
      ...reads,
    },
    email: {
      volume: emailSent,
      ...email,
    },
  };
}
