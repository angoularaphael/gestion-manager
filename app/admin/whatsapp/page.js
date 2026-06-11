'use client';

import { useCallback, useEffect, useState } from 'react';
import { BOT_COMMANDS, RECEPTION_EMAIL } from '../../../lib/botCommands';

export default function WhatsAppPage() {
  const [status, setStatus] = useState({});
  const [method, setMethod] = useState('qr');
  const [phone, setPhone] = useState('33762641473');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/bot?path=' + encodeURIComponent('/api/status'), {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ connected: false, error: data.error || 'Bot inaccessible' });
        return;
      }
      setStatus(data);
    } catch {
      setStatus({ connected: false, error: 'Bot inaccessible' });
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
          ? 'Délai dépassé — le bot Bothosting met trop de temps à répondre.'
          : 'Impossible de joindre le bot.',
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
      <div className="wa-grid">
        <section className="card wa-status-card">
          <h2 className="section-title">Connexion WhatsApp</h2>
          <p>
            Statut :{' '}
            <span className={`badge ${status.connected ? 'ok' : 'err'}`}>
              {status.connected ? 'Connecté' : status.connecting ? 'Connexion…' : 'Déconnecté'}
            </span>
          </p>
          {status.mandatoryPhone && (
            <p className="muted" style={{ fontSize: '0.88rem' }}>
              Admin permanent : <strong>+{status.mandatoryPhone}</strong>
            </p>
          )}
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
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="qr">QR Code</option>
              <option value="pairing_code">Code appairage</option>
            </select>
            {method === 'pairing_code' && (
              <input
                placeholder="33762641473"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: 160, margin: 0 }}
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

        <section className="card">
          <h2 className="section-title">Réception & envoi</h2>
          <ul className="info-list">
            <li><span>Réponses managers</span><strong>{RECEPTION_EMAIL}</strong></li>
            <li><span>Envoi Brevo</span><strong>suzinabot@gmail.com</strong></li>
            <li><span>Console</span><strong>gestion-manager.vercel.app</strong></li>
          </ul>
        </section>
      </div>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2 className="section-title">Commandes WhatsApp</h2>
        <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
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
