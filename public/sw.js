const CACHE_VERSION = 'v2';
const CACHE_NAME = `floppy-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/library',
  '/collections',
  '/about',
  '/settings',
  '/releases',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-192x192.png',
  '/icon-maskable-512x512.png',
  '/apple-icon-180x180.png',
  '/libarchive.js',
  '/libarchive.wasm',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with error handling for individual failures
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('floppy-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Helper to determine caching strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Next.js static assets - cache first (immutable, hashed filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    return 'cache-first';
  }

  // App pages and API routes - stale-while-revalidate
  if (
    url.pathname === '/' ||
    url.pathname === '/library' ||
    url.pathname === '/collections' ||
    url.pathname === '/about' ||
    url.pathname === '/settings' ||
    url.pathname === '/releases' ||
    url.pathname.startsWith('/reader/')
  ) {
    return 'stale-while-revalidate';
  }

  // Static files (icons, wasm, etc.) - cache first
  if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.wasm') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    return 'cache-first';
  }

  // Default - network first
  return 'network-first';
}

// Cache-first strategy: try cache, fallback to network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    throw error;
  }
}

// Stale-while-revalidate: return cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await caches.match(request);

  // Fetch in background regardless of cache hit
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // No cache, wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Fallback for navigation
  if (request.mode === 'navigate') {
    return caches.match('/');
  }

  return new Response('Offline', { status: 503 });
}

// Network-first strategy: try network, fallback to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }

    return new Response('Offline', { status: 503 });
  }
}

// Fetch event handler
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip external requests (only cache same-origin)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const strategy = getCacheStrategy(event.request);

  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(event.request));
      break;
    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(event.request));
      break;
    case 'network-first':
    default:
      event.respondWith(networkFirst(event.request));
      break;
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
