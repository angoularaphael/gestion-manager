'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ActionButton from '../../components/ActionButton';
import { parseApiJson } from '../../../lib/apiJson';
import { CAMPAIGN_BOTS } from '../../../lib/campaignBots';
import { clientDisplayName, formatClientPhone } from '../../../lib/clientDisplay';
import { useSingleAction } from '../../../lib/useSingleAction';

function BotCard({ bot, onChange }) {
  const [status, setStatus] = useState({ loading: true });
  const [tick, setTick] = useState(0);
  const [qrMode, setQrMode] = useState(false);
  const { run: runStart, pending: starting } = useSingleAction();
  const { run: runStop, pending: stopping } = useSingleAction();
  const { run: runLogout, pending: loggingOut } = useSingleAction();

  const load = useCallback(async () => {
    setStatus((s) => ({ ...s, loading: true }));
    try {
      const qrQuery = qrMode ? '?qr=1' : '';
      const res = await fetch(`/api/campaign/whatsapp/bots/${bot.slug}${qrQuery}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(qrMode ? 15000 : 12000),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error);
      setStatus({ loading: false, ...data });
      if (data.connected) {
        setQrMode(false);
      } else if (data.hasQr || data.qr) {
        setQrMode(true);
      }
    } catch (err) {
      setStatus({
        loading: false,
        error: String(err.message || err).match(/abort|timed out|timeout/i)
          ? 'Délai dépassé — réessayez Actualiser.'
          : (err.message || 'Erreur'),
        connected: false,
        hasQr: false,
        qr: null,
      });
    }
  }, [bot.slug, qrMode]);

  useEffect(() => {
    load();
  }, [load, tick]);

  useEffect(() => {
    if (status.connected) return undefined;
    if (!qrMode && !status.connecting) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, [status.connected, qrMode, status.connecting]);

  async function start({ forceQr = false } = {}) {
    if (starting) return;
    await runStart(async () => {
      setQrMode(true);
      try {
        const res = await fetch(`/api/campaign/whatsapp/bots/${bot.slug}?action=start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'qr', forceQr }),
          signal: AbortSignal.timeout(12000),
        });
        const data = await parseApiJson(res);
        if (!res.ok) {
          setQrMode(false);
          setStatus((s) => ({
            ...s,
            loading: false,
            error: data.error || 'Échec du démarrage',
            qr: null,
            connecting: false,
          }));
        } else {
          setStatus((s) => ({
            ...s,
            loading: false,
            error: null,
          }));
        }
      } catch (err) {
        setQrMode(false);
        setStatus((s) => ({
          ...s,
          loading: false,
          qr: null,
          connecting: false,
          error: err.message || 'Bot inaccessible.',
        }));
      } finally {
        setTick((t) => t + 1);
        onChange?.();
      }
    });
  }

  async function stop() {
    if (stopping) return;
    await runStop(async () => {
      try {
        await fetch(`/api/campaign/whatsapp/bots/${bot.slug}?action=stop`, {
          method: 'POST',
          signal: AbortSignal.timeout(12000),
        });
      } catch {
        /* ignore */
      }
      setQrMode(false);
      setStatus((s) => ({
        ...s,
        connecting: false,
        hasQr: false,
        error: null,
        qrError: null,
      }));
      setTick((t) => t + 1);
    });
  }

  async function logout() {
    if (loggingOut) return;
    await runLogout(async () => {
      try {
        await fetch(`/api/campaign/whatsapp/bots/${bot.slug}?action=logout`, {
          method: 'POST',
          signal: AbortSignal.timeout(12000),
        });
      } catch {
        /* ignore */
      }
      setQrMode(false);
      setTick((t) => t + 1);
    });
  }

  const showQr = !status.loading && !status.connected && Boolean(status.qr);
  const showWaiting = qrMode && !status.connected && !status.qr;
  const showConnecting = qrMode && !status.connected && status.connecting && !status.qr;
  const staleSession = !status.loading && !status.connected && status.connecting && !qrMode;

  return (
    <div className="card wa-status-card">
      <h3>{bot.label}</h3>
      {status.loading ? (
        <span className="badge">Chargement…</span>
      ) : status.connected ? (
        <span className="badge badge-compta-ok">Connecté ✓</span>
      ) : status.connecting && qrMode ? (
        <span className="badge">Connexion…</span>
      ) : status.connecting ? (
        <span className="badge badge-compta-warn">Session bloquée</span>
      ) : (
        <span className="badge badge-compta-warn">À connecter</span>
      )}
      {!status.configured && !status.loading ? (
        <p className="error muted">
          URL manquante — <code>{bot.envKey}</code> ou <code>{bot.comptaEnvKey}</code> sur Vercel
        </p>
      ) : null}
      {staleSession ? (
        <p className="muted">Ancienne session sur Bothosting — cliquez <strong>Fermer session</strong> puis <strong>Générer le QR</strong>.</p>
      ) : null}
      {showQr ? (
        <div className="qr-wrap">
          <p><strong>Scannez ce QR</strong> avec le téléphone WhatsApp de cette salle.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={status.qr} alt={`QR ${bot.label}`} />
        </div>
      ) : null}
      {!status.loading && !status.connected && !showQr ? (
        <div>
          {status.qrError ? <p className="error">{status.qrError}</p> : null}
          {status.error ? <p className="error">{status.error}</p> : null}
          <p className="muted">
            {showConnecting
              ? 'QR scanné — finalisation (10–30 s)…'
              : showWaiting
                ? 'Génération du QR en cours…'
                : status.error || 'Cliquez sur « Générer le QR ».'}
          </p>
        </div>
      ) : null}
      {status.connected ? (
        <p className="muted">Ce numéro envoie jusqu&apos;à 12 messages / 30 min (~2m30 entre chaque).</p>
      ) : null}
      <div className="wa-actions">
        {!status.connected && !qrMode ? (
          <ActionButton type="button" className="btn primary" onClick={() => start()} loading={starting}>
            {starting ? 'Démarrage…' : 'Générer le QR'}
          </ActionButton>
        ) : null}
        {!status.connected && qrMode && !status.qr ? (
          <ActionButton type="button" className="btn primary" onClick={() => start({ forceQr: true })} loading={starting}>
            {starting ? 'Démarrage…' : 'Relancer le QR'}
          </ActionButton>
        ) : null}
        {!status.connected && (qrMode || status.connecting) ? (
          <ActionButton type="button" className="btn btn-secondary" onClick={stop} loading={stopping}>
            {stopping ? 'Fermeture…' : 'Fermer session'}
          </ActionButton>
        ) : null}
        {status.connected ? (
          <ActionButton type="button" className="btn btn-secondary btn-small" onClick={logout} loading={loggingOut}>
            Déconnecter
          </ActionButton>
        ) : null}
        <button type="button" className="btn btn-secondary btn-small" onClick={load} disabled={status.loading}>
          Actualiser
        </button>
      </div>
    </div>
  );
}

function ConversationList({ items }) {
  if (!items.length) {
    return <p className="muted">Aucun message pour l&apos;instant.</p>;
  }
  return (
    <ul className="campaign-conv-list">
      {items.map((item) => {
        const isOut = item.direction === 'out';
        const phone = isOut ? item.recipient : item.from_phone;
        const name = isOut
          ? item.client
            ? clientDisplayName(item.client)
            : formatClientPhone(phone)
          : item.from_name || formatClientPhone(phone);
        const when = isOut ? item.sent_at || item.created_at : item.received_at;
        const botTag = isOut && item.bot_instance ? ` · ${item.bot_instance}` : '';
        return (
          <li key={`${item.direction}-${item.id}`} className={`campaign-conv-item campaign-conv-item--${item.direction}`}>
            <div className="campaign-conv-meta">
              <strong>{name}</strong>
              <span className="muted">
                {isOut ? 'Envoyé' : 'Reçu'}
                {botTag}
                {when ? ` · ${new Date(when).toLocaleString('fr-FR')}` : ''}
                {isOut && item.read_at ? ' · Lu ✓' : ''}
              </span>
            </div>
            <p className="campaign-conv-body">{item.body}</p>
          </li>
        );
      })}
    </ul>
  );
}

export default function CampagneWhatsAppPage() {
  const [stats, setStats] = useState(null);
  const [conversations, setConversations] = useState({ outbound: [], inbound: [] });
  const [convWarning, setConvWarning] = useState('');
  const { run: runClearConv, pending: clearingConv } = useSingleAction();
  const [dispatchResult, setDispatchResult] = useState(null);
  const { run: runDispatch, pending: dispatching } = useSingleAction();

  const refresh = useCallback(async () => {
    try {
      const [statsRes, convRes] = await Promise.all([
        fetch('/api/campaign/whatsapp', { cache: 'no-store' }),
        fetch('/api/campaign/whatsapp?view=conversations&limit=60', { cache: 'no-store' }),
      ]);
      const statsData = await parseApiJson(statsRes);
      const convData = await parseApiJson(convRes);
      if (statsRes.ok) setStats(statsData);
      if (convRes.ok) {
        setConversations(convData);
        setConvWarning(convData.schemaWarning || '');
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 45000);
    return () => clearInterval(id);
  }, [refresh]);

  const threads = [...conversations.outbound, ...conversations.inbound]
    .sort((a, b) => {
      const ta = new Date(a.sent_at || a.received_at || a.created_at || 0).getTime();
      const tb = new Date(b.sent_at || b.received_at || b.created_at || 0).getTime();
      return tb - ta;
    })
    .slice(0, 60);

  async function clearDiscussions() {
    if (!window.confirm('Vider toutes les discussions affichées (réponses WhatsApp reçues) ?')) return;
    await runClearConv(async () => {
      const res = await fetch('/api/campaign/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_discussions' }),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error);
      setConversations({ outbound: [], inbound: [] });
      refresh();
    }).catch((err) => setConvWarning(err.message));
  }

  async function launchWave(testOnly = false) {
    const msg = testOnly
      ? 'Envoyer un message test WhatsApp via le 1er bot connecté ?'
      : `Lancer une vague sur les 3 bots ?\n\nChaque bot connecté envoie jusqu'à ${stats?.messagesPerBotPerWave || 12} messages / ${stats?.windowMinutes || 30} min (~2m30 d'espacement).\nUn numéro ne reçoit jamais 2 fois la campagne.`;
    if (!window.confirm(msg)) return;

    await runDispatch(async () => {
      const res = await fetch('/api/campaign/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispatch', test_only: testOnly }),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error);
      setDispatchResult(data);
      refresh();
    }).catch((err) => setDispatchResult({ error: err.message }));
  }

  return (
    <div className="wa-page campaign-wa-page">
      <header className="page-header">
        <div>
          <h1>Campagne WhatsApp — 3 serveurs</h1>
          <p className="page-subtitle">
            Offre été · 12 messages / 30 min / bot · cron toutes les 30 min ·{' '}
            <Link href="/admin/envoyer-clients">envoyer clients</Link>
            {' · '}
            <Link href="/admin/campagne-wa-envoyes">déjà envoyés</Link>
          </p>
        </div>
      </header>

      {stats ? (
        <div className="grid stats-grid" style={{ marginBottom: '1rem' }}>
          <div className="card stat-card">
            <span className="stat-label">Déjà contactés</span>
            <strong>{stats.sentCount}</strong>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Restants</span>
            <strong>{stats.pendingCount}</strong>
          </div>
          <div className="card stat-card">
            <span className="stat-label">Capacité / heure</span>
            <strong>{stats.maxPerHour}</strong>
            <span className="muted">
              ({stats.messagesPerBotPerWave || 12} / {stats.windowMinutes || 30} min × bots connectés)
            </span>
          </div>
        </div>
      ) : null}

      <section className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="section-title">Lancer une vague</h2>
        <p className="muted">
          Les 3 bots travaillent en parallèle. Chaque numéro client n&apos;est assigné qu&apos;à un seul bot.
          Les discussions apparaissent ci-dessous et sur chaque téléphone WhatsApp connecté.
          Test WhatsApp → numéro <code>237693646080</code> (ou <code>CAMPAIGN_TEST_PHONE</code> sur Vercel).
        </p>
        <div className="wa-actions">
          <ActionButton className="btn primary" onClick={() => launchWave(false)} loading={dispatching}>
            Lancer vague (3 bots)
          </ActionButton>
          <ActionButton className="btn btn-secondary" onClick={() => launchWave(true)} loading={dispatching}>
            Test WhatsApp
          </ActionButton>
        </div>
        {dispatchResult?.error ? <p className="error">{dispatchResult.error}</p> : null}
        {dispatchResult?.dispatchedTotal != null && !dispatchResult.error ? (
          <p className="muted">
            {dispatchResult.dispatchedTotal} client(s) assigné(s) — {dispatchResult.pendingRemaining} restant(s)
          </p>
        ) : null}
        {dispatchResult?.recipients?.length ? (
          <ul className="campaign-sent-recent">
            {dispatchResult.recipients.map((r, i) => (
              <li key={`${r.phone}-${i}`}>
                <strong>Envoyé à {r.name}</strong>
                <span className="muted">
                  {' '}
                  · {r.bot}
                  {r.phone ? ` · ${r.phone}` : ''}
                  {r.status === 'en cours' ? ' · en cours sur Bothosting' : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {dispatchResult?.warnings?.map((w) => (
          <p key={w} className="muted">
            {w}
          </p>
        ))}
      </section>

      <div className="campaign-bots-grid">
        {CAMPAIGN_BOTS.map((bot) => (
          <BotCard key={bot.slug} bot={bot} onChange={refresh} />
        ))}
      </div>

      <section className="card" style={{ marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 className="section-title">Discussions campagne</h2>
            <p className="muted">Uniquement les réponses des clients déjà contactés par la campagne.</p>
          </div>
          <ActionButton
            type="button"
            className="btn btn-secondary btn-small"
            onClick={clearDiscussions}
            loading={clearingConv}
          >
            Vider les discussions
          </ActionButton>
        </div>
        {convWarning ? <p className="error muted">{convWarning}</p> : null}
        <ConversationList items={threads} />
      </section>
    </div>
  );
}
