/* ============ R53 · Service Worker (Offline Support) ============ */
const CACHE_NAME = 'r53-cache-v1';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/Repro53.css',
  '/Repro53.js',
  '/Player53.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/1.1.2/tailwind.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://code.jquery.com/jquery-3.7.1.min.js',
  'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Roboto+Mono:wght@500;700&display=swap',
  'https://santi-graphics.vercel.app/assets/Spotune.ico',
  'https://santi-graphics.vercel.app/assets/covers/Cover1.png'
];

/* ---- Instalación: cachea assets críticos ---- */
self.addEventListener('install', event => {
  console.log('SW: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cacheando assets estáticos');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/* ---- Activación: limpia cachés viejos ---- */
self.addEventListener('activate', event => {
  console.log('SW: Activando...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('SW: Eliminando caché viejo', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* ---- Fetch: estrategia híbrida ---- */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 1) Para audios e imágenes: Network First + Cache Fallback
  if (url.pathname.includes('/audio') || url.pathname.includes('/cover') || url.hostname.includes('iraked.github.io')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si la respuesta es válida, la cacheamos
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
              console.log('SW: Cacheado', url.pathname);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, intenta servir desde caché
          return caches.match(event.request).then(cached => {
            if (cached) {
              console.log('SW: Sirviendo desde caché (offline)', url.pathname);
              return cached;
            }
            // Si no está en caché, devuelve un error personalizado
            return new Response('', { status: 404, statusText: 'Not Found (Offline)' });
          });
        })
    );
    return;
  }
  
  // 2) Para el JSON: Network First + Cache Fallback (datos frescos cuando hay red)
  if (url.pathname.includes('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
              console.log('SW: JSON actualizado en caché');
            });
          }
          return response;
        })
        .catch(() => {
          console.log('SW: JSON offline, sirviendo desde caché');
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 3) Para el resto: Cache First (assets estáticos)
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});

/* ---- Mensajes desde la app ---- */
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data.type === 'CACHE_AUDIO') {
    // Permite cachear audios manualmente
    caches.open(CACHE_NAME).then(cache => {
      cache.add(event.data.url).then(() => {
        console.log('SW: Audio cacheado manualmente', event.data.url);
      });
    });
  }
});