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

/** Taux de lecture / ouverture fictif, stable pour un même volume. */
export function fictionalWhatsAppOpenStats(sentCount, kind = 'balma') {
  const { rate, reads } = fictionalReads(sentCount, { kind, channel: 'whatsapp' });
  return { openRate: rate, openedCount: reads };
}

export function fictionalReads(volume, { kind = 'balma', channel = 'whatsapp' } = {}) {
  const sent = toInt(volume);
  if (!sent) return { rate: 0, reads: 0 };
  const base =
    channel === 'email'
      ? kind === 'offres'
        ? 33.6
        : 36.2
      : kind === 'offres'
        ? 77.8
        : 79.4;
  const wobble = ((sent * 13) % 17) / 10;
  const rate = Math.round((base + wobble) * 10) / 10;
  return { rate, reads: Math.round((sent * rate) / 100) };
}

export function campaignReachFromStats(stats, kind = 'balma') {
  const wa = stats?.whatsapp || stats || {};
  const waSent = toInt(wa.sentCount);
  const waAudience = toInt(wa.clientsWithPhone);
  const waPending = toInt(wa.pendingCount);
  const volume = waAudience || waSent + waPending;
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
