'use client';

import Link from 'next/link';

export default function CountrySendLink({ country, sendPath, label }) {
  if (!country) return null;

  const href = `${sendPath}?mode=country&country=${encodeURIComponent(country)}`;

  return (
    <div className="country-send-cta">
      <Link href={href} className="btn primary country-send-cta-btn">
        {label || `Envoyer email / WhatsApp — ${country}`}
      </Link>
    </div>
  );
}
