const MAX_ACCOUNTS = 3;

function onVercel() {
  return Boolean(process.env.VERCEL);
}

function readAccount(slot) {
  const apiKey = (process.env[`MAILJET_${slot}_API_KEY`] || '').trim();
  const secretKey = (process.env[`MAILJET_${slot}_SECRET_KEY`] || '').trim();
  const senderEmail = (process.env[`MAILJET_${slot}_SENDER_EMAIL`] || '').trim();
  const senderName = (process.env[`MAILJET_${slot}_SENDER_NAME`] || 'Boxing Center').trim();
  const label = (process.env[`MAILJET_${slot}_LABEL`] || `Compte Mailjet ${slot}`).trim();

  if (!apiKey && !secretKey && !senderEmail) return null;

  return {
    slot,
    apiKey,
    secretKey,
    senderEmail,
    senderName,
    label,
    configured: Boolean(apiKey && secretKey && senderEmail),
  };
}

export function getMailjetAccounts() {
  const accounts = [];
  for (let i = 1; i <= MAX_ACCOUNTS; i++) {
    const acc = readAccount(i);
    if (acc) accounts.push(acc);
  }
  return accounts;
}

export function isMailjetConfigured() {
  return getMailjetAccounts().some((a) => a.configured);
}

export function getWaveLimit() {
  const n = parseInt(process.env.MAILJET_WAVE_LIMIT || '8000', 10);
  return Number.isFinite(n) && n > 0 ? n : 8000;
}

function purposeSlot(purpose) {
  const envKey = `MAILJET_PURPOSE_${String(purpose).toUpperCase()}`;
  const v = parseInt(process.env[envKey] || '', 10);
  if (v >= 1 && v <= MAX_ACCOUNTS) return v;
  return null;
}

export function resolveMailjetAccountSlot(accountOrPurpose) {
  if (accountOrPurpose == null) {
    return purposeSlot('campaign') || 1;
  }
  if (typeof accountOrPurpose === 'number') {
    if (accountOrPurpose >= 1 && accountOrPurpose <= MAX_ACCOUNTS) return accountOrPurpose;
    return 1;
  }
  const s = String(accountOrPurpose).toLowerCase();
  if (/^[1-3]$/.test(s)) return parseInt(s, 10);
  const fromPurpose = purposeSlot(s);
  if (fromPurpose) return fromPurpose;
  return 1;
}

export function pickMailjetAccountForIndex(index) {
  const accounts = getMailjetAccounts().filter((a) => a.configured);
  if (!accounts.length) return 1;
  return accounts[index % accounts.length].slot;
}

export function getMailjetAccount(slot) {
  const resolved = resolveMailjetAccountSlot(slot);
  const acc = readAccount(resolved);
  if (!acc || !acc.configured) {
    throw new Error(
      `Compte Mailjet ${resolved} non configuré (MAILJET_${resolved}_API_KEY, SECRET_KEY, SENDER_EMAIL).`
    );
  }
  return acc;
}

export function describeMailjetIssue() {
  if (!isMailjetConfigured()) {
    if (onVercel()) {
      return 'Mailjet : configurez au moins MAILJET_1_API_KEY, MAILJET_1_SECRET_KEY et MAILJET_1_SENDER_EMAIL sur Vercel, puis redéployez.';
    }
    return 'Aucun compte Mailjet configuré.';
  }

  const incomplete = getMailjetAccounts().filter(
    (a) => (a.apiKey || a.secretKey || a.senderEmail) && !a.configured
  );
  if (incomplete.length) {
    const slots = incomplete.map((a) => a.slot).join(', ');
    return `Compte(s) Mailjet incomplet(s) : ${slots}. Chaque compte doit avoir API_KEY, SECRET_KEY et SENDER_EMAIL.`;
  }

  return null;
}

export function getMailjetConfig() {
  const accounts = getMailjetAccounts().map((a) => ({
    slot: a.slot,
    label: a.label,
    senderEmail: a.senderEmail,
    senderName: a.senderName,
    configured: a.configured,
    apiKeyPreview: a.apiKey ? `${a.apiKey.slice(0, 8)}…` : '',
  }));

  return {
    configured: isMailjetConfigured(),
    accounts,
    waveLimit: getWaveLimit(),
    onVercel: onVercel(),
    purposes: {
      campaign: purposeSlot('campaign') || 1,
      notify: purposeSlot('notify') || 1,
      credentials: purposeSlot('credentials') || 2,
    },
  };
}
