const CACHE_NAME = "healthmate-v1";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [OFFLINE_URL];

// ── Install: pre-cache the offline fallback ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: remove stale caches ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// ── Fetch: tiered caching strategy ────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from same origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Skip API routes, Firebase, and HMR websocket
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname.includes("__nextjs")
  )
    return;

  // Cache-first for Next.js static chunks (immutable, hashed filenames)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, res.clone()));
            }
            return res;
          })
      )
    );
    return;
  }

  // Network-first for pages — fall back to cache, then offline page
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, res.clone()));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match(OFFLINE_URL))
      )
  );
});
