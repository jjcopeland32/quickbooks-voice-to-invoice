// Service Worker for QuickBooks Voice-to-Invoice
const CACHE_NAME = 'qb-voice-invoice-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/voice-recognition.js',
  '/js/invoice-form.js',
  '/manifest.json',
  '/assets/logo.svg',
  '/assets/favicon.svg',
  '/assets/favicon.png',
  '/assets/logo192.png',
  '/assets/logo512.png',
  '/assets/mic-wave.svg',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        // Pre-cache offline page and static assets
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting forces activation on first page load
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        console.log('[Service Worker] Now ready to handle fetches!');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip requests to API endpoints
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // For page navigations, use a cache-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If fetch fails, return the offline page
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // For assets, use a stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response immediately, then update cache in background
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Don't cache responses that aren't successful (status in the range 200-299)
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Clone the response before we put it in the cache
            const responseToCache = networkResponse.clone();
            
            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch((error) => {
            console.log('[Service Worker] Fetch failed; returning cached page instead.', error);
            // Fall back to cache if network fetch fails
            return cachedResponse;
          });
          
        return cachedResponse || fetchPromise;
      })
  );
});

// Message event - handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received', event);
  
  const title = 'QuickBooks Voice-to-Invoice';
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/assets/logo192.png',
    badge: '/assets/favicon.png'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
}); 