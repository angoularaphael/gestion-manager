/**
 * Parent WordPress — écoute index.html embarqué (postMessage + hauteur).
 * Nécessite : #offre-ete-frame + embed-config.js chargé avant.
 */
(function () {
  var cfg = window.OFFRE_ETE_EMBED;
  var frame = document.getElementById('offre-ete-frame');
  if (!cfg || !frame) return;

  frame.src = cfg.pageUrl;
  frame.title = cfg.pageTitle;
  frame.style.height = cfg.initialHeightCss;

  var allowed = {};
  cfg.parentOrigins.forEach(function (o) {
    allowed[o] = true;
  });
  allowed[cfg.childOrigin] = true;

  var lastH = 0;

  function clampHeight(h) {
    return Math.max(cfg.minHeight, Math.min(cfg.maxHeight, Number(h) || 0));
  }

  function setFrameHeight(h) {
    var height = clampHeight(h);
    if (Math.abs(height - lastH) < cfg.resizeDelta) return;
    lastH = height;
    frame.style.height = height + 'px';
  }

  window.addEventListener('message', function (e) {
    if (!allowed[e.origin]) return;
    if (!e.data || typeof e.data.type !== 'string') return;

    if (e.data.type === cfg.msg.scrollTop) {
      frame.scrollIntoView({ block: 'start', behavior: 'instant' });
      window.scrollTo(0, 0);
      return;
    }

    if (e.data.type === cfg.msg.resize) {
      setFrameHeight(e.data.height);
    }
  });

  frame.addEventListener('load', function () {
    window.setTimeout(function () {
      if (lastH < cfg.minHeight + 60) setFrameHeight(cfg.introFallbackHeight);
    }, 2500);
  });
})();
