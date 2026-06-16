'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MobileNavIcon from '../../components/MobileNavIcon';
import CountryMultiPicker from '../../components/CountryMultiPicker';
import { filterManagers, listCountries } from '../../../lib/managerCountry';
import { buildCountriesQuery, formatCountriesLabel } from '../../../lib/countryFilter';
import { detectActiveRegion } from '../../../lib/languageRegions';

const ENTITY_TYPES = [
  {
    key: 'managers',
    label: 'Managers',
    sendPath: '/admin/envoyer-managers',
    api: '/api/managers',
    listKey: 'managers',
    icon: 'users',
    tone: 'blue',
  },
  {
    key: 'promoteurs',
    label: 'Promoteurs',
    sendPath: '/admin/envoyer-promoteurs',
    api: '/api/promoteurs',
    listKey: 'promoteurs',
    icon: 'megaphone',
    tone: 'gold',
  },
  {
    key: 'boxeurs',
    label: 'Entraîneurs',
    sendPath: '/admin/envoyer-boxeurs',
    api: '/api/boxeurs',
    listKey: 'boxeurs',
    icon: 'glove',
    tone: 'green',
  },
];

function countWithContact(rows, field) {
  return rows.filter((r) => r[field]).length;
}

export default function EnvoyerHubPage() {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [data, setData] = useState({ managers: [], promoteurs: [], boxeurs: [] });
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        ENTITY_TYPES.map(async (entity) => {
          const res = await fetch(entity.api);
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Erreur');
          return { key: entity.key, rows: json[entity.listKey] || [] };
        })
      );
      const next = { managers: [], promoteurs: [], boxeurs: [] };
      for (const { key, rows } of results) next[key] = rows;
      setData(next);
    } catch {
      setData({ managers: [], promoteurs: [], boxeurs: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const allRows = useMemo(
    () => [...data.managers, ...data.promoteurs, ...data.boxeurs],
    [data]
  );

  const countries = useMemo(() => listCountries(allRows), [allRows]);

  const countriesLabel = formatCountriesLabel(selectedCountries);

  const activeRegion = useMemo(
    () => detectActiveRegion(selectedCountries, countries.map((c) => c.name)),
    [selectedCountries, countries]
  );

  const entityStats = useMemo(() => {
    const query = buildCountriesQuery(selectedCountries, { region: activeRegion || '' });
    return ENTITY_TYPES.map((entity) => {
      const rows = selectedCountries.length
        ? filterManagers(data[entity.key], { countries: selectedCountries })
        : data[entity.key];
      const sendHref = query
        ? `${entity.sendPath}?mode=country&${query}`
        : `${entity.sendPath}?mode=country`;
      return {
        ...entity,
        total: rows.length,
        emails: countWithContact(rows, 'email'),
        phones: countWithContact(rows, 'telephone'),
        sendHref,
      };
    });
  }, [data, selectedCountries, activeRegion]);

  return (
    <div className="envoyer-hub-page">
      <header className="page-header envoyer-hub-header">
        <div>
          <h1>Envoyer par pays</h1>
          <p className="page-subtitle">
            Sélectionnez une zone linguistique ou des pays, puis envoyez le message adapté (reste du monde → anglais).
          </p>
        </div>
      </header>

      <section className="card envoyer-hub-country-card">
        <CountryMultiPicker
          selected={selectedCountries}
          onChange={setSelectedCountries}
          countries={countries}
          id="hub-country-multi"
          label="Pays"
          hint="Cochez un ou plusieurs pays"
        />
        {selectedCountries.length > 0 ? (
          <p className="muted envoyer-hub-country-hint">
            Contacts détectés pour <strong>{countriesLabel}</strong> (email / téléphone selon les fiches).
          </p>
        ) : (
          <p className="muted envoyer-hub-country-hint">
            Choisissez un ou plusieurs pays pour voir les volumes et lancer un envoi ciblé.
          </p>
        )}
      </section>

      <div className="envoyer-hub-grid">
        {entityStats.map((entity) => (
          <Link
            key={entity.key}
            href={entity.sendHref}
            className={`envoyer-hub-card envoyer-hub-card-${entity.tone}`}
          >
            <span className="envoyer-hub-icon" aria-hidden="true">
              <MobileNavIcon name={entity.icon} />
            </span>
            <div className="envoyer-hub-text">
              <strong>{entity.label}</strong>
              <span>
                {loading
                  ? 'Chargement…'
                  : selectedCountries.length
                    ? `${entity.emails} email · ${entity.phones} tél. · ${entity.total} au total`
                    : `${data[entity.key].length} contacts — mode par pays`}
              </span>
            </div>
            <span className="envoyer-hub-chevron" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </div>

      <section className="envoyer-hub-links card">
        <h2 className="section-title">Accès direct</h2>
        <div className="envoyer-hub-quick-links">
          {ENTITY_TYPES.map((entity) => (
            <Link key={entity.key} href={entity.sendPath} className="btn ghost">
              {entity.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
