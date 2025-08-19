// Service Worker for Provn Platform Performance Optimization
const CACHE_NAME = 'provn-cache-v1';
const STATIC_CACHE_NAME = 'provn-static-v1';
const DYNAMIC_CACHE_NAME = 'provn-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/explore',
  '/manifest.json',
  // Add critical CSS and JS files here
];

// Video/media cache configuration
const MEDIA_CACHE_CONFIG = {
  maxEntries: 50,
  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
};

// API cache configuration
const API_CACHE_CONFIG = {
  maxEntries: 100,
  maxAgeSeconds: 60 * 5, // 5 minutes
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName !== CACHE_NAME
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle video/media requests
  if (isMediaRequest(request)) {
    event.respondWith(handleMediaRequest(request));
    return;
  }
  
  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
});

// API request handler with cache-first strategy for video feeds
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Use cache-first for video feeds to improve performance
  if (url.pathname.includes('/api/explore/feed')) {
    try {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('[SW] Serving cached API response');
        // Fetch fresh data in background
        fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        });
        return cachedResponse;
      }
    } catch (error) {
      console.warn('[SW] Cache lookup failed:', error);
    }
  }
  
  // Network-first for other API requests
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Network request failed:', error);
    
    // Try to serve from cache as fallback
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or error response
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Media request handler with cache-first strategy
async function handleMediaRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving cached media');
      return cachedResponse;
    }
    
    const response = await fetch(request);
    
    if (response.ok) {
      // Only cache smaller media files to avoid storage issues
      const contentLength = response.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 50 * 1024 * 1024) { // 50MB limit
        cache.put(request, response.clone());
      }
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Media request failed:', error);
    return fetch(request);
  }
}

// Static asset handler with cache-first strategy
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('[SW] Static request failed:', error);
    return fetch(request);
  }
}

// Navigation request handler
async function handleNavigationRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Serve cached version of main page
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Helper functions
function isMediaRequest(request) {
  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg|mp3|wav)$/i.test(url.pathname);
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|woff|woff2|ttf|eot|ico|svg)$/i.test(url.pathname) ||
         url.pathname.startsWith('/_next/static/');
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'video-interaction') {
    event.waitUntil(syncVideoInteractions());
  }
});

async function syncVideoInteractions() {
  // Handle offline video interactions (likes, views, etc.)
  console.log('[SW] Syncing video interactions');
}