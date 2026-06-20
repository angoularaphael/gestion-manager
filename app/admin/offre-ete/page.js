'use client';

import { useCallback, useEffect, useState } from 'react';
import ActionButton from '../../components/ActionButton';
import { OFFRE_ETE_LANDING_URL } from '../../../lib/offreEteConfig';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function OffreEteAdminPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/offre-ete/stats', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setStats(data);
    } catch (e) {
      setError(e.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleReset() {
    if (resetting) return;
    if (!window.confirm('Réinitialiser tous les compteurs (clics + vues) ?')) return;
    setResetting(true);
    setResetMsg('');
    try {
      const res = await fetch('/api/offre-ete/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec');
      setResetMsg('Compteurs réinitialisés.');
      await refresh();
    } catch (e) {
      setResetMsg(e.message);
    } finally {
      setResetting(false);
    }
  }

  const conversion =
    stats && stats.views > 0
      ? Math.round(((stats.boutiqueClicks ?? 0) / stats.views) * 100)
      : null;

  function eventLabel(ev) {
    if (ev.event_type === 'view') return 'Vue page';
    if (String(ev.source || '').startsWith('boutique')) return "Clic J'en profite";
    return 'Clic En savoir plus';
  }

  function eventBadgeClass(ev) {
    if (ev.event_type === 'view') return 'blue';
    if (String(ev.source || '').startsWith('boutique')) return 'gold';
    return 'default';
  }

  return (
    <div className="offre-ete-admin-page">
      <header className="page-header">
        <div>
          <h1>Offre Été 2026</h1>
          <p className="page-subtitle">Suivi des clics « J&apos;en profite », vues page offre et WordPress</p>
        </div>
        <ActionButton className="btn secondary" onClick={refresh} loading={loading} disabled={loading}>
          Actualiser
        </ActionButton>
      </header>

      {error ? (
        <div className="alert-banner err">
          <strong>Statistiques indisponibles</strong>
          <p>{error}</p>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Vérifiez que la table de suivi offre été est bien configurée dans Supabase.
          </p>
        </div>
      ) : null}

      <div className="grid stats-grid offre-ete-stats-grid">
        <div className="card stat stat--gold">
          <span className="muted">Clics « J&apos;en profite » → boutique</span>
          <strong>{loading ? '…' : stats?.boutiqueClicks ?? 0}</strong>
        </div>
        <div className="card stat stat--blue">
          <span className="muted">Vues page offre</span>
          <strong>{loading ? '…' : stats?.views ?? 0}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Clics « En savoir plus »</span>
          <strong>{loading ? '…' : stats?.wordpressClicks ?? 0}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Taux vue → J&apos;en profite</span>
          <strong>{loading ? '…' : conversion != null ? `${conversion}%` : '—'}</strong>
        </div>
      </div>

      <section className="card offre-ete-links-card">
        <h2 className="card-title">Liens utiles</h2>
        <dl className="offre-ete-dl">
          <div>
            <dt>Campagne clients</dt>
            <dd>
              <a href="/admin/envoyer-clients">Envoyer aux clients</a>
              <span className="muted"> — modèle Offre Été prérempli</span>
            </dd>
          </div>
          <div>
            <dt>Landing page (public)</dt>
            <dd>
              <a href={OFFRE_ETE_LANDING_URL} target="_blank" rel="noopener noreferrer">
                {OFFRE_ETE_LANDING_URL}
              </a>
            </dd>
          </div>
        </dl>
      </section>

      {stats?.allowReset ? (
        <section className="card offre-ete-reset-card">
          <h2 className="card-title">Réinitialiser</h2>
          <p className="muted">
            Remet les compteurs à zéro.
          </p>
          <ActionButton className="btn danger" onClick={handleReset} loading={resetting}>
            Réinitialiser les statistiques
          </ActionButton>
          {resetMsg ? <p className="offre-ete-reset-msg">{resetMsg}</p> : null}
        </section>
      ) : (
        <p className="muted offre-ete-reset-locked">Réinitialisation désactivée.</p>
      )}

      <section className="card">
        <h2 className="card-title">Derniers événements</h2>
        {loading ? (
          <p className="muted">Chargement…</p>
        ) : !stats?.recent?.length ? (
          <p className="muted">Aucun événement pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Référent</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((ev) => (
                  <tr key={ev.id}>
                    <td>{formatDate(ev.created_at)}</td>
                    <td>
                      <span className={`badge badge--${eventBadgeClass(ev)}`}>
                        {eventLabel(ev)}
                      </span>
                    </td>
                    <td>{ev.source || '—'}</td>
                    <td className="offre-ete-referrer">{ev.referrer || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
