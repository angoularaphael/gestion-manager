'use client';

import { useState } from 'react';

export default function EnvoyerPage() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('Message Boxing Center');
  const [channels, setChannels] = useState(['whatsapp', 'email']);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(testOnly) {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/api/send-to-managers',
          body: { message, subject, channels, test_only: testOnly },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleChannel(ch) {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  }

  return (
    <>
      <h1>Envoyer un message</h1>
      <div className="card">
        <label>Sujet (email)</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        <label>Message</label>
        <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
        <p>Canaux :</p>
        <label><input type="checkbox" checked={channels.includes('whatsapp')} onChange={() => toggleChannel('whatsapp')} /> WhatsApp</label>
        <label><input type="checkbox" checked={channels.includes('email')} onChange={() => toggleChannel('email')} /> Email (Brevo)</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" className="btn secondary" onClick={() => send(true)} disabled={loading || !message}>
            Test atangana
          </button>
        </div>
        {result && <pre style={{ marginTop: '1rem', fontSize: '0.8rem', background: '#f8fafc', padding: '1rem', borderRadius: 8 }}>{result}</pre>}
      </div>
    </>
  );
}
