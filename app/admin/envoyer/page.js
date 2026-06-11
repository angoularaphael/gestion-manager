'use client';

import Link from 'next/link';
import MobileNavIcon from '../../components/MobileNavIcon';

const SEND_OPTIONS = [
  {
    href: '/admin/envoyer-managers',
    label: 'Managers',
    description: 'Email ou WhatsApp aux managers',
    icon: 'users',
    tone: 'blue',
  },
  {
    href: '/admin/envoyer-promoteurs',
    label: 'Promoteurs',
    description: 'Email ou WhatsApp aux promoteurs',
    icon: 'megaphone',
    tone: 'gold',
  },
  {
    href: '/admin/envoyer-boxeurs',
    label: 'Boxeurs',
    description: 'Amateur et pro — email ou WhatsApp',
    icon: 'glove',
    tone: 'green',
  },
];

export default function EnvoyerHubPage() {
  return (
    <div className="envoyer-hub-page">
      <header className="page-header envoyer-hub-header">
        <div>
          <h1>Envoyer</h1>
          <p className="page-subtitle">Choisissez le type de contacts à contacter</p>
        </div>
      </header>

      <div className="envoyer-hub-grid">
        {SEND_OPTIONS.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className={`envoyer-hub-card envoyer-hub-card-${opt.tone}`}
          >
            <span className="envoyer-hub-icon" aria-hidden="true">
              <MobileNavIcon name={opt.icon} />
            </span>
            <div className="envoyer-hub-text">
              <strong>{opt.label}</strong>
              <span>{opt.description}</span>
            </div>
            <span className="envoyer-hub-chevron" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
