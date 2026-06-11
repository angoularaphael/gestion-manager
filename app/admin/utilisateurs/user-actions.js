'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function UserDeleteButton({ email }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm(`Supprimer l'accès de ${email} ?`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      router.refresh();
    } catch (e) {
      alert(e.message || 'Suppression impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="btn danger sm" disabled={loading} onClick={onDelete}>
      {loading ? '…' : 'Supprimer'}
    </button>
  );
}
