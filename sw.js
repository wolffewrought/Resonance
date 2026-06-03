/* Resonance v2 — Service Worker (offline-first) */
const CACHE = 'resonance-v2';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Cache-first for app shell, network-first for everything else
  if (ASSETS.some(a => e.request.url.endsWith(a) || e.request.url.endsWith('/'))) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  } else {
    // For media files — just pass through (files are blob URLs, not cached)
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  }
});
