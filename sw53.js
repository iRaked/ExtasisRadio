/* ============ R53 · Service Worker (Offline & Audio Cache) ============ */
const CACHE_NAME = 'r53-cache-v4';
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
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Roboto+Mono:wght@500;700&display=swap'
];

/* ---- Instalación ---- */
self.addEventListener('install', event => {
  console.log('SW: Instalando R53...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        const results = await Promise.allSettled(
          CACHE_ASSETS.map(url => cache.add(url).catch(err => {
            console.warn('SW: No se pudo cachear asset estático', url);
          }))
        );
        return true;
      })
      .then(() => self.skipWaiting())
  );
});

/* ---- Activación ---- */
self.addEventListener('activate', event => {
  console.log('SW: Activando nuevo SW y purgando cachés obsoletos...');
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

/* ---- Fetch ---- */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  let url;
  try { url = new URL(event.request.url); } catch(e) { return; }

  const esCDN = url.hostname.includes('cdnjs.cloudflare.com') ||
                url.hostname.includes('cdn.jsdelivr.net') ||
                url.hostname.includes('fonts.googleapis.com') ||
                url.hostname.includes('fonts.gstatic.com') ||
                url.hostname.includes('iraked.github.io') ||
                url.hostname.includes('santi-graphics.vercel.app') ||
                url.hostname.includes('xat-music2.vercel.app');

  if (url.origin !== self.location.origin && !esCDN) return;

  // 1) AUDIOS: Cache First (si está cacheado, no toca la red)
  if (url.pathname.includes('/audio') || 
      url.hostname.includes('xat-music2.vercel.app')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.ok){
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone).catch(()=>{}));
          }
          return response;
        }).catch(() => new Response('', { status: 404, statusText: 'Offline' }));
      })
    );
    return;
  }

  // 2) IMÁGENES: Cache First
  if (url.pathname.includes('/cover') || 
      url.pathname.match(/\.(png|jpg|jpeg|webp)$/i)) {
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

  // 3) JSONs: Stale-While-Revalidate
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
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 4) Resto: Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        return new Response('', { status: 404, statusText: 'Offline' });
      });
    })
  );
});

/* ---- Mensajes ---- */
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});