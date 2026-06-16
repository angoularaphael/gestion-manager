'use client';

export default function ContactFormFields({
  idPrefix = 'contact',
  defaultValues = {},
  showCategorie = false,
  categorie = 'amateur',
  onCategorieChange,
}) {
  return (
    <div className="add-contact-form-grid">
      <div className="form-field">
        <label htmlFor={`${idPrefix}-nom`}>Nom *</label>
        <input
          id={`${idPrefix}-nom`}
          name="nom"
          type="text"
          required
          defaultValue={defaultValues.nom || ''}
          placeholder="Prénom Nom"
        />
      </div>

      {showCategorie ? (
        <div className="form-field">
          <label htmlFor={`${idPrefix}-categorie`}>Profil *</label>
          <select
            id={`${idPrefix}-categorie`}
            name="categorie"
            value={categorie}
            onChange={(e) => onCategorieChange?.(e.target.value)}
          >
            <option value="amateur">Entraîneur</option>
          </select>
        </div>
      ) : null}

      <div className="form-field">
        <label htmlFor={`${idPrefix}-email`}>Email</label>
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          defaultValue={defaultValues.email || ''}
          placeholder="contact@exemple.fr"
        />
      </div>

      <div className="form-field">
        <label htmlFor={`${idPrefix}-telephone`}>Téléphone WhatsApp</label>
        <input
          id={`${idPrefix}-telephone`}
          name="telephone"
          type="tel"
          defaultValue={defaultValues.telephone || ''}
          placeholder="33612345678"
          inputMode="numeric"
        />
        <p className="field-hint">Format international sans + (ex. 33612345678)</p>
      </div>

      <div className="form-field">
        <label htmlFor={`${idPrefix}-localisation`}>Localisation / Pays</label>
        <input
          id={`${idPrefix}-localisation`}
          name="localisation"
          type="text"
          defaultValue={defaultValues.localisation || ''}
          placeholder="France, Paris…"
        />
      </div>

      <div className="form-field">
        <label htmlFor={`${idPrefix}-adresse`}>Adresse / Organisation</label>
        <input
          id={`${idPrefix}-adresse`}
          name="adresse"
          type="text"
          defaultValue={defaultValues.adresse || ''}
          placeholder="Club, salle…"
        />
      </div>

      <div className="form-field add-contact-form-wide">
        <label htmlFor={`${idPrefix}-url`}>URL profil</label>
        <input
          id={`${idPrefix}-url`}
          name="url_profil"
          type="url"
          defaultValue={defaultValues.url_profil || ''}
          placeholder="https://…"
        />
      </div>
    </div>
  );
}

export function readContactFormPayload(form, { showCategorie, categorie }) {
  const fd = new FormData(form);
  const payload = {
    nom: fd.get('nom'),
    email: fd.get('email'),
    telephone: fd.get('telephone'),
    localisation: fd.get('localisation'),
    adresse: fd.get('adresse'),
    url_profil: fd.get('url_profil'),
  };
  if (showCategorie) {
    payload.categorie = categorie || fd.get('categorie');
  }
  return payload;
}
