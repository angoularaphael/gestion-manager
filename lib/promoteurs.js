import { buildContactRow, duplicateContactError } from './contactRecord';
import { getSupabase } from './supabase';

export async function fetchPromoteursFromDb({ search = '', contactType = '' } = {}) {
  const sb = getSupabase();
  let query = sb.from('promoteurs').select('*').order('nom', { ascending: true });

  if (contactType) {
    query = query.eq('contact_type', contactType);
  }

  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(`nom.ilike.${q},email.ilike.${q},localisation.ilike.${q},telephone.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createPromoteurInDb(fields) {
  const row = buildContactRow(fields);
  const sb = getSupabase();
  const { data, error } = await sb.from('promoteurs').insert(row).select().single();
  if (error) throw duplicateContactError('promoteur', error);
  return data;
}

export async function updatePromoteurInDb(id, fields) {
  const row = buildContactRow(fields);
  const sb = getSupabase();
  const { data, error } = await sb.from('promoteurs').update(row).eq('id', id).select().single();
  if (error) throw duplicateContactError('promoteur', error);
  return data;
}

export async function deletePromoteurInDb(id) {
  const sb = getSupabase();
  const { error } = await sb.from('promoteurs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchPromoteurStatsFromDb() {
  const sb = getSupabase();
  const { data, error } = await sb.from('promoteurs').select('email, telephone, contact_type');
  if (error) throw new Error(error.message);
  const rows = data || [];
  return {
    total: rows.length,
    withPhone: rows.filter((m) => m.telephone).length,
    withEmail: rows.filter((m) => m.email).length,
    both: rows.filter((m) => m.email && m.telephone).length,
  };
}

export async function fetchTestPromoteurFromDb() {
  const sb = getSupabase();
  const { data, error } = await sb.from('promoteurs').select('*').eq('is_test', true).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function resolvePromoteursForSend({ promoter_ids: promoterIds, test_only: testOnly, broadcast }) {
  const { resolveContactsForSend } = await import('./contactSendResolve');
  return resolveContactsForSend({
    table: 'promoteurs',
    ids: promoterIds,
    idField: 'promoter_ids',
    testOnly,
    broadcast,
    fetchTestRow: fetchTestPromoteurFromDb,
  });
}
