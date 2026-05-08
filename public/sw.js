/// <reference lib="webworker" />

// ============================================
// MindFlow — Service Worker for PWA
// Provides offline caching and push notifications
// ============================================

const CACHE_NAME = "mindflow-v1";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/signup",
  "/manifest.json",
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  (event as any).waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  (self as any).skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  (event as any).waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  (self as any).clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const fetchEvent = event as any;
  const request = fetchEvent.request as Request;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API requests (always go to network)
  if (request.url.includes("/api/")) return;

  fetchEvent.respondWith(
    fetch(request)
      .then((response: Response) => {
        // Clone the response and cache it
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((cachedResponse: Response | undefined) => {
          return cachedResponse || new Response("Offline", { status: 503 });
        });
      })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  const pushEvent = event as any;
  const data = pushEvent.data?.json() ?? {};

  const options = {
    body: data.body || "You have a new reminder!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/dashboard/reminders",
    },
    actions: [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  pushEvent.waitUntil(
    (self as any).registration.showNotification(data.title || "MindFlow Reminder", options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  const notifEvent = event as any;
  notifEvent.notification.close();

  if (notifEvent.action === "dismiss") return;

  const url = notifEvent.notification.data?.url || "/dashboard";
  notifEvent.waitUntil(
    (self as any).clients.matchAll({ type: "window" }).then((clientList: any[]) => {
      // Focus existing window or open new one
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return (self as any).clients.openWindow(url);
    })
  );
});

export {};
