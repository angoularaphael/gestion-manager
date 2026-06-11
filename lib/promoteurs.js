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
