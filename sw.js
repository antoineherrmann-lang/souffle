/* Souffle — service worker
   Stratégie : réseau d'abord (on voit toujours la dernière version), cache en repli (hors ligne).
   Les requêtes de vérification de mise à jour (?_=…) ne sont jamais mises en cache.
   À CHAQUE NOUVELLE VERSION : changer VERSION ici ET APP_VERSION dans index.html. */
const VERSION = '1.4.0';
const CACHE = 'souffle-' + VERSION;
const FONTS = 'souffle-fonts';
const PRECACHE = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'glass-kit.js', 'glass-kit-loader.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(PRECACHE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* polices Google : cache d'abord, rafraîchi en arrière-plan */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  /* vérification de mise à jour : toujours le réseau, jamais le cache */
  if (url.searchParams.has('_')) { e.respondWith(fetch(req, { cache: 'no-store' })); return; }

  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(r => {
      if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
