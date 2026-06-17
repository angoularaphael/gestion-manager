import { formatClientPhone } from './phoneFormat';

export function clientDisplayName(client) {
  if (!client) return 'Client';
  const full = [client.prenom, client.nom].filter(Boolean).join(' ').trim();
  return full || client.email || formatClientPhone(client.telephone) || 'Client';
}

export { formatClientPhone } from './phoneFormat';
