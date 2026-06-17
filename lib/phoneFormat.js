/** Normalise un numéro FR en conservant le 0 initial (06…, 07…, 05…). */
export function normalizeFrenchPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('33') && digits.length >= 11) {
    return `0${digits.slice(-9)}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return digits;
  }

  if (digits.length === 9 && /^[1-9]/.test(digits)) {
    return `0${digits}`;
  }

  return digits;
}

/** Clé interne pour dédoublonnage (9 derniers chiffres en France). */
export function phoneDedupKey(value) {
  const normalized = normalizeFrenchPhone(value);
  if (!normalized) return null;
  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('0')) return digits.slice(-9);
  if (digits.length >= 9) return digits.slice(-9);
  return digits;
}

/** Variantes pour retrouver un numéro déjà en base (avec ou sans 0). */
export function phoneLookupVariants(phone) {
  const normalized = normalizeFrenchPhone(phone);
  if (!normalized) return [];

  const digits = normalized.replace(/\D/g, '');
  const variants = new Set([normalized, digits]);

  if (digits.length === 10 && digits.startsWith('0')) {
    const national = digits.slice(1);
    variants.add(national);
    variants.add(`33${national}`);
    variants.add(`+33${national}`);
  }

  if (digits.length === 9) {
    variants.add(`0${digits}`);
    variants.add(`33${digits}`);
  }

  return [...variants];
}

export function formatClientPhone(value) {
  return normalizeFrenchPhone(value) || String(value || '').trim() || null;
}
