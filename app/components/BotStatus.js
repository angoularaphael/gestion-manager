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
  const botError = wa?.error;
  const showBotHint =
    botError &&
    (botError.includes('Vercel') ||
      botError.includes('Bothosting') ||
      botError.includes('non configurée'));

  return (
    <>
      {botError && (
        <div className="alert-banner warn">
          <div>
            <strong>Messagerie temporairement indisponible</strong>
            <p>La liste des managers reste accessible. Réessayez l&apos;envoi plus tard.</p>
            {showBotHint && (
              <p className="alert-banner-detail">
                Vérifiez sur Vercel : <code>NEXT_PUBLIC_WHATSAPP_BOT_URL</code>, <code>SITE_API_SECRET</code> et que
                le bot Bothosting est démarré.
              </p>
            )}
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
          <p className="muted">Contactez vos managers par email ou WhatsApp.</p>
          <Link href="/admin/envoyer" className="btn">
            Envoyer
          </Link>
        </div>

        <div className="card dashboard-card">
          <h2>Email</h2>
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
