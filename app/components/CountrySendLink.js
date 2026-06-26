'use client';

import Link from 'next/link';
import { buildCountriesQuery, formatCountriesLabel } from '../../lib/countryFilter';

export default function CountrySendLink({ countries = [], sendPath = '/admin/envoyer', audiences, label }) {
  if (!countries?.length) return null;

  const query = buildCountriesQuery(countries);
  const audiencePart = audiences ? `audiences=${encodeURIComponent(audiences)}&` : '';
  const href = `${sendPath}?${audiencePart}mode=country&${query}`;
  const text =
    label || `Envoyer email / WhatsApp — ${formatCountriesLabel(countries)}`;

  return (
    <div className="country-send-cta">
      <Link href={href} className="btn primary country-send-cta-btn">
        {text}
      </Link>
    </div>
  );
}
