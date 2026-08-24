// ===============================
// 🎧 VARIABLES GLOBALES
// ===============================
let modoActual = "radio";
let gestureDetected = false;
let playlist = [];
let currentTrack = 0;
let radioIntervalId = null;
let zenoEventSource = null;
let iTunesAbortController = null;
let radioListeners = "--";
let ultimaPistaStreaming = "";
let isInitialized = false;

// Referencias al DOM
let audio, btnPlay, btnOnline, btnRwd, btnFwd, metadataSpan, infoSpan, discImg, turbineCoverImg;

// Rutas base
const BASE_URL = "https://santi-graphics.vercel.app/assets/";
const COVER_DEFAULT = `${BASE_URL}covers/Cover1.png`;
const PLAY_BTN = `${BASE_URL}img/play-btn-silver.png`;
const PAUSE_BTN = `${BASE_URL}img/pause-btn-silver.png`;

// ===============================
// 🛠️ FUNCIONES DE UTILIDAD
// ===============================
function actualizarCaratulas(nuevaRuta) {
  if (turbineCoverImg) turbineCoverImg.src = nuevaRuta;
}

function actualizarFechaHoraSimple() {
  const ahora = new Date();
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const fecha = ahora.toLocaleDateString('es-MX', opciones);
  const hora = ahora.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
  if (infoSpan) {
    infoSpan.textContent = `${fecha} ${hora} | 🎧 Radioescuchas: ${radioListeners}`;
  }
}

function limpiarMetadatosRadio(texto) {
  if (!texto || texto.includes("Stream") || texto.includes("Unknown") || texto.trim() === "") {
    return { artista: "En La Disco RG", titulo: "Transmisión en Vivo" };
  }
  let limpio = texto.replace(/WWW\..*\..*|http:\/\/.*|\[.*\]|<.*>|128kbps|64kbps|mp3|AUTODJ/gi, "").trim();
  const separadores = [" - ", " – ", " — ", " / "];
  let art = "En La Disco RG", tit = limpio;
  
  for (const sep of separadores) {
    if (limpio.includes(sep)) {
      const parts = limpio.split(sep);
      art = parts[0].trim();
      tit = parts.slice(1).join(sep).trim();
      break;
    }
  }
  return { artista: art, titulo: tit };
}

// ===============================
// 📻 LÓGICA DE RADIO (BLINDADA PARA XAT - Estilo R25)
// ===============================
async function actualizarMetadatosStreaming() {
  if (modoActual !== "radio") return;
  
  // Usamos el endpoint de Zeno/SurferNetwork pero forzado a través del proxy de allorigins
  // Esto evita que el CSP de Xat bloquee la conexión directa a api.zeno.fm o stream-179
  const urlStats = `https://stream-179.surfernetwork.com/xk7mncypfa0uv?json=1&t=${Date.now()}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlStats)}`;

  try {
    const response = await fetch(proxyUrl);
    const proxyData = await response.json();
    
    // CLAVE DE R25: Parsear el contenido anidado que devuelve el proxy
    const data = JSON.parse(proxyData.contents);

    // 1. Actualizar contador de oyentes (si el JSON lo trae, si no, se mantiene el anterior)
    if (data.listeners !== undefined) {
      radioListeners = data.listeners;
      actualizarFechaHoraSimple();
    }

    // 2. Obtener el título (Zeno suele usar 'streamTitle' o 'title')
    const rawTitle = data.streamTitle || data.title || data.songtitle || "";
    
    if (rawTitle === ultimaPistaStreaming && rawTitle !== "") return; // Evita spam de actualizaciones
    
    ultimaPistaStreaming = rawTitle;
    
    // 3. Limpiar y separar Artista - Título
    let { artista: fArtist, titulo: fTitle } = limpiarMetadatosRadio(rawTitle);

    if (metadataSpan) {
      metadataSpan.textContent = `En La Disco RG — ${fTitle} — ${fArtist}`;
    }

    // 4. Buscar carátula en segundo plano (no bloquea la UI)
    buscarCaratulaReal(fArtist, fTitle);
    
  } catch (e) { 
    console.warn("⚠️ Error Metadatos (Reintentando en 8s):", e);
    // Fallback visual para que no se vea roto si el proxy falla momentáneamente
    if (metadataSpan && metadataSpan.textContent.includes("Conectando")) {
      metadataSpan.textContent = "En La Disco RG — Transmisión en Vivo 24/7";
    }
  }
}

function gestionarCicloRadio(activar) {
  if (radioIntervalId) clearInterval(radioIntervalId);
  if (activar) {
    ultimaPistaStreaming = ""; // Forzar primera lectura
    actualizarMetadatosStreaming(); // Llamada inmediata
    radioIntervalId = setInterval(actualizarMetadatosStreaming, 8000); // 8 segundos (el punto dulce de R25)
  }
}

function cancelarItunesFetch() {
  if (iTunesAbortController) {
    iTunesAbortController.abort();
    iTunesAbortController = null;
  }
}

function detenerActualizacionRadio() {
  if (zenoEventSource) {
    zenoEventSource.close();
    zenoEventSource = null;
  }
  if (radioIntervalId) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }
}

// ===============================
// 📻 LÓGICA DE RADIO (SSE ZENO FM - EXACTO COMO FUNCIONA)
// ===============================
function iniciarMetadatosZeno() {
  detenerActualizacionRadio();

  const zenoUrl = "https://api.zeno.fm/mounts/metadata/subscribe/bmv9fcypfa0uv";
  
  try {
    zenoEventSource = new EventSource(zenoUrl);

    zenoEventSource.onmessage = function(event) {
      if (modoActual !== "radio") return;
      
      try {
        // Parsear el JSON que viene en el "data:" del SSE
        const data = JSON.parse(event.data);
        
        if (data && data.streamTitle) {
          let textoObtenido = data.streamTitle;
          
          // Evitar actualizaciones si es la misma pista
          if (textoObtenido === ultimaPistaStreaming && textoObtenido !== "") return;
          ultimaPistaStreaming = textoObtenido;

          let artist = "En La Disco RG";
          let title = textoObtenido;

          // Separar artista y título si viene con " - "
          if (textoObtenido.includes(" - ")) {
            const partes = textoObtenido.split(" - ");
            artist = partes[0].trim();
            title = partes.slice(1).join(" - ").trim();
          }

          // Actualizar marquesina
          if (metadataSpan) {
            metadataSpan.textContent = `En La Disco RG — ${title} — ${artist}`;
          }

          // Buscar carátula en segundo plano
          buscarCaratulaReal(artist, title);
        }
      } catch (e) {
        // Ignorar tramas de "ping" o datos vacíos que no son JSON
      }
    };

    zenoEventSource.onerror = function() {
      console.warn("⚠️ Conexión SSE cerrada. El navegador reintentará automáticamente.");
      if (metadataSpan && metadataSpan.textContent.includes("Conectando")) {
        metadataSpan.textContent = "En La Disco RG — Transmisión en Vivo 24/7";
      }
    };

  } catch (error) {
    console.error("❌ No se pudo inicializar EventSource:", error);
  }
}

function activarModoRadio() {
  modoActual = "radio";
  detenerActualizacionRadio();
  cancelarItunesFetch();

  if (metadataSpan) metadataSpan.textContent = "En La Disco RG — Conectando...";
  actualizarCaratulas(COVER_DEFAULT);

  if (audio) {
    audio.pause();
    audio.src = "https://stream-179.surfernetwork.com/xk7mncypfa0uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJ4azdtbmN5cGZhMHV2IiwiaG9zdCI6InN0cmVhbS0xNzkuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiJFWWhhaUdHblR1cXM1T0ZsQVJkYklnIiwiaWF0IjoxNzg3NTE0MzczLCJleHAiOjE3ODc1MTQ0MzN9.jD9Ywk3MTar7pVggqmh-z8usYfm1Ka-QIqg5WkhM4qI";
    audio.load();
    audio.muted = !gestureDetected;
    if (gestureDetected) {
      audio.play().catch(err => console.warn("🔒 Error al iniciar Radio:", err));
    }
  }

  // Iniciar la conexión SSE real
  iniciarMetadatosZeno();
}

// ===============================
// 🎶 LÓGICA DE MODO LOCAL
// ===============================
function activarModoLocal() {
  modoActual = "local";
  detenerActualizacionRadio();
  cancelarItunesFetch();

  if (metadataSpan) metadataSpan.textContent = "🎶 Cargando Playlist Spotifly...";
  actualizarCaratulas(COVER_DEFAULT);
  
  if (audio) audio.pause();
  if (btnPlay) {
    const img = btnPlay.querySelector('img');
    if (img) img.src = PLAY_BTN;
  }
  if (discImg) discImg.style.animationPlayState = "paused";

  fetch("https://radio-tekileros.vercel.app/Spotifly.json")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (modoActual !== "local") return;
      
      playlist = data.spotifly || []; 
      currentTrack = 0;
      
      if (playlist.length > 0) {
        if (metadataSpan) metadataSpan.textContent = `🎶 Playlist Spotifly activa (${playlist.length} tracks)`;
        cargarTrack(currentTrack);
      } else {
        if (metadataSpan) metadataSpan.textContent = "⚠️ No hay pistas en la sección 'spotifly'";
      }
    })
    .catch(err => {
      if (modoActual !== "local") return;
      console.error("❌ Error al cargar playlist local:", err);
      if (metadataSpan) metadataSpan.textContent = "⚠️ Error de red. Verifica tu conexión.";
    });
}

function cargarTrack(index) {
  if (modoActual !== "local" || !playlist[index] || !audio) return;
  const track = playlist[index];

  const caratulaTrack = track.caratula || COVER_DEFAULT;
  actualizarCaratulas(caratulaTrack);
  
  audio.src = track.enlace;
  audio.load();

  if (metadataSpan) {
    metadataSpan.textContent = `[${index + 1}] ${track.nombre} — ${track.artista} - ${track.genero || 'Sin género'} - ${track.duracion || '0:00'}`;
  }
  actualizarFechaHoraSimple();

  if (gestureDetected) {
    audio.play().catch(err => console.warn("⚠️ Error al reproducir pista local:", err));
  }
}

// ===============================
// 🚀 INICIALIZACIÓN Y EVENTOS
// ===============================
function inicializarReproductor() {
  if (isInitialized) return;
  isInitialized = true;

  audio = document.getElementById("player");
  btnPlay = document.getElementById("playPause");
  btnOnline = document.getElementById("plus");
  btnRwd = document.getElementById("btn-rwd");
  btnFwd = document.getElementById("btn-fwd");
  metadataSpan = document.querySelector(".metadata-marquee span");
  infoSpan = document.querySelector(".info-marquee span");
  discImg = document.querySelector(".disc-img");
  turbineCoverImg = document.querySelector(".turbine-cover-img");

  function desbloqueoAutoplay() {
    if (audio && audio.muted) audio.muted = false;
    if (audio && audio.paused && audio.src && modoActual === "radio") {
      audio.play().then(() => {
        console.log("✅ Audio desbloqueado por interacción del usuario");
      }).catch(() => {});
    }
  }
  ['click', 'touchstart', 'keydown'].forEach(evento => {
    document.addEventListener(evento, desbloqueoAutoplay, { once: true });
  });

  if (btnPlay && audio) {
    btnPlay.addEventListener("click", () => {
      if (!audio.src) return;

      if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;
      }

      if (audio.paused || audio.ended) {
        audio.play().then(() => {
          const img = btnPlay.querySelector('img');
          if (img) img.src = PAUSE_BTN;
          if (discImg) discImg.style.animationPlayState = "running";
        }).catch(err => console.warn("⚠️ Error al reproducir:", err));
      } else {
        audio.pause();
        const img = btnPlay.querySelector('img');
        if (img) img.src = PLAY_BTN;
        if (discImg) discImg.style.animationPlayState = "paused";
      }
    });
  }

  if (btnRwd) {
    btnRwd.addEventListener("click", () => {
      if (modoActual === "local") {
        currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
        cargarTrack(currentTrack);
      }
    });
  }

  if (btnFwd) {
    btnFwd.addEventListener("click", () => {
      if (modoActual === "local") {
        currentTrack = (currentTrack + 1) % playlist.length;
        cargarTrack(currentTrack);
      }
    });
  }

  if (audio) {
    audio.addEventListener('playing', () => {
      if (btnPlay) {
        const img = btnPlay.querySelector('img');
        if (img) img.src = PAUSE_BTN;
      }
      if (discImg) discImg.style.animationPlayState = "running";
    });
    
    audio.addEventListener('pause', () => {
      if (btnPlay) {
        const img = btnPlay.querySelector('img');
        if (img) img.src = PLAY_BTN;
      }
      if (discImg) discImg.style.animationPlayState = "paused";
    });

    audio.addEventListener("ended", () => {
      if (modoActual === "local") {
        currentTrack = (currentTrack + 1) % playlist.length;
        cargarTrack(currentTrack);
      }
    });
  }

  if (btnOnline) {
    btnOnline.addEventListener("click", () => {
      if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;
      }
      if (modoActual === "radio") {
        activarModoLocal();
      } else {
        activarModoRadio();
      }
    });
  }

  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const msg = document.getElementById("custom-message");
    if (msg) {
      msg.classList.add("show");
      setTimeout(() => msg.classList.remove("show"), 2000);
    }
  });

  setInterval(actualizarFechaHoraSimple, 60000);
  actualizarFechaHoraSimple();

  activarModoRadio();
  console.log("✅ Reproductor 54 inicializado correctamente.");
}

document.addEventListener("DOMContentLoaded", inicializarReproductor);
window.addEventListener("repro-ready", inicializarReproductor);

// ===============================
// 💧 ACTIVACIÓN DE EFECTO AGUA
// ===============================
$(document).ready(function() {
  if (typeof $.fn.ripples === 'function') {
    console.log("💧 Inicializando Ripples en main-container...");
    $('.main-container').ripples({
      resolution: 512,
      dropRadius: 20,
      perturbance: 0.04
    });
  }
});
