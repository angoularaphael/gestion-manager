import { getSupabase } from './supabase';
import { csvRowToClientFields, clientImportIdentityKey } from './clientCsv';
import { clientDisplayName } from './clientDisplay';
import { normalizeClientSalleLabel } from './boxingCenterSalles';
import { normalizeFrenchPhone, phoneDedupKey, phoneLookupVariants } from './phoneFormat';

export { clientDisplayName };

const TABLE = 'portet_clients';

function normalizeEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  return e || null;
}

function cleanPhone(value) {
  return normalizeFrenchPhone(value);
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
    salle: body.salle !== undefined ? normalizeClientSalleLabel(body.salle) || body.salle?.trim() || null : undefined,
  };
}

function applyClientListFilters(query, { search = '', source = '', salle = '' } = {}) {
  let q = query;
  if (source) q = q.eq('source', source);
  if (salle) q = q.ilike('salle', `%${salle.trim()}%`);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(
      `prenom.ilike.${term},nom.ilike.${term},email.ilike.${term},telephone.ilike.${term},salle.ilike.${term}`
    );
  }
  return q;
}

const SUPABASE_PAGE_SIZE = 1000;

async function fetchAllPaginated(makeQuery) {
  const all = [];
  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    const { data, error } = await makeQuery().range(from, to);
    if (error) throw new Error(error.message);
    const batch = data || [];
    all.push(...batch);
    if (batch.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return all;
}

export async function fetchClientStatsFromDb() {
  const sb = getSupabase();
  const [totalRes, emailRes, phoneRes] = await Promise.all([
    sb.from(TABLE).select('*', { count: 'exact', head: true }),
    sb.from(TABLE).select('*', { count: 'exact', head: true }).not('email', 'is', null).neq('email', ''),
    sb.from(TABLE).select('*', { count: 'exact', head: true }).not('telephone', 'is', null).neq('telephone', ''),
  ]);

  if (totalRes.error) throw new Error(totalRes.error.message);
  if (emailRes.error) throw new Error(emailRes.error.message);
  if (phoneRes.error) throw new Error(phoneRes.error.message);

  return {
    total: totalRes.count || 0,
    withEmail: emailRes.count || 0,
    withPhone: phoneRes.count || 0,
  };
}

export async function fetchClientsFromDb({ search = '', source = '', salle = '' } = {}) {
  const sb = getSupabase();
  const makeQuery = () =>
    applyClientListFilters(
      sb.from(TABLE).select('*').order('created_at', { ascending: false }),
      { search, source, salle }
    );

  return fetchAllPaginated(makeQuery);
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
    const variants = phoneLookupVariants(telephone);
    if (variants.length) {
      const { data } = await sb.from(TABLE).select('id').in('telephone', variants).limit(1).maybeSingle();
      if (data) return data.id;
    }
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
    salle: normalizeClientSalleLabel(lead.salle) || lead.salle?.trim() || null,
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

function normalizeImportFields(raw) {
  return {
    nom: raw.nom?.trim() || null,
    prenom: raw.prenom?.trim() || null,
    telephone: cleanPhone(raw.telephone),
    email: normalizeEmail(raw.email),
    salle: normalizeClientSalleLabel(raw.salle) || raw.salle?.trim() || null,
    source: raw.source || 'csv',
  };
}

function dedupeImportRows(rows) {
  const byKey = new Map();
  for (const row of rows) {
    const key = clientImportIdentityKey(row);
    if (key) byKey.set(key, row);
  }
  return [...byKey.values()];
}

export async function importClientFieldsList(rows) {
  const sb = getSupabase();
  const stats = { inserted: 0, updated: 0, skipped: 0, duplicates: 0, errors: [] };

  const normalized = [];
  for (const raw of rows) {
    const fields = normalizeImportFields(raw);
    if (!fields.email && !fields.telephone) {
      stats.skipped++;
      continue;
    }
    normalized.push(fields);
  }

  const uniqueRows = dedupeImportRows(normalized);
  if (!uniqueRows.length) return stats;

  const emails = [...new Set(uniqueRows.map((f) => f.email).filter(Boolean))];
  const phones = [...new Set(uniqueRows.map((f) => f.telephone).filter(Boolean))];

  const emailToId = new Map();
  const phoneToId = new Map();

  if (emails.length) {
    const { data, error } = await sb.from(TABLE).select('id, email').in('email', emails);
    if (error) throw new Error(error.message);
    for (const client of data || []) {
      if (client.email) emailToId.set(normalizeEmail(client.email), client.id);
    }
  }

  if (phones.length) {
    const variants = [...new Set(phones.flatMap((p) => phoneLookupVariants(p)))];
    const { data, error } = await sb.from(TABLE).select('id, telephone').in('telephone', variants);
    if (error) throw new Error(error.message);
    for (const client of data || []) {
      const key = phoneDedupKey(client.telephone);
      if (key) phoneToId.set(key, client.id);
    }
  }

  const toInsert = [];

  for (const fields of uniqueRows) {
    const id =
      (fields.email && emailToId.get(fields.email)) ||
      (fields.telephone && phoneToId.get(phoneDedupKey(fields.telephone))) ||
      null;
    const row = touchRow(fields);
    if (id) {
      stats.duplicates++;
      continue;
    }
    toInsert.push(row);
  }

  const INSERT_CHUNK = 200;
  for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
    const chunk = toInsert.slice(i, i + INSERT_CHUNK);
    const { data, error } = await sb.from(TABLE).insert(chunk).select('id, email, telephone');
    if (error) {
      for (const row of chunk) {
        try {
          const { data: one, error: oneErr } = await sb
            .from(TABLE)
            .insert(row)
            .select('id, email, telephone')
            .single();
          if (oneErr) throw oneErr;
          stats.inserted++;
          if (one.email) emailToId.set(normalizeEmail(one.email), one.id);
          if (one.telephone) phoneToId.set(phoneDedupKey(one.telephone), one.id);
        } catch (err) {
          stats.errors.push({ error: err.message });
        }
      }
    } else {
      stats.inserted += data.length;
      for (const client of data) {
        if (client.email) emailToId.set(normalizeEmail(client.email), client.id);
        if (client.telephone) phoneToId.set(phoneDedupKey(client.telephone), client.id);
      }
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
