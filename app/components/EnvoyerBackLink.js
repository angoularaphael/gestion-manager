'use client';

import Link from 'next/link';

export default function EnvoyerBackLink() {
  return (
    <Link href="/admin/envoyer" className="envoyer-back-link">
      ← Choix de l&apos;envoi
    </Link>
  );
}
