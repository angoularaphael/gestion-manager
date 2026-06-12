import bcrypt from 'bcryptjs';
import { getSupabase } from './supabase';
import { normalizePhone } from './phone';

function dbRole(role) {
  return role === 'super_admin' ? 'admin' : role || 'admin';
}

export async function verifyLogin(email, password) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !password) return null;

  const superEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const superPass = process.env.SUPER_ADMIN_PASSWORD || '';
  if (superEmail && normalized === superEmail && password === superPass) {
    return { email: normalized, role: 'super_admin', name: 'Super administrateur' };
  }

  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('app_users').select('*').eq('email', normalized).maybeSingle();
    if (error || !data) return null;
    if (!bcrypt.compareSync(password, data.password_hash)) return null;
    return {
      email: data.email,
      role: dbRole(data.role),
      name: data.name || data.email,
      phone: data.phone || '',
    };
  } catch {
    return null;
  }
}

export async function listUsers() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('app_users')
    .select('email, role, name, phone, created_at')
    .order('created_at');
  if (error) throw error;
  return (data || []).map((u) => ({ ...u, role: dbRole(u.role) }));
}

export async function createUser({ email, password, name, phone }, actorRole) {
  if (actorRole !== 'super_admin') throw new Error('Réservé au super administrateur');
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized.includes('@')) throw new Error('Email invalide');
  if (!password || password.length < 8) throw new Error('Mot de passe min. 8 caractères');

  const superEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  if (superEmail && normalized === superEmail) {
    throw new Error('Cet email est réservé au super administrateur');
  }

  const cleanPhone = normalizePhone(phone);

  const sb = getSupabase();
  const { error } = await sb.from('app_users').insert({
    email: normalized,
    password_hash: bcrypt.hashSync(password, 10),
    role: 'admin',
    name: (name || '').trim(),
    phone: cleanPhone || null,
  });
  if (error) {
    const msg = error.message || '';
    if (error.code === '23505' || /duplicate|unique/i.test(msg)) {
      throw new Error('Cet email est déjà enregistré');
    }
    throw new Error(msg || 'Erreur lors de la création du compte');
  }
  return {
    email: normalized,
    role: 'admin',
    name: (name || '').trim(),
    phone: cleanPhone || '',
  };
}

export async function deleteUser(email, actorEmail, actorRole) {
  if (actorRole !== 'super_admin') throw new Error('Réservé au super administrateur');
  const target = String(email || '').trim().toLowerCase();
  if (target === actorEmail.toLowerCase()) throw new Error('Impossible de supprimer votre compte');
  const superEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  if (superEmail && target === superEmail) {
    throw new Error('Le super administrateur ne peut pas être supprimé');
  }
  const sb = getSupabase();
  const { error } = await sb.from('app_users').delete().eq('email', target);
  if (error) throw new Error(error.message);
  return { deleted: target };
}
