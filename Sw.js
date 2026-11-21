
const CACHE_NAME = "dakhl-kharj-v2";
const FILES = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(FILES.map(async file => {
      try {
        const url = new URL(file, self.registration.scope);
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch (e) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response.ok && new URL(event.request.url).origin === location.origin) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (e) {
      if (event.request.mode === "navigate") {
        return await caches.match(
          new URL("./index.html", self.registration.scope).href
        ) || new Response("برای اجرای برنامه، ابتدا یک بار با اینترنت وارد شوید.");
      }
      return new Response("", { status: 503 });
    }
  })());
});
