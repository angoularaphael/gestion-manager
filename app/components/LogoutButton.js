'use client';

import { useState } from 'react';
import MobileNavIcon from './MobileNavIcon';

export default function LogoutButton({ variant = 'full' }) {
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

  if (variant === 'icon') {
    return (
      <button
        type="button"
        className="mobile-icon-btn mobile-icon-btn--danger"
        aria-label="Déconnexion"
        onClick={onLogout}
        disabled={loading}
      >
        <MobileNavIcon name="logout" />
      </button>
    );
  }

  return (
    <button type="button" className="btn-logout" onClick={onLogout} disabled={loading}>
      {loading ? 'Déconnexion…' : 'Déconnexion'}
    </button>
  );
}
