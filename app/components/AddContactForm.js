'use client';

import { useState } from 'react';
import { parseApiJson } from '../../lib/apiJson';
import { useSingleAction } from '../../lib/useSingleAction';
import ActionButton from './ActionButton';

export default function AddContactForm({
  apiPath,
  title,
  showCategorie = false,
  onSuccess,
  onCancel,
}) {
  const { run, pending: saving } = useSingleAction();
  const [error, setError] = useState('');
  const [categorie, setCategorie] = useState('amateur');

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;

    setError('');
    const fd = new FormData(e.target);
    const payload = {
      nom: fd.get('nom'),
      email: fd.get('email'),
      telephone: fd.get('telephone'),
      localisation: fd.get('localisation'),
      adresse: fd.get('adresse'),
      url_profil: fd.get('url_profil'),
    };
    if (showCategorie) payload.categorie = categorie;

    await run(async () => {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || 'Erreur');
      e.target.reset();
      setCategorie('amateur');
      onSuccess?.(data);
    }).catch((err) => setError(err.message));
  }

  return (
    <form className={`card add-contact-form ${saving ? 'form-locked' : ''}`} onSubmit={onSubmit}>
      <div className="add-contact-form-header">
        <h2>{title}</h2>
        {onCancel ? (
          <button type="button" className="btn ghost sm" onClick={onCancel}>
            Fermer
          </button>
        ) : null}
      </div>

      <div className="add-contact-form-grid">
        <div className="form-field">
          <label htmlFor="add-nom">Nom *</label>
          <input id="add-nom" name="nom" type="text" required placeholder="Prénom Nom" />
        </div>

        {showCategorie ? (
          <div className="form-field">
            <label htmlFor="add-categorie">Catégorie *</label>
            <select
              id="add-categorie"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
            >
              <option value="amateur">Amateur</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        ) : null}

        <div className="form-field">
          <label htmlFor="add-email">Email</label>
          <input id="add-email" name="email" type="email" placeholder="contact@exemple.fr" />
        </div>

        <div className="form-field">
          <label htmlFor="add-telephone">Téléphone WhatsApp</label>
          <input
            id="add-telephone"
            name="telephone"
            type="tel"
            placeholder="33612345678"
            inputMode="numeric"
          />
          <p className="field-hint">Format international sans + (ex. 33612345678)</p>
        </div>

        <div className="form-field">
          <label htmlFor="add-localisation">Localisation / Pays</label>
          <input id="add-localisation" name="localisation" type="text" placeholder="France, Paris…" />
        </div>

        <div className="form-field">
          <label htmlFor="add-adresse">Adresse / Organisation</label>
          <input id="add-adresse" name="adresse" type="text" placeholder="Club, salle…" />
        </div>

        <div className="form-field add-contact-form-wide">
          <label htmlFor="add-url">URL profil</label>
          <input id="add-url" name="url_profil" type="url" placeholder="https://…" />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <ActionButton type="submit" className="btn" loading={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </ActionButton>
    </form>
  );
}
