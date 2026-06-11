'use client';

import Image from 'next/image';

export default function WelcomeSplash({ phase }) {
  const exiting = phase === 'exit';

  return (
    <div className={`welcome-splash ${exiting ? 'welcome-splash--exit' : ''}`} aria-hidden={exiting}>
      <div className="welcome-splash__bg" />
      <div className="welcome-splash__glow welcome-splash__glow--a" />
      <div className="welcome-splash__glow welcome-splash__glow--b" />

      <div className="welcome-splash__content">
        <div className="welcome-splash__logo-wrap">
          <Image
            src="/logo.png"
            alt="Boxing Center"
            width={220}
            height={56}
            className="welcome-splash__logo"
            priority
          />
        </div>

        <p className="welcome-splash__eyebrow">Bienvenue dans</p>
        <h1 className="welcome-splash__title">
          Le gestionnaire des managers
          <span>Boxing Center</span>
        </h1>
        <p className="welcome-splash__tagline">Console d&apos;administration</p>

        <div className="welcome-splash__loader" role="presentation">
          <span className="welcome-splash__loader-bar" />
        </div>
      </div>
    </div>
  );
}
