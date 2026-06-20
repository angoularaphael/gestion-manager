'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

/** Compteur clics « J'en profite » — page offre boxingcenter.fr */
export default function OffreEteBoutiqueClicksStat({ compact = false, className = '' }) {
  const [boutiqueClicks, setBoutiqueClicks] = useState(null);
  const [views, setViews] = useState(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/offre-ete/stats', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setBoutiqueClicks(data.boutiqueClicks ?? 0);
      setViews(data.views ?? 0);
      setError('');
    } catch (e) {
      setError(e.message);
      setBoutiqueClicks(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (compact) {
    return (
      <div className={`offre-ete-clicks-compact ${className}`.trim()}>
        {error ? (
          <span className="muted">Stats offre indisponibles</span>
        ) : (
          <>
            <strong>{boutiqueClicks ?? '…'}</strong>
            <span className="muted"> clic{boutiqueClicks === 1 ? '' : 's'} « J&apos;en profite »</span>
            <Link href="/admin/offre-ete" className="offre-ete-clicks-link">
              Détails
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`card stat stat--gold ${className}`.trim()}>
      <span className="muted">Clics « J&apos;en profite » (boutique)</span>
      <strong>{error ? '—' : boutiqueClicks ?? '…'}</strong>
      {!error && views != null ? (
        <span className="muted" style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
          {views} vue{views === 1 ? '' : 's'} page offre
        </span>
      ) : null}
      {error ? <span className="muted">{error}</span> : null}
    </div>
  );
}
