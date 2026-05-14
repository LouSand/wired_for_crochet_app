/**
 * Service Worker for Wired for Crochet PWA
 * Handles push notifications and basic caching.
 * This is a placeholder that can be expanded later.
 */

const CACHE_NAME = 'wired-for-crochet-v1'

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
      ])
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
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Push event - show notification
self.addEventListener('push', (event) => {
  const defaultData = {
    title: 'Wired for Crochet',
    body: 'You have a new notification',
    icon: '/next.svg',
    badge: '/next.svg',
    url: '/',
  }

  let data = defaultData
  try {
    if (event.data) {
      data = { ...defaultData, ...event.data.json() }
    }
  } catch (e) {
    // Use default data if parsing fails
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url },
    })
  )
})

// Notification click - open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url)
    })
  )
})
