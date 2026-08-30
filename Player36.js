//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let trackData = [];
let currentTrack = null;
let modoActual = "radio"; // local/radio
let gestureDetected = false;
let repeatMode = "none";
let isShuffling = false;
let trackHistory = [];
let radioIntervalId = null;
let contadorIntervalId = null;
let visitas = {};

let lastTrackTitle = "";
let lastValidEntry = { 
    artist: "Bienvenido", 
    title: "A la Radio", 
    coverUrl: "https://santi-graphics.vercel.app/assets/covers/Cover1.png" 
}; 
let ultimaCaratulaValida = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
let coverCatalog = null;

// ELEMENTOS DE AUDIO
const audio = document.getElementById("player");
const discImg = document.getElementById("cover-art");
const COVER_ART_EL = discImg; // usamos la carátula como referencia

audio.autoplay = true;
audio.muted = true;
audio.preload = "auto";

// ELEMENTOS CLAVE DEL DOM
const playPauseBtn = document.getElementById("play-btn");
const nextBtn      = document.getElementById("forward-btn");
const prevBtn      = document.getElementById("rewind-btn");
const shuffleBtn   = document.getElementById("shuffle-btn");
const repeatBtn    = document.getElementById("repeat-btn");
const btnRadio     = document.getElementById("power-btn");
const musicBtn     = document.getElementById('music-btn');

const currentTrackName     = document.getElementById("track-title");
const currentArtistName  = document.getElementById("track-artist");
const metaTrack          = document.getElementById("track-album");

const volumeBar          = document.getElementById('volumeBar');
const volumePercentage = document.getElementById('volumePercentage');
const volumeIcon       = document.getElementById('volumeIcon');

const contadorElemento = document.getElementById("contadorRadio");

// Referencias de Modales y Listas
const modalTracks      = document.getElementById("modal-playlist");
const menuBtn          = document.getElementById("menu-btn");
const closeModalBtn    = document.getElementById("close-playlist-modal");
const trackList        = document.querySelector(".track-list");
const currentTrackNameModal = document.getElementById("current-track-display");
const trackPlaylistEl = document.getElementById("track-playlist");
const trackEmotionEl  = document.getElementById("track-emotion");

// Inicialización automática
document.addEventListener("DOMContentLoaded", () => {
  inicializarVolumen();
  iniciarBurbujas();


  if (modoActual === "radio") {
    activarModoRadio();   // arranca directo en radio
  } else {
    cargarPlaylist("actual");  // arranca en local
    safePlay({ keepMuted: true });
  }
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Función global para registrar historial
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function pushHistoryEntry(artist, title, cover) {
  const time = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const entry = { artist, title, time, cover };
  if (trackHistory.length === 0 || trackHistory[0].title !== title) {
    trackHistory.unshift(entry);
    if (trackHistory.length > 20) trackHistory.pop();
    console.log("➕ Historial actualizado:", entry);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CARGA DE JSON (autoplay integrado)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function cargarPlaylist(nombre) {
  try {
    let file, clave, etiqueta;
    const n = (nombre || "").toLowerCase();

    if (n === "actual") {
      file = "https://radio-tekileros.vercel.app/Actual.json"; clave = "actual"; etiqueta = "Novedades";
    } else if (n === "exitos") {
      file = "https://radio-tekileros.vercel.app/Exitos.json"; clave = "exitos"; etiqueta = "Éxitos";
    } else if (n === "rumba") {
      file = "https://radio-tekileros.vercel.app/Rumba.json"; clave = "rumba"; etiqueta = "Rumba Caliente";
    } else if (n === "bandida") {
      file = "https://radio-tekileros.vercel.app/Bandida.json"; clave = "bandida"; etiqueta = "Bandida";
    } else if (n === "caribe360") {
      file = "https://radio-tekileros.vercel.app/Caribe360.json"; clave = "caribe360"; etiqueta = "Caribe 360";
    } else if (n === "lacantina") {
      file = "https://radio-tekileros.vercel.app/LaCantina.json"; clave = "lacantina"; etiqueta = "La Cantina";
    } else if (n === "poptour") {
      file = "https://radio-tekileros.vercel.app/PopTour.json"; clave = "poptour"; etiqueta = "Pop Tour";
    } else if (n === "larevancha") {
      file = "https://radio-tekileros.vercel.app/LaRevancha.json"; clave = "larevancha"; etiqueta = "La Revancha";
    } else if (n === "latidos") {
      file = "https://radio-tekileros.vercel.app/Latidos.json"; clave = "latidos"; etiqueta = "Latidos";
    } else if (n === "bolerosrancheros") {
      file = "https://radio-tekileros.vercel.app/BolerosRancheros.json"; clave = "bolerosrancheros"; etiqueta = "Boleros Rancheros";
    } else if (n === "ritmorebelde") {
      file = "https://radio-tekileros.vercel.app/RitmoRebelde.json"; clave = "ritmorebelde"; etiqueta = "Ritmo Rebelde";
    } else if (n === "clubdisco") {
      file = "https://radio-tekileros.vercel.app/ClubDisco.json"; clave = "clubdisco"; etiqueta = "Club Disco";
    } else if (n === "reventonmusical") {
      file = "https://radio-tekileros.vercel.app/ReventonMusical.json"; clave = "reventonmusical"; etiqueta = "Reventón Musical";
    } else {
      console.warn(`❌ Playlist desconocida: ${nombre}`); return;
    }

    const res = await fetch(file, { cache: "no-cache" });
    if (!res.ok) { console.error(`❌ No se pudo cargar ${file} (status ${res.status})`); return; }

    const data = await res.json();
    let pistas = [];

    // LÓGICA DE EXTRACCIÓN INFALIBLE
    if (Array.isArray(data)) {
      pistas = data; // Si el JSON es un array directo [...]
    } else if (data[clave]) {
      pistas = data[clave];
    } else {
      // Fallback: busca el primer array dentro del objeto JSON, sin importar el nombre de la clave
      const firstArrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
      if (firstArrayKey) {
        pistas = data[firstArrayKey];
      } else {
        console.error(`❌ No se encontró un array de pistas en ${file}. Estructura recibida:`, data);
        return;
      }
    }

    // Normalización de claves por pista
    trackData = (pistas || []).map(t => ({
      ...t,
      dropbox_url: t.dropbox_url || t.enlace || t.url || "",
      caratula: t.caratula || t.cover || t.portada || "https://santi-graphics.vercel.app/assets/covers/Cover1.png",
      genero: t.genero || t.genre || "Desconocido",
      nombre: t.nombre || t.title || "Sin título",
      artista: t.artista || t.artist || "Desconocido",
    }));

    const playlistLabel = document.getElementById("track-playlist");
    if (playlistLabel) playlistLabel.textContent = `Playlist: ${etiqueta}`;

    currentTrack = 0;
    activarReproduccion(0, "auto-load");
    generarListaModal?.();

    console.log(`✅ Playlist "${etiqueta}" cargada con ${trackData.length} pistas.`);
  } catch (err) {
    console.error(`❌ Error al cargar playlist "${nombre}":`, err);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ REPRODUCCIÓN LOCAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarReproduccion(index, modo = "manual") {
  if (modoActual !== "local" || index < 0 || index >= trackData.length) return;

  const track = trackData[index];
  if (!track?.dropbox_url) return;

  currentTrack = index;

  // Actualizar UI con datos del track
  if (currentTrackName) currentTrackName.textContent = track.nombre;
  if (currentArtistName) currentArtistName.textContent = track.artista;
  if (metaTrack) metaTrack.textContent = track.genero || "Desconocido";
  if (discImg) {
    discImg.src = track.caratula || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
    discImg.classList.add("rotating");
  }

  if (track.emotion) {
    document.getElementById("track-emotion").textContent = track.emotion;
    aplicarEfectosPorEmocion(track.emotion);
    iniciarBurbujas(track.genero || track.emotion);
  }

  audio.src = track.dropbox_url;
  audio.load();

  // Diferenciar modos
  if (modo === "initial-load") {
    // Solo preparar UI, sin reproducir
    const icon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
    if (icon) { icon.classList.remove("fa-pause"); icon.classList.add("fa-play"); }
    if (discImg) discImg.classList.remove("rotating");
    return;
  }

  // auto-load y manual sí reproducen
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTOPLAY SEGURO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//================================
// CONTINUIDAD DE REPRODUCCIÓN
//================================
audio.addEventListener("ended", () => {
  if (modoActual !== "local") return;

  if (repeatMode === "one") {
    detenerKaraoke();
    activarReproduccion(currentTrack, "repeat-one");
  } else if (isShuffling) {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * trackData.length);
    } while (newIndex === currentTrack && trackData.length > 1);
    detenerKaraoke();
    activarReproduccion(newIndex, "shuffle-auto");
  } else {
    let nextIndex = (currentTrack + 1) % trackData.length;
    detenerKaraoke();
    activarReproduccion(nextIndex, "auto-next");
  }
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METADATOS RADIO (Puerto 8130)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function detenerActualizacionRadio() {
    if (radioIntervalId !== null) {
        clearInterval(radioIntervalId);
        radioIntervalId = null;
    }
}

function iniciarActualizacionRadio() {
    detenerActualizacionRadio();
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') return;
    
    // 🚨 PUERTO ACTUALIZADO A 8130
    const radioUrl = "https://technoplayerserver.net:8130/stats?json=1&sid=1";
    
    function actualizarDesdeServidor() {
        if (modoActual !== "radio") { detenerActualizacionRadio(); return; }
        
        $.ajax({
            dataType: 'jsonp',
            url: radioUrl,
            cache: false, // 🛡️ CLAVE: Evita que el navegador sirva una respuesta guardada
            success: function(data) {
                if (!data || !data.songtitle) return;
                
                // Limpieza original funcional
                const cleanedTitle = data.songtitle.trim()
                    .replace(/SANTI MIX DJ/gi, '')
                    .replace(/\|\s*$/g, '')
                    .trim();
                    
                if (!cleanedTitle || cleanedTitle === lastTrackTitle || cleanedTitle.toLowerCase().includes('offline')) {
                    return; // Silencio total si no hay cambios
                }
                
                lastTrackTitle = cleanedTitle;
                const songtitleSplit = cleanedTitle.split(/ - | – /);
                let artist = songtitleSplit.length >= 2 ? songtitleSplit[0].trim() : "Radio";
                let title = songtitleSplit.length >= 2 ? songtitleSplit.slice(1).join(' - ').trim() : cleanedTitle;

                // 🟢 Actualización UI inmediata con VARIABLES DEL REPRO ACTUAL
                if (currentArtistName) currentArtistName.textContent = artist;
                if (currentTrackName) currentTrackName.textContent = title;
                if (metaTrack) metaTrack.textContent = "Auto DJ";
                if (trackEmotionEl) trackEmotionEl.textContent = "radio";
                if (trackPlaylistEl) trackPlaylistEl.textContent = "";

                // 🚀 Disparar carátula y registrar en historial automáticamente
                obtenerCaratulaYRegistrar(artist, title);
            },
            error: function() {
                if (currentArtistName && !lastTrackTitle) {
                    currentArtistName.textContent = "Esperando señal...";
                }
            },
            timeout: 8000
        });
    }
    
    // 🚀 EJECUCIÓN INMEDIATA (Milisegundo 0)
    actualizarDesdeServidor();
    radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CARÁTULAS (iTunes JSONP)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function validarCaratula(url, fallback = "https://santi-graphics.vercel.app/assets/covers/Cover1.png") {
    if (!discImg) return fallback;
    const img = new Image();
    img.onload = () => {
        ultimaCaratulaValida = url;
        discImg.src = url;
        discImg.classList.add("rotating");
    };
    img.onerror = () => {
        discImg.src = fallback;
        discImg.classList.remove("rotating");
    };
    img.src = url;
    return url;
}

function formatArtist(artist) {
    return artist.toLowerCase().trim().split(/ [(&]/)[0];
}

function formatTitle(title) {
    return title.toLowerCase().trim().split(/ [(&]/)[0];
}

function obtenerCaratulaYRegistrar(artist, title) {
    const fallback = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
    
    // Si no hay jQuery, usamos el fallback y registramos el historial de todas formas
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
        const coverUrl = validarCaratula(fallback);
        pushHistoryEntry(artist, title, coverUrl);
        return;
    }

    const query = encodeURIComponent(`${formatArtist(artist)} ${formatTitle(title)}`);
    const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1&nocache=${Date.now()}`;

    $.ajax({
        dataType: 'jsonp',
        url: url,
        cache: false,
        timeout: 4000,
        success: function(data) {
            let cover = fallback;
            if (data && data.results && data.results.length > 0) {
                cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
            }
            const coverUrl = validarCaratula(cover);
            
            // Registrar en historial con la carátula obtenida (o fallback)
            pushHistoryEntry(artist, title, coverUrl);
        },
        error: function() {
            const coverUrl = validarCaratula(fallback);
            // Registrar en historial incluso si iTunes falla
            pushHistoryEntry(artist, title, coverUrl);
        }
    });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTADOR RADIOESCUCHAS (Puerto 8130)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function detenerContadorRadioescuchas() {
    if (contadorIntervalId !== null) {
        clearInterval(contadorIntervalId);
        contadorIntervalId = null;
    }
    if (contadorElemento) contadorElemento.textContent = "0";
}

function iniciarContadorRadioescuchas() {
    detenerContadorRadioescuchas();
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined' || !contadorElemento) return;
    
    // PUERTO ACTUALIZADO A 8130
    const contadorUrl = "https://technoplayerserver.net:8130/stats?json=1&sid=1";
    
    function actualizarContador() {
        if (modoActual !== "radio") { detenerContadorRadioescuchas(); return; }
        
        $.ajax({
            dataType: 'jsonp',
            url: contadorUrl,
            cache: false,
            success: function(data) {
                if (data && typeof data.currentlisteners === 'number') {
                    contadorElemento.textContent = data.currentlisteners;
                } else {
                    contadorElemento.textContent = "0";
                }
            },
            error: function() {
                contadorElemento.textContent = "0";
            },
            timeout: 5000
        });
    }
    
    // EJECUCIÓN INMEDIATA
    actualizarContador();
    contadorIntervalId = setInterval(actualizarContador, 15000);
}

//================================
// 🖥️ Actualizar UI con entrada
//================================
function actualizarUI(entry) {
  if (!entry) return;
  if (currentArtistName) currentArtistName.textContent = entry.artist || "";
  if (currentTrackName)  currentTrackName.textContent  = entry.title  || "";
  if (metaTrack)         metaTrack.textContent         = "Stream";
  if (discImg && entry.coverUrl) {
    discImg.src = entry.coverUrl;
    discImg.classList.add("rotating");
  }
}

//================================
// 📜 Guardar en historial
//================================
function pushHistoryEntry(artist, title, coverUrl) {
  const entry = {
    artist,
    title,
    coverUrl,
    timestamp: Date.now()
  };
  trackHistory.unshift(entry);
  lastValidEntry = entry;
  console.log("🧾 Historial actualizado:", entry);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALTERNANCIA DE MODOS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//================================
// MODO LOCAL
//================================
function activarModoLocal() {
  modoActual = "local";

  // Detener procesos de radio
  detenerActualizacionRadio();
  detenerContadorRadioescuchas();

  // Reiniciar audio sin dejarlo roto
  audio.pause();
  audio.removeAttribute("src"); 
  audio.load();

  // Restaurar carátula por defecto
  if (discImg) {
    discImg.classList.remove("rotating");
    discImg.src = ultimaCaratulaValida || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
  }

  // Icono de play
  const playIcon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
  if (playIcon) {
    playIcon.classList.remove("fa-pause");
    playIcon.classList.add("fa-play");
  }

  // Cargar playlist local
  cargarPlaylist("Actual");

  // Reiniciar partículas con la primera pista
  if (trackData.length > 0) {
    const track = trackData[0];
    const emotionEl = document.getElementById("track-emotion");
    if (emotionEl) emotionEl.textContent = track.emotion || "default";
    aplicarEfectosPorEmocion(track.emotion || "default");
    iniciarBurbujas(track.genero || track.emotion || "default");
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALTERNANCIA DE MODOS: MODO RADIO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function activarModoRadio() {
    modoActual = "radio";
    
    // 🟢 Limpieza de UI con VARIABLES DEL REPRO ACTUAL
    if (currentArtistName) currentArtistName.textContent = "Conectando...";
    if (currentTrackName) currentTrackName.textContent = "Obteniendo datos...";
    if (metaTrack) metaTrack.textContent = "";
    if (trackEmotionEl) trackEmotionEl.textContent = "radio";
    if (trackPlaylistEl) trackPlaylistEl.textContent = "";
    if (discImg) {
        discImg.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        discImg.classList.add("rotating");
    }
    if (contadorElemento) contadorElemento.textContent = "0";
    lastTrackTitle = "";

    // Detener procesos previos
    detenerActualizacionRadio();
    detenerContadorRadioescuchas();
    detenerKaraoke();
    limpiarEmociones();

    audio.pause();
    // PUERTO ACTUALIZADO A 8130
    audio.src = "https://technoplayerserver.net:8130/;";
    audio.load();

    const icon = playPauseBtn ? playPauseBtn.querySelector("i") : null;

    if (gestureDetected) {
        audio.muted = false;
        audio.play().then(() => {
            if (icon) {
                icon.classList.remove("fa-play");
                icon.classList.add("fa-pause");
            }
            if (discImg) discImg.classList.add("rotating");
        }).catch(() => {
            if (icon) {
                icon.classList.remove("fa-pause");
                icon.classList.add("fa-play");
            }
            if (discImg) discImg.classList.remove("rotating");
        });
    } else {
        if (icon) {
            icon.classList.remove("fa-pause");
            icon.classList.add("fa-play");
        }
        if (discImg) discImg.classList.remove("rotating");
    }

    // Inician de inmediato, sin esperar
    iniciarActualizacionRadio();
    iniciarContadorRadioescuchas();
    
    aplicarEfectosPorEmocion("radio");
    iniciarBurbujas("radio");
    actualizarBotonRadio();
}

//================================
// ACTUALIZAR ESTADO VISUAL BOTÓN RADIO
//================================
function actualizarBotonRadio() {
  if (btnRadio) {
    // Limpiamos clases previas para no acumular basura
    btnRadio.classList.remove("modo-radio", "modo-local", "active");
    
    if (modoActual === "radio") {
      btnRadio.classList.add("modo-radio", "active");
    } else {
      btnRadio.classList.add("modo-local");
    }
  }
}

//================================
// LIMPIEZA DE EMOCIONES Y CLASES
//================================
function limpiarEmociones() {
  document.body.classList.remove(
    "emotion-nostalgia",
    "emotion-picardia",
    "emotion-energia",
    "emotion-fiesta"
  );
  
  // También limpiamos el canvas de partículas si es necesario un reset visual
  const canvas = document.getElementById("particles");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KARAOKE SINCRONIZADO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

// Eventos de audio para iniciar karaoke (solo en modo Local)
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODAL HISTORIAL (Modo Radio)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

//===============================
// Función global para registrar historial
//===============================
function pushHistoryEntry(artist, title, cover) {
  const time = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const entry = { artist, title, time, cover };
  if (trackHistory.length === 0 || trackHistory[0].title !== title) {
    trackHistory.unshift(entry);
    if (trackHistory.length > 20) trackHistory.pop();
  }
}

const historyModal = document.getElementById("history-modal");
const historyList  = document.getElementById("history-list");

//================================
// ABRIR HISTORIAL DESDE BOTÓN MENU (solo en modo radio)
//================================
if (menuBtn && historyModal && historyList) {
  menuBtn.addEventListener("click", () => {
    if (modoActual !== "radio") {
      console.log("ℹ️ Historial deshabilitado en modo local");
      return;
    }

    // Animación del icono del botón Menu
    const icon = menuBtn.querySelector("i");
    icon && icon.classList.add("animate-spin");
    setTimeout(() => icon && icon.classList.remove("animate-spin"), 600);

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
          <img src="${entry.cover || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png'}" alt="Carátula" class="track-cover" />
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
    console.log("📜 Modal Historial abierto en modo radio");
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOGGLE MODAL TRACKS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function toggleModal(show) {
  if (!modalTracks) return;
  modalTracks.classList.toggle("hidden", !show);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GENERAR LISTA DE TRACKS EN MODAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generarListaModal() {
  const trackListEl = document.getElementById("modal-playlist-tracks");
  const headerEl    = document.getElementById("current-track-display");
  if (!trackListEl) return;

  trackListEl.innerHTML = "";
  if (modoActual !== "local") return;

  // Cabecera
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

    const info = document.createElement("div");
    info.classList.add("track-info");
    info.innerHTML = `
      <strong>${track.nombre || "Sin título"}</strong><br>
      <span>🎤 ${track.artista || "Desconocido"}</span><br>
      <span>💿 ${track.album || "Álbum desconocido"}</span><br>
      <span>⏱️ ${track.duracion || "--:--"}</span><br>
      <span>👁️ ${visitas[track.id] || 0}</span>
    `;

    li.addEventListener("click", () => {
      activarReproduccion(index, "modal-click");
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GENERAR SELECTOR DE PLAYLISTS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generarSelectorPlaylists() {
  const selector = document.querySelector("#playlist-modal .track-list");
  if (!selector) return;

  selector.innerHTML = "";

  // Orden completo y correcto (13 listas)
  const playlists = [
    { nombre: "actual",           etiqueta: "Novedades" },
    { nombre: "exitos",           etiqueta: "Éxitos" },
    { nombre: "rumba",            etiqueta: "Rumba Caliente" },
    { nombre: "bandida",          etiqueta: "Bandida" },
    { nombre: "caribe360",        etiqueta: "Caribe 360" },
    { nombre: "lacantina",        etiqueta: "La Cantina" },
    { nombre: "poptour",          etiqueta: "Pop Tour" },
    { nombre: "larevancha",       etiqueta: "La Revancha" },
    { nombre: "latidos",          etiqueta: "Latidos" },
    { nombre: "bolerosrancheros", etiqueta: "Boleros Rancheros" },
    { nombre: "ritmorebelde",     etiqueta: "Ritmo Rebelde" },
    { nombre: "clubdisco",        etiqueta: "Club Disco" },
    { nombre: "reventonmusical",  etiqueta: "Reventón Musical" }
  ];

  playlists.forEach(pl => {
    const li = document.createElement("li");
    li.textContent = pl.etiqueta;
    li.dataset.list = pl.nombre;

    li.addEventListener("click", () => {
      cargarPlaylist(pl.nombre);
      const playlistModal = document.getElementById("playlist-modal");
      if (playlistModal) playlistModal.classList.add("hidden");
      console.log(`📂 Playlist seleccionada: ${pl.nombre}`);
    });

    selector.appendChild(li);
  });
}
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CIERRES COMUNES DE MODALES (SECCIÓN CORREGIDA)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ❌ Botón de cierre del historial
const closeHistoryModal = document.getElementById("close-history-modal");
if (closeHistoryModal) {
    closeHistoryModal.addEventListener("click", () => {
        const historyModal = document.getElementById("history-modal");
        if (historyModal) historyModal.classList.add("hidden");
        console.log("❌ Modal Historial cerrado");
    });
}

// ❌ Botón de cierre del tracks
const closeTracksModal = document.getElementById("close-playlist-modal");
if (closeTracksModal) {
    closeTracksModal.addEventListener("click", () => {
        const modalTracks = document.getElementById("modal-playlist");
        if (modalTracks) modalTracks.classList.add("hidden");
        console.log("❌ Modal Tracks cerrado");
    });
}

// ❌ Botón de cierre del playlists
const closePlaylistsModal = document.getElementById("close-modal-btn");
if (closePlaylistsModal) {
    closePlaylistsModal.addEventListener("click", () => {
        const playlistModal = document.getElementById("playlist-modal");
        if (playlistModal) playlistModal.classList.add("hidden");
        console.log("❌ Modal Playlists cerrado");
    });
}

// ⌨️ ESC → cierra cualquier modal visible
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const historyModal  = document.getElementById("history-modal");
        const playlistModal = document.getElementById("playlist-modal");
        const modalTracks   = document.getElementById("modal-playlist");

        if (historyModal)  historyModal.classList.add("hidden");
        if (playlistModal) playlistModal.classList.add("hidden");
        if (modalTracks)   modalTracks.classList.add("hidden");

        console.log("❌ Modales cerrados con ESC");
    }
});

// 🖱️ Clic fuera global
document.addEventListener("click", (e) => {
    const historyModal  = document.getElementById("history-modal");
    const playlistModal = document.getElementById("playlist-modal");
    const modalTracks   = document.getElementById("modal-playlist");

    // NOTA: Asume que 'menuBtn' y 'musicBtn' están definidos globalmente.

    // Cierre para Modal Historial
    if (historyModal && !historyModal.classList.contains("hidden") &&
        !historyModal.contains(e.target) && typeof menuBtn !== 'undefined' && !menuBtn.contains(e.target)) {
        historyModal.classList.add("hidden");
        console.log("❌ Modal Historial cerrado por clic fuera");
    }

    // Cierre para Modal Playlists
    if (playlistModal && !playlistModal.classList.contains("hidden") &&
        !playlistModal.contains(e.target) && typeof menuBtn !== 'undefined' && !menuBtn.contains(e.target)) {
        playlistModal.classList.add("hidden");
        console.log("❌ Modal Playlists cerrado por clic fuera");
    }

    // Cierre para Modal Tracks (modal-playlist)
    if (modalTracks && !modalTracks.classList.contains("hidden") &&
        !modalTracks.contains(e.target) && typeof musicBtn !== 'undefined' && !musicBtn.contains(e.target)) {
        modalTracks.classList.add("hidden"); // <--- Esta línea asegura el cierre
        console.log("❌ Modal Tracks cerrado por clic fuera (global)");
    }
});

// 🖱️ Overlay directo → asegura cierre en todos
["history-modal","playlist-modal","modal-playlist"].forEach(id => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.add("hidden");
                console.log(`❌ ${id} cerrado por clic en overlay`);
            }
        });
    }
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOTONERA - CONTROLES DE REPRODUCCIÓN
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

//================================
// FORWARD
//================================
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

//================================
// REWIND
//================================
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

//================================
// REPEAT
//================================
function toggleRepeat() {
    const icon = repeatBtn.querySelector("i");
    
    if (repeatMode !== "one") {
        repeatMode = "one";
        if (repeatBtn) {
            repeatBtn.classList.add("active-one", "control-btn", "active");
            repeatBtn.classList.remove("active-all");

            repeatBtn.classList.add("animate-icon");
            setTimeout(() => {
                repeatBtn.classList.remove("animate-icon");
            }, 500);

            if (icon) {
                icon.classList.remove("fa-repeat-alt");
                icon.classList.add("fa-repeat-1-alt");
            }
        }
        audio.loop = true;
    } else {
        repeatMode = "none";
        if (repeatBtn) {
            repeatBtn.classList.remove("active-one", "control-btn", "active");
            
            repeatBtn.classList.add("animate-icon");
            setTimeout(() => {
                repeatBtn.classList.remove("animate-icon");
            }, 500); 

            if (icon) {
                icon.classList.remove("fa-repeat-1-alt");
                icon.classList.add("fa-repeat-alt");
            }
        }
        audio.loop = false;
    }
}

//================================
// SHUFFLE
//================================
function toggleShuffle() {
    isShuffling = !isShuffling;
    
    if (isShuffling) {
        if (shuffleBtn) {
            shuffleBtn.classList.add("active", "control-btn");
            
            shuffleBtn.classList.add("animate-icon");
            setTimeout(() => {
                shuffleBtn.classList.remove("animate-icon");
            }, 500); 
        }
        
        trackHistory = [currentTrack];
        if (modoActual === "local" && trackData.length > 1) {
            nextTrack();
        }
    } else {
        if (shuffleBtn) {
            shuffleBtn.classList.remove("active", "control-btn");

            shuffleBtn.classList.add("animate-icon");
            setTimeout(() => {
                shuffleBtn.classList.remove("animate-icon");
            }, 500); 
        }
        
        trackHistory = [];
    }
}

//================================
// BOTÓN MENÚ (Playlists / Historial)
//================================
if (menuBtn && !menuBtn.dataset.boundMenuOpen) {
  menuBtn.dataset.boundMenuOpen = "1";

  menuBtn.addEventListener("click", (e) => {
    // Evita que algún listener global cierre inmediatamente
    e.preventDefault();
    e.stopPropagation();

    const playlistModal = document.getElementById("playlist-modal");
    const historyModal  = document.getElementById("history-modal");
    const modalTracks   = document.getElementById("modal-playlist");

    // Cerrar cualquier otro modal visible antes de abrir
    if (historyModal && !historyModal.classList.contains("hidden")) {
      historyModal.classList.add("hidden");
    }
    if (modalTracks && !modalTracks.classList.contains("hidden")) {
      modalTracks.classList.add("hidden");
    }

    // MODO LOCAL → abrir playlists
    if (modoActual === "local") {
      if (!playlistModal) {
        console.warn("⚠️ No se encontró #playlist-modal");
        return;
      }

      // Garantiza visibilidad y eventos
      playlistModal.classList.remove("hidden");
      playlistModal.style.pointerEvents = "auto"; // por si hay capas con pointer-events: none
      playlistModal.style.zIndex = "9999";        // asegura estar sobre otras capas

      // Render del selector
      const selector = document.querySelector("#playlist-modal .track-list");
      if (!selector) {
        console.warn("⚠️ Falta .track-list dentro de #playlist-modal");
      } else {
        generarSelectorPlaylists();
      }

      console.log("📂 Modal Playlists abierto en modo local");
      return;
    }

    // MODO RADIO → abrir historial
    if (modoActual === "radio") {
      const historyList = document.getElementById("history-list");
      if (!historyModal || !historyList) {
        console.warn("⚠️ Falta #history-modal o #history-list");
        return;
      }

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
            <img src="${entry.cover || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png'}" alt="Carátula" class="track-cover" />
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
      historyModal.style.pointerEvents = "auto";
      historyModal.style.zIndex = "9999";

      console.log("📜 Modal Historial abierto en modo radio");
    }
  });
}


//================================
// BOTÓN MUSIC (Tracks)
//================================
(() => {
  const musicBtnRef = document.getElementById("music-btn");
  const modalTracks = document.getElementById("modal-playlist");

  if (musicBtnRef && !musicBtnRef.dataset.boundMusic) {
    musicBtnRef.dataset.boundMusic = "1";

    musicBtnRef.addEventListener("click", () => {
      if (modoActual !== "local") {
        console.log("ℹ️ Modal de tracks deshabilitado en modo radio");
        return;
      }
      if (!modalTracks) return;

      if (historyModal && !historyModal.classList.contains("hidden")) {
        historyModal.classList.add("hidden");
      }

      modalTracks.classList.remove("hidden");
      generarListaModal();
      console.log("🎵 Modal de Tracks abierto");
    });
  }
})();



//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LISTENERS DE BOTONES
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const playBtn    = document.getElementById("play-btn");
const powerBtn   = document.getElementById("power-btn");

if (nextBtn)    nextBtn.addEventListener("click", nextTrack);
if (prevBtn)    prevBtn.addEventListener("click", prevTrack);
if (shuffleBtn) shuffleBtn.addEventListener("click", toggleShuffle);
if (repeatBtn)  repeatBtn.addEventListener("click", toggleRepeat);

//================================
// PLAY/PAUSE
//================================
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

//================================
// POWER
//================================
if (powerBtn) {
  powerBtn.addEventListener("click", () => {
    const icon = powerBtn.querySelector("i");

    if (icon) {
      icon.classList.add("animate-icon");
      setTimeout(() => icon.classList.remove("animate-icon"), 500);
    }

    if (!gestureDetected) { gestureDetected = true; audio.muted = false; }

    // Alternar modos
    if (modoActual === "radio") activarModoLocal(); else activarModoRadio();

    actualizarMetaModo();

    // Toggle visual
    powerBtn.classList.toggle("active");

    // Debug: ver si se mantiene
    console.log("POWER active:", powerBtn.classList.contains("active"));
  });
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTROL DE VOLUMEN
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FECHA Y HORA DINÁMICAS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UBICACIÓN (Dinámica por Zona Horaria)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updateLocation() {
    const cityElement = document.getElementById("current-city");
    if (!cityElement) return;

    try {
        // 1. Obtener la zona horaria del sistema del usuario (ej: "America/Mexico_City")
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // 2. Extraer la ciudad/región. 
        // Usamos .pop() en lugar de [1] para manejar zonas de 3 partes como "America/Argentina/Buenos_Aires"
        const cityRaw = userTimeZone.split('/').pop(); 
        
        // 3. Reemplazar guiones bajos por espacios y capitalizar la primera letra de cada palabra
        const cityFormatted = cityRaw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        // 4. Aplicar al DOM
        cityElement.textContent = cityFormatted || "LOCAL";
        console.log("📍 Ubicación detectada (Zona Horaria): " + cityFormatted);
        
    } catch (e) {
        // Fallback seguro si el navegador es muy antiguo o falla la API Intl
        cityElement.textContent = "LOCAL";
        console.log("📍 Ubicación por defecto aplicada (Fallback).");
    }
}

// Iniciar inmediatamente cuando el DOM esté listo (sin retrasos artificiales)
document.addEventListener('DOMContentLoaded', updateLocation);


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EFECTOS VISUALES - (FUTURO ACTUALIZAR)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESBLOQUEO TRAS PRIMER GESTO HUMANO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//==================================
// Mostrar mensaje al hacer clic derecho
//==================================
document.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // evitar menú contextual
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  // Ocultar automáticamente después de unos segundos
  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);
});
