'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ActionButton from '../../components/ActionButton';
import EnvoyerBackLink from '../../components/EnvoyerBackLink';
import CampaignBulkHint from '../../components/CampaignBulkHint';
import WhatsAppBulkHint from '../../components/WhatsAppBulkHint';
import { parseApiJson } from '../../../lib/apiJson';
import { clientDisplayName, formatClientPhone } from '../../../lib/clientDisplay';
import { buildEmailHtml } from '../../../lib/emailTemplate';
import { getOffreEteClientCampaignTemplate } from '../../../lib/offreEteCampaign';
import { emptySendResult, mergeSendResults, runDualChannelSend } from '../../../lib/sendPageHelpers';
import { useSingleAction } from '../../../lib/useSingleAction';

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

  const campaignTargetIds = useMemo(() => {
    if (channels.includes('email') && channels.includes('whatsapp')) {
      return clients.filter((c) => c.email || c.telephone).map((c) => c.id);
    }
    if (channels.includes('whatsapp')) return withPhone.map((c) => c.id);
    return withEmail.map((c) => c.id);
  }, [channels, clients, withEmail, withPhone]);

  function selectAllFiltered() {
    setSelectedIds(new Set(filtered.map((c) => c.id)));
  }

  function useCampaignAudience() {
    setMode('campaign');
    setSelectedIds(new Set());
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
    if (sending || !message.trim() || !channels.length) return;

    const isCampaign = mode === 'campaign' && !testOnly;
    const targetCount = isCampaign ? campaignTargetIds.length : selectedIds.size;

    if (!testOnly && targetCount === 0) {
      setResult({ error: 'Aucun destinataire pour ce canal' });
      return;
    }

    if (!testOnly) {
      const channelLabel = channels.includes('email') && channels.includes('whatsapp')
        ? 'email puis WhatsApp'
        : channels.includes('whatsapp')
          ? 'WhatsApp'
          : 'email';
      let warn = `Campagne : envoyer à ${targetCount} client(s) (${channelLabel}) ?`;
      if (isCampaign && channels.includes('whatsapp') && withPhone.length > 12) {
        warn +=
          '\n\n⚠ WhatsApp : seuls ~12 numéros/heure partiront. Les autres devront être relancés plus tard ou par email.';
      }
      if (isCampaign && channels.length === 1 && channels[0] === 'email') {
        const waveHint =
          emailConfig?.provider === 'mailjet'
            ? `\n\nExpéditeur Mailjet : ${
                mailjetSender === 'rotate'
                  ? 'répartition sur les 3 comptes'
                  : emailConfig.mailjet?.accounts?.find((a) => String(a.slot) === mailjetSender)
                      ?.senderEmail || `compte ${mailjetSender}`
              }.`
            : '';
        warn += `\n\nEnvoi par lots de ${EMAIL_CHUNK_SIZE} emails.${waveHint}`;
      }
      warn += '\n\n« Test atangana » = compte de test uniquement.';
      const ok = window.confirm(warn);
      if (!ok) return;
    }

    setResult(null);
    setSendProgress(null);

    await runSend(async () => {
      if (testOnly) {
        const { data, partial, duplicate, failed } = await runDualChannelSend({
          channels,
          payload: { message, subject, channels, test_only: true },
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

      if (isCampaign && channels.length === 1 && channels[0] === 'email') {
        const ids = withEmail.map((c) => c.id);
        const data = await sendCampaignEmailChunks({ message, subject, ids });
        setResult({
          success: true,
          partial: (data.email?.failed || 0) > 0,
          data,
          previewHtml: buildEmailHtml({ subject, body: message, recipientName: 'Client' }),
        });
        return;
      }

      const payload = {
        message,
        subject,
        channels,
        test_only: false,
        ...(isCampaign
          ? { broadcast: channels.includes('email') ? 'email' : 'phone', client_ids: undefined }
          : { client_ids: [...selectedIds] }),
      };

      if (isCampaign && channels.includes('email') && channels.includes('whatsapp')) {
        const emailData = await sendCampaignEmailChunks({
          message,
          subject,
          ids: withEmail.map((c) => c.id),
        });
        let waData = emptySendResult('clients');
        try {
          const waRes = await fetch('/api/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: '/api/send-to-clients',
              body: { ...payload, channels: ['whatsapp'], broadcast: 'phone' },
            }),
          });
          const waJson = await parseApiJson(waRes);
          if (!waRes.ok) throw new Error(waJson.error || 'Erreur WhatsApp');
          mergeSendResults(waData, waJson);
          waData.clients = withPhone.length;
        } catch (err) {
          waData.errors.push({ channel: 'whatsapp', error: err.message });
        }
        const data = { ...emailData };
        mergeSendResults(data, waData);
        data.warnings = [
          ...(data.warnings || []),
          ...(waData.warnings || []),
          'Campagne email complète. WhatsApp soumis aux limites horaires du bot.',
        ];
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
            {withEmail.length} avec email · {withPhone.length} avec téléphone · {clients.length}{' '}
            total
          </p>
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
            {channels.includes('email') && emailConfig?.provider === 'mailjet' ? (
              <div style={{ marginTop: '1rem' }}>
                <label>
                  <strong>Expéditeur Mailjet</strong>
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
                <p className="muted" style={{ marginTop: 8, fontSize: '0.9rem' }}>
                  Jusqu&apos;à {emailConfig.mailjet?.waveLimit || 8000} emails par vague et par
                  compte. Utilise une adresse <strong>@boxingcenter.fr</strong> vérifiée (SPF +
                  DKIM) pour éviter les spams.
                </p>
                {!emailConfig.ready ? (
                  <p className="muted" style={{ color: 'var(--danger, #c00)' }}>
                    {emailConfig.issue}
                  </p>
                ) : null}
              </div>
            ) : null}
            <CampaignBulkHint
              visible={mode === 'campaign' || channels.includes('whatsapp')}
              emailCount={withEmail.length}
              phoneCount={withPhone.length}
              campaignMode={mode === 'campaign'}
            />
          </section>

          <section className="card send-card">
            <h2 className="section-title">Audience</h2>
            <div className="channel-pills" style={{ marginBottom: '0.75rem' }}>
              <button
                type="button"
                className={`channel-pill ${mode === 'campaign' ? 'on' : ''}`}
                onClick={useCampaignAudience}
              >
                Campagne — tous ({campaignTargetIds.length})
              </button>
              <button
                type="button"
                className={`channel-pill ${mode === 'selection' ? 'on' : ''}`}
                onClick={() => setMode('selection')}
              >
                Sélection manuelle
              </button>
            </div>
            {mode === 'campaign' ? (
              <p className="muted">
                Tous les clients avec{' '}
                {channels.includes('whatsapp') && !channels.includes('email')
                  ? 'un numéro de téléphone'
                  : channels.includes('email') && !channels.includes('whatsapp')
                    ? 'une adresse email'
                    : 'email ou téléphone'}{' '}
                recevront le message (email en priorité pour une couverture maximale).
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
              disabled={
                !message.trim() ||
                (mode === 'selection' ? !selectedIds.size : campaignTargetIds.length === 0)
              }
            >
              {mode === 'campaign' ? `Lancer la campagne (${campaignTargetIds.length})` : 'Envoyer'}
            </ActionButton>
          </div>

          {sendProgress ? (
            <p className="muted">
              Envoi en cours… lot {sendProgress.current}/{sendProgress.total} ({sendProgress.label})
            </p>
          ) : null}

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
