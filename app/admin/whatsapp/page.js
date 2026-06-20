'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ActionButton from '../../components/ActionButton';
import { BOT_COMMANDS } from '../../../lib/botCommands';
import { useSingleAction } from '../../../lib/useSingleAction';

export default function WhatsAppPage() {
  const [status, setStatus] = useState({});
  const [method, setMethod] = useState('qr');
  const [phone, setPhone] = useState('33762641473');
  const { run: runStart, pending: starting } = useSingleAction();
  const { run: runLogout, pending: loggingOut } = useSingleAction();
  const refreshInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      const res = await fetch('/api/admin/whatsapp', {
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          connected: false,
          error: data.error || `Bot inaccessible (HTTP ${res.status}).`,
        });
        return;
      }
      setStatus({
        connected: Boolean(data.connected),
        connecting: Boolean(data.connecting),
        qr: data.qr || null,
        pairingCode: data.pairingCode || null,
        qrError: data.qrError || null,
        error: data.error || null,
      });
    } catch {
      setStatus({
        connected: false,
        error: 'Bot inaccessible depuis Vercel — vérifiez que Bothosting tourne.',
      });
    } finally {
      refreshInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  async function start() {
    if (starting) return;
    await runStart(async () => {
      try {
        const res = await fetch('/api/admin/whatsapp?action=start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method,
            phone: method === 'pairing_code' ? phone.replace(/\D/g, '') : undefined,
          }),
          signal: AbortSignal.timeout(12000),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus((s) => ({ ...s, qrError: data.error || 'Échec du démarrage' }));
        }
      } catch (e) {
        setStatus((s) => ({
          ...s,
          qrError: String(e.message || e).includes('abort')
            ? 'Délai dépassé — le bot démarre peut-être en arrière-plan, attendez le QR.'
            : 'Bot inaccessible.',
        }));
      } finally {
        refresh();
      }
    });
  }

  async function logout() {
    if (loggingOut) return;
    await runLogout(async () => {
      try {
        await fetch('/api/admin/whatsapp?action=logout', {
          method: 'POST',
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        /* ignore */
      }
      refresh();
    });
  }

  return (
    <div className="wa-page">
      <header className="page-header">
        <div>
          <h1>WhatsApp</h1>
          <p className="page-subtitle">Connexion et commandes du bot</p>
        </div>
      </header>

      <section className="card wa-status-card">
        <h2 className="section-title">Connexion</h2>
        <p>
          Statut :{' '}
          <span className={`badge ${status.connected ? 'ok' : 'err'}`}>
            {status.connected ? 'Connecté' : status.connecting ? 'Connexion…' : 'Déconnecté'}
          </span>
        </p>
        {status.error && <p className="error">{status.error}</p>}
        {status.qrError && <p className="error">{status.qrError}</p>}
        {status.pairingCode && (
          <p>
            Code appairage : <strong>{status.pairingCode}</strong>
          </p>
        )}
        {status.qr && !status.connected && (
          <div className="qr-wrap">
            <img src={status.qr} alt="QR WhatsApp" />
          </div>
        )}
        <div className="wa-actions">
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Méthode">
            <option value="qr">QR Code</option>
            <option value="pairing_code">Code appairage</option>
          </select>
          {method === 'pairing_code' && (
            <input
              placeholder="33762641473"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="wa-phone-input"
              aria-label="Numéro WhatsApp"
            />
          )}
          <ActionButton className="btn primary" onClick={start} loading={starting}>
            {starting ? 'Démarrage…' : method === 'pairing_code' ? 'Générer le code' : 'Générer le QR'}
          </ActionButton>
          <ActionButton className="btn danger" onClick={logout} loading={loggingOut}>
            {loggingOut ? 'Déconnexion…' : 'Déconnecter'}
          </ActionButton>
        </div>
      </section>

      <section className="card wa-commands-card">
        <h2 className="section-title">Commandes WhatsApp</h2>
        <p className="muted wa-commands-lead">
          Sur WhatsApp : <code>.menu</code> ou <code>.guide</code>
        </p>
        <div className="commands-grid">
          {BOT_COMMANDS.map((group) => (
            <div key={group.section} className="command-group">
              <h3>{group.section}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.cmd}>
                    <code>{item.cmd}</code>
                    <span>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
