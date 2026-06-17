'use client';

import { Suspense } from 'react';
import EnvoyerClientsPageInner from './EnvoyerClientsPageInner';

export default function EnvoyerClientsPage() {
  return (
    <Suspense fallback={<p className="muted">Chargement…</p>}>
      <EnvoyerClientsPageInner />
    </Suspense>
  );
}
