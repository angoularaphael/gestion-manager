'use client';

import { useEffect } from 'react';
import { parseCountriesFromSearch } from '../../lib/countryFilter';

export function useCountryFromUrl({ setMode, setSelectedCountries, setBroadcast }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const urlBroadcast = params.get('broadcast');
    const parsed = parseCountriesFromSearch(window.location.search);

    if (parsed.length) setSelectedCountries(parsed);
    if (urlMode === 'country' || urlMode === 'bulk' || urlMode === 'single') {
      setMode(urlMode);
    }
    if (urlBroadcast === 'email' || urlBroadcast === 'phone' || urlBroadcast === 'all') {
      setBroadcast(urlBroadcast);
    }
  }, [setMode, setSelectedCountries, setBroadcast]);
}
