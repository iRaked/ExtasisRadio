//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ================ R55 · Service Worker (Offline & Audio Cache) ================ //
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CACHE_NAME = 'r55-cache-v3'; // ⚠️ Versión nueva para forzar limpieza de cachés rotas

// Activos esenciales (Rutas relativas para el dominio principal, absolutas solo para CDNs)
const CACHE_ASSETS = [
  '/Freysita.html',
  '/Repro55.css',
  '/Repro55.js',
  '/Player55.js',
  '/sw55.js',
  'https://santi-graphics.vercel.app/assets/iPod.ico',
  'https://code.jquery.com/jquery-3.7.1.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/1.1.2/tailwind.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js'
];

// Dominios de confianza permitidos para caché (Evita errores de CORS)
const ALLOWED_DOMAINS = [
  'radio-tekileros.vercel.app',
  'xat-music4.vercel.app',
  'santi-graphics.vercel.app',
  'iraked.github.io',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'code.jquery.com'
];

// ============================================================================
// 1. INSTALACIÓN: Precachear App Shell (con tolerancia a fallos)
// ============================================================================
self.addEventListener('install', event => {
  console.log('[SW R55] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        const results = await Promise.allSettled(
          CACHE_ASSETS.map(url => cache.add(url).catch(err => {
            console.warn('[SW R55] No se pudo cachear asset:', url, err);
          }))
        );
        console.log('[SW R55] Precacheo completado');
        return true;
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================================================
// 2. ACTIVACIÓN: Limpiar cachés antiguas
// ============================================================================
self.addEventListener('activate', event => {
  console.log('[SW R55] Activando y purgando cachés obsoletas...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW R55] Eliminando caché vieja:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================================
// 3. INTERCEPCIÓN DE SOLICITUDES (Estrategias Híbridas)
// ============================================================================
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  let url;
  try { url = new URL(event.request.url); } catch(e) { return; }

  // Verificar si el dominio es permitido (evita intentar cachear cosas de terceros no autorizadas)
  const isAllowed = ALLOWED_DOMAINS.some(domain => url.hostname.includes(domain)) || url.origin === self.location.origin;
  if (!isAllowed) return;

  // 🎵 1) AUDIOS: CACHE FIRST (La clave del offline)
  if (event.request.destination === 'audio' || url.pathname.match(/\.(mp3|wav|ogg|m4a|aac)$/i) || url.hostname.includes('xat-music4')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          console.log('[SW R55] 🎵 Sirviendo audio desde caché:', url.pathname);
          return cached;
        }
        // Si no está en caché, lo bajamos y lo guardamos para la próxima
        return fetch(event.request).then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone).catch(() => {}));
          }
          return response;
        }).catch(() => new Response('', { status: 404, statusText: 'Offline: Audio no cacheado' }));
      })
    );
    return;
  }

  // 🖼️ 2) IMÁGENES (Covers): CACHE FIRST
  if (event.request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|webp|ico)$/i)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
          return networkResponse;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // 📜 3) JSONs (Playlists): STALE-WHILE-REVALIDATE
  if (url.pathname.includes('.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {});
          
          // Devuelve la caché inmediatamente si existe, si no, espera a la red
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 💻 4) APP SHELL (HTML, CSS, JS): CACHE FIRST
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        return new Response('Offline: Recurso no disponible', { status: 503 });
      });
    })
  );
});

// ============================================================================
// 4. MENSAJERÍA (Para forzar actualización desde el cliente si es necesario)
// ============================================================================
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});