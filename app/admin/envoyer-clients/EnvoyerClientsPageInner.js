'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ActionButton from '../../components/ActionButton';
import EnvoyerBackLink from '../../components/EnvoyerBackLink';
import { parseApiJson } from '../../../lib/apiJson';
import { clientDisplayName, formatClientPhone } from '../../../lib/clientDisplay';
import { buildEmailHtml } from '../../../lib/emailTemplate';
import { getOffreEteClientCampaignTemplate } from '../../../lib/offreEteCampaign';
import {
  getOffreEteWhatsAppPreviewMessage,
  OFFRE_ETE_WHATSAPP_VARIANT_COUNT,
} from '../../../lib/offreEteWhatsAppCampaign';
import { OFFRE_ETE_EMAIL_VARIANT_COUNT } from '../../../lib/offreEteEmailCampaign';
import { getCampaignWaveCount, getCampaignWaveIds } from '../../../lib/campaignWaves';
import { emptySendResult, mergeSendResults, runDualChannelSend } from '../../../lib/sendPageHelpers';
import { useSingleAction } from '../../../lib/useSingleAction';
import OffreEteBoutiqueClicksStat from '../../components/OffreEteBoutiqueClicksStat';

const EMAIL_CHUNK_SIZE = 30;
const OFFRE_ETE_CAMPAIGN = getOffreEteClientCampaignTemplate();

function chunkIds(ids, size) {
  const out = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

export default function EnvoyerClientsPageInner() {
  const searchParams = useSearchParams();
  const preselectId = searchParams.get('client');

  const [clients, setClients] = useState([]);
  const [clientStats, setClientStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [channels, setChannels] = useState(['email']);
  const [subject, setSubject] = useState(OFFRE_ETE_CAMPAIGN.subject);
  const [message, setMessage] = useState(OFFRE_ETE_CAMPAIGN.message);
  const [mode, setMode] = useState('campaign');
  const [sendProgress, setSendProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [emailConfig, setEmailConfig] = useState(null);
  const [mailjetSender, setMailjetSender] = useState('1');
  const [emailWave, setEmailWave] = useState(1);
  const [waPreview, setWaPreview] = useState('');
  const [waLiveSent, setWaLiveSent] = useState(null);
  const { run: runSend, pending: sending } = useSingleAction();

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setClients(data.clients || []);
      setClientStats(data.stats || null);
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
    fetch('/api/admin/email-config', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.provider === 'mailjet' && data.mailjet?.purposes?.campaign) {
          setMailjetSender(String(data.mailjet.purposes.campaign));
        }
        setEmailConfig(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (preselectId && clients.length) {
      setMode('selection');
      setSelectedIds(new Set([preselectId]));
    }
  }, [preselectId, clients]);

  useEffect(() => {
    const queued = result?.data?.whatsapp?.queued;
    if (!queued) {
      setWaLiveSent(null);
      return undefined;
    }
    let cancelled = false;
    async function pollWaSent() {
      try {
        const res = await fetch('/api/offre-ete/stats', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && res.ok) setWaLiveSent(data.whatsappSent ?? 0);
      } catch {
        /* ignore */
      }
    }
    pollWaSent();
    const timer = setInterval(pollWaSent, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [result?.data?.whatsapp?.queued]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const blob = [clientDisplayName(c), c.email, formatClientPhone(c.telephone), c.salle]
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

  const withEmail = useMemo(() => clients.filter((c) => c.email), [clients]);
  const withPhone = useMemo(() => clients.filter((c) => c.telephone), [clients]);
  const phoneCount = clientStats?.withPhone ?? withPhone.length;
  const emailCount = clientStats?.withEmail ?? withEmail.length;
  const totalCount = clientStats?.total ?? clients.length;

  const waveLimit = emailConfig?.mailjet?.waveLimit || 8000;
  const emailIdsOrdered = useMemo(() => withEmail.map((c) => c.id), [withEmail]);
  const emailWaveCount = useMemo(
    () => getCampaignWaveCount(emailIdsOrdered.length, waveLimit),
    [emailIdsOrdered.length, waveLimit]
  );
  const emailWaveIds = useMemo(
    () => getCampaignWaveIds(emailIdsOrdered, emailWave, waveLimit),
    [emailIdsOrdered, emailWave, waveLimit]
  );

  useEffect(() => {
    if (emailWave > emailWaveCount && emailWaveCount > 0) {
      setEmailWave(emailWaveCount);
    }
  }, [emailWave, emailWaveCount]);

  useEffect(() => {
    if (channels.includes('email') && emailWave >= 1 && emailWave <= 3) {
      setMailjetSender(String(emailWave));
    }
  }, [emailWave, channels]);

  const campaignTargetIds = useMemo(() => {
    if (channels.includes('email') && channels.includes('whatsapp')) {
      const phoneIds = withPhone.map((c) => c.id);
      return [...new Set([...emailWaveIds, ...phoneIds])];
    }
    if (channels.includes('whatsapp')) return withPhone.map((c) => c.id);
    if (channels.includes('email')) return emailWaveIds;
    return withEmail.map((c) => c.id);
  }, [channels, withEmail, withPhone, emailWaveIds]);

  function selectAllFiltered() {
    setSelectedIds(new Set(filtered.map((c) => c.id)));
  }

  function useCampaignAudience() {
    setMode('campaign');
    setSelectedIds(new Set());
  }

  function buildSendPayload(extra = {}) {
    return {
      message: channels.includes('email') ? message : 'offre-ete-whatsapp',
      subject,
      channels,
      offre_ete_whatsapp: channels.includes('whatsapp'),
      ...extra,
    };
  }

  async function sendCampaignEmailChunks({ message, subject, ids }) {
    const chunks = chunkIds(ids, EMAIL_CHUNK_SIZE);
    const data = emptySendResult('clients');
    const mailjetRotate = mailjetSender === 'rotate';
    const mailjetAccount = mailjetRotate ? undefined : mailjetSender;
    let mailjetOffset = 0;

    for (let i = 0; i < chunks.length; i++) {
      setSendProgress({ current: i + 1, total: chunks.length, label: 'emails' });
      const res = await fetch('/api/clients/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_ids: chunks[i],
          message,
          subject,
          offre_ete_campaign: true,
          mailjet_account: mailjetAccount,
          mailjet_rotate_accounts: mailjetRotate,
          mailjet_start_index: mailjetRotate ? mailjetOffset : undefined,
        }),
      });
      const batch = await parseApiJson(res);
      if (!res.ok) throw new Error(batch.error || 'Erreur envoi email');
      mergeSendResults(data, batch);
      data.clients = Math.max(data.clients || 0, ids.length);
      mailjetOffset += chunks[i].length;
    }
    return data;
  }

  function toggleId(id) {
    setMode('selection');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function send({ testOnly = false } = {}) {
    if (sending || !channels.length) return;
    if (channels.includes('email') && !message.trim()) return;

    const isCampaign = mode === 'campaign' && !testOnly;
    const emailOnlyCampaign =
      isCampaign && channels.length === 1 && channels[0] === 'email';
    const targetCount = isCampaign
      ? emailOnlyCampaign
        ? emailWaveIds.length
        : campaignTargetIds.length
      : selectedIds.size;

    if (!testOnly && targetCount === 0) {
      setResult({ error: 'Aucun destinataire pour ce canal' });
      return;
    }

    if (!testOnly) {
      let warn = emailOnlyCampaign
        ? `Vague ${emailWave}/${emailWaveCount || 1} — envoyer à ${emailWaveIds.length} client(s) ?`
        : `Envoyer à ${targetCount} client(s) ?`;
      warn += '\n\n« Test giffareno237 » = envoi uniquement à giffareno237@gmail.com.';
      if (channels.includes('whatsapp') && !testOnly) {
        warn +=
          '\n\nWhatsApp : le bot envoie ~12 messages/heure (anti-spam). ' +
          'L\'envoi continue en arrière-plan sur Bothosting — gardez le bot allumé.';
      }
      const ok = window.confirm(warn);
      if (!ok) return;
    }

    setResult(null);
    setSendProgress(null);

    await runSend(async () => {
      if (testOnly) {
        const { data, partial, duplicate, failed } = await runDualChannelSend({
          channels,
          payload: buildSendPayload({ test_only: true }),
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
        return;
      }

      if (emailOnlyCampaign) {
        const data = await sendCampaignEmailChunks({ message, subject, ids: emailWaveIds });
        const sent = data.email?.sent || 0;
        const failed = data.email?.failed || 0;
        const skipped = data.email?.skipped || 0;
        setResult({
          success: sent > 0,
          failed: sent === 0,
          partial: failed > 0 || skipped > 0,
          data,
          warnings: [
            ...(data.warnings || []),
            ...(sent === 0
              ? [
                  failed > 0
                    ? `${failed} email(s) en échec — vérifiez le compte Mailjet ${emailWave} sur Vercel.`
                    : skipped > 0
                      ? `${skipped} client(s) ignoré(s) (sans email ou désabonnés).`
                      : 'Aucun email envoyé — vérifiez la config Mailjet.',
                ]
              : []),
          ],
          previewHtml: buildEmailHtml({ subject, body: message, recipientName: 'Client' }),
        });
        return;
      }

      const payload = buildSendPayload({
        test_only: false,
        ...(isCampaign
          ? { broadcast: channels.includes('email') ? 'email' : 'phone', client_ids: undefined }
          : { client_ids: [...selectedIds] }),
      });

      if (isCampaign && channels.includes('email') && channels.includes('whatsapp')) {
        const emailData = await sendCampaignEmailChunks({
          message,
          subject,
          ids: emailWaveIds,
        });
        let waData = emptySendResult('clients');
        try {
          const waRes = await fetch('/api/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: '/api/send-to-clients',
              body: buildSendPayload({
                channels: ['whatsapp'],
                broadcast: 'phone',
                test_only: false,
              }),
            }),
          });
          const waJson = await parseApiJson(waRes);
          if (!waRes.ok) throw new Error(waJson.error || 'Erreur WhatsApp');
          mergeSendResults(waData, waJson);
          waData.clients = phoneCount;
        } catch (err) {
          waData.errors.push({ channel: 'whatsapp', error: err.message });
        }
        const data = { ...emailData };
        mergeSendResults(data, waData);
        setResult({
          success: true,
          partial: true,
          data,
          previewHtml: buildEmailHtml({ subject, body: message, recipientName: 'Client' }),
        });
        return;
      }

      const { data, partial, duplicate, failed } = await runDualChannelSend({
        channels,
        payload,
        entityKey: 'clients',
        botPath: '/api/send-to-clients',
        emailPath: '/api/clients/send-email',
        parseApiJson,
      });

      const waQueued = data.whatsapp?.queued || 0;
      const waSent = data.whatsapp?.sent || 0;
      const nothingSent =
        !waSent &&
        !waQueued &&
        !(data.email?.sent || 0) &&
        (failed || partial || (data.errors?.length || 0) > 0);

      setResult({
        success: !nothingSent,
        partial,
        duplicate,
        failed: failed || nothingSent,
        data,
        warnings: data.warnings || [],
        previewHtml: channels.includes('email')
          ? buildEmailHtml({ subject, body: message, recipientName: 'Client' })
          : null,
      });
    })
      .catch((e) => setResult({ error: e.message }))
      .finally(() => setSendProgress(null));
  }

  return (
    <div className="send-page">
      <EnvoyerBackLink href="/admin/clients" label="Retour aux clients" />
      <header className="page-header">
        <div>
          <h1>Envoyer aux clients</h1>
          <p className="page-subtitle">
            {emailCount} avec email · {phoneCount} avec téléphone · {totalCount}{' '}
            total
          </p>
          <OffreEteBoutiqueClicksStat compact className="send-offre-clicks-stat" />
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
            {channels.includes('whatsapp') ? (
              <div className="send-wa-hint muted" style={{ marginTop: '0.75rem' }}>
                <p style={{ margin: '0 0 8px' }}>
                  {OFFRE_ETE_WHATSAPP_VARIANT_COUNT} formulations + prénom de chaque client (anti-spam
                  WhatsApp). Envoi ~12/h max sur le bot.
                </p>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setWaPreview(getOffreEteWhatsAppPreviewMessage())}
                >
                  Voir un exemple
                </button>
                {waPreview ? (
                  <pre
                    className="muted"
                    style={{
                      marginTop: 10,
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.85rem',
                      background: 'var(--surface-2, #f8fafc)',
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    {waPreview}
                  </pre>
                ) : null}
              </div>
            ) : null}
            {channels.includes('email') && emailConfig?.provider === 'mailjet' ? (
              <div style={{ marginTop: '1rem' }}>
                <label>
                  <strong>Expéditeur</strong>
                  <select
                    className="search-input"
                    value={mailjetSender}
                    onChange={(e) => setMailjetSender(e.target.value)}
                    style={{ marginTop: 6 }}
                  >
                    {(emailConfig.mailjet?.accounts || [])
                      .filter((a) => a.configured)
                      .map((a) => (
                        <option key={a.slot} value={String(a.slot)}>
                          Compte {a.slot} — {a.senderEmail} ({a.label})
                        </option>
                      ))}
                    <option value="rotate">Répartir sur les 3 comptes (rotation)</option>
                  </select>
                </label>
                {!emailConfig.ready ? (
                  <p className="muted" style={{ color: 'var(--danger, #c00)' }}>
                    {emailConfig.issue}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="card send-card">
            <h2 className="section-title">Audience</h2>
            <div className="channel-pills" style={{ marginBottom: '0.75rem' }}>
              <button
                type="button"
                className={`channel-pill ${mode === 'campaign' ? 'on' : ''}`}
                onClick={useCampaignAudience}
              >
                Campagne
                {channels.includes('email') && !channels.includes('whatsapp')
                  ? ` — vague ${emailWave}`
                  : ` — tous (${campaignTargetIds.length})`}
              </button>
              <button
                type="button"
                className={`channel-pill ${mode === 'selection' ? 'on' : ''}`}
                onClick={() => setMode('selection')}
              >
                Sélection manuelle
              </button>
            </div>
            {mode === 'campaign' && channels.includes('email') && !channels.includes('whatsapp') ? (
              <div style={{ marginTop: '0.75rem' }}>
                <div className="channel-pills" style={{ flexWrap: 'wrap' }}>
                  {Array.from({ length: Math.max(1, emailWaveCount) }, (_, i) => i + 1).map((w) => {
                    const count = getCampaignWaveIds(emailIdsOrdered, w, waveLimit).length;
                    return (
                      <button
                        key={w}
                        type="button"
                        className={`channel-pill ${emailWave === w ? 'on' : ''}`}
                        onClick={() => setEmailWave(w)}
                      >
                        Vague {w} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {mode === 'campaign' ? (
              <p className="muted">
                {channels.includes('email') && !channels.includes('whatsapp') ? (
                  <>
                    Vague {emailWave} : {emailWaveIds.length} client(s) avec email (sur{' '}
                    {withEmail.length} au total).
                  </>
                ) : channels.includes('whatsapp') && !channels.includes('email') ? (
                  <>
                    <strong>{phoneCount}</strong> client(s) avec un numéro de téléphone en base
                    (sur {totalCount} total). Seuls ceux-ci recevront le WhatsApp — pas les clients
                    email seul.
                  </>
                ) : (
                  <>
                    Email vague {emailWave} : {emailWaveIds.length} · WhatsApp : {phoneCount}{' '}
                    numéro(s) en base
                  </>
                )}
              </p>
            ) : null}
          </section>

          <section className="card send-card">
            <h2 className="section-title">
              Clients {mode === 'selection' ? `(${selectedIds.size} sélectionné(s))` : ''}
            </h2>
            {mode === 'selection' ? (
              <button type="button" className="btn ghost sm" onClick={selectAllFiltered} style={{ marginBottom: 8 }}>
                Tout cocher (liste filtrée)
              </button>
            ) : null}
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
                    {mode === 'selection' ? (
                      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleId(c.id)}
                        />
                        <span>
                          <strong>{clientDisplayName(c)}</strong>
                          {c.email ? <small>{c.email}</small> : null}
                          {c.telephone ? <small>{formatClientPhone(c.telephone)}</small> : null}
                        </span>
                      </label>
                    ) : (
                      <span>
                        <strong>{clientDisplayName(c)}</strong>
                        {c.email ? <small>{c.email}</small> : null}
                        {c.telephone ? <small>{formatClientPhone(c.telephone)}</small> : null}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card send-card">
            <h2 className="section-title">Message</h2>
            {channels.includes('email') ? (
              <>
            <div className="message-template-picker">
              <div className="message-template-header">
                <strong>Modèle Offre Été 2026</strong>
                <span className="muted">Prérempli pour la campagne clients</span>
              </div>
              <div className="message-template-actions">
                <button
                  type="button"
                  className="btn ghost sm is-suggested"
                  onClick={() => {
                    const t = getOffreEteClientCampaignTemplate();
                    setSubject(t.subject);
                    setMessage(t.message);
                  }}
                >
                  Réinsérer le modèle
                </button>
              </div>
            </div>
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
            <p className="muted" style={{ marginTop: 8 }}>
              À l&apos;envoi : {OFFRE_ETE_EMAIL_VARIANT_COUNT} variantes + prénom par destinataire
              (même contenu, formulation différente — anti-spam).
            </p>
              </>
            ) : (
              <p className="muted">Le texte WhatsApp est généré automatiquement.</p>
            )}
          </section>

          <div className="send-actions">
            <ActionButton
              className="btn secondary"
              onClick={() => send({ testOnly: true })}
              loading={sending}
              disabled={channels.includes('email') && !message.trim()}
            >
              Test giffareno237
            </ActionButton>
            <ActionButton
              className="btn"
              onClick={() => send({ testOnly: false })}
              loading={sending}
              disabled={
                (channels.includes('email') && !message.trim()) ||
                (mode === 'selection'
                  ? !selectedIds.size
                  : channels.length === 1 && channels[0] === 'email'
                    ? !emailWaveIds.length
                    : !campaignTargetIds.length)
              }
            >
              {mode === 'campaign' && channels.length === 1 && channels[0] === 'email'
                ? `Lancer vague ${emailWave} (${emailWaveIds.length})`
                : mode === 'campaign'
                  ? `Lancer la campagne (${campaignTargetIds.length})`
                  : 'Envoyer'}
            </ActionButton>
          </div>

          {sendProgress ? (
            <p className="muted">
              Envoi en cours… lot {sendProgress.current}/{sendProgress.total} ({sendProgress.label})
            </p>
          ) : null}

          {result ? (
            <div
              className={`result-panel ${
                result.error || result.failed ? 'error' : result.partial ? 'warn' : 'success'
              }`}
            >
              {result.error ? (
                <p>
                  <strong>Erreur :</strong> {result.error}
                </p>
              ) : (
                <>
                  <p>
                    <strong>
                      {result.data?.whatsapp?.queued
                        ? 'Envoi WhatsApp démarré'
                        : result.failed
                          ? 'Échec envoi'
                          : 'Envoi terminé'}
                    </strong>
                    {' — '}
                    {result.data?.clients ?? 0} client(s)
                  </p>
                  <div className="result-grid">
                    {channels.includes('email') && (
                      <div className="result-stat">
                        <span className={(result.data.email?.sent ?? 0) > 0 ? 'ok' : 'err'}>
                          {result.data.email?.sent ?? 0}
                        </span>
                        <small>emails</small>
                        {(result.data.email?.failed ?? 0) > 0 ? (
                          <small className="muted"> · {result.data.email.failed} échec(s)</small>
                        ) : null}
                      </div>
                    )}
                    {channels.includes('whatsapp') && (
                      <div className="result-stat">
                        <span className={result.data.whatsapp?.queued ? 'pending' : 'ok'}>
                          {result.data.whatsapp?.queued || result.data.whatsapp?.sent || 0}
                        </span>
                        <small>{result.data.whatsapp?.queued ? 'WhatsApp en file' : 'WhatsApp'}</small>
                      </div>
                    )}
                  </div>
                  {result.data?.whatsapp?.queued ? (
                    <p className="muted" style={{ marginTop: 10 }}>
                      Le bot Bothosting envoie en arrière-plan (~12 messages/heure max). Laissez le
                      bot allumé — comptez plusieurs jours pour toute la liste.
                      {waLiveSent != null ? (
                        <>
                          {' '}
                          <strong>{waLiveSent}</strong> message(s) déjà confirmé(s) en base
                          {waLiveSent > 0
                            ? ' — sur le WhatsApp du bot, une nouvelle discussion apparaît environ toutes les minutes.'
                            : ' — le premier envoi peut prendre 1 à 2 minutes.'}
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  {(result.warnings?.length || result.data?.warnings?.length) ? (
                    <ul className="result-warnings" style={{ marginTop: 10, paddingLeft: 18 }}>
                      {[...new Set([...(result.warnings || []), ...(result.data?.warnings || [])])].map(
                        (w, i) => (
                          <li key={i}>{w}</li>
                        )
                      )}
                    </ul>
                  ) : null}
                  {result.data?.errors?.length ? (
                    <ul className="result-warnings" style={{ marginTop: 8, paddingLeft: 18 }}>
                      {result.data.errors.slice(0, 5).map((e, i) => (
                        <li key={i}>
                          {e.channel ? `${e.channel}: ` : ''}
                          {e.error || e.client || JSON.stringify(e)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
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
