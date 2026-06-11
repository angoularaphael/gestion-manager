'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.target);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fd.get('email'),
        password: fd.get('password'),
        name: fd.get('name'),
        role: fd.get('role'),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Erreur');
      return;
    }
    e.target.reset();
    router.refresh();
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Créer un accès</h2>
      <label>Email</label>
      <input name="email" type="email" required />
      <label>Nom</label>
      <input name="name" />
      <label>Mot de passe (min. 8)</label>
      <input name="password" type="password" minLength={8} required />
      <label>Rôle</label>
      <select name="role" defaultValue="admin">
        <option value="admin">Admin</option>
        <option value="super_admin">Super admin</option>
      </select>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn">Créer</button>
    </form>
  );
}
