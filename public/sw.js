// Service worker intentionally disabled for now.
// Existing users should unregister old service workers in DevTools once.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // no-op
});
