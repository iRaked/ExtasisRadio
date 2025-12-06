//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 INICIALIZACIÓN GLOBAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  const player = document.getElementById("player");
  const statusLabel = document.querySelector(".btn-status-header .status-label");
  const bannersContainer = document.getElementById("playlist-banners");
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  const scrollBottomBtn = document.getElementById("scrollBottomBtn");
  const menuStatusLabel = document.querySelector(".btn-status-footer .status-label b"); 
  const menuButton = document.querySelector(".btn-status-footer");
  let isMenuOpen = false;

  let modoActual = "radio";
  let gestureDetected = false;
  let trackData = [];
  let currentTrack = 0;
  let currentBannerIndex = 0;

  const radioServer = "https://radio-nine-gilt.vercel.app/api/radio";

  // Configuración inicial
  player.autoplay = true;
  player.muted = true;
  player.preload = "auto";
  player.src = radioServer;

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Función segura de play
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function safePlay(unmute = false) {
    if (unmute) player.muted = false;
    player.play().catch(err => console.warn("Error al reproducir:", err));
  }

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 Estado y utilidades Radio (globales)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let radioIntervalId = null;
let lastTrackTitle = "";
let ultimaCaratulaValida = "https://santi-graphics.vercel.app/assets/img/CD.png";

// Limpia intervalos previos de radio
function detenerActualizacionRadio() {
  if (radioIntervalId !== null) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }
}

// Limpieza del título (remueve tag y corchetes, barras)
function safeCleanTitle(raw) {
  let s = String(raw || "").trim();
  if (!s) return "";
  const tag = "SANTI MIX DJ";
  const idx = s.toUpperCase().indexOf(tag);
  if (idx !== -1) s = s.slice(0, idx) + s.slice(idx + tag.length);

  let out = "", depth = 0;
  for (let ch of s) {
    if (ch === "[") { depth++; continue; }
    if (ch === "]" && depth > 0) { depth--; continue; }
    if (depth === 0) out += ch;
  }
  s = out;

  while (s.endsWith("|") || s.endsWith(" |")) {
    s = s.slice(0, s.lastIndexOf("|")).trim();
  }
  return s.trim();
}

// Separa artista y título con separadores comunes
function splitArtistTitle(cleaned) {
  const s = String(cleaned);
  const seps = [" - ", " – ", " — ", "-", "–", "—"];
  for (const sep of seps) {
    const pos = s.indexOf(sep);
    if (pos > 0) return { artist: s.slice(0, pos).trim(), title: s.slice(pos + sep.length).trim() };
  }
  return { artist: "Radio", title: s.trim() };
}

// Valida carátula con fallback
function validarCaratula(url, fallback = "https://santi-graphics.vercel.app/assets/covers/Cover1.png") {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { ultimaCaratulaValida = url; resolve(url); };
    img.onerror = () => resolve(fallback);
    img.src = url;
  });
}

// Busca carátula en iTunes y valida
async function obtenerCaratulaDesdeiTunes(artist, title) {
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const url   = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;
    const res   = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data  = await res.json();
    if (data.resultCount > 0)
      return data.results[0].artworkUrl100.replace("100x100", "400x400");
  } catch (err) {
    console.warn("⚠️ iTunes falló:", err);
  }
  return null;
}

async function obtenerCaratula(artist, title) {
  const found = await obtenerCaratulaDesdeiTunes(artist, title);
  const pick  = found || ultimaCaratulaValida;
  return await validarCaratula(pick);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 Historial de radio (solo tracks válidos)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let trackHistory = [];

function pushHistoryEntry(artist, title, coverUrl) {
  // Validación estricta: no registrar si no hay título/artista
  if (!title || !artist) return;
  if (title.toLowerCase().includes("offline")) return;
  if (title.trim() === "" || artist.trim() === "") return;

  // Hora de detección (HH:MM)
  const now = new Date();
  const hora = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Añadir al inicio con hora
  trackHistory.unshift({ artist, title, coverUrl, hora });

  // Limitar a 20
  if (trackHistory.length > 20) trackHistory = trackHistory.slice(0, 20);
}

function renderRadioHistory() {
  if (!bannersContainer) return;
  bannersContainer.innerHTML = "";

  trackHistory.forEach((entry, idx) => {
    const banner = document.createElement("div");
    banner.className = "banner-item radio" + (idx === 0 ? " active" : "");

    banner.innerHTML = `
      <div class="banner-overlay">
        <marquee behavior="scroll" direction="left" scrollamount="4">
          <span style="white-space: nowrap;">
            [${entry.hora}] <b>${entry.title}</b> – ${entry.artist}
          </span>
        </marquee>
      </div>
    `;

    bannersContainer.appendChild(banner);
  });
}

function actualizarUI(entry) {
  const { artist, title, coverUrl } = entry;

  // Validar antes de registrar
  if (!title || !artist) return;
  if (title.toLowerCase().includes("offline")) return;

  // Actualizar carátula
  const coverImg = document.querySelector(".cover-container img");
  if (coverImg) {
    coverImg.src = coverUrl || ultimaCaratulaValida;
    coverImg.alt = `${artist} – ${title}`;
  }

  // Guardar en historial y renderizar
  pushHistoryEntry(artist, title, coverUrl);
  renderRadioHistory();
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 Actualizar UI con metadatos radio
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function actualizarUI(entry) {
  const { artist, title, coverUrl } = entry;

  // Validar antes de registrar
  if (!title || title.toLowerCase().includes("offline")) return;

  // Actualizar carátula
  const coverImg = document.querySelector(".cover-container img");
  if (coverImg) {
    coverImg.src = coverUrl || ultimaCaratulaValida;
    coverImg.alt = `${artist} – ${title}`;
  }

  // Guardar en historial y renderizar
  pushHistoryEntry(artist, title, coverUrl);
  renderRadioHistory();
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 Metadatos Modo Radio (fetch + proxy)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function iniciarActualizacionRadio() {
  detenerActualizacionRadio(); // limpia intervalos previos

  const radioUrl = "http://178.32.146.184:2852/stats?sid=1&json=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function actualizarDesdeServidor() {
    try {
      if (modoActual !== "radio") { detenerActualizacionRadio(); return; }

      const res = await fetch(proxyUrl, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Limpieza y separación de metadatos
      const cleaned = safeCleanTitle(data?.songtitle);
      if (!cleaned || cleaned.toLowerCase().includes("offline")) return;

      if (cleaned === lastTrackTitle) return;
      lastTrackTitle = cleaned;

      const { artist, title } = splitArtistTitle(cleaned);
      const coverUrl = await obtenerCaratula(artist, title);

      // Actualizar UI con metadatos
      actualizarUI({ artist, title, coverUrl });
    } catch (err) {
      // No romper el banner; muestra estado de conexión
      actualizarUI({
        artist: "Radio",
        title: "Conectando…",
        coverUrl: ultimaCaratulaValida
      });
    }
  }

  // Primera lectura inmediata + refresco cada 12s
  actualizarDesdeServidor();
  radioIntervalId = setInterval(actualizarDesdeServidor, 12000);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 CONTADOR RADIOESCUCHAS (estable, sin CORS roturas)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let contadorIntervalId = null;
const contadorElemento = document.getElementById("listener-count");

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

  const baseUrl = "http://178.32.146.184:2852/stats?sid=1&json=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;

  function pintar(valor) {
    contadorElemento.textContent = Number.isFinite(valor) ? String(valor) : "0";
  }

  async function actualizar() {
    if (modoActual !== "radio") { detenerContadorRadioescuchas(); return; }

    try {
      // Intento directo con proxy (más estable que JSONP)
      const res = await fetch(proxyUrl, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      pintar(data?.currentlisteners ?? 0);
    } catch (err) {
      console.warn("❌ Error contador radioescuchas:", err);
      pintar(0);
    }
  }

  contadorElemento.textContent = "--";
  actualizar();
  contadorIntervalId = setInterval(actualizar, 15000);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 Activar Modo Radio (blindado)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarModoRadio() {
  detenerActualizacionRadio();     // evita intervalos duplicados
  modoActual = "radio";
  statusLabel.textContent = "RADIO";

  // Fuente de audio (usa HTTPS en tu server proxy)
  player.src = radioServer;
  safePlay(gestureDetected);

  // Estado inicial en banners: no reemplazar contenedor completo
  // Monta/actualiza un banner de conexión si aún no existe
  let radioBanner = document.querySelector("#playlist-banners .banner-item.radio");
  if (!radioBanner) {
    radioBanner = document.createElement("div");
    radioBanner.className = "banner-item radio active";
    radioBanner.innerHTML = `
      <div class="banner-overlay">
        <span>Conectando a Radio...</span>
      </div>
    `;
    bannersContainer.innerHTML = "";
    bannersContainer.appendChild(radioBanner);
  } else {
    const span = radioBanner.querySelector(".banner-overlay span");
    if (span) span.textContent = "Conectando a Radio...";
    radioBanner.classList.add("active");
  }

  // Limpieza de carátula → imagen por defecto
  const coverContainer = document.querySelector(".cover-container img");
  if (coverContainer) {
    coverContainer.src = "https://santi-graphics.vercel.app/assets/img/CD.png";
    coverContainer.alt = "Carátula demo";
  }

  // Arranca actualización de metadatos
iniciarActualizacionRadio();

// Arranca contador de radioescuchas
iniciarContadorRadioescuchas();

}

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Activar modo local (playlist JSON)
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function activarModoLocal() {
    // 1. Limpieza de radio
    detenerActualizacionRadio();
    detenerContadorRadioescuchas();

    // Limpieza de audio y banners
    player.pause();
    player.removeAttribute("src"); 
    trackHistory = [];
    bannersContainer.innerHTML = "";
    const coverContainer = document.querySelector(".cover-container img");
    if (coverContainer) {
        coverContainer.src = "https://santi-graphics.vercel.app/assets/img/CD.png";
        coverContainer.alt = "Carátula demo";
    }
     
    // 2. Establecer modo y labels
    modoActual = "local";
    statusLabel.textContent = "MÚSICA";
    menuStatusLabel.innerHTML = "<b>MÚSICA</b>"; // Setea el label del footer
     
    // 3. Cargar la última playlist (o HardCore por defecto)
    const playlistIndexToLoad = currentPlaylistIndex ?? (playlists.length - 1); 
    const playlistToLoad = playlists[playlistIndexToLoad];
    
    // Llama a la función de carga. Esta función se encarga de llamar a renderTracklist
    // una vez que los datos (trackData) han sido obtenidos.
    cargarPlaylist(playlistToLoad); 
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/* PLAYLISTS LOCALES */
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const playlists = [
  { file: 'https://radio-tekileros.vercel.app/Actual.json', name: 'Varios' },
  { file: 'https://radio-tekileros.vercel.app/Bandida.json', name: 'Bandida' },
  { file: 'https://radio-tekileros.vercel.app/Rumba.json', name: 'Rumba Caliente' },
  { file: 'https://radio-tekileros.vercel.app/Exitos.json', name: 'Éxitos' },
  { file: 'https://radio-tekileros.vercel.app/BaladasRock.json', name: 'Baladas Rock' },
  { file: 'https://radio-tekileros.vercel.app/HardCore.json', name: 'Ruido de Lata' } // lista actual
];

// *Mantener si lo usas*
let currentPlaylistIndex = playlists.length - 1; // inicia en HardCore

// *Eliminar si no la usas. Si la mantienes, debe usar cargarPlaylist(playlistObj)*
function nextPlaylist() {
  currentPlaylistIndex = (currentPlaylistIndex + 1) % playlists.length;
  const playlist = playlists[currentPlaylistIndex];
  // Corregido: Debe llamar a cargarPlaylist con el objeto completo
  cargarPlaylist(playlist); 
}

//======================================
// Cargar Playlist Seleccionada (Corregida la RUTA y Extracción de data)
//======================================
function cargarPlaylist(playlistObj) {
    // Nota: El label del footer se actualiza en renderPlaylistsMenu y en esta función (al éxito)
    if (bannersContainer) bannersContainer.innerHTML = "";
    player.pause(); 

    // Mostrar banner de carga
    const loadingBanner = document.createElement("div");
    loadingBanner.className = "banner-item loading active";
    loadingBanner.innerHTML = `<div class="banner-overlay"><span>Cargando ${playlistObj.name}...</span></div>`;
    bannersContainer.appendChild(loadingBanner);

    // 🚨 CORRECCIÓN CLAVE: Usa playlistObj.file (la URL completa)
    fetch(playlistObj.file) 
        .then(res => res.json())
        .then(data => {
            // Extracción dinámica de la clave (ej: 'Actual.json' -> 'actual')
            const fileKey = playlistObj.file.split('/').pop().split('.')[0].toLowerCase();
            trackData = Array.isArray(data) ? data : data[fileKey];
            
            if (!trackData) {
                // Intento final para el caso 'hardcore' si no coincide con la clave del archivo
                trackData = data.hardcore || [];
            }
                       
            if (trackData && trackData.length > 0) {
                currentTrack = 0;
                // Llama a la función unificada de renderizado de tracks
                renderTracklist(playlistObj.name); 
                reproducirTrack(currentTrack);
                menuStatusLabel.innerHTML = "<b>MÚSICA</b>"; // Listo, cambia el label del footer
            } else {
                bannersContainer.innerHTML = `<div class="banner-item error"><div class="banner-overlay"><span>Playlist vacía. Click en MENÚ para volver.</span></div></div>`;
                menuStatusLabel.innerHTML = "<b>MENÚ</b>";
            }
        })
        .catch(err => {
            console.error('Error cargando playlist:', err);
            bannersContainer.innerHTML = `<div class="banner-item error"><div class="banner-overlay"><span>Error al cargar ${playlistObj.name}. Click en MENÚ para volver.</span></div></div>`;
            menuStatusLabel.innerHTML = "<b>MENÚ</b>";
        });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Renderizar Menú de Playlists (Actualizado con lógica de estado del menú)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderPlaylistsMenu() {
    if (!bannersContainer || !menuStatusLabel) return;
    
    // 1. Configurar estado y limpiar
    bannersContainer.innerHTML = "";
    menuStatusLabel.innerHTML = "<b>MENÚ</b>";
    isMenuOpen = true; // <-- ACTIVA EL ESTADO DE MENÚ ABIERTO
    
    // Banner de título
    const titleBanner = document.createElement("div");
    titleBanner.className = "banner-item playlist-title active";
    titleBanner.innerHTML = `<div class="banner-overlay"><span>**PLAYLIST**</span></div>`;
    bannersContainer.appendChild(titleBanner);

    // 2. Renderizar opciones de playlists
    playlists.forEach((playlist) => {
        const banner = document.createElement("div");
        banner.className = "banner-item playlist-item";
        banner.innerHTML = `
            <div class="banner-overlay">
                <span>${playlist.name}</span>
            </div>
        `;

        // 3. Listener para cargar la playlist
        banner.addEventListener("click", () => {
            cargarPlaylist(playlist);
            isMenuOpen = false; // <-- DESACTIVA EL ESTADO DE MENÚ CERRADO al seleccionar
        });

        bannersContainer.appendChild(banner);
    });
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Renderizar Tracks
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderTracklist(playlistName) {
    if (!bannersContainer) return;
    bannersContainer.innerHTML = "";

    // Banner de título de la playlist
    const titleBanner = document.createElement("div");
    titleBanner.className = "banner-item playlist-title";
    titleBanner.innerHTML = `<div class="banner-overlay"><span>PLAYLIST: ${playlistName}</span></div>`;
    bannersContainer.appendChild(titleBanner);

    trackData.forEach((track, idx) => {
      const banner = document.createElement("div");
      banner.className = "banner-item track-item"; 
      
      banner.innerHTML = `
        <div class="banner-overlay">
          <marquee behavior="scroll" direction="left" scrollamount="4">
            <span><b>${track.nombre}</b> – ${track.artista}${track.duracion ? " ("+track.duracion+")" : ""}</span>
          </marquee>
        </div>
      `;

      banner.addEventListener("click", () => {
        currentTrack = idx;
        reproducirTrack(currentTrack);
        focusBanner(idx); // Asume que focusBanner(index) llama a resaltarBanner y scrollIntoView
      });

      bannersContainer.appendChild(banner);
    });

    // Inicializa en el primer track (índice 0)
    focusBanner(0);
}

  //======================================
  // Scroll con botones (por índice)
  //======================================
  function focusBanner(index) {
    const banners = document.querySelectorAll("#playlist-banners .banner-item");
    if (index < 0 || index >= banners.length) return;
    currentBannerIndex = index;

    // Aplica estado activo con trazo verde
    banners.forEach((b, i) => b.classList.toggle("active", i === index));

    // Centra el banner activo en la vista
    banners[index].scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      focusBanner(currentBannerIndex - 1);
      scrollTopBtn.blur();
    });
  }

  if (scrollBottomBtn) {
    scrollBottomBtn.addEventListener("click", () => {
      focusBanner(currentBannerIndex + 1);
      scrollBottomBtn.blur();
    });
  }

  //======================================
  // Resaltar banner activo
  //======================================
  function resaltarBanner(index) {
    const banners = document.querySelectorAll("#playlist-banners .banner-item");
    banners.forEach((b, i) => {
      if (i === index) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
  }

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOTONERA
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let isPlaying = false;
let repeatMode = false;
let shuffleMode = false;

const btnRepeat  = document.getElementById("btn-repeat");
const btnRwd     = document.getElementById("btn-rwd");
const btnPlay    = document.getElementById("btn-play");
const btnFwd     = document.getElementById("btn-fwd");
const btnShuffle = document.getElementById("btn-shuffle");

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔁/🔀 Lógica única de avance
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function nextTrack() {
  if (modoActual !== "local" || trackData.length === 0) return;

  // Repeat: se mantiene en el mismo índice
  if (repeatMode) {
    reproducirTrack(currentTrack);
    return;
  }

  // Shuffle: índice aleatorio distinto (si hay >1)
  if (shuffleMode) {
    if (trackData.length > 1) {
      let next;
      do { next = Math.floor(Math.random() * trackData.length); }
      while (next === currentTrack);
      currentTrack = next;
    } else {
      currentTrack = 0;
    }
    reproducirTrack(currentTrack);
    return;
  }

  // Secuencial
  currentTrack = (currentTrack + 1) % trackData.length;
  reproducirTrack(currentTrack);
}

//======================================
// 🔘 Repeat toggle (exclusivo con shuffle)
//======================================
btnRepeat?.addEventListener("click", () => {
  repeatMode = !repeatMode;
  btnRepeat.classList.toggle("active", repeatMode);
  if (repeatMode && shuffleMode) {
    shuffleMode = false;
    btnShuffle.classList.remove("active");
  }
});

//======================================
// 🔘 Shuffle toggle (aplica de inmediato)
//======================================
btnShuffle?.addEventListener("click", () => {
  shuffleMode = !shuffleMode;
  btnShuffle.classList.toggle("active", shuffleMode);

  // Exclusividad con repeat
  if (shuffleMode && repeatMode) {
    repeatMode = false;
    btnRepeat.classList.remove("active");
  }

  // Aplicar modo aleatorio inmediatamente si estamos en local
  if (shuffleMode && modoActual === "local" && trackData.length > 0) {
    // Salta a un nuevo track ahora mismo
    if (trackData.length > 1) {
      let next;
      do { next = Math.floor(Math.random() * trackData.length); }
      while (next === currentTrack);
      currentTrack = next;
    } else {
      currentTrack = 0;
    }
    reproducirTrack(currentTrack);
  }
});

//======================================
// ▶️ Play/Pause con sincronización de icono
//======================================
btnPlay?.addEventListener("click", () => {
  if (player.paused) {
    safePlay(true);
  } else {
    player.pause();
  }
});
player.addEventListener("play",  () => { isPlaying = true;  btnPlay && (btnPlay.innerHTML = `<i class="fa-solid fa-pause"></i>`); });
player.addEventListener("pause", () => { isPlaying = false; btnPlay && (btnPlay.innerHTML = `<i class="fa-solid fa-play"></i>`); });

//======================================
// ⏮️ REWIND
//======================================
btnRwd?.addEventListener("click", () => {
  if (modoActual !== "local" || trackData.length === 0) return;
  currentTrack = (currentTrack - 1 + trackData.length) % trackData.length;
  reproducirTrack(currentTrack);
});

//======================================
// ⏭️ FORWARD (usa la misma lógica que ended)
//======================================
btnFwd?.addEventListener("click", () => {
  nextTrack();
});

// ▶️ Evento ended (usa la misma lógica)
player.addEventListener("ended", () => {
  nextTrack();
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔊 Control de volumen
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const volumeSlider = document.getElementById("volume-slider");
const volumePercent = document.querySelector(".volume-percent");
const volumeIcon = document.querySelector(".volume-icon");

// Inicializa en 70%
player.volume = 0.7;
volumePercent.textContent = "70%";
volumeIcon.textContent = "🔊";

function updateVolumeUI(value) {
  const percent = parseInt(value, 10);
  volumePercent.textContent = percent + "%";
  volumeIcon.textContent = percent === 0 ? "🔇" : "🔊";
  player.volume = percent / 100;
}

// Evento al mover el slider
volumeSlider.addEventListener("input", (e) => {
  updateVolumeUI(e.target.value);
});

// También con teclas ↑ y ↓
document.addEventListener("keydown", (e) => {
  let val = parseInt(volumeSlider.value, 10);
  if (e.key === "ArrowUp") {
    val = Math.min(100, val + 10);
    volumeSlider.value = val;
    updateVolumeUI(val);
  } else if (e.key === "ArrowDown") {
    val = Math.max(0, val - 10);
    volumeSlider.value = val;
    updateVolumeUI(val);
  }
});

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Reproducir un track local + Metadatos
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function reproducirTrack(index) {
    const track = trackData[index];
    if (!track) return;

    player.src = track.dropbox_url;
    safePlay(gestureDetected);

    // Actualizar carátula
    const coverContainer = document.querySelector(".cover-container img");
    if (coverContainer) {
      coverContainer.src = track.caratula;
      coverContainer.alt = track.nombre;
    }

    // Resaltar banner activo
    resaltarBanner(index);

    // Centrar banner activo en scroll
    const activeBanner = document.querySelector("#playlist-banners .banner-item.active");
    if (activeBanner) {
      activeBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  //======================================
  // Reproducción continua en modo local
  //======================================
player.addEventListener("ended", () => {
    if (modoActual === "local") {
        nextTrack();
    } else if (modoActual === "radio") {
        // Si el stream se acaba, intenta reconectar después de un breve retraso
        console.log("Stream de radio terminado. Intentando reconexión...");
        setTimeout(() => {
            safePlay(true); // safePlay intenta reproducir, reactivando el stream
        }, 1000); // Espera 1 segundo antes de reintentar
    }
});

// Manejo de Errores de Red (para evitar pausas inesperadas en radio)
player.addEventListener("error", (e) => {
    if (modoActual === "radio") {
        console.error("Error de audio en modo radio:", e.target.error.code);
        // Intenta reconectar inmediatamente al detectar un error de red o decodificación
        setTimeout(() => {
            safePlay(true);
        }, 500); 
    }
});

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Primer gesto humano → desmuteo + play
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const unlockAudio = () => {
    if (!gestureDetected) {
      gestureDetected = true;
      player.muted = false;
      if (modoActual === "radio") {
        activarModoRadio();
      } else {
        reproducirTrack(currentTrack);
      }
    }
  };

  document.addEventListener("click", unlockAudio, { once: true });
  document.addEventListener("touchstart", unlockAudio, { once: true });
      
//==================================================================
// Botón MENÚ/MÚSICA (btn-status-footer) - LÓGICA DE TOGGLE
//==================================================================
const menuButtonFooter = document.querySelector(".btn-status-footer");

if (menuButtonFooter) {
  menuButtonFooter.addEventListener("click", () => {
      if (modoActual !== "local" || trackData.length === 0) return; // Solo funciona en modo local con tracks cargados

      if (isMenuOpen) {
          // Si el menú está abierto: CERRAR MENÚ y volver a mostrar los tracks
          const playlistName = playlists[currentPlaylistIndex].name;
          renderTracklist(playlistName); // Re-renderiza los tracks de la playlist actual
          menuStatusLabel.innerHTML = "<b>MÚSICA</b>";
          isMenuOpen = false;
      } else {
          // Si el menú está cerrado: ABRIR MENÚ
          renderPlaylistsMenu(); 
          isMenuOpen = true;
          // renderPlaylistsMenu() se encarga de cambiar el label a "MENÚ"
      }
  });
}

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Alternar entre modos con el botón
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  document.querySelector(".btn-status-header").addEventListener("click", () => {
    if (modoActual === "radio") {
      activarModoLocal();
    } else {
      activarModoRadio();
    }
  });

  // Arranca en modo radio
  activarModoRadio();
});

// ==============================
// Reloj digital + Fecha robustos
// ==============================

// Evita múltiples inicializaciones
if (!window.__clockModule) {
  window.__clockModule = (function() {
    let intervalId = null;

    function formatClock(now) {
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }

    function formatDate(now) {
      const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio',
                     'agosto','septiembre','octubre','noviembre','diciembre'];
      const diaSemana = dias[now.getDay()];
      const dia = now.getDate();
      const mes = meses[now.getMonth()];
      const año = now.getFullYear();
      return `${diaSemana} ${dia} de ${mes} ${año} - Bienvenidos a Casino Digital Radio`;
    }

    function updateOnce(clockEl, dateEl) {
      const now = new Date();
      if (clockEl) clockEl.textContent = formatClock(now);
      if (dateEl) dateEl.textContent = formatDate(now);
    }

    function start(clockEl, dateEl) {
      // Limpia cualquier intervalo previo
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      // Primera actualización inmediata
      updateOnce(clockEl, dateEl);
      // Actualiza cada segundo
      intervalId = setInterval(() => updateOnce(clockEl, dateEl), 1000);
    }

    // Espera a que existan los elementos, con reintento controlado
    function waitForEls(selectors, timeoutMs = 5000, intervalMs = 100) {
      return new Promise((resolve, reject) => {
        const t0 = Date.now();
        const tick = () => {
          const nodes = selectors.map(sel => document.querySelector(sel));
          if (nodes.every(Boolean)) {
            resolve(nodes);
          } else if (Date.now() - t0 >= timeoutMs) {
            reject(new Error('clock/date elements not found within timeout'));
          } else {
            setTimeout(tick, intervalMs);
          }
        };
        tick();
      });
    }

    // Hook de inicio: funciona con cualquier orden de script
    function initClockModule() {
      waitForEls(['#clock', '#date-span'])
        .then(([clockEl, dateEl]) => {
          start(clockEl, dateEl);
        })
        .catch(() => {
          // Opcional: intenta observar inserciones tardías del DOM
          const observer = new MutationObserver(() => {
            const clockEl = document.querySelector('#clock');
            const dateEl = document.querySelector('#date-span');
            if (clockEl && dateEl) {
              observer.disconnect();
              start(clockEl, dateEl);
            }
          });
          observer.observe(document.documentElement, { childList: true, subtree: true });
        });
    }

    // Arranque en DOM listo; si ya está, corre de inmediato
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initClockModule, { once: true });
    } else {
      initClockModule();
    }

    return { start }; // expone start por si deseas reiniciar manualmente
  })();
}

//=====================================
// Mostrar mensaje al hacer clic derecho
//=====================================
document.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // evitar menú contextual
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);
});