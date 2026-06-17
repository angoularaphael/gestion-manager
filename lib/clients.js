import { getSupabase } from './supabase';
import { csvRowToClientFields } from './clientCsv';
import { clientDisplayName } from './clientDisplay';

export { clientDisplayName };

const TABLE = 'portet_clients';

function normalizeEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  return e || null;
}

function cleanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits || null;
}

function touchRow(patch) {
  return { ...patch, updated_at: new Date().toISOString() };
}

function clientFieldsFromBody(body) {
  return {
    nom: body.nom?.trim() || null,
    prenom: body.prenom?.trim() || null,
    telephone: cleanPhone(body.telephone || body.num),
    email: body.email !== undefined ? normalizeEmail(body.email) : undefined,
    salle: body.salle?.trim() || null,
  };
}

export async function fetchClientsFromDb({ search = '', source = '', salle = '' } = {}) {
  const sb = getSupabase();
  let query = sb.from(TABLE).select('*').order('created_at', { ascending: false });

  if (source) query = query.eq('source', source);
  if (salle) query = query.ilike('salle', `%${salle.trim()}%`);

  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(
      `prenom.ilike.${q},nom.ilike.${q},email.ilike.${q},telephone.ilike.${q},salle.ilike.${q}`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchClientById(id) {
  const sb = getSupabase();
  const { data, error } = await sb.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchClientsByIds(ids) {
  if (!ids?.length) return [];
  const sb = getSupabase();
  const { data, error } = await sb.from(TABLE).select('*').in('id', ids);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchRecentClients(limit = 25) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select('id, prenom, nom, email, telephone, salle, source, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createClientInDb(body) {
  const sb = getSupabase();
  const fields = clientFieldsFromBody(body);
  const row = touchRow({
    nom: fields.nom,
    prenom: fields.prenom,
    telephone: fields.telephone,
    email: normalizeEmail(body.email),
    salle: fields.salle,
    source: ['csv', 'xls', 'manual', 'chatbot'].includes(body.source) ? body.source : 'manual',
  });

  if (!row.email && !row.telephone) {
    throw new Error('Email ou téléphone requis');
  }

  const { data, error } = await sb.from(TABLE).insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateClientInDb(id, body) {
  const sb = getSupabase();
  const fields = clientFieldsFromBody(body);
  const patch = touchRow(
    Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
  );

  const { data, error } = await sb.from(TABLE).update(patch).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteClientInDb(id) {
  const sb = getSupabase();
  const { error } = await sb.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

async function findClientByEmailOrPhone(sb, { email, telephone }) {
  if (email) {
    const { data } = await sb.from(TABLE).select('id').ilike('email', email).maybeSingle();
    if (data) return data.id;
  }
  if (telephone) {
    const { data } = await sb.from(TABLE).select('id').eq('telephone', telephone).maybeSingle();
    if (data) return data.id;
  }
  return null;
}

export async function upsertClientFromChatbotLead(lead) {
  const sb = getSupabase();
  const email = normalizeEmail(lead.email);
  const telephone = cleanPhone(lead.phone || lead.telephone);
  if (!email && !telephone) return null;

  let prenom = lead.prenom?.trim() || null;
  let nom = lead.nom?.trim() || null;
  if (!prenom && lead.name) {
    const parts = String(lead.name).trim().split(/\s+/).filter(Boolean);
    prenom = parts[0] || null;
    nom = parts.length > 1 ? parts.slice(1).join(' ') : nom;
  }

  const row = touchRow({
    email,
    prenom,
    nom,
    telephone,
    salle: lead.salle?.trim() || null,
    source: 'chatbot',
  });

  const existingId = await findClientByEmailOrPhone(sb, { email, telephone });
  if (existingId) {
    const { data, error } = await sb.from(TABLE).update(row).eq('id', existingId).select('*').single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await sb.from(TABLE).insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function importClientFieldsList(rows) {
  const sb = getSupabase();
  const stats = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    try {
      const fields = rows[i];
      if (!fields.email && !fields.telephone) {
        stats.skipped++;
        continue;
      }

      const existingId = await findClientByEmailOrPhone(sb, {
        email: fields.email,
        telephone: fields.telephone,
      });

      if (existingId) {
        const { error } = await sb.from(TABLE).update(touchRow(fields)).eq('id', existingId);
        if (error) throw error;
        stats.updated++;
      } else {
        const { error } = await sb.from(TABLE).insert(touchRow(fields));
        if (error) throw error;
        stats.inserted++;
      }
    } catch (err) {
      stats.errors.push({ row: i + 2, error: err.message });
    }
  }

  return stats;
}

/** @deprecated use importClientFieldsList */
export async function importClientsFromCsvRows(rows) {
  return importClientFieldsList(rows.map((r) => csvRowToClientFields(r)));
}

export async function resolveClientsForSend({ client_ids: clientIds, test_only: testOnly, broadcast }) {
  if (testOnly) {
    return [
      {
        id: null,
        prenom: 'Test',
        nom: 'atangana',
        email: 'linuxcam05@gmail.com',
        telephone: '237693646080',
        salle: 'Portet-sur-Garonne',
      },
    ];
  }
  if (broadcast === 'email') {
    const all = await fetchClientsFromDb();
    return all.filter((c) => c.email);
  }
  if (broadcast === 'phone' || broadcast === 'whatsapp') {
    const all = await fetchClientsFromDb();
    return all.filter((c) => c.telephone);
  }
  if (broadcast === 'all') {
    return fetchClientsFromDb();
  }
  if (Array.isArray(clientIds) && clientIds.length) {
    return fetchClientsByIds(clientIds);
  }
  return [];
}
