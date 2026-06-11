'use client';

import { contactLabel, extractCountry } from '../../../lib/managerCountry';

export default function ManagerDetailSheet({ manager, onClose }) {
  if (!manager) return null;

  const pays = extractCountry(manager);

  return (
    <div className="manager-sheet-root" role="presentation">
      <button type="button" className="manager-sheet-backdrop" aria-label="Fermer" onClick={onClose} />
      <div className="manager-sheet" role="dialog" aria-modal="true" aria-labelledby="manager-sheet-title">
        <div className="manager-sheet-handle" aria-hidden="true" />
        <header className="manager-sheet-header">
          <div>
            <h2 id="manager-sheet-title">{manager.nom}</h2>
            <span className="country-pill">{pays}</span>
          </div>
          <button type="button" className="manager-sheet-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <dl className="manager-sheet-dl">
          <dt>Email</dt>
          <dd>
            {manager.email ? (
              <a href={`mailto:${manager.email}`}>{manager.email}</a>
            ) : (
              '—'
            )}
          </dd>

          <dt>Téléphone</dt>
          <dd>
            {manager.telephone ? (
              <a href={`tel:${manager.telephone}`}>{manager.telephone}</a>
            ) : (
              '—'
            )}
          </dd>

          <dt>Localisation</dt>
          <dd>{manager.localisation || '—'}</dd>

          <dt>Adresse</dt>
          <dd>{manager.adresse || '—'}</dd>

          <dt>Contact</dt>
          <dd>
            <span className="contact-badge">{contactLabel(manager)}</span>
          </dd>

          {manager.url_profil ? (
            <>
              <dt>Profil</dt>
              <dd>
                <a href={manager.url_profil} target="_blank" rel="noopener noreferrer">
                  Voir le profil BoxRec
                </a>
              </dd>
            </>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
