'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ActionButton from '../../components/ActionButton';
import EmailPreviewFrame from '../../components/EmailPreviewFrame';
import CountryMultiPicker from '../../components/CountryMultiPicker';
import MessageTemplatePicker from '../../components/MessageTemplatePicker';
import CampaignBulkHint from '../../components/CampaignBulkHint';
import { parseApiJson } from '../../../lib/apiJson';
import { useSingleAction } from '../../../lib/useSingleAction';
import { buildEmailHtml } from '../../../lib/emailTemplate';
import { listCountries } from '../../../lib/managerCountry';
import { formatCountriesLabel } from '../../../lib/countryFilter';
import { detectActiveRegion } from '../../../lib/languageRegions';
import { emptySendResult, mergeSendResults, runDualChannelSend } from '../../../lib/sendPageHelpers';
import { UNIFIED_AUDIENCES } from '../../../lib/unifiedSendConfig';
import {
  computeUnifiedAudienceStats,
  runUnifiedSend,
} from '../../../lib/unifiedSendHelpers';
import { useCountryFromUrl } from '../../components/useCountryFromUrl';

const COUNTRY_AUDIENCES = UNIFIED_AUDIENCES.filter((a) => a.hasCountry);

export default function EnvoyerPage() {
  const [selectedAudiences, setSelectedAudiences] = useState(['managers']);
  const [dataByAudience, setDataByAudience] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [broadcast, setBroadcast] = useState('email');
  const [channels, setChannels] = useState(['email']);
  const [subject, setSubject] = useState('Message Boxing Center');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const { run: runSend, pending: sending } = useSingleAction();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        UNIFIED_AUDIENCES.map(async (audience) => {
          const res = await fetch(audience.api, { cache: 'no-store' });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Erreur');
          return { key: audience.key, rows: json[audience.listKey] || [] };
        })
      );
      const next = {};
      for (const { key, rows } of results) next[key] = rows;
      setDataByAudience(next);
    } catch (e) {
      setResult({ error: e.message });
      setDataByAudience({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = new URLSearchParams(window.location.search).get('audiences');
    if (!raw) return;
    const keys = raw
      .split(',')
      .map((k) => k.trim())
      .filter((k) => UNIFIED_AUDIENCES.some((a) => a.key === k));
    if (keys.length) setSelectedAudiences(keys);
  }, []);

  const countryRows = useMemo(
    () => COUNTRY_AUDIENCES.flatMap((a) => dataByAudience[a.key] || []),
    [dataByAudience]
  );

  const countries = useMemo(() => listCountries(countryRows), [countryRows]);

  useCountryFromUrl({
    setMode: () => {},
    setSelectedCountries,
    setBroadcast,
    availableCountries: countries,
  });

  const activeRegion = useMemo(
    () => detectActiveRegion(selectedCountries, countries.map((c) => c.name)),
    [selectedCountries, countries]
  );

  const hasWhatsappOnly = useMemo(
    () =>
      selectedAudiences.length > 0 &&
      selectedAudiences.every((k) => AUDIENCE_BY_KEY_LOCAL[k]?.whatsappOnly),
    [selectedAudiences]
  );

  const hasEmailCapable = useMemo(
    () => selectedAudiences.some((k) => !AUDIENCE_BY_KEY_LOCAL[k]?.whatsappOnly),
    [selectedAudiences]
  );

  const stats = useMemo(
    () =>
      computeUnifiedAudienceStats({
        selectedAudienceKeys: selectedAudiences,
        dataByAudience,
        countries: selectedCountries,
        broadcast,
        channels,
      }),
    [selectedAudiences, dataByAudience, selectedCountries, broadcast, channels]
  );

  const recipientCount = stats.uniqueTotal;

  const clientsSelected = selectedAudiences.includes('clients');
  const clientPhoneCount = (dataByAudience.clients || []).filter((c) => c.telephone).length;
  const clientEmailCount = (dataByAudience.clients || []).filter((c) => c.email).length;

  const previewHtml = buildEmailHtml({
    subject,
    body: message || '',
    recipientName: '',
  });

  function toggleAudience(key) {
    setSelectedAudiences((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      return next.length ? next : prev;
    });
  }

  function toggleChannel(ch) {
    setChannels((prev) => {
      const next = prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch];
      return next.length ? next : prev;
    });
  }

  async function send({ testOnly = false } = {}) {
    if (sending) return;
    if (!message.trim()) return;
    if (!selectedAudiences.length) {
      setResult({ error: 'Sélectionnez au moins une audience' });
      return;
    }
    if (!channels.length && !hasWhatsappOnly) {
      setResult({ error: 'Sélectionnez au moins un canal' });
      return;
    }
    if (!testOnly && recipientCount === 0) {
      setResult({ error: 'Aucun destinataire pour cette sélection' });
      return;
    }

    if (!testOnly) {
      const labels = stats.perAudience.map((s) => `${s.label} (${s.unique || s.ids})`).join(', ');
      const ok = window.confirm(
        `Confirmer l'envoi à ${recipientCount} destinataire(s) unique(s) ?\n\nAudiences : ${labels}\n\n` +
          'Seul le bouton « Test giffareno237 » envoie à giffareno237@gmail.com.'
      );
      if (!ok) return;
    }

    setResult(null);

    await runSend(async () => {
      const { data, summaries } = await runUnifiedSend({
        selectedAudienceKeys: selectedAudiences,
        dataByAudience,
        countries: selectedCountries,
        broadcast,
        channels: hasWhatsappOnly && !hasEmailCapable ? ['whatsapp'] : channels,
        message,
        subject,
        testOnly,
        parseApiJson,
        runDualChannelSend,
        mergeSendResults,
        emptySendResult,
      });

      setResult({
        success: true,
        data,
        summaries,
        previewHtml: channels.includes('email') && hasEmailCapable
          ? buildEmailHtml({ subject, body: message, recipientName: 'Destinataire' })
          : null,
      });
    }).catch((e) => setResult({ error: e.message }));
  }

  return (
    <div className="send-page unified-send-page">
      <header className="page-header">
        <div>
          <h1>Envoyer</h1>
          <p className="page-subtitle">
            Un seul message pour plusieurs audiences — managers, promoteurs, entraîneurs, clients, groupes…
          </p>
        </div>
      </header>

      <div className="send-layout">
        <div className="send-main">
          <section className="card send-card">
            <h2 className="section-title">Destinataires</h2>
            <p className="muted send-card-hint">
              Cochez une ou plusieurs audiences. Les doublons (même email ou téléphone) ne reçoivent qu&apos;un seul message.
            </p>
            <div className="audience-type-grid">
              {UNIFIED_AUDIENCES.map((audience) => {
                const count = (dataByAudience[audience.key] || []).length;
                const checked = selectedAudiences.includes(audience.key);
                return (
                  <label
                    key={audience.key}
                    className={`audience-type-opt audience-type-${audience.tone} ${checked ? 'active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAudience(audience.key)}
                    />
                    <div>
                      <strong>{audience.label}</strong>
                      <span>
                        {loading ? '…' : `${count} contact(s)`}
                        {audience.whatsappOnly ? ' · WhatsApp uniquement' : ''}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {clientsSelected ? (
              <p className="muted send-card-hint">
                Campagne clients massive (vagues Mailjet, offre été) :{' '}
                <Link href="/admin/envoyer-clients">page dédiée clients</Link>.
              </p>
            ) : null}
          </section>

          <section className="card send-card">
            <h2 className="section-title">Filtre pays (optionnel)</h2>
            <CountryMultiPicker
              selected={selectedCountries}
              onChange={setSelectedCountries}
              countries={countries}
              id="unified-country-multi"
              label="Pays"
              hint="Managers, promoteurs et entraîneurs uniquement"
            />
            {selectedCountries.length > 0 ? (
              <p className="muted send-card-hint">
                Zone : <strong>{formatCountriesLabel(selectedCountries)}</strong>
              </p>
            ) : null}
          </section>

          <section className="card send-card">
            <h2 className="section-title">Audience par canal</h2>
            <div className="broadcast-options">
              <label className={`broadcast-opt ${broadcast === 'email' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="unified-broadcast"
                  value="email"
                  checked={broadcast === 'email'}
                  onChange={() => setBroadcast('email')}
                />
                <div>
                  <strong>Avec email</strong>
                  <span>Contacts disposant d&apos;une adresse email</span>
                </div>
              </label>
              <label className={`broadcast-opt ${broadcast === 'phone' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="unified-broadcast"
                  value="phone"
                  checked={broadcast === 'phone'}
                  onChange={() => setBroadcast('phone')}
                />
                <div>
                  <strong>Avec téléphone (WhatsApp)</strong>
                  <span>Contacts disposant d&apos;un numéro</span>
                </div>
              </label>
              <label className={`broadcast-opt ${broadcast === 'all' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="unified-broadcast"
                  value="all"
                  checked={broadcast === 'all'}
                  onChange={() => setBroadcast('all')}
                />
                <div>
                  <strong>Tous les contacts</strong>
                  <span>Selon les canaux cochés ci-dessous</span>
                </div>
              </label>
            </div>
          </section>

          <section className="card send-card">
            <h2 className="section-title">Canaux</h2>
            <div className="channel-pills">
              <button
                type="button"
                className={`channel-pill email ${channels.includes('email') ? 'on' : ''}`}
                onClick={() => toggleChannel('email')}
                disabled={!hasEmailCapable}
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
            {hasWhatsappOnly && hasEmailCapable ? (
              <p className="muted send-card-hint">Groupe Chabane : WhatsApp uniquement.</p>
            ) : null}
          </section>

          <CampaignBulkHint
            visible={clientsSelected && (broadcast === 'all' || broadcast === 'phone')}
            emailCount={clientEmailCount}
            phoneCount={clientPhoneCount}
          />

          <section className="card send-card">
            <h2 className="section-title">Message</h2>
            <MessageTemplatePicker
              selectedCountries={selectedCountries}
              activeRegion={activeRegion}
              onInsert={({ subject: nextSubject, message: nextMessage }) => {
                setSubject(nextSubject);
                setMessage(nextMessage);
              }}
            />
            {channels.includes('email') && hasEmailCapable ? (
              <div className="field">
                <label htmlFor="unified-subject">Sujet de l&apos;email</label>
                <input
                  id="unified-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Objet"
                />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="unified-message">Contenu</label>
              <textarea
                id="unified-message"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message…"
              />
            </div>
          </section>

          <div className="send-actions">
            <ActionButton
              className="btn secondary"
              onClick={() => send({ testOnly: true })}
              loading={sending}
              disabled={!message.trim()}
            >
              {sending ? 'Envoi…' : 'Test giffareno237'}
            </ActionButton>
            <ActionButton
              className="btn primary"
              onClick={() => send({ testOnly: false })}
              loading={sending}
              disabled={!message.trim() || !selectedAudiences.length || recipientCount === 0}
            >
              {sending ? 'Envoi…' : `Envoyer${recipientCount ? ` (${recipientCount})` : ''}`}
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
                    <strong>Envoi terminé</strong> — {recipientCount} destinataire(s) unique(s) ciblé(s)
                  </p>
                  {result.summaries?.length ? (
                    <ul className="unified-send-summary">
                      {result.summaries.map((s) => (
                        <li key={s.key}>
                          <strong>{s.label}</strong>
                          {s.skipped
                            ? ` : ${s.reason}`
                            : ` : ${s.count} contact(s) traité(s)`}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="result-grid">
                    {channels.includes('email') && hasEmailCapable ? (
                      <div className="result-stat">
                        <span className="ok">{result.data.email?.sent ?? 0}</span>
                        <small>emails envoyés</small>
                      </div>
                    ) : null}
                    {channels.includes('whatsapp') ? (
                      <div className="result-stat">
                        <span className="ok">{result.data.whatsapp?.sent ?? 0}</span>
                        <small>WhatsApp envoyés</small>
                        {(result.data.whatsapp?.queued ?? 0) > 0 ? (
                          <span className="result-detail">
                            {result.data.whatsapp.queued} en cours sur le bot
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {result.previewHtml ? (
                    <div className="sent-preview">
                      <h4>Aperçu email</h4>
                      <div className="preview-frame sent-preview-frame">
                        <EmailPreviewFrame html={result.previewHtml} title="Aperçu email" minHeight={280} />
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>

        <aside className="send-sidebar">
          <section className="send-sidebar-card">
            <h3 className="send-sidebar-title">Aperçu destinataires</h3>
            {loading ? (
              <p className="muted">Chargement…</p>
            ) : !selectedAudiences.length ? (
              <p className="muted sidebar-empty">Cochez au moins une audience.</p>
            ) : (
              <>
                <ul className="unified-audience-stats">
                  {stats.perAudience.map((s) => (
                    <li key={s.key}>
                      <strong>{s.label}</strong>
                      <span>
                        {s.unique} unique{s.unique > 1 ? 's' : ''}
                        {s.unique !== s.ids ? ` (${s.ids} avant dédup.)` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="sidebar-audience-summary">
                  <strong>{recipientCount}</strong>
                  <span>destinataire{recipientCount > 1 ? 's' : ''} unique{recipientCount > 1 ? 's' : ''}</span>
                  {selectedCountries.length ? (
                    <small>Pays : {formatCountriesLabel(selectedCountries)}</small>
                  ) : null}
                </div>
              </>
            )}
          </section>

          {channels.includes('email') && hasEmailCapable && message.trim() ? (
            <section className="send-preview">
              <div className="preview-header">
                <h3>Aperçu email</h3>
              </div>
              <div className="preview-frame">
                <EmailPreviewFrame html={previewHtml} title="Aperçu email" />
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

const AUDIENCE_BY_KEY_LOCAL = Object.fromEntries(UNIFIED_AUDIENCES.map((a) => [a.key, a]));
