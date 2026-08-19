'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function BotStatus() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/api/bot/summary', { cache: 'no-store' })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) {
          setSummary({
            whatsapp: { error: d.error || 'Indisponible', connected: false },
            email: { configured: false, error: null },
            config: {},
          });
          return;
        }
        setSummary(d);
      })
      .catch(() => {
        setSummary({
          whatsapp: { error: 'Connexion impossible', connected: false },
          email: { configured: false, error: null },
          config: {},
        });
      });
  }, []);

  const wa = summary?.whatsapp;
  const email = summary?.email;
  const emailOk = Boolean(email?.configured);

  return (
    <>
      {summary && !emailOk && (
        <div className="alert-banner warn">
          <div>
            <strong>Email indisponible</strong>
            <p>
              Resend n&apos;est pas actif sur Vercel (EMAIL_PROVIDER + RESEND_API_KEY). La liste des
              managers reste accessible. WhatsApp se gère à part.
            </p>
          </div>
        </div>
      )}

      <div className="dashboard-cards">
        <div className="card dashboard-card">
          <h2>WhatsApp</h2>
          <p>
            Statut :{' '}
            {!summary ? (
              <span className="badge">…</span>
            ) : (
              <span className={`badge ${wa?.connected ? 'ok' : 'err'}`}>
                {wa?.connected ? 'Connecté' : wa?.connecting ? 'Connexion…' : 'Déconnecté'}
              </span>
            )}
          </p>
          <Link href="/admin/whatsapp" className="btn">
            Gérer WhatsApp
          </Link>
        </div>

        <div className="card dashboard-card">
          <h2>Envoi de messages</h2>
          <p className="muted">Contactez managers, promoteurs ou entraîneurs par email ou WhatsApp.</p>
          <Link href="/admin/envoyer" className="btn">
            Envoyer
          </Link>
        </div>

        <div className="card dashboard-card">
          <div className="dashboard-card-head">
            <img src="/logo.png" alt="Boxing Center" width={48} height={48} className="email-pp" />
            <h2>Email</h2>
          </div>
          <p>
            Statut :{' '}
            {!summary ? (
              <span className="badge">…</span>
            ) : (
              <span className={`badge ${email?.configured ? 'ok' : 'err'}`}>
                {email?.configured ? 'Disponible' : 'Indisponible'}
              </span>
            )}
          </p>
          <p className="muted">Envoi des messages depuis la console.</p>
        </div>
      </div>
    </>
  );
}
