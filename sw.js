const CACHE_NAME = 'entrega-livre-v1';

// Recursos estáticos para cache no install
const STATIC_ASSETS = [
  '/entrega-livre/',
  '/entrega-livre/index.html',
  '/entrega-livre/manifest.json',
  '/entrega-livre/logo.png',
];

// Install: pré-cacheia assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first para API, cache-first para estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET e chamadas à API
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    // Tenta rede primeiro para garantir dados frescos
    fetch(request)
      .then((response) => {
        // Só cacheia respostas válidas de mesma origem ou estáticos
        if (response.ok && (url.origin === self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: tenta servir do cache
        return caches.match(request).then(
          (cached) => cached || caches.match('/entrega-livre/')
        );
      })
  );
});
