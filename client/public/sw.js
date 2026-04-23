// MiniMorph Studios Service Worker — PWA offline support + Push Notifications
const CACHE_NAME = "minimorph-v3";
const STATIC_ASSETS = ["/", "/manifest.json"];

// Install: cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first strategy to avoid stale module caching
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always go to network for API calls
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Never cache Vite internal files, HMR, or node_modules
  if (
    url.pathname.includes("node_modules") ||
    url.pathname.includes(".vite") ||
    url.pathname.includes("@vite") ||
    url.pathname.includes("@fs/") ||
    url.pathname.includes("__vite") ||
    url.pathname.includes("@react-refresh")
  ) {
    return;
  }

  // Network-first for navigation (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Network-first for JS/TS module files to avoid stale bundles
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".mjs") ||
    url.pathname.endsWith(".ts") ||
    url.pathname.endsWith(".tsx") ||
    url.pathname.endsWith(".jsx") ||
    request.destination === "script"
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for truly static assets (images, fonts, CSS)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || "You have a new notification",
      icon: data.icon || "/icons/icon-192x192.png",
      badge: data.badge || "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        { action: "open", title: "Open" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };
    event.waitUntil(
      self.registration.showNotification(data.title || "MiniMorph Studios", options)
    );
  } catch (err) {
    console.error("[SW] Push parse error:", err);
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const url = event.notification.data?.url || "/rep";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
