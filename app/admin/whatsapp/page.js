'use client';

import { useCallback, useEffect, useState } from 'react';
import ActionButton from '../../components/ActionButton';
import { BOT_COMMANDS } from '../../../lib/botCommands';
import { getBotUrlHint, publicBotFetch } from '../../../lib/botClient';
import { useSingleAction } from '../../../lib/useSingleAction';

function applyStatus(setStatus, data) {
  setStatus({
    connected: Boolean(data.connected),
    connecting: Boolean(data.connecting),
    qr: data.qr || null,
    pairingCode: data.pairingCode || null,
    qrError: data.qrError || null,
    error: null,
  });
}

export default function WhatsAppPage() {
  const [status, setStatus] = useState({});
  const [method, setMethod] = useState('qr');
  const [phone, setPhone] = useState('33762641473');
  const { run: runStart, pending: starting } = useSingleAction();
  const { run: runLogout, pending: loggingOut } = useSingleAction();

  const refresh = useCallback(async () => {
    const configHint = getBotUrlHint();
    if (configHint) {
      setStatus({ connected: false, error: configHint });
      return;
    }

    try {
      const data = await publicBotFetch('/api/status', { timeoutMs: 12000 });
      applyStatus(setStatus, data);
    } catch (e) {
      setStatus({ connected: false, error: e.message });
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  async function start() {
    if (starting) return;
    await runStart(async () => {
      try {
        await publicBotFetch('/api/start', {
          method: 'POST',
          body: { method, phone: method === 'pairing_code' ? phone : undefined },
          timeoutMs: 15000,
        });
      } catch (e) {
        setStatus((s) => ({
          ...s,
          qrError: String(e.message || e).includes('abort')
            ? 'Délai dépassé — réessayez dans quelques instants.'
            : e.message || 'Connexion impossible pour le moment.',
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
        await publicBotFetch('/api/logout', { method: 'POST', body: {} });
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
            {starting ? 'Démarrage…' : 'Démarrer / QR'}
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
