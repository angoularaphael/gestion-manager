/**
 * Config unique iframe WordPress ↔ index.html
 * Chargé par index.html et wordpress-iframe.html (via embed-parent.js).
 */
(function (g) {
  var GM = 'https://gestion-manager.vercel.app';

  var PAGE_VERSION = '20260620-v6';

  g.OFFRE_ETE_EMBED = {
    pageVersion: PAGE_VERSION,
    pageUrl: GM + '/offre-d-ete/index.html?embed=1&v=' + PAGE_VERSION,
    trackApi: GM + '/api/offre-ete/track',
    boutiqueUrl:
      'https://boutique.boxingcenter.fr/accueil/156-2424-offre-ete-2026-3-mois-illimites-a-89-.html#/31-salle_principale_d_entrainement-toulouse_st_cyprien',
    pageTitle: 'Offre Été 2026 — 3 mois illimités Boxing Center Toulouse',
    minHeight: 640,
    maxHeight: 24000,
    introFallbackHeight: 1200,
    initialHeightCss: 'min(100svh, 1200px)',
    resizeDelta: 4,
    childOrigin: GM,
    parentOrigins: [
      GM,
      'https://boxingcenter.fr',
      'https://www.boxingcenter.fr',
      'http://boxingcenter.fr',
      'http://www.boxingcenter.fr',
    ],
    msg: {
      resize: 'offre-ete-resize',
      scrollTop: 'offre-ete-scroll-top',
      ready: 'offre-ete-ready',
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
