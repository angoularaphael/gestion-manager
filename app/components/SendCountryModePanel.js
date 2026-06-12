'use client';

export default function SendCountryModePanel({
  entityLabel,
  country,
  onCountryChange,
  countries,
  broadcast,
  onBroadcastChange,
  withEmail,
  withPhone,
  filtered,
}) {
  return (
    <div className="country-send-panel">
      <div className="country-send-panel-intro">
        <strong>Envoi par pays</strong>
        <p className="muted">
          Choisissez un pays, puis email et/ou WhatsApp aux contacts de ce pays uniquement.
        </p>
      </div>

      <div className="filter-field">
        <label htmlFor="country-mode-select">Pays *</label>
        <select
          id="country-mode-select"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="filter-select"
        >
          <option value="">— Choisir un pays —</option>
          {countries.map(({ name, count }) => (
            <option key={name} value={name}>
              {name} ({count} {entityLabel})
            </option>
          ))}
        </select>
      </div>

      {country ? (
        <div className="broadcast-options country-mode-audience">
          <label className={`broadcast-opt ${broadcast === 'email' ? 'active' : ''}`}>
            <input
              type="radio"
              name="country-audience"
              value="email"
              checked={broadcast === 'email'}
              onChange={() => onBroadcastChange('email')}
            />
            <div>
              <strong>Avec email</strong>
              <span>
                {withEmail.length} {entityLabel} · {country}
              </span>
            </div>
          </label>
          <label className={`broadcast-opt ${broadcast === 'phone' ? 'active' : ''}`}>
            <input
              type="radio"
              name="country-audience"
              value="phone"
              checked={broadcast === 'phone'}
              onChange={() => onBroadcastChange('phone')}
            />
            <div>
              <strong>Avec téléphone (WhatsApp)</strong>
              <span>
                {withPhone.length} {entityLabel} · {country}
              </span>
            </div>
          </label>
          <label className={`broadcast-opt ${broadcast === 'all' ? 'active' : ''}`}>
            <input
              type="radio"
              name="country-audience"
              value="all"
              checked={broadcast === 'all'}
              onChange={() => onBroadcastChange('all')}
            />
            <div>
              <strong>Tous les contacts du pays</strong>
              <span>
                {filtered.length} {entityLabel} · {country}
              </span>
            </div>
          </label>
        </div>
      ) : (
        <p className="muted country-send-hint">Sélectionnez un pays pour voir les destinataires.</p>
      )}
    </div>
  );
}
