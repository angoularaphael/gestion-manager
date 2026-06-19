import { getSupabase } from './supabase';

const TABLE = 'email_unsubscribes';

export async function fetchUnsubscribedEmailSet() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from(TABLE).select('email');
    if (error) {
      if (/does not exist|relation/i.test(error.message)) return new Set();
      throw error;
    }
    return new Set((data || []).map((row) => String(row.email || '').toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function recordEmailUnsubscribe({ email, clientId = null }) {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalized) throw new Error('Email invalide');

  const sb = getSupabase();
  const row = {
    email: normalized,
    client_id: clientId || null,
    unsubscribed_at: new Date().toISOString(),
  };

  const { error } = await sb.from(TABLE).upsert(row, { onConflict: 'email' });
  if (error) {
    if (/does not exist|relation/i.test(error.message)) {
      const err = new Error(
        'Table email_unsubscribes absente. Exécutez supabase/email_unsubscribes.sql dans Supabase.'
      );
      err.code = 'TABLE_MISSING';
      throw err;
    }
    throw new Error(error.message);
  }

  return { ok: true, email: normalized };
}

export async function isEmailUnsubscribed(email) {
  const set = await fetchUnsubscribedEmailSet();
  return set.has(String(email || '').trim().toLowerCase());
}
