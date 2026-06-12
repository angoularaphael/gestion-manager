'use client';

import { useState } from 'react';
import { parseApiJson } from '../../lib/apiJson';
import { contactLabel, extractCountry } from '../../lib/managerCountry';
import { useSingleAction } from '../../lib/useSingleAction';
import ActionButton from './ActionButton';
import ContactFormFields, { readContactFormPayload } from './ContactFormFields';

function categorieLabel(categorie) {
  if (categorie === 'pro') return 'Pro';
  if (categorie === 'amateur') return 'Amateur';
  return categorie || '—';
}

export default function ContactDetailSheet({
  contact,
  apiPath,
  entityLabel,
  showCategorie = false,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const [editing, setEditing] = useState(false);
  const [categorie, setCategorie] = useState(contact?.categorie || 'amateur');
  const { run: runSave, pending: saving } = useSingleAction();
  const { run: runDelete, pending: deleting } = useSingleAction();
  const [error, setError] = useState('');

  if (!contact) return null;

  const pays = extractCountry(contact);

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setError('');

    const payload = readContactFormPayload(e.target, { showCategorie, categorie });

    await runSave(async () => {
      const res = await fetch(`${apiPath}/${contact.id}`, {
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
    const ok = window.confirm(`Supprimer ${entityLabel} « ${contact.nom} » ?`);
    if (!ok) return;

    setError('');
    await runDelete(async () => {
      const res = await fetch(`${apiPath}/${contact.id}`, { method: 'DELETE' });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || 'Erreur');
      onDeleted?.();
      onClose?.();
    }).catch((err) => setError(err.message));
  }

  return (
    <div className="manager-sheet-root" role="presentation">
      <button type="button" className="manager-sheet-backdrop" aria-label="Fermer" onClick={onClose} />
      <div className="manager-sheet" role="dialog" aria-modal="true" aria-labelledby="contact-sheet-title">
        <div className="manager-sheet-handle" aria-hidden="true" />
        <header className="manager-sheet-header">
          <div>
            <h2 id="contact-sheet-title">{contact.nom}</h2>
            <span className="country-pill">{pays}</span>
            {showCategorie && contact.categorie ? (
              <span className={`categorie-pill categorie-pill-${contact.categorie}`}>
                {categorieLabel(contact.categorie)}
              </span>
            ) : null}
          </div>
          <button type="button" className="manager-sheet-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        {editing ? (
          <form className={saving ? 'form-locked' : ''} onSubmit={onSubmit}>
            <ContactFormFields
              idPrefix="edit"
              defaultValues={contact}
              showCategorie={showCategorie}
              categorie={categorie}
              onCategorieChange={setCategorie}
            />
            {error && <p className="error">{error}</p>}
            <div className="contact-sheet-actions">
              <ActionButton type="submit" className="btn" loading={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </ActionButton>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setEditing(false);
                  setError('');
                  setCategorie(contact.categorie || 'amateur');
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <>
            <dl className="manager-sheet-dl">
              {showCategorie ? (
                <>
                  <dt>Catégorie</dt>
                  <dd>{categorieLabel(contact.categorie)}</dd>
                </>
              ) : null}

              <dt>Email</dt>
              <dd>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                ) : (
                  '—'
                )}
              </dd>

              <dt>Téléphone</dt>
              <dd>
                {contact.telephone ? (
                  <a href={`tel:${contact.telephone}`}>{contact.telephone}</a>
                ) : (
                  '—'
                )}
              </dd>

              <dt>Localisation</dt>
              <dd>{contact.localisation || '—'}</dd>

              <dt>Adresse</dt>
              <dd>{contact.adresse || '—'}</dd>

              <dt>Contact</dt>
              <dd>
                <span className="contact-badge">{contactLabel(contact)}</span>
              </dd>

              {contact.url_profil ? (
                <>
                  <dt>Profil</dt>
                  <dd>
                    <a href={contact.url_profil} target="_blank" rel="noopener noreferrer">
                      Voir le profil
                    </a>
                  </dd>
                </>
              ) : null}
            </dl>

            {error && <p className="error">{error}</p>}

            <div className="contact-sheet-actions">
              <button type="button" className="btn" onClick={() => setEditing(true)}>
                Modifier
              </button>
              <ActionButton
                type="button"
                className="btn danger"
                loading={deleting}
                onClick={onDelete}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </ActionButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
