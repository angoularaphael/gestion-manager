/**
 * Deux campagnes distinctes, même 6 bots WhatsApp + Resend.
 * Le suivi (claim SQL) est par tag : une personne peut recevoir Balma ET plus tard l’offre promo.
 * Anti-ban : quota 12 / 30 min par bot, partagé — ne pas lancer les deux vagues en même temps.
 */

export const DEFAULT_CAMPAIGN_KIND = 'balma';

export const CAMPAIGNS = {
  balma: {
    kind: 'balma',
    tag: 'balma_cession_2026',
    label: 'Com Balma',
    href: '/admin/com-balma',
    summary: 'Cession Balma Gramont — GOTA / La Cour des Miracles',
    lien: 'https://aventure.boxingcenter.fr',
    lienLabel: 'aventure.boxingcenter.fr',
  },
  offres: {
    kind: 'offres',
    tag: 'offres_promo',
    label: 'Offres promo',
    href: '/admin/com-offres',
    summary: '29 € / 4 semaines · 259 € / saison — 5 salles Boxing Center',
    lien:
      process.env.OFFRES_SHOP_URL ||
      'https://boutique.boxingcenter.fr/inscription?product=offre-duo',
    lienLabel: 'boutique.boxingcenter.fr',
  },
};

const ALIASES = {
  balma: 'balma',
  balma_cession_2026: 'balma',
  offres: 'offres',
  offre: 'offres',
  promo: 'offres',
  offres_promo: 'offres',
  portet: 'offres',
  portet_rentree_2026: 'offres',
};

export function resolveCampaignKind(raw) {
  const k = String(raw || '')
    .toLowerCase()
    .trim();
  if (ALIASES[k]) return ALIASES[k];
  if (CAMPAIGNS[k]) return k;
  return DEFAULT_CAMPAIGN_KIND;
}

export function getCampaign(kind) {
  return CAMPAIGNS[resolveCampaignKind(kind)];
}

export function campaignTag(kind) {
  return getCampaign(kind).tag;
}

export function listCampaigns() {
  return Object.values(CAMPAIGNS);
}
