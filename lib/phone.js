export function normalizePhone(input) {
  if (!input) return '';
  return String(input).split('@')[0].split(':')[0].replace(/\D/g, '');
}
