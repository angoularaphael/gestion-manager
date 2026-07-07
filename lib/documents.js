import { getSupabase } from './supabase';

const TABLE = 'documents';

export async function fetchDocuments({ type = '', search = '' } = {}) {
  const sb = getSupabase();
  let q = sb.from(TABLE).select('*').order('created_at', { ascending: false });

  if (type) q = q.eq('type', type);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(
      `numero.ilike.${term},client_nom.ilike.${term},prestation.ilike.${term},reference.ilike.${term}`
    );
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchDocumentById(id) {
  const sb = getSupabase();
  const { data, error } = await sb.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getNextDocumentNumber(type) {
  const prefix = type === 'facture' ? 'FAC' : 'DEV';
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select('numero')
    .like('numero', pattern)
    .order('numero', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);

  let next = 1;
  if (data?.length) {
    const last = data[0].numero;
    const parts = last.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) next = num + 1;
  }

  return `${prefix}-${year}-${String(next).padStart(3, '0')}`;
}

export async function createDocument(body) {
  const sb = getSupabase();
  const numero = await getNextDocumentNumber(body.type);

  const row = {
    type: body.type,
    numero,
    societe: body.societe,
    client_nom: body.client_nom?.trim() || '',
    client_email: body.client_email?.trim() || null,
    client_adresse: body.client_adresse?.trim() || null,
    client_telephone: body.client_telephone?.trim() || null,
    prestation: body.prestation?.trim() || '',
    montant: parseFloat(body.montant) || 0,
    date_document: body.date_document || new Date().toISOString().slice(0, 10),
    reference: body.reference?.trim() || null,
    conditions: body.conditions?.trim() || null,
    created_by: body.created_by || null,
  };

  if (!row.client_nom) throw new Error('Nom du client requis');
  if (!row.prestation) throw new Error('Prestation requise');
  if (!['devis', 'facture'].includes(row.type)) throw new Error('Type invalide');
  if (!['asso_tmbc', 'boxing_center', 'distrix'].includes(row.societe)) throw new Error('Société invalide');

  const { data, error } = await sb.from(TABLE).insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}
