'use client';

import { useEffect } from 'react';

export function useCountryFromUrl({ setMode, setCountry, setBroadcast }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlCountry = params.get('country');
    const urlMode = params.get('mode');
    const urlBroadcast = params.get('broadcast');

    if (urlCountry) setCountry(urlCountry);
    if (urlMode === 'country' || urlMode === 'bulk' || urlMode === 'single') {
      setMode(urlMode);
    }
    if (urlBroadcast === 'email' || urlBroadcast === 'phone' || urlBroadcast === 'all') {
      setBroadcast(urlBroadcast);
    }
  }, [setMode, setCountry, setBroadcast]);
}
