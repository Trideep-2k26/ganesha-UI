// Service Worker for mobile optimization and offline support
const CACHE_NAME = 'ganesha-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Avoid intercepting Vite dev/module URLs and similar
  const path = url.pathname;
  if (
    path.startsWith('/node_modules') ||
    path.startsWith('/@vite') ||
    path.startsWith('/__vite') ||
    path.startsWith('/@react-refresh') ||
    path.startsWith('/src')
  ) {
    return;
  }

  // Network-first strategy with safe fallback
  event.respondWith((async () => {
    try {
      const networkResp = await fetch(req);
      // Optionally update cache for navigations and static assets
      if (networkResp && networkResp.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, networkResp.clone()).catch(() => {});
      }
      return networkResp;
    } catch (err) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;
      // Fallback to app shell for navigations
      if (req.mode === 'navigate') {
        const shell = await cache.match('/index.html');
        if (shell) return shell;
      }
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});

// Handle updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
