import { buildContactRow, duplicateContactError } from './contactRecord';
import { getSupabase } from './supabase';

export async function fetchBoxeursFromDb({ search = '', contactType = '', categorie = '' } = {}) {
  const sb = getSupabase();
  let query = sb.from('boxeurs').select('*').order('nom', { ascending: true });

  if (categorie) {
    query = query.eq('categorie', categorie);
  }

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

export async function createBoxeurInDb(fields) {
  if (!fields.categorie) throw new Error('La catégorie est requise (amateur ou pro)');
  const row = buildContactRow(fields);
  const sb = getSupabase();
  const { data, error } = await sb.from('boxeurs').insert(row).select().single();
  if (error) throw duplicateContactError('boxeur', error);
  return data;
}

export async function updateBoxeurInDb(id, fields) {
  if (!fields.categorie) throw new Error('La catégorie est requise (amateur ou pro)');
  const row = buildContactRow(fields);
  const sb = getSupabase();
  const { data, error } = await sb.from('boxeurs').update(row).eq('id', id).select().single();
  if (error) throw duplicateContactError('boxeur', error);
  return data;
}

export async function deleteBoxeurInDb(id) {
  const sb = getSupabase();
  const { error } = await sb.from('boxeurs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchBoxeurStatsFromDb() {
  const sb = getSupabase();
  const { data, error } = await sb.from('boxeurs').select('email, telephone, contact_type, categorie');
  if (error) throw new Error(error.message);
  const rows = data || [];
  return {
    total: rows.length,
    amateur: rows.filter((m) => m.categorie === 'amateur').length,
    pro: rows.filter((m) => m.categorie === 'pro').length,
    withPhone: rows.filter((m) => m.telephone).length,
    withEmail: rows.filter((m) => m.email).length,
    both: rows.filter((m) => m.email && m.telephone).length,
  };
}
