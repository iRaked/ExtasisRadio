//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 INICIALIZACIÓN GLOBAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let gestureDetected = false;
let lastTrackTitle = "";
let trackHistory = [];
let radioIntervalId = null;
let contadorIntervalId = null;
let modoActual = "radio";

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
document.addEventListener("click", async () => {
  if (gestureDetected) return;
  gestureDetected = true;
  audio.muted = false;

  // Esperar karaoke antes de iniciar reproducción
  try {
    await cargarLyricsScript("./lyricsRepro34.js");
  } catch (e) {
    console.warn("⚠️ Karaoke no disponible:", e.message);
  }

  if (modoActual === "radio") {
    try {
      if (!audio.src) {
        audio.src = "https://technoplayerserver.net/8240/stream";
        audio.load();
      }
      await audio.play();
      playIcon.classList.replace("fa-play", "fa-pause");

      iniciarActualizacionRadio();
      iniciarContadorRadioescuchas();

      console.log("🟢 Primer gesto: radio iniciado.");
    } catch (err) {
      console.warn("⚠️ Error al iniciar stream en gesto:", err);
      playIcon.classList.replace("fa-pause", "fa-play");
    }
  } else {
    try {
      const necesitaCargar = !Array.isArray(trackData) || trackData.length === 0;
      if (necesitaCargar) {
        await cargarPlaylist("Repro34");
      }

      if (Array.isArray(trackData) && trackData.length > 0) {
        activarReproduccion(0, "initial-gesture");
        console.log("🟢 Primer gesto: local iniciado.");
      } else {
        console.warn("⚠️ No hay pistas disponibles en modo local tras gesto.");
      }
    } catch (err) {
      console.error("❌ Error al iniciar modo local tras gesto:", err);
    }
  }
}, { once: true });


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 Inyección robusta de lyricsRepro34.js
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function cargarLyricsScript(url = "./lyricsRepro34.js") {
  const existing = document.getElementById("lyricsRepro34-script");
  if (existing) {
    return new Promise((resolve) => {
      if (window.lyricsLibrary) resolve();
      else existing.addEventListener("load", () => resolve());
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url; // ajusta la ruta si está en otra carpeta
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
// 🎵 Eventos de audio para iniciar karaoke
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
audio.addEventListener("play", () => {
  if (modoActual !== "local") { detenerKaraoke(); return; }
  const trackId = getCurrentSongId(trackData[currentTrack]?.id);
  cargarKaraoke(trackId);
});

audio.addEventListener("pause", () => {
  animationActive = false;
});

audio.addEventListener("ended", () => {
  detenerKaraoke();
});



//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Función global para registrar historial
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function pushHistoryEntry(artist, title, cover) {
  const time = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const entry = { artist, title, time, cover };
  if (trackHistory.length === 0 || trackHistory[0].title !== title) {
    trackHistory.unshift(entry);
    if (trackHistory.length > 20) trackHistory.pop();
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cargar playlist según nombre y raíz
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function cargarPlaylist(nombre) {
  try {
    let file, clave;

    // mapeo nombre → archivo remoto → raíz JSON
    if (nombre === "Repro34") {
      file = "https://radio-tekileros.vercel.app/Repro34.json";
      clave = "actual";
    } else if (nombre === "exitos") {
      file = "https://radio-tekileros.vercel.app/Exitos.json";
      clave = "exitos";
    } else if (nombre === "hardcore") {
      file = "https://radio-tekileros.vercel.app/HardCore.json";
      clave = "hardcore";
    } else if (nombre === "baladasrock") {
      file = "https://radio-tekileros.vercel.app/BaladasRock.json";
      clave = "baladasrock";
    } else {
      console.warn(`❌ Playlist desconocida: ${nombre}`);
      return;
    }

    const res = await fetch(file, { cache: "no-cache" });
    const data = await res.json();

    // tomar la raíz correcta
    trackData = Array.isArray(data[clave]) ? data[clave] : [];
    console.log("🎶 Pistas cargadas:", trackData.length);

    // activar primera pista automáticamente
    if (trackData.length > 0) {
      activarReproduccion(0, "initial-load");
    }
  } catch (err) {
    console.error("❌ Error al cargar playlist:", err);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Variables de estado de playlist
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let trackData = [];
let currentTrack = null;

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Activar reproducción local
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarReproduccion(index, modo = "manual") {
  if (modoActual !== "local" || index < 0 || index >= trackData.length) return;

  const track = trackData[index];
  if (!track?.dropbox_url) return;

  currentTrack = index;

  // pintar metadatos en UI
  if (TRACK_TITLE_EL)  TRACK_TITLE_EL.textContent  = track.nombre;
  if (TRACK_ARTIST_EL) TRACK_ARTIST_EL.textContent = track.artista;
  if (TRACK_ALBUM_EL)  TRACK_ALBUM_EL.textContent  = track.genero || "Desconocido";
  if (COVER_ART_EL) {
    COVER_ART_EL.src = track.caratula || "assets/covers/Cover1.png";
    COVER_ART_EL.classList.add("rotating");
  }

  // reproducir pista
  audio.src = track.dropbox_url;
  audio.load();

  audio.play().then(() => {
    playIcon.classList.replace("fa-play", "fa-pause");
  }).catch(err => {
    console.warn("⚠️ Error al reproducir pista local:", err);
  });
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 Modal de Tracks en modo local
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const playlistBtn = document.getElementById("contenido-btn"); // botón con icono 🎵
const modalTracks = document.getElementById("modal-playlist");
const closePlaylistModal = document.getElementById("close-playlist-modal");

if (playlistBtn && modalTracks) {
  playlistBtn.addEventListener("click", () => {
    if (modoActual === "local") {
      modalTracks.classList.remove("hidden");
      generarListaModal(); // 🔑 aquí se crean los bloques con info de los tracks
      console.log("🎵 Modal de tracks abierto en modo local");
    } else {
      console.log("ℹ️ Botón Playlist deshabilitado en modo radio");
    }
  });
}

// Cierre del modal
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

  // Actualizar cabecera con la pista actual
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

  // 🔑 Generar un bloque por cada pista
  trackData.forEach((track, index) => {
    const li = document.createElement("li");
    li.classList.add("modal-track-item");

    // Carátula más pequeña
    const img = document.createElement("img");
    img.src = track.caratula || "assets/covers/Cover1.png";
    img.alt = "Carátula";
    img.classList.add("track-cover");
    img.style.width = "60px";
    img.style.height = "60px";

    // Información completa
    const info = document.createElement("div");
    info.classList.add("track-info");
    info.innerHTML = `
      <strong>${track.nombre || "Sin título"}</strong><br>
      <span>🎤 ${track.artista || "Desconocido"}</span><br>
      <span>💿 ${track.album || "Álbum desconocido"}</span><br>
      <span>⏱️ ${track.duracion || "--:--"}</span>
    `;

    // Al hacer clic, reproducir la pista seleccionada
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

    // Renderizar historial
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

  // Cierre por botón ❌
  closeHistoryModal && closeHistoryModal.addEventListener("click", () => {
    historyModal.classList.add("hidden");
    console.log("❌ Modal Historial cerrado");
  });

  // Cierre con tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !historyModal.classList.contains("hidden")) {
      historyModal.classList.add("hidden");
      console.log("❌ Modal Historial cerrado con ESC");
    }
  });

  // Cierre por clic fuera del modal
  document.addEventListener("click", (e) => {
    const isClickOutside = !historyModal.contains(e.target) && !contenidoBtn.contains(e.target);
    if (!historyModal.classList.contains("hidden") && isClickOutside) {
      historyModal.classList.add("hidden");
      console.log("❌ Modal Historial cerrado por clic fuera");
    }
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📜 Generar el selector del modal de playlists
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generarSelectorPlaylists() {
  const selector = document.querySelector("#playlist-modal .track-list");
  if (!selector) return;

  // limpiar listeners previos
  selector.querySelectorAll("li[data-list]").forEach(li => {
    li.replaceWith(li.cloneNode(true));
  });

  // volver a enlazar
  const items = selector.querySelectorAll("li[data-list]");
  items.forEach(li => {
    const key = li.dataset.list; // "actual" | "hits" | "ruido" | "baladasrock"

    li.addEventListener("click", () => {
      switch (key) {
        case "actual":
          cargarPlaylist("Repro34");   // raíz: "actual"
          break;
        case "hits":
          cargarPlaylist("exitos");    // raíz: "exitos"
          break;
        case "ruido":
          cargarPlaylist("hardcore");  // raíz: "hardcore"
          break;
        case "baladasrock":
          cargarPlaylist("baladasrock"); // raíz: "baladasrock"
          break;
        default:
          console.warn(`❌ Playlist desconocida en modal: ${key}`);
          return;
      }

      document.getElementById("playlist-modal").classList.add("hidden");
      console.log(`📂 Playlist seleccionada desde modal: ${key}`);
    });
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📜 Selección automática y cierre del modal de playlist
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const playlistModal = document.getElementById("playlist-modal");
const closeMenuModal = document.getElementById("close-modal-btn");

if (playlistModal) {
  // Selección de playlists
  const items = playlistModal.querySelectorAll(".track-list li[data-list]");
  items.forEach(li => {
    li.addEventListener("click", () => {
      const key = li.dataset.list;

      switch (key) {
        case "actual":
          cargarPlaylist("Repro34");   // raíz: "actual"
          break;
        case "hits":
          cargarPlaylist("exitos");    // raíz: "exitos"
          break;
        case "ruido":
          cargarPlaylist("hardcore");  // raíz: "hardcore"
          break;
        case "baladasrock":
          cargarPlaylist("baladasrock"); // raíz: "baladasrock"
          break;
        default:
          console.warn(`❌ Playlist desconocida: ${key}`);
          return;
      }

      // cerrar modal al seleccionar
      playlistModal.classList.add("hidden");

      // actualizar etiqueta en UI
      const playlistLabel = document.getElementById("track-playlist");
      if (playlistLabel) {
        playlistLabel.textContent = `Playlist: ${li.textContent}`;
      }

      console.log(`📂 Playlist cambiada automáticamente a: ${key}`);
    });
  });

  // Cierre con botón ❌
  if (closeMenuModal) {
    closeMenuModal.addEventListener("click", () => {
      playlistModal.classList.add("hidden");
      console.log("❌ Modal Playlist cerrado con botón");
    });
  }

  // Cierre con tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !playlistModal.classList.contains("hidden")) {
      playlistModal.classList.add("hidden");
      console.log("❌ Modal Playlist cerrado con ESC");
    }
  });

  // Cierre por clic fuera del contenido
  playlistModal.addEventListener("click", (e) => {
    if (e.target === playlistModal) {
      playlistModal.classList.add("hidden");
      console.log("❌ Modal Playlist cerrado por clic fuera");
    }
  });
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔁 Ciclo de actualización del servidor (METADATOS)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function iniciarActualizacionRadio() {
  // si no estamos en modo radio, no iniciar nada
  if (modoActual !== "radio") return;

  // limpiar intervalos previos
  if (radioIntervalId) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }

  const radioUrl = "https://technoplayerserver.net/8240/currentsong";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function actualizarDesdeServidor() {
    try {
      const res = await fetch(proxyUrl, { cache: "no-cache" });
      const raw = await res.text();
      console.log("📡 Respuesta cruda metadatos:", raw);

      // Normalización fuerte
      let cleaned = raw
        .replace(/AUTODJ/gi, "")
        .replace(/Radio\s*Dale\s*Play/gi, "")
        .replace(/\|+/g, "|")
        .replace(/^\s*\|+|\|+\s*$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      console.log("🧹 Metadatos limpiados:", cleaned);

      // Si está vacío u offline
      if (!cleaned || /offline/i.test(cleaned)) {
        TRACK_ARTIST_EL.textContent = "¡Música sí!";
        TRACK_TITLE_EL.textContent  = "Datos bloqueados";
        if (CURRENT_TRACK_DISPLAY_EL) {
          CURRENT_TRACK_DISPLAY_EL.textContent = "Datos bloqueados — ¡Música sí!";
        }
        return;
      }

      // Evitar bloqueo por repetición exacta
      if (cleaned.toLowerCase() === (lastTrackTitle || "").toLowerCase()) {
        console.log("⏭️ Metadatos sin cambios sustantivos, se mantiene UI.");
        return;
      }

      lastTrackTitle = cleaned;

      // Separadores flexibles: -, –, —, |, /
      const split = cleaned.split(/\s*(?:[-–—\|\/])\s*/);
      let artist = "Radio Dale Play";
      let title  = cleaned;

      if (split.length >= 2) {
        artist = split[0].trim();
        title  = split.slice(1).join(" - ").trim();
      } else {
        artist = "Mix / DJ";
        title  = cleaned.trim();
      }

      console.log("🎼 Artist asignado:", artist);
      console.log("🎼 Title asignado:", title);

      // 🎨 Pintar en UI
      if (TRACK_ARTIST_EL) TRACK_ARTIST_EL.textContent = artist;
      if (TRACK_TITLE_EL)  TRACK_TITLE_EL.textContent  = title;
      if (TRACK_ALBUM_EL)  TRACK_ALBUM_EL.textContent  = "Stream";
      if (CURRENT_TRACK_DISPLAY_EL) {
        CURRENT_TRACK_DISPLAY_EL.textContent = `${title} — ${artist}`;
      }

      // 📝 Historial
      pushHistoryEntry(artist, title, COVER_ART_EL.src);

      // 🖼 Carátula
      if (typeof obtenerCaratulaDesdeiTunes === "function") {
        obtenerCaratulaDesdeiTunes(artist, title);
      }

    } catch (err) {
      console.error("❌ Error CRÍTICO en metadatos radio:", err);
      setDefaultMetadata();
    }
  }

  // primera actualización inmediata
  actualizarDesdeServidor();
  // intervalo cada 10 segundos
  radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 Contador de radioescuchas (XML)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function detenerContadorRadioescuchas() {
  if (contadorIntervalId !== null) clearInterval(contadorIntervalId);
  contadorIntervalId = null;
  if (contadorElemento) contadorElemento.textContent = "";
}

function iniciarContadorRadioescuchas() {
  if (modoActual !== "radio") return;        // solo vive en radio
  detenerContadorRadioescuchas();
  if (!contadorElemento) return;

  const statsUrl = "https://technoplayerserver.net/8240/stats"; // ✅ sin ?json=1
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(statsUrl)}`;

  async function actualizarContador() {
    try {
      const res = await fetch(proxyUrl, { cache: "no-cache" });
      const raw = await res.text();

      // Parsear XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(raw, "application/xml");
      const currentListenersNode = xmlDoc.querySelector("CURRENTLISTENERS");

      if (currentListenersNode) {
        contadorElemento.textContent = currentListenersNode.textContent;
      } else {
        contadorElemento.textContent = "0";
      }
      console.log("👥 Oyentes actuales:", contadorElemento.textContent);
    } catch (err) {
      console.error("❌ Error contador:", err);
      contadorElemento.textContent = "0";
    }
  }

  actualizarContador();                       // primera actualización inmediata
  contadorIntervalId = setInterval(actualizarContador, 10000); // cada 10s
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 BOTONERA
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Referencias a botones
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

// Estados globales
let repeatActive = false;
let shuffleActive = false;

// ✅ Power: alternancia de modo
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

    actualizarBotonRadio();
    console.log("🔀 Alternancia de modo:", modoActual);
  });
}

// ✅ Menu: abre modal playlists
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

// ⏪ Rewind
if (rewindBtn) {
  rewindBtn.addEventListener("click", () => {
    if (modoActual === "local" && currentTrack > 0) {
      activarReproduccion(currentTrack - 1, "rewind");
      console.log("⏪ Retrocediendo a pista anterior");
    }
  });
}

// ⏩ Forward
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

// 🔁 Repeat toggle con glow blanco
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

// 🔀 Shuffle toggle con acción inmediata
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

// ▶️ Play/Pause
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
// 🔁 Integración con reproducción continua
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
audio.addEventListener("ended", () => {
  if (modoActual !== "local") return;

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
// CAMBIO DE MODO LOCAL y RADIO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarModoLocal() {
  modoActual = "local";

  // detener intervalos de radio
  if (radioIntervalId) { clearInterval(radioIntervalId); radioIntervalId = null; }
  if (contadorIntervalId) { clearInterval(contadorIntervalId); contadorIntervalId = null; }

  // limpiar audio y UI
  audio.pause();
  audio.src = "";
  COVER_ART_EL.classList.remove("rotating");
  setDefaultMetadata();

  // ✅ cargar playlist y reproducir primera pista
  // usa el nombre correcto según tu JSON: "Repro34" o "Repro36"
  cargarPlaylist("Repro34");

  console.log("🎶 Modo Local activado");
}


function activarModoRadio() {
  modoActual = "radio";

  // preparar UI de conexión
  TRACK_ARTIST_EL.textContent = "Conectando...";
  TRACK_TITLE_EL.textContent  = "Obteniendo datos...";
  TRACK_ALBUM_EL.textContent  = "";
  COVER_ART_EL.src = "https://santi-graphics.vercel.app/assets/covers/DalePlay.png";
  COVER_ART_EL.classList.add("rotating");

  // configurar stream
  audio.pause();
  audio.src = "https://technoplayerserver.net/8240/stream";
  audio.load();
  audio.muted = !gestureDetected;

  audio.play().then(() => {
    playIcon.classList.replace("fa-play", "fa-pause");
    console.log("📻 Radio reproduciendo automáticamente");
  }).catch(err => {
    console.warn("🔒 Error al iniciar Radio:", err);
    playIcon.classList.replace("fa-pause", "fa-play");
  });

  // iniciar intervalos de radio
  iniciarActualizacionRadio();
  iniciarContadorRadioescuchas();

  console.log("📻 Modo Radio activado");
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔁 Reproducción continua en modo local
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
audio.addEventListener("ended", () => {
  if (modoActual !== "local") return;

  // avanzar al siguiente track
  const nextIndex = (currentTrack !== null ? currentTrack + 1 : 0);

  if (nextIndex < trackData.length) {
    activarReproduccion(nextIndex, "auto-next");
    console.log(`⏭️ Avanzando automáticamente a la pista ${nextIndex + 1}`);
  } else {
    // si llegamos al final, reiniciar desde la primera
    activarReproduccion(0, "auto-loop");
    console.log("🔁 Playlist terminada, reiniciando desde el inicio");
  }
});



//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔊 Volumen inicial y eventos (versión ligera)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let lastVolume = 0.7;

function actualizarVolumen(valor) {
  // Ajusta volumen del audio
  audio.volume = valor;
  // Actualiza porcentaje visible
  volumePercentage.textContent = `${Math.round(valor * 100)}%`;

  // Cambia icono según nivel
  if (valor === 0) {
    volumeIcon.className = "fas fa-volume-mute";
  } else if (valor < 0.5) {
    volumeIcon.className = "fas fa-volume-down";
  } else {
    volumeIcon.className = "fas fa-volume-up";
  }

  // Actualiza gradiente dinámico
  volumeSlider.style.setProperty("--volume-percent", `${valor * 100}%`);
}

// Eventos
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

// Inicialización automática
volumeSlider.value = lastVolume;
actualizarVolumen(lastVolume);

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🕒 Hora/Fecha y Ubicación
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function actualizarFechaHora() {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const fecha = ahora.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  document.getElementById("current-time").textContent = hora;
  document.getElementById("current-date").textContent = fecha;
}
actualizarFechaHora();
setInterval(actualizarFechaHora, 1000);

document.getElementById("current-city").textContent = "Latinoamérica";

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