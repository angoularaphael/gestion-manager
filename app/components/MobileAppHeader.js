'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import MobileNavIcon from './MobileNavIcon';
import LogoutButton from './LogoutButton';

function formatMaj(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function MobileAppHeader() {
  const router = useRouter();
  const [maj, setMaj] = useState(() => formatMaj(new Date()));
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    setMaj(formatMaj(new Date()));
    router.refresh();
    setTimeout(() => setRefreshing(false), 500);
  }

  return (
    <header className="mobile-app-header">
      <div className="mobile-app-brand">
        <Image src="/logo.png" alt="Boxing Center" width={110} height={28} className="mobile-brand-logo" priority />
        <span className="mobile-brand-tag">MANAGERS</span>
      </div>

      <div className="mobile-app-actions">
        <span className="mobile-maj-pill">Maj {maj}</span>
        <button
          type="button"
          className="mobile-icon-btn"
          aria-label="Actualiser"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <MobileNavIcon name="refresh" />
        </button>
        <Link href="/admin" className="mobile-icon-btn" aria-label="Accueil">
          <MobileNavIcon name="home" />
        </Link>
        <LogoutButton variant="icon" />
      </div>
    </header>
  );
}
