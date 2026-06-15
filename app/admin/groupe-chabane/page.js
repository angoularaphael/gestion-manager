'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ActionButton from '../../components/ActionButton';

const PAGE_SIZE = 20;

export default function GroupeChabanePage() {
  const [contacts, setContacts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/groupe-chabane');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setContacts(data.contacts || []);
      setMeta({
        groupe: data.groupe,
        source: data.source,
        contact_count: data.contact_count,
      });
    } catch (e) {
      setError(e.message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        (c.nom || '').toLowerCase().includes(q) ||
        (c.telephone || '').toLowerCase().includes(q) ||
        (c.id || '').includes(q.replace(/\D/g, ''))
    );
  }, [contacts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="managers-page">
      <header className="page-header">
        <div>
          <h1>Groupe Chabane</h1>
          <p className="page-subtitle">
            {meta?.contact_count ?? contacts.length} contacts importés
            {meta?.source ? ` · ${meta.source}` : ''}
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/admin/envoyer-groupe-chabane" className="btn btn-sm">
            Envoyer WhatsApp
          </Link>
          <ActionButton className="btn ghost btn-sm" onClick={loadContacts} loading={loading}>
            Actualiser
          </ActionButton>
        </div>
      </header>

      <div className="filter-bar filter-bar-stack">
        <input
          type="search"
          placeholder="Rechercher un nom ou numéro…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error ? (
        <section className="card error-card">
          <strong>Impossible de charger les contacts</strong>
          <p>{error}</p>
          <ActionButton className="btn btn-sm" onClick={loadContacts} loading={loading}>
            Réessayer
          </ActionButton>
        </section>
      ) : null}

      <section className="card managers-table-card desktop-only">
        <table className="managers-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nom</th>
              <th>Téléphone</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="muted">
                  Chargement…
                </td>
              </tr>
            ) : pageRows.length ? (
              pageRows.map((c, i) => (
                <tr key={c.id}>
                  <td>{page * PAGE_SIZE + i + 1}</td>
                  <td>{c.nom || '—'}</td>
                  <td>{c.telephone}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="muted">
                  Aucun contact ne correspond à la recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="managers-mobile-list" aria-label="Liste Groupe Chabane">
        {loading && <p className="muted managers-mobile-empty">Chargement des contacts…</p>}
        {!loading && !pageRows.length ? (
          <p className="muted managers-mobile-empty">Aucun contact ne correspond à la recherche.</p>
        ) : null}
        {pageRows.map((c, i) => (
          <article key={c.id} className="manager-mobile-card">
            <div className="manager-mobile-card-head">
              <strong>{c.nom || `Contact ${page * PAGE_SIZE + i + 1}`}</strong>
            </div>
            <p className="manager-mobile-meta">{c.telephone}</p>
          </article>
        ))}
      </section>

      {filtered.length > PAGE_SIZE ? (
        <div className="pagination-bar">
          <button
            type="button"
            className="btn ghost btn-sm"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Précédent
          </button>
          <span className="muted">
            Page {page + 1} / {totalPages} · {filtered.length} contact{filtered.length > 1 ? 's' : ''}
          </span>
          <button
            type="button"
            className="btn ghost btn-sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Suivant
          </button>
        </div>
      ) : null}
    </div>
  );
}
