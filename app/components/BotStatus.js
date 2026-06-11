'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BotStatus() {
  const [status, setStatus] = useState({ loading: true, connected: false, error: null });
  const [emailStatus, setEmailStatus] = useState(null);

  useEffect(() => {
    fetch('/api/bot?path=' + encodeURIComponent('/api/status'))
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Bot inaccessible');
        setStatus({ loading: false, connected: Boolean(d.connected), error: null, data: d });
      })
      .catch((e) => setStatus({ loading: false, connected: false, error: e.message }));

    fetch('/api/bot?path=' + encodeURIComponent('/api/email-status'))
      .then((r) => r.json())
      .then((d) => setEmailStatus(d))
      .catch(() => setEmailStatus(null));
  }, []);

  return (
    <>
      {status.error && (
        <div className="alert-banner warn">
          <div>
            <strong>Bot hors ligne</strong>
            <p>
              {status.error} — Les managers restent visibles via Supabase. WhatsApp et envois passent
              par le bot Bothosting.
            </p>
          </div>
        </div>
      )}

      {emailStatus && !emailStatus.configured && (
        <div className="alert-banner warn">
          <div>
            <strong>Email Brevo non prêt</strong>
            <p>
              {!emailStatus.hasApiKey && 'Clé API Brevo manquante sur le bot. '}
              {emailStatus.hasApiKey && !emailStatus.senderVerified && (
                <>
                  Validez l&apos;expéditeur <code>{emailStatus.senderEmail}</code> dans Brevo →
                  Expéditeurs.
                </>
              )}
            </p>
          </div>
          <a
            href="https://app.brevo.com/senders"
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm"
          >
            Configurer Brevo
          </a>
        </div>
      )}

      <div className="dashboard-cards">
        <div className="card">
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

        <div className="card">
          <h2>Envoi de messages</h2>
          <p className="muted">
            Utilisez « Test atangana (seul) » pour tester sans contacter les vrais managers.
          </p>
          <Link href="/admin/envoyer" className="btn">
            Envoyer
          </Link>
        </div>

        {emailStatus && (
          <div className="card">
            <h2>Email (Brevo)</h2>
            <ul className="info-list">
              <li>
                <span>Clé API</span>
                <strong>{emailStatus.hasApiKey ? 'OK' : 'Manquante'}</strong>
              </li>
              <li>
                <span>Expéditeur</span>
                <strong>{emailStatus.senderEmail || '—'}</strong>
              </li>
              <li>
                <span>Validé Brevo</span>
                <strong className={emailStatus.senderVerified ? 'text-ok' : 'text-err'}>
                  {emailStatus.senderVerified ? 'Oui' : 'Non'}
                </strong>
              </li>
              <li>
                <span>Réception</span>
                <strong>{emailStatus.receptionEmail || '—'}</strong>
              </li>
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
