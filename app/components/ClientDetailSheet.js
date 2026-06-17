'use client';

import { useState } from 'react';
import Link from 'next/link';
import { parseApiJson } from '../../lib/apiJson';
import { clientDisplayName, formatClientPhone } from '../../lib/clientDisplay';
import { BOXING_CENTER_SALLES } from '../../lib/boxingCenterSalles';
import { useSingleAction } from '../../lib/useSingleAction';
import ActionButton from './ActionButton';

export default function ClientDetailSheet({ client, onClose, onUpdated, onDeleted }) {
  const [tab, setTab] = useState('profil');
  const [editing, setEditing] = useState(false);
  const { run: runSave, pending: saving } = useSingleAction();
  const { run: runDelete, pending: deleting } = useSingleAction();
  const [error, setError] = useState('');

  if (!client) return null;

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setError('');
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());

    await runSave(async () => {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setEditing(false);
      onUpdated?.(data);
    }).catch((err) => setError(err.message));
  }

  async function onDelete() {
    if (deleting) return;
    if (!window.confirm(`Supprimer le client « ${clientDisplayName(client)} » ?`)) return;
    setError('');
    await runDelete(async () => {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || 'Erreur');
      onDeleted?.();
      onClose?.();
    }).catch((err) => setError(err.message));
  }

  return (
    <div className="manager-sheet-root" role="presentation">
      <button type="button" className="manager-sheet-backdrop" aria-label="Fermer" onClick={onClose} />
      <div className="manager-sheet" role="dialog" aria-modal="true">
        <header className="manager-sheet-header">
          <div>
            <h2>{clientDisplayName(client)}</h2>
            <span className="badge">{client.source}</span>
            {client.salle ? <span className="country-pill">{client.salle}</span> : null}
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            Fermer
          </button>
        </header>

        <div className="channel-pills" style={{ padding: '0 1rem 1rem' }}>
          <button
            type="button"
            className={`channel-pill ${tab === 'profil' ? 'on' : ''}`}
            onClick={() => setTab('profil')}
          >
            Profil
          </button>
          <button
            type="button"
            className={`channel-pill ${tab === 'message' ? 'on' : ''}`}
            onClick={() => setTab('message')}
          >
            Message
          </button>
        </div>

        {tab === 'profil' ? (
          <div className="manager-sheet-body">
            {error ? <p className="form-error">{error}</p> : null}
            {editing ? (
              <form onSubmit={onSubmit} className="contact-form">
                <label>
                  Prénom
                  <input name="prenom" defaultValue={client.prenom || ''} />
                </label>
                <label>
                  Nom
                  <input name="nom" defaultValue={client.nom || ''} />
                </label>
                <label>
                  Email
                  <input name="email" type="email" defaultValue={client.email || ''} />
                </label>
                <label>
                  Téléphone
                  <input name="telephone" defaultValue={formatClientPhone(client.telephone) || ''} />
                </label>
                <label>
                  Salle
                  <select name="salle" defaultValue={client.salle || ''} className="search-input">
                    <option value="">—</option>
                    {BOXING_CENTER_SALLES.map((s) => (
                      <option key={s.id} value={s.label}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-actions">
                  <ActionButton type="submit" className="btn" loading={saving}>
                    Enregistrer
                  </ActionButton>
                  <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <>
                <dl className="detail-dl">
                  <dt>Prénom</dt>
                  <dd>{client.prenom || '—'}</dd>
                  <dt>Nom</dt>
                  <dd>{client.nom || '—'}</dd>
                  <dt>Email</dt>
                  <dd>{client.email || '—'}</dd>
                  <dt>Téléphone</dt>
                  <dd>{formatClientPhone(client.telephone) || '—'}</dd>
                  <dt>Salle</dt>
                  <dd>{client.salle || '—'}</dd>
                </dl>
                <div className="form-actions">
                  <button type="button" className="btn secondary" onClick={() => setEditing(true)}>
                    Modifier
                  </button>
                  <ActionButton type="button" className="btn danger" loading={deleting} onClick={onDelete}>
                    Supprimer
                  </ActionButton>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="manager-sheet-body">
            <p className="muted">Envoyer une promotion ou une info à ce client.</p>
            <Link
              href={`/admin/envoyer-clients?client=${client.id}`}
              className="btn"
              onClick={onClose}
            >
              Ouvrir l&apos;envoi pour {clientDisplayName(client)}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
