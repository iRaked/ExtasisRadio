//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 INICIALIZACIÓN Y ESTADO GLOBAL (MODO LOCAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let gestureDetected = false;
let trackData = [];
let currentTrack = null;
let currentPlaylistName = "actual";
let currentMode = "music"; // "music" o "playlists"
let currentPlaylistIndex = 0; // Controla qué playlist está en el centro del carrusel
let hasDragged = false; // Eevita clics falsos tras arrastrar

let repeatActive = false;
let shuffleActive = false;

// Esperar a que Player55.js termine de construir el DOM
window.addEventListener('player-dom-ready', () => {

const audio = document.getElementById("audio");

// Elementos de metadatos y controles
const TRACK_TITLE_EL    = document.getElementById("trackTitle");
const TRACK_ARTIST_EL   = document.getElementById("trackArtist");
const TRACK_DURATION_EL = document.getElementById("trackDuration");
const currentTimeEl     = document.getElementById("currentTime");
const totalDurationEl   = document.getElementById("totalDuration");
const progressBar       = document.getElementById("progressBar");
const progressContainer = document.getElementById("progressContainer");
const TRACK_PLAYLIST_EL = document.getElementById("trackPlaylist");

// Botones de control
const btnPlayPause = document.getElementById("btnPlayPause");
const btnPrev      = document.getElementById("btnPrev");
const btnNext      = document.getElementById("btnNext");
const btnShuffle   = document.getElementById("btnShuffle");
const btnRepeat    = document.getElementById("btnRepeat");

// Referencias de UI
const covers = document.querySelectorAll(".carousel-arc .arc-cover");
const navIcons = document.querySelectorAll(".nav-icons-arc .nav-ico");
const contentOverlay = document.getElementById("contentOverlay");
const contentSections = document.querySelectorAll(".content-section");
const btnFavorite = document.getElementById("btnFavorite");

// Guardar las rutas de las carátulas originales del HTML
const originalCoverImages = Array.from(covers).map(cover => {
  const img = cover.querySelector("img");
  return img ? img.src : "";
});

// ============================================================================
// Caché de imágenes en memoria (evita re-descargar imágenes ya vistas)
// ============================================================================
const imageCache = new Map();

function obtenerImagenConCache(url) {
  if (!url) return "https://santi-graphics.vercel.app/assets/SG.ico";
  
  if (imageCache.has(url)) {
    return imageCache.get(url); // ← Ya está en memoria, no hace fetch
  }
  
  const img = new Image();
  img.src = url;
  img.onload = () => imageCache.set(url, url);
  imageCache.set(url, url);
  
  return url;
}

function precargarImagenesEnLote(urls) {
  urls.forEach(url => {
    if (url && !imageCache.has(url)) {
      const img = new Image();
      img.src = url;
      img.onload = () => imageCache.set(url, url);
      imageCache.set(url, url);
    }
  });
  console.log(`🖼️ Pre-cargadas ${urls.length} imágenes en caché de memoria`);
}

// ============================================================================
// Catálogo oficial de listas (25 Playlists)
// ============================================================================
const PLAYLISTS_MAP = [
  { key: "actual",         nombre: "Actual",            file: "https://radio-tekileros.vercel.app/Actual.json",            clave: "actual",         coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover6.png" },
  { key: "exitos",         nombre: "Éxitos",            file: "https://radio-tekileros.vercel.app/Exitos.json",            clave: "exitos",         coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover12.png" },
  { key: "hardcore",    nombre: "Ruido de Lata",     file: "https://radio-tekileros.vercel.app/HardCore.json",       clave: "hardcore",    coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover1.png" },
  { key: "baladasrock",    nombre: "Baladas Rock",      file: "https://radio-tekileros.vercel.app/BaladasRock.json",       clave: "baladasrock",    coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover8.png" },
  { key: "rumba",          nombre: "Rumba",             file: "https://radio-tekileros.vercel.app/Rumba.json",             clave: "rumba",          coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover2.png" },
  { key: "pelusos",        nombre: "Agropecuarios",           file: "https://radio-tekileros.vercel.app/Pelusos.json",           clave: "pelusos",        coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover9.png" },
  { key: "vina_rock",      nombre: "Viña Rock",         file: "https://radio-tekileros.vercel.app/ViñaRock.json",          clave: "vina_rock",      coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover10.png" },
  { key: "heavymetal",     nombre: "Heavy Metal",       file: "https://radio-tekileros.vercel.app/HeavyMetal.json",        clave: "heavymetal",     coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover11.png" },
  { key: "razteca",        nombre: "Festival Razteca",  file: "https://radio-tekileros.vercel.app/Razteca.json",   clave: "razteca",        coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover7.png" },
  { key: "soytribu",       nombre: "Soy Tribu",         file: "https://radio-tekileros.vercel.app/SoyTribu.json",          clave: "soytribu",       coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover8.png" },
  { key: "rimas",          nombre: "Rimas",             file: "https://radio-tekileros.vercel.app/Rimas.json",             clave: "rimas",          coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover11.png" },
  { key: "globalbeats",    nombre: "Global Beats",      file: "https://radio-tekileros.vercel.app/GlobalBeats.json",       clave: "globalbeats",    coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover5.png" },
  { key: "Idioma", nombre: "Rock en tu Idioma", file: "https://radio-tekileros.vercel.app/RockIdioma.json",    clave: "Idioma", coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover10.png" },
  { key: "caribe360",      nombre: "Caribe 360",        file: "https://radio-tekileros.vercel.app/Caribe360.json",         clave: "caribe360",      coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover2.png" },
  { key: "lacantina",      nombre: "La Cantina",        file: "https://radio-tekileros.vercel.app/LaCantina.json",         clave: "lacantina",      coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover4.png" },
  { key: "larevancha",     nombre: "La Revancha",       file: "https://radio-tekileros.vercel.app/LaRevancha.json",        clave: "larevancha",     coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover8.png" },
  { key: "latidos",        nombre: "Latidos",           file: "https://radio-tekileros.vercel.app/Latidos.json",           clave: "latidos",        coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover3.png" },
  { key: "pielapiel",      nombre: "Piel a Piel",       file: "https://radio-tekileros.vercel.app/PielAPiel.json",         clave: "pielapiel",      coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover2.png" },
  { key: "neonnight",      nombre: "Neon Night",        file: "https://radio-tekileros.vercel.app/NeonNight.json",         clave: "neonnight",      coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover5.png" },
  { key: "metanero",       nombre: "Metañero",          file: "https://radio-tekileros.vercel.app/Metañero.json",          clave: "metanero",       coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover11.png" },
  { key: "furiarosa",      nombre: "Furia Rosa",        file: "https://radio-tekileros.vercel.app/FuriaRosa.json",         clave: "furiarosa",      coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover10.png" },
  { key: "rockcumbiero",   nombre: "Rock Cumbiero",     file: "https://radio-tekileros.vercel.app/RockCumbiero.json",      clave: "rockcumbiero",   coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover2.png" },
  { key: "rockagropecuario",nombre: "Rock Agropecuario", file: "https://radio-tekileros.vercel.app/RockAgropecuario.json",  clave: "rockagropecuario",coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover9.png" },
  { key: "rockbar",        nombre: "Rock Bar",          file: "https://radio-tekileros.vercel.app/RockBar.json",           clave: "rockbar",        coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover10.png" },
  { key: "culturarock",    nombre: "Cultura Rock",      file: "https://radio-tekileros.vercel.app/CulturaRock.json",       clave: "culturarock",    coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover1.png" }
];

function setDefaultMetadata() {
  if (TRACK_PLAYLIST_EL)  TRACK_PLAYLIST_EL.textContent  = "ACTUAL";
  if (TRACK_TITLE_EL)     TRACK_TITLE_EL.textContent     = "BBFITA FREYSITA";
  if (TRACK_ARTIST_EL)    TRACK_ARTIST_EL.textContent    = "28 de Agosto 2026";
  if (TRACK_DURATION_EL)  TRACK_DURATION_EL.textContent  = "00:00";
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ Inicialización ÚNICA y Gesto Humano
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
setDefaultMetadata();
precargarImagenesPlaylists();
cargarPlaylist("actual");
ajustarEscalaReproductor();

// INICIALIZAR EVENTOS DEL CARRUSEL UNA SOLA VEZ
inicializarArrastreCarrusel(); 

document.addEventListener("click", () => {
  if (gestureDetected) return;
  gestureDetected = true;
  audio.muted = false;
  console.log("🟢 Interacción humana detectada: Audio habilitado.");
  if (audio.src && audio.paused) {
    audio.play().catch(() => {}); 
  }
}, { once: true });

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Precarga de imágenes de playlists
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function precargarImagenesPlaylists() {
  PLAYLISTS_MAP.forEach(playlist => {
    const img = new Image();
    img.src = playlist.coverUrl; // ✅ Directo y sin matemáticas
  });
  console.log("🖼️ Imágenes de playlists precargadas");
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cargar playlist según nombre y raíz - CON LÓGICA DE JSON ROBUSTA
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function cargarPlaylist(nombre) {
  currentPlaylistName = nombre;

  try {
    if (nombre === "favoritos") {
      const favs = JSON.parse(localStorage.getItem("userFavorites")) || [];
      trackData = favs;
      currentMode = "music";
      
      const progress = JSON.parse(localStorage.getItem("playlistProgress")) || {};
      currentTrack = (progress[nombre] !== undefined && progress[nombre] < trackData.length) ? progress[nombre] : 0;
      
      console.log(`⭐ Playlist "Favoritos" cargada con ${trackData.length} elementos.`);
      
      if (trackData.length > 0) {
        renderizarCaratulasCarrusel();
        activarReproduccion(currentTrack, "initial-load");
      } else {
        console.log("⚠️ No hay favoritos guardados");
        if (TRACK_TITLE_EL) TRACK_TITLE_EL.textContent = "Sin Favoritos";
        if (TRACK_ARTIST_EL) TRACK_ARTIST_EL.textContent = "Agrega tracks a favoritos";
        if (TRACK_DURATION_EL) TRACK_DURATION_EL.textContent = "0 Pistas";
      }
      return;
    }

    let file, clave, etiqueta;
    const match = PLAYLISTS_MAP.find(p => p.key === nombre);
    
    if (match) {
      file = match.file;
      clave = match.clave;
      etiqueta = match.nombre;
    } else {
      console.warn(`⚠️ Playlist desconocida: ${nombre}`);
      return;
    }

    const res = await fetch(file, { cache: "no-cache" });
    if (!res.ok) {
      console.error(`❌ No se pudo cargar el archivo ${file} (status ${res.status})`);
      return;
    }

    const data = await res.json();
    let pistas;

    if (Array.isArray(data)) {
      pistas = data;
    } else if (data[clave]) {
      if (nombre === "vina_rock") {
        const sublistas = Object.values(data[clave]);
        pistas = sublistas.flat();
      } else {
        pistas = data[clave];
      }
    } else {
      const possibleKeys = ["tracks", "songs", "canciones", "playlist", "data", "items"];
      let found = false;
      for (const k of possibleKeys) {
        if (data[k] && Array.isArray(data[k])) {
          pistas = data[k];
          found = true;
          break;
        }
      }
      if (!found) {
        const values = Object.values(data);
        const firstArray = values.find(val => Array.isArray(val));
        if (firstArray) {
          pistas = firstArray;
        } else {
          console.error(`❌ No se pudo encontrar un array de pistas en ${file}.`);
          return;
        }
      }
    }

    trackData = pistas;
    currentMode = "music";
    
    const progress = JSON.parse(localStorage.getItem("playlistProgress")) || {};
    if (progress[nombre] !== undefined && progress[nombre] >= 0 && progress[nombre] < trackData.length) {
      currentTrack = progress[nombre];
      console.log(`▶️ Retomando playlist "${etiqueta}" desde el track ${currentTrack + 1}`);
    } else {
      currentTrack = 0;
      console.log(`▶️ Iniciando playlist "${etiqueta}" desde el principio`);
    }
    
    // 1. Actualizar etiquetas de UI SIEMPRE
    if (TRACK_PLAYLIST_EL) TRACK_PLAYLIST_EL.textContent = etiqueta.toUpperCase();
    const playlistLabel = document.getElementById("track-playlist");
    if (playlistLabel) playlistLabel.textContent = `Playlist: ${etiqueta}`;

    // 2. Renderizar carrusel SIEMPRE
    renderizarCaratulasCarrusel();

    // 3. Activar reproducción (El catch manejará el bloqueo de autoplay sin romper la UI)
    if (trackData && trackData.length > 0) {
      activarReproduccion(currentTrack, "playlist-loaded");
    }

  } catch (err) {
    console.error(`❌ Error al cargar playlist "${nombre}":`, err);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Renderizado del Carrusel Cíclico (Con portada de playlist móvil)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderizarCaratulasCarrusel() {
  if (currentMode !== "music" || !trackData || trackData.length === 0) return;

  const currentCovers = document.querySelectorAll(".carousel-arc .arc-cover");
  
  // Verificación de seguridad: debe haber exactamente 9 covers
  if (currentCovers.length !== 9) {
    console.warn(`️ Número incorrecto de covers: ${currentCovers.length}. Deberían ser 9.`);
    return;
  }

  const matchPlaylist = PLAYLISTS_MAP.find(p => p.key === currentPlaylistName);
  const playlistCoverSrc = matchPlaylist ? matchPlaylist.coverUrl : "https://santi-graphics.vercel.app/assets/covers/Cover1.png";

  const displayData = [...trackData];
  displayData.push({
    esPortadaPlaylist: true,
    nombre: "Portada de Playlist",
    artista: currentPlaylistName,
    caratula: playlistCoverSrc,
    enlace: null
  });

  const totalItems = displayData.length;

  // Pre-cargar imágenes de los tracks visibles (9 covers + buffer de 5)
  const urlsAPrecargar = [];
  for (let i = 0; i < 14 && i < totalItems; i++) {
    const idx = (currentTrack + i) % totalItems;
    const track = displayData[idx];
    if (track) {
      const imgUrl = track.portada || track.caratula || "https://santi-graphics.vercel.app/assets/SG.ico";
      urlsAPrecargar.push(imgUrl);
    }
  }
  precargarImagenesEnLote(urlsAPrecargar);

  for (let i = 0; i < 9; i++) {
    const coverElement = currentCovers[i];
    if (!coverElement) continue;

    const imgElement = coverElement.querySelector("img");
    const offset = i - 4;
    let itemIndex = (currentTrack + offset) % totalItems;
    itemIndex = (itemIndex + totalItems) % totalItems;

    const targetData = displayData[itemIndex];
    const isCurrent = (i === 4 && !targetData.esPortadaPlaylist);

    if (imgElement && targetData) {
      const imgUrl = targetData.portada || targetData.caratula || "https://santi-graphics.vercel.app/assets/SG.ico";
      imgElement.src = obtenerImagenConCache(imgUrl);
    }

    if (targetData.esPortadaPlaylist) {
      coverElement.classList.remove("active");
      coverElement.classList.add("is-playlist-cover");
      coverElement.dataset.trackIndex = "playlist-cover";
    } else {
      coverElement.classList.remove("is-playlist-cover");
      if (isCurrent) {
        coverElement.classList.add("active");
      } else {
        coverElement.classList.remove("active");
      }
      coverElement.dataset.trackIndex = itemIndex;
    }
  }

  console.log(`🔄 Carrusel sincronizado. Slot activo (i=4): ${currentTrack + 1}`);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auxiliar para Arrastre Dinámico Infinito (UNIFICADO: Music & Playlists)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function inicializarArrastreCarrusel() {
  const carousel = document.querySelector(".carousel-arc");
  if (!carousel) return;

  let isDragging = false;
  let startY = 0;
  let currentRotationOffset = 0;
  let wheelTimeout = null;

  function startDrag(e) {
    if (e.target.closest('.nav-icons-arc') || e.target.closest('.metadata-panel') || e.target.closest('.content-overlay')) return;
    isDragging = true;
    hasDragged = false;
    startY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    carousel.style.transition = "none";
    if (!e.type.includes("touch")) e.preventDefault();
  }

  function onDrag(e) {
    if (!isDragging) return;
    hasDragged = true;
    const currentY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY;
    currentRotationOffset += deltaY;
    startY = currentY;

    const shift = Math.floor(-currentRotationOffset / 35);
    
    if (currentMode === "playlists") {
      const total = PLAYLISTS_MAP.length;
      let tempIndex = (currentPlaylistIndex + shift) % total;
      tempIndex = (tempIndex + total) % total;
      actualizarRanurasPlaylistsEnTiempoReal(tempIndex);
    } else {
      const total = trackData.length;
      if (total > 0) {
        let tempIndex = (currentTrack + shift) % total;
        tempIndex = (tempIndex + total) % total;
        actualizarRanurasMusicaEnTiempoReal(tempIndex);
      }
    }
  }

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    carousel.style.transition = "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";

    const shift = Math.round(-currentRotationOffset / 35);
    if (shift !== 0) {
      if (currentMode === "playlists") {
        const total = PLAYLISTS_MAP.length;
        currentPlaylistIndex = (currentPlaylistIndex + shift) % total;
        currentPlaylistIndex = (currentPlaylistIndex + total) % total;
        renderizarCaratulasPlaylists();
      } else {
        const total = trackData.length;
        if (total > 0) {
          currentTrack = (currentTrack + shift) % total;
          currentTrack = (currentTrack + total) % total;
          renderizarCaratulasCarrusel();
          actualizarEstadoFavoritoActual();
        }
      }
    } else {
      if (currentMode === "playlists") renderizarCaratulasPlaylists();
      else renderizarCaratulasCarrusel();
    }
    currentRotationOffset = 0;
  }

  function actualizarRanurasPlaylistsEnTiempoReal(baseIndex) {
    const total = PLAYLISTS_MAP.length;
    const activeCovers = carousel.querySelectorAll(".arc-cover");
    activeCovers.forEach((coverElement, i) => {
      const imgElement = coverElement.querySelector("img");
      const offset = i - 4;
      let mappedIndex = (baseIndex + offset) % total;
      mappedIndex = (mappedIndex + total) % total;
      
      const target = PLAYLISTS_MAP[mappedIndex];
      if (imgElement) imgElement.src = obtenerImagenConCache(target.coverUrl);
      coverElement.dataset.key = target.key;
      coverElement.classList.toggle("active", i === 4);
    });
  }

  function actualizarRanurasMusicaEnTiempoReal(baseIndex) {
    const total = trackData.length;
    if (total === 0) return;
    const activeCovers = carousel.querySelectorAll(".arc-cover");
    const matchPlaylist = PLAYLISTS_MAP.find(p => p.key === currentPlaylistName);
    const playlistCoverSrc = matchPlaylist ? matchPlaylist.coverUrl : "https://santi-graphics.vercel.app/assets/covers/Cover1.png";

    const displayData = [...trackData];
    displayData.push({ esPortadaPlaylist: true, caratula: playlistCoverSrc });
    const totalItems = displayData.length;

    activeCovers.forEach((coverElement, i) => {
      const imgElement = coverElement.querySelector("img");
      const offset = i - 4;
      let mappedIndex = (baseIndex + offset) % totalItems;
      mappedIndex = (mappedIndex + totalItems) % totalItems;

      const targetData = displayData[mappedIndex];
      if (imgElement && targetData) {
        const imgUrl = targetData.portada || targetData.caratula || "https://santi-graphics.vercel.app/assets/SG.ico";
        imgElement.src = obtenerImagenConCache(imgUrl);
      }

      if (targetData.esPortadaPlaylist) {
        coverElement.dataset.trackIndex = "playlist-cover";
        coverElement.classList.add("is-playlist-cover");
        coverElement.classList.remove("active");
      } else {
        coverElement.dataset.trackIndex = mappedIndex;
        coverElement.classList.remove("is-playlist-cover");
        coverElement.classList.toggle("active", i === 4 && mappedIndex === currentTrack);
      }
    });
  }

  function handleWheel(e) {
    if (wheelTimeout) return;
    
    wheelTimeout = setTimeout(() => {
      wheelTimeout = null;
    }, 200);

    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    
    if (currentMode === "playlists") {
      const total = PLAYLISTS_MAP.length;
      currentPlaylistIndex = (currentPlaylistIndex + direction + total) % total;
      renderizarCaratulasPlaylists();
    } else {
      const total = trackData.length;
      if (total > 0) {
        currentTrack = (currentTrack + direction + total) % total;
        renderizarCaratulasCarrusel();
        actualizarEstadoFavoritoActual();
      }
    }
  }

  carousel.onmousedown = startDrag;
  window.onmousemove = onDrag;
  window.onmouseup = endDrag;
  carousel.ontouchstart = startDrag;
  window.ontouchmove = onDrag;
  window.ontouchend = endDrag;
  carousel.onwheel = handleWheel;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Renderizado Dinámico de Playlists (Modo Directorio)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderizarCaratulasPlaylists() {
  currentMode = "playlists";
  document.querySelector(".player-container").classList.add("mode-playlists");
  contentOverlay.classList.remove("active");
  
  const totalPlaylists = PLAYLISTS_MAP.length;

  for (let i = 0; i < 9; i++) {
    const coverElement = covers[i];
    if (!coverElement) continue;

    const imgElement = coverElement.querySelector("img");
    const offset = i - 4;
    let playlistIndex = (currentPlaylistIndex + offset) % totalPlaylists;
    playlistIndex = (playlistIndex + totalPlaylists) % totalPlaylists;

    const targetPlaylist = PLAYLISTS_MAP[playlistIndex];
    const coverImageSrc = targetPlaylist.coverUrl;
    
    if (imgElement) {
      imgElement.src = obtenerImagenConCache(coverImageSrc);
      imgElement.loading = "eager";
    }
    
    coverElement.dataset.key = targetPlaylist.key;
    coverElement.classList.remove("active", "is-playlist-cover");
    
    if (i === 4) {
      coverElement.classList.add("active");
    }
  }

  console.log(`📂 Modo Playlists activo. Centro: ${PLAYLISTS_MAP[currentPlaylistIndex].nombre}`);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Reproductor Principal (Play / Pause / Cambio de Pista) - CON GUARDADO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarReproduccion(index, modo = "manual") {
  if (!Array.isArray(trackData) || index < 0 || index >= trackData.length) return;

  const track = trackData[index];
  const url = track.enlace || track.dropbox_url || track.url;
  if (!url) return;

  if (currentTrack === index && audio.src === url) {
    if (!audio.paused) {
      audio.pause();
      if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    } else {
      audio.play().then(() => {
        if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
      }).catch(err => console.warn("⚠️ Error al reanudar:", err));
    }
    return;
  }

  currentTrack = index;
  
  const progress = JSON.parse(localStorage.getItem("playlistProgress")) || {};
  progress[currentPlaylistName] = currentTrack;
  localStorage.setItem("playlistProgress", JSON.stringify(progress));
  
  // 1. Actualizar metadatos de texto INMEDIATAMENTE (es rápido y no bloquea)
  if (TRACK_TITLE_EL)    TRACK_TITLE_EL.textContent    = track.nombre || "Sin título";
  if (TRACK_ARTIST_EL)   TRACK_ARTIST_EL.textContent   = track.artista || "Desconocido";
  if (TRACK_DURATION_EL) TRACK_DURATION_EL.textContent = track.duracion || `${trackData.length} Pistas`;
  actualizarEstadoFavoritoActual();

  // 2. Iniciar la carga y reproducción del audio ANTES del renderizado pesado
  audio.src = url;
  audio.load();
  
  audio.play().then(() => {
    if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
    // Pre-cargar el siguiente track solo cuando este ya está sonando
    precargarSiguienteTrack();
  }).catch(err => {
    console.warn("⏸️ Reproducción en pausa (esperando interacción):", err.message);
    if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
  });

  // 3. Renderizar el carrusel en el siguiente frame para NO bloquear el audio
  requestAnimationFrame(() => {
    actualizarMediaSession(track);
    renderizarCaratulasCarrusel();
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pre-carga del siguiente track (Elimina el retraso al cambiar de canción)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function precargarSiguienteTrack() {
  if (!trackData || trackData.length === 0) return;
  
  // Calcular el índice del siguiente track (respetando shuffle si está activo)
  let nextIndex;
  if (shuffleActive) {
    nextIndex = Math.floor(Math.random() * trackData.length);
  } else {
    nextIndex = (currentTrack + 1) % trackData.length;
  }
  
  const nextTrack = trackData[nextIndex];
  const nextUrl = nextTrack.enlace || nextTrack.dropbox_url || nextTrack.url;
  
  if (nextUrl) {
    // Crear un objeto de audio invisible solo para forzar la descarga del buffer
    const preloader = new Audio();
    preloader.src = nextUrl;
    preloader.preload = "auto";
    preloader.load();
    console.log(`🚀 Pre-cargando en segundo plano: ${nextTrack.nombre}`);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Controles Multimedia
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (btnPlayPause) {
  btnPlayPause.addEventListener("click", () => {
    if (!audio.src && trackData.length > 0) {
      activarReproduccion(0, "play-btn");
      return;
    }
    if (audio.paused) {
      audio.play().then(() => {
        btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
      }).catch(err => console.warn("⚠️", err));
    } else {
      audio.pause();
      btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    }
  });
}

if (btnNext) {
  btnNext.addEventListener("click", () => {
    if (!trackData.length) return;
    if (shuffleActive) {
      const nextIndex = Math.floor(Math.random() * trackData.length);
      activarReproduccion(nextIndex, "next-shuffle");
    } else {
      let nextIndex = currentTrack + 1;
      if (nextIndex >= trackData.length) nextIndex = 0;
      activarReproduccion(nextIndex, "next-btn");
    }
  });
}

if (btnPrev) {
  btnPrev.addEventListener("click", () => {
    if (!trackData.length) return;
    let prevIndex = currentTrack - 1;
    if (prevIndex < 0) prevIndex = trackData.length - 1;
    activarReproduccion(prevIndex, "prev-btn");
  });
}

if (btnShuffle) {
  btnShuffle.addEventListener("click", () => {
    shuffleActive = !shuffleActive;
    btnShuffle.classList.toggle("active-mode", shuffleActive);
    
    // ✅ Si se activa, saltar INMEDIATAMENTE a una pista aleatoria
    if (shuffleActive && trackData.length > 1) {
      let nextIndex;
      // Asegurar que sea una pista diferente a la actual
      do {
        nextIndex = Math.floor(Math.random() * trackData.length);
      } while (nextIndex === currentTrack && trackData.length > 1);
      
      activarReproduccion(nextIndex, "shuffle-activate-inmediate");
    }
    
    console.log(`🔀 Modo Aleatorio: ${shuffleActive ? "Activado (salto inmediato)" : "Desactivado"}`);
  });
}

if (btnRepeat) {
  btnRepeat.addEventListener("click", () => {
    repeatActive = !repeatActive;
    btnRepeat.classList.toggle("active-mode", repeatActive);
    console.log(`🔁 Modo Repetición: ${repeatActive ? "Activado (se repetirá el track actual al finalizar)" : "Desactivado"}`);
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Gestión de Tiempos y Barra de Progreso
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// al inicio del archivo, así que los usamos directamente
audio.addEventListener("timeupdate", () => {
  if (isNaN(audio.duration)) return;
  
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  if (progressFill) progressFill.style.width = `${progressPercent}%`;

  if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
  if (totalDurationEl && !isNaN(audio.duration)) {
    totalDurationEl.textContent = formatTime(audio.duration);
  }
});

audio.addEventListener("loadedmetadata", () => {
  if (totalDurationEl && !isNaN(audio.duration)) {
    totalDurationEl.textContent = formatTime(audio.duration);
  }
});

if (progressContainer) {
  // Clic para saltar a posición
  progressContainer.addEventListener("click", (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    if (audio.duration) {
      audio.currentTime = (clickX / width) * audio.duration;
    }
  });

  // Arrastre para scrubbing
  let isDraggingProgress = false;

  progressContainer.addEventListener("mousedown", (e) => {
    isDraggingProgress = true;
    updateProgressFromEvent(e);
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDraggingProgress) return;
    updateProgressFromEvent(e);
  });

  window.addEventListener("mouseup", () => {
    isDraggingProgress = false;
  });

  function updateProgressFromEvent(e) {
    const rect = progressContainer.getBoundingClientRect();
    let clickX = e.clientX - rect.left;
    clickX = Math.max(0, Math.min(clickX, rect.width));
    if (audio.duration) {
      audio.currentTime = (clickX / rect.width) * audio.duration;
    }
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Control de Clics en el Carrusel (Con protección para portada de playlist y arrastre)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
covers.forEach((cover, index) => {
  cover.addEventListener("click", async (e) => {
    // Si hubo arrastre, ignorar el clic y resetear la bandera
    if (hasDragged) {
      hasDragged = false;
      e.stopPropagation();
      return;
    }

    if (currentMode === "playlists") {
      const key = cover.dataset.key;
      if (key) {
        console.log(`📂 Seleccionando playlist: ${key}`);
        const targetIndex = PLAYLISTS_MAP.findIndex(p => p.key === key);
        if (targetIndex !== -1) currentPlaylistIndex = targetIndex;
        
        await cargarPlaylist(key);
      }
      return;
    }

    const trackIdx = cover.dataset.trackIndex;
    if (trackIdx === "playlist-cover") {
      console.log("📌 Clic en la portada de la playlist (no es un track reproducible).");
      return;
    }

    const idx = parseInt(trackIdx);
    if (!isNaN(idx) && trackData[idx]) {
      activarReproduccion(idx, "carousel-click");
    }
  });
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Secuencia Automática (Evento Ended) - CON LIMPIEZA DE PROGRESO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
audio.addEventListener("ended", () => {
  if (shuffleActive) {
    // 1. Prioridad máxima: Si shuffle está activo, saltar a uno aleatorio
    let nextIndex = Math.floor(Math.random() * trackData.length);
    activarReproduccion(nextIndex, "shuffle-next");
    
  } else if (repeatActive) {
    // 2. Segunda prioridad: Si repeat está activo, repetir el track actual SIEMPRE
    activarReproduccion(currentTrack, "auto-repeat-current");
    
  } else {
    // 3. Comportamiento normal: Avanzar al siguiente track
    const nextIndex = currentTrack + 1;
    if (nextIndex < trackData.length) {
      activarReproduccion(nextIndex, "auto-next");
    } else {
      // Fin de la playlist, limpiar progreso
      console.log("⏹️ Fin de la playlist actual.");
      if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
      
      const progress = JSON.parse(localStorage.getItem("playlistProgress")) || {};
      delete progress[currentPlaylistName];
      localStorage.setItem("playlistProgress", JSON.stringify(progress));
    }
  }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Control de Pestañas e Iconos del Arco (Nav Icons)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
navIcons.forEach(icon => {
  icon.addEventListener("click", async () => {
    const sectionName = icon.getAttribute("data-section");

    navIcons.forEach(i => i.classList.remove("active"));
    icon.classList.add("active");

    if (sectionName === "video") {
      // Abrir overlay fullscreen de videos
      abrirOverlayFullscreen("section-video");
    } else if (sectionName === "games") {
      // Abrir overlay fullscreen de juegos
      abrirOverlayFullscreen("section-games");
    } else if (sectionName === "music") {
      cerrarOverlay();
      
      if (currentMode === "music" && trackData.length > 0 && audio.src) {
        if (!audio.paused) {
          audio.pause();
          if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
        } else {
          audio.play().then(() => {
            if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
          }).catch(err => console.warn("⚠️", err));
        }
        return;
      }
      await cargarPlaylist(currentPlaylistName);
    } else if (sectionName === "folder") {
      cerrarOverlay();
      renderizarCaratulasPlaylists();
    } else if (sectionName === "favorites") {
      cerrarOverlay();
      await cargarPlaylist("favoritos");
    }
  });
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Gestión de Favoritos: Agregar o Quitar del localStorage
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (btnFavorite) {
  btnFavorite.addEventListener("click", () => {
    if (currentTrack !== null && currentTrack !== undefined && trackData[currentTrack]) {
      const trackObj = trackData[currentTrack];
      let favs = JSON.parse(localStorage.getItem("userFavorites")) || [];
      
      const trackUrl = trackObj.enlace || trackObj.dropbox_url || trackObj.url;
      
      const existeIndex = favs.findIndex(item => {
        const favUrl = item.enlace || item.dropbox_url || item.url;
        return trackUrl && favUrl && trackUrl === favUrl;
      });
      
      if (existeIndex === -1 && trackUrl) {
        const favorito = {
          nombre: trackObj.nombre || "Sin título",
          artista: trackObj.artista || "Desconocido",
          duracion: trackObj.duracion || "",
          enlace: trackUrl,
          caratula: trackObj.portada || trackObj.caratula || trackObj.imagen || trackObj.cover,
          playlist_origen: currentPlaylistName,
          fecha_agregado: new Date().toISOString()
        };
        
        favs.push(favorito);
        localStorage.setItem("userFavorites", JSON.stringify(favs));
        btnFavorite.querySelector("i").className = "fas fa-heart text-red-500";
        console.log(`⭐ Track agregado a favoritos: ${favorito.nombre}`);
      } else if (existeIndex !== -1) {
        favs.splice(existeIndex, 1);
        localStorage.setItem("userFavorites", JSON.stringify(favs));
        btnFavorite.querySelector("i").className = "far fa-heart";
        console.log(`❌ Track removido de favoritos: ${trackObj.nombre}`);
      }
    }
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Gestión de Favoritos: Actualizar estado visual del corazón
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function actualizarEstadoFavoritoActual() {
  if (!btnFavorite) return;
  if (currentTrack === null || currentTrack === undefined || !trackData[currentTrack]) {
    btnFavorite.querySelector("i").className = "far fa-heart";
    return;
  }
  
  const trackObj = trackData[currentTrack];
  const favs = JSON.parse(localStorage.getItem("userFavorites")) || [];
  
  const trackUrl = trackObj.enlace || trackObj.dropbox_url || trackObj.url;
  
  const existe = favs.some(item => {
    const favUrl = item.enlace || item.dropbox_url || item.url;
    return trackUrl && favUrl && trackUrl === favUrl;
  });
  
  if (existe) {
    btnFavorite.querySelector("i").className = "fas fa-heart text-red-500";
  } else {
    btnFavorite.querySelector("i").className = "far fa-heart";
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Control de Overlay Fullscreen (Video / Juegos)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function abrirOverlayFullscreen(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  // Activar la sección
  contentSections.forEach(sec => sec.classList.remove("active"));
  section.classList.add("active");

  // Aplicar modo fullscreen
  contentOverlay.classList.add("full-screen");
  contentOverlay.classList.add("active");

  console.log(`️ Overlay fullscreen abierto: ${sectionId}`);

  // Agregar estado al historial para habilitar el botón "Atrás" en móviles
  history.pushState({ overlayOpen: true }, "");

  // Si es la sección de juegos, cargar el juego por defecto
  if (sectionId === "section-games") {
    setTimeout(() => {
      cargarJuego("mario-luigi");
    }, 500);
  }
}

function cerrarOverlay() {
  if (!contentOverlay.classList.contains("active")) return;
  
  contentOverlay.classList.remove("active");
  contentOverlay.classList.remove("full-screen");
  contentSections.forEach(sec => sec.classList.remove("active"));
  
  // Si estábamos en modo playlists, volver a mostrar el carrusel de listas
  if (currentMode === "playlists") {
    renderizarCaratulasPlaylists();
  }

  console.log("❌ Overlay cerrado");
  
  // Si el historial indica que el overlay estaba abierto, retrocedemos para limpiar el estado
  if (history.state && history.state.overlayOpen) {
    history.back();
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Mecanismos de Cierre del Overlay (Botón X, Tecla ESC y Botón Atrás Móvil)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Cierre con botón X
document.querySelectorAll(".content-overlay .btn-close").forEach(btn => {
  btn.addEventListener("click", () => {
    cerrarOverlay();
  });
});

// 2. Cierre con tecla ESC (Desktop)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && contentOverlay.classList.contains("active")) {
    cerrarOverlay();
  }
});

// 3. Cierre con botón "Atrás" del navegador/móvil (popstate)
window.addEventListener("popstate", (event) => {
  if (contentOverlay.classList.contains("active")) {
    // No llamamos a history.back() aquí porque popstate YA es el resultado de ir atrás.
    // Solo cerramos la UI y limpiamos las clases.
    contentOverlay.classList.remove("active");
    contentOverlay.classList.remove("full-screen");
    contentSections.forEach(sec => sec.classList.remove("active"));
    
    if (currentMode === "playlists") {
      renderizarCaratulasPlaylists();
    }
    console.log("❌ Overlay cerrado por botón atrás del navegador/móvil");
  }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inyectar Video de YouTube
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function agregarVideo(videoId, titulo) {
  const container = document.getElementById("videoContainer");
  if (!container) return;

  const item = document.createElement("div");
  item.className = "media-item";
  item.innerHTML = `
    <iframe 
      src="https://www.youtube.com/embed/${videoId}" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen>
    </iframe>
    <div class="media-title">${titulo}</div>
  `;

  container.appendChild(item);
  console.log(` Video agregado: ${titulo}`);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inyectar Juego en iframe
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function agregarJuego(url, titulo) {
  const container = document.getElementById("gamesContainer");
  if (!container) return;

  const item = document.createElement("div");
  item.className = "media-item";
  item.innerHTML = `
    <iframe src="${url}" allowfullscreen></iframe>
    <div class="media-title">${titulo}</div>
  `;

  container.appendChild(item);
  console.log(`🎮 Juego agregado: ${titulo}`);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MEDIA SESSION API (Para reproducción en background y pantalla de bloqueo)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function actualizarMediaSession(track) {
  if (!("mediaSession" in navigator)) return;

  const coverUrl = track.portada || track.caratula || track.imagen || track.cover || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.nombre || "Sin título",
    artist: track.artista || "Desconocido",
    album: currentPlaylistName,
    artwork: [
      { src: coverUrl, sizes: "96x96", type: "image/png" },
      { src: coverUrl, sizes: "128x128", type: "image/png" },
      { src: coverUrl, sizes: "192x192", type: "image/png" },
      { src: coverUrl, sizes: "256x256", type: "image/png" },
      { src: coverUrl, sizes: "384x384", type: "image/png" },
      { src: coverUrl, sizes: "512x512", type: "image/png" }
    ]
  });

  navigator.mediaSession.setActionHandler("play", () => {
    audio.play();
    if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audio.pause();
    if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
  });

  navigator.mediaSession.setActionHandler("previoustrack", () => {
    if (btnPrev) btnPrev.click();
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    if (btnNext) btnNext.click();
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Ajuste automático de escala (Solo para desktop pequeño)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ajustarEscalaReproductor() {
  const stage = document.querySelector(".player-stage");
  if (!stage) return;
  
  const targetHeight = 860;
  const targetWidth = 440;
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  
  // Solo escalar en desktop si la ventana es más pequeña que el reproductor
  if (windowWidth > 500 && windowHeight > 900) {
    if (windowWidth < targetWidth || windowHeight < targetHeight) {
      const scaleW = windowWidth / targetWidth;
      const scaleH = windowHeight / targetHeight;
      const scale = Math.min(scaleW, scaleH);
      
      stage.style.setProperty("--stage-scale", scale);
      stage.style.transform = `scale(${scale})`;
    } else {
      stage.style.removeProperty("--stage-scale");
      stage.style.transform = "none";
    }
    return;
  }
  
  // En móvil: sin escala, ocupa 100% (controlado por CSS)
  stage.style.removeProperty("--stage-scale");
  stage.style.transform = "none";
}

window.addEventListener("resize", ajustarEscalaReproductor);
window.addEventListener("DOMContentLoaded", ajustarEscalaReproductor);

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cargar videos de prueba al iniciar (DEMO)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
setTimeout(() => {
  agregarVideo("cq1Grx7qCLw", "Video de Prueba - YouTube");
}, 1000);

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Selector de juegos (Con tus enlaces originales exactos)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const gamesData = {
  "mario-luigi": {
    url: "https://www.retrogames.cc/embed/26855-mario-and-luigi-superstar-saga-e-menace.html",
    title: "Mario & Luigi: Superstar Saga"
  },
  "farm-merge": {
    url: "https://games.crazygames.com/en_US/farm-merge-valley/index.html",
    title: "Farm Merge Valley"
  }
};

function cargarJuego(gameKey) {
  const container = document.getElementById("activeGameContainer");
  const gameData = gamesData[gameKey];
  
  if (!container || !gameData) {
    console.warn(`⚠️ Juego "${gameKey}" no configurado`);
    return;
  }
  
  // Limpiar contenedor
  container.innerHTML = '';
  
  // Crear iframe limpio que ocupe todo el espacio
  const iframe = document.createElement("iframe");
  iframe.src = gameData.url;
  iframe.allowFullscreen = true;
  iframe.setAttribute("allow", "cross-origin-isolated");
  iframe.setAttribute("scrolling", "no");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  
  container.appendChild(iframe);
  
  console.log(`🎮 Juego cargado: ${gameData.title} (sin bezel)`);
}

// Event listeners para los botones del selector
document.addEventListener("click", (e) => {
  const gameBtn = e.target.closest(".game-btn");
  if (gameBtn) {
    // Actualizar botones activos
    document.querySelectorAll(".game-btn").forEach(btn => btn.classList.remove("active"));
    gameBtn.classList.add("active");
    
    // Cargar juego seleccionado
    const gameKey = gameBtn.dataset.game;
    cargarJuego(gameKey);
  }
});

}); // <-- Cierra el wrapper al final del archivo