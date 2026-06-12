export function mergeSendResults(target, source) {
  const countKey = source.managers != null ? 'managers' : source.promoteurs != null ? 'promoteurs' : 'boxeurs';
  target[countKey] = Math.max(target[countKey] || 0, source[countKey] || 0);
  for (const ch of ['email', 'whatsapp']) {
    if (!source[ch]) continue;
    if (!target[ch]) target[ch] = { sent: 0, failed: 0, skipped: 0 };
    target[ch].sent += source[ch].sent || 0;
    target[ch].failed += source[ch].failed || 0;
    target[ch].skipped += source[ch].skipped || 0;
  }
  target.errors = [...(target.errors || []), ...(source.errors || [])];
  target.destinations = [...(target.destinations || []), ...(source.destinations || [])];
  if (source.warnings?.length) {
    target.warnings = [...(target.warnings || []), ...source.warnings];
  }
}

export function idsForCountrySend({ broadcast, withEmail, withPhone, filtered }) {
  if (broadcast === 'email') return withEmail.map((r) => r.id);
  if (broadcast === 'phone') return withPhone.map((r) => r.id);
  return filtered.map((r) => r.id);
}

export function emptySendResult(entityKey) {
  return {
    [entityKey]: 0,
    email: { sent: 0, failed: 0, skipped: 0 },
    whatsapp: { sent: 0, failed: 0, skipped: 0 },
    errors: [],
    destinations: [],
    warnings: [],
  };
}
