//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ================ R55 · Service Worker (Offline Support) ================ //
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CACHE_NAME = 'r55-cache-v2'; // Incrementa esto cuando hagas cambios mayores

// Activos estáticos esenciales para que la app funcione offline
const STATIC_ASSETS = [
  'https://radio-tekileros.vercel.app/Freysita.html',
  'https://radio-tekileros.vercel.app/Repro55.css',
  'https://radio-tekileros.vercel.app/Player55.js',
  'https://radio-tekileros.vercel.app/Repro55.js',
  'https://radio-tekileros.vercel.app/sw55.js',
  'https://santi-graphics.vercel.app/assets/iPod.ico',
  // Precachear las 12 portadas base para que el carrusel inicial sea instantáneo
  'https://santi-graphics.vercel.app/assets/covers/Cover1.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover2.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover3.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover4.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover5.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover6.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover7.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover8.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover9.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover10.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover11.png',
  'https://santi-graphics.vercel.app/assets/covers/Cover12.png',
  // Librerías externas (opcional, pero garantiza funcionamiento offline total)
  'https://code.jquery.com/jquery-3.7.1.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/1.1.2/tailwind.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js'
];

// ============================================================================
// 1. INSTALACIÓN: Precachear activos estáticos esenciales
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precacheando activos estáticos');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Error al precachear algunos activos (puede ser por CORS o offline):', err);
      });
    }).then(() => self.skipWaiting()) // Forzar activación inmediata
  );
});

// ============================================================================
// 2. ACTIVACIÓN: Limpiar cachés antiguas para liberar espacio
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando nuevo Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Tomar control de todas las pestañas abiertas
  );
});

// ============================================================================
// 3. INTERCEPCIÓN DE SOLICITUDES (Estrategias Híbridas con Caché de Audio)
// ============================================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A) CACHE FIRST: App Shell, JS, CSS, Imágenes, Fuentes
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    url.pathname === '/' || url.pathname.endsWith('.html')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // B) NETWORK FIRST con FALLBACK: JSONs de playlists
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // C) NETWORK FIRST con CACHEO EXPLÍCITO: Archivos de Audio (.mp3, etc.)
  // Garantiza que si se reprodujo online, quedará guardada para offline.
  if (event.request.destination === 'audio' || url.pathname.endsWith('.mp3') || url.pathname.endsWith('.wav')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Clonar la respuesta para guardarla en la caché del SW
            try {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            } catch (err) {
              // Si el body ya fue consumido, no podemos cachearlo (normal en streaming)
              console.warn('[SW] No se pudo cachear audio (body ya consumido):', url.pathname);
            }
          }
          return networkResponse;
        })
        .catch(() => {
          // Si no hay internet, servir la versión guardada en caché
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response('Offline: Audio no disponible en caché', { status: 503 });
          });
        })
    );
    return;
  }

  // D) Fallback por defecto
  event.respondWith(fetch(event.request));
});