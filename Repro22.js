// =======================================================
// Repro22.js - VERSIÓN FINAL (Metadatos corregidos, Prisma intacto)
// =======================================================
let trackData = [];
let currentTrack = null;
let modoActual = "radio";
let audio = document.getElementById("player");
let gestureDetected = false;
let radioIntervalId = null;
let lastTrackTitle = "";

// Variables de rotación del Prisma
let rotateX = -30;
let rotateY = -45;

// URLs y Constantes
const RADIO_STREAM_URL = "https://technoplayerserver.net:8018/stream";
const COVER_FALLBACK = "assets/covers/Cover1.png";

// Elementos DOM
const scene = document.querySelector('.scene');
const cube = document.querySelector('.cube');
const playPauseBtn = document.getElementById("play-btn");
const nextBtn = document.getElementById("forward-btn");
const prevBtn = document.getElementById("rewind-btn");
const btnRadio = document.getElementById("btn-radio");

const playIcon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
const mainCover = document.querySelector(".main-cover");
const artistEl = document.querySelector(".artist");
const trackEl = document.querySelector(".track");
const albumEl = document.getElementById("track-album");

// =======================================================
// 🖼️ FUNCIONES AUXILIARES
// =======================================================
function setCover(url) {
  if (!mainCover) return;
  mainCover.style.backgroundImage = `url("${url}")`;
  mainCover.style.backgroundSize = "cover";
  mainCover.style.backgroundPosition = "center";
}

function actualizarCaratulaLocal(coverUrl) {
  const url = coverUrl || COVER_FALLBACK;
  const img = new Image();
  img.onload = () => setCover(url);
  img.onerror = () => setCover(COVER_FALLBACK);
  img.src = url;
}

function setPlayIcon(isPlaying) {
  if (!playIcon) return;
  playIcon.classList.remove("fa-play", "fa-pause");
  playIcon.classList.add(isPlaying ? "fa-pause" : "fa-play");
}

// =======================================================
// 🎨 CARÁTULA RADIO DESDE ITUNES (Versión final)
// =======================================================
async function actualizarCaratulaRadio(artist, title) {
  if (!artist || !title) {
    setCover(COVER_FALLBACK);
    return;
  }

  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("iTunes API failed");
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const art100 = data.results[0].artworkUrl100;
      const art512 = art100.replace("100x100bb", "512x512bb");
      setCover(art512);
    } else {
      setCover(COVER_FALLBACK);
    }
  } catch (e) {
    console.warn("Carátula iTunes falló:", e);
    setCover(COVER_FALLBACK);
  }
}

// =======================================================
// 📝 FUNCIÓN CENTRAL DE METADATOS
// =======================================================
function setMeta(artist, title, albumOrGenero) {
  const artistText = artist || "";
  const titleText = title || "";
  const albumText = albumOrGenero || "";

  // Construir cadena con separadores solo si hay valores
  let metaString = "";
  if (artistText) metaString += artistText;
  if (artistText && titleText) metaString += " - ";
  if (titleText) metaString += titleText;
  if (albumText) metaString += " | " + albumText;

  // Actualizar directamente los spans definidos en esta versión
  if (artistEl) artistEl.textContent = artistText;
  if (trackEl) trackEl.textContent = titleText;
  if (albumEl) albumEl.textContent = albumText;
}

// =======================================================
// 📻 METADATOS RADIO (Versión estable)
// =======================================================
function actualizarMetadatosRadio() {
  const url = "https://technoplayerserver.net:8018/stats?json=1&sid=1";
  $.ajax({
    dataType: 'jsonp',
    url: url,
    success: function(data) {
      const cleanedTitle = (data.songtitle || "")
        .trim()
        .replace(/AUTODJ/gi, "")
        .replace(/\|\s*$/g, "")
        .trim();

      if (!cleanedTitle || cleanedTitle.toLowerCase().includes("offline")) {
        setMeta("Radio", "Sin Datos", "Radio Streaming Activado");
        setCover(COVER_FALLBACK); // ✅ usar setCover
        return;
      }

      let artist = "Radio";
      let title = cleanedTitle;
      const parts = cleanedTitle.split(/ - | – /);
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      }

      setMeta(artist, title, "Radio Streaming Activado");

      // ✅ aplicar marquesina sobre los elementos correctos
      aplicarMarquesina(trackEl);
      aplicarMarquesina(artistEl);

      // ✅ actualizar carátula con iTunes
      if (title !== lastTrackTitle) {
        lastTrackTitle = title;
        actualizarCaratulaRadio(artist, title);
      }
    },
    error: function() {
      setMeta("Error de conexión", "Sin Datos", "Radio Streaming Activado");
      setCover(COVER_FALLBACK); // ✅ usar setCover
    },
    timeout: 10000
  });
}

function iniciarActualizacionRadio() {
  detenerActualizacionRadio();
  actualizarMetadatosRadio();
  radioIntervalId = setInterval(actualizarMetadatosRadio, 12000);
}

function detenerActualizacionRadio() {
  if (radioIntervalId) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }

}

// =======================================================
// 🛠️ COMPLEMENTO DE FUNCIONES FALTANTES
// =======================================================

// Fallback de carátula (equivalente a validarCaratula en la lógica vieja)
function validarCaratula(url) {
  const img = new Image();
  img.onload = () => setCover(url);
  img.onerror = () => setCover(COVER_FALLBACK);
  img.src = url;
}

// Efecto marquesina para texto largo
function aplicarMarquesina(element) {
  if (!element) return;
  const content = element.textContent || "";
  element.style.whiteSpace = "nowrap";
  element.style.overflow = "hidden";
  element.style.textOverflow = "ellipsis";

  // Si el texto es muy largo, activar animación
  if (content.length > 25) {
    element.classList.add("marquee");
  } else {
    element.classList.remove("marquee");
  }
}

// =======================================================
// 📦 METADATOS LOCAL
// =======================================================
function cargarTracksDesdeJSON() {
  fetch("Repro22.json")
    .then(res => res.ok ? res.json() : Promise.reject(`HTTP error ${res.status}`))
    .then(data => {
      const tracks = Array.isArray(data?.hits) ? data.hits : Array.isArray(data) ? data : [];
      if (!tracks.length) {
        console.warn("No hay pistas válidas en el JSON");
        return;
      }
      trackData = tracks;
      currentTrack = 0;
      activarReproduccion(0, "initial-load");
    })
    .catch(err => console.error("Error al cargar JSON:", err));
}

function activarReproduccion(index, modo = "manual") {
  if (modoActual !== "local") return;
  if (index < 0 || index >= trackData.length) return;

  const track = trackData[index];
  if (!track?.enlace) return;

  currentTrack = index;

  // Usar setMeta para mostrar artista, título y álbum/género
  setMeta(
    track.artista || "Artista Desconocido",
    track.nombre || "Título Desconocido",
    track.album || track.genero || "Álbum"
  );

  audio.src = track.enlace;
  audio.load();

  actualizarCaratulaLocal(track.caratula);

  if (modo !== "initial-load" && gestureDetected) {
    audio.play()
      .then(() => setPlayIcon(true))
      .catch(err => {
        console.warn("Reproducción bloqueada:", err);
        setPlayIcon(false);
      });
  } else if (modo === "initial-load") {
    setPlayIcon(false);
  }
}

// =======================================================
// MODOS
// =======================================================
function activarModoRadio(fromSwitch = false) {
  modoActual = "radio";
  detenerActualizacionRadio();

  audio.pause();
  audio.src = RADIO_STREAM_URL;
  audio.load();

  if (artistEl) artistEl.textContent = "Conectando...";
  if (trackEl) trackEl.textContent = "Radio";
  if (albumEl) albumEl.textContent = "Radio Streaming Activado";
  setCover(COVER_FALLBACK);
  setPlayIcon(false);

  iniciarActualizacionRadio();

  if (fromSwitch && gestureDetected) {
    const tryPlay = () => {
      if (modoActual !== "radio") return;
      audio.play()
        .then(() => setPlayIcon(true))
        .catch(err => console.warn("Error al reproducir Radio:", err));
      audio.removeEventListener("loadeddata", tryPlay);
      audio.removeEventListener("canplay", tryPlay);
    };
    if (audio.readyState >= 3) tryPlay();
    else {
      audio.addEventListener("loadeddata", tryPlay, { once: true });
      audio.addEventListener("canplay", tryPlay, { once: true });
    }
  }
}

function activarModoLocal(fromSwitch = false) {
  modoActual = "local";
  detenerActualizacionRadio();

  audio.pause();
  setPlayIcon(false);

  if (fromSwitch && trackData.length > 0) {
    activarReproduccion(currentTrack !== null ? currentTrack : 0, "initial-load");
  } else {
    cargarTracksDesdeJSON();
  }
}

// =======================================================
// 💾 CONTROL HÍBRIDO DEL PRISMA
// =======================================================
let isDragging = false;
let previousX, previousY;

const CUBE_ANIMATION_STYLE = 'spin 10s infinite linear';

if (scene && cube) {
    cube.style.animation = CUBE_ANIMATION_STYLE;
    
    scene.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;

        isDragging = true;
        
        previousX = e.clientX;
        previousY = e.clientY;
        
        cube.style.animation = 'none';
        cube.style.transform = `translateZ(-100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        
        scene.style.cursor = 'grabbing';
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        
        scene.style.cursor = 'grab';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const deltaX = e.clientX - previousX;
        const deltaY = e.clientY - previousY;
        
        rotateY += deltaX * 0.5;
        rotateX -= deltaY * 0.5;
        
        rotateX = Math.max(-90, Math.min(90, rotateX));

        cube.style.transform = `translateZ(-100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        
        previousX = e.clientX;
        previousY = e.clientY;
    });

    cube.addEventListener('click', (e) => {
        if (isDragging || e.detail > 1) return;
        
        const isCurrentlyAnimated = cube.style.animation === CUBE_ANIMATION_STYLE;

        if (isCurrentlyAnimated) {
            cube.style.animation = 'none';
            cube.style.transform = `translateZ(-100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        } else {
            cube.style.animation = CUBE_ANIMATION_STYLE;
            cube.style.transform = '';
        }
    });
    
    cube.style.transform = `translateZ(-100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

// =======================================================
// Controles y listeners
// =======================================================
document.addEventListener("click", () => {
  if (!gestureDetected) {
    gestureDetected = true;
    audio.muted = false;
    if (audio.src && audio.paused) {
      audio.play().catch(err => console.warn("Autoplay bloqueado:", err));
    }
  }
}, { once: true });

document.addEventListener("DOMContentLoaded", () => {
  // Inicia en modo radio
  activarModoRadio(false);

  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
      if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;
      }
      if (!audio.src) return;

      if (audio.paused || audio.ended) {
        audio.play()
          .then(() => setPlayIcon(true))
          .catch(err => console.warn("Error al reanudar:", err));
      } else {
        audio.pause();
        setPlayIcon(false);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (modoActual !== "local" || trackData.length === 0) return;
      const nextIndex = (currentTrack + 1) % trackData.length;
      activarReproduccion(nextIndex, "next");
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (modoActual !== "local" || trackData.length === 0) return;
      const prevIndex = (currentTrack - 1 + trackData.length) % trackData.length;
      activarReproduccion(prevIndex, "prev");
    });
  }

  if (btnRadio) {
    btnRadio.addEventListener("click", () => {
      const nextMode = modoActual === "radio" ? "local" : "radio";
      if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;
      }
      if (nextMode === "local") activarModoLocal(true);
      else activarModoRadio(true);
    });
  }

  if (audio) {
    audio.onended = () => {
      if (modoActual !== "local") return;
      const nextIndex = (currentTrack + 1) % trackData.length;
      activarReproduccion(nextIndex, "next");
    };
  }
});