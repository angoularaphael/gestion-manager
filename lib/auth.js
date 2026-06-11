import bcrypt from 'bcryptjs';
import { getSupabase } from './supabase';

export async function verifyLogin(email, password) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !password) return null;

  const superEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const superPass = process.env.SUPER_ADMIN_PASSWORD || '';
  if (superEmail && normalized === superEmail && password === superPass) {
    return { email: normalized, role: 'super_admin', name: 'Super Admin' };
  }

  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('app_users').select('*').eq('email', normalized).maybeSingle();
    if (error || !data) return null;
    if (!bcrypt.compareSync(password, data.password_hash)) return null;
    return { email: data.email, role: data.role, name: data.name || data.email };
  } catch {
    return null;
  }
}

export async function listUsers() {
  const sb = getSupabase();
  const { data, error } = await sb.from('app_users').select('email, role, name, created_at').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function createUser({ email, password, role, name }, actorRole) {
  if (actorRole !== 'super_admin') throw new Error('Réservé au super admin');
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized.includes('@')) throw new Error('Email invalide');
  if (!password || password.length < 8) throw new Error('Mot de passe min. 8 caractères');
  if (!['admin', 'super_admin'].includes(role)) throw new Error('Rôle invalide');

  const sb = getSupabase();
  const { error } = await sb.from('app_users').insert({
    email: normalized,
    password_hash: bcrypt.hashSync(password, 10),
    role,
    name: name || '',
  });
  if (error) throw new Error(error.message);
  return { email: normalized, role, name: name || '' };
}

export async function deleteUser(email, actorEmail, actorRole) {
  if (actorRole !== 'super_admin') throw new Error('Réservé au super admin');
  const target = String(email || '').trim().toLowerCase();
  if (target === actorEmail.toLowerCase()) throw new Error('Impossible de supprimer votre compte');
  const sb = getSupabase();
  const { error } = await sb.from('app_users').delete().eq('email', target);
  if (error) throw new Error(error.message);
  return { deleted: target };
}
