'use client';

import {
  getJohnsonSuffoTemplate,
  getRegionMeta,
  suggestMessageLanguage,
} from '../../lib/languageRegions';

const LANG_BUTTONS = [
  { id: 'fr', label: 'FR' },
  { id: 'en', label: 'EN' },
  { id: 'es', label: 'ES' },
];

export default function MessageTemplatePicker({
  selectedCountries = [],
  activeRegion = null,
  onInsert,
  templateName = 'Johnson SUFFO',
}) {
  const suggestedLang = activeRegion
    ? getRegionMeta(activeRegion).lang
    : suggestMessageLanguage(selectedCountries);

  return (
    <div className="message-template-picker">
      <div className="message-template-header">
        <strong>Modèle {templateName}</strong>
        <span className="muted">
          Suggestion :{' '}
          <strong>{suggestedLang.toUpperCase()}</strong>
          {activeRegion ? ` (${getRegionMeta(activeRegion).label})` : ''}
        </span>
      </div>
      <div className="message-template-actions">
        {LANG_BUTTONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`btn ghost sm${suggestedLang === id ? ' is-suggested' : ''}`}
            onClick={() => onInsert(getJohnsonSuffoTemplate(id))}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => onInsert(getJohnsonSuffoTemplate(suggestedLang))}
        >
          Insérer suggestion
        </button>
      </div>
    </div>
  );
}
