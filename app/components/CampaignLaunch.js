'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ActionButton from './ActionButton';
import { parseApiJson } from '../../lib/apiJson';
import { useSingleAction } from '../../lib/useSingleAction';

const COPY = {
  balma: {
    title: 'Com Balma',
    intro: (
      <>
        Message officiel cession Balma · 14 variantes personnalisées ·{' '}
        <a href="https://aventure.boxingcenter.fr/" target="_blank" rel="noreferrer">
          aventure.boxingcenter.fr
        </a>
        . Un destinataire = un seul bot pour cette campagne. Tests uniquement sur fiches déjà en
        base.
      </>
    ),
    emailHint:
      '80 mails / heure, 1 600 / jour max. Même contenu que WhatsApp, HTML + bouton vers Aventure.',
    otherHref: '/admin/com-offres',
    otherLabel: 'Offres promo (campagne à part)',
  },
  offres: {
    title: 'Offres promo',
    intro: (
      <>
        Campagne séparée de Balma : <strong>29 € / 4 semaines</strong> et{' '}
        <strong>259 € / saison</strong>, 5 salles. Lien{' '}
        <a href="https://boutique.boxingcenter.fr/" target="_blank" rel="noreferrer">
          boutique.boxingcenter.fr
        </a>
        . Une personne déjà contactée pour Balma peut recevoir cette offre. Ne lancez pas les deux
        vagues WhatsApp en même temps (quota 12 / 30 min partagé sur les 6 bots).
      </>
    ),
    emailHint:
      'Mêmes Resend Pro et anti-ban que Balma. Suivi SQL séparé (tag offres_promo) — pas de collision avec la com Balma.',
    otherHref: '/admin/com-balma',
    otherLabel: 'Com Balma',
  },
};

export default function CampaignLaunch({ kind = 'balma' }) {
  const copy = COPY[kind] || COPY.balma;
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dispatchResult, setDispatchResult] = useState(null);
  const { run, pending } = useSingleAction();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaign/planning?kind=${kind}`, { cache: 'no-store' });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error);
      setStats(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur chargement');
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  async function post(action) {
    setMessage('');
    setDispatchResult(null);
    await run(async () => {
      const res = await fetch(
        action.startsWith('wa') ? '/api/campaign/whatsapp' : '/api/campaign/planning',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            action === 'wa_test'
              ? { action: 'dispatch', test_only: true, kind }
              : action === 'wa_wave'
                ? { action: 'dispatch', test_only: false, kind }
                : { action, kind }
          ),
        }
      );
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message || (data.ok || data.success ? 'OK' : ''));
      setDispatchResult(data);
      await load();
    }).catch((err) => setError(err.message));
  }

  return (
    <div className="page-stack">
      <h1>{copy.title}</h1>
      <p className="muted">{copy.intro}</p>
      <p className="muted">
        Autre campagne : <Link href={copy.otherHref}>{copy.otherLabel}</Link>
      </p>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <div className="card">
        <h2>WhatsApp (6 serveurs gestion-manager)</h2>
        <p className="muted">
          Anti-ban : 12 messages / 30 min par bot, ~2 min 30 entre deux envois. Claim SQL : 2 bots
          n’écrivent jamais à la même personne <strong>dans cette campagne</strong>.
        </p>
        <div className="wa-actions">
          <ActionButton className="btn primary" onClick={() => post('wa_wave')} loading={pending}>
            Lancer vague WhatsApp
          </ActionButton>
          <ActionButton className="btn btn-secondary" onClick={() => post('wa_test')} loading={pending}>
            Test WA (client existant)
          </ActionButton>
        </div>
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          QR et connexion : <Link href="/admin/campagne-whatsapp">bots WhatsApp campagne</Link>
        </p>
      </div>

      <div className="card">
        <h2>E-mail (Resend Pro)</h2>
        <p className="muted">{copy.emailHint}</p>
        <div className="wa-actions">
          <ActionButton className="btn primary" onClick={() => post('email_wave')} loading={pending}>
            Lancer vague e-mail
          </ActionButton>
          <ActionButton
            className="btn btn-secondary"
            onClick={() => post('email_test')}
            loading={pending}
          >
            Test e-mail (client existant)
          </ActionButton>
        </div>
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          Planning auto : <Link href="/admin/campagne-planning">campagne-planning</Link>
        </p>
      </div>

      {stats ? (
        <div className="grid stats-grid">
          <div className="card stat-card">
            <span className="stat-label">E-mails restants</span>
            <strong>{stats.email?.pendingCount ?? '—'}</strong>
          </div>
          <div className="card stat-card">
            <span className="stat-label">WhatsApp restants</span>
            <strong>{stats.whatsapp?.pendingCount ?? '—'}</strong>
          </div>
        </div>
      ) : null}

      {dispatchResult?.recipients?.length ? (
        <div className="card">
          <h2>Dernier envoi</h2>
          <ul>
            {dispatchResult.recipients.map((r, i) => (
              <li key={i}>
                {r.status} — {r.name} ({r.phone || r.bot})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
