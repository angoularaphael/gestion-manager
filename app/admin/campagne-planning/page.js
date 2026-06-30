'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ActionButton from '../../components/ActionButton';
import { parseApiJson } from '../../../lib/apiJson';
import { useSingleAction } from '../../../lib/useSingleAction';

const WARMUP_LABELS = {
  test: 'Test (50 emails/jour max)',
  ramp: 'Montée (200 emails/jour max)',
  full: 'Pleine cadence (200 emails/heure)',
};

export default function CampagnePlanningPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { run, pending } = useSingleAction();

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/campaign/planning', { cache: 'no-store' });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error);
      setStats(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur chargement');
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  async function action(name, body = {}) {
    setMessage('');
    await run(async () => {
      const res = await fetch('/api/campaign/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: name, ...body }),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message || 'OK');
      await load();
    });
  }

  const settings = stats?.settings;
  const active = settings?.active;
  const missingTable = settings?._missingTable;

  return (
    <div className="page-stack">
      <h1>Planning campagne horaire</h1>
      <p className="muted">
        Cron Vercel toutes les 30 min : <strong>200 emails</strong> (plafond horaire) puis{' '}
        <strong>12 WhatsApp / 30 min × bots connectés</strong>. Mailjet uniquement — pas Brevo.
      </p>

      {missingTable ? (
        <p className="error">
          Appliquez la migration <code>014_campaign_settings.sql</code> dans Supabase.
        </p>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      <div className="card">
        <h2>État</h2>
        <div className="stats-row">
          <div>
            <span className="muted">Cron campagne</span>
            <strong>{active ? 'Actif' : 'En pause'}</strong>
          </div>
          <div>
            <span className="muted">Réchauffage</span>
            <strong>{WARMUP_LABELS[settings?.warmup_phase] || '—'}</strong>
          </div>
          <div>
            <span className="muted">Emails cette heure</span>
            <strong>
              {stats?.emailsRemainingThisHour != null
                ? `${(settings?.emails_sent_this_hour || 0)} / ${stats.hourlyLimit}`
                : '…'}
            </strong>
          </div>
          {stats?.warmupDailyCap != null ? (
            <div>
              <span className="muted">Emails aujourd&apos;hui</span>
              <strong>
                {stats.emailsSentToday ?? 0} / {stats.warmupDailyCap}
              </strong>
            </div>
          ) : null}
        </div>

        <div className="wa-actions" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          {!active ? (
            <ActionButton className="btn primary" onClick={() => action('start')} loading={pending}>
              Démarrer la campagne auto
            </ActionButton>
          ) : (
            <ActionButton className="btn btn-secondary" onClick={() => action('pause')} loading={pending}>
              Mettre en pause
            </ActionButton>
          )}
          <ActionButton className="btn btn-secondary" onClick={() => action('run_now')} loading={pending}>
            Lancer un cycle maintenant
          </ActionButton>
        </div>
      </div>

      <div className="card">
        <h2>Phase de réchauffage</h2>
        <p className="muted">Juillet : test · Début août : montée · À partir du 24 août : pleine cadence.</p>
        <div className="wa-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {(['test', 'ramp', 'full']).map((phase) => (
            <ActionButton
              key={phase}
              className={`btn ${settings?.warmup_phase === phase ? 'primary' : 'btn-secondary'}`}
              onClick={() => action('warmup', { phase })}
              loading={pending}
            >
              {WARMUP_LABELS[phase]}
            </ActionButton>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>File d&apos;attente</h2>
        <div className="stats-row">
          <div>
            <span className="muted">Emails restants</span>
            <strong>{stats?.email?.pendingCount ?? '…'}</strong>
          </div>
          <div>
            <span className="muted">WhatsApp restants</span>
            <strong>{stats?.whatsapp?.pendingCount ?? '…'}</strong>
          </div>
          <div>
            <span className="muted">Débit WA max / h</span>
            <strong>{stats?.whatsapp?.maxPerHour ?? '…'}</strong>
          </div>
        </div>
        {settings?.last_cron_run_at ? (
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Dernier cycle : {new Date(settings.last_cron_run_at).toLocaleString('fr-FR')}
          </p>
        ) : null}
      </div>

      <div className="card">
        <h2>WhatsApp — 3 bots</h2>
        <p className="muted">
          Si un numéro est banni : attendez 24–48 h, puis{' '}
          <Link href="/admin/campagne-whatsapp">rescannez le QR</Link> sur chaque serveur Bothosting.
        </p>
        <ul>
          {(stats?.whatsapp?.bots || []).map((bot) => (
            <li key={bot.slug}>
              <strong>{bot.label}</strong> —{' '}
              {bot.connected ? (
                <span className="badge badge-compta-ok">Connecté</span>
              ) : (
                <span className="badge badge-compta-warn">À connecter</span>
              )}
            </li>
          ))}
        </ul>
        <Link href="/admin/campagne-whatsapp" className="btn btn-secondary sm">
          Gérer les QR WhatsApp
        </Link>
      </div>

      <div className="card send-wa-hint">
        <h2>Checklist Mailjet (anti-ban)</h2>
        <ul>
          <li>
            <code>EMAIL_PROVIDER=mailjet</code> sur Vercel — ne pas utiliser Brevo/suzinabot pour les
            campagnes
          </li>
          <li>SPF + DKIM + DMARC sur boxingcenter.fr</li>
          <li>Test avec « giffareno237@gmail.com » avant la grosse vague</li>
          <li>Plafond 200 emails/heure (sous la limite 500/h observée sur linuxcam)</li>
        </ul>
      </div>
    </div>
  );
}
