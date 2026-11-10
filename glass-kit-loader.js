/* glass-kit-loader.js — charge glass-kit.js APRÈS le premier rendu, sans jamais bloquer l'app.
   - fichier absent / réseau coupé : l'app garde son style d'origine (état « failed »), aucune erreur visible ;
   - réglage utilisateur : définis window.GLASS_KIT_ENABLED = () => settings.glass !== false (sinon toujours actif) ;
   - navigateurs automatisés (Playwright…) : désactivé par défaut pour garder les tests de logique fiables, activé avec ?glass=1 ;
   - ?glass=0 force l'arrêt.
   Options du kit : window.GLASS_KIT_OPTIONS = { buttons: '.btn, .ib', segs: '.seg', switches: '.sw', ranges: 'input[type=range]', skip: '[data-glass-skip]', onClass: 'on', accent: 'var(--accent)' }   (défauts : '[data-glass-btn], .glass-btn', '[data-glass-seg]', '[data-glass-switch]', 'input[type=range][data-glass-range]') */
window.GlassKitLoader = (function () {
  var state = 'idle';
  function enabled() {
    var q = location.search;
    if (/[?&]glass=0/.test(q)) return false;
    if (navigator.webdriver && !/[?&]glass=1/.test(q)) return false;
    return window.GLASS_KIT_ENABLED ? !!window.GLASS_KIT_ENABLED() : true;
  }
  function load() {
    if (state === 'loading' || state === 'ready') return; state = 'loading';
    var s = document.createElement('script'); s.async = true;
    s.src = (window.GLASS_KIT_SRC || 'glass-kit.js') + '?v=' + (window.GLASS_KIT_VERSION || '1');   /* change la version à chaque mise à jour du fichier */
    s.onload = function () { state = 'ready'; sync(); };
    s.onerror = function () { state = 'failed'; };
    document.head.appendChild(s);
  }
  function sync() {
    var K = window.LiquidGlassKit;
    if (enabled()) { if (K) K.start(window.GLASS_KIT_OPTIONS || {}); else if (state !== 'failed') load(); }
    else if (K && K.active()) K.stop();
  }
  return { sync: sync, state: function () { return state; } };
})();
