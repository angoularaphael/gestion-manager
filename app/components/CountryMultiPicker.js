'use client';

import LanguageRegionPicker from './LanguageRegionPicker';
import {
  detectActiveRegion,
  resolveCountriesForRegion,
} from '../../lib/languageRegions';

export default function CountryMultiPicker({
  selected = [],
  onChange,
  countries = [],
  id = 'country-multi',
  label = 'Pays',
  hint = 'Un ou plusieurs pays',
  showLanguageRegions = true,
}) {
  const availableNames = countries.map((c) => c.name);
  const activeRegion = detectActiveRegion(selected, availableNames);

  function toggle(name) {
    if (selected.includes(name)) {
      onChange(selected.filter((c) => c !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  function selectAll() {
    onChange(countries.map((c) => c.name));
  }

  function clearAll() {
    onChange([]);
  }

  function selectRegion(regionId) {
    onChange(resolveCountriesForRegion(availableNames, regionId));
  }

  return (
    <div className="country-multi-picker">
      {showLanguageRegions && countries.length > 0 ? (
        <LanguageRegionPicker
          countries={countries}
          selectedCountries={selected}
          onSelectRegion={selectRegion}
          activeRegion={activeRegion}
        />
      ) : null}
      <div className="country-multi-header">
        <label htmlFor={id}>{label}</label>
        {hint ? <span className="muted country-multi-hint">{hint}</span> : null}
      </div>
      <div className="country-multi-toolbar">
        <button type="button" className="btn ghost sm" onClick={selectAll}>
          Tout sélectionner
        </button>
        <button type="button" className="btn ghost sm" onClick={clearAll}>
          Effacer
        </button>
        {selected.length > 0 ? (
          <span className="country-multi-count">{selected.length} pays</span>
        ) : null}
      </div>
      <div className="country-multi-list" id={id}>
        {countries.length === 0 ? (
          <p className="muted">Aucun pays disponible.</p>
        ) : (
          countries.map(({ name, count }) => (
            <label key={name} className="country-multi-row">
              <input
                type="checkbox"
                checked={selected.includes(name)}
                onChange={() => toggle(name)}
              />
              <span>
                {name} <small>({count})</small>
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
