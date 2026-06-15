'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ActionButton from '../../components/ActionButton';
import { parseApiJson } from '../../../lib/apiJson';
import { useSingleAction } from '../../../lib/useSingleAction';
import EnvoyerBackLink from '../../components/EnvoyerBackLink';

function SendSidebar({ contacts, audienceSummary, onRemove }) {
  return (
    <aside className="send-sidebar">
      <section className="send-sidebar-card">
        <h3 className="send-sidebar-title">Sélection</h3>
        {contacts.length > 0 ? (
          <ul className="sidebar-manager-list">
            {contacts.map((c) => (
              <li key={c.id} className="sidebar-manager-item">
                <div className="sidebar-manager-info">
                  <strong>{c.nom || c.telephone}</strong>
                  <small>{c.telephone}</small>
                </div>
                {onRemove ? (
                  <button
                    type="button"
                    className="sidebar-manager-remove"
                    onClick={() => onRemove(c.id)}
                    aria-label={`Retirer ${c.nom || c.telephone}`}
                  >
                    ×
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : audienceSummary ? (
          <div className="sidebar-audience-summary">
            <strong>{audienceSummary.count}</strong>
            <span>{audienceSummary.label}</span>
          </div>
        ) : (
          <p className="muted sidebar-empty">Choisissez des contacts dans la liste.</p>
        )}
        {contacts.length > 0 ? (
          <p className="sidebar-count">
            {contacts.length} destinataire{contacts.length > 1 ? 's' : ''}
          </p>
        ) : null}
      </section>
    </aside>
  );
}

export default function EnvoyerGroupeChabanePage() {
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('single');
  const [selectedId, setSelectedId] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState('');
  const [testOnly, setTestOnly] = useState(false);
  const { run: runSend, pending: sending } = useSingleAction();
  const [result, setResult] = useState(null);

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch('/api/groupe-chabane');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setContacts(data.contacts || []);
    } catch (e) {
      setContacts([]);
      setResult({ error: `Liste contacts : ${e.message}` });
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        (c.nom || '').toLowerCase().includes(q) ||
        (c.telephone || '').toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const selectedContacts = useMemo(() => {
    if (mode === 'single' && selectedId) {
      const one = contacts.find((c) => c.id === selectedId);
      return one ? [one] : [];
    }
    if (mode === 'selection' && selectedIds.size) {
      return contacts.filter((c) => selectedIds.has(c.id));
    }
    return [];
  }, [contacts, mode, selectedId, selectedIds]);

  const audienceSummary = useMemo(() => {
    if (testOnly) return { count: 1, label: 'Test (1er contact)' };
    if (mode === 'bulk') return { count: contacts.length, label: 'Tout le Groupe Chabane' };
    return null;
  }, [testOnly, mode, contacts.length]);

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSend() {
    if (!message.trim()) {
      setResult({ error: 'Saisissez un message' });
      return;
    }

    runSend(async () => {
      setResult(null);
      const payload = { message: message.trim(), channels: ['whatsapp'] };
      if (testOnly) {
        payload.test_only = true;
      } else if (mode === 'bulk') {
        payload.broadcast = 'all';
      } else if (mode === 'single') {
        if (!selectedId) {
          setResult({ error: 'Sélectionnez un contact' });
          return;
        }
        payload.contact_ids = [selectedId];
      } else if (mode === 'selection') {
        if (!selectedIds.size) {
          setResult({ error: 'Sélectionnez au moins un contact' });
          return;
        }
        payload.contact_ids = [...selectedIds];
      }

      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/api/send-to-groupe-chabane',
          body: payload,
        }),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || 'Erreur envoi WhatsApp');
      setResult({ success: true, data });
    }).catch((e) => setResult({ error: e.message }));
  }

  return (
    <div className="send-page">
      <EnvoyerBackLink href="/admin/groupe-chabane" label="Retour Groupe Chabane" />
      <header className="page-header">
        <div>
          <h1>Envoyer — Groupe Chabane</h1>
          <p className="page-subtitle">
            {contacts.length} contacts · WhatsApp uniquement
            {filtered.length !== contacts.length ? ` · ${filtered.length} affiché(s)` : ''}
          </p>
        </div>
      </header>

      <div className="mode-tabs">
        <button type="button" className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>
          Un contact
        </button>
        <button type="button" className={mode === 'selection' ? 'active' : ''} onClick={() => setMode('selection')}>
          Sélection
        </button>
        <button type="button" className={mode === 'bulk' ? 'active' : ''} onClick={() => setMode('bulk')}>
          Tout le groupe
        </button>
      </div>

      <div className="send-layout">
        <div className="send-main">
          <section className="card send-card">
            <h2 className="section-title">Message</h2>
            <label className="field-label">
              <span>Texte WhatsApp</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Votre message au Groupe Chabane…"
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={testOnly}
                onChange={(e) => setTestOnly(e.target.checked)}
              />
              <span>Envoi test (1er contact seulement)</span>
            </label>
            <ActionButton className="btn" onClick={handleSend} loading={sending} disabled={!message.trim()}>
              Envoyer WhatsApp
            </ActionButton>
          </section>

          {(mode === 'single' || mode === 'selection') && !testOnly ? (
            <section className="card send-card">
              <h2 className="section-title">Contacts</h2>
              <input
                type="search"
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {loadingContacts ? (
                <p className="muted">Chargement…</p>
              ) : (
                <ul className="send-picker-list">
                  {filtered.map((c) => (
                    <li key={c.id}>
                      {mode === 'single' ? (
                        <label className="send-picker-item">
                          <input
                            type="radio"
                            name="groupe-chabane-contact"
                            checked={selectedId === c.id}
                            onChange={() => setSelectedId(c.id)}
                          />
                          <span>
                            <strong>{c.nom || c.telephone}</strong>
                            <small>{c.telephone}</small>
                          </span>
                        </label>
                      ) : (
                        <label className="send-picker-item">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(c.id)}
                            onChange={() => toggleSelected(c.id)}
                          />
                          <span>
                            <strong>{c.nom || c.telephone}</strong>
                            <small>{c.telephone}</small>
                          </span>
                        </label>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {result?.error ? (
            <section className="card error-card">
              <strong>Erreur</strong>
              <p>{result.error}</p>
            </section>
          ) : null}

          {result?.success ? (
            <section className="card success-card">
              <strong>Envoi terminé</strong>
              <p>
                WhatsApp : {result.data?.whatsapp?.sent ?? 0} envoyé(s),{' '}
                {result.data?.whatsapp?.failed ?? 0} échec(s),{' '}
                {result.data?.whatsapp?.skipped ?? 0} ignoré(s)
              </p>
              {result.data?.errors?.length ? (
                <ul>
                  {result.data.errors.slice(0, 8).map((e, i) => (
                    <li key={i}>
                      {e.contact || '—'} : {e.error}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>

        <SendSidebar
          contacts={testOnly ? [] : selectedContacts}
          audienceSummary={audienceSummary}
          onRemove={
            mode === 'selection'
              ? (id) => toggleSelected(id)
              : mode === 'single' && selectedId
                ? () => setSelectedId('')
                : null
          }
        />
      </div>
    </div>
  );
}
