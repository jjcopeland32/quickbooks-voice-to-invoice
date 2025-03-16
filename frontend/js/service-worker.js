// Service Worker for QuickBooks Voice-to-Invoice PWA
const CACHE_NAME = 'qb-voice-invoice-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/config.js',
  '/js/invoice.js',
  '/js/voice.js',
  '/assets/favicon.png',
  '/assets/logo192.png',
  '/assets/logo512.png',
  '/manifest.json'
];

// Install service worker and cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - Network first strategy for API, Cache first for assets
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // For API requests, use network-first strategy
  if (requestUrl.pathname.startsWith('/api/') || 
      requestUrl.pathname.startsWith('/auth/')) {
    event.respondWith(networkFirstStrategy(event.request));
  } else {
    // For all other requests, use cache-first strategy
    event.respondWith(cacheFirstStrategy(event.request));
  }
});

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, clone and cache
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME)
        .then((cache) => {
          // Only cache API GET requests
          if (request.method === 'GET') {
            cache.put(request, responseClone);
          }
        });
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache match, return error response
    return new Response(JSON.stringify({ error: 'Network error and no cached data available' }), {
      headers: {'Content-Type': 'application/json'},
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Clone the response and store in cache
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME)
        .then((cache) => {
          cache.put(request, responseClone);
        });
    }
    
    return networkResponse;
  } catch (error) {
    // For non-API resources, return generic offline page if available
    return caches.match('/offline.html')
      .then((offlineResponse) => {
        if (offlineResponse) {
          return offlineResponse;
        }
        
        // If no offline page, return minimal error response
        return new Response('You are offline and the requested resource is not cached.', {
          headers: {'Content-Type': 'text/plain'},
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification',
    icon: '/assets/logo192.png',
    badge: '/assets/badge.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'QuickBooks Voice Invoice', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const url = notification.data.url;
  
  notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true})
      .then((clientList) => {
        // If already open, focus that window
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
}); 