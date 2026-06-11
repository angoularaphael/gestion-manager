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
      <div className="login-card">
        <Image src="/logo.png" alt="Boxing Center" width={200} height={50} className="login-logo" priority />
        <p className="login-subtitle">Gestion managers</p>
        <form onSubmit={onSubmit} className={loading ? 'login-form--locked' : undefined}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          {error && <p className="error">{error}</p>}
          <ActionButton type="submit" className="btn" style={{ width: '100%' }} loading={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </ActionButton>
        </form>
        <div style={{ marginTop: '1rem' }}>
          <InstallPwa variant="login" />
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', textAlign: 'center' }}>
          <a href="https://boxingcenter.fr/" target="_blank" rel="noreferrer">boxingcenter.fr</a>
        </p>
      </div>
    </div>
  );
}
