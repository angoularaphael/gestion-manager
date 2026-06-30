/** Aligné sur MAILJET_HOURLY_LIMIT (200 par défaut). */
export const DEFAULT_CAMPAIGN_WAVE_SIZE = 200;

export function getCampaignWaveCount(total, waveSize = DEFAULT_CAMPAIGN_WAVE_SIZE) {
  const n = Math.max(0, Number(total) || 0);
  if (n === 0) return 0;
  return Math.ceil(n / waveSize);
}

export function getCampaignWaveIds(orderedIds, wave, waveSize = DEFAULT_CAMPAIGN_WAVE_SIZE) {
  const start = (Math.max(1, wave) - 1) * waveSize;
  return orderedIds.slice(start, start + waveSize);
}

export function describeCampaignWave(wave, total, waveSize = DEFAULT_CAMPAIGN_WAVE_SIZE) {
  const count = getCampaignWaveCount(total, waveSize);
  const ids = getCampaignWaveIds(
    Array.from({ length: total }, (_, i) => i),
    wave,
    waveSize
  );
  const from = total === 0 ? 0 : (wave - 1) * waveSize + 1;
  const to = Math.min(wave * waveSize, total);
  return {
    wave,
    waveCount: count,
    size: ids.length,
    rangeLabel: total === 0 ? '0' : `${from}–${to}`,
  };
}
