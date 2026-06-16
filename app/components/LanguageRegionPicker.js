'use client';

import {
  LANGUAGE_REGIONS,
  countContactsForRegion,
  detectActiveRegion,
  getRegionMeta,
} from '../../lib/languageRegions';

export default function LanguageRegionPicker({
  countries = [],
  selectedCountries = [],
  onSelectRegion,
  activeRegion = null,
}) {
  const availableNames = countries.map((c) => c.name);

  function handleRegion(regionId) {
    onSelectRegion(regionId);
  }

  const detected =
    activeRegion || detectActiveRegion(selectedCountries, availableNames);

  return (
    <div className="language-region-picker">
      <div className="language-region-header">
        <strong>Zones linguistiques</strong>
        <span className="muted">Le reste du monde reçoit l&apos;anglais par défaut</span>
      </div>
      <div className="language-region-grid">
        {LANGUAGE_REGIONS.map((region) => {
          const count = countContactsForRegion(availableNames, region.id);
          const isActive = detected === region.id;
          return (
            <button
              key={region.id}
              type="button"
              className={`language-region-card${isActive ? ' active' : ''}${count === 0 ? ' is-empty' : ''}`}
              onClick={() => handleRegion(region.id)}
              disabled={count === 0}
              title={region.description}
            >
              <span className="language-region-label">{region.label}</span>
              <span className="language-region-lang">{region.langLabel}</span>
              <span className="language-region-count">
                {count} pays{count > 1 ? '' : ''}
              </span>
            </button>
          );
        })}
      </div>
      {detected ? (
        <p className="language-region-hint muted">
          Zone active : <strong>{getRegionMeta(detected).label}</strong> —{' '}
          {getRegionMeta(detected).langLabel}
        </p>
      ) : selectedCountries.length > 0 ? (
        <p className="language-region-hint muted">
          Sélection manuelle — vérifiez la langue du message (reste du monde → anglais).
        </p>
      ) : null}
    </div>
  );
}
