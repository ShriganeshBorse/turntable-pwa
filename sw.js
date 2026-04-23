const CACHE_NAME = 'turntable-v2';
const CACHE_FILES = [
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Install: pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//  - Different origin (ESP API, CDN): always network
//  - Same origin navigation: network-first (fall back to index.html for offline)
//  - Same origin assets: cache-first
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for cross-origin requests (ESP API, CDN)
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for page navigations
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for same-origin assets (html, svg, json)
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
