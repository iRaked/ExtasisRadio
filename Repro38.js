//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 INICIALIZACIÓN GLOBAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let gestureDetected = false;
let lastTrackTitle = "";
let trackHistory = [];
let radioIntervalId = null;
let contadorIntervalId = null;
let modoActual = "local";   // "local" o "radio"

// Estado del reproductor
let playlists = {};
let playlistActual = "actual";
let trackData = [];
let currentTrack = 0;
let isPlaying = false;
let modoRepeat = false;
let modoShuffle = false;

// Elemento de audio principal
const audio = document.getElementById("player");

// Botón Play/Pause principal
const playBtn  = document.getElementById("play-btn");
const playIcon = playBtn ? playBtn.querySelector("i") : null;
const iconPlayPause = document.getElementById("icon-play-pause");

// Elementos de información del track
const TRACK_TITLE_EL   = document.getElementById("track-title");
const TRACK_ARTIST_EL  = document.getElementById("track-artist");
const TRACK_ALBUM_EL   = document.getElementById("track-album");
const COVER_ART_EL     = document.getElementById("cover-art");
const CURRENT_TRACK_DISPLAY_EL = document.getElementById("current-track-display");
const contadorElemento = document.getElementById("contadorRadio");

// Alias para consistencia (opcional)
const currentArtistName = TRACK_ARTIST_EL;
const currentTrackName  = TRACK_TITLE_EL;
const metaTrack         = CURRENT_TRACK_DISPLAY_EL;
const discImg           = COVER_ART_EL;

// Labels de estado
const modeLabel     = document.getElementById("mode-label");
const playlistLabel = document.getElementById("playlist-label");

// Modales y Menú
const menuBtn    = document.getElementById("menu-btn");
const menuIcon   = menuBtn ? menuBtn.querySelector("i") : null;
const rightPanel = document.querySelector(".right-panel");

const historyModal      = document.getElementById("history-modal");
const closeHistoryModal = document.getElementById("close-history-modal");
const historyList       = document.getElementById("history-list");

const playlistModal   = document.getElementById("playlist-modal");
const closeMenuModal  = document.getElementById("close-modal-btn");

// Navegación
const btnTop    = document.getElementById("btn-top");
const btnBottom = document.getElementById("btn-bottom");


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖐️ Gesto humano: desbloquea audio y arranca
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.addEventListener("click", async () => {
  if (!gestureDetected) {
    gestureDetected = true;
    console.log("🖐️ Primer gesto detectado: desbloqueando audio y arrancando playlist local…");
    await loadAllPlaylists();
    activarModoLocal("actual", 0);
  }
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📚 Registro de raíces JSON
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PLAYLIST_SOURCES = {
  actual:      "https://radio-tekileros.vercel.app/Repro38.json",
  exitos:      "https://radio-tekileros.vercel.app/Exitos.json",
  hardcore:    "https://radio-tekileros.vercel.app/HardCore.json",
  baladasrock: "https://radio-tekileros.vercel.app/BaladasRock.json"
};

// playlists ya está declarado globalmente, aquí solo inicializamos si está vacío
if (!playlists || Object.keys(playlists).length === 0) {
  playlists = {
    actual: [],
    exitos: [],
    hardcore: [],
    baladasrock: []
  };
}

// Normalizador
function normalizeTrack(raw) {
  return {
    id:       raw.id,
    title:    raw.title      ?? raw.nombre,
    artist:   raw.artist     ?? raw.artista,
    album:    raw.album      ?? raw.seccion,
    emotion:  raw.emotion,
    genre:    raw.genre      ?? raw.genero,
    duration: raw.duration   ?? raw.duracion,
    url:      raw.dropbox_url,
    cover:    raw.cover      ?? raw.caratula
  };
}

async function loadPlaylist(rootKey) {
  const src = PLAYLIST_SOURCES[rootKey];
  if (!src) return;
  const res = await fetch(src);
  const data = await res.json();
  const items = Array.isArray(data[rootKey]) ? data[rootKey] : [];
  playlists[rootKey] = items.map(normalizeTrack);
  console.log(`✅ Playlist cargada: ${rootKey} (${playlists[rootKey].length} tracks)`);
}

async function loadAllPlaylists() {
  const keys = Object.keys(PLAYLIST_SOURCES);
  for (const k of keys) {
    try { await loadPlaylist(k); } catch (e) { console.warn(`⚠️ Error cargando ${k}:`, e.message); }
  }
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ INICIALIZAR MODO LOCAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setDefaultMetadataLocal() {
  modoActual = "local";
  modeLabel.textContent     = "Modo: Local";
  playlistLabel.textContent = "Playlist: Actual";

  const track = playlists.actual[0];
  if (track) {
    TRACK_TITLE_EL.textContent  = track.title;
    TRACK_ARTIST_EL.textContent = track.artist;
    TRACK_ALBUM_EL.textContent  = track.genre;
    COVER_ART_EL.src            = track.cover;
    CURRENT_TRACK_DISPLAY_EL.textContent = track.album || "";
  } else {
    TRACK_TITLE_EL.textContent  = "Esperando pista…";
    TRACK_ARTIST_EL.textContent = "—";
    TRACK_ALBUM_EL.textContent  = "—";
    COVER_ART_EL.src            = "https://santi-graphics.vercel.app/assets/covers/DalePlay.png";
    CURRENT_TRACK_DISPLAY_EL.textContent = "—";
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadAllPlaylists();
  setDefaultMetadataLocal();
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ ACTIVAR MODO LOCAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarModoLocal(lista = "actual", index = 0) {
  modoActual = "local";

  // sincronizar estado global
  playlistActual = lista;
  trackData = playlists[lista] || [];
  currentTrack = index;

  const track = trackData[currentTrack];
  if (track) {
    audio.src = track.url;
    audio.muted = false;
    audio.play();

    playlistLabel.textContent = `Playlist: ${lista}`;
    TRACK_TITLE_EL.textContent  = track.title;
    TRACK_ARTIST_EL.textContent = track.artist;
    TRACK_ALBUM_EL.textContent  = track.genre;
    COVER_ART_EL.src            = track.cover;
    CURRENT_TRACK_DISPLAY_EL.textContent = track.album || "";
    modeLabel.textContent = "Modo: Local";

    console.log("🎧 Reproducción local iniciada:", track.title);

    // 🎤 Karaoke activado por ID del JSON
    if (track.id) {
      cargarKaraoke(track.id);
    } else {
      detenerKaraoke();
    }

    audio.onended = () => {
      detenerKaraoke(); // limpiar karaoke al terminar
      const siguiente = currentTrack + 1;
      if (siguiente < trackData.length) {
        activarModoLocal(lista, siguiente);
      } else {
        console.log("🏁 Playlist terminada:", lista);
        // Opcional: reiniciar desde el inicio
        // activarModoLocal(lista, 0);
      }
    };
  } else {
    console.warn("⚠️ No se encontró track en índice:", index, "de playlist:", lista);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎤 KARAOKE SINCRONIZADO
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

//======================================
// 🔄 CAMBIO DE MODO (con limpieza de karaoke)
//======================================
function cambiarModo(nuevoModo) {
  modoActual = nuevoModo;

  // 🔥 Ajuste: limpiar karaoke al cambiar de modo
  if (nuevoModo !== "local") {
    detenerKaraoke();
    console.log("🎤 Karaoke limpiado al cambiar de modo");
  }

  // Aquí puedes añadir la lógica específica de cada modo
  switch (nuevoModo) {
    case "local":
      console.log("🎶 Modo LOCAL activado");
      break;
    case "radio":
      console.log("📻 Modo RADIO activado");
      break;
    case "playlist":
      console.log("📂 Modo PLAYLIST activado");
      break;
    default:
      console.warn(`⚠️ Modo desconocido: ${nuevoModo}`);
      break;
  }
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ ACTIVAR MODO STREAMING/RADIO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarModoStreaming() {
  detenerKaraoke();// 🔥 Ajuste: limpiar karaoke al entrar en radio
  modoActual = "radio"; // 👈 importante: usar "radio" para coherencia con contador
  audio.src = "https://technoplayerserver.net/8240/stream";
  audio.muted = false;
  audio.play();

  // Metadatos iniciales
  playlistLabel.textContent = "Radio Dale Play";
  TRACK_TITLE_EL.textContent  = "Conectando…";
  TRACK_ARTIST_EL.textContent = "—";
  TRACK_ALBUM_EL.textContent  = "AutoDJ";
  COVER_ART_EL.src            = "https://santi-graphics.vercel.app/assets/covers/DalePlay.png";
  CURRENT_TRACK_DISPLAY_EL.textContent = "Radio Dale Play";

  modeLabel.textContent = "Modo: Radio";

  // Iniciar actualización periódica desde servidor
  iniciarActualizacionRadio();

  console.log("📡 Streaming activado (Radio Dale Play)");
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METADATOS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 Utilidades: formateo y control de intervalos

function formatArtist(artist) { 
  if (!artist) return "";
  artist = artist.toLowerCase().trim();
  if (artist.includes(" &"))      artist = artist.substr(0, artist.indexOf(" &"));
  else if (artist.includes("feat")) artist = artist.substr(0, artist.indexOf(" feat"));
  else if (artist.includes("ft."))  artist = artist.substr(0, artist.indexOf(" ft."));
  return artist;
}

function formatTitle(title) { 
  if (!title) return "";
  title = title.toLowerCase().trim();
  if (title.includes("&"))    title = title.replace("&", "and");
  else if (title.includes("(")) title = title.substr(0, title.indexOf(" ("));
  else if (title.includes("ft")) title = title.substr(0, title.indexOf(" ft"));
  return title;
}

function detenerActualizacionRadio() {
  if (radioIntervalId !== null) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }
}

function detenerContadorRadioescuchas() {
  if (contadorIntervalId !== null) {
    clearInterval(contadorIntervalId);
    contadorIntervalId = null;
  }
  if (contadorElemento) contadorElemento.textContent = "";
}

//======================================
// 📻 Carátula dinámica via iTunes (fallback a Plato)
//======================================
function obtenerCaratulaDesdeiTunes(artist, title) {
  if (!discImg) return;

  // Si no hay jQuery, usa fallback inmediato
  if (typeof $ === "undefined" || typeof $.ajax === "undefined") {
    discImg.src = "https://santi-graphics.vercel.app/assets/covers/DalePlay.png";
    discImg.classList.add("rotating");
    return;
  }

  const formattedArtist = formatArtist(artist);
  const formattedTitle  = formatTitle(title);
  const query = encodeURIComponent(`${formattedArtist} ${formattedTitle}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: "jsonp",
    url,
    success: function(data) {
      let cover = "https://santi-graphics.vercel.app/assets/covers/DalePlay.png";
      if (data.results && data.results.length === 1) {
        cover = data.results[0].artworkUrl100.replace("100x100", "400x400");
      }
      discImg.src = cover;
      discImg.classList.add("rotating");
    },
    error: function() {
      discImg.src = "https://santi-graphics.vercel.app/assets/covers/DalePlay.png";
      discImg.classList.add("rotating");
    }
  });
}

//======================================
// 📻 Actualización periódica de metadatos de radio
//======================================
function iniciarActualizacionRadio() {
  detenerActualizacionRadio();
  iniciarContadorRadioescuchas();

  const radioUrl = "https://technoplayerserver.net:8240/currentsong?sid=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function actualizarDesdeServidor() {
    if (modoActual !== "radio") return; // coherencia de modo

    try {
      const response = await fetch(proxyUrl, { cache: "no-cache" });
      const newSongTitleRaw = await response.text();

      // Limpieza y supresión de AUTODJ
      const cleanedTitle = newSongTitleRaw.trim()
        .replace(/AUTODJ/gi, "")
        .replace(/\|\s*$/g, "")
        .trim();

      // Estados no válidos u offline
      if (!cleanedTitle || cleanedTitle.toLowerCase().includes("offline") || cleanedTitle === lastTrackTitle) {
        if (cleanedTitle && cleanedTitle.toLowerCase().includes("offline")) {
          if (currentArtistName) currentArtistName.textContent = "¡Música sí!";
          if (currentTrackName)  currentTrackName.textContent  = "Datos bloqueados";
          if (metaTrack)         metaTrack.textContent         = "Radio Dale Play";
        }
        return;
      }

      lastTrackTitle = cleanedTitle;

      // Parseo en formato "Artista - Título"
      const songtitleSplit = cleanedTitle.split(/ - | – /);
      let artist = "Radio";
      let title  = cleanedTitle;
      if (songtitleSplit.length >= 2) {
        artist = songtitleSplit[0].trim();
        title  = songtitleSplit.slice(1).join(" - ").trim();
      }

      // Historial
      const currentTrackTime = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      const newHistoryEntry = { artist, title, time: currentTrackTime };
      if (trackHistory.length === 0 || trackHistory[0].title !== title) {
        trackHistory.unshift(newHistoryEntry);
        if (trackHistory.length > 20) trackHistory.pop();
      }

      // Metadatos en UI según tu HTML
      // Carátula
      obtenerCaratulaDesdeiTunes(artist, title);

      // Radio Dale Play
      playlistLabel.textContent = "Radio Dale Play";

      // Título
      if (currentTrackName)  currentTrackName.textContent  = title;

      // Artista
      if (currentArtistName) currentArtistName.textContent = artist;

      // AutoDJ (origen en álbum/campo secundario)
      TRACK_ALBUM_EL.textContent = "AutoDJ";

      // Texto combinado
      if (metaTrack) metaTrack.textContent = `${artist} — ${title}`;

      // Modo (visualmente)
      modeLabel.textContent = "Modo: Radio";
    } catch (error) {
      console.error("❌ Error CRÍTICO en la actualización de Radio:", error);
      if (currentArtistName) currentArtistName.textContent = "Error";
      if (currentTrackName)  currentTrackName.textContent  = "al cargar metadatos";
      if (metaTrack)         metaTrack.textContent         = "Radio Dale Play";
    }
  }

  // Primera actualización inmediata y luego cada 10s
  actualizarDesdeServidor();
  radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 Contador de radioescuchas
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function iniciarContadorRadioescuchas() {
  detenerContadorRadioescuchas();

  if (typeof $ === "undefined" || typeof $.ajax === "undefined" || !contadorElemento) return;

  const contadorUrl = "https://technoplayerserver.net:8240/stats?json=1&sid=1";

  function actualizarContador() {
    if (modoActual !== "radio") { detenerContadorRadioescuchas(); return; }
    $.ajax({
      dataType: "jsonp",
      url: contadorUrl,
      success: function(data) {
        contadorElemento.textContent = data.currentlisteners || "0";
      },
      error: function() {
        contadorElemento.textContent = "0";
      },
      timeout: 5000
    });
  }

  actualizarContador();
  contadorIntervalId = setInterval(actualizarContador, 15000);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 MODAL HISTORIAL (modo radio)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderHistoryModal() {
  if (!historyList) return;
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
        <img src="${entry.cover || 'https://santi-graphics.vercel.app/assets/covers/DalePlay.png'}" 
             alt="Carátula" class="track-cover" />
        <div class="track-info">
          <strong>${entry.title || ""}</strong><br>
          <span>🎤 ${entry.artist || ""}</span><br>
          <span>🕒 ${entry.time || ""}</span>
        </div>
      `;
      historyList.appendChild(li);
    });
  }
}

// Cierre por botón ❌
if (closeHistoryModal) {
  closeHistoryModal.addEventListener("click", () => {
    historyModal.classList.add("hidden");
    console.log("❌ Modal Historial cerrado con botón interno");
  });
}

// Cierre con tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && historyModal && !historyModal.classList.contains("hidden")) {
    historyModal.classList.add("hidden");
    console.log("❌ Modal Historial cerrado con ESC");
  }
});

// Cierre por clic fuera del modal
document.addEventListener("click", (e) => {
  if (!historyModal || !menuBtn) return;
  const isClickOutside = !historyModal.contains(e.target) && !menuBtn.contains(e.target);
  if (!historyModal.classList.contains("hidden") && isClickOutside) {
    historyModal.classList.add("hidden");
    console.log("❌ Modal Historial cerrado por clic fuera");
  }
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📂 MODAL PLAYLIST (modo local)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Variables de estado del modal Playlist (¡NO USAR para Modal Tracks!)
// NOTA: 'modalIndex' y 'currentModalList' son usadas por el Modal Playlist.

// 🛑 Abrir modal Playlist
function abrirPlaylistModal(origen) {
  if (!playlistModal) return;
  playlistModal.classList.remove("hidden");

  // sincronizar estado visual
  document.getElementById("btn-menu")?.classList.add("active");
  document.getElementById("menu-btn")?.classList.add("active");

  // regenerar lista y listeners
  generarSelectorPlaylists();
  currentModalList = playlistModal.querySelector(".track-list");
  modalIndex = 0;
  actualizarSeleccionModal();

  console.log(`📂 Playlist abierto (${origen})`);
}

// 🛑 Cerrar modal Playlist
function cerrarPlaylistModal(origen) {
  if (!playlistModal) return;
  playlistModal.classList.add("hidden");

  document.getElementById("btn-menu")?.classList.remove("active");
  document.getElementById("menu-btn")?.classList.remove("active");

  console.log(`❌ Playlist cerrado (${origen})`);
}

// 🎶 Generar lista de playlists en modal
function generarSelectorPlaylists() {
  const selector = playlistModal?.querySelector(".track-list");
  if (!selector) return;

  // limpiar listeners previos
  selector.querySelectorAll("li[data-list]").forEach(li => {
    li.replaceWith(li.cloneNode(true));
  });

  // volver a enlazar
  const items = selector.querySelectorAll("li[data-list]");
  items.forEach((li, i) => {
    const key = li.dataset.list;

    li.addEventListener("mouseenter", () => {
      modalIndex = i;
      actualizarSeleccionModal();
    });

    li.addEventListener("click", async (e) => {
      e.stopPropagation();
      await loadPlaylist(key);
      activarModoLocal(key, 0);
      audio.play();

      playIcon.classList.replace("fa-play", "fa-pause");
      iconPlayPause?.classList.replace("fa-play", "fa-pause");

      cerrarPlaylistModal("clic en playlist");
      console.log(`📂 Playlist seleccionada y reproduciendo: ${key}`);
    });
  });
}

// 🎯 Actualizar selección visual y scroll (¡USADA POR MODAL PLAYLIST!)
function actualizarSeleccionModal() {
  if (!currentModalList) return;
  const items = currentModalList.querySelectorAll("li");
  items.forEach((item, i) => item.classList.toggle("selected", i === modalIndex));
  items[modalIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

//======================================
// ⬆️⬇️ NAVEGACIÓN EN MODAL PLAYLIST
//======================================

function navegarPlaylistModal(direccion) {
  if (!currentModalList || playlistModal.classList.contains("hidden")) return;
  const items = currentModalList.querySelectorAll("li[data-list]");
  if (!items.length) return;

  modalIndex = direccion === "arriba"
    ? (modalIndex - 1 + items.length) % items.length
    : (modalIndex + 1) % items.length;

  // La selección y scroll se manejan con la función de playlist
  actualizarSeleccionModal(); 
}

//======================================
// 🚪 CIERRES DEL MODAL
//======================================

// Botón interno ❌
closeMenuModal?.addEventListener("click", e => {
  e.stopPropagation();
  cerrarPlaylistModal("botón interno");
});

// Tecla ESC
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && playlistModal && !playlistModal.classList.contains("hidden")) {
    cerrarPlaylistModal("ESC");
  }
});

// Clic fuera del modal
document.addEventListener("click", e => {
  if (!playlistModal) return;
  const isOpen = !playlistModal.classList.contains("hidden");
  if (!isOpen) return;

  const clickedOutside = !playlistModal.contains(e.target) &&
                         !document.getElementById("menu-btn")?.contains(e.target) &&
                         !document.getElementById("btn-menu")?.contains(e.target);

  if (clickedOutside) {
    cerrarPlaylistModal("clic fuera");
  }
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔘 MODAL DE TRACKS (Completo, Sincronizado y Navegable)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Referencias principales
const tracksBtn        = document.getElementById("contenido-btn");
const modalTracks      = document.getElementById("tracks-modal");
const closeTracksModal = document.getElementById("close-tracks-modal");

// Referencia a la lista <ul> dentro del modal de tracks
const modalTracksList = document.getElementById("modal-tracks-list"); 
// (modalIndex se define globalmente arriba y se usa aquí)

// Utilidad para formatear duración
function mmss(value) {
  // Si ya viene como string "MM:SS", lo devolvemos tal cual
  if (typeof value === "string") return value;

  // Si viene como número en segundos, lo convertimos
  if (typeof value === "number" && isFinite(value)) {
    const m = Math.floor(value / 60);
    const s = Math.floor(value % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  // Fallback
  return "--:--";
}


// 🛑 FUNCIÓN DE CIERRE SINCRONIZADA
function cerrarModalTracks(origen) {
  if (!modalTracks) return;

  const btnMusic = document.getElementById("btn-music");
  const contenidoBtn = document.getElementById("contenido-btn");
  
  if (btnMusic) btnMusic.classList.remove("active"); 
  if (contenidoBtn) contenidoBtn.classList.remove("active");

  modalTracks.classList.add("hidden");
  console.log(`❌ Tracks cerrado (${origen})`);
}

// Obtener playlist activa
function getActiveTrackData() {
  if (typeof playlistActual === "undefined") playlistActual = "actual";
  const data = playlists[playlistActual];
  if (!Array.isArray(data)) {
    console.error(`playlists['${playlistActual}'] no es arreglo:`, data);
    return [];
  }
  return data;
}

// Asegurar índice válido
function clampIndex(idx, len) {
  if (typeof idx !== "number" || !isFinite(idx)) return 0;
  if (len === 0) return 0;
  return Math.max(0, Math.min(idx, len - 1));
}

// Pintar cabecera con track actual
function pintarCabecera(list, index) {
  const headerEl = document.getElementById("current-track-display");
  if (!headerEl) return;
  const t = list[index];
  headerEl.textContent = t
    ? `${t.title || "Sin título"} — ${t.artist || "Sin artista"}`
    : "Sin pista seleccionada — Sin artista";
}

// 🎯 FUNCIÓN DE SELECCIÓN VISUAL Y SCROLL (¡USADA POR MODAL TRACKS!)
function actualizarSeleccionTracksModal() {
  if (!modalTracksList) return;
  const items = modalTracksList.querySelectorAll(".modal-track-item");
  items.forEach((item, i) => {
    item.classList.toggle("selected", i === modalIndex);
  });

  const selectedItem = items[modalIndex];
  if (selectedItem) {
    selectedItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}


// Generar lista dentro del modal
function generarListaModal(list, index) {
  const listEl = modalTracksList;
  if (!listEl) return;

  listEl.innerHTML = "";
  if (list.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No hay pistas cargadas.";
    listEl.appendChild(li);
    return;
  }

  list.forEach((track, i) => {
    const li = document.createElement("li");
    li.classList.add("modal-track-item");
    if (i === index) li.classList.add("selected");

    li.innerHTML = `
      <img src="${track.cover || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png'}"
           alt="Carátula" class="track-cover" />
      <div class="track-info">
        <strong>${track.title || "Sin título"}</strong><br>
        <span>🎤 ${track.artist || "Desconocido"}</span><br>
        <span>💿 ${track.album || "Álbum desconocido"}</span><br>
        <span>⏱️ ${mmss(track.duration)}</span>
      </div>
    `;

    // Al hacer clic en un track: reproducir y cerrar modal
    li.addEventListener("click", () => {
      currentTrack = i;
      modalIndex = i; // Sincroniza el índice para la navegación posterior
      pintarCabecera(list, i);
      activarModoLocal(playlistActual, currentTrack);
      cerrarModalTracks("clic en track");
    });

    listEl.appendChild(li);
  });
  
  actualizarSeleccionTracksModal();
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⬆️⬇️ NAVEGACIÓN EN MODAL TRACKS (Funcional)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function navegarTracksModal(direccion) {
  // Verifica que el modal de tracks esté abierto y tenga lista
  if (!modalTracksList || modalTracks.classList.contains("hidden")) return;

  const items = modalTracksList.querySelectorAll(".modal-track-item");
  if (!items.length) return;

  // 1. Calcular el nuevo índice (circular)
  if (direccion === "arriba") {
    modalIndex = (modalIndex - 1 + items.length) % items.length;
  } else { // "abajo"
    modalIndex = (modalIndex + 1) % items.length;
  }
  
  // 2. Actualizar la selección visual y el scroll
  actualizarSeleccionTracksModal();

  // 3. Autoreproducción
  currentTrack = modalIndex;
  const list = getActiveTrackData(); 
  
  if (list[currentTrack]) {
    pintarCabecera(list, currentTrack); // Pinta la cabecera al navegar
    activarModoLocal(playlistActual, currentTrack);
    console.log(`🎶 Track reproducido desde navegación: ${list[currentTrack].title}`);
  }
}


// Botones de Navegación (Manejo unificado para ambos modales)
const handleNavigationClick = (e, direccion) => {
  e.stopPropagation();

  // 1. Verifica si el Modal de Tracks está abierto y maneja la navegación del track
  if (modalTracks && !modalTracks.classList.contains("hidden")) {
    navegarTracksModal(direccion);
    return;
  }
  
  // 2. Verifica si el Modal de Playlists está abierto y maneja la navegación de playlists
  if (playlistModal && !playlistModal.classList.contains("hidden")) {
    navegarPlaylistModal(direccion);
    return;
  }
};


// Botón Top
if (btnTop) {
  btnTop.addEventListener("click", (e) => handleNavigationClick(e, "arriba"));
}

// Botón Bottom
if (btnBottom) {
  btnBottom.addEventListener("click", (e) => handleNavigationClick(e, "abajo"));
}


// Cerrar modal con botón interno (X)
if (closeTracksModal) {
  closeTracksModal.addEventListener("click", (e) => {
    e.stopPropagation();
    cerrarModalTracks("botón interno");
});
}

// Cerrar modal con ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalTracks && !modalTracks.classList.contains("hidden")) {
    cerrarModalTracks("ESC");
  }
});

// Cerrar modal clic fuera
document.addEventListener("click", (e) => {
  // Referencias para evitar el cierre si el clic proviene de cualquiera de los botones
  const btnMusic = document.getElementById("btn-music"); 

  if (modalTracks && !modalTracks.classList.contains("hidden") &&
      !modalTracks.contains(e.target) &&
      !btnMusic?.contains(e.target) &&
      !tracksBtn.contains(e.target)) {
    cerrarModalTracks("clic fuera");
  }
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOTONERAS SINCRONIZADAS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//======================================
// 🔌 BOTÓN POWER (cabecera + panel)
//======================================

["btn-power", "power-btn"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("click", () => {
    console.log("🔌 Click Power desde:", id);

    if (modoActual === "local") {
      activarModoStreaming();
      console.log("▶️ Cambiado a modo radio");
    } else {
      detenerActualizacionRadio();
      detenerContadorRadioescuchas();
      activarModoLocal("actual", 0);
      playlistActual = "actual";
      trackData = playlists[playlistActual] || [];
      currentTrack = 0;
      console.log(`📂 Entrando a local con playlist '${playlistActual}'`);
    }

    // sincronización simple: ambos botones se marcan/desmarcan con una clase genérica
    const btnPowerHeader = document.getElementById("btn-power");
    const powerBtnPanel  = document.getElementById("power-btn");

    btnPowerHeader?.classList.toggle("active", modoActual !== "local");
    powerBtnPanel?.classList.toggle("active", modoActual !== "local");
  });
});


//======================================
// MENU (cabecera + panel) — listeners garantizados
//======================================

document.addEventListener("DOMContentLoaded", () => {
  const attach = (id) => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`No se encontró botón: ${id}`);
      return;
    }
    el.addEventListener("click", (e) => {
      e.stopPropagation();

      // Obtener referencias frescas en cada clic
      const historyModalEl  = document.getElementById("history-modal")  || historyModal;
      const rightPanelEl    = document.getElementById("right-panel")     || rightPanel;
      const playlistModalEl = document.getElementById("playlist-modal")  || playlistModal;

      if (modoActual === "radio") {
        if (!historyModalEl) {
          console.error("history-modal no encontrado");
          return;
        }
        const isOpen = !historyModalEl.classList.contains("hidden");
        if (isOpen) {
          historyModalEl.classList.add("hidden");
          rightPanelEl?.classList.remove("show");
          // sincroniza estado visual
          document.getElementById("btn-menu")?.classList.remove("active");
          document.getElementById("menu-btn")?.classList.remove("active");
          console.log("❌ Historial cerrado");
        } else {
          renderHistoryModal();
          historyModalEl.classList.remove("hidden");
          rightPanelEl?.classList.add("show");
          // sincroniza estado visual
          document.getElementById("btn-menu")?.classList.add("active");
          document.getElementById("menu-btn")?.classList.add("active");
          console.log("📜 Historial abierto");
        }
      } else {
        if (!playlistModalEl) {
          console.error("playlist-modal no encontrado");
          return;
        }
        const isOpen = !playlistModalEl.classList.contains("hidden");
        if (isOpen) {
          cerrarPlaylistModal("botón Menu");
        } else {
          abrirPlaylistModal("botón Menu");
        }
      }
    });
  };

  // Adjuntar a ambos botones cuando el DOM esté listo
  attach("btn-menu");  // cabecera
  attach("menu-btn");  // panel
});


//======================================
// BOTON TRACKS (Music/Contenido) (cabecera + panel)
//======================================

// 1. Referencias (ya obtenidas en el bloque superior)
const tracksModalRef = document.getElementById("tracks-modal"); 
const btnMusic = document.getElementById("btn-music"); // Botón de la Cabecera
const contenidoBtn = document.getElementById("contenido-btn"); // Botón del Panel

// Función unificada para manejar el click en ambos botones
function toggleTracksHandler(e) {
    e.stopPropagation(); 
    
    if (!tracksModalRef || modoActual !== "local") {
        console.log("ℹ️ Tracks deshabilitado (Modo radio)");
        return;
    }

    const isOpen = !tracksModalRef.classList.contains("hidden");

    if (isOpen) {
        // Cierre: llama a la función centralizada que remueve la clase 'active' de ambos
        cerrarModalTracks("botón de alternancia");
        return;
    }

    // --- Lógica de Apertura ---
    trackData = playlists[playlistActual] || [];
    currentTrack = currentTrack || 0;

    tracksModalRef.classList.remove("hidden");
    
    // Sincroniza estado visual: añade la clase 'active' a AMBOS botones
    if (btnMusic) btnMusic.classList.add("active");
    if (contenidoBtn) contenidoBtn.classList.add("active");
    
    pintarCabecera(trackData, currentTrack); // Asegura que la cabecera se pinte
    generarListaModal(trackData, currentTrack);
    console.log("🎵 Modal Tracks abierto");
}

// 2. Asignación de listeners para ambos botones
if (btnMusic) {
    btnMusic.addEventListener("click", toggleTracksHandler);
}
if (contenidoBtn) {
    contenidoBtn.addEventListener("click", toggleTracksHandler);
}

//======================================
// ⏩ BOTÓN FORWARD (cabecera + panel)
//======================================

["btn-forward", "forward-btn"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("click", () => {
    console.log("⏩ Click Forward desde:", id);

    const list = playlists[playlistActual] || [];
    if (!list.length) {
      console.warn("⏩ Playlist vacía o no disponible:", playlistActual);
      return;
    }

    // avanzar un track sin exceder
    const next = Math.min(list.length - 1, currentTrack + 1);
    currentTrack = next;

    // reproducir usando activarModoLocal
    activarModoLocal(playlistActual, currentTrack);

    console.log(`⏩ Avanzado a track ${currentTrack}:`, list[currentTrack]?.title);
  });
});

//======================================
// ⏪ BOTÓN REWIND (cabecera + panel)
//======================================

["btn-rewind", "rewind-btn"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("click", () => {
    console.log("⏪ Click Rewind desde:", id);

    const list = playlists[playlistActual] || [];
    if (!list.length) {
      console.warn("⏪ Playlist vacía o no disponible:", playlistActual);
      return;
    }

    // retroceder un track sin ir por debajo de 0
    const prev = Math.max(0, currentTrack - 1);
    currentTrack = prev;

    // reproducir usando activarModoLocal
    activarModoLocal(playlistActual, currentTrack);

    console.log(`⏪ Retrocedido a track ${currentTrack}:`, list[currentTrack]?.title);
  });
});


//======================================
// 🔁 BOTÓN REPEAT (cabecera + panel)
//======================================

// Estado global de repetición
let repeatMode = false;

// Click en cabecera y panel
["btn-repeat", "repeat-btn"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("click", () => {
    repeatMode = !repeatMode;
    console.log(`🔁 Repeat desde ${id} → ${repeatMode ? "ON" : "OFF"}`);

    const btnRepeatHeader = document.getElementById("btn-repeat");
    const repeatBtnPanel  = document.getElementById("repeat-btn");

    // Efecto visual: solo panel
    if (repeatMode) {
      repeatBtnPanel?.classList.add("repeat-active");
    } else {
      repeatBtnPanel?.classList.remove("repeat-active");
    }

    // Si quieres apariencia “aparentemente aplicada a ambos” sin rotación:
    // btnRepeatHeader?.classList.toggle("active", repeatMode);

    // Lógica de reproductor (repeat-one o repeat-all)
    // Ejemplo simple: repeat-one
    audio.loop = repeatMode;
  });
});

//======================================
// 🔀 BOTÓN SHUFFLE (cabecera + panel)
//======================================

let shuffleMode = false; // estado global

["btn-shuffle", "shuffle-btn"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("click", () => {
    shuffleMode = !shuffleMode;
    console.log(`🔀 Click Shuffle desde: ${id} → ${shuffleMode ? "ON" : "OFF"}`);

    const btnShuffleHeader = document.getElementById("btn-shuffle");
    const shuffleBtnPanel  = document.getElementById("shuffle-btn");

    if (shuffleMode) {
      shuffleBtnPanel?.classList.add("shuffle-active");
      btnShuffleHeader?.classList.add("active"); // opcional, solo para apariencia
    } else {
      shuffleBtnPanel?.classList.remove("shuffle-active");
      btnShuffleHeader?.classList.remove("active");
    }

    // Lógica de reproductor: activar modo aleatorio inmediato
    if (shuffleMode) {
      // ejemplo simple: elegir un track aleatorio
      const list = playlists[playlistActual] || [];
      if (list.length) {
        currentTrack = Math.floor(Math.random() * list.length);
        activarModoLocal(playlistActual, currentTrack);
        audio.play();
        console.log(`🔀 Shuffle activado → Track aleatorio: ${currentTrack}`, list[currentTrack]?.title);
      }
    }
  });
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ BOTÓN PLAY (cabecera + panel)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

["btn-playpause", "play-btn"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("click", async () => {
    console.log("▶️ Click Play desde:", id);

    // Si el modal Playlist está abierto y hay selección
    if (playlistModal && !playlistModal.classList.contains("hidden") && currentModalList) {
      const items = currentModalList.querySelectorAll("li[data-list]");
      if (items.length) {
        const selectedItem = items[modalIndex];
        const key = selectedItem?.dataset.list;
        if (key) {
          await loadPlaylist(key);
          activarModoLocal(key, 0);
          audio.play();

          // sincronizar íconos
          document.getElementById("btn-playpause")?.querySelector("i")
            ?.classList.replace("fa-play", "fa-pause");
          document.getElementById("play-btn")?.querySelector("i")
            ?.classList.replace("fa-play", "fa-pause");

          cerrarPlaylistModal("Play desde modal");
          console.log(`▶️ Playlist reproducida desde modal: ${key}`);
          return;
        }
      }
    }

    // Caso normal: alternar play/pause del audio
    if (audio.paused) {
      audio.play();
      console.log("▶️ Reproducción iniciada");
    } else {
      audio.pause();
      console.log("⏸ Reproducción pausada");
    }

    // sincronizar íconos
    const btnPlayPauseHeader = document.getElementById("btn-playpause")?.querySelector("i");
    const playBtnPanel       = document.getElementById("play-btn")?.querySelector("i");

    if (audio.paused) {
      btnPlayPauseHeader?.classList.replace("fa-pause", "fa-play");
      playBtnPanel?.classList.replace("fa-pause", "fa-play");
    } else {
      btnPlayPauseHeader?.classList.replace("fa-play", "fa-pause");
      playBtnPanel?.classList.replace("fa-play", "fa-pause");
    }
  });
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ➕ BOTÓN PLUS → Ocultar/mostrar reproductor + cambio de ícono
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const btnPlus = document.getElementById("btn-plus");
const mainContainer = document.getElementById("main-container");
const iconPlus = btnPlus?.querySelector("i"); // suponiendo que dentro hay un <i> con fa-plus/fa-times

btnPlus?.addEventListener("click", () => {
  if (!mainContainer) return;

  mainContainer.classList.toggle("hidden-repro");

  const oculto = mainContainer.classList.contains("hidden-repro");

  // alternar ícono
  if (iconPlus) {
    if (oculto) {
      iconPlus.classList.replace("fa-plus", "fa-times");
    } else {
      iconPlus.classList.replace("fa-times", "fa-plus");
    }
  }

  console.log(`🎛️ Reproductor ${oculto ? "oculto" : "visible"}`);
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

//=====================================
// Mostrar mensaje al hacer clic derecho
//=====================================
document.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // evitar menú contextual
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  // Ocultar automáticamente después de unos segundos
  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);
});