import { isBalmaSalle } from './boxingCenterSalles';
import { resolveCampaignKind } from './campaigns';

/** Com Balma = fiches salle Balma. Offres promo = les 5 salles BC, jamais Balma. */
export function clientInCampaignAudience(client = {}, kind = 'balma') {
  const k = resolveCampaignKind(kind);
  const balma = isBalmaSalle(client.salle);
  if (k === 'balma') return balma;
  return !balma;
}
