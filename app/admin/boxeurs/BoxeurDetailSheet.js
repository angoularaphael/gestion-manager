'use client';

import { contactLabel, extractCountry } from '../../../lib/managerCountry';

function categorieLabel(categorie) {
  if (categorie === 'pro') return 'Pro';
  if (categorie === 'amateur') return 'Amateur';
  return categorie || '—';
}

export default function BoxeurDetailSheet({ boxeur, onClose }) {
  if (!boxeur) return null;

  const pays = extractCountry(boxeur);

  return (
    <div className="manager-sheet-root" role="presentation">
      <button type="button" className="manager-sheet-backdrop" aria-label="Fermer" onClick={onClose} />
      <div className="manager-sheet" role="dialog" aria-modal="true" aria-labelledby="manager-sheet-title">
        <div className="manager-sheet-handle" aria-hidden="true" />
        <header className="manager-sheet-header">
          <div>
            <h2 id="manager-sheet-title">{boxeur.nom}</h2>
            <span className="country-pill">{pays}</span>
            <span className={`categorie-pill categorie-pill-${boxeur.categorie}`}>
              {categorieLabel(boxeur.categorie)}
            </span>
          </div>
          <button type="button" className="manager-sheet-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <dl className="manager-sheet-dl">
          <dt>Catégorie</dt>
          <dd>{categorieLabel(boxeur.categorie)}</dd>

          <dt>Email</dt>
          <dd>
            {boxeur.email ? (
              <a href={`mailto:${boxeur.email}`}>{boxeur.email}</a>
            ) : (
              '—'
            )}
          </dd>

          <dt>Téléphone</dt>
          <dd>
            {boxeur.telephone ? (
              <a href={`tel:${boxeur.telephone}`}>{boxeur.telephone}</a>
            ) : (
              '—'
            )}
          </dd>

          <dt>Localisation</dt>
          <dd>{boxeur.localisation || '—'}</dd>

          <dt>Adresse</dt>
          <dd>{boxeur.adresse || '—'}</dd>

          <dt>Contact</dt>
          <dd>
            <span className="contact-badge">{contactLabel(boxeur)}</span>
          </dd>

          {boxeur.url_profil ? (
            <>
              <dt>Profil</dt>
              <dd>
                <a href={boxeur.url_profil} target="_blank" rel="noopener noreferrer">
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
