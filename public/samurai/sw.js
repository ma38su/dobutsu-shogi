const CACHE_NAME = 'samurai-shogi-subpath-v4'
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  '../pieces/samurai/lion.png',
  '../pieces/samurai/lion-mounted.png',
  '../pieces/samurai/lion-mounted-sword.png',
  '../pieces/samurai/giraffe.png',
  '../pieces/samurai/elephant.png',
  '../pieces/samurai/chick.png',
  '../pieces/samurai/hen.png',
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
      keys.filter((key) => key.startsWith('samurai-shogi-subpath-') && key !== CACHE_NAME).map((key) => caches.delete(key)),
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
