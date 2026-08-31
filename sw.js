// V7: minimal PWA service worker. Only caches the app shell (this page + the manifest) so the
// dashboard can still open when there's no connection. Every API call (Hebcal, Sefaria, Open-Meteo,
// rss2json, Google Fonts) is cross-origin and deliberately left untouched below, so data is always
// fetched fresh - a stale cached zman/holiday would be actively wrong, unlike a cached app shell.
const CACHE_NAME = 'dashboard-shell-v7';
const SHELL_FILES = ['./', './index.html', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let all external API calls pass through untouched

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
