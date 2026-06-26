'use client';

import Link from 'next/link';

export default function EnvoyerBackLink({ href = '/admin/envoyer', label = '← Envoyer' }) {
  return (
    <Link href={href} className="envoyer-back-link">
      {label}
    </Link>
  );
}
