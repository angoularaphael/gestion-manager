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
import {
  getOffreEteWhatsAppPreviewMessage,
  OFFRE_ETE_WHATSAPP_VARIANT_COUNT,
} from '../../../lib/offreEteWhatsAppCampaign';
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
      const channelLabel = channels.includes('email') && channels.includes('whatsapp')
        ? 'email puis WhatsApp'
        : channels.includes('whatsapp')
          ? 'WhatsApp'
          : 'email';
      let warn = emailOnlyCampaign
        ? `Vague ${emailWave}/${emailWaveCount || 1} — envoyer à ${emailWaveIds.length} client(s) email ?`
        : `Campagne : envoyer à ${targetCount} client(s) (${channelLabel}) ?`;
      if (emailOnlyCampaign && emailWaveIds.length) {
        const from = (emailWave - 1) * waveLimit + 1;
        const to = from + emailWaveIds.length - 1;
        warn += `\n\nClients email n°${from} à n°${to} (max ${waveLimit} par vague).`;
      }
      if (isCampaign && channels.includes('whatsapp')) {
        warn += `\n\nWhatsApp : ${OFFRE_ETE_WHATSAPP_VARIANT_COUNT} messages différents (tirage aléatoire) — max ~12/h.`;
        if (withPhone.length > 12) {
          warn += ' Relancez plus tard pour le reste ou utilisez l\'email.';
        }
      }
      if (emailOnlyCampaign) {
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
      warn += '\n\n« Test giffareno237 » = envoi uniquement à giffareno237@gmail.com.';
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
        setResult({
          success: true,
          partial: (data.email?.failed || 0) > 0,
          data,
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
            <WhatsAppBulkHint visible={channels.includes('whatsapp')} />
            {channels.includes('whatsapp') ? (
              <div className="send-wa-hint muted" style={{ marginTop: '0.75rem' }}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>{OFFRE_ETE_WHATSAPP_VARIANT_COUNT} messages WhatsApp différents</strong> — un
                  texte tiré au hasard par client (promo 89€, t-shirt offert, lien boutique).
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
                <p className="muted" style={{ marginBottom: 8 }}>
                  Vagues de {waveLimit.toLocaleString('fr-FR')} emails — compte Mailjet suggéré par vague.
                </p>
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
                ) : (
                  <>
                    Tous les clients avec{' '}
                    {channels.includes('whatsapp') && !channels.includes('email')
                      ? 'un numéro de téléphone'
                      : channels.includes('email') && !channels.includes('whatsapp')
                        ? 'une adresse email'
                        : 'email ou téléphone'}{' '}
                    recevront le message.
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
              </>
            ) : (
              <p className="muted">
                Le texte WhatsApp est généré automatiquement ({OFFRE_ETE_WHATSAPP_VARIANT_COUNT}{' '}
                variantes). Utilisez « Voir un exemple » dans la section Canaux.
              </p>
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
