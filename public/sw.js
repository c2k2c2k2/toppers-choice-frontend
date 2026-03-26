const STATIC_CACHE_NAME = "toppers-choice-static-v1"

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== STATIC_CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isStaticShellAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  )
}

async function serveStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) {
    void fetch(request)
      .then((response) => {
        if (response && response.ok) {
          void cache.put(request, response.clone())
        }
      })
      .catch(() => undefined)

    return cached
  }

  const response = await fetch(request)
  if (response && response.ok) {
    void cache.put(request, response.clone())
  }

  return response
}

self.addEventListener("fetch", (event) => {
  const { request } = event

  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === "navigate") {
    return
  }

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/student") ||
    url.pathname.startsWith("/admin")
  ) {
    return
  }

  if (isStaticShellAsset(url)) {
    event.respondWith(serveStaticAsset(request))
  }
})
