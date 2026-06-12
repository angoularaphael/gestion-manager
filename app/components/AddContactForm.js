'use client';

import { useState } from 'react';
import { parseApiJson } from '../../lib/apiJson';
import { useSingleAction } from '../../lib/useSingleAction';
import ActionButton from './ActionButton';
import ContactFormFields, { readContactFormPayload } from './ContactFormFields';

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
    const payload = readContactFormPayload(e.target, { showCategorie, categorie });

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

      <ContactFormFields
        idPrefix="add"
        showCategorie={showCategorie}
        categorie={categorie}
        onCategorieChange={setCategorie}
      />

      {error && <p className="error">{error}</p>}

      <ActionButton type="submit" className="btn" loading={saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </ActionButton>
    </form>
  );
}
