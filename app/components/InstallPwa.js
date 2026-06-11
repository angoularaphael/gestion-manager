'use client';

import { useEffect, useState } from 'react';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIosSafari() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
}

export default function InstallPwa({ compact = false, variant = 'sidebar' }) {
  const rootClass = variant === 'login' ? 'install-pwa-login' : '';
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return undefined;
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  async function onInstall() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  }

  if (installed || dismissed) return null;

  if (deferred) {
    return (
      <div className={rootClass}>
        <button
          type="button"
          className={compact ? 'btn-install-pwa compact' : 'btn-install-pwa'}
          onClick={onInstall}
        >
          Installer l&apos;application
        </button>
      </div>
    );
  }

  if (isIosSafari() && !showIosHint) {
    return (
      <div className={rootClass}>
        <button
          type="button"
          className={compact ? 'btn-install-pwa compact ghost' : 'btn-install-pwa ghost'}
          onClick={() => setShowIosHint(true)}
        >
          Ajouter à l&apos;écran d&apos;accueil
        </button>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div className={`ios-install-hint ${rootClass}`}>
        <p>
          Sur iPhone : touchez <strong>Partager</strong> puis{' '}
          <strong>Sur l&apos;écran d&apos;accueil</strong>.
        </p>
        <button type="button" className="btn ghost sm" onClick={() => setDismissed(true)}>
          OK
        </button>
      </div>
    );
  }

  return null;
}
