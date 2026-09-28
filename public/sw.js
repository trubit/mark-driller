// MarkDriller Production Service Worker (PWA Shell Caching & Offline Resilience)
// Explicitly ignores API endpoints, authenticated calls, payment webhooks, and navigation requests.

const CACHE_NAME = 'markdriller-shell-v4';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
];

// Install: Immediately activate new service worker without waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: Purge ALL obsolete version caches (v1, v2, v3, etc.) and take immediate control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('[SW] Purging obsolete cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Pure pass-through with zero interference on HTML navigation or API calls
self.addEventListener('fetch', (event) => {
  // 1. NEVER intercept top-level HTML navigation requests (/dashboard, /login, /, etc.)
  // Letting the browser handle navigation natively completely eliminates the WebKit/iOS
  // "ERR_FAILED" / "This site can't be reached" failure mode where a Service Worker respondWith()
  // resolves to undefined or fails during cellular network / QUIC transitions.
  if (
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
    return;
  }

  // 2. NEVER intercept API requests, non-GET, or external origins
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Pass-through: do NOT call event.respondWith() so native browser HTTP cache handles all assets
});
