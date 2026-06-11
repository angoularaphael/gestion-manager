'use client';

import { useEffect, useState } from 'react';

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/managers/stats')
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Erreur');
        setStats(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="alert-banner err">
        <div>
          <strong>Statistiques managers indisponibles</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card stat stat-skeleton">
            <span className="muted">…</span>
            <strong>—</strong>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid stats-grid">
      <div className="card stat">
        <span className="muted">Managers</span>
        <strong>{stats.total}</strong>
      </div>
      <div className="card stat">
        <span className="muted">Avec tél.</span>
        <strong>{stats.withPhone}</strong>
      </div>
      <div className="card stat">
        <span className="muted">Avec email</span>
        <strong>{stats.withEmail}</strong>
      </div>
      <div className="card stat">
        <span className="muted">Les deux</span>
        <strong>{stats.both}</strong>
      </div>
    </div>
  );
}
