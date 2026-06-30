/** Délai minimum entre emails campagne (200/h ≈ 18 s). */
export function getCampaignEmailDelayMs() {
  const hourly = Math.max(1, Number(process.env.MAILJET_HOURLY_LIMIT || 200));
  return Math.max(1000, Math.floor(3600_000 / hourly));
}

export function isMailjetRateLimitError(message) {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('rate') ||
    m.includes('limit') ||
    m.includes('quota') ||
    m.includes('throttl') ||
    m.includes('too many') ||
    m.includes('blocked')
  );
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
