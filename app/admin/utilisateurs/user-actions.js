'use client';

import { useRouter } from 'next/navigation';
import ActionButton from '../../components/ActionButton';
import { useSingleAction } from '../../../lib/useSingleAction';
import { parseApiJson } from '../../../lib/apiJson';

export function UserDeleteButton({ email }) {
  const router = useRouter();
  const { run, pending: deleting } = useSingleAction();

  async function onDelete() {
    if (deleting) return;
    await run(async () => {
      if (!confirm(`Supprimer l'accès de ${email} ?`)) return;
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(data.error || 'Erreur');
      router.refresh();
    }).catch((e) => alert(e.message || 'Suppression impossible'));
  }

  return (
    <ActionButton className="btn danger sm" loading={deleting} onClick={onDelete}>
      {deleting ? '…' : 'Supprimer'}
    </ActionButton>
  );
}
