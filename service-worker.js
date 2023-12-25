const CACHE_NAME = 'movie-database-cache';
const urlsToCache = [
  '/',
  '/service-worker.js',
  '/css/bulma.min.css',
  '/css/styles.css',
  // Add other files that you want to cache
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
