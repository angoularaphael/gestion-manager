'use client';

import { useEffect, useState } from 'react';

function StatsBlock({ title, stats, error, accent = 'default' }) {
  if (error) {
    return (
      <div className="alert-banner err">
        <div>
          <strong>{title} — indisponible</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-stats-block">
        <h3 className={`dashboard-stats-heading dashboard-stats-heading-${accent}`}>{title}</h3>
        <div className="grid stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card stat stat-skeleton">
              <span className="muted">…</span>
              <strong>—</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-stats-block">
      <h3 className={`dashboard-stats-heading dashboard-stats-heading-${accent}`}>{title}</h3>
      <div className="grid stats-grid">
        <div className="card stat">
          <span className="muted">Total</span>
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
    </div>
  );
}

export default function DashboardStats() {
  const [managerStats, setManagerStats] = useState(null);
  const [promoteurStats, setPromoteurStats] = useState(null);
  const [managerError, setManagerError] = useState('');
  const [promoteurError, setPromoteurError] = useState('');

  useEffect(() => {
    fetch('/api/managers/stats')
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Erreur');
        setManagerStats(d);
      })
      .catch((e) => setManagerError(e.message));

    fetch('/api/promoteurs/stats')
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Erreur');
        setPromoteurStats(d);
      })
      .catch((e) => setPromoteurError(e.message));
  }, []);

  return (
    <div className="dashboard-stats-stack">
      <StatsBlock title="Managers" stats={managerStats} error={managerError} accent="blue" />
      <StatsBlock title="Promoteurs" stats={promoteurStats} error={promoteurError} accent="gold" />
    </div>
  );
}
