//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 INICIALIZACIÓN GLOBAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let gestureDetected = false;
let lastTrackTitle = "";
let trackHistory = [];
let modoActual = "radio";

// Intervalos y sus IDs de ejecución para cancelar promesas obsoletas (declarados UNA sola vez)
let radioIntervalId = null;
let radioRunId = 0;
let contadorIntervalId = null;
let contadorRunId = 0;

const audio = document.getElementById("player");
const playBtn = document.getElementById("play-btn");
const playIcon = playBtn.querySelector("i");

const TRACK_TITLE_EL   = document.getElementById("track-title");
const TRACK_ARTIST_EL  = document.getElementById("track-artist");
const TRACK_ALBUM_EL   = document.getElementById("track-album");
const COVER_ART_EL     = document.getElementById("cover-art");
const CURRENT_TRACK_DISPLAY_EL = document.getElementById("current-track-display");
const contadorElemento = document.getElementById("contadorRadio");

const rightPanel = document.querySelector(".right-panel");
const contenidoBtn = document.getElementById("contenido-btn");

// Valores por defecto
function setDefaultMetadata() {
  if (TRACK_TITLE_EL)  TRACK_TITLE_EL.textContent  = "Transmisión en vivo";
  if (TRACK_ARTIST_EL) TRACK_ARTIST_EL.textContent = "AutoDJ";
  if (TRACK_ALBUM_EL)  TRACK_ALBUM_EL.textContent  = "Stream";
  if (COVER_ART_EL)    COVER_ART_EL.src            = "https://santi-graphics.vercel.app/assets/covers/DalePlay.png";
  if (CURRENT_TRACK_DISPLAY_EL) CURRENT_TRACK_DISPLAY_EL.textContent = "Transmisión en vivo — Radio Dale Play";
}
setDefaultMetadata();

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ Inicialización del stream y gesto humano
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  // INICIAR INMEDIATAMENTE AL CARGAR
  if (modoActual === "radio") {
    iniciarActualizacionRadio();
    iniciarContadorRadioescuchas();
  }

  document.addEventListener("click", async () => {
    if (gestureDetected) return;
    gestureDetected = true;
    audio.muted = false;

    try {
      await cargarLyricsScript("https://radio-tekileros.vercel.app/lyricsRepro.js");
    } catch (e) {
      console.warn("⚠️ Karaoke no disponible:", e.message);
    }

    if (modoActual === "radio") {
      try {
        if (!audio.src || audio.src === window.location.href) {
          audio.src = "https://technoplayerserver.net/8240/stream";
          audio.load();
        }
        await audio.play();
        if (playIcon) playIcon.classList.replace("fa-play", "fa-pause");
        if (COVER_ART_EL) COVER_ART_EL.classList.add("rotating");
        console.log("🟢 Primer gesto: radio iniciado.");
      } catch (err) {
        console.warn("⚠️ Error al iniciar stream en gesto:", err);
        if (playIcon) playIcon.classList.replace("fa-pause", "fa-play");
      }
    } else if (modoActual === "local") {
      try {
        const necesitaCargar = !Array.isArray(trackData) || trackData.length === 0;
        if (necesitaCargar) {
          console.log("📂 Cargando playlist Actual.json en modo local...");
          await cargarPlaylist("actual");
        }

        if (Array.isArray(trackData) && trackData.length > 0) {
          activarReproduccion(0, "initial-gesture");
          if (playIcon) playIcon.classList.replace("fa-play", "fa-pause");
          console.log(`🟢 Primer gesto: local iniciado con ${trackData.length} pistas.`);
        } else {
          console.warn("⚠️ No hay pistas disponibles en modo local tras gesto.");
        }
      } catch (err) {
        console.error("❌ Error al iniciar modo local tras gesto:", err);
      }
    }
  }, { once: true });
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 Inyección robusta de lyricsRepro34.js
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function cargarLyricsScript(url = "https://radio-tekileros.vercel.app/lyricsRepro.js") {
  const existing = document.getElementById("lyricsRepro34-script");
  if (existing) {
    return new Promise((resolve) => {
      if (window.lyricsLibrary) resolve();
      else existing.addEventListener("load", () => resolve());
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.id = "lyricsRepro34-script";
    script.async = true;

    script.onload = () => {
      console.log("✅ Script lyricsRepro34.js cargado y listo para karaoke.");
      resolve();
    };
    script.onerror = (e) => {
      console.error("❌ Error al cargar lyricsRepro34.js", e);
      reject(new Error("lyricsRepro34.js no disponible"));
    };

    document.body.appendChild(script);
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎤 KARAOKE SINCRONIZADO (usando window.lyricsLibrary)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const karaokePalette = ['#ff4081', '#00e5ff', '#ffd740', '#69f0ae', '#f50057'];
let lyricsTimeline = [];
let lyricsIndex = 0;
let karaokeStarted = false;
let animationActive = false;

function detenerKaraoke() {
  const container = document.querySelector(".lyrics-container");
  if (container) container.innerHTML = "";
  lyricsTimeline = [];
  lyricsIndex = 0;
  karaokeStarted = false;
  animationActive = false;
}

function getCurrentSongId(trackId) {
  if (trackId) return trackId;
  if (trackData[currentTrack]?.id) return trackData[currentTrack].id;
  return "default";
}

function cargarKaraoke(trackId) {
  if (modoActual !== "local") { detenerKaraoke(); return; }

  const container = document.querySelector(".lyrics-container");
  if (!container) return;

  if (window.lyricsLibrary && window.lyricsLibrary[trackId]) {
    lyricsTimeline = window.lyricsLibrary[trackId];
    lyricsIndex = 0;
    karaokeStarted = true;
    animationActive = true;
    container.innerHTML = "";
    requestAnimationFrame(syncLyrics);
    console.log(`🎤 Karaoke sincronizado cargado para ${trackId}`);
  } else {
    console.warn(`⚠️ Karaoke no disponible para ${trackId}`);
    detenerKaraoke();
  }
}

function syncLyrics() {
  if (!Array.isArray(lyricsTimeline) || lyricsTimeline.length === 0) return;
  if (modoActual !== "local") return;

  const now = audio.currentTime;

  while (lyricsIndex < lyricsTimeline.length && now >= lyricsTimeline[lyricsIndex].time) {
    const { text } = lyricsTimeline[lyricsIndex];
    if (!text) { lyricsIndex++; continue; }

    const container = document.querySelector(".lyrics-container");
    if (!container) return;

    const line = document.createElement("p");
    line.classList.add("lyric-line");
    line.style.setProperty("--line-delay", `${lyricsIndex * 0.1}s`);

    const words = text.trim().split(/\s+/);
    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.textContent = word + " ";
      span.style.setProperty("--delay", `${i * 0.2}s`);
      span.style.setProperty("--color", karaokePalette[i % karaokePalette.length]);
      line.appendChild(span);
    });

    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    lyricsIndex++;
  }

  if (!audio.paused && lyricsIndex < lyricsTimeline.length && modoActual === "local") {
    requestAnimationFrame(syncLyrics);
  } else {
    animationActive = false;
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 Eventos de audio para karaoke y reproducción continua
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
audio.addEventListener("play", () => {
  if (modoActual !== "local") { detenerKaraoke(); return; }
  const trackId = getCurrentSongId(trackData[currentTrack]?.id);
  cargarKaraoke(trackId);
});

audio.addEventListener("pause", () => {
  animationActive = false;
});

// 🔁 UNIFICADO: Limpieza de karaoke + reproducción continua
audio.addEventListener("ended", () => {
  // 1. Detener karaoke siempre
  detenerKaraoke();

  // 2. Si no estamos en modo local, no hacemos nada más
  if (modoActual !== "local") return;

  // 3. Lógica de continuación de playlist
  if (shuffleActive) {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * trackData.length);
    } while (nextIndex === currentTrack && trackData.length > 1);
    activarReproduccion(nextIndex, "shuffle-next");
    console.log(`🔀 Shuffle → pista ${nextIndex + 1}`);
  } else {
    const nextIndex = currentTrack + 1;
    if (nextIndex < trackData.length) {
      activarReproduccion(nextIndex, "auto-next");
      console.log(`⏭️ Avanzando automáticamente a pista ${nextIndex + 1}`);
    } else if (repeatActive) {
      activarReproduccion(0, "auto-loop");
      console.log("🔁 Playlist terminada, reiniciando desde el inicio");
    } else {
      console.log("⏹️ Playlist terminada, sin repeat activo");
    }
  }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Función global para registrar historial
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function pushHistoryEntry(artist, title, cover) {
  const time = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const entry = { artist, title, time, cover };
  
  // Evitar duplicados consecutivos
  if (trackHistory.length === 0 || trackHistory[0].title !== title) {
    trackHistory.unshift(entry);
    if (trackHistory.length > 20) trackHistory.pop();
  }
}

// 🚀 NUEVA FUNCIÓN: Actualiza la portada de la entrada más reciente del historial
function actualizarUltimaPortadaEnHistorial(nuevaPortada) {
  if (trackHistory.length > 0) {
    // La entrada en el índice 0 es siempre la más reciente (la que se está reproduciendo)
    trackHistory[0].cover = nuevaPortada;
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cargar playlist según nombre y raíz
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function cargarPlaylist(nombre) {
  try {
    let file, clave, etiqueta;

    if (nombre === "actual") {
      file = "https://radio-tekileros.vercel.app/Actual.json";
      clave = "actual";
      etiqueta = "Novedades";
    } else if (nombre === "exitos") {
      file = "https://radio-tekileros.vercel.app/Exitos.json";
      clave = "exitos";
      etiqueta = "Éxitos";
    } else if (nombre === "hardcore") {
      file = "https://radio-tekileros.vercel.app/HardCore.json";
      clave = "hardcore";
      etiqueta = "Ruido de Lata";
    } else if (nombre === "baladasrock") {
      file = "https://radio-tekileros.vercel.app/BaladasRock.json";
      clave = "baladasrock";
      etiqueta = "Baladas Rock";
    } else if (nombre === "rumba") {
      file = "https://radio-tekileros.vercel.app/Rumba.json";
      clave = "rumba";
      etiqueta = "Rumba Caliente";
    } else if (nombre === "bandida") {
      file = "https://radio-tekileros.vercel.app/Bandida.json";
      clave = "bandida";
      etiqueta = "Bandida";
    } else if (nombre === "vina_rock") {
      file = "https://radio-tekileros.vercel.app/ViñaRock.json";
      clave = "vina_rock";
      etiqueta = "Viña Rock";
    } else if (nombre === "guitarhero") {
      file = "https://radio-tekileros.vercel.app/HeavyMetal.json";
      clave = "Heavy Metal";
      etiqueta = "Guitar Hero";
    } else if (nombre === "razteca") {
      file = "https://radio-tekileros.vercel.app/Razteca.json";
      clave = "razteca";
      etiqueta = "Festival Razteca";
    } else if (nombre === "soytribu") {
      file = "https://radio-tekileros.vercel.app/SoyTribu.json";
      clave = "Soy Tribu";
      etiqueta = "Soy Tribu";
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
    console.log("🗂️ Claves disponibles en JSON:", Object.keys(data));

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
    console.log("🎶 Pistas cargadas:", trackData.length);

    currentTrack = 0;
    activarReproduccion(0, "initial-load");
    generarListaModal();

    const playlistLabel = document.getElementById("track-playlist");
    if (playlistLabel) playlistLabel.textContent = `Playlist: ${etiqueta}`;

    console.log(`✅ Playlist "${etiqueta}" cargada con ${trackData.length} pistas.`);
  } catch (err) {
    console.error(`❌ Error al cargar playlist "${nombre}":`, err);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Variables de estado de playlist
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let trackData = [];
let currentTrack = null;

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ Activar reproducción local
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarReproduccion(index, modo = "manual") {
  if (modoActual !== "local" || index < 0 || index >= trackData.length) return;

  const track = trackData[index];
  const url = track.enlace || track.dropbox_url;
  if (!url) return;

  currentTrack = index;

  if (TRACK_TITLE_EL)  TRACK_TITLE_EL.textContent  = track.nombre;
  if (TRACK_ARTIST_EL) TRACK_ARTIST_EL.textContent = track.artista;
  if (TRACK_ALBUM_EL)  TRACK_ALBUM_EL.textContent  = track.genero || "Desconocido";
  if (COVER_ART_EL) {
    COVER_ART_EL.src = track.caratula || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
    COVER_ART_EL.classList.add("rotating");
  }

  audio.src = url;
  audio.load();

  audio.play().then(() => {
    playIcon.classList.replace("fa-play", "fa-pause");
  }).catch(err => {
    console.warn("⚠️ Error al reproducir pista local:", err);
    playIcon.classList.replace("fa-pause", "fa-play");
    if (COVER_ART_EL) COVER_ART_EL.classList.remove("rotating");
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 Modal de Tracks en modo local
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const playlistBtn = document.getElementById("contenido-btn");
const modalTracks = document.getElementById("modal-playlist");
const closePlaylistModal = document.getElementById("close-playlist-modal");

if (playlistBtn && modalTracks) {
  playlistBtn.addEventListener("click", () => {
    if (modoActual === "local") {
      modalTracks.classList.remove("hidden");
      generarListaModal();
      console.log("🎵 Modal de tracks abierto en modo local");
    } else {
      console.log("ℹ️ Botón Playlist deshabilitado en modo radio");
    }
  });
}

if (closePlaylistModal) {
  closePlaylistModal.addEventListener("click", () => {
    modalTracks.classList.add("hidden");
    console.log("❌ Modal de tracks cerrado");
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalTracks.classList.contains("hidden")) {
    modalTracks.classList.add("hidden");
    console.log("❌ Modal de tracks cerrado con ESC");
  }
});

modalTracks.addEventListener("click", (e) => {
  if (e.target === modalTracks) {
    modalTracks.classList.add("hidden");
    console.log("❌ Modal de tracks cerrado por clic fuera");
  }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Función para generar bloques de pistas
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generarListaModal() {
  const trackListEl = document.getElementById("modal-playlist-tracks");
  const headerEl = document.getElementById("current-track-display");
  if (!trackListEl) return;

  trackListEl.innerHTML = "";
  if (modoActual !== "local") return;

  if (headerEl) {
    if (trackData && trackData.length > 0 && trackData[currentTrack]) {
      const track = trackData[currentTrack];
      headerEl.textContent = `${track.nombre || "Sin título"} — ${track.artista || "Sin artista"}`;
    } else {
      headerEl.textContent = "Sin pista seleccionada — Sin artista";
    }
  }

  if (!Array.isArray(trackData) || trackData.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No hay pistas cargadas.";
    trackListEl.appendChild(li);
    return;
  }

  trackData.forEach((track, index) => {
    const li = document.createElement("li");
    li.classList.add("modal-track-item");

    const img = document.createElement("img");
    img.src = track.caratula || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
    img.alt = "Carátula";
    img.classList.add("track-cover");
    img.style.width = "60px";
    img.style.height = "60px";

    const info = document.createElement("div");
    info.classList.add("track-info");
    info.innerHTML = `
      <strong>${track.nombre || "Sin título"}</strong><br>
      <span>🎤 ${track.artista || "Desconocido"}</span><br>
      <span>💿 ${track.album || "Álbum desconocido"}</span><br>
      <span>⏱️ ${track.duracion || "--:--"}</span>
    `;

    li.addEventListener("click", () => {
      activarReproduccion(index, "modal-click");
      if (headerEl) {
        headerEl.textContent = `${track.nombre || "Sin título"} — ${track.artista || "Sin artista"}`;
      }
      modalTracks.classList.add("hidden");
    });

    li.appendChild(img);
    li.appendChild(info);
    trackListEl.appendChild(li);
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 Modal Historial en panel derecho (solo en modo radio)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const historyModal = document.getElementById("history-modal");
const closeHistoryModal = document.getElementById("close-history-modal");
const historyList = document.getElementById("history-list");
const contenidoIcon = contenidoBtn ? contenidoBtn.querySelector("i") : null;

if (contenidoBtn && historyModal && historyList) {
  contenidoBtn.addEventListener("click", () => {
    if (modoActual !== "radio") {
      console.log("ℹ️ Historial deshabilitado en modo local");
      return;
    }

    contenidoIcon && contenidoIcon.classList.add("animate-spin");
    setTimeout(() => contenidoIcon && contenidoIcon.classList.remove("animate-spin"), 600);

    historyList.innerHTML = "";
    const list = Array.isArray(trackHistory) ? trackHistory : [];

    if (list.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Sin pistas registradas aún…";
      historyList.appendChild(li);
    } else {
      list.forEach(entry => {
        const li = document.createElement("li");
        li.classList.add("modal-track-item");
        li.innerHTML = `
          <img src="${entry.cover || 'https://santi-graphics.vercel.app/assets/covers/DalePlay.png'}" alt="Carátula" class="track-cover" />
          <div class="track-info">
            <strong>${entry.title || ""}</strong><br>
            <span>🎤 ${entry.artist || ""}</span><br>
            <span>🕒 ${entry.time || ""}</span>
          </div>
        `;
        historyList.appendChild(li);
      });
    }

    historyModal.classList.remove("hidden");
    rightPanel && rightPanel.classList.add("show");
    console.log("📜 Modal Historial abierto en modo radio");
  });

  closeHistoryModal && closeHistoryModal.addEventListener("click", () => {
    historyModal.classList.add("hidden");
    console.log("❌ Modal Historial cerrado");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !historyModal.classList.contains("hidden")) {
      historyModal.classList.add("hidden");
      console.log("❌ Modal Historial cerrado con ESC");
    }
  });

  document.addEventListener("click", (e) => {
    const isClickOutside = !historyModal.contains(e.target) && !contenidoBtn.contains(e.target);
    if (!historyModal.classList.contains("hidden") && isClickOutside) {
      historyModal.classList.add("hidden");
      console.log("❌ Modal Historial cerrado por clic fuera");
    }
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📜 Selección automática y cierre del modal de playlist
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const playlistModal = document.getElementById("playlist-modal");
const closeMenuModal = document.getElementById("close-modal-btn");

if (playlistModal) {
  const items = playlistModal.querySelectorAll(".track-list li[data-list]");
  items.forEach(li => {
    li.addEventListener("click", () => {
      const key = li.dataset.list;

      // 🚀 Cambio automático a modo local al seleccionar playlist
      if (modoActual === "radio") {
        modoActual = "local";
        limpiarEstadoRadio();
        
        // Limpiar UI INMEDIATAMENTE antes de cargar la nueva lista
        setDefaultMetadata();
        if (playIcon) playIcon.classList.replace("fa-pause", "fa-play");
        if (COVER_ART_EL) COVER_ART_EL.classList.remove("rotating");
        
        console.log("🔄 Cambio automático a Modo Local desde Modal de Playlists");
      }

      switch (key) {
        case "actual":      cargarPlaylist("actual"); break;
        case "exitos":      cargarPlaylist("exitos"); break;
        case "hardcore":    cargarPlaylist("hardcore"); break;
        case "baladasrock": cargarPlaylist("baladasrock"); break;
        case "rumba":       cargarPlaylist("rumba"); break;
        case "bandida":     cargarPlaylist("bandida"); break;
        case "vina_rock":   cargarPlaylist("vina_rock"); break;
        case "guitarhero":  cargarPlaylist("guitarhero"); break;
        case "razteca":     cargarPlaylist("razteca"); break;
        case "soytribu":    cargarPlaylist("soytribu"); break;
        default:
          console.warn(`❌ Playlist desconocida: ${key}`);
          return;
      }

      playlistModal.classList.add("hidden");

      const playlistLabel = document.getElementById("track-playlist");
      if (playlistLabel) {
        playlistLabel.textContent = `Playlist: ${li.textContent}`;
      }

      console.log(`📂 Playlist cambiada automáticamente a: ${key}`);
    });
  });

  if (closeMenuModal) {
    closeMenuModal.addEventListener("click", () => {
      playlistModal.classList.add("hidden");
      console.log("❌ Modal Playlist cerrado con botón");
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !playlistModal.classList.contains("hidden")) {
      playlistModal.classList.add("hidden");
      console.log("❌ Modal Playlist cerrado con ESC");
    }
  });

  playlistModal.addEventListener("click", (e) => {
    if (e.target === playlistModal) {
      playlistModal.classList.add("hidden");
      console.log("❌ Modal Playlist cerrado por clic fuera");
    }
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ Carátulas desde iTunes (JSONP para file://)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function validarCaratula(url, fallback = "https://santi-graphics.vercel.app/assets/covers/Cover1.png") {
  if (!COVER_ART_EL) return;
  
  const img = new Image();
  img.onload = () => {
    COVER_ART_EL.src = url;
    COVER_ART_EL.classList.add("rotating");
    
    // 🚀 CORRECCIÓN: Si la portada es real (no es el fallback) y estamos en radio, 
    // actualizamos el historial para que el primer track no se quede con la portada por defecto.
    if (url !== fallback && modoActual === "radio") {
      actualizarUltimaPortadaEnHistorial(url);
    }
  };
  
  img.onerror = () => {
    COVER_ART_EL.src = fallback;
    COVER_ART_EL.classList.remove("rotating");
  };
  
  img.src = url;
}

function obtenerCaratulaDesdeiTunes(artist, title) {
  if (!COVER_ART_EL) return;
  
  if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
    validarCaratula("https://santi-graphics.vercel.app/assets/covers/Cover1.png");
    return;
  }

  const cleanArtist = artist.toLowerCase().trim().split(/ [(&]/)[0];
  const cleanTitle = title.toLowerCase().trim().split(/ [(&]/)[0];
  const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: 'jsonp',
    url: url,
    timeout: 8000,
    success: function(data) {
      let cover = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
      if (data.results && data.results.length > 0) {
        cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
      }
      validarCaratula(cover);
    },
    error: function() {
      validarCaratula("https://santi-graphics.vercel.app/assets/covers/Cover1.png");
    }
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔁 Ciclo de actualización del servidor (METADATOS BLINDADO)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function iniciarActualizacionRadio() {
  if (modoActual !== "radio") return;

  if (radioIntervalId) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }

  // ✅ LA URL QUE TÚ MISMO CONFIRMASTE QUE FUNCIONA CON JSONP
  const radioUrl = "https://technoplayerserver.net:8240/stats?json=1&sid=1";

  function actualizarDesdeServidor() {
    if (modoActual !== "radio") return;

    $.ajax({
      dataType: 'jsonp',
      url: radioUrl,
      timeout: 8000,
      success: function(data) {
        if (modoActual !== "radio") return;

        // 1. PROCESAR METADATOS
        const cleanedTitle = (data.songtitle || "")
          .trim()
          .replace(/SANTI MIX DJ/gi, '')
          .replace(/AUTODJ/gi, '')
          .replace(/Radio\s*Dale\s*Play/gi, '')
          .replace(/\|\s*$/g, '')
          .trim();

        if (cleanedTitle && cleanedTitle.length >= 3 && !cleanedTitle.toLowerCase().includes('offline')) {
          if (cleanedTitle.toLowerCase() !== (lastTrackTitle || "").toLowerCase()) {
            lastTrackTitle = cleanedTitle;
            const songtitleSplit = cleanedTitle.split(/ - | – /);
            let artist = songtitleSplit.length >= 2 ? songtitleSplit[0].trim() : "Radio Dale Play";
            let title = songtitleSplit.length >= 2 ? songtitleSplit.slice(1).join(' - ').trim() : cleanedTitle;

            if (TRACK_ARTIST_EL) TRACK_ARTIST_EL.textContent = artist;
            if (TRACK_TITLE_EL)  TRACK_TITLE_EL.textContent  = title;
            if (TRACK_ALBUM_EL)  TRACK_ALBUM_EL.textContent  = "Stream";
            if (CURRENT_TRACK_DISPLAY_EL) CURRENT_TRACK_DISPLAY_EL.textContent = `${title} — ${artist}`;

            pushHistoryEntry(artist, title, COVER_ART_EL ? COVER_ART_EL.src : "");
            obtenerCaratulaDesdeiTunes(artist, title);
          }
        }

        // 2. PROCESAR CONTADOR (en la misma petición, sin esperar 30s para el primer dato)
        if (data.currentlisteners !== undefined && contadorElemento) {
          contadorElemento.textContent = data.currentlisteners;
        }
      },
      error: function() {
        // 🛑 REGLA DE ORO: Si falla, NO tocamos el DOM. Se mantiene la última info y contador válidos.
        console.warn("⚠️ Fallo temporal de red (se mantiene la info actual en pantalla).");
      }
    });
  }

  // 1. Ejecutar INMEDIATAMENTE al cargar (cero retraso)
  actualizarDesdeServidor();
  // 2. Repetir cada 12 segundos (el contador se actualiza en cada ciclo, que es mejor que esperar 30s, pero si prefieres 30s, cambia 12000 por 30000)
  radioIntervalId = setInterval(actualizarDesdeServidor, 12000);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 Contador de radioescuchas (INTEGRADO ARRIBA)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function detenerContadorRadioescuchas() {
  if (contadorIntervalId !== null) clearInterval(contadorIntervalId);
  contadorIntervalId = null;
  contadorRunId++;
}

function iniciarContadorRadioescuchas() {
  // ✅ Ya no hace nada aquí, porque el contador se actualiza junto con los metadatos 
  // en la función de arriba, garantizando que ambos lleguen al mismo tiempo y sin duplicar peticiones.
  if (modoActual !== "radio") return;
  detenerContadorRadioescuchas();
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 BOTONERA
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const powerBtn   = document.getElementById("power-btn");
const powerIcon  = powerBtn.querySelector("i");
const menuBtn    = document.getElementById("menu-btn");
const menuIcon   = menuBtn ? menuBtn.querySelector("i") : null;
const rewindBtn  = document.getElementById("rewind-btn");
const forwardBtn = document.getElementById("forward-btn");
const repeatBtn  = document.getElementById("repeat-btn");
const repeatIcon = repeatBtn ? repeatBtn.querySelector("i") : null;
const shuffleBtn = document.getElementById("shuffle-btn");
const shuffleIcon= shuffleBtn ? shuffleBtn.querySelector("i") : null;

let repeatActive = false;
let shuffleActive = false;

if (powerBtn) {
  powerBtn.addEventListener("click", () => {
    powerIcon.classList.add("animate-spin");
    setTimeout(() => powerIcon.classList.remove("animate-spin"), 600);

    if (!gestureDetected) { 
      gestureDetected = true; 
      audio.muted = false; 
    }

    if (modoActual === "radio") {
      activarModoLocal();
    } else {
      activarModoRadio();
    }

    console.log("🔀 Alternancia de modo:", modoActual);
  });
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    if (menuIcon) {
      menuIcon.classList.add("animate-spin");
      setTimeout(() => menuIcon.classList.remove("animate-spin"), 600);
    }
    const playlistModal = document.getElementById("playlist-modal");
    if (playlistModal) {
      playlistModal.classList.remove("hidden");
      console.log("📂 Modal playlists abierto");
    }
  });
}

if (rewindBtn) {
  rewindBtn.addEventListener("click", () => {
    if (modoActual === "local" && currentTrack > 0) {
      activarReproduccion(currentTrack - 1, "rewind");
      console.log("⏪ Retrocediendo a pista anterior");
    }
  });
}

if (forwardBtn) {
  forwardBtn.addEventListener("click", () => {
    if (modoActual === "local" && currentTrack < trackData.length - 1) {
      activarReproduccion(currentTrack + 1, "forward");
      console.log("⏩ Avanzando a siguiente pista");
    } else if (modoActual === "local" && repeatActive) {
      activarReproduccion(0, "repeat-loop");
      console.log("🔁 Reiniciando playlist desde el inicio");
    }
  });
}

if (repeatBtn) {
  repeatBtn.addEventListener("click", () => {
    repeatActive = !repeatActive;
    repeatBtn.classList.toggle("repeat-active", repeatActive);

    if (repeatIcon) {
      repeatIcon.classList.add("animate-spin");
      setTimeout(() => repeatIcon.classList.remove("animate-spin"), 600);
    }

    console.log(repeatActive ? "🔁 Repeat ACTIVADO" : "🔁 Repeat DESACTIVADO");
  });
}

if (shuffleBtn) {
  shuffleBtn.addEventListener("click", () => {
    shuffleActive = !shuffleActive;
    shuffleBtn.classList.toggle("shuffle-active", shuffleActive);

    if (shuffleIcon) {
      shuffleIcon.classList.add("animate-spin");
      setTimeout(() => shuffleIcon.classList.remove("animate-spin"), 600);
    }

    if (shuffleActive && modoActual === "local" && Array.isArray(trackData) && trackData.length > 0) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * trackData.length);
      } while (nextIndex === currentTrack && trackData.length > 1);

      activarReproduccion(nextIndex, "shuffle-immediate");
      console.log(`🔀 Shuffle activado → cambiando inmediatamente a pista ${nextIndex + 1}`);
    } else {
      console.log("🔀 Shuffle desactivado");
    }
  });
}

playBtn.addEventListener("click", () => {
  if (modoActual === "radio") {
    if (!audio.src) {
      audio.src = "https://technoplayerserver.net/8240/stream";
      audio.load();
    }
  } else {
    if (!audio.src && Array.isArray(trackData) && trackData.length > 0) {
      activarReproduccion(currentTrack ?? 0, "manual-play");
    }
  }

  if (audio.paused) {
    audio.play().then(() => {
      playIcon.classList.replace("fa-play", "fa-pause");
      COVER_ART_EL.classList.add("rotating");
    }).catch(err => console.warn("⚠️ Error al reproducir:", err));
  } else {
    audio.pause();
    playIcon.classList.replace("fa-pause", "fa-play");
    COVER_ART_EL.classList.remove("rotating");
  }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CAMBIO DE MODO LOCAL y RADIO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarModoLocal() {
  modoActual = "local";

  if (radioIntervalId) { clearInterval(radioIntervalId); radioIntervalId = null; }
  if (contadorIntervalId) { clearInterval(contadorIntervalId); contadorIntervalId = null; }

  audio.pause();
  audio.src = "";
  COVER_ART_EL.classList.remove("rotating");
  setDefaultMetadata();

  cargarPlaylist("actual");

  console.log("🎶 Modo Local activado");
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CAMBIO DE MODO: ACTIVAR RADIO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarModoRadio() {
  modoActual = "radio";
  
  // Esto ahora ejecuta la limpieza visual inmediata definida arriba
  limpiarEstadoLocal();

  // Configurar stream de radio
  audio.src = "https://technoplayerserver.net:8240/stream";
  audio.load();
  audio.muted = !gestureDetected;

  audio.play().then(() => {
    if (playIcon) playIcon.classList.replace("fa-play", "fa-pause");
    if (COVER_ART_EL) COVER_ART_EL.classList.add("rotating");
    console.log("📻 Radio reproduciendo automáticamente");
  }).catch(err => {
    console.warn("🔒 Error al iniciar Radio:", err);
    if (playIcon) playIcon.classList.replace("fa-pause", "fa-play");
    if (COVER_ART_EL) COVER_ART_EL.classList.remove("rotating");
  });

  // Iniciar las peticiones de datos
  iniciarActualizacionRadio();
  iniciarContadorRadioescuchas();

  console.log("📻 Modo Radio activado");
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 FUNCIONES DE LIMPIEZA DE ESTADO (CON LIMPIEZA VISUAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function limpiarEstadoRadio() {
  if (radioIntervalId) { clearInterval(radioIntervalId); radioIntervalId = null; }
  if (contadorIntervalId) { clearInterval(contadorIntervalId); contadorIntervalId = null; }
  
  radioRunId++;
  contadorRunId++;
  
  audio.pause();
  audio.src = "";
  detenerKaraoke();
  
  console.log("🧹 Estado de Radio limpiado y promesas obsoletas invalidadas");
}

function limpiarEstadoLocal() {
  // 1. Detener audio y karaoke
  audio.pause();
  audio.src = "";
  detenerKaraoke();
  
  // 2. 🧹 LIMPIEZA VISUAL INMEDIATA (Elimina residuos como "Playlist: Novedades")
  if (TRACK_TITLE_EL) TRACK_TITLE_EL.textContent = "Obteniendo datos...";
  if (TRACK_ARTIST_EL) TRACK_ARTIST_EL.textContent = "Conectando...";
  if (TRACK_ALBUM_EL) TRACK_ALBUM_EL.textContent = "Stream";
  if (CURRENT_TRACK_DISPLAY_EL) CURRENT_TRACK_DISPLAY_EL.textContent = "Conectando a Radio Dale Play...";
  
  // Eliminar residuo del nombre de la playlist local
  const playlistLabel = document.getElementById("track-playlist");
  if (playlistLabel) playlistLabel.textContent = "Radio Dale Play";

  // Resetear portada inmediatamente y detener rotación hasta conectar
  if (COVER_ART_EL) {
    COVER_ART_EL.src = "https://santi-graphics.vercel.app/assets/covers/DalePlay.png";
    COVER_ART_EL.classList.remove("rotating");
  }

  // Opcional: Limpiar historial al cambiar a radio para evitar mezcla de modos
  trackHistory = [];

  console.log("🧹 Estado de Local limpiado y UI reseteada para Radio");
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔊 Volumen inicial y eventos (versión ligera)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let lastVolume = 0.7;

function actualizarVolumen(valor) {
  audio.volume = valor;
  volumePercentage.textContent = `${Math.round(valor * 100)}%`;

  if (valor === 0) {
    volumeIcon.className = "fas fa-volume-mute";
  } else if (valor < 0.5) {
    volumeIcon.className = "fas fa-volume-down";
  } else {
    volumeIcon.className = "fas fa-volume-up";
  }

  volumeSlider.style.setProperty("--volume-percent", `${valor * 100}%`);
}

volumeSlider.addEventListener("input", () => {
  const newVolume = parseFloat(volumeSlider.value);
  actualizarVolumen(newVolume);
  lastVolume = newVolume;
});

volumeIcon.addEventListener("click", () => {
  if (audio.volume > 0) {
    lastVolume = parseFloat(volumeSlider.value);
    actualizarVolumen(0);
    volumeSlider.value = 0;
  } else {
    const restore = lastVolume || 0.7;
    actualizarVolumen(restore);
    volumeSlider.value = restore;
  }
});

volumeSlider.value = lastVolume;
actualizarVolumen(lastVolume);

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🕒 Hora/Fecha y Ubicación (Con Degradación Elegante)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function actualizarFechaHora() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const fecha = ahora.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  
  const timeEl = document.getElementById("current-time");
  const dateEl = document.getElementById("current-date");
  
  if (timeEl) timeEl.textContent = hora;
  if (dateEl) dateEl.textContent = fecha;
}

// 🌍 Función de geolocalización segura y aislada
async function obtenerUbicacionSegura() {
  const cityEl = document.getElementById("current-city");
  const fallback = "Latinoamérica"; // Tu respaldo seguro

  // Si el elemento no existe, no hacemos nada
  if (!cityEl) return;
  
  // Establecer el valor por defecto inmediatamente
  cityEl.textContent = fallback;

  try {
    // Usamos una API ligera, gratuita, sin clave y amigable con CORS
    const response = await fetch("https://ipwho.is/", { cache: "no-cache" });
    
    if (!response.ok) throw new Error("Fallo en la red");
    
    const data = await response.json();
    
    // Si la API devuelve la ciudad y el país, los combinamos
    if (data.city && data.country) {
      cityEl.textContent = `${data.city}, ${data.country_code}`; // Ej: "CDMX, MX"
      console.log(`📍 Ubicación detectada: ${data.city}`);
    }
  } catch (error) {
    // 🛡️ AQUÍ ESTÁ LA CLAVE DE LA SEGURIDAD:
    // Si xat.com bloquea esto, o el usuario tiene un adblocker, 
    // el código entra aquí, registra el aviso y NO ROMPE EL RESTO DEL REPRODUCTOR.
    console.warn("⚠️ No se pudo obtener la ubicación (bloqueado o sin conexión). Usando respaldo.");
    cityEl.textContent = fallback;
  }
}

// Inicialización
actualizarFechaHora();
setInterval(actualizarFechaHora, 1000);

// Llamamos a la ubicación de forma segura al cargar
obtenerUbicacionSegura();

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Particles Rain Effect
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  const rightLayer = document.getElementById('right-particle-layer');
  if (!rightLayer) return;

  function createParticle() {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 2 + 1;
    p.style.setProperty('--size', `${size}px`);
    p.style.left = `${Math.random() * 100}%`;
    p.style.setProperty('--x-start', `${(Math.random() - 0.5) * 20}px`);
    p.style.setProperty('--x-end', `${(Math.random() - 0.5) * 60}px`);
    const duration = Math.random() * 4 + 3;
    p.style.animationDuration = `${duration}s`;
    rightLayer.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000);
  }

  setInterval(createParticle, 150);
});
