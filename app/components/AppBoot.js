'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import WelcomeSplash from './WelcomeSplash';
import { registerServiceWorker } from '../../lib/pwa';

const SPLASH_MS = 2800;
const EXIT_MS = 650;

export default function AppBoot({ children }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState('done');
  const isPublicOffer = pathname?.startsWith('/offre-ete-2026');

  useEffect(() => {
    registerServiceWorker();
    if (isPublicOffer) return undefined;

    const seen = sessionStorage.getItem('bc_splash_seen');
    if (seen) return undefined;

    setPhase('show');
    const exitTimer = setTimeout(() => setPhase('exit'), SPLASH_MS);
    const doneTimer = setTimeout(() => {
      sessionStorage.setItem('bc_splash_seen', '1');
      setPhase('done');
    }, SPLASH_MS + EXIT_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [isPublicOffer]);

  const hideApp = !isPublicOffer && (phase === 'show' || phase === 'exit');

  return (
    <>
      {hideApp ? <WelcomeSplash phase={phase} /> : null}
      <div className={hideApp ? 'app-boot--behind-splash' : undefined}>{children}</div>
    </>
  );
}
