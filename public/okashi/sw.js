const CACHE_NAME = 'okashi-shogi-subpath-v7'
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  '../pieces/sweets/wagashi/lion.png',
  '../pieces/sweets/wagashi/giraffe.png',
  '../pieces/sweets/wagashi/elephant.png',
  '../pieces/sweets/wagashi/chick.png',
  '../pieces/sweets/wagashi/hen.png',
  '../pieces/sweets/western/lion.png',
  '../pieces/sweets/western/giraffe.png',
  '../pieces/sweets/western/elephant.png',
  '../pieces/sweets/western/chick.png',
  '../pieces/sweets/western/hen.png',
  '../pieces/sweets/mix/lion.png',
  '../pieces/sweets/mix/giraffe.png',
  '../pieces/sweets/mix/elephant.png',
  '../pieces/sweets/mix/chick.png',
  '../pieces/sweets/mix/hen.png',
]

async function precacheApp() {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(APP_SHELL)
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await precacheApp()
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys.filter((key) => key.startsWith('okashi-shogi-subpath-') && key !== CACHE_NAME).map((key) => caches.delete(key)),
    )
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')))
    return
  }
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()))
    return response
  })))
})
