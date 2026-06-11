'use client';

import { contactLabel, extractCountry } from '../../../lib/managerCountry';

export default function PromoteurDetailSheet({ promoteur, onClose }) {
  if (!promoteur) return null;

  const pays = extractCountry(promoteur);

  return (
    <div className="manager-sheet-root" role="presentation">
      <button type="button" className="manager-sheet-backdrop" aria-label="Fermer" onClick={onClose} />
      <div className="manager-sheet" role="dialog" aria-modal="true" aria-labelledby="manager-sheet-title">
        <div className="manager-sheet-handle" aria-hidden="true" />
        <header className="manager-sheet-header">
          <div>
            <h2 id="manager-sheet-title">{promoteur.nom}</h2>
            <span className="country-pill">{pays}</span>
          </div>
          <button type="button" className="manager-sheet-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <dl className="manager-sheet-dl">
          <dt>Email</dt>
          <dd>
            {promoteur.email ? (
              <a href={`mailto:${promoteur.email}`}>{promoteur.email}</a>
            ) : (
              '—'
            )}
          </dd>

          <dt>Téléphone</dt>
          <dd>
            {promoteur.telephone ? (
              <a href={`tel:${promoteur.telephone}`}>{promoteur.telephone}</a>
            ) : (
              '—'
            )}
          </dd>

          <dt>Localisation</dt>
          <dd>{promoteur.localisation || '—'}</dd>

          <dt>Adresse</dt>
          <dd>{promoteur.adresse || '—'}</dd>

          <dt>Contact</dt>
          <dd>
            <span className="contact-badge">{contactLabel(promoteur)}</span>
          </dd>

          {promoteur.url_profil ? (
            <>
              <dt>Profil</dt>
              <dd>
                <a href={promoteur.url_profil} target="_blank" rel="noopener noreferrer">
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
