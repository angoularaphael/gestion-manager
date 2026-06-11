const API_BASE = window.BC_CONFIG?.apiBase || window.location.origin;
const TOKEN_KEY = 'bc_session_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function apiPublic(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  return res.json().catch(() => ({}));
}

export async function login(password, email) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Connexion impossible');
  if (data.token) setStoredToken(data.token);
  return data;
}

export async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } finally {
    setStoredToken('');
  }
}

export function getMe() {
  return api('/api/auth/me');
}

export function listUsers() {
  return api('/api/users');
}

export function createUser(payload) {
  return api('/api/users', { method: 'POST', body: JSON.stringify(payload) });
}

export function deleteUser(email) {
  return api('/api/users', { method: 'DELETE', body: JSON.stringify({ email }) });
}
