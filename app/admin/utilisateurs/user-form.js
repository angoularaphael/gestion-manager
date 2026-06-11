'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let p = '';
  for (let i = 0; i < 12; i += 1) {
    p += chars[Math.floor(Math.random() * chars.length)];
  }
  return p;
}

function formatPhoneDisplay(phone) {
  if (!phone) return '—';
  return phone.startsWith('+') ? phone : `+${phone}`;
}

export default function UserForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [created, setCreated] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCreated(null);
    const fd = new FormData(e.target);
    const payload = {
      email: fd.get('email'),
      password: fd.get('password'),
      name: fd.get('name'),
      phone: fd.get('phone'),
      send_email: sendEmail,
      send_whatsapp: sendWhatsApp,
    };

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Erreur');
      return;
    }

    setCreated({
      email: data.user.email,
      name: data.user.name,
      password: payload.password,
      phone: data.user.phone,
      delivery: data.delivery,
    });
    setPassword('');
    e.target.reset();
    setSendEmail(true);
    setSendWhatsApp(false);
    router.refresh();
  }

  return (
    <div className="admin-users-layout">
      <form className="card" onSubmit={onSubmit}>
        <h2>Ajouter un administrateur</h2>

        <label htmlFor="user-email">Email</label>
        <input id="user-email" name="email" type="email" required placeholder="collaborateur@exemple.fr" />

        <label htmlFor="user-name">Nom</label>
        <input id="user-name" name="name" type="text" placeholder="Prénom Nom" />

        <label htmlFor="user-phone">Téléphone WhatsApp</label>
        <input
          id="user-phone"
          name="phone"
          type="tel"
          placeholder="33612345678"
          inputMode="numeric"
        />
        <p className="field-hint">Format international sans + (ex. 33612345678). Requis pour l&apos;envoi WhatsApp.</p>

        <label htmlFor="user-password">Mot de passe (min. 8)</label>
        <div className="password-field">
          <input
            id="user-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? 'Masquer' : 'Voir'}
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => {
              const next = generatePassword();
              setPassword(next);
              setShowPassword(true);
            }}
          >
            Générer
          </button>
        </div>

        <fieldset className="send-credentials-fieldset">
          <legend>Envoyer les identifiants</legend>
          <label className="checkbox-row inline-check">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            <span>Par email (adresse saisie ci-dessus)</span>
          </label>
          <label className="checkbox-row inline-check">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
            />
            <span>Par WhatsApp (numéro ci-dessus)</span>
          </label>
        </fieldset>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn">
          Enregistrer
        </button>
      </form>

      {created && (
        <aside className="card credentials-created">
          <h3>Accès créé</h3>
          <dl className="credentials-dl">
            <dt>Email</dt>
            <dd>{created.email}</dd>
            <dt>Mot de passe</dt>
            <dd>
              <code className="password-reveal">{created.password}</code>
            </dd>
            {created.name ? (
              <>
                <dt>Nom</dt>
                <dd>{created.name}</dd>
              </>
            ) : null}
            {created.phone ? (
              <>
                <dt>Téléphone</dt>
                <dd>{formatPhoneDisplay(created.phone)}</dd>
              </>
            ) : null}
          </dl>

          {created.delivery && (
            <div className="delivery-status">
              {created.delivery.email && (
                <p className="ok-msg">Identifiants envoyés par email.</p>
              )}
              {created.delivery.whatsapp && (
                <p className="ok-msg">Identifiants envoyés par WhatsApp.</p>
              )}
              {created.delivery.errors?.map((err) => (
                <p key={err.channel} className="error">
                  {err.channel === 'email' ? 'Email' : 'WhatsApp'} : {err.error}
                </p>
              ))}
            </div>
          )}

          <button type="button" className="btn ghost sm" onClick={() => setCreated(null)}>
            Fermer
          </button>
        </aside>
      )}
    </div>
  );
}
