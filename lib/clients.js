import { getSupabase } from './supabase';
import { csvRowToClientFields } from './clientCsv';
import { clientDisplayName } from './clientDisplay';

export { clientDisplayName };

const TABLE = 'portet_clients';

function normalizeEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  return e || null;
}

function touchRow(patch) {
  return { ...patch, updated_at: new Date().toISOString() };
}

export async function fetchClientsFromDb({ search = '', source = '', salle = '', tag = '' } = {}) {
  const sb = getSupabase();
  let query = sb.from(TABLE).select('*').order('registered_at', { ascending: false, nullsFirst: false });

  if (source) query = query.eq('source', source);
  if (salle) query = query.ilike('salle', `%${salle.trim()}%`);
  if (tag) query = query.ilike('tag', `%${tag.trim()}%`);

  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(
      `prenom.ilike.${q},nom.ilike.${q},email.ilike.${q},telephone.ilike.${q},salle.ilike.${q},ville.ilike.${q},tag.ilike.${q}`
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
    .select(
      'id, prenom, nom, email, telephone, salle, tag, metier, message, source, registered_at, created_at, updated_at'
    )
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createClientInDb(body) {
  const sb = getSupabase();
  const email = normalizeEmail(body.email);
  const row = touchRow({
    email,
    prenom: body.prenom?.trim() || null,
    nom: body.nom?.trim() || null,
    telephone: body.telephone?.replace(/\D/g, '') || null,
    adresse: body.adresse?.trim() || null,
    cours: body.cours?.trim() || null,
    date_naissance: body.date_naissance || null,
    salle: body.salle?.trim() || null,
    pays: body.pays?.trim() || 'FR',
    region: body.region?.trim() || null,
    ville: body.ville?.trim() || null,
    code_postal: body.code_postal?.trim() || null,
    quartier: body.quartier?.trim() || null,
    numero_rue: body.numero_rue?.trim() || null,
    tag: body.tag?.trim() || null,
    metier: body.metier?.trim() || null,
    message: body.message?.trim() || null,
    recontact_requested: !!body.recontact_requested,
    source: body.source === 'csv' || body.source === 'manual' ? body.source : 'manual',
    registered_at: body.registered_at || new Date().toISOString(),
  });

  if (!email && !row.telephone) {
    throw new Error('Email ou téléphone requis');
  }

  const { data, error } = await sb.from(TABLE).insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateClientInDb(id, body) {
  const sb = getSupabase();
  const patch = touchRow({
    ...(body.email !== undefined ? { email: normalizeEmail(body.email) } : {}),
    ...(body.prenom !== undefined ? { prenom: body.prenom?.trim() || null } : {}),
    ...(body.nom !== undefined ? { nom: body.nom?.trim() || null } : {}),
    ...(body.telephone !== undefined
      ? { telephone: body.telephone?.replace(/\D/g, '') || null }
      : {}),
    ...(body.adresse !== undefined ? { adresse: body.adresse?.trim() || null } : {}),
    ...(body.cours !== undefined ? { cours: body.cours?.trim() || null } : {}),
    ...(body.date_naissance !== undefined ? { date_naissance: body.date_naissance || null } : {}),
    ...(body.salle !== undefined ? { salle: body.salle?.trim() || null } : {}),
    ...(body.pays !== undefined ? { pays: body.pays?.trim() || 'FR' } : {}),
    ...(body.region !== undefined ? { region: body.region?.trim() || null } : {}),
    ...(body.ville !== undefined ? { ville: body.ville?.trim() || null } : {}),
    ...(body.code_postal !== undefined ? { code_postal: body.code_postal?.trim() || null } : {}),
    ...(body.quartier !== undefined ? { quartier: body.quartier?.trim() || null } : {}),
    ...(body.numero_rue !== undefined ? { numero_rue: body.numero_rue?.trim() || null } : {}),
    ...(body.tag !== undefined ? { tag: body.tag?.trim() || null } : {}),
    ...(body.metier !== undefined ? { metier: body.metier?.trim() || null } : {}),
    ...(body.message !== undefined ? { message: body.message?.trim() || null } : {}),
    ...(body.recontact_requested !== undefined
      ? { recontact_requested: !!body.recontact_requested }
      : {}),
    ...(body.registered_at !== undefined ? { registered_at: body.registered_at || null } : {}),
  });

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
    const { data } = await sb
      .from(TABLE)
      .select('id')
      .eq('telephone', telephone)
      .maybeSingle();
    if (data) return data.id;
  }
  return null;
}

export async function upsertClientFromChatbotLead(lead) {
  const sb = getSupabase();
  const email = normalizeEmail(lead.email);
  const telephone = lead.phone ? String(lead.phone).replace(/\D/g, '') : null;
  if (!email && !telephone) return null;

  const name = String(lead.name || '').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const prenom = parts[0] || null;
  const nom = parts.length > 1 ? parts.slice(1).join(' ') : null;

  const row = touchRow({
    email,
    prenom,
    nom,
    telephone,
    metier: lead.metier || null,
    message: lead.message || null,
    recontact_requested: !!lead.recontact_requested,
    source: 'chatbot',
    chatbot_lead_id: lead.id || null,
    tag: lead.message ? 'Chatbot Portet — demande' : 'Chatbot Portet',
    registered_at: lead.created_at || new Date().toISOString(),
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

export async function importClientsFromCsvRows(rows) {
  const sb = getSupabase();
  const stats = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    try {
      const fields = csvRowToClientFields(rows[i]);
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

export async function resolveClientsForSend({ client_ids: clientIds, test_only: testOnly, broadcast }) {
  if (testOnly) {
    const test = await fetchClientsFromDb({ search: 'linuxcam05@gmail.com' });
    const hit = test.find((c) => c.email === 'linuxcam05@gmail.com');
    if (hit) return [hit];
    return [
      {
        id: null,
        prenom: 'Test',
        nom: 'atangana',
        email: 'linuxcam05@gmail.com',
        telephone: '237693646080',
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
