'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ActionButton from '../../components/ActionButton';
import { parseApiJson } from '../../../lib/apiJson';
import { formatClientPhone } from '../../../lib/clientDisplay';
import { useSingleAction } from '../../../lib/useSingleAction';

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR');
  } catch {
    return iso;
  }
}

export default function CampagneWaEnvoyesPage() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const { run: runReset, pending: resetting } = useSingleAction();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/campaign/whatsapp?view=sent&page=${page}&limit=50&status=all`,
        { cache: 'no-store' }
      );
      const json = await parseApiJson(res);
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  async function handleReset() {
    if (
      !window.confirm(
        'Réinitialiser tous les envois WhatsApp campagne offre été ?\n\nLes compteurs envoyés/lus repartiront de zéro.'
      )
    ) {
      return;
    }
    await runReset(async () => {
      const res = await fetch('/api/campaign/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const json = await parseApiJson(res);
      if (!res.ok) throw new Error(json.error);
      setPage(1);
      await load();
    }).catch((e) => setError(e.message));
  }

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 50)));

  return (
    <div className="wa-page campaign-wa-page">
      <header className="page-header">
        <div>
          <h1>WhatsApp campagne — déjà envoyés</h1>
          <p className="page-subtitle">
            Historique des contacts ayant reçu l&apos;offre été 2026 ·{' '}
            <Link href="/admin/campagne-whatsapp">retour campagne</Link>
          </p>
        </div>
        <div className="wa-actions">
          <ActionButton className="btn secondary" onClick={load} loading={loading}>
            Actualiser
          </ActionButton>
          <ActionButton className="btn danger" onClick={handleReset} loading={resetting}>
            Réinitialiser envois WA
          </ActionButton>
        </div>
      </header>

      <div className="card stat-card" style={{ marginBottom: '1rem', display: 'inline-block' }}>
        <span className="stat-label">Total enregistré</span>
        <strong>{data.total ?? 0}</strong>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading && !data.items?.length ? (
        <p className="muted">Chargement…</p>
      ) : !data.items?.length ? (
        <p className="muted">Aucun envoi enregistré pour l&apos;instant.</p>
      ) : (
        <div className="card campaign-sent-table-wrap">
          <table className="campaign-sent-table">
            <thead>
              <tr>
                <th>Envoyé à</th>
                <th>Téléphone</th>
                <th>Salle</th>
                <th>Bot</th>
                <th>Statut</th>
                <th>Date envoi</th>
                <th>Lu</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{formatClientPhone(row.phone)}</td>
                  <td>{row.salle || '—'}</td>
                  <td>{row.bot}</td>
                  <td>
                    <span
                      className={`badge ${
                        row.status === 'sent'
                          ? 'badge-compta-ok'
                          : row.status === 'failed'
                            ? 'badge-compta-warn'
                            : ''
                      }`}
                    >
                      {row.status === 'sent' ? 'Envoyé' : row.status === 'pending' ? 'En cours' : 'Échec'}
                    </span>
                  </td>
                  <td>{formatWhen(row.sentAt)}</td>
                  <td>{row.readAt ? `Lu · ${formatWhen(row.readAt)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="wa-actions" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </button>
          <span className="muted">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </button>
        </div>
      ) : null}
    </div>
  );
}
