import { filterManagers } from './managerCountry';
import { emptySendResult, idsForCountrySend, mergeSendResults, runDualChannelSend } from './sendPageHelpers';
import { AUDIENCE_BY_KEY, AUDIENCE_DEDUP_ORDER } from './unifiedSendConfig';

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function contactKeys(row) {
  const keys = [];
  const email = normalizeEmail(row.email);
  const phone = normalizePhone(row.telephone || row.phone);
  if (email) keys.push(`e:${email}`);
  if (phone) keys.push(`p:${phone}`);
  return keys;
}

export function filterAudienceRows(rows, { countries, broadcast, channels, audienceKey }) {
  const aud = AUDIENCE_BY_KEY[audienceKey];
  let filtered = rows;

  if (aud?.hasCountry && countries?.length) {
    filtered = filterManagers(filtered, { countries });
  }

  if (broadcast === 'email') {
    filtered = filtered.filter((r) => r.email);
  } else if (broadcast === 'phone') {
    filtered = filtered.filter((r) => r.telephone || r.phone);
  }

  if (channels?.length === 1) {
    if (channels.includes('email') && !channels.includes('whatsapp')) {
      filtered = filtered.filter((r) => r.email);
    }
    if (channels.includes('whatsapp') && !channels.includes('email')) {
      filtered = filtered.filter((r) => r.telephone || r.phone);
    }
  }

  return filtered;
}

export function idsForAudienceSend({ rows, broadcast, countries }) {
  if (countries?.length) {
    const withEmail = rows.filter((r) => r.email);
    const withPhone = rows.filter((r) => r.telephone || r.phone);
    return idsForCountrySend({ broadcast, withEmail, withPhone, filtered: rows });
  }
  if (broadcast === 'email') return rows.filter((r) => r.email).map((r) => r.id);
  if (broadcast === 'phone') return rows.filter((r) => r.telephone || r.phone).map((r) => r.id);
  return rows.map((r) => r.id);
}

/**
 * Calcule les stats par audience et les totaux uniques (déduplication email/téléphone).
 */
export function computeUnifiedAudienceStats({
  selectedAudienceKeys,
  dataByAudience,
  countries,
  broadcast,
  channels,
}) {
  const perAudience = [];
  const seenKeys = new Set();
  let uniqueTotal = 0;

  for (const key of AUDIENCE_DEDUP_ORDER) {
    if (!selectedAudienceKeys.includes(key)) continue;
    const rows = dataByAudience[key] || [];
    const filtered = filterAudienceRows(rows, { countries, broadcast, channels, audienceKey: key });
    const ids = idsForAudienceSend({ rows: filtered, broadcast, countries });
    const idSet = new Set(ids);

    let uniqueInAudience = 0;
    for (const row of filtered) {
      if (!idSet.has(row.id)) continue;
      const keys = contactKeys(row);
      if (!keys.length) {
        uniqueInAudience += 1;
        continue;
      }
      const alreadySeen = keys.some((k) => seenKeys.has(k));
      if (!alreadySeen) {
        uniqueInAudience += 1;
        keys.forEach((k) => seenKeys.add(k));
      }
    }

    uniqueTotal += uniqueInAudience;
    perAudience.push({
      key,
      label: AUDIENCE_BY_KEY[key].label,
      total: filtered.length,
      ids: ids.length,
      unique: uniqueInAudience,
      whatsappOnly: Boolean(AUDIENCE_BY_KEY[key].whatsappOnly),
    });
  }

  return { perAudience, uniqueTotal };
}

/**
 * Retourne les IDs à envoyer pour une audience, en excluant les contacts déjà couverts.
 */
export function resolveAudienceSendIds({
  audienceKey,
  rows,
  countries,
  broadcast,
  channels,
  seenContactKeys,
}) {
  const filtered = filterAudienceRows(rows, { countries, broadcast, channels, audienceKey });
  const candidateIds = idsForAudienceSend({ rows: filtered, broadcast, countries });
  const idSet = new Set(candidateIds);
  const ids = [];

  for (const row of filtered) {
    if (!idSet.has(row.id)) continue;
    const keys = contactKeys(row);
    if (!keys.length) {
      ids.push(row.id);
      continue;
    }
    const duplicate = keys.some((k) => seenContactKeys.has(k));
    if (!duplicate) {
      ids.push(row.id);
      keys.forEach((k) => seenContactKeys.add(k));
    }
  }

  return ids;
}

export function buildAudiencePayload({
  audience,
  ids,
  message,
  subject,
  channels,
  testOnly,
  broadcast,
  countries,
}) {
  const payload = {
    message,
    subject,
    channels: audience.whatsappOnly ? ['whatsapp'] : channels,
    test_only: testOnly,
  };

  if (ids?.length) {
    payload[audience.idsKey] = ids;
  } else if (!testOnly) {
    payload.broadcast = broadcast;
  }

  if (audience.key === 'clients' && channels.includes('whatsapp') && !channels.includes('email')) {
    payload.offre_ete_whatsapp = false;
  }

  return payload;
}

/**
 * Envoie le message à toutes les audiences sélectionnées (API existantes).
 */
export async function runUnifiedSend({
  selectedAudienceKeys,
  dataByAudience,
  countries,
  broadcast,
  channels,
  message,
  subject,
  testOnly,
  parseApiJson,
  runDualChannelSend: sendDual = runDualChannelSend,
  mergeSendResults: mergeFn = mergeSendResults,
  emptySendResult: emptyFn = emptySendResult,
}) {
  const merged = emptyFn('recipients');
  const seenContactKeys = new Set();
  const summaries = [];

  for (const key of AUDIENCE_DEDUP_ORDER) {
    if (!selectedAudienceKeys.includes(key)) continue;
    const audience = AUDIENCE_BY_KEY[key];
    const rows = dataByAudience[key] || [];
    const ids = resolveAudienceSendIds({
      audienceKey: key,
      rows,
      countries,
      broadcast,
      channels,
      seenContactKeys,
    });

    if (!ids.length && !testOnly) {
      summaries.push({ key, label: audience.label, skipped: true, reason: 'Aucun destinataire (filtre ou doublon)' });
      continue;
    }

    const payload = buildAudiencePayload({
      audience,
      ids: testOnly ? undefined : ids,
      message,
      subject,
      channels,
      testOnly,
      broadcast,
      countries,
    });

    if (audience.whatsappOnly) {
      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: audience.botPath, body: payload }),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || `Erreur ${audience.label}`);
      mergeFn(merged, data);
      summaries.push({ key, label: audience.label, count: ids.length || 1 });
      continue;
    }

    const activeChannels = channels.filter((ch) => ch !== 'email' || audience.emailPath);
    if (!activeChannels.length) continue;

    const { data, partial, duplicate, failed } = await sendDual({
      channels: activeChannels,
      payload,
      entityKey: audience.entityKey,
      botPath: audience.botPath,
      emailPath: audience.emailPath,
      parseApiJson,
    });

    mergeFn(merged, data);
    summaries.push({
      key,
      label: audience.label,
      count: ids.length || data[audience.entityKey] || 0,
      partial,
      duplicate,
      failed,
    });
  }

  const attempted = summaries.some((s) => !s.skipped);
  if (!attempted) {
    throw new Error('Aucun destinataire pour les audiences sélectionnées');
  }

  return { data: merged, summaries };
}
