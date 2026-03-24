// ── sw.js ─────────────────────────────────────────────────────────────────
// Chronos service worker.
// BUMP THIS VERSION on every deploy that changes any cached file.
const CACHE = 'chronos-v4';

const FILES = [
  './',
  './index.html',
  './state.js',
  './cards.js',
  './trophies.js',
  './sfx.js',
  './i18n.js',
  './game.js',
  './ui.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
  // bgm.js intentionally excluded — large base64 asset, browser cache handles it fine
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).then(resp => {
        const cl = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, cl));
        return resp;
      }).catch(() => caches.match(e.request))
    )
  );
});
