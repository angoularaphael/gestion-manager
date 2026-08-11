'use client';

import { useEffect, useState } from 'react';

function Metric({ label, value }) {
  return (
    <div className="metric-cell">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value ?? '—'}</strong>
    </div>
  );
}

function StatsBlock({ title, stats, error, accent = 'default', subtitle = '' }) {
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

  return (
    <section className={`metric-band metric-band--${accent}`}>
      <header className="metric-band-header">
        <h3 className="metric-band-title">{title}</h3>
        {subtitle ? <span className="metric-band-subtitle">{subtitle}</span> : null}
      </header>
      <div className="metric-band-row">
        <Metric label="Total" value={stats?.total} />
        <Metric label="Avec tél." value={stats?.withPhone} />
        <Metric label="Avec email" value={stats?.withEmail} />
        <Metric label="Les deux" value={stats?.both} />
      </div>
    </section>
  );
}

export default function DashboardStats() {
  const [managerStats, setManagerStats] = useState(null);
  const [promoteurStats, setPromoteurStats] = useState(null);
  const [boxeurStats, setBoxeurStats] = useState(null);
  const [managerError, setManagerError] = useState('');
  const [promoteurError, setPromoteurError] = useState('');
  const [boxeurError, setBoxeurError] = useState('');

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

    fetch('/api/boxeurs/stats')
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Erreur');
        setBoxeurStats(d);
      })
      .catch((e) => setBoxeurError(e.message));
  }, []);

  const entraineurSubtitle =
    boxeurStats && boxeurStats.total != null ? `${boxeurStats.total} entraîneur(s)` : '';

  return (
    <div className="dashboard-stats-stack">
      <StatsBlock title="Managers" stats={managerStats} error={managerError} accent="blue" />
      <StatsBlock title="Promoteurs" stats={promoteurStats} error={promoteurError} accent="gold" />
      <StatsBlock
        title="Entraîneurs"
        stats={boxeurStats}
        error={boxeurError}
        accent="green"
        subtitle={entraineurSubtitle}
      />
    </div>
  );
}
