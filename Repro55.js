//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 INICIALIZACIÓN Y ESTADO GLOBAL (MODO LOCAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let gestureDetected = false;
let trackData = [];
let currentTrack = null;
let currentPlaylistName = "actual";
let currentMode = "music"; // "music" o "playlists"

let repeatActive = false;
let shuffleActive = false;

const audio = document.getElementById("audio");

// Elementos de metadatos y controles
const TRACK_TITLE_EL    = document.getElementById("trackTitle");
const TRACK_ARTIST_EL   = document.getElementById("trackArtist");
const TRACK_DURATION_EL = document.getElementById("trackDuration");
const currentTimeEl     = document.getElementById("currentTime");
const totalDurationEl   = document.getElementById("totalDuration");
const progressBar       = document.getElementById("progressBar");
const progressContainer = document.getElementById("progressContainer");

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

// Catálogo oficial de listas
const PLAYLISTS_MAP = [
  { key: "actual",      nombre: "Novedades",         file: "https://radio-tekileros.vercel.app/Actual.json",     clave: "actual",     coverIndex: 0 },
  { key: "exitos",      nombre: "Éxitos",            file: "https://radio-tekileros.vercel.app/Exitos.json",     clave: "exitos",     coverIndex: 1 },
  { key: "hardcore",    nombre: "Ruido de Lata",     file: "https://radio-tekileros.vercel.app/HardCore.json",   clave: "hardcore",   coverIndex: 2 },
  { key: "baladasrock", nombre: "Baladas Rock",      file: "https://radio-tekileros.vercel.app/BaladasRock.json",clave: "baladasrock", coverIndex: 3 },
  { key: "rumba",       nombre: "Rumba Caliente",    file: "https://radio-tekileros.vercel.app/Rumba.json",      clave: "rumba",      coverIndex: 4 },
  { key: "bandida",     nombre: "Bandida",           file: "https://radio-tekileros.vercel.app/Bandida.json",    clave: "bandida",    coverIndex: 5 },
  { key: "vina_rock",   nombre: "Viña Rock",         file: "https://radio-tekileros.vercel.app/ViñaRock.json",   clave: "vina_rock",  coverIndex: 6 },
  { key: "guitarhero",  nombre: "Guitar Hero",       file: "https://radio-tekileros.vercel.app/HeavyMetal.json", clave: "Heavy Metal", coverIndex: 7 },
  { key: "razteca",     nombre: "Festival Razteca",  file: "https://radio-tekileros.vercel.app/Razteca.json",    clave: "razteca",    coverIndex: 8 }
];

function setDefaultMetadata() {
  if (TRACK_TITLE_EL)    TRACK_TITLE_EL.textContent    = "NUEVA FAMILIA";
  if (TRACK_ARTIST_EL)   TRACK_ARTIST_EL.textContent   = "22 de Agosto 2012";
  if (TRACK_DURATION_EL) TRACK_DURATION_EL.textContent = "17 Fotos";
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ Inicialización ÚNICA y Gesto Humano
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  setDefaultMetadata();
  precargarImagenesPlaylists();  // ✅ Precargar imágenes
  cargarPlaylist("actual");
  ajustarEscalaReproductor();    // ✅ Ajustar escala al inicio

  document.addEventListener("click", async () => {
    if (gestureDetected) return;
    gestureDetected = true;
    audio.muted = false;
    console.log("🟢 Interacción humana detectada: Audio habilitado.");
  }, { once: true });
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ Precarga de imágenes de playlists
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function precargarImagenesPlaylists() {
  PLAYLISTS_MAP.forEach(playlist => {
    const img = new Image();
    const coverImageSrc = originalCoverImages[playlist.coverIndex % originalCoverImages.length] || originalCoverImages[0];
    img.src = coverImageSrc;
  });
  console.log("🖼️ Imágenes de playlists precargadas");
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📂 Cargar playlist según nombre y raíz - CON MEMORIA DE PROGRESO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function cargarPlaylist(nombre) {
  currentPlaylistName = nombre;

  try {
    if (nombre === "favoritos") {
      const favs = JSON.parse(localStorage.getItem("userFavorites")) || [];
      trackData = favs;
      currentMode = "music";
      
      // ✅ Verificar progreso guardado para favoritos
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
    if (nombre === "vina_rock" && data[clave]) {
      const sublistas = Object.values(data[clave]);
      pistas = sublistas.flat();
    } else if (data[clave]) {
      pistas = data[clave];
    } else if (Array.isArray(data)) {
      pistas = data;
    } else {
      console.error(`❌ La clave "${clave}" no existe en ${file}.`);
      return;
    }

    trackData = pistas;
    currentMode = "music";
    
    // ✅ VERIFICAR PROGRESO GUARDADO PARA ESTA PLAYLIST
    const progress = JSON.parse(localStorage.getItem("playlistProgress")) || {};
    if (progress[nombre] !== undefined && progress[nombre] >= 0 && progress[nombre] < trackData.length) {
      currentTrack = progress[nombre];
      console.log(`▶️ Retomando playlist "${etiqueta}" desde el track ${currentTrack + 1}`);
    } else {
      currentTrack = 0;
      console.log(`▶️ Iniciando playlist "${etiqueta}" desde el principio`);
    }
    
    renderizarCaratulasCarrusel();
    
    if (trackData && trackData.length > 0) {
      activarReproduccion(currentTrack, "playlist-loaded");
    }

    const playlistLabel = document.getElementById("track-playlist");
    if (playlistLabel) playlistLabel.textContent = `Playlist: ${etiqueta}`;

  } catch (err) {
    console.error(`❌ Error al cargar playlist "${nombre}":`, err);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎠 Renderizado del Carrusel Cíclico (Con portada de playlist móvil)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderizarCaratulasCarrusel() {
  if (currentMode !== "music" || !trackData || trackData.length === 0) return;

  // 1. Obtener la imagen de la portada de la playlist actual
  const matchPlaylist = PLAYLISTS_MAP.find(p => p.key === currentPlaylistName);
  const playlistCoverSrc = matchPlaylist 
    ? (originalCoverImages[matchPlaylist.coverIndex % originalCoverImages.length] || originalCoverImages[0])
    : originalCoverImages[0];

  // 2. Crear un array de visualización que incluye la portada como un "track virtual" al final
  const displayData = [...trackData];
  displayData.push({
    esPortadaPlaylist: true,
    nombre: "Portada de Playlist",
    artista: currentPlaylistName,
    caratula: playlistCoverSrc,
    enlace: null // Sin enlace para evitar que se intente reproducir
  });

  const totalItems = displayData.length;

  for (let i = 0; i < 9; i++) {
    const coverElement = covers[i];
    if (!coverElement) continue;

    const imgElement = coverElement.querySelector("img");
    
    // El centro (i=4) es currentTrack. Offset desde el centro.
    const offset = i - 4;
    let itemIndex = (currentTrack + offset) % totalItems;
    itemIndex = (itemIndex + totalItems) % totalItems;

    const targetData = displayData[itemIndex];
    const isCurrent = (i === 4 && !targetData.esPortadaPlaylist);

    if (imgElement && targetData) {
      imgElement.src = targetData.caratula || "https://santi-graphics.vercel.app/assets/SG.ico";
    }

    // 3. Manejo especial para la portada de la playlist
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

  inicializarArrastreCarrusel();
  console.log(`🔄 Carrusel sincronizado. Slot activo (i=4): ${currentTrack + 1}`);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ Renderizado Dinámico de Carátulas (Modo Music / Favoritos)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderizarCaratulasMusica() {
  currentMode = "music";
  const carousel = document.querySelector(".carousel-arc");
  if (!carousel) return;

  carousel.innerHTML = "";

  if (!trackData || trackData.length === 0) {
    console.warn("⚠️ No hay pistas para renderizar en esta playlist.");
    return;
  }

  const totalTracks = trackData.length;
  const angleStep = Math.min(15, 120 / Math.max(totalTracks, 1)); 

  trackData.forEach((track, index) => {
    const coverDiv = document.createElement("div");
    coverDiv.className = `arc-cover ${index === currentTrack ? "active" : ""}`;
    
    const baseAngle = 30 + (index * angleStep);
    coverDiv.style.setProperty("--a", `${baseAngle}deg`);
    coverDiv.dataset.baseAngle = baseAngle;
    coverDiv.dataset.index = index;
    coverDiv.dataset.pos = index;

    const imgUrl = track.caratula || track.imagen || track.cover || "https://santi-graphics.vercel.app/assets/SG.ico";
    
    const imgElement = document.createElement("img");
    imgElement.src = imgUrl;
    imgElement.alt = track.nombre || `Pista ${index + 1}`;
    
    coverDiv.appendChild(imgElement);

    coverDiv.addEventListener("click", () => {
      activarReproduccion(index, "carousel-click");
    });

    carousel.appendChild(coverDiv);
  });

  inicializarArrastreCarrusel();
  console.log(`🎶 Renderizadas ${totalTracks} pistas dinámicamente en el carrusel.`);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖱️ Auxiliar para Arrastre Dinámico Infinito
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function inicializarArrastreCarrusel() {
  const carousel = document.querySelector(".carousel-arc");
  if (!carousel) return;

  let isDragging = false;
  let startY = 0;
  let currentRotationOffset = 0;
  const activeCovers = carousel.querySelectorAll(".arc-cover");

  function startDrag(e) {
    if (e.target.closest('.nav-icons-arc') || e.target.closest('.metadata-panel') || e.target.closest('.content-overlay')) return;
    
    isDragging = true;
    startY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    carousel.style.transition = "none";
    
    if (!e.type.includes("touch")) {
      e.preventDefault();
    }
  }

  function onDrag(e) {
    if (!isDragging) return;

    const currentY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY;
    
    currentRotationOffset += deltaY;
    startY = currentY;

    const trackShift = Math.floor(-currentRotationOffset / 35);
    
    if (trackData.length > 0) {
      const totalTracks = trackData.length;
      let temporaryBaseTrack = (currentTrack + trackShift) % totalTracks;
      temporaryBaseTrack = (temporaryBaseTrack + totalTracks) % totalTracks;

      actualizarRanurasEnTiempoReal(temporaryBaseTrack);
    }
  }

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    carousel.style.transition = "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)";

    const trackShift = Math.round(-currentRotationOffset / 35);
    if (trackShift !== 0 && trackData.length > 0) {
      const totalTracks = trackData.length;
      currentTrack = (currentTrack + trackShift) % totalTracks;
      currentTrack = (currentTrack + totalTracks) % totalTracks;
    }

    currentRotationOffset = 0;
    renderizarCaratulasCarrusel();
    actualizarEstadoFavoritoActual(); // ✅ Actualizar corazón al soltar
  }

    function actualizarRanurasEnTiempoReal(baseTrackIndex) {
        const matchPlaylist = PLAYLISTS_MAP.find(p => p.key === currentPlaylistName);
        const playlistCoverSrc = matchPlaylist 
          ? (originalCoverImages[matchPlaylist.coverIndex % originalCoverImages.length] || originalCoverImages[0])
          : originalCoverImages[0];

        // Incluir la portada en los datos de visualización temporal
        const displayData = [...trackData];
        displayData.push({
          esPortadaPlaylist: true,
          caratula: playlistCoverSrc
        });

        const totalItems = displayData.length;
        if (totalItems === 0) return;

        activeCovers.forEach((coverElement, i) => {
          const imgElement = coverElement.querySelector("img");
          const offset = i - 4;
          let mappedIndex = (baseTrackIndex + offset) % totalItems;
          mappedIndex = (mappedIndex + totalItems) % totalItems;

          const targetData = displayData[mappedIndex];
          if (imgElement && targetData) {
            imgElement.src = targetData.caratula || "https://santi-graphics.vercel.app/assets/SG.ico";
          }

          if (targetData.esPortadaPlaylist) {
            coverElement.dataset.trackIndex = "playlist-cover";
            coverElement.classList.add("is-playlist-cover");
            coverElement.classList.remove("active");
          } else {
            coverElement.dataset.trackIndex = mappedIndex;
            coverElement.classList.remove("is-playlist-cover");
            if (i === 4 && baseTrackIndex === currentTrack) {
              coverElement.classList.add("active");
            } else {
              coverElement.classList.remove("active");
            }
          }
        });
      }

  function handleWheel(e) {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    if (trackData.length > 0) {
      const totalTracks = trackData.length;
      currentTrack = (currentTrack + direction + totalTracks) % totalTracks;
      renderizarCaratulasCarrusel();
      actualizarEstadoFavoritoActual(); // ✅ Actualizar corazón al usar rueda
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
// 📚 Renderizado Dinámico de Playlists (Modo Directorio) - UNIFICADO Y OPTIMIZADO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderizarCaratulasPlaylists() {
  document.querySelector(".player-container").classList.add("mode-playlists");
  
  currentMode = "playlists";
  contentOverlay.classList.remove("active");
  
  const carousel = document.querySelector(".carousel-arc");
  if (!carousel) return;

  requestAnimationFrame(() => {
    PLAYLISTS_MAP.forEach((playlist, index) => {
      if (covers[index]) {
        const imgElement = covers[index].querySelector("img");
        const coverImageSrc = originalCoverImages[playlist.coverIndex % originalCoverImages.length] || originalCoverImages[0];
        
        if (imgElement) {
          imgElement.src = coverImageSrc;
          imgElement.loading = "eager";
        }
        
        covers[index].classList.remove("active");
        covers[index].dataset.key = playlist.key;
      }
    });
    
    setTimeout(() => {
      document.querySelector(".player-container").classList.remove("mode-playlists");
    }, 100);
  });

  console.log(`📂 Modo Playlists activo en el carrusel.`);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ Reproductor Principal (Play / Pause / Cambio de Pista) - CON GUARDADO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  
  // ✅ GUARDAR PROGRESO EN LOCALSTORAGE
  const progress = JSON.parse(localStorage.getItem("playlistProgress")) || {};
  progress[currentPlaylistName] = currentTrack;
  localStorage.setItem("playlistProgress", JSON.stringify(progress));
  
  if (TRACK_TITLE_EL)    TRACK_TITLE_EL.textContent    = track.nombre || "Sin título";
  if (TRACK_ARTIST_EL)   TRACK_ARTIST_EL.textContent   = track.artista || "Desconocido";
  if (TRACK_DURATION_EL) TRACK_DURATION_EL.textContent = track.duracion || `${trackData.length} Pistas`;

  actualizarMediaSession(track);
  actualizarEstadoFavoritoActual();
  renderizarCaratulasCarrusel();

  audio.src = url;
  audio.load();
  audio.play().then(() => {
    if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
  }).catch(err => {
    console.warn("⚠️ Reproducción pausada por políticas del navegador:", err);
    if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎮 Controles Multimedia
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
// ⏱️ Gestión de Tiempos y Barra de Progreso
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// al inicio del archivo, así que los usamos directamente.
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
// 🖱️ Control de Clics en el Carrusel (Con protección para portada de playlist)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
covers.forEach((cover, index) => {
  cover.addEventListener("click", async () => {
    if (currentMode === "playlists") {
      const key = cover.dataset.key;
      if (key) {
        console.log(`📂 Seleccionando playlist: ${key}`);
        await cargarPlaylist(key);
      }
      return;
    }

    const trackIdx = cover.dataset.trackIndex;
    
    // ✅ IGNORAR CLICS EN LA PORTADA DE LA PLAYLIST PARA EVITAR ERRORES
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
// 🔄 Secuencia Automática (Evento Ended) - CON LIMPIEZA DE PROGRESO
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
// 🗂️ Control de Pestañas e Iconos del Arco (Nav Icons)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
navIcons.forEach(icon => {
  icon.addEventListener("click", async () => {
    const sectionName = icon.getAttribute("data-section");

    navIcons.forEach(i => i.classList.remove("active"));
    icon.classList.add("active");

    if (sectionName === "video") {
      // ✅ Abrir overlay fullscreen de videos
      abrirOverlayFullscreen("section-video");
    } else if (sectionName === "games") {
      // ✅ Abrir overlay fullscreen de juegos
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
// ⭐ Gestión de Favoritos: Agregar o Quitar del localStorage
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
          caratula: trackObj.caratula || trackObj.imagen || trackObj.cover,
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
// ⭐ Gestión de Favoritos: Actualizar estado visual del corazón
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
// 🎮 Control de Overlay Fullscreen (Video / Juegos)
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
}

function cerrarOverlay() {
  contentOverlay.classList.remove("active");
  contentOverlay.classList.remove("full-screen");
  contentSections.forEach(sec => sec.classList.remove("active"));
  
  // Si estábamos en modo music, volver a mostrar el carrusel normal
  if (currentMode === "music") {
    // No hacer nada, el carrusel ya está visible
  } else if (currentMode === "playlists") {
    renderizarCaratulasPlaylists();
  }

  console.log("❌ Overlay cerrado");
}

// Cierre con botón X
document.querySelectorAll(".content-overlay .btn-close").forEach(btn => {
  btn.addEventListener("click", () => {
    cerrarOverlay();
  });
});

// Cierre con tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && contentOverlay.classList.contains("active")) {
    cerrarOverlay();
  }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📹 Inyectar Video de YouTube
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
// 🎮 Inyectar Juego en iframe
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
// 📱 MEDIA SESSION API (Para reproducción en background y pantalla de bloqueo)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function actualizarMediaSession(track) {
  if (!("mediaSession" in navigator)) return; // Si el navegador no lo soporta, salir

  const coverUrl = track.caratula || track.imagen || track.cover || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";

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

  // Definir qué hacen los botones de la pantalla de bloqueo del celular
  navigator.mediaSession.setActionHandler("play", () => {
    audio.play();
    if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audio.pause();
    if (btnPlayPause) btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
  });

  navigator.mediaSession.setActionHandler("previoustrack", () => {
    if (btnPrev) btnPrev.click(); // Reutiliza tu lógica existente
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    if (btnNext) btnNext.click(); // Reutiliza tu lógica existente
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📐 Ajuste automático de escala (Solo para desktop pequeño)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ajustarEscalaReproductor() {
  const stage = document.querySelector(".player-stage");
  if (!stage) return;
  
  const targetHeight = 860;
  const targetWidth = 440;
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  
  // ✅ Solo escalar en desktop si la ventana es más pequeña que el reproductor
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
  
  // ✅ En móvil: sin escala, ocupa 100% (controlado por CSS)
  stage.style.removeProperty("--stage-scale");
  stage.style.transform = "none";
}

window.addEventListener("resize", ajustarEscalaReproductor);
window.addEventListener("DOMContentLoaded", ajustarEscalaReproductor);

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Cargar videos de prueba al iniciar (DEMO)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  // Agregar video de prueba después de un pequeño delay
  setTimeout(() => {
    // ID del video: cq1Grx7qCLw (extraído de tu URL)
    agregarVideo("cq1Grx7qCLw", "Video de Prueba - YouTube");
  }, 1000);
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎮 Selector de juegos (Con tus enlaces originales exactos)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const gamesData = {
  "mario-dk": {
    url: "https://www.retrogames.cc/gameboyadvance-games/mario-vs-donkey-kong-e-rising-sun.html",
    title: "Mario vs. Donkey Kong"
  },
  "pokemon": {
    url: "https://www.retrogames.cc/gameboyadvance-games/pokemon-edicion-esmeralda-s-independent.html",
    title: "Pokémon - Versión Esmeralda"
  },
  "mario-luigi": {
    url: "https://www.retrogames.cc/embed/26855-mario-and-luigi-superstar-saga-e-menace.html",
    title: "Mario & Luigi: Superstar Saga"
  },
  "zelda": {
    url: "https://www.retrogames.cc/gameboyadvance-games/the-legend-of-zelda-a-link-to-the-past-e-cezar.html",
    title: "The Legend of Zelda - A Link to the Past & Four Swords"
  }
};

function cargarJuego(gameKey) {
  const container = document.getElementById("activeGameContainer");
  const gameData = gamesData[gameKey];
  
  if (!container || !gameData) {
    console.warn(`⚠️ Juego "${gameKey}" no configurado`);
    return;
  }
  
  // Limpiar contenedor para que solo se cargue uno a la vez
  container.innerHTML = '';
  
  const item = document.createElement("div");
  item.className = "media-item";
  item.style.aspectRatio = "4/3";
  
  // Se inyecta exactamente la URL que proporcionaste
  item.innerHTML = `
    <iframe 
      src="${gameData.url}" 
      width="100%" 
      height="100%"
      frameborder="no" 
      allowfullscreen="true" 
      scrolling="no"
      allow="cross-origin-isolated">
    </iframe>
    <div class="media-title">${gameData.title}</div>
  `;
  
  container.appendChild(item);
  console.log(`🎮 Juego cargado: ${gameData.title}`);
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

// Cargar primer juego por defecto al abrir el overlay de juegos
const originalAbrirOverlay = window.abrirOverlayFullscreen;
window.abrirOverlayFullscreen = function(sectionId) {
  originalAbrirOverlay(sectionId);
  
  if (sectionId === "section-games") {
    setTimeout(() => {
      cargarJuego("mario-luigi");
    }, 500);
  }
};