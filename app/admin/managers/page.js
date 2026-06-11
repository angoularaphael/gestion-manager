'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  contactLabel,
  extractCountry,
  filterManagers,
  listCountries,
} from '../../../lib/managerCountry';

export default function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [country, setCountry] = useState('');

  const loadManagers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/managers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setManagers(data.managers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const countries = useMemo(() => listCountries(managers), [managers]);

  const filtered = useMemo(
    () => filterManagers(managers, { search, type, country }),
    [managers, search, type, country]
  );

  const stats = useMemo(() => {
    const withEmail = managers.filter((m) => m.email).length;
    const withPhone = managers.filter((m) => m.telephone).length;
    return { total: managers.length, withEmail, withPhone, shown: filtered.length };
  }, [managers, filtered]);

  function resetFilters() {
    setSearch('');
    setType('');
    setCountry('');
  }

  const hasFilters = search || type || country;

  return (
    <div className="managers-page">
      <header className="page-header">
        <div>
          <h1>Managers</h1>
          <p className="page-subtitle">Recherche, filtres par pays et type de contact</p>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span>{stats.total}</span>
            <small>Total</small>
          </div>
          <div className="mini-stat">
            <span>{stats.withEmail}</span>
            <small>Emails</small>
          </div>
          <div className="mini-stat">
            <span>{stats.withPhone}</span>
            <small>Téléphones</small>
          </div>
        </div>
      </header>

      <section className="filter-panel card">
        <div className="filter-grid">
          <div className="filter-field">
            <label htmlFor="mgr-search">Recherche</label>
            <input
              id="mgr-search"
              type="search"
              placeholder="Nom, email, ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <label htmlFor="mgr-country">Pays</label>
            <select
              id="mgr-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Tous les pays</option>
              {countries.map(({ name, count }) => (
                <option key={name} value={name}>
                  {name} ({count})
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="mgr-type">Contact</label>
            <select id="mgr-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tous</option>
              <option value="both">Email + téléphone</option>
              <option value="phone_only">Téléphone seul</option>
              <option value="email_only">Email seul</option>
              <option value="none">Sans contact</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <span className="filter-count">
            {loading ? 'Chargement…' : `${stats.shown} résultat(s)`}
          </span>
          {hasFilters && (
            <button type="button" className="btn ghost btn-sm" onClick={resetFilters}>
              Réinitialiser
            </button>
          )}
          <button type="button" className="btn ghost btn-sm" onClick={loadManagers}>
            Actualiser
          </button>
        </div>
      </section>

      {error && (
        <div className="alert-banner err">
          <div>
            <strong>Impossible de charger les managers</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="btn btn-sm" onClick={loadManagers}>
            Réessayer
          </button>
        </div>
      )}

      <section className="card managers-table-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Pays</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Localisation</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    Chargement des managers…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    Aucun manager ne correspond aux filtres.
                  </td>
                </tr>
              )}
              {filtered.map((m) => {
                const pays = extractCountry(m);
                return (
                  <tr key={m.id}>
                    <td className="cell-name" data-label="Nom">{m.nom}</td>
                    <td data-label="Pays">
                      <span className="country-pill">{pays}</span>
                    </td>
                    <td className="cell-muted" data-label="Email">{m.email || '—'}</td>
                    <td className="cell-muted" data-label="Téléphone">{m.telephone || '—'}</td>
                    <td className="cell-muted" data-label="Localisation">{m.localisation || '—'}</td>
                    <td data-label="Contact">
                      <span className="contact-badge">{contactLabel(m)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
