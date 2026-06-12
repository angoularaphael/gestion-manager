'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ActionButton from '../../components/ActionButton';
import AddContactForm from '../../components/AddContactForm';
import {
  contactLabel,
  extractCountry,
  filterManagers,
  listCountries,
} from '../../../lib/managerCountry';
import BoxeurDetailSheet from './BoxeurDetailSheet';

const PAGE_SIZE = 10;

export default function BoxeursPage() {
  const [boxeurs, setBoxeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [country, setCountry] = useState('');
  const [categorie, setCategorie] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const loadLockRef = useRef(false);

  const loadBoxeurs = useCallback(async () => {
    if (loadLockRef.current) return;
    loadLockRef.current = true;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/boxeurs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setBoxeurs(data.boxeurs || []);
    } catch (e) {
      setError(e.message);
    } finally {
      loadLockRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoxeurs();
  }, [loadBoxeurs]);

  useEffect(() => {
    setPage(0);
  }, [search, type, country, categorie]);

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

  const countries = useMemo(() => listCountries(boxeurs), [boxeurs]);

  const filtered = useMemo(() => {
    let rows = filterManagers(boxeurs, { search, type, country });
    if (categorie) {
      rows = rows.filter((m) => m.categorie === categorie);
    }
    return rows;
  }, [boxeurs, search, type, country, categorie]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const paged = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage]
  );

  const stats = useMemo(() => {
    const withEmail = boxeurs.filter((m) => m.email).length;
    const withPhone = boxeurs.filter((m) => m.telephone).length;
    const amateur = boxeurs.filter((m) => m.categorie === 'amateur').length;
    const pro = boxeurs.filter((m) => m.categorie === 'pro').length;
    return { total: boxeurs.length, withEmail, withPhone, amateur, pro, shown: filtered.length };
  }, [boxeurs, filtered]);

  function resetFilters() {
    setSearch('');
    setType('');
    setCountry('');
    setCategorie('');
  }

  const hasFilters = search || type || country || categorie;

  function categorieLabel(cat) {
    if (cat === 'pro') return 'Pro';
    if (cat === 'amateur') return 'Amateur';
    return cat;
  }

  return (
    <div className="managers-page">
      <header className="page-header managers-page-header">
        <div>
          <h1>Boxeurs</h1>
          <p className="page-subtitle managers-page-subtitle">
            Boxeurs amateur et professionnel — séparés des managers et promoteurs
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className={`btn ${showAdd ? 'secondary' : ''}`}
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? 'Fermer le formulaire' : 'Ajouter un boxeur'}
          </button>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span>{stats.total}</span>
            <small>Total</small>
          </div>
          <div className="mini-stat">
            <span>{stats.amateur}</span>
            <small>Amateur</small>
          </div>
          <div className="mini-stat">
            <span>{stats.pro}</span>
            <small>Pro</small>
          </div>
          <div className="mini-stat">
            <span>{stats.withEmail}</span>
            <small>Emails</small>
          </div>
        </div>
      </header>

      {showAdd && (
        <AddContactForm
          apiPath="/api/boxeurs"
          title="Ajouter un boxeur"
          showCategorie
          onSuccess={() => {
            loadBoxeurs();
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="categorie-tabs">
        <button
          type="button"
          className={categorie === '' ? 'active' : ''}
          onClick={() => setCategorie('')}
        >
          Tous ({stats.total})
        </button>
        <button
          type="button"
          className={categorie === 'amateur' ? 'active' : ''}
          onClick={() => setCategorie('amateur')}
        >
          Amateur ({stats.amateur})
        </button>
        <button
          type="button"
          className={categorie === 'pro' ? 'active' : ''}
          onClick={() => setCategorie('pro')}
        >
          Pro ({stats.pro})
        </button>
      </div>

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
          <ActionButton className="btn ghost btn-sm" onClick={loadBoxeurs} loading={loading}>
            {loading ? 'Actualisation…' : 'Actualiser'}
          </ActionButton>
        </div>
      </section>

      {error && (
        <div className="alert-banner err">
          <div>
            <strong>Impossible de charger les boxeurs</strong>
            <p>{error}</p>
          </div>
          <ActionButton className="btn btn-sm" onClick={loadBoxeurs} loading={loading}>
            {loading ? 'Chargement…' : 'Réessayer'}
          </ActionButton>
        </div>
      )}

      <section className="managers-mobile-list" aria-label="Liste des boxeurs">
        {loading && <p className="muted managers-mobile-empty">Chargement des boxeurs…</p>}
        {!loading && filtered.length === 0 && !error && (
          <p className="muted managers-mobile-empty">Aucun boxeur ne correspond aux filtres.</p>
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
                    <span className={`categorie-pill sm categorie-pill-${m.categorie}`}>
                      {categorieLabel(m.categorie)}
                    </span>
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

        {!loading && filtered.length > 0 && totalPages > 1 && (
          <div className="manager-pagination" role="navigation" aria-label="Pagination">
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
              <small className="manager-pagination-count">
                ({filtered.length})
              </small>
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
        {!loading && filtered.length > 0 && totalPages === 1 && (
          <p className="manager-pagination-single muted">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </p>
        )}
      </section>

      <section className="card managers-table-card managers-desktop-table">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Catégorie</th>
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
                  <td colSpan={7} className="empty-cell">
                    Chargement des boxeurs…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    Aucun boxeur ne correspond aux filtres.
                  </td>
                </tr>
              )}
              {filtered.map((m) => {
                const pays = extractCountry(m);
                return (
                  <tr key={m.id}>
                    <td className="cell-name">{m.nom}</td>
                    <td>
                      <span className={`categorie-pill categorie-pill-${m.categorie}`}>
                        {categorieLabel(m.categorie)}
                      </span>
                    </td>
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

      <BoxeurDetailSheet boxeur={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
