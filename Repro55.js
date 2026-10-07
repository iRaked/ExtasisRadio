//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 INICIALIZACIÓN Y ESTADO GLOBAL (MODO LOCAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let gestureDetected = false;
let trackData = [];
let currentTrack = null;
let currentPlaylistName = "actual";
let currentMode = "music";
let currentPlaylistIndex = 0;
let hasDragged = false;
let repeatActive = false;
let shuffleActive = false;
let audio; // Referencia global para que todas las funciones la vean

function iniciarReproductor() {
  if (window._repro55_iniciado) return;
  
  audio = document.getElementById("audio");
  if (!audio) {
    window._repro55_iniciado = false; 
    return; 
  }
  window._repro55_iniciado = true;

  // Elementos de metadatos y controles (Nombres unificados para evitar errores)
  const TRACK_TITLE_EL      = document.getElementById("trackTitle");
  const TRACK_ARTIST_EL     = document.getElementById("trackArtist");
  const TRACK_DURATION_EL   = document.getElementById("totalDuration"); // ✅ Corregido para coincidir con tu HTML
  const currentTimeEl       = document.getElementById("currentTime");
  const progressFill        = document.getElementById("progressFill");   // ✅ Corregido (antes era progressBar)
  const progressContainer   = document.getElementById("progressContainer");
  const TRACK_PLAYLIST_EL   = document.getElementById("trackPlaylist");

  // Botones de control
  const btnShuffle   = document.getElementById("btnShuffle");
  const btnRepeat    = document.getElementById("btnRepeat");

  // Referencias de UI
  const covers = document.querySelectorAll(".carousel-arc .arc-cover");
  const navIcons = document.querySelectorAll(".nav-icons-arc .nav-ico");
  const contentOverlay = document.getElementById("contentOverlay");
  const contentSections = document.querySelectorAll(".content-section");
  const btnFavorite = document.getElementById("btnFavorite");

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
  const plEl = document.getElementById("trackPlaylist");
  const titleEl = document.getElementById("trackTitle");
  const artistEl = document.getElementById("trackArtist");
  const durationEl = document.getElementById("totalDuration");

  if (plEl) plEl.textContent = "ACTUAL";
  if (titleEl) titleEl.textContent = "BBFITA FREYSITA";
  if (artistEl) artistEl.textContent = "28 de Agosto 2026";
  if (durationEl) durationEl.textContent = "0:00";
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ Inicialización ÚNICA y Gesto Humano
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  setDefaultMetadata();
  precargarImagenesPlaylists();
  cargarPlaylist("actual");
  ajustarEscalaReproductor();
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
        const titleEl = document.getElementById("trackTitle");
        const artistEl = document.getElementById("trackArtist");
        const durEl = document.getElementById("totalDuration");
        if (titleEl) titleEl.textContent = "Sin Favoritos";
        if (artistEl) artistEl.textContent = "Agrega tracks a favoritos";
        if (durEl) durEl.textContent = "0 Pistas";
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
    const plEl = document.getElementById("trackPlaylist");
    if (plEl) plEl.textContent = etiqueta.toUpperCase();

    // 2. Renderizar carrusel SIEMPRE
    renderizarCaratulasCarrusel();

    // 3. Activar reproducción
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
//  Renderizado Dinámico de Playlists (Modo Directorio con Contador Dinámico)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderizarCaratulasPlaylists() {
  currentMode = "playlists";
  document.querySelector(".player-container").classList.add("mode-playlists");
  contentOverlay.classList.remove("active");
  
  const totalPlaylists = PLAYLISTS_MAP.length;
  const centeredPlaylist = PLAYLISTS_MAP[currentPlaylistIndex]; 
  
  // ✅ 1. LIMPIEZA Y ACTUALIZACIÓN DEL CUADRO DE DATOS
  const plEl = document.getElementById("trackPlaylist");
  const titleEl = document.getElementById("trackTitle");
  const artistEl = document.getElementById("trackArtist");
  const durEl = document.getElementById("totalDuration");
  const currentTimeEl = document.getElementById("currentTime");
  const timeSeparator = document.querySelector(".time-separator"); // ✅ Nuevo
  const progressContainer = document.getElementById("progressContainer");
  const progressFill = document.getElementById("progressFill");

  if (plEl) plEl.textContent = "CARPETA";
  if (titleEl) titleEl.textContent = centeredPlaylist.nombre; 
  if (artistEl) artistEl.textContent = "";
  
  // ✅ LIMPIAR EL TIEMPO Y OCULTAR EL GUION PARA QUE SOLO QUEDE EL CONTADOR
  if (currentTimeEl) currentTimeEl.textContent = "";
  if (timeSeparator) timeSeparator.style.display = "none"; 
  if (durEl) durEl.textContent = `${currentPlaylistIndex + 1} - ${totalPlaylists} Listas`;
  
  // ✅ CONGELAR Y LIMPIAR LA BARRA DE PROGRESO
  if (progressFill) progressFill.style.width = "0%";
  if (progressContainer) {
    progressContainer.style.opacity = "0.2";
    progressContainer.style.pointerEvents = "none";
  }

  // ✅ 2. RENDERIZADO DEL CARRUSEL DE LISTAS
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

  console.log(`📂 Modo Playlists activo. Centro: ${centeredPlaylist.nombre} (${currentPlaylistIndex + 1}/${totalPlaylists})`);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Reproductor Principal (Con restauración del formato de tiempo)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarReproduccion(index, modo = "manual") {
  if (!Array.isArray(trackData) || index < 0 || index >= trackData.length) return;

  // ✅ RESTAURAR EL FORMATO DE TIEMPO AL SALIR DEL MODO SELECCIÓN
  const timeSeparator = document.querySelector(".time-separator");
  if (timeSeparator) timeSeparator.style.display = "inline";

  const track = trackData[index];
  const url = track.enlace || track.dropbox_url || track.url;
  if (!url) return;

  // Si es la misma pista, solo alternamos play/pause
  if (currentTrack === index && audio.src === url) {
    if (!audio.paused) {
      audio.pause();
    } else {
      audio.play().catch(err => console.warn("⚠️ Error al reanudar:", err));
    }
    return;
  }

  currentTrack = index;
  
  const progress = JSON.parse(localStorage.getItem("playlistProgress")) || {};
  progress[currentPlaylistName] = currentTrack;
  localStorage.setItem("playlistProgress", JSON.stringify(progress));
  
  // 1. Actualizar metadatos de texto
  const titleEl = document.getElementById("trackTitle");
  const artistEl = document.getElementById("trackArtist");
  const durEl = document.getElementById("totalDuration");
  
  if (titleEl) titleEl.textContent = track.nombre || "Sin título";
  if (artistEl) artistEl.textContent = track.artista || "Desconocido";
  if (durEl) durEl.textContent = track.duracion || `${trackData.length} Pistas`;
  
  actualizarEstadoFavoritoActual();

  // 2. Iniciar la carga y reproducción
  audio.src = url;
  audio.load();
  
  audio.play().catch(err => {
    console.warn("⏸️ Reproducción en pausa (esperando interacción del usuario):", err.message);
  });

  // 3. Renderizar el carrusel en el siguiente frame
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
audio.addEventListener("timeupdate", () => {
  // ✅ FRENAR ACTUALIZACIÓN VISUAL SI ESTAMOS EN MODO LISTAS
  if (currentMode === "playlists") return; 

  if (isNaN(audio.duration)) return;
  
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  const progressFill = document.getElementById("progressFill");
  const currentTimeEl = document.getElementById("currentTime");
  const totalDurationEl = document.getElementById("totalDuration");

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
    let nextIndex = Math.floor(Math.random() * trackData.length);
    activarReproduccion(nextIndex, "shuffle-next");
  } else if (repeatActive) {
    activarReproduccion(currentTrack, "auto-repeat-current");
  } else {
    const nextIndex = currentTrack + 1;
    if (nextIndex < trackData.length) {
      activarReproduccion(nextIndex, "auto-next");
    } else {
      console.log("⏹️ Fin de la playlist actual.");
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
      abrirOverlayFullscreen("section-video");
    } else if (sectionName === "games") {
      abrirOverlayFullscreen("section-games");
    } else if (sectionName === "music") {
      cerrarOverlay();
      if (currentMode === "music" && trackData.length > 0 && audio.src) {
        if (!audio.paused) {
          audio.pause();
        } else {
          audio.play().catch(err => console.warn("⚠️", err));
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
// MEDIA SESSION API
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function actualizarMediaSession(track) {
  if (!("mediaSession" in navigator)) return;

  const coverUrl = track.portada || track.caratula || track.imagen || track.cover || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.nombre || "Sin título",
    artist: track.artista || "Desconocido",
    album: currentPlaylistName,
    artwork: [
      { src: coverUrl, sizes: "512x512", type: "image/png" }
    ]
  });

  // Los controles del sistema operativo seguirán funcionando aunque no haya botón en pantalla
  navigator.mediaSession.setActionHandler("play", () => { audio.play(); });
  navigator.mediaSession.setActionHandler("pause", () => { audio.pause(); });
  navigator.mediaSession.setActionHandler("previoustrack", () => { 
    const prevIndex = currentTrack === 0 ? trackData.length - 1 : currentTrack - 1;
    activarReproduccion(prevIndex, "prev-btn");
  });
  navigator.mediaSession.setActionHandler("nexttrack", () => { 
    const nextIndex = (currentTrack + 1) % trackData.length;
    activarReproduccion(nextIndex, "next-btn");
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
  
  if (windowWidth > 500 && windowHeight > 900) {
    if (windowWidth < targetWidth || windowHeight < targetHeight) {
      const scale = Math.min(windowWidth / targetWidth, windowHeight / targetHeight);
      stage.style.transform = `scale(${scale})`;
    } else {
      stage.style.transform = "none";
    }
  } else {
    stage.style.transform = "none";
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cargar videos de prueba al iniciar (DEMO)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
setTimeout(() => {
  agregarVideo("cq1Grx7qCLw", "Video de Prueba - YouTube");
}, 1000);

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Selector de juegos
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
  
  container.innerHTML = '';
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
    document.querySelectorAll(".game-btn").forEach(btn => btn.classList.remove("active"));
    gameBtn.classList.add("active");
    const gameKey = gameBtn.dataset.game;
    cargarJuego(gameKey);
  }
});

} // <--- ✅ ESTE ES EL CIERRE DE LA FUNCIÓN `iniciarReproductor()`. NO BORRAR.

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 DISPARADOR HÍBRIDO (Va FUERA de la función, al final absoluto del archivo)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarReproductor);
} else {
  if (document.getElementById('audio')) {
    iniciarReproductor();
  } else {
    window.addEventListener('player-dom-ready', iniciarReproductor);
  }
}