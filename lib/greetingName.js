/** Prénom pour salutation email / WhatsApp. */
export function greetingName(prenom, nom) {
  const p = String(prenom || '').trim();
  if (p) return p;
  const n = String(nom || '').trim();
  if (n) return n.split(/\s+/)[0];
  return '';
}

export function greetingNameOrFallback(prenom, nom, fallback = 'toi') {
  return greetingName(prenom, nom) || fallback;
}
