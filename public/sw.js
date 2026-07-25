const CACHE_NAME = 'okashi-shogi-v12'
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './app-icon-192.png',
  './app-icon-512.png',
  './app-icon-maskable-512.png',
  './app-apple-touch-icon.png',
  './pieces/lion.svg',
  './pieces/giraffe.svg',
  './pieces/elephant.svg',
  './pieces/chick.svg',
  './pieces/hen.svg',
  './pieces/sweets/wagashi/lion.png',
  './pieces/sweets/wagashi/giraffe.png',
  './pieces/sweets/wagashi/elephant.png',
  './pieces/sweets/wagashi/chick.png',
  './pieces/sweets/wagashi/hen.png',
  './pieces/sweets/western/lion.png',
  './pieces/sweets/western/giraffe.png',
  './pieces/sweets/western/elephant.png',
  './pieces/sweets/western/chick.png',
  './pieces/sweets/western/hen.png',
  './pieces/sweets/mix/lion.png',
  './pieces/sweets/mix/giraffe.png',
  './pieces/sweets/mix/elephant.png',
  './pieces/sweets/mix/chick.png',
  './pieces/sweets/mix/hen.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(() => caches.match('./index.html')),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()))
      return response
    })),
  )
})
