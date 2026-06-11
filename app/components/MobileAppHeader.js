'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ActionButton from './ActionButton';
import MobileNavIcon from './MobileNavIcon';
import LogoutButton from './LogoutButton';
import { useSingleAction } from '../../lib/useSingleAction';

function formatMaj(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function MobileAppHeader() {
  const router = useRouter();
  const [maj, setMaj] = useState('');
  const { run, pending: refreshing } = useSingleAction();

  useEffect(() => {
    setMaj(formatMaj(new Date()));
  }, []);

  async function onRefresh() {
    if (refreshing) return;
    await run(async () => {
      setMaj(formatMaj(new Date()));
      router.refresh();
      await new Promise((r) => setTimeout(r, 500));
    });
  }

  return (
    <header className="mobile-app-header">
      <div className="mobile-app-brand">
        <Image src="/logo.png" alt="Boxing Center" width={110} height={28} className="mobile-brand-logo" priority />
        <span className="mobile-brand-tag">MANAGERS</span>
      </div>

      <div className="mobile-app-actions">
        <span className="mobile-maj-pill">Maj {maj || '—'}</span>
        <ActionButton
          className="mobile-icon-btn"
          aria-label="Actualiser"
          onClick={onRefresh}
          loading={refreshing}
        >
          <MobileNavIcon name="refresh" />
        </ActionButton>
        <Link href="/admin" className="mobile-icon-btn" aria-label="Accueil">
          <MobileNavIcon name="home" />
        </Link>
        <LogoutButton variant="icon" />
      </div>
    </header>
  );
}
