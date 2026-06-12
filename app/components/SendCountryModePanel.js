'use client';

import CountryMultiPicker from './CountryMultiPicker';
import { formatCountriesLabel } from '../../lib/countryFilter';

export default function SendCountryModePanel({
  entityLabel,
  selectedCountries,
  onCountriesChange,
  countries,
  broadcast,
  onBroadcastChange,
  withEmail,
  withPhone,
  filtered,
}) {
  const label = formatCountriesLabel(selectedCountries);

  return (
    <div className="country-send-panel">
      <div className="country-send-panel-intro">
        <strong>Envoi par pays</strong>
        <p className="muted">
          Sélectionnez un ou plusieurs pays, puis envoyez par email et/ou WhatsApp.
        </p>
      </div>

      <CountryMultiPicker
        selected={selectedCountries}
        onChange={onCountriesChange}
        countries={countries}
        id="country-mode-multi"
        label="Pays *"
        hint="Cochez un ou plusieurs pays"
      />

      {selectedCountries.length > 0 ? (
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
                {withEmail.length} {entityLabel} · {label}
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
                {withPhone.length} {entityLabel} · {label}
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
              <strong>Tous les contacts sélectionnés</strong>
              <span>
                {filtered.length} {entityLabel} · {label}
              </span>
            </div>
          </label>
        </div>
      ) : (
        <p className="muted country-send-hint">Sélectionnez au moins un pays.</p>
      )}
    </div>
  );
}
