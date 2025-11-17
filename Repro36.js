// ===============================
// 🎧 BLOQUE 1 — INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
// ===============================

let trackData = [];
let currentTrack = null;
let modoActual = "local"; // Arranca en modo local
let gestureDetected = false;
let repeatMode = "none";
let isShuffling = false;
let trackHistory = [];
let radioIntervalId = null;
let contadorIntervalId = null;
let visitas = {};

const audio = document.getElementById("player");
audio.autoplay = true;
audio.muted = true;
audio.preload = "auto";

// 🎯 ELEMENTOS CLAVE DEL DOM
const playPauseBtn = document.getElementById("play-btn");
const nextBtn      = document.getElementById("forward-btn");
const prevBtn      = document.getElementById("rewind-btn");
const shuffleBtn   = document.getElementById("shuffle-btn");
const repeatBtn    = document.getElementById("repeat-btn");
const btnRadio     = document.getElementById("power-btn");

const discImg = document.getElementById("cover-art");
const currentTrackName   = document.getElementById("track-title");
const currentArtistName  = document.getElementById("track-artist");
const metaTrack          = document.getElementById("track-album");

const volumeBar        = document.getElementById('volumeBar');
const volumePercentage = document.getElementById('volumePercentage');
const volumeIcon       = document.getElementById('volumeIcon');

const contadorElemento = document.getElementById("contadorRadio");
const modalTracks      = document.getElementById("modal-playlist");
const menuBtn          = document.getElementById("menu-btn");
const closeModalBtn    = document.getElementById("close-playlist-modal");
const trackList        = document.querySelector(".track-list");
const currentTrackNameModal = document.getElementById("current-track-display");

// 🚀 Inicialización automática
document.addEventListener("DOMContentLoaded", () => {
  inicializarVolumen();        // Bloque 9
  iniciarBurbujas();           // Bloque 10
  cargarPlaylist("Repro36");   // Playlist inicial por defecto
  safePlay({ keepMuted: true }); // autoplay seguro
});

// ===============================
//Bloque 2
// ===============================
async function cargarPlaylist(nombre) {
  try {
    let file, clave, etiqueta;

    if (nombre === "Repro36") {
      file = "Repro36.json";
      clave = "actual";
      etiqueta = "Actual";
    } else if (nombre === "exitos") {
      file = "Exitos.json";
      clave = "exitos";
      etiqueta = "Éxitos";
    } else if (nombre === "hardcore") {
      file = "HardCore.json";
      clave = "hardcore";
      etiqueta = "HardCore";
    } else {
      console.warn(`❌ Playlist desconocida: ${nombre}`);
      return;
    }

    const res = await fetch(`./${file}`, { cache: "no-cache" });
    if (!res.ok) {
      console.error(`❌ No se pudo cargar el archivo ${file} (status ${res.status})`);
      return;
    }

    const data = await res.json();
    console.log("🗂️ Claves disponibles en JSON:", Object.keys(data));

    // Validación defensiva
    if (!data[clave]) {
      console.error(`❌ La clave "${clave}" no existe en ${file}.`);
      return;
    }

    trackData = data[clave];
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

// ===============================
// ▶️ BLOQUE 3 — REPRODUCCIÓN LOCAL
// ===============================

function activarReproduccion(index, modo = "manual") {
  if (modoActual !== "local" || index < 0 || index >= trackData.length) return;

  const track = trackData[index];
  if (!track?.dropbox_url) return;

  currentTrack = index;

  if (currentTrackName) currentTrackName.textContent = track.nombre;
  if (currentArtistName) currentArtistName.textContent = track.artista;
  if (metaTrack) metaTrack.textContent = track.genero || "Desconocido";
  if (discImg) {
    discImg.src = track.caratula || "assets/covers/Cover1.png";
    discImg.classList.add("rotating");
  }

  // 🔑 Actualizar emoción visual y partículas
  if (track.emotion) {
    document.getElementById("track-emotion").textContent = track.emotion;
    aplicarEfectosPorEmocion(track.emotion);
    iniciarBurbujas(track.genero || track.emotion);
  }

  audio.src = track.dropbox_url;
  audio.load();

  if (modo === "initial-load") {
    const icon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
    if (icon) { icon.classList.remove("fa-pause"); icon.classList.add("fa-play"); }
    if (discImg) discImg.classList.remove("rotating");
    return;
  }

  audio.muted = false;
  safePlay({ keepMuted: false }).then(() => {
    const icon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
    if (icon) { icon.classList.remove("fa-play"); icon.classList.add("fa-pause"); }
    actualizarModalActualTrack?.();
    cargarKaraoke?.(track.id);
  }).catch(() => {
    const icon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
    if (icon) { icon.classList.remove("fa-pause"); icon.classList.add("fa-play"); }
    if (discImg) discImg.classList.remove("rotating");
  });
}

// ===============================
// 🔄 BLOQUE SAFEPLAY — AUTOPLAY SEGURO
// ===============================

function safePlay({ keepMuted = false } = {}) {
  if (!audio) return Promise.resolve();

  audio.muted = keepMuted;
  const p = audio.play();
  if (p && typeof p.then === "function") {
    return p.catch(err => {
      console.warn("⚠️ play() rechazado:", err);
      return Promise.resolve();
    });
  }
  return Promise.resolve();
}


// ===============================
// 📻 BLOQUE 4 — MODO RADIO
// ===============================

// Referencias de campos locales que deben limpiarse en radio
const trackPlaylistEl = document.getElementById("track-playlist");
const trackEmotionEl  = document.getElementById("track-emotion");

function activarModoRadio() {
  modoActual = "radio";

  // Limpieza de emoción visual previa
  limpiarEmociones();

  // Limpieza inmediata de campos locales que NO deben aparecer en radio
  if (trackPlaylistEl) trackPlaylistEl.textContent = "";
  if (trackEmotionEl)  trackEmotionEl.textContent  = "";
  if (metaTrack)       metaTrack.textContent       = ""; // álbum/local info

  // Limpiar karaoke previo para que no continúe en radio
  detenerKaraoke();

  // Estado visual de conexión
  if (currentArtistName) currentArtistName.textContent = "Conectando...";
  if (currentTrackName)  currentTrackName.textContent  = "Obteniendo datos...";
  if (discImg) {
    discImg.src = "assets/covers/Cover1.png";
    discImg.classList.add("rotating");
  }

  // Preparar stream
  audio.pause();
  audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
  audio.load();
  audio.muted = gestureDetected ? false : true;

  // Reproducir y sincronizar iconos reales del botón Play
  const playIcon = playPauseBtn ? playPauseBtn.querySelector("i") : null;

  audio.play().then(() => {
    if (playIcon) { playIcon.classList.remove("fa-play"); playIcon.classList.add("fa-pause"); }
    console.log("📻 Radio reproduciendo automáticamente");
  }).catch(err => {
    console.warn("🔒 Error al iniciar Radio:", err);
    if (playIcon) { playIcon.classList.remove("fa-pause"); playIcon.classList.add("fa-play"); }
  });

  // Actualización de datos de radio (listeners externos)
  iniciarActualizacionRadio();
  iniciarContadorRadioescuchas();
}

// ===============================
// 📻 DATOS — Metadatos de Radio
// ===============================

function detenerActualizacionRadio() {
  if (radioIntervalId !== null) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }
}

function iniciarActualizacionRadio() {
  detenerActualizacionRadio();

  const radioUrl = "https://technoplayerserver.net:8018/currentsong?sid=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function actualizarDesdeServidor() {
    try {
      const response = await fetch(proxyUrl, { cache: "no-cache" });
      const newSongTitleRaw = await response.text();
      const cleanedTitle = newSongTitleRaw.trim();

      // Limpieza permanente de campos locales en cada actualización de radio
      if (trackPlaylistEl) trackPlaylistEl.textContent = "";
      if (trackEmotionEl)  trackEmotionEl.textContent  = "";

      if (!cleanedTitle || cleanedTitle.toLowerCase().includes("offline")) {
        if (currentArtistName) currentArtistName.textContent = "Casino Digital Radio";
        if (currentTrackName)  currentTrackName.textContent  = "Datos bloqueados";
        if (metaTrack)         metaTrack.textContent         = "";

        // 🔑 emoción y partículas por defecto
        if (trackEmotionEl) {
          trackEmotionEl.textContent = "radio";
          aplicarEfectosPorEmocion("radio");
          iniciarBurbujas("radio");
        }
        return;
      }

      const songtitleSplit = cleanedTitle.split(/ - | – /);
      let artist = "Desconocido";
      let title  = cleanedTitle;
      if (songtitleSplit.length >= 2) {
        artist = songtitleSplit[0].trim();
        title  = songtitleSplit.slice(1).join(" - ").trim();
      }

      // Mostrar campos
      if (currentArtistName) currentArtistName.textContent = "Casino Digital Radio";
      if (currentTrackName)  currentTrackName.textContent  = title;
      if (metaTrack)         metaTrack.textContent         = artist;

      // 🔑 emoción y partículas en radio
      // Aquí puedes derivar emoción según artista/título si tienes lógica,
      // de momento se fija como "radio"
      if (trackEmotionEl) {
        trackEmotionEl.textContent = "radio";
        aplicarEfectosPorEmocion("radio");
        iniciarBurbujas("radio");
      }

      // Carátula desde iTunes
      obtenerCaratulaDesdeiTunes(artist, title);

    } catch (error) {
      console.error("❌ Error en actualización de Radio:", error);
      if (currentArtistName) currentArtistName.textContent = "Casino Digital Radio";
      if (currentTrackName)  currentTrackName.textContent  = "Error al cargar";
      if (metaTrack)         metaTrack.textContent         = "";

      // 🔑 fallback emoción
      if (trackEmotionEl) {
        trackEmotionEl.textContent = "default";
        aplicarEfectosPorEmocion("default");
        iniciarBurbujas("default");
      }
    }
  }

  actualizarDesdeServidor();
  radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
}

// ===============================
// 📻 OYENTES — Contador de radioescuchas (estable, sin CORS roturas)
// ===============================

function detenerContadorRadioescuchas() {
  if (contadorIntervalId !== null) {
    clearInterval(contadorIntervalId);
    contadorIntervalId = null;
  }
  if (contadorElemento) contadorElemento.textContent = "--";
}

function iniciarContadorRadioescuchas() {
  detenerContadorRadioescuchas();
  if (!contadorElemento) return;

  const baseUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;

  function pintar(valor) {
    contadorElemento.textContent = Number.isFinite(valor) ? String(valor) : "0";
  }

  function actualizar() {
    if (modoActual !== "radio") { detenerContadorRadioescuchas(); return; }

    $.ajax({
      dataType: "jsonp",
      url: baseUrl,
      timeout: 4000,
      success: function (data) {
        if (data && typeof data.currentlisteners === "number") {
          pintar(data.currentlisteners);
        } else {
          fetch(proxyUrl, { cache: "no-cache" })
            .then(r => r.json())
            .then(d => pintar(d?.currentlisteners ?? 0))
            .catch(() => pintar(0));
        }
      },
      error: function () {
        fetch(proxyUrl, { cache: "no-cache" })
          .then(r => r.json())
          .then(d => pintar(d?.currentlisteners ?? 0))
          .catch(() => pintar(0));
      }
    });
  }

  contadorElemento.textContent = "--";
  actualizar();
  contadorIntervalId = setInterval(actualizar, 15000);
}

// ===============================
// 📻 CARÁTULAS — Portada desde iTunes
// ===============================

function obtenerCaratulaDesdeiTunes(artist, title) {
  if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
    if (discImg) {
      discImg.src = 'assets/covers/Cover1.png';
      discImg.classList.add("rotating");
    }
    return;
  }

  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: 'jsonp',
    url: url,
    success: function(data) {
      let cover = 'assets/covers/Cover1.png';
      if (data.results && data.results.length === 1) {
        cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
      }
      if (discImg) {
        discImg.src = cover;
        discImg.classList.add("rotating");
      }
    },
    error: function() {
      if (discImg) {
        discImg.src = 'assets/covers/Cover1.png';
        discImg.classList.add("rotating");
      }
    }
  });
}

// ===============================
// 🔄 BLOQUE 5 — ALTERNANCIA DE MODOS
// ===============================

function activarModoLocal() {
  modoActual = "local";

  detenerActualizacionRadio();
  detenerContadorRadioescuchas();

  audio.pause();
  audio.src = "";
  if (discImg) discImg.classList.remove("rotating");

  const playIcon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
  if (playIcon) {
    playIcon.classList.remove("fa-pause");
    playIcon.classList.add("fa-play");
  }

  cargarPlaylist("Repro36");

  // 🔑 Reiniciar partículas con la primera pista
  if (trackData.length > 0) {
    const track = trackData[0];
    const emotionEl = document.getElementById("track-emotion");
    if (emotionEl) emotionEl.textContent = track.emotion || "default";
    aplicarEfectosPorEmocion(track.emotion || "default");
    iniciarBurbujas(track.genero || track.emotion || "default");
  }
}

function activarModoRadio() {
  modoActual = "radio";

  limpiarEmociones();
  detenerActualizacionRadio();
  detenerContadorRadioescuchas();

  const playlistEl = document.getElementById("track-playlist");
  const emotionEl  = document.getElementById("track-emotion");
  if (playlistEl) playlistEl.textContent = "";
  if (emotionEl)  emotionEl.textContent  = "radio";
  if (metaTrack)  metaTrack.textContent  = "";

  detenerKaraoke();

  if (currentArtistName) currentArtistName.textContent = "Conectando...";
  if (currentTrackName)  currentTrackName.textContent  = "Obteniendo datos...";
  if (discImg) {
    discImg.src = "assets/covers/Cover1.png";
    discImg.classList.add("rotating");
  }

  audio.pause();
  audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
  audio.load();
  audio.muted = !gestureDetected ? true : false;

  const playIcon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
  audio.play().then(() => {
    if (playIcon) {
      playIcon.classList.remove("fa-play");
      playIcon.classList.add("fa-pause");
    }
    console.log("📻 Radio reproduciendo automáticamente");
  }).catch(err => {
    console.warn("🔒 Error al iniciar Radio:", err);
    if (playIcon) {
      playIcon.classList.remove("fa-pause");
      playIcon.classList.add("fa-play");
    }
  });

  iniciarActualizacionRadio();
  iniciarContadorRadioescuchas();

  // 🔑 Reiniciar partículas en modo radio
  aplicarEfectosPorEmocion("radio");
  iniciarBurbujas("radio");
}

function actualizarBotonRadio() {
  if (btnRadio) {
    btnRadio.classList.remove("modo-radio", "modo-local");
    btnRadio.classList.add(modoActual === "radio" ? "modo-radio" : "modo-local");
  }
}

function limpiarEmociones() {
  document.body.classList.remove(
    "emotion-nostalgia",
    "emotion-picardia",
    "emotion-energia",
    "emotion-fiesta"
  );
}

// ===============================
// 🎤 BLOQUE 6 — KARAOKE SINCRONIZADO (USANDO window.lyricsLibrary)
// ===============================

const karaokePalette = ['#ff4081', '#00e5ff', '#ffd740', '#69f0ae', '#f50057'];
let lyricsTimeline = [];
let lyricsIndex = 0;
let karaokeStarted = false;
let animationActive = false;

/**
 * Detiene y limpia por completo el karaoke (contenedor y estado).
 */
function detenerKaraoke() {
  const container = document.querySelector(".lyrics-container");
  if (container) container.innerHTML = "";
  lyricsTimeline = [];
  lyricsIndex = 0;
  karaokeStarted = false;
  animationActive = false;
}

/**
 * Obtiene el ID de la canción actual para buscar sus letras.
 */
function getCurrentSongId(trackId) {
  if (trackId) return trackId;
  if (trackData[currentTrack]?.id) return trackData[currentTrack].id;
  return "default";
}

/**
 * Carga las letras sincronizadas desde window.lyricsLibrary.
 */
function cargarKaraoke(trackId) {
  if (modoActual !== "local") {
    // Blindaje adicional: jamás cargar karaoke en radio
    detenerKaraoke();
    return;
  }

  if (window.lyricsLibrary && window.lyricsLibrary[trackId]) {
    lyricsTimeline = window.lyricsLibrary[trackId];
    lyricsIndex = 0;
    karaokeStarted = true;
    animationActive = true;
    const container = document.querySelector(".lyrics-container");
    if (container) container.innerHTML = "";
    requestAnimationFrame(syncLyrics);
    console.log(`🎤 Karaoke sincronizado cargado para ${trackId}`);
  } else {
    console.warn(`⚠️ Karaoke no disponible para ${trackId}`);
    detenerKaraoke();
  }
}

/**
 * Sincroniza las letras con el tiempo actual del audio.
 */
function syncLyrics() {
  if (!Array.isArray(lyricsTimeline) || lyricsTimeline.length === 0) return;
  if (modoActual !== "local") return; // Blindaje adicional

  const now = audio.currentTime;

  while (lyricsIndex < lyricsTimeline.length && now >= lyricsTimeline[lyricsIndex].time) {
    const { text } = lyricsTimeline[lyricsIndex];
    if (!text) {
      lyricsIndex++;
      continue;
    }

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

// 🎵 Eventos de audio para iniciar karaoke (solo en modo Local)
audio.addEventListener("play", () => {
  if (modoActual !== "local") {
    // En modo radio: asegurar que no haya resto de letras
    detenerKaraoke();
    return;
  }
  const trackId = getCurrentSongId(trackData[currentTrack]?.id);
  cargarKaraoke(trackId);
});

audio.addEventListener("pause", () => {
  animationActive = false;
});

audio.addEventListener("ended", () => {
  detenerKaraoke();
});

// ===============================
// 🪟 BLOQUE 7 — MODAL DE PLAYLISTS EXTENDIDO
// ===============================

function toggleModal(show) {
  if (!modalTracks) return;
  modalTracks.classList.toggle("hidden", !show);
}

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

  trackData.forEach((track, index) => {
    const li = document.createElement("li");
    li.classList.add("modal-track-item");

    const img = document.createElement("img");
    img.src = track.caratula || "assets/covers/Cover1.png";
    img.alt = "Carátula";
    img.classList.add("track-cover");

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

      // actualizar cabecera al seleccionar nueva pista
      if (headerEl) {
        headerEl.textContent = `${track.nombre || "Sin título"} — ${track.artista || "Sin artista"}`;
      }

      toggleModal(false);
    });

    li.appendChild(img);
    li.appendChild(info);
    trackListEl.appendChild(li);
  });
}

function generarSelectorPlaylists() {
  const selector = document.querySelector("#playlist-modal .track-list");
  if (!selector) return;

  selector.innerHTML = "";

  const playlists = [
  { nombre: "Repro36", etiqueta: "Actual" },
  { nombre: "exitos",  etiqueta: "Éxitos" },
  { nombre: "hardcore", etiqueta: "HardCore" }
];

  playlists.forEach(pl => {
    const li = document.createElement("li");
    li.textContent = pl.etiqueta;
    li.dataset.list = pl.nombre;

    li.addEventListener("click", () => {
      cargarPlaylist(pl.nombre); // Bloque 2 ya entiende estas claves
      document.getElementById("playlist-modal").classList.add("hidden");
    });

    selector.appendChild(li);
  });
}

// Listeners
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    const playlistModal = document.getElementById("playlist-modal");
    playlistModal.classList.remove("hidden");
    generarSelectorPlaylists();
  });
}

const playlistBtn = document.getElementById("music-btn");
if (playlistBtn) {
  playlistBtn.addEventListener("click", () => {
    modalTracks.classList.remove("hidden");
    generarListaModal();
  });
}

const closePlaylistModal = document.getElementById("close-playlist-modal");
if (closePlaylistModal) {
  closePlaylistModal.addEventListener("click", () => {
    modalTracks.classList.add("hidden");
  });
}

const closeMenuModal = document.getElementById("close-modal-btn");
if (closeMenuModal) {
  closeMenuModal.addEventListener("click", () => {
    const playlistModal = document.getElementById("playlist-modal");
    playlistModal.classList.add("hidden");
  });
}

if (modalTracks) {
  modalTracks.addEventListener("click", (e) => {
    if (e.target === modalTracks) modalTracks.classList.add("hidden");
  });
}

const playlistModal = document.getElementById("playlist-modal");
if (playlistModal) {
  playlistModal.addEventListener("click", (e) => {
    if (e.target === playlistModal) playlistModal.classList.add("hidden");
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modalTracks.classList.add("hidden");
    document.getElementById("playlist-modal").classList.add("hidden");
  }
});


// ===============================
// 🔁 BLOQUE 8 — CONTROLES DE REPRODUCCIÓN
// ===============================

/**
 * Avanza a la siguiente pista.
 */
function nextTrack() {
  if (modoActual !== "local" || trackData.length === 0) return;

  if (currentTrack === null) currentTrack = 0;

  if (isShuffling) {
    let newIndex;
    if (trackData.length > 1) trackHistory.push(currentTrack);

    do {
      newIndex = Math.floor(Math.random() * trackData.length);
    } while (newIndex === currentTrack && trackData.length > 1);

    activarReproduccion(newIndex, "shuffle");
  } else {
    let nextIndex = (currentTrack + 1) % trackData.length;
    activarReproduccion(nextIndex, "next");
  }
}

/**
 * Retrocede a la pista anterior.
 */
function prevTrack() {
  if (modoActual !== "local" || trackData.length === 0) return;

  let prevIndex;

  if (isShuffling && trackHistory.length > 0) {
    if (trackHistory.length > 0 && trackHistory[trackHistory.length - 1] === currentTrack) {
      trackHistory.pop();
    }
    prevIndex = trackHistory.pop();
  } else {
    prevIndex = (currentTrack - 1 + trackData.length) % trackData.length;
  }

  if (prevIndex !== undefined) {
    activarReproduccion(prevIndex, "prev");
  }
}

/**
 * Activa/desactiva el modo repetición.
 */
function toggleRepeat() {
  if (repeatMode !== "one") {
    repeatMode = "one";
    if (repeatBtn) {
      repeatBtn.classList.add("active-one");
      repeatBtn.classList.remove("active-all");
    }
    audio.loop = true;
  } else {
    repeatMode = "none";
    if (repeatBtn) repeatBtn.classList.remove("active-one");
    audio.loop = false;
  }
}

/**
 * Activa/desactiva el modo aleatorio.
 */
function toggleShuffle() {
  isShuffling = !isShuffling;

  if (isShuffling) {
    if (shuffleBtn) shuffleBtn.classList.add("active");
    trackHistory = [currentTrack];

    if (modoActual === "local" && trackData.length > 1) {
      nextTrack();
    }
  } else {
    if (shuffleBtn) shuffleBtn.classList.remove("active");
    trackHistory = [];
  }
}

// ===============================
// 🎛️ LISTENERS DE BOTONES (IDs reales del HTML)
// ===============================
const playBtn    = document.getElementById("play-btn");
const powerBtn   = document.getElementById("power-btn");

if (nextBtn)    nextBtn.addEventListener("click", nextTrack);
if (prevBtn)    prevBtn.addEventListener("click", prevTrack);
if (shuffleBtn) shuffleBtn.addEventListener("click", toggleShuffle);
if (repeatBtn)  repeatBtn.addEventListener("click", toggleRepeat);

// Play/Pause con tu botón Play
if (playBtn) {
  playBtn.addEventListener("click", () => {
    gestureDetected = true;
    audio.muted = false;

    const icon = playBtn.querySelector("i");

    if (audio.paused) {
      safePlay({ keepMuted: false }).then(() => {
        if (discImg) discImg.classList.add("rotating");
        if (icon) {
          icon.classList.remove("fa-play");
          icon.classList.add("fa-pause");
        }
        // Activar degradado rosa
        playBtn.classList.add("active");
      });
    } else {
      audio.pause();
      if (discImg) discImg.classList.remove("rotating");
      if (icon) {
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
      }
      // Volver al estado oscuro
      playBtn.classList.remove("active");
    }
  });
}

// Power alterna Local/Radio
if (powerBtn) {
  powerBtn.addEventListener("click", () => {
    if (!gestureDetected) { gestureDetected = true; audio.muted = false; }
    if (modoActual === "radio") activarModoLocal(); else activarModoRadio();
    actualizarMetaModo();
    actualizarBotonRadio();
  });
}

// Manejo del final de pista
if (audio) {
  audio.onended = () => {
    if (modoActual !== "local") return;
    if (audio.loop) return;
    nextTrack();
  };
}


// ===============================
// 🔊 BLOQUE 9 — CONTROL DE VOLUMEN
// ===============================

function inicializarVolumen() {
  if (!audio || !volumeBar) return;

  const initial = 70;
  audio.volume = initial / 100;
  volumeBar.value = initial;
  volumeBar.style.setProperty('--vol', `${initial}%`);

  if (volumePercentage) {
    volumePercentage.textContent = `${initial}%`;
  }

  actualizarIcono(initial);

  volumeBar.addEventListener('input', () => {
    const val = parseInt(volumeBar.value, 10);

    audio.volume = val / 100;
    volumeBar.style.setProperty('--vol', `${val}%`);

    if (volumePercentage) {
      volumePercentage.textContent = `${val}%`;
    }

    actualizarIcono(val);
  });
}

function actualizarIcono(val) {
  if (!volumeIcon) return;

  if (val === 0) {
    volumeIcon.className = 'fas fa-volume-mute volume-icon';
  } else if (val < 50) {
    volumeIcon.className = 'fas fa-volume-down volume-icon';
  } else {
    volumeIcon.className = 'fas fa-volume-up volume-icon';
  }
}

// ===============================
// 🕒 BLOQUE 9b — FECHA Y HORA DINÁMICAS
// ===============================

function actualizarFechaHora() {
  const ahora = new Date();

  // Hora en formato HH:MM:SS
  const hora = ahora.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Fecha en formato DD/MM/YYYY
  const fecha = ahora.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const horaEl = document.getElementById('current-time');
  const fechaEl = document.getElementById('current-date');

  if (horaEl) horaEl.textContent = hora;
  if (fechaEl) fechaEl.textContent = fecha;
}

// Inicializa y actualiza cada segundo
document.addEventListener("DOMContentLoaded", () => {
  actualizarFechaHora();
  setInterval(actualizarFechaHora, 1000);
});


// ===============================
// 🌌 BLOQUE 10 — EFECTOS VISUALES MUTADOS
// ===============================

// Paletas de colores por género
function setEmotionByGenre(genre) {
  switch (genre?.toLowerCase()) {
    case "balada": return ['#f5c6aa', '#d8b4e2', '#a0c4ff', '#ffe5b4'];
    case "cuarteto": return ['#ff9800', '#00bcd4', '#e91e63', '#ffeb3b'];
    case "cumbia": return ['#ffeb3b', '#69f0ae', '#ff4081', '#00e5ff'];
    case "pop": return ['#f06292', '#ffd54f', '#81d4fa', '#ce93d8'];
    case "rock": return ['#f44336', '#212121', '#ff0000', '#ff5722'];
    case "reggae": return ['#4caf50', '#ffeb3b', '#f44336'];
    case "metal": return ['#b0bec5', '#263238', '#ff1744', '#607d8b'];
    case "ska": return ['#ffffff', '#000000'];
    default: return ['#ff4081', '#00e5ff', '#ffd740', '#69f0ae', '#f50057'];
  }
}

// Perfil de movimiento por género
function getMovementProfile(genre) {
  switch (genre?.toLowerCase()) {
    case "balada": return { speed: 0.5, size: 4 };
    case "cuarteto": return { speed: 1.5, size: 5 };
    case "cumbia": return { speed: 2.5, size: 3 };
    case "pop": return { speed: 2.0, size: 3 };
    case "rock": return { speed: 4.0, size: 2 };
    case "reggae": return { speed: 0.8, size: 4 };
    case "metal": return { speed: 3.5, size: 2 };
    case "ska": return { speed: 2.2, size: 3 };
    default: return { speed: 1.5, size: 3 };
  }
}

// Aplica clases CSS según emoción
function aplicarEfectosPorEmocion(emotion) {
  const body = document.body;
  body.classList.remove("emotion-nostalgia", "emotion-picardia", "emotion-energia", "emotion-fiesta");

  switch (emotion?.toLowerCase()) {
    case "nostalgia": body.classList.add("emotion-nostalgia"); break;
    case "picardia":  body.classList.add("emotion-picardia");  break;
    case "energia":   body.classList.add("emotion-energia");   break;
    case "fiesta":    body.classList.add("emotion-fiesta");    break;
    default: break;
  }
}

// Partículas dinámicas: animación original con ciclo de vida
function iniciarBurbujas(genre) {
  const canvas = document.getElementById("particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const palette = setEmotionByGenre(genre);
  const profile = getMovementProfile(genre);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particlesArray = [];

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * profile.size + 1;
      this.speedX = (Math.random() * 2 - 1) * profile.speed;
      this.speedY = (Math.random() * 2 - 1) * profile.speed;
      this.color = palette[Math.floor(Math.random() * palette.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.size > 0.2) this.size -= 0.05;
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  function handleParticles() {
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
      if (particlesArray[i].size <= 0.2) {
        particlesArray.splice(i, 1);
        i--;
      }
    }
  }

  function createParticles() {
    if (particlesArray.length < 100) {
      particlesArray.push(new Particle());
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleParticles();
    createParticles();
    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}


// ===============================
// 🔑 DESBLOQUEO TRAS PRIMER GESTO HUMANO
// ===============================
document.addEventListener("click", () => {
  if (!gestureDetected) {
    gestureDetected = true;
    audio.muted = false;

    if (modoActual === "local" && trackData.length > 0) {
      // Reproduce la pista actual o la primera
      const index = currentTrack !== null ? currentTrack : 0;
      activarReproduccion(index, "manual");
      console.log("🎶 Local desbloqueado:", trackData[index].nombre);
    } else if (modoActual === "radio") {
      activarModoRadio();
      console.log("📻 Radio desbloqueada");
    }
  }
}, { once: true });