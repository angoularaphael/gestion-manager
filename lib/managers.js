import { buildContactRow, duplicateContactError } from './contactRecord';
import { getSupabase } from './supabase';

export async function fetchManagersFromDb({ search = '', contactType = '' } = {}) {
  const sb = getSupabase();
  let query = sb.from('managers').select('*').order('nom', { ascending: true });

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

const TEST_TARGET_EMAIL = 'linuxcam05@gmail.com';
const TEST_TARGET_PHONE = '237693646080';

export async function fetchTestManagerFromDb() {
  const sb = getSupabase();
  const { data, error } = await sb.from('managers').select('*').eq('is_test', true).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchManagersForBroadcast(channel = 'email') {
  const sb = getSupabase();
  let query = sb.from('managers').select('*').order('nom', { ascending: true });
  if (channel === 'email') {
    query = query.eq('has_email', true);
  } else if (channel === 'whatsapp' || channel === 'phone') {
    query = query.eq('has_phone', true);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchManagersByIds(ids) {
  const sb = getSupabase();
  const { data, error } = await sb.from('managers').select('*').in('id', ids);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function resolveManagersForSend({ manager_ids: managerIds, test_only: testOnly, broadcast }) {
  if (testOnly) {
    const test = await fetchTestManagerFromDb();
    if (test) return [test];
    return [{ nom: 'atangana', email: TEST_TARGET_EMAIL, telephone: TEST_TARGET_PHONE, id: null }];
  }
  if (broadcast) {
    if (broadcast === 'email') return fetchManagersForBroadcast('email');
    if (broadcast === 'phone' || broadcast === 'whatsapp') return fetchManagersForBroadcast('whatsapp');
    if (broadcast === 'all') return fetchManagersForBroadcast('all');
    throw new Error('broadcast invalide (email, phone, all)');
  }
  if (Array.isArray(managerIds) && managerIds.length) {
    return fetchManagersByIds(managerIds);
  }
  throw new Error('manager_ids, broadcast ou test_only requis');
}

export async function createManagerInDb(fields) {
  const row = buildContactRow(fields);
  const sb = getSupabase();
  const { data, error } = await sb.from('managers').insert(row).select().single();
  if (error) throw duplicateContactError('manager', error);
  return data;
}

export async function updateManagerInDb(id, fields) {
  const row = buildContactRow(fields);
  const sb = getSupabase();
  const { data, error } = await sb.from('managers').update(row).eq('id', id).select().single();
  if (error) throw duplicateContactError('manager', error);
  return data;
}

export async function deleteManagerInDb(id) {
  const sb = getSupabase();
  const { error } = await sb.from('managers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchManagerStatsFromDb() {
  const sb = getSupabase();
  const { data, error } = await sb.from('managers').select('email, telephone, contact_type');
  if (error) throw new Error(error.message);
  const rows = data || [];
  return {
    total: rows.length,
    withPhone: rows.filter((m) => m.telephone).length,
    withEmail: rows.filter((m) => m.email).length,
    both: rows.filter((m) => m.email && m.telephone).length,
  };
}
