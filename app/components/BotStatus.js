'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BotStatus() {
  const [status, setStatus] = useState({ loading: true, connected: false, error: null });
  const [emailReady, setEmailReady] = useState(null);

  useEffect(() => {
    fetch('/api/bot?path=' + encodeURIComponent('/api/status'))
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Service indisponible');
        setStatus({ loading: false, connected: Boolean(d.connected), error: null });
      })
      .catch(() => setStatus({ loading: false, connected: false, error: true }));

    fetch('/api/bot?path=' + encodeURIComponent('/api/email-status'))
      .then((r) => r.json())
      .then((d) => setEmailReady(Boolean(d?.configured)))
      .catch(() => setEmailReady(false));
  }, []);

  return (
    <>
      {status.error && (
        <div className="alert-banner warn">
          <div>
            <strong>Messagerie temporairement indisponible</strong>
            <p>La liste des managers reste accessible. Réessayez l&apos;envoi plus tard.</p>
          </div>
        </div>
      )}

      <div className="dashboard-cards">
        <div className="card dashboard-card">
          <h2>WhatsApp</h2>
          <p>
            Statut :{' '}
            {status.loading ? (
              <span className="badge">…</span>
            ) : (
              <span className={`badge ${status.connected ? 'ok' : 'err'}`}>
                {status.connected ? 'Connecté' : 'Déconnecté'}
              </span>
            )}
          </p>
          <Link href="/admin/whatsapp" className="btn">
            Gérer WhatsApp
          </Link>
        </div>

        <div className="card dashboard-card">
          <h2>Envoi de messages</h2>
          <p className="muted">Contactez vos managers par email ou WhatsApp.</p>
          <Link href="/admin/envoyer" className="btn">
            Envoyer
          </Link>
        </div>

        <div className="card dashboard-card">
          <h2>Email</h2>
          <p>
            Statut :{' '}
            {emailReady === null ? (
              <span className="badge">…</span>
            ) : (
              <span className={`badge ${emailReady ? 'ok' : 'err'}`}>
                {emailReady ? 'Disponible' : 'Indisponible'}
              </span>
            )}
          </p>
          <p className="muted">Envoi des messages depuis la console.</p>
        </div>
      </div>
    </>
  );
}
