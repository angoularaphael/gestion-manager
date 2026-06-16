'use client';

import { useEffect } from 'react';
import { parseCountriesFromSearch, parseRegionFromSearch } from '../../lib/countryFilter';
import { resolveCountriesForRegion } from '../../lib/languageRegions';

export function useCountryFromUrl({
  setMode,
  setSelectedCountries,
  setBroadcast,
  availableCountries = [],
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const urlBroadcast = params.get('broadcast');
    const parsed = parseCountriesFromSearch(window.location.search);
    const region = parseRegionFromSearch(window.location.search);
    const names = availableCountries.map((c) => c.name || c).filter(Boolean);

    if (region && names.length) {
      const fromRegion = resolveCountriesForRegion(names, region);
      if (fromRegion.length) setSelectedCountries(fromRegion);
    } else if (parsed.length) {
      setSelectedCountries(parsed);
    }

    if (urlMode === 'country' || urlMode === 'bulk' || urlMode === 'single') {
      setMode(urlMode);
    }
    if (urlBroadcast === 'email' || urlBroadcast === 'phone' || urlBroadcast === 'all') {
      setBroadcast(urlBroadcast);
    }
  }, [setMode, setSelectedCountries, setBroadcast, availableCountries]);
}
