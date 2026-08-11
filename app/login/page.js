'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InstallPwa from '../components/InstallPwa';
import ActionButton from '../components/ActionButton';
import { useSingleAction } from '../../lib/useSingleAction';

export default function LoginPage() {
  const router = useRouter();
  const { run, pending: loading } = useSingleAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setError('');
    await run(
      async () => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        router.push('/admin');
        router.refresh();
      },
      { resetOnSuccess: false }
    ).catch((err) => setError(err.message));
  }

  return (
    <div className="login-page">
      <div className="login-page__glow login-page__glow--a" aria-hidden="true" />
      <div className="login-page__glow login-page__glow--b" aria-hidden="true" />
      <div className="login-page__grain" aria-hidden="true" />

      <div className="login-panel">
        <div className="login-brand">
          <Image
            src="/logo.png"
            alt="Boxing Center"
            width={220}
            height={56}
            className="login-logo"
            priority
          />
          <p className="login-eyebrow">Administration</p>
          <h1 className="login-title">Console Boxing Center</h1>
          <p className="login-subtitle">Accès réservé aux administrateurs</p>
        </div>

        <form onSubmit={onSubmit} className={loading ? 'login-form--locked' : 'login-form'}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <ActionButton type="submit" className="btn login-submit" loading={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </ActionButton>
        </form>

        <div className="login-footer">
          <InstallPwa variant="login" />
          <a
            className="login-site-link"
            href="https://boxingcenter.fr/"
            target="_blank"
            rel="noreferrer"
          >
            boxingcenter.fr
          </a>
        </div>
      </div>
    </div>
  );
}
