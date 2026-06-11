'use client';

import { useCallback, useEffect, useState } from 'react';

export default function WhatsAppPage() {
  const [status, setStatus] = useState({});
  const [method, setMethod] = useState('qr');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/bot?path=/api/status');
    setStatus(await res.json());
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  async function start() {
    setLoading(true);
    await fetch('/api/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/api/start', body: { method, phone: method === 'pairing_code' ? phone : undefined } }),
    });
    setLoading(false);
    refresh();
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
    <>
      <h1>WhatsApp Bot</h1>
      <div className="card">
        <p>
          Statut :{' '}
          <span className={`badge ${status.connected ? 'ok' : 'err'}`}>
            {status.connected ? 'Connecté' : status.connecting ? 'Connexion…' : 'Déconnecté'}
          </span>
        </p>
        {status.qrError && <p className="error">{status.qrError}</p>}
        {status.pairingCode && <p>Code : <strong>{status.pairingCode}</strong></p>}
        {status.qr && !status.connected && (
          <img src={status.qr} alt="QR WhatsApp" style={{ maxWidth: 280, margin: '1rem 0' }} />
        )}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="qr">QR Code</option>
            <option value="pairing_code">Code appairage</option>
          </select>
          {method === 'pairing_code' && (
            <input placeholder="212612345678" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: 160, margin: 0 }} />
          )}
          <button type="button" className="btn" onClick={start} disabled={loading}>Démarrer</button>
          <button type="button" className="btn danger" onClick={logout}>Déconnecter</button>
        </div>
      </div>
    </>
  );
}
