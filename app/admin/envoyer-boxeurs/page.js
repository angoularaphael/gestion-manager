'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ActionButton from '../../components/ActionButton';
import { parseClientJson } from '../../../lib/bot';
import { parseApiJson } from '../../../lib/apiJson';
import { useSingleAction } from '../../../lib/useSingleAction';
import { buildEmailHtml } from '../../../lib/emailTemplate';
import { extractCountry, filterManagers, listCountries } from '../../../lib/managerCountry';
import { formatCountriesLabel } from '../../../lib/countryFilter';
import { idsForCountrySend, mergeSendResults, emptySendResult } from '../../../lib/sendPageHelpers';
import EnvoyerBackLink from '../../components/EnvoyerBackLink';
import SendCountryModePanel from '../../components/SendCountryModePanel';
import CountryMultiPicker from '../../components/CountryMultiPicker';
import { useCountryFromUrl } from '../../components/useCountryFromUrl';

function categorieLabel(cat) {
  if (cat === 'pro') return 'Pro';
  if (cat === 'amateur') return 'Amateur';
  return cat;
}

function BoxeurFilterBar({
  search,
  onSearchChange,
  selectedCountries,
  onCountriesChange,
  categorie,
  onCategorieChange,
  countries,
  showCountry = true,
  showCategorie = true,
}) {
  return (
    <div className="filter-bar filter-bar-stack">
      <input
        type="search"
        placeholder="Rechercher un nom, email, ville…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
      {showCategorie && (
        <select
          value={categorie}
          onChange={(e) => onCategorieChange(e.target.value)}
          className="filter-select"
          aria-label="Filtrer par catégorie"
        >
          <option value="">Tous (amateur + pro)</option>
          <option value="amateur">Amateur</option>
          <option value="pro">Pro</option>
        </select>
      )}
      {showCountry && (
        <CountryMultiPicker
          selected={selectedCountries}
          onChange={onCountriesChange}
          countries={countries}
          id="boxeur-filter-countries"
          label="Pays"
          hint="Filtrer par un ou plusieurs pays"
        />
      )}
    </div>
  );
}

function SendSidebar({ mode, broadcast, boxeurs, audienceSummary, previewHtml, showEmailPreview, onRemove }) {
  return (
    <aside className="send-sidebar">
      <section className="send-sidebar-card">
        <h3 className="send-sidebar-title">Sélection</h3>
        {boxeurs.length > 0 ? (
          <ul className="sidebar-manager-list">
            {boxeurs.map((m) => (
              <li key={m.id} className="sidebar-manager-item">
                <div className="sidebar-manager-info">
                  <strong>{m.nom}</strong>
                  <span className={`categorie-pill sm categorie-pill-${m.categorie}`}>
                    {categorieLabel(m.categorie)}
                  </span>
                  <span className="country-pill sm">{extractCountry(m)}</span>
                  {m.email && <small>{m.email}</small>}
                  {m.telephone && <small>{m.telephone}</small>}
                </div>
                {onRemove ? (
                  <button
                    type="button"
                    className="sidebar-manager-remove"
                    onClick={() => onRemove(m.id)}
                    aria-label={`Retirer ${m.nom}`}
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
            {audienceSummary.categorie ? <small>Catégorie : {audienceSummary.categorie}</small> : null}
            {audienceSummary.countriesLabel ? (
              <small>Pays : {audienceSummary.countriesLabel}</small>
            ) : null}
          </div>
        ) : (
          <p className="muted sidebar-empty">
            {mode === 'single'
              ? 'Choisissez un boxeur dans la liste.'
              : broadcast === 'selection'
                ? 'Cochez des boxeurs dans la liste.'
                : 'Choisissez une audience.'}
          </p>
        )}
        {boxeurs.length > 0 && (
          <p className="sidebar-count">
            {boxeurs.length} destinataire{boxeurs.length > 1 ? 's' : ''}
          </p>
        )}
      </section>

      {showEmailPreview && (
        <section className="send-preview">
          <div className="preview-header">
            <h3>Aperçu email</h3>
          </div>
          <div className="preview-frame">
            <iframe title="Aperçu email" srcDoc={previewHtml} sandbox="" />
          </div>
        </section>
      )}
    </aside>
  );
}

export default function EnvoyerBoxeursPage() {
  const [mode, setMode] = useState('single');
  const [boxeurs, setBoxeurs] = useState([]);
  const [loadingBoxeurs, setLoadingBoxeurs] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [categorie, setCategorie] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [broadcast, setBroadcast] = useState('email');
  const [subject, setSubject] = useState('Message Boxing Center');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState(['email']);
  const { run: runSend, pending: sending } = useSingleAction();
  const [result, setResult] = useState(null);

  const loadBoxeurs = useCallback(async () => {
    setLoadingBoxeurs(true);
    try {
      const res = await fetch('/api/boxeurs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setBoxeurs(data.boxeurs || []);
    } catch (e) {
      setBoxeurs([]);
      setResult({ error: `Liste boxeurs : ${e.message}` });
    } finally {
      setLoadingBoxeurs(false);
    }
  }, []);

  useEffect(() => {
    loadBoxeurs();
  }, [loadBoxeurs]);

  useCountryFromUrl({ setMode, setSelectedCountries, setBroadcast });

  const countries = useMemo(() => listCountries(boxeurs), [boxeurs]);

  const filtered = useMemo(() => {
    let rows = filterManagers(boxeurs, { search, countries: selectedCountries });
    if (categorie) rows = rows.filter((m) => m.categorie === categorie);
    return rows;
  }, [boxeurs, search, selectedCountries, categorie]);

  const withEmail = useMemo(() => filtered.filter((m) => m.email), [filtered]);
  const withPhone = useMemo(() => filtered.filter((m) => m.telephone), [filtered]);

  const selectedBoxeur = boxeurs.find((m) => m.id === selectedId);
  const selectedBoxeurs = useMemo(
    () => boxeurs.filter((m) => selectedIds.has(m.id)),
    [boxeurs, selectedIds]
  );
  const sidebarBoxeurs = useMemo(() => {
    if (mode === 'single') return selectedBoxeur ? [selectedBoxeur] : [];
    if (mode === 'country' || (mode === 'bulk' && broadcast !== 'selection')) return [];
    if (broadcast === 'selection') return selectedBoxeurs;
    return [];
  }, [mode, broadcast, selectedBoxeur, selectedBoxeurs]);

  const audienceSummary = useMemo(() => {
    if (mode === 'country' && selectedCountries.length) {
      const count =
        broadcast === 'email'
          ? withEmail.length
          : broadcast === 'phone'
            ? withPhone.length
            : filtered.length;
      return {
        count,
        label:
          broadcast === 'email'
            ? 'boxeurs avec email'
            : broadcast === 'phone'
              ? 'boxeurs avec téléphone'
              : 'boxeurs au total',
        countriesLabel: formatCountriesLabel(selectedCountries),
        categorie: categorie ? categorieLabel(categorie) : null,
      };
    }
    if (mode !== 'bulk' || broadcast === 'selection') return null;
    const count =
      broadcast === 'email'
        ? withEmail.length
        : broadcast === 'phone'
          ? withPhone.length
          : filtered.length;
    const labels = {
      email: 'boxeurs avec email',
      phone: 'boxeurs avec téléphone',
      all: 'boxeurs au total',
    };
    return {
      count,
      label: labels[broadcast] || 'boxeurs',
      countriesLabel: selectedCountries.length ? formatCountriesLabel(selectedCountries) : null,
      categorie: categorie ? categorieLabel(categorie) : null,
    };
  }, [mode, broadcast, withEmail.length, withPhone.length, filtered.length, selectedCountries, categorie]);

  const previewRecipient =
    sidebarBoxeurs[0]?.nom ||
    (mode === 'bulk' && broadcast !== 'selection' ? '' : '');

  const previewHtml = buildEmailHtml({
    subject,
    body: message || '',
    recipientName: previewRecipient,
  });

  const recipientCount = useMemo(() => {
    if (mode === 'single') return selectedBoxeur ? 1 : 0;
    if (mode === 'country') {
      if (!selectedCountries.length) return 0;
      if (broadcast === 'email') return withEmail.length;
      if (broadcast === 'phone') return withPhone.length;
      return filtered.length;
    }
    if (broadcast === 'email') return withEmail.length;
    if (broadcast === 'phone') return withPhone.length;
    if (broadcast === 'all') return filtered.length;
    return selectedIds.size;
  }, [mode, broadcast, withEmail, withPhone, filtered, selectedIds, selectedBoxeur, selectedCountries]);

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
    if (sending) return;

    await runSend(async () => {
      if (!message.trim()) return;
      if (!channels.length) return;

      if (!testOnly) {
        const label =
          mode === 'single' && selectedBoxeur
            ? `le boxeur « ${selectedBoxeur.nom} »`
            : `${recipientCount} boxeur(s) réel(s)`;
        const ok = window.confirm(
          `Confirmer l'envoi à ${label} ?\n\nSeul le bouton « Test atangana » envoie au compte de test.`
        );
        if (!ok) return;
      }

      setResult(null);

      const payload = {
        message,
        subject,
        channels,
        test_only: testOnly,
      };

      if (testOnly) {
        // test only
      } else if (mode === 'single') {
        if (!selectedId) {
          setResult({ error: 'Sélectionnez un boxeur' });
          return;
        }
        payload.boxeur_ids = [selectedId];
      } else if (mode === 'country') {
        if (!selectedCountries.length) {
          setResult({ error: 'Sélectionnez au moins un pays' });
          return;
        }
        const ids = idsForCountrySend({ broadcast, withEmail, withPhone, filtered });
        if (!ids.length) {
          setResult({ error: `Aucun boxeur pour ${formatCountriesLabel(selectedCountries)}` });
          return;
        }
        payload.boxeur_ids = ids;
      } else if (broadcast === 'selection') {
        if (!selectedIds.size) {
          setResult({ error: 'Sélectionnez au moins un boxeur' });
          return;
        }
        payload.boxeur_ids = [...selectedIds];
      } else if (selectedCountries.length || categorie) {
        const ids =
          broadcast === 'email'
            ? withEmail.map((m) => m.id)
            : broadcast === 'phone'
              ? withPhone.map((m) => m.id)
              : filtered.map((m) => m.id);
        if (!ids.length) {
          setResult({ error: 'Aucun boxeur pour ces filtres' });
          return;
        }
        payload.boxeur_ids = ids;
      } else {
        payload.broadcast = broadcast;
      }

      const data = emptySendResult('boxeurs');

      if (channels.includes('whatsapp')) {
        const waRes = await fetch('/api/bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: '/api/send-to-boxeurs',
            body: { ...payload, channels: ['whatsapp'] },
          }),
        });
        const waData = await parseClientJson(waRes);
        if (!waRes.ok) throw new Error(waData.error || 'Erreur envoi WhatsApp');
        mergeSendResults(data, waData);
      }

      if (channels.includes('email')) {
        const { channels: _c, ...emailPayload } = payload;
        const emRes = await fetch('/api/boxeurs/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload),
        });
        const emData = await parseApiJson(emRes);
        if (!emRes.ok) throw new Error(emData.error || 'Erreur envoi email');
        mergeSendResults(data, emData);
      }

      setResult({
        success: true,
        data,
        previewHtml:
          channels.includes('email')
            ? buildEmailHtml({
                subject,
                body: message,
                recipientName: testOnly ? 'Atangana' : previewRecipient,
              })
            : null,
      });
    }).catch((e) => setResult({ error: e.message }));
  }

  return (
    <div className="send-page">
      <EnvoyerBackLink />
      <header className="page-header">
        <div>
          <h1>Envoyer aux boxeurs</h1>
          <p className="page-subtitle">
            {categorie ? `Catégorie : ${categorieLabel(categorie)} · ` : ''}
            {selectedCountries.length ? `Pays : ${formatCountriesLabel(selectedCountries)} · ` : ''}
            {withEmail.length} email · {withPhone.length} téléphone
            {filtered.length !== boxeurs.length ? ` · ${filtered.length} affiché(s)` : ''}
          </p>
        </div>
      </header>

      <div className="mode-tabs">
        <button type="button" className={mode === 'single' ? 'active' : ''} onClick={() => setMode('single')}>
          Un seul boxeur
        </button>
        <button type="button" className={mode === 'country' ? 'active' : ''} onClick={() => setMode('country')}>
          Par pays
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
          </section>

          <section className="card send-card">
            <h2 className="section-title">
              {mode === 'single' ? 'Destinataire' : 'Audience'}
            </h2>

            {mode === 'single' ? (
              <>
                <BoxeurFilterBar
                  search={search}
                  onSearchChange={setSearch}
                  selectedCountries={selectedCountries}
                  onCountriesChange={setSelectedCountries}
                  categorie={categorie}
                  onCategorieChange={setCategorie}
                  countries={countries}
                />
                <div className="manager-picker">
                  {loadingBoxeurs ? (
                    <p className="muted">Chargement</p>
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
                          <span className={`categorie-pill sm categorie-pill-${m.categorie}`}>
                            {categorieLabel(m.categorie)}
                          </span>
                          <span className="country-pill sm">{extractCountry(m)}</span>
                          {m.email && <span className="tag email-tag">{m.email}</span>}
                          {m.telephone && <span className="tag phone-tag">{m.telephone}</span>}
                          {!m.email && !m.telephone && <span className="tag muted-tag">Sans contact</span>}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : mode === 'country' ? (
              <>
                <SendCountryModePanel
                  entityLabel="boxeurs"
                  selectedCountries={selectedCountries}
                  onCountriesChange={setSelectedCountries}
                  countries={countries}
                  broadcast={broadcast}
                  onBroadcastChange={setBroadcast}
                  withEmail={withEmail}
                  withPhone={withPhone}
                  filtered={filtered}
                />
                <div className="filter-field country-mode-categorie">
                  <label htmlFor="country-categorie">Catégorie (optionnel)</label>
                  <select
                    id="country-categorie"
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Amateur + pro</option>
                    <option value="amateur">Amateur</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="broadcast-options">
                  <label className={`broadcast-opt ${broadcast === 'email' ? 'active' : ''}`}>
                    <input type="radio" name="broadcast" value="email" checked={broadcast === 'email'} onChange={() => setBroadcast('email')} />
                    <div>
                      <strong>Tous avec email</strong>
                      <span>{withEmail.length} boxeur(s){categorie ? ` · ${categorieLabel(categorie)}` : ''}{selectedCountries.length ? ` · ${formatCountriesLabel(selectedCountries)}` : ''}</span>
                    </div>
                  </label>
                  <label className={`broadcast-opt ${broadcast === 'phone' ? 'active' : ''}`}>
                    <input type="radio" name="broadcast" value="phone" checked={broadcast === 'phone'} onChange={() => setBroadcast('phone')} />
                    <div>
                      <strong>Tous avec téléphone</strong>
                      <span>{withPhone.length} boxeur(s){categorie ? ` · ${categorieLabel(categorie)}` : ''}{selectedCountries.length ? ` · ${formatCountriesLabel(selectedCountries)}` : ''}</span>
                    </div>
                  </label>
                  <label className={`broadcast-opt ${broadcast === 'all' ? 'active' : ''}`}>
                    <input type="radio" name="broadcast" value="all" checked={broadcast === 'all'} onChange={() => setBroadcast('all')} />
                    <div>
                      <strong>Tous les boxeurs</strong>
                      <span>{filtered.length} boxeur(s){categorie ? ` · ${categorieLabel(categorie)}` : ''}{selectedCountries.length ? ` · ${formatCountriesLabel(selectedCountries)}` : ''}</span>
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

                {broadcast !== 'selection' && (
                  <div className="country-filter-bulk">
                    <label htmlFor="bulk-categorie">Limiter par catégorie (optionnel)</label>
                    <select
                      id="bulk-categorie"
                      value={categorie}
                      onChange={(e) => setCategorie(e.target.value)}
                    >
                      <option value="">Amateur + Pro</option>
                      <option value="amateur">Amateur</option>
                      <option value="pro">Pro</option>
                    </select>
                    <CountryMultiPicker
                      selected={selectedCountries}
                      onChange={setSelectedCountries}
                      countries={countries}
                      id="bulk-country-multi"
                      label="Limiter par pays (optionnel)"
                      hint="Un ou plusieurs pays"
                    />
                  </div>
                )}

                {broadcast === 'selection' && (
                  <div className="selection-panel">
                    <BoxeurFilterBar
                      search={search}
                      onSearchChange={setSearch}
                      selectedCountries={selectedCountries}
                      onCountriesChange={setSelectedCountries}
                      categorie={categorie}
                      onCategorieChange={setCategorie}
                      countries={countries}
                    />
                    <div className="selection-toolbar">
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
                            <small>
                              {categorieLabel(m.categorie)} · {m.email || m.telephone || '—'}
                            </small>
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
                  placeholder="Objet"
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
                placeholder="Message"
              />
            </div>
          </section>

          <div className="send-actions">
            <ActionButton
              className="btn secondary"
              onClick={() => send({ testOnly: true })}
              loading={sending}
              disabled={!message.trim()}
              title="Envoie uniquement au compte test Atangana — jamais aux vrais boxeurs"
            >
              {sending ? 'Envoi…' : 'Test atangana (seul)'}
            </ActionButton>
            <ActionButton
              className="btn primary"
              onClick={() => send({ testOnly: false })}
              loading={sending}
              disabled={!message.trim() || recipientCount === 0}
            >
              {sending ? 'Envoi…' : `Envoyer${recipientCount ? ` (${recipientCount})` : ''}`}
            </ActionButton>
          </div>

          {result && (
            <div className={`result-panel ${result.error ? 'error' : 'success'}`}>
              {result.error ? (
                <p><strong>Erreur :</strong> {result.error}</p>
              ) : (
                <>
                  <p><strong>Envoi terminé</strong> — {result.data.boxeurs} boxeur(s) traité(s)</p>
                  {result.data.destinations?.length > 0 && (
                    <ul className="dest-list">
                      {result.data.destinations.map((d, i) => (
                        <li key={i}>
                          <span className="dest-channel">{d.channel === 'email' ? 'Email' : 'WhatsApp'}</span>
                          <strong>{d.to}</strong>
                          {d.boxeur || d.promoter || d.manager ? ` (${d.boxeur || d.promoter || d.manager})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
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
                          <li key={i}>{e.boxeur || e.promoter || e.manager} ({e.channel}) : {e.error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {result.previewHtml && (
                    <div className="sent-preview">
                      <h4>Aperçu de l&apos;email envoyé</h4>
                      <div className="preview-frame sent-preview-frame">
                        <iframe title="Email envoyé" srcDoc={result.previewHtml} sandbox="" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <SendSidebar
          mode={mode}
          broadcast={broadcast}
          boxeurs={sidebarBoxeurs}
          audienceSummary={audienceSummary}
          previewHtml={previewHtml}
          showEmailPreview={channels.includes('email')}
          onRemove={
            mode === 'single'
              ? () => setSelectedId('')
              : broadcast === 'selection'
                ? (id) => toggleSelect(id)
                : null
          }
        />
      </div>
    </div>
  );
}
