const CACHE_NAME = 'entrega-livre-v2';
const API_CACHE_NAME = 'entrega-livre-api-v2';

// Recursos estáticos para cache no install
const STATIC_ASSETS = [
  '/entrega-livre/',
  '/entrega-livre/index.html',
  '/entrega-livre/manifest.json',
  '/entrega-livre/logo.png',
];

// Endpoints da API que mudam pouco — cacheamos com stale-while-revalidate
// para que o app abra instantaneamente mesmo com internet lenta
const SWR_API_PATTERNS = [
  /\/api\/auth\/me$/,
  /\/api\/planos$/,
  /\/api\/restaurantes(\?.*)?$/,
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
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: estratégias diferenciadas por tipo de recurso
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Endpoints de API com stale-while-revalidate (resposta imediata + atualiza em fundo)
  const isSwrApi = SWR_API_PATTERNS.some((p) => p.test(url.pathname + url.search));
  if (isSwrApi) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => cached); // offline: usa cache sem erros

        // Se existe cache, retorna imediatamente e atualiza em paralelo
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Outras chamadas à API: network-only (dados em tempo real não devem ser cacheados)
  if (url.pathname.startsWith('/api/')) return;

  // Estáticos: network-first com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached || caches.match('/entrega-livre/')
        )
      )
  );
});
