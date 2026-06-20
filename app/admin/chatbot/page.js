'use client';

import { useCallback, useEffect, useState } from 'react';
import ActionButton from '../../components/ActionButton';
import { formatClientPhone } from '../../../lib/phoneFormat';

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

export default function ChatbotAdminPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chatbot/stats', { cache: 'no-store' });
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
    if (!window.confirm('Réinitialiser toutes les statistiques et leads du chatbot ?')) return;
    setResetting(true);
    setResetMsg('');
    try {
      const res = await fetch('/api/chatbot/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec');
      setResetMsg('Statistiques réinitialisées.');
      await refresh();
    } catch (e) {
      setResetMsg(e.message);
    } finally {
      setResetting(false);
    }
  }

  const faqTotal = (stats?.faqHits ?? 0) + (stats?.faqMisses ?? 0);
  const faqRate =
    faqTotal > 0 ? Math.round(((stats?.faqHits ?? 0) / faqTotal) * 100) : null;

  return (
    <div className="chatbot-admin-page">
      <header className="page-header">
        <div>
          <h1>Chatbot Portet</h1>
          <p className="page-subtitle">Suivi des conversations, leads et FAQ du widget site Portet</p>
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
            Vérifiez que la migration Supabase <code>008_chatbot.sql</code> a été appliquée.
          </p>
        </div>
      ) : null}

      <div className="grid stats-grid chatbot-stats-grid">
        <div className="card stat stat--blue">
          <span className="muted">Chats démarrés</span>
          <strong>{loading ? '…' : stats?.chatsStarted ?? 0}</strong>
        </div>
        <div className="card stat stat--gold">
          <span className="muted">Leads collectés</span>
          <strong>{loading ? '…' : stats?.leadsCollected ?? 0}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Réponses FAQ</span>
          <strong>{loading ? '…' : stats?.faqHits ?? 0}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Escalades</span>
          <strong>{loading ? '…' : stats?.escalations ?? 0}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Taux FAQ résolue</span>
          <strong>{loading ? '…' : faqRate != null ? `${faqRate}%` : '—'}</strong>
        </div>
      </div>

      {stats?.allowReset ? (
        <section className="card chatbot-reset-card">
          <h2 className="card-title">Réinitialiser</h2>
          <p className="muted">Remet les compteurs et la liste des leads à zéro.</p>
          <ActionButton className="btn danger" onClick={handleReset} loading={resetting}>
            Réinitialiser les statistiques
          </ActionButton>
          {resetMsg ? <p className="chatbot-reset-msg">{resetMsg}</p> : null}
        </section>
      ) : (
        <p className="muted chatbot-reset-locked">Réinitialisation désactivée.</p>
      )}

      <section className="card">
        <h2 className="card-title">Leads collectés</h2>
        {loading ? (
          <p className="muted">Chargement…</p>
        ) : !stats?.leads?.length ? (
          <p className="muted">Aucun lead pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Métier</th>
                  <th>Message</th>
                  <th>Recontact</th>
                </tr>
              </thead>
              <tbody>
                {stats.leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{formatDate(lead.created_at)}</td>
                    <td>{lead.name || '—'}</td>
                    <td>{lead.email || '—'}</td>
                    <td>{formatClientPhone(lead.phone) || '—'}</td>
                    <td>{lead.metier || '—'}</td>
                    <td className="chatbot-message-cell">{lead.message || '—'}</td>
                    <td>{lead.recontact_requested ? 'Oui' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Derniers clients (chatbot &amp; inscriptions)</h2>
        {loading ? (
          <p className="muted">Chargement…</p>
        ) : !stats?.recentClients?.length ? (
          <p className="muted">
            Aucun client en base. Les leads chatbot et les imports CSV apparaissent ici — voir aussi{' '}
            <a href="/admin/clients">Clients</a>.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Salle</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentClients.map((client) => (
                  <tr key={client.id}>
                    <td>{formatDate(client.updated_at || client.created_at)}</td>
                    <td>{[client.prenom, client.nom].filter(Boolean).join(' ') || client.email || '—'}</td>
                    <td>{client.email || '—'}</td>
                    <td>{formatClientPhone(client.telephone) || '—'}</td>
                    <td>{client.salle || '—'}</td>
                    <td>
                      <span className="badge">{client.source || '—'}</span>
                    </td>
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
