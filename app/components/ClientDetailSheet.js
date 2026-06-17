'use client';

import { useState } from 'react';
import Link from 'next/link';
import { parseApiJson } from '../../lib/apiJson';
import { clientDisplayName } from '../../lib/clientDisplay';
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
                  <input name="telephone" defaultValue={client.telephone || ''} />
                </label>
                <label>
                  Salle
                  <input name="salle" defaultValue={client.salle || ''} />
                </label>
                <label>
                  Ville
                  <input name="ville" defaultValue={client.ville || ''} />
                </label>
                <label>
                  Tag
                  <input name="tag" defaultValue={client.tag || ''} />
                </label>
                <label>
                  Métier / intérêt
                  <input name="metier" defaultValue={client.metier || ''} />
                </label>
                <label>
                  Message chatbot
                  <textarea name="message" rows={3} defaultValue={client.message || ''} />
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
                  <dt>Email</dt>
                  <dd>{client.email || '—'}</dd>
                  <dt>Téléphone</dt>
                  <dd>{client.telephone || '—'}</dd>
                  <dt>Salle</dt>
                  <dd>{client.salle || '—'}</dd>
                  <dt>Tag</dt>
                  <dd>{client.tag || '—'}</dd>
                  <dt>Ville</dt>
                  <dd>{client.ville || '—'}</dd>
                  <dt>Métier / intérêt</dt>
                  <dd>{client.metier || '—'}</dd>
                  <dt>Message</dt>
                  <dd>{client.message || '—'}</dd>
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
            <p className="muted">
              Envoyer une promotion ou une info à ce client par email ou WhatsApp.
            </p>
            <Link
              href={`/admin/envoyer-clients?client=${client.id}`}
              className="btn"
              onClick={onClose}
            >
              Ouvrir l&apos;envoi pour {clientDisplayName(client)}
            </Link>
            {!client.email && !client.telephone ? (
              <p className="form-error">Ce client n&apos;a ni email ni téléphone.</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
