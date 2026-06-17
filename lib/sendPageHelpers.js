export function mergeSendResults(target, source) {
  const countKey = source.managers != null ? 'managers' : source.promoteurs != null ? 'promoteurs' : 'boxeurs';
  target[countKey] = Math.max(target[countKey] || 0, source[countKey] || 0);
  for (const ch of ['email', 'whatsapp']) {
    if (!source[ch]) continue;
    if (!target[ch]) target[ch] = { sent: 0, failed: 0, skipped: 0, queued: 0 };
    target[ch].sent += source[ch].sent || 0;
    target[ch].failed += source[ch].failed || 0;
    target[ch].skipped += source[ch].skipped || 0;
    target[ch].queued = Math.max(target[ch].queued || 0, source[ch].queued || 0);
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
    whatsapp: { sent: 0, failed: 0, skipped: 0, queued: 0 },
    errors: [],
    destinations: [],
    warnings: [],
  };
}

/**
 * Envoie email puis WhatsApp, sans bloquer le 2e canal si le 1er échoue.
 * L'email passe par Brevo (Vercel) ; WhatsApp via le bot Bothosting.
 */
export async function runDualChannelSend({
  channels = [],
  payload,
  entityKey,
  botPath,
  emailPath,
  parseApiJson,
}) {
  const data = emptySendResult(entityKey);
  const channelErrors = [];

  async function tryChannel(label, run) {
    try {
      const source = await run();
      mergeSendResults(data, source);
    } catch (err) {
      const message = err?.message || String(err);
      channelErrors.push({ channel: label, error: message });
      data.errors.push({ channel: label, error: message });
    }
  }

  if (channels.includes('email')) {
    await tryChannel('email', async () => {
      const { channels: _c, ...emailPayload } = payload;
      const emRes = await fetch(emailPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });
      const emData = await parseApiJson(emRes);
      if (!emRes.ok) throw new Error(emData.error || 'Erreur envoi email');
      return emData;
    });
  }

  if (channels.includes('whatsapp')) {
    await tryChannel('whatsapp', async () => {
      const waRes = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: botPath,
          body: { ...payload, channels: ['whatsapp'] },
        }),
      });
      const waData = await parseApiJson(waRes);
      if (!waRes.ok) throw new Error(waData.error || 'Erreur envoi WhatsApp');
      if (waData.warnings?.length) {
        data.warnings.push(...waData.warnings);
      }
      if (waData.duplicate) {
        data.warnings.push('WhatsApp : envoi en double évité (déjà lancé récemment).');
      } else if (waData.accepted && waData.whatsapp?.queued) {
        data.whatsapp.queued = waData.whatsapp.queued;
        data.warnings.push(
          `WhatsApp : envoi en cours pour ${waData.whatsapp.queued} numéro(s) — le bot continue sur Bothosting.`
        );
      }
      return waData;
    });
  }

  const sentEmail = (data.email?.sent || 0) > 0;
  const sentWhatsApp = (data.whatsapp?.sent || 0) > 0 || (data.whatsapp?.queued || 0) > 0;
  const attempted =
    (data.whatsapp?.failed || 0) > 0 ||
    (data.whatsapp?.skipped || 0) > 0 ||
    (data.email?.failed || 0) > 0 ||
    (data.email?.skipped || 0) > 0 ||
    (data.errors?.length || 0) > 0;
  const duplicateOnly =
    !sentEmail &&
    !sentWhatsApp &&
    channelErrors.length === 0 &&
    (data.warnings || []).some((w) => /double évité|déjà lancé|identique ignoré/i.test(w));

  if (!sentEmail && !sentWhatsApp) {
    if (duplicateOnly) {
      return { data, partial: true, duplicate: true };
    }
    if (attempted) {
      return { data, partial: true, failed: true };
    }
    const detail = channelErrors.map((e) => `${e.channel}: ${e.error}`).join(' · ');
    throw new Error(detail || 'Aucun message envoyé');
  }

  if (channelErrors.length) {
    data.warnings = [
      ...(data.warnings || []),
      ...channelErrors.map((e) => `Échec ${e.channel} : ${e.error}`),
    ];
  }

  return { data, partial: channelErrors.length > 0 };
}
