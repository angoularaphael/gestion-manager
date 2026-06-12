'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MobileNavIcon from '../../components/MobileNavIcon';
import { filterManagers, listCountries } from '../../../lib/managerCountry';

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
    label: 'Boxeurs',
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
  const [country, setCountry] = useState('');
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

  const entityStats = useMemo(() => {
    return ENTITY_TYPES.map((entity) => {
      const rows = country
        ? filterManagers(data[entity.key], { country })
        : data[entity.key];
      return {
        ...entity,
        total: rows.length,
        emails: countWithContact(rows, 'email'),
        phones: countWithContact(rows, 'telephone'),
        sendHref: country
          ? `${entity.sendPath}?mode=country&country=${encodeURIComponent(country)}`
          : `${entity.sendPath}?mode=country`,
      };
    });
  }, [data, country]);

  return (
    <div className="envoyer-hub-page">
      <header className="page-header envoyer-hub-header">
        <div>
          <h1>Envoyer par pays</h1>
          <p className="page-subtitle">
            Sélectionnez un pays, puis envoyez un email et/ou WhatsApp aux managers, promoteurs ou boxeurs de ce pays.
          </p>
        </div>
      </header>

      <section className="card envoyer-hub-country-card">
        <div className="filter-field">
          <label htmlFor="hub-country">Pays</label>
          <select
            id="hub-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="filter-select"
            disabled={loading}
          >
            <option value="">— Choisir un pays —</option>
            {countries.map(({ name, count }) => (
              <option key={name} value={name}>
                {name} ({count} contact{count > 1 ? 's' : ''})
              </option>
            ))}
          </select>
        </div>
        {country ? (
          <p className="muted envoyer-hub-country-hint">
            Contacts détectés pour <strong>{country}</strong> (email / téléphone selon les fiches).
          </p>
        ) : (
          <p className="muted envoyer-hub-country-hint">
            Choisissez un pays pour voir les volumes et lancer un envoi ciblé.
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
                  : country
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
