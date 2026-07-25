const CACHE_NAME = 'board-games-pwa-v1'
const APP_SHELL = [
  './',
  './index.html',
  './okashi/',
  './okashi/index.html',
  './okashi/manifest.webmanifest',
  './okashi/apple-touch-icon.png',
  './okashi/icon-192.png',
  './okashi/icon-512.png',
  './okashi/icon-maskable-512.png',
  './samurai/',
  './samurai/index.html',
  './samurai/manifest.webmanifest',
  './samurai/apple-touch-icon.png',
  './samurai/icon-192.png',
  './samurai/icon-512.png',
  './samurai/icon-maskable-512.png',
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
  './pieces/samurai/lion.png',
  './pieces/samurai/lion-mounted.png',
  './pieces/samurai/lion-mounted-sword.png',
  './pieces/samurai/giraffe.png',
  './pieces/samurai/elephant.png',
  './pieces/samurai/chick.png',
  './pieces/samurai/hen.png',
]

const HTML_SHELLS = [
  './index.html',
  './okashi/index.html',
  './samurai/index.html',
]

async function precacheApp() {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(APP_SHELL)

  const linkedAssets = new Set()
  for (const path of HTML_SHELLS) {
    const response = await cache.match(path)
    if (!response) continue
    const html = await response.text()
    for (const [, linkedPath] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const url = new URL(linkedPath, new URL(path, self.location.href))
      if (url.origin === self.location.origin) linkedAssets.add(url.href)
    }
  }
  await cache.addAll([...linkedAssets])
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await precacheApp()
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const oldCachePrefixes = [
      'board-games-pwa-',
      'okashi-shogi-v',
      'okashi-shogi-subpath-',
      'samurai-shogi-subpath-',
    ]
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter(key => oldCachePrefixes.some(prefix => key.startsWith(prefix)) && key !== CACHE_NAME)
        .map(key => caches.delete(key)),
    )
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(event.request, response.clone())
        }
        return response
      } catch {
        const exact = await caches.match(event.request, { ignoreSearch: true })
        if (exact) return exact

        const pathname = new URL(event.request.url).pathname
        if (pathname.includes('/okashi/')) return caches.match('./okashi/index.html')
        if (pathname.includes('/samurai/')) return caches.match('./samurai/index.html')
        return caches.match('./index.html')
      }
    })())
    return
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreSearch: true })
    if (cached) return cached

    const response = await fetch(event.request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(event.request, response.clone())
    }
    return response
  })())
})
