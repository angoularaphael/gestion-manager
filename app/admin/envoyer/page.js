'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildEmailHtml } from '../../../lib/emailTemplate';

export default function EnvoyerPage() {
  const [mode, setMode] = useState('single');
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [broadcast, setBroadcast] = useState('email');
  const [subject, setSubject] = useState('Message Boxing Center');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState(['email']);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const loadManagers = useCallback(async () => {
    setLoadingManagers(true);
    try {
      const res = await fetch('/api/bot?path=' + encodeURIComponent('/api/managers'));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setManagers(data.managers || []);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoadingManagers(false);
    }
  }, []);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return managers;
    return managers.filter(
      (m) =>
        m.nom?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.localisation?.toLowerCase().includes(q)
    );
  }, [managers, search]);

  const withEmail = useMemo(() => managers.filter((m) => m.email), [managers]);
  const withPhone = useMemo(() => managers.filter((m) => m.telephone), [managers]);

  const selectedManager = managers.find((m) => m.id === selectedId);
  const previewHtml = buildEmailHtml({
    subject,
    body: message || 'Votre message apparaîtra ici…',
    recipientName: selectedManager?.nom || 'Manager',
  });

  const recipientCount = useMemo(() => {
    if (mode === 'single') return selectedManager ? 1 : 0;
    if (broadcast === 'email') return withEmail.length;
    if (broadcast === 'phone') return withPhone.length;
    if (broadcast === 'all') return managers.length;
    return selectedIds.size;
  }, [mode, broadcast, withEmail, withPhone, managers, selectedIds, selectedManager]);

  function toggleChannel(ch) {
    setChannels((prev) => {
      const next = prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch];
      return next.length ? next : prev;
    });
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    const eligible = filtered.filter((m) => {
      if (channels.includes('email') && channels.includes('whatsapp')) return m.email || m.telephone;
      if (channels.includes('email')) return m.email;
      if (channels.includes('whatsapp')) return m.telephone;
      return true;
    });
    setSelectedIds(new Set(eligible.map((m) => m.id)));
  }

  async function send({ testOnly = false } = {}) {
    if (!message.trim()) return;
    if (!channels.length) return;

    setLoading(true);
    setResult(null);

    const payload = {
      message,
      subject,
      channels,
      test_only: testOnly,
    };

    if (channels.includes('email') && (testOnly || mode === 'single')) {
      payload.html = buildEmailHtml({
        subject,
        body: message,
        recipientName: testOnly ? 'Atangana' : selectedManager?.nom || '',
      });
    }

    if (testOnly) {
      // test only
    } else if (mode === 'single') {
      if (!selectedId) {
        setResult({ error: 'Sélectionnez un manager' });
        setLoading(false);
        return;
      }
      payload.manager_ids = [selectedId];
    } else if (broadcast === 'selection') {
      if (!selectedIds.size) {
        setResult({ error: 'Sélectionnez au moins un manager' });
        setLoading(false);
        return;
      }
      payload.manager_ids = [...selectedIds];
    } else {
      payload.broadcast = broadcast;
    }

    try {
      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/api/send-to-managers', body: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur envoi');
      setResult({ success: true, data });
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="send-page">
      <header className="page-header">
        <div>
          <h1>Envoyer un message</h1>
          <p className="page-subtitle">Email Brevo et WhatsApp — un manager ou en diffusion</p>
        </div>
        <div className="header-stats">
          <div className="mini-stat">
            <span>{withEmail.length}</span>
            <small>avec email</small>
          </div>
          <div className="mini-stat">
            <span>{withPhone.length}</span>
            <small>avec tél.</small>
          </div>
        </div>
      </header>

      <div className="mode-tabs">
        <button type="button" className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>
          Un seul manager
        </button>
        <button type="button" className={mode === 'bulk' ? 'active' : ''} onClick={() => setMode('bulk')}>
          Diffusion
        </button>
      </div>

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
                <span className="pill-icon">✉️</span>
                Email Brevo
              </button>
              <button
                type="button"
                className={`channel-pill wa ${channels.includes('whatsapp') ? 'on' : ''}`}
                onClick={() => toggleChannel('whatsapp')}
              >
                <span className="pill-icon">💬</span>
                WhatsApp
              </button>
            </div>
          </section>

          <section className="card send-card">
            <h2 className="section-title">
              {mode === 'single' ? 'Destinataire' : 'Audience'}
            </h2>

            {mode === 'single' ? (
              <>
                <input
                  type="search"
                  placeholder="Rechercher un manager…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
                <div className="manager-picker">
                  {loadingManagers ? (
                    <p className="muted">Chargement…</p>
                  ) : (
                    filtered.slice(0, 80).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`manager-option ${selectedId === m.id ? 'selected' : ''}`}
                        onClick={() => setSelectedId(m.id)}
                      >
                        <span className="manager-name">{m.nom}</span>
                        <span className="manager-meta">
                          {m.email && <span className="tag email-tag">✉ {m.email}</span>}
                          {m.telephone && <span className="tag phone-tag">📱 {m.telephone}</span>}
                          {!m.email && !m.telephone && <span className="tag muted-tag">Sans contact</span>}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="broadcast-options">
                  <label className={`broadcast-opt ${broadcast === 'email' ? 'active' : ''}`}>
                    <input type="radio" name="broadcast" value="email" checked={broadcast === 'email'} onChange={() => setBroadcast('email')} />
                    <div>
                      <strong>Tous avec email</strong>
                      <span>{withEmail.length} managers</span>
                    </div>
                  </label>
                  <label className={`broadcast-opt ${broadcast === 'phone' ? 'active' : ''}`}>
                    <input type="radio" name="broadcast" value="phone" checked={broadcast === 'phone'} onChange={() => setBroadcast('phone')} />
                    <div>
                      <strong>Tous avec téléphone</strong>
                      <span>{withPhone.length} managers</span>
                    </div>
                  </label>
                  <label className={`broadcast-opt ${broadcast === 'all' ? 'active' : ''}`}>
                    <input type="radio" name="broadcast" value="all" checked={broadcast === 'all'} onChange={() => setBroadcast('all')} />
                    <div>
                      <strong>Tous les managers</strong>
                      <span>{managers.length} managers</span>
                    </div>
                  </label>
                  <label className={`broadcast-opt ${broadcast === 'selection' ? 'active' : ''}`}>
                    <input type="radio" name="broadcast" value="selection" checked={broadcast === 'selection'} onChange={() => setBroadcast('selection')} />
                    <div>
                      <strong>Sélection manuelle</strong>
                      <span>{selectedIds.size} sélectionné(s)</span>
                    </div>
                  </label>
                </div>

                {broadcast === 'selection' && (
                  <div className="selection-panel">
                    <div className="selection-toolbar">
                      <input
                        type="search"
                        placeholder="Filtrer la liste…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                      />
                      <button type="button" className="btn ghost" onClick={selectAllFiltered}>
                        Tout sélectionner
                      </button>
                      <button type="button" className="btn ghost" onClick={() => setSelectedIds(new Set())}>
                        Effacer
                      </button>
                    </div>
                    <div className="checkbox-list">
                      {filtered.map((m) => (
                        <label key={m.id} className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(m.id)}
                            onChange={() => toggleSelect(m.id)}
                          />
                          <span className="checkbox-label">
                            <strong>{m.nom}</strong>
                            <small>{m.email || m.telephone || '—'}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="card send-card">
            <h2 className="section-title">Message</h2>
            {channels.includes('email') && (
              <div className="field">
                <label htmlFor="subject">Sujet de l&apos;email</label>
                <input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Objet du message…"
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="message">Contenu</label>
              <textarea
                id="message"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Rédigez votre message aux managers…"
              />
            </div>
            {channels.includes('email') && (
              <button type="button" className="btn ghost" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? 'Masquer l\'aperçu email' : 'Aperçu email Brevo'}
              </button>
            )}
          </section>

          <div className="send-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => send({ testOnly: true })}
              disabled={loading || !message.trim()}
            >
              {loading ? 'Envoi…' : 'Test (atangana)'}
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => send({ testOnly: false })}
              disabled={loading || !message.trim() || recipientCount === 0}
            >
              {loading ? 'Envoi en cours…' : `Envoyer${recipientCount ? ` (${recipientCount})` : ''}`}
            </button>
          </div>

          {result && (
            <div className={`result-panel ${result.error ? 'error' : 'success'}`}>
              {result.error ? (
                <p><strong>Erreur :</strong> {result.error}</p>
              ) : (
                <>
                  <p><strong>Envoi terminé</strong> — {result.data.managers} manager(s) traité(s)</p>
                  {result.data.destinations?.length > 0 && (
                    <ul className="dest-list">
                      {result.data.destinations.map((d, i) => (
                        <li key={i}>
                          {d.channel === 'email' ? '✉️' : '💬'}{' '}
                          <strong>{d.to}</strong>
                          {d.manager ? ` (${d.manager})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Test atangana → linuxcam05@gmail.com + copie sur l&apos;email de réception du bot.
                    Vérifiez aussi les <strong>spams</strong>.
                  </p>
                  <div className="result-grid">
                    {channels.includes('email') && (
                      <div className="result-stat">
                        <span className="ok">{result.data.email?.sent ?? 0}</span>
                        <small>emails envoyés</small>
                        {(result.data.email?.failed > 0 || result.data.email?.skipped > 0) && (
                          <span className="result-detail">
                            {result.data.email?.failed} échec(s), {result.data.email?.skipped} ignoré(s)
                          </span>
                        )}
                      </div>
                    )}
                    {channels.includes('whatsapp') && (
                      <div className="result-stat">
                        <span className="ok">{result.data.whatsapp?.sent ?? 0}</span>
                        <small>WhatsApp envoyés</small>
                        {(result.data.whatsapp?.failed > 0 || result.data.whatsapp?.skipped > 0) && (
                          <span className="result-detail">
                            {result.data.whatsapp?.failed} échec(s), {result.data.whatsapp?.skipped} ignoré(s)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {result.data.errors?.length > 0 && (
                    <details className="error-details">
                      <summary>{result.data.errors.length} erreur(s)</summary>
                      <ul>
                        {result.data.errors.map((e, i) => (
                          <li key={i}>{e.manager} ({e.channel}) : {e.error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {(showPreview || mode === 'single') && channels.includes('email') && (
          <aside className="send-preview">
            <div className="preview-header">
              <h3>Aperçu email</h3>
              <span className="badge">Brevo</span>
            </div>
            <div className="preview-frame">
              <iframe title="Aperçu email" srcDoc={previewHtml} sandbox="" />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
