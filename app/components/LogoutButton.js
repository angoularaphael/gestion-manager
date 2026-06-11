'use client';

import { useState } from 'react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      sessionStorage.removeItem('bc_splash_seen');
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* redirection même en cas d'erreur réseau */
    }
    window.location.href = '/login';
  }

  return (
    <button type="button" className="btn-logout" onClick={onLogout} disabled={loading}>
      {loading ? 'Déconnexion…' : 'Déconnexion'}
    </button>
  );
}
