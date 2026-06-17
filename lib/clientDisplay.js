export function clientDisplayName(client) {
  if (!client) return 'Client';
  const full = [client.prenom, client.nom].filter(Boolean).join(' ').trim();
  return full || client.email || client.telephone || 'Client';
}
