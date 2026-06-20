import { formatClientPhone } from './phoneFormat';
import { greetingNameOrFallback } from './greetingName';

export function clientDisplayName(client) {
  if (!client) return 'Client';
  const full = [client.prenom, client.nom].filter(Boolean).join(' ').trim();
  return full || client.email || formatClientPhone(client.telephone) || 'Client';
}

export function clientGreetingName(client) {
  const name = greetingNameOrFallback(client?.prenom, client?.nom, '');
  return name || clientDisplayName(client);
}

export { formatClientPhone } from './phoneFormat';
