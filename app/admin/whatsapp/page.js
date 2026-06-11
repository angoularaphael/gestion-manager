'use client';

import { useCallback, useEffect, useState } from 'react';
import { BOT_COMMANDS } from '../../../lib/botCommands';

export default function WhatsAppPage() {
  const [status, setStatus] = useState({});
  const [method, setMethod] = useState('qr');
  const [phone, setPhone] = useState('33762641473');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/summary', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          connected: false,
          error: data.error || 'Connexion au bot impossible.',
        });
        return;
      }
      if (data.whatsapp?.error) {
        setStatus({ connected: false, error: data.whatsapp.error });
        return;
      }
      setStatus({
        connected: Boolean(data.whatsapp?.connected),
        connecting: Boolean(data.whatsapp?.connecting),
      });
    } catch {
      setStatus({ connected: false, error: 'Connexion au bot impossible.' });
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/api/start',
          body: { method, phone: method === 'pairing_code' ? phone : undefined },
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus((s) => ({ ...s, qrError: data.error || 'Échec du démarrage' }));
      }
    } catch (e) {
      setStatus((s) => ({
        ...s,
        qrError: String(e.message || e).includes('abort')
          ? 'Délai dépassé — réessayez dans quelques instants.'
          : 'Connexion impossible pour le moment.',
      }));
    } finally {
      setLoading(false);
      refresh();
    }
  }

  async function logout() {
    await fetch('/api/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/api/logout', body: {} }),
    });
    refresh();
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
          <button type="button" className="btn primary" onClick={start} disabled={loading}>
            {loading ? 'Démarrage…' : 'Démarrer / QR'}
          </button>
          <button type="button" className="btn danger" onClick={logout}>
            Déconnecter
          </button>
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
