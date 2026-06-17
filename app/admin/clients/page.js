'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ActionButton from '../../components/ActionButton';
import ClientDetailSheet from '../../components/ClientDetailSheet';
import ListPagination from '../../components/ListPagination';
import { clientDisplayName } from '../../../lib/clientDisplay';
import { parseClientImportFile, dedupeClientFieldsForImport } from '../../../lib/clientCsv';
import { BOXING_CENTER_SALLES, matchClientSalle } from '../../../lib/boxingCenterSalles';
import { parseApiJson } from '../../../lib/apiJson';
import { useSingleAction } from '../../../lib/useSingleAction';

const PAGE_SIZE = 10;
const IMPORT_BATCH_SIZE = 200;

function chunkArray(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const SOURCE_TABS = [
  { id: '', label: 'Tous' },
  { id: 'chatbot', label: 'Chatbot' },
  { id: 'csv', label: 'Import CSV' },
  { id: 'xls', label: 'Membres XLS' },
  { id: 'manual', label: 'Manuel' },
];

const CONTACT_FILTERS = [
  { id: '', label: 'Tous contacts' },
  { id: 'email', label: 'Avec email' },
  { id: 'phone', label: 'Avec téléphone' },
  { id: 'both', label: 'Email + tél.' },
  { id: 'no_email', label: 'Sans email' },
  { id: 'no_phone', label: 'Sans téléphone' },
];

function compareText(a, b, { numeric = false, emptyLast = true } = {}) {
  const av = String(a || '').trim();
  const bv = String(b || '').trim();
  if (!av && !bv) return 0;
  if (!av) return emptyLast ? 1 : -1;
  if (!bv) return emptyLast ? -1 : 1;
  return av.localeCompare(bv, 'fr', { sensitivity: 'base', numeric });
}

function sortClients(rows, sortKey) {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'name_asc':
        return compareText(clientDisplayName(a), clientDisplayName(b));
      case 'email_asc':
        return compareText(a.email, b.email, { numeric: true });
      case 'email_desc':
        return compareText(b.email, a.email, { numeric: true });
      case 'phone_asc':
        return compareText(a.telephone, b.telephone, { numeric: true });
      case 'phone_desc':
        return compareText(b.telephone, a.telephone, { numeric: true });
      case 'recent':
      default:
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });
  return sorted;
}

function nextSortForColumn(column, currentSort) {
  if (column === 'email') {
    if (currentSort === 'email_asc') return 'email_desc';
    return 'email_asc';
  }
  if (column === 'phone') {
    if (currentSort === 'phone_asc') return 'phone_desc';
    return 'phone_asc';
  }
  return currentSort;
}

function sortIndicator(sortKey, column) {
  if (column === 'email') {
    if (sortKey === 'email_asc') return ' ↑';
    if (sortKey === 'email_desc') return ' ↓';
  }
  if (column === 'phone') {
    if (sortKey === 'phone_asc') return ' ↑';
    if (sortKey === 'phone_desc') return ' ↓';
  }
  return '';
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [dbStats, setDbStats] = useState({ total: 0, withEmail: 0, withPhone: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sourceTab, setSourceTab] = useState('');
  const [salle, setSalle] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [sortKey, setSortKey] = useState('recent');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef(null);
  const loadLockRef = useRef(false);
  const { run: runImport, pending: importing } = useSingleAction();

  const loadClients = useCallback(async () => {
    if (loadLockRef.current) return;
    loadLockRef.current = true;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setClients(data.clients || []);
      setDbStats(data.stats || { total: data.clients?.length || 0, withEmail: 0, withPhone: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      loadLockRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    setPage(0);
  }, [search, sourceTab, salle, contactFilter, sortKey]);

  const salles = BOXING_CENTER_SALLES;

  const filtered = useMemo(() => {
    let rows = clients;
    if (sourceTab) rows = rows.filter((c) => c.source === sourceTab);
    if (salle) rows = rows.filter((c) => matchClientSalle(c.salle, salle));
    if (contactFilter === 'email') rows = rows.filter((c) => c.email);
    if (contactFilter === 'phone') rows = rows.filter((c) => c.telephone);
    if (contactFilter === 'both') rows = rows.filter((c) => c.email && c.telephone);
    if (contactFilter === 'no_email') rows = rows.filter((c) => !c.email);
    if (contactFilter === 'no_phone') rows = rows.filter((c) => !c.telephone);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((c) => {
        const blob = [c.prenom, c.nom, c.email, c.telephone, c.salle]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return sortClients(rows, sortKey);
  }, [clients, sourceTab, salle, contactFilter, search, sortKey]);

  const contactStats = useMemo(() => {
    let withEmail = 0;
    let withPhone = 0;
    for (const c of filtered) {
      if (c.email) withEmail++;
      if (c.telephone) withPhone++;
    }
    return { withEmail, withPhone };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage]
  );

  async function handleImport(file) {
    if (!file || importing) return;
    setImportMsg('');
    await runImport(async () => {
      setImportMsg('Lecture du fichier…');
      const text = await file.text();
      setImportMsg('Analyse des lignes…');
      const parsed = parseClientImportFile(text, file.name);
      const { rows: fields, skippedDuplicates: fileDupes } = dedupeClientFieldsForImport(parsed);
      if (!fields.length) throw new Error('Aucune ligne valide après dédoublonnage');

      const batches = chunkArray(fields, IMPORT_BATCH_SIZE);
      const totals = { inserted: 0, updated: 0, skipped: 0, duplicates: fileDupes, errors: 0 };

      for (let i = 0; i < batches.length; i++) {
        setImportMsg(`Import en cours… lot ${i + 1}/${batches.length}`);
        const res = await fetch('/api/clients/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: batches[i] }),
        });
        const data = await parseApiJson(res);
        if (!res.ok) throw new Error(data.error || 'Import échoué');
        totals.inserted += data.inserted || 0;
        totals.updated += data.updated || 0;
        totals.skipped += data.skipped || 0;
        totals.duplicates += data.duplicates || 0;
        totals.errors += data.errors?.length || 0;
      }

      const errNote = totals.errors ? `, ${totals.errors} erreur(s)` : '';
      const dupNote = totals.duplicates ? `, ${totals.duplicates} doublon(s) ignoré(s)` : '';
      setImportMsg(
        `Import terminé : ${totals.inserted} ajouté(s), ${totals.skipped} ignoré(s)${dupNote}${errNote}.`
      );
      await loadClients();
      if (fileRef.current) fileRef.current.value = '';
    }).catch((e) => setImportMsg(e.message));
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (sourceTab) params.set('source', sourceTab);
    if (salle) params.set('salle', salle);
    const qs = params.toString();
    window.location.href = `/api/clients/export${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="managers-page clients-page">
      <header className="page-header managers-page-header">
        <div>
          <h1>Clients</h1>
          <p className="page-subtitle">
            Séances d&apos;essai, chatbot, imports — pagination {PAGE_SIZE} par page
          </p>
        </div>
        <div className="header-actions">
          <Link href="/admin/envoyer-clients" className="btn">
            Envoyer un message
          </Link>
          <button type="button" className="btn secondary" onClick={exportCsv}>
            Exporter CSV
          </button>
          <label className="btn secondary" style={{ cursor: 'pointer' }}>
            {importing ? 'Import…' : 'Importer CSV / XLS'}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xls,text/csv,application/vnd.ms-excel"
              hidden
              onChange={(e) => handleImport(e.target.files?.[0])}
            />
          </label>
          <ActionButton className="btn ghost" onClick={loadClients} loading={loading}>
            Actualiser
          </ActionButton>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span>{dbStats.total}</span>
            <small>Total base</small>
          </div>
          <div className="mini-stat">
            <span>{filtered.length}</span>
            <small>Affichés</small>
          </div>
          <div className="mini-stat">
            <span>{dbStats.withEmail}</span>
            <small>Email (base)</small>
          </div>
          <div className="mini-stat">
            <span>{dbStats.withPhone}</span>
            <small>Tél. (base)</small>
          </div>
          {contactFilter || sourceTab || salle || search.trim() ? (
            <div className="mini-stat">
              <span>{contactStats.withEmail}</span>
              <small>Email filtrés</small>
            </div>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="alert-banner err">
          <strong>Erreur</strong>
          <p>{error}</p>
          <p className="muted">Appliquez la migration Supabase <code>009_portet_clients.sql</code> si la table est absente.</p>
        </div>
      ) : null}

      {importMsg ? <p className="chatbot-reset-msg">{importMsg}</p> : null}

      <div className="filter-bar filter-bar-stack">
        <input
          type="search"
          placeholder="Rechercher nom, email, salle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={salle} onChange={(e) => setSalle(e.target.value)} className="search-input">
          <option value="">Toutes les salles</option>
          {salles.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="search-input">
          <option value="recent">Tri : plus récents</option>
          <option value="name_asc">Tri : nom A→Z</option>
          <option value="email_asc">Tri : email A→Z</option>
          <option value="email_desc">Tri : email Z→A</option>
          <option value="phone_asc">Tri : téléphone A→Z</option>
          <option value="phone_desc">Tri : téléphone Z→A</option>
        </select>
      </div>

      <div className="channel-pills" style={{ marginBottom: '0.75rem' }}>
        {CONTACT_FILTERS.map((tab) => (
          <button
            key={tab.id || 'all-contacts'}
            type="button"
            className={`channel-pill ${contactFilter === tab.id ? 'on' : ''}`}
            onClick={() => setContactFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="channel-pills" style={{ marginBottom: '1rem' }}>
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.id || 'all'}
            type="button"
            className={`channel-pill ${sourceTab === tab.id ? 'on' : ''}`}
            onClick={() => setSourceTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="card">
        {loading ? (
          <p className="muted">Chargement de tous les clients… (quelques secondes si la base est grande)</p>
        ) : !paged.length ? (
          <p className="muted">Aucun client. Importez le CSV ou attendez les leads chatbot.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>
                      <button
                        type="button"
                        className="table-sort-btn"
                        onClick={() => setSortKey((k) => nextSortForColumn('email', k))}
                      >
                        Email{sortIndicator(sortKey, 'email')}
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        className="table-sort-btn"
                        onClick={() => setSortKey((k) => nextSortForColumn('phone', k))}
                      >
                        Téléphone{sortIndicator(sortKey, 'phone')}
                      </button>
                    </th>
                    <th>Salle</th>
                    <th>Source</th>
                    <th>Ajouté</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((client) => (
                    <tr
                      key={client.id}
                      className="clickable-row"
                      onClick={() => setSelected(client)}
                    >
                      <td>{clientDisplayName(client)}</td>
                      <td>{client.email || '—'}</td>
                      <td>{client.telephone || '—'}</td>
                      <td>{client.salle || '—'}</td>
                      <td>
                        <span className={`badge badge--${client.source === 'chatbot' ? 'blue' : ''}`}>
                          {client.source}
                        </span>
                      </td>
                      <td>{formatDate(client.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-bar">
              <ListPagination
                page={safePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </section>

      <ClientDetailSheet
        client={selected}
        onClose={() => setSelected(null)}
        onUpdated={(data) => {
          setClients((prev) => prev.map((c) => (c.id === data.client.id ? data.client : c)));
          setSelected(data.client);
        }}
        onDeleted={() => {
          setClients((prev) => prev.filter((c) => c.id !== selected?.id));
          setSelected(null);
        }}
      />
    </div>
  );
}
