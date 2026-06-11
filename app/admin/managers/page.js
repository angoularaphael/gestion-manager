'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  contactLabel,
  extractCountry,
  filterManagers,
  listCountries,
} from '../../../lib/managerCountry';
import ManagerDetailSheet from './ManagerDetailSheet';

const PAGE_SIZE = 10;

export default function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

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

  useEffect(() => {
    setPage(0);
  }, [search, type, country]);

  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.documentElement.classList.add('manager-sheet-open');
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.classList.remove('manager-sheet-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [selected]);

  const countries = useMemo(() => listCountries(managers), [managers]);

  const filtered = useMemo(
    () => filterManagers(managers, { search, type, country }),
    [managers, search, type, country]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const paged = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage]
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
      <header className="page-header managers-page-header">
        <div>
          <h1>Managers</h1>
          <p className="page-subtitle managers-page-subtitle">
            Recherche, filtres par pays et type de contact
          </p>
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

      {/* Mobile : fiches 10 par page */}
      <section className="managers-mobile-list" aria-label="Liste des managers">
        {loading && <p className="muted managers-mobile-empty">Chargement des managers…</p>}
        {!loading && filtered.length === 0 && !error && (
          <p className="muted managers-mobile-empty">Aucun manager ne correspond aux filtres.</p>
        )}
        <ul className="manager-card-list">
          {paged.map((m) => {
            const pays = extractCountry(m);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  className="manager-card"
                  onClick={() => setSelected(m)}
                >
                  <div className="manager-card-main">
                    <strong>{m.nom}</strong>
                    <span className="country-pill sm">{pays}</span>
                  </div>
                  <div className="manager-card-meta">
                    <span className="contact-badge">{contactLabel(m)}</span>
                    {m.email ? <span className="manager-card-hint">{m.email}</span> : null}
                    {!m.email && m.telephone ? (
                      <span className="manager-card-hint">{m.telephone}</span>
                    ) : null}
                  </div>
                  <span className="manager-card-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {!loading && filtered.length > 0 && (
          <div className="manager-pagination">
            <button
              type="button"
              className="btn ghost sm"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Précédent
            </button>
            <span className="manager-pagination-label">
              {safePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="btn ghost sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Suivant
            </button>
          </div>
        )}
      </section>

      {/* Desktop : tableau */}
      <section className="card managers-table-card managers-desktop-table">
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
                    <td className="cell-name">{m.nom}</td>
                    <td>
                      <span className="country-pill">{pays}</span>
                    </td>
                    <td className="cell-muted">{m.email || '—'}</td>
                    <td className="cell-muted">{m.telephone || '—'}</td>
                    <td className="cell-muted">{m.localisation || '—'}</td>
                    <td>
                      <span className="contact-badge">{contactLabel(m)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ManagerDetailSheet manager={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
