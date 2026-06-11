'use client';

import { useEffect, useState } from 'react';
import WelcomeSplash from './WelcomeSplash';
import { registerServiceWorker } from '../../lib/pwa';

const SPLASH_MS = 2800;
const EXIT_MS = 650;

export default function AppBoot({ children }) {
  const [phase, setPhase] = useState('hidden');

  useEffect(() => {
    registerServiceWorker();

    const seen = sessionStorage.getItem('bc_splash_seen');
    if (seen) {
      setPhase('done');
      return undefined;
    }

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
  }, []);

  return (
    <>
      {phase === 'show' || phase === 'exit' ? <WelcomeSplash phase={phase} /> : null}
      <div className={phase !== 'done' ? 'app-boot--behind-splash' : undefined}>{children}</div>
    </>
  );
}
