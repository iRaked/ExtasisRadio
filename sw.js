// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌀 SERVICE WORKER SPOTIFLY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CACHE_NAME = "spotifly-core-v1";
const TRACKS_CACHE = "spotifly-tracks";

// Archivos base de tu app (HTML, CSS, JS, JSON internos)
const CORE_ASSETS = [
  "/SpotiflyPremium.html",
  "/SpotiflyPremium.css",
  "/SpotiflyPremium.js",
  "/SpotiflyResposive.css",
  "/SpotiflyPremiumDynamic.css",
  "/SpotiflyPremiumDynamic.js",
  "/SpotiflyPremium.json",
  "/Achievements.json",
  "/sw.js"
];

// Playlists externas (se cachean en instalación para pruebas)
const PLAYLISTS = [
  "https://radio-tekileros.vercel.app/Rumba.json",
  "https://radio-tekileros.vercel.app/Actual.json",
  "https://radio-tekileros.vercel.app/Exitos.json",
  "https://radio-tekileros.vercel.app/HardCore.json",
  "https://radio-tekileros.vercel.app/BaladasRock.json",
  "https://radio-tekileros.vercel.app/Bandida.json",
  "https://radio-tekileros.vercel.app/ViñaRock.json"
];

// Instalación: cachear assets básicos y playlists externas
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...CORE_ASSETS, ...PLAYLISTS]);
    })
  );
});

// Activación: limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== TRACKS_CACHE)
            .map(k => caches.delete(k))
      )
    )
  );
});

// Interceptar peticiones
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Si es un track de audio, buscar en cache de tracks
  if (req.url.endsWith(".mp3") || req.url.endsWith(".wav")) {
    event.respondWith(
      caches.open(TRACKS_CACHE).then(cache =>
        cache.match(req).then(res => {
          return res || fetch(req).then(networkRes => {
            cache.put(req, networkRes.clone());
            return networkRes;
          });
        })
      )
    );
    return;
  }

  // Para otros recursos (HTML, CSS, JS, JSON), usar cache primero
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});