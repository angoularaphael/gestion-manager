'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ActionButton from '../../components/ActionButton';
import EnvoyerBackLink from '../../components/EnvoyerBackLink';
import WhatsAppBulkHint from '../../components/WhatsAppBulkHint';
import { parseApiJson } from '../../../lib/apiJson';
import { clientDisplayName } from '../../../lib/clientDisplay';
import { buildEmailHtml } from '../../../lib/emailTemplate';
import { runDualChannelSend } from '../../../lib/sendPageHelpers';
import { useSingleAction } from '../../../lib/useSingleAction';

export default function EnvoyerClientsPageInner() {
  const searchParams = useSearchParams();
  const preselectId = searchParams.get('client');

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [channels, setChannels] = useState(['email']);
  const [subject, setSubject] = useState('Message Boxing Center');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const { run: runSend, pending: sending } = useSingleAction();

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setClients(data.clients || []);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (preselectId && clients.length) {
      setSelectedIds(new Set([preselectId]));
    }
  }, [preselectId, clients]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const blob = [clientDisplayName(c), c.email, c.telephone, c.salle, c.tag]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [clients, search]);

  const selectedClients = useMemo(
    () => clients.filter((c) => selectedIds.has(c.id)),
    [clients, selectedIds]
  );

  function toggleChannel(ch) {
    setChannels((prev) =>
      prev.includes(ch) ? (prev.length === 1 ? prev : prev.filter((x) => x !== ch)) : [...prev, ch]
    );
  }

  function toggleId(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function send({ testOnly = false } = {}) {
    if (sending || !message.trim() || !channels.length) return;

    if (!testOnly && !selectedIds.size) {
      setResult({ error: 'Sélectionnez au moins un client' });
      return;
    }

    if (!testOnly) {
      const ok = window.confirm(
        `Envoyer à ${selectedIds.size} client(s) ?\n\nLe bouton « Test atangana » envoie uniquement au compte de test.`
      );
      if (!ok) return;
    }

    setResult(null);

    await runSend(async () => {
      const payload = {
        message,
        subject,
        channels,
        test_only: testOnly,
        client_ids: testOnly ? undefined : [...selectedIds],
      };

      const { data, partial, duplicate, failed } = await runDualChannelSend({
        channels,
        payload,
        entityKey: 'clients',
        botPath: '/api/send-to-clients',
        emailPath: '/api/clients/send-email',
        parseApiJson,
      });

      setResult({
        success: true,
        partial,
        duplicate,
        failed,
        data,
        previewHtml: channels.includes('email')
          ? buildEmailHtml({ subject, body: message, recipientName: 'Client' })
          : null,
      });
    }).catch((e) => setResult({ error: e.message }));
  }

  return (
    <div className="send-page">
      <EnvoyerBackLink href="/admin/clients" label="Retour aux clients" />
      <header className="page-header">
        <div>
          <h1>Envoyer aux clients</h1>
          <p className="page-subtitle">Promotions, infos — email et WhatsApp</p>
        </div>
      </header>

      <div className="send-layout">
        <div className="send-main">
          <section className="card send-card">
            <h2 className="section-title">Canaux</h2>
            <div className="channel-pills">
              <button
                type="button"
                className={`channel-pill email ${channels.includes('email') ? 'on' : ''}`}
                onClick={() => toggleChannel('email')}
              >
                Email
              </button>
              <button
                type="button"
                className={`channel-pill wa ${channels.includes('whatsapp') ? 'on' : ''}`}
                onClick={() => toggleChannel('whatsapp')}
              >
                WhatsApp
              </button>
            </div>
            <WhatsAppBulkHint visible={channels.includes('whatsapp')} />
          </section>

          <section className="card send-card">
            <h2 className="section-title">Clients ({selectedIds.size} sélectionné(s))</h2>
            <input
              type="search"
              className="search-input"
              placeholder="Filtrer la liste…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading ? (
              <p className="muted">Chargement…</p>
            ) : (
              <ul className="sidebar-manager-list" style={{ maxHeight: 320, overflow: 'auto' }}>
                {filtered.map((c) => (
                  <li key={c.id} className="sidebar-manager-item">
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleId(c.id)}
                      />
                      <span>
                        <strong>{clientDisplayName(c)}</strong>
                        {c.email ? <small>{c.email}</small> : null}
                        {c.telephone ? <small>{c.telephone}</small> : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card send-card">
            <h2 className="section-title">Message</h2>
            <label>
              Objet email
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="search-input"
              />
            </label>
            <textarea
              className="message-input"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message promotion ou information…"
            />
          </section>

          <div className="send-actions">
            <ActionButton
              className="btn secondary"
              onClick={() => send({ testOnly: true })}
              loading={sending}
              disabled={!message.trim()}
            >
              Test atangana (seul)
            </ActionButton>
            <ActionButton
              className="btn"
              onClick={() => send({ testOnly: false })}
              loading={sending}
              disabled={!message.trim() || !selectedIds.size}
            >
              Envoyer
            </ActionButton>
          </div>

          {result ? (
            <div className={`result-panel ${result.error ? 'error' : 'success'}`}>
              {result.error ? (
                <p>
                  <strong>Erreur :</strong> {result.error}
                </p>
              ) : (
                <>
                  <p>
                    <strong>Envoi terminé</strong> — {result.data.clients} client(s)
                  </p>
                  <div className="result-grid">
                    {channels.includes('email') && (
                      <div className="result-stat">
                        <span className="ok">{result.data.email?.sent ?? 0}</span>
                        <small>emails</small>
                      </div>
                    )}
                    {channels.includes('whatsapp') && (
                      <div className="result-stat">
                        <span className="ok">{result.data.whatsapp?.sent ?? 0}</span>
                        <small>WhatsApp</small>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        <aside className="send-sidebar">
          <section className="send-sidebar-card">
            <h3 className="send-sidebar-title">Sélection</h3>
            {selectedClients.length ? (
              <ul className="sidebar-manager-list">
                {selectedClients.map((c) => (
                  <li key={c.id} className="sidebar-manager-item">
                    <strong>{clientDisplayName(c)}</strong>
                    {c.email ? <small>{c.email}</small> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Cochez des clients dans la liste.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
