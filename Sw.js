const CACHE = 'dakhl-kharj-static-v5';
const FILES = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    for (const file of FILES) {
      try {
        await cache.add(file);
      } catch (error) {
        console.log('Cache skipped:', file);
      }
    }

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key => key.startsWith('dakhl-kharj-') && key !== CACHE)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);

    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        return await caches.match('./index.html') ||
          new Response('برنامه هنوز بارگذاری نشده است.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
      }

      return new Response('', { status: 503 });
    }
  })());
});
