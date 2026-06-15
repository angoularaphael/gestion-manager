'use client';

import Link from 'next/link';

export default function EnvoyerBackLink({ href = '/admin/envoyer', label = "← Choix de l'envoi" }) {
  return (
    <Link href={href} className="envoyer-back-link">
      {label}
    </Link>
  );
}
