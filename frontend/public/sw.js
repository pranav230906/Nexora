const CACHE_NAME = 'last-minute-cache-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only cache GET requests and skip extensions or chrome modules
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache new successful requests
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          // If HTML request failed, serve fallback index.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html')
          }
        })
      })
  )
})
