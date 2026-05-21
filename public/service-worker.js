const CACHE_NAME = 'leadflow-crm-v1'
const OFFLINE_URL = '/offline.html'

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/login',
        '/signup',
      ]).catch(() => {
        // Ignore errors during install
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip API calls - let them go through
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // For navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type !== 'error'
            ) {
              const responseClone = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return networkResponse
          })
          .catch(() => {
            // Return cached response if network fails
            return caches.match(request)
          })
      )
    })
  )
})

// Handle background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leads') {
    event.waitUntil(syncOfflineLeads())
  }
})

async function syncOfflineLeads() {
  try {
    const db = await openDB('leadflow-offline')
    const pendingLeads = await db.getAll('pending-leads')

    for (const lead of pendingLeads) {
      try {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead.data),
        })
        await db.delete('pending-leads', lead.id)
      } catch (error) {
        console.error('[v0] Sync error:', error)
      }
    }
  } catch (error) {
    console.error('[v0] Background sync error:', error)
  }
}

async function openDB(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pending-leads')) {
        db.createObjectStore('pending-leads', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}
