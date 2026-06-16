'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ActionButton from '../../components/ActionButton';

export default function EquipePortetPage() {
  const [entraineurs, setEntraineurs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/entraineurs-portet', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setEntraineurs(data.entraineurs || []);
      setMeta({ site: data.site, updated_at: data.updated_at, count: data.count });
    } catch (e) {
      setError(e.message);
      setEntraineurs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="equipe-portet-page">
      <header className="page-header">
        <div>
          <h1>Équipe Portet</h1>
          <p className="page-subtitle">
            Entraîneurs affichés sur boxing-center-portet.fr — section « Les entraîneurs »
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ActionButton className="btn secondary" onClick={load} loading={loading} disabled={loading}>
            Actualiser
          </ActionButton>
          <a className="btn ghost" href="https://www.boxing-center-portet.fr/coachs/" target="_blank" rel="noopener noreferrer">
            Voir sur le site
          </a>
        </div>
      </header>

      {meta && (
        <p className="muted" style={{ marginBottom: '1.2rem' }}>
          {meta.count} entraîneur{meta.count > 1 ? 's' : ''} · source{' '}
          <code>data/entraineurs-portet.json</code>
          {meta.updated_at ? ` · maj ${meta.updated_at}` : ''}
        </p>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <strong>Impossible de charger l&apos;équipe</strong>
          <p>{error}</p>
          <ActionButton className="btn btn-sm" onClick={load} loading={loading}>
            Réessayer
          </ActionButton>
        </div>
      )}

      {loading && !entraineurs.length && <p className="muted">Chargement…</p>}

      <div className="equipe-portet-grid">
        {entraineurs.map((e) => (
          <article key={e.id} className="equipe-portet-card">
            <div className="equipe-portet-card__media">
              {e.img ? (
                <img src={e.img} alt="" loading="lazy" />
              ) : (
                <span className="equipe-portet-card__initials">{e.initials || '?'}</span>
              )}
            </div>
            <div className="equipe-portet-card__body">
              <span className="equipe-portet-card__kind">{e.kind || 'Entraîneur'}</span>
              <h2>{e.name}</h2>
              <p className="equipe-portet-card__role">{e.role}</p>
              <p className="equipe-portet-card__desc">{e.desc}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.6rem' }}>Contacts entraîneurs (CRM)</h2>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Pour envoyer un email ou WhatsApp aux entraîneurs du réseau, utilisez la liste contacts.
        </p>
        <Link className="btn btn-sm" href="/admin/entraineurs">
          Liste des entraîneurs
        </Link>
        {' '}
        <Link className="btn btn-sm ghost" href="/admin/envoyer-entraineurs">
          Envoyer aux entraîneurs
        </Link>
      </section>
    </div>
  );
}
