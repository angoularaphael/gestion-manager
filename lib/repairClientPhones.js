import { getSupabase } from './supabase';
import { normalizeFrenchPhone, phoneDedupKey } from './phoneFormat';

const TABLE = 'portet_clients';
const PAGE_SIZE = 1000;
const UPDATE_CHUNK = 200;

async function fetchAllPhones() {
  const sb = getSupabase();
  const all = [];
  let from = 0;

  while (true) {
    const { data, error } = await sb
      .from(TABLE)
      .select('id, telephone, email')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const batch = data || [];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

/**
 * Normalise tous les téléphones portet_clients (0XXXXXXXXX).
 * @returns {{ scanned: number, updated: number, unchanged: number }}
 */
export async function repairPortetClientPhonesInDb() {
  const sb = getSupabase();
  const rows = await fetchAllPhones();
  const toUpdate = [];
  let unchanged = 0;

  for (const row of rows) {
    const raw = row.telephone;
    if (!raw || !String(raw).trim()) {
      unchanged++;
      continue;
    }

    const normalized = normalizeFrenchPhone(raw);
    const digits = normalized?.replace(/\D/g, '') || '';

    if (digits.length === 10 && digits.startsWith('0')) {
      if (normalized === String(raw).trim()) {
        unchanged++;
      } else {
        toUpdate.push({ id: row.id, telephone: normalized });
      }
      continue;
    }

    unchanged++;
  }

  let updated = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
    const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);
    await Promise.all(
      chunk.map(async ({ id, telephone }) => {
        const { error } = await sb
          .from(TABLE)
          .update({ telephone, updated_at: now })
          .eq('id', id);
        if (error) throw new Error(error.message);
        if (telephone) updated++;
      })
    );
  }

  return {
    scanned: rows.length,
    updated,
    unchanged,
  };
}

/** Stats rapides après réparation. */
export async function countValidFrenchPhones() {
  const sb = getSupabase();
  const { count, error } = await sb
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .not('telephone', 'is', null)
    .neq('telephone', '');
  if (error) throw new Error(error.message);
  return count || 0;
}

export { phoneDedupKey };
