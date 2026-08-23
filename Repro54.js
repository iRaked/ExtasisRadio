// ===============================
// 🎧 INICIALIZACIÓN GLOBAL
// ===============================
let modoActual = "radio";
let gestureDetected = false;
let playlist = [];
let currentTrack = 0;
let radioIntervalId = null;
let iTunesAbortController = null;

const audio = document.getElementById("player");

// ===============================
// 🎯 ELEMENTOS DEL DOM
// ===============================
const btnPlay = document.getElementById("playPause");
const btnOnline = document.getElementById("plus");
const btnRwd = document.getElementById("btn-rwd");
const btnFwd = document.getElementById("btn-fwd");
const metadataSpan = document.querySelector(".metadata-marquee span");
const infoSpan = document.querySelector(".info-marquee span");
const discImg = document.querySelector(".disc-img");
const turbineCoverImg = document.querySelector(".turbine-cover-img");

// Rutas base actualizadas
const BASE_URL = "https://santi-graphics.vercel.app/assets/";
const COVER_DEFAULT = `${BASE_URL}covers/Cover1.png`;
const PLAY_BTN = `${BASE_URL}img/play-btn-silver.png`;
const PAUSE_BTN = `${BASE_URL}img/pause-btn-silver.png`;

// ===============================
// 🕓 FORMATO DE FECHA, HORA Y RADIOESCUCHAS
// ===============================
let radioListeners = "--";

function actualizarFechaHoraSimple() {
  const ahora = new Date();
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const fecha = ahora.toLocaleDateString('es-MX', opciones);
  const hora = ahora.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
  infoSpan.textContent = `${fecha} ${hora} | 🎧 Radioescuchas: ${radioListeners}`;
}
setInterval(actualizarFechaHoraSimple, 60000);
actualizarFechaHoraSimple();

// ===============================
// ▶️ BOTÓN PLAY/PAUSE UNIVERSAL
// ===============================
if (btnPlay) {
  btnPlay.addEventListener("click", () => {
    if (!audio.src) {
      console.warn("⚠️ No hay fuente de audio definida.");
      return;
    }

    if (!gestureDetected) {
      gestureDetected = true;
      audio.muted = false;
    }

    if (audio.paused || audio.ended) {
      audio.play().then(() => {
        btnPlay.querySelector('img').src = PAUSE_BTN;
        if (discImg) discImg.style.animationPlayState = "running";
      }).catch(err => {
        console.warn("⚠️ Error al reproducir:", err);
      });
    } else {
      audio.pause();
      btnPlay.querySelector('img').src = PLAY_BTN;
      if (discImg) discImg.style.animationPlayState = "paused";
    }
  });
}

// ===============================
// 🎛️ BOTONES RWD & FWD
// ===============================
if (btnRwd) {
  btnRwd.addEventListener("click", () => {
    if (modoActual === "local") {
      currentTrack--;
      if (currentTrack < 0) currentTrack = playlist.length - 1;
      cargarTrack(currentTrack);
    } else {
      console.log("⏪ Retroceso no disponible en modo radio");
    }
  });
}

if (btnFwd) {
  btnFwd.addEventListener("click", () => {
    if (modoActual === "local") {
      currentTrack++;
      if (currentTrack >= playlist.length) currentTrack = 0;
      cargarTrack(currentTrack);
    } else {
      console.log("⏩ Avance no disponible en modo radio");
    }
  });
}

// ===============================
// ▶️ SINCRONIZACIÓN VISUAL
// ===============================
audio.addEventListener('playing', () => {
  btnPlay.querySelector('img').src = PAUSE_BTN;
  if (discImg) discImg.style.animationPlayState = "running";
});
audio.addEventListener('pause', () => {
  btnPlay.querySelector('img').src = PLAY_BTN;
  if (discImg) discImg.style.animationPlayState = "paused";
});

// ===============================
// 🖱️ GESTO HUMANO
// ===============================
document.addEventListener("click", () => {
  if (!gestureDetected) {
    gestureDetected = true;
    audio.muted = false;
    if (audio.src && audio.paused) {
      audio.play().catch(err => console.warn("⚠️ Error al iniciar tras gesto:", err));
    }
  }
}, { once: true });

// ===============================
// 🧹 LIMPIEZAS
// ===============================
function detenerActualizacionRadio() {
  if (radioIntervalId) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }
}
function cancelarItunesFetch() {
  if (iTunesAbortController) {
    iTunesAbortController.abort();
    iTunesAbortController = null;
  }
}

// ===============================
// 📻 ACTIVAR MODO RADIO (SURFERNETWORK)
// ===============================
function activarModoRadio() {
  modoActual = "radio";
  detenerActualizacionRadio();
  cancelarItunesFetch();

  metadataSpan.textContent = "En La Disco RG — Conectando con SurferNetwork...";
  actualizarCaratulas(COVER_DEFAULT);

  audio.pause();
  audio.src = "https://stream-179.surfernetwork.com/xk7mncypfa0uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJ4azdtbmN5cGZhMHV2IiwiaG9zdCI6InN0cmVhbS0xNzkuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiJFWWhhaUdHblR1cXM1T0ZsQVJkYklnIiwiaWF0IjoxNzg3NTE0MzczLCJleHAiOjE3ODc1MTQ0MzN9.jD9Ywk3MTar7pVggqmh-z8usYfm1Ka-QIqg5WkhM4qI";
  audio.load();

  audio.muted = !gestureDetected;
  if (gestureDetected) {
    audio.play().catch(err => console.warn("🔒 Error al iniciar Radio:", err));
  }

  iniciarActualizacionRadio();
}

// ===============================
// 📻 ACTUALIZACIÓN DE METADATOS (Modo Diagnóstico)
// ===============================
let metadataAbortController = null;

function iniciarActualizacionRadio() {
  detenerActualizacionRadio();

  async function actualizarDesdeServidor() {
    if (modoActual !== "radio") return;

    if (metadataAbortController) {
      metadataAbortController.abort();
    }
    metadataAbortController = new AbortController();

    // Usamos el proxy de Vercel que configuramos en /api/metadata
    const urlPrueba = "/api/metadata";
    
    try {
      // Damos un margen de 10 segundos antes de abortar por timeout
      const timeoutId = setTimeout(() => metadataAbortController.abort(), 10000);

      const response = await fetch(urlPrueba, {
        method: 'GET',
        signal: metadataAbortController.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      console.log("✅ DATA CRUDITA RECIBIDA DEL PROXY:", data);
      
      // 👉 PRUEBA ESTO: Revisa en la consola de tu navegador (F12) 
      // qué estructura tiene 'data' para desplegarla aquí:
      if (data) {
        // Asignación genérica provisional para ver algo en pantalla de inmediato
        const textoObtenido = data.songtitle || data.title || data.currentSong || JSON.stringify(data);
        metadataSpan.textContent = `En La Disco RG — Reproduciendo: ${textoObtenido}`;
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn("⏱️ La petición tardó demasiado o fue abortada.");
      } else {
        console.warn("⚠️ Error al obtener metadatos:", error.message);
        metadataSpan.textContent = "En La Disco RG — En línea (Sin metadatos remotos)";
      }
    }
  }

  actualizarDesdeServidor();
  radioIntervalId = setInterval(actualizarDesdeServidor, 15000);
}

// ===============================
// 🖼️ CARÁTULA DINÁMICA EN CAPA LATERAL
// ===============================
function actualizarCaratulas(nuevaRuta) {
  if (turbineCoverImg) {
    turbineCoverImg.src = nuevaRuta;
  }
}

function obtenerCaratulaDesdeiTunes(artist, title) {
  if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
    if (modoActual !== "radio") return;
    actualizarCaratulas(COVER_DEFAULT);
    return;
  }

  cancelarItunesFetch();
  iTunesAbortController = new AbortController();

  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: 'jsonp',
    url,
    success: function(data) {
      if (modoActual !== "radio") return;
      let cover = COVER_DEFAULT;
      if (data.results && data.results.length > 0) {
        cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
      }
      actualizarCaratulas(cover);
    },
    error: function() {
      if (modoActual !== "radio") return;
      actualizarCaratulas(COVER_DEFAULT);
    }
  });
}

// ===============================
// 🎶 ACTIVAR MODO LOCAL (CORREGIDO)
// ===============================
function activarModoLocal() {
  modoActual = "local";
  detenerActualizacionRadio();
  cancelarItunesFetch();

  metadataSpan.textContent = "🎶 Cargando Playlist Spotifly...";
  actualizarCaratulas(COVER_DEFAULT);
  audio.pause();
  
  // Resetear UI a estado "Pausado"
  if (btnPlay) btnPlay.querySelector('img').src = PLAY_BTN;
  if (discImg) discImg.style.animationPlayState = "paused";

  // CORRECCIÓN: Usar la URL directa sin concatenar con BASE_URL
  fetch("https://radio-tekileros.vercel.app/Spotifly.json")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (modoActual !== "local") return;
      
      // Buscamos el arreglo "spotifly" en el JSON
      playlist = data.spotifly || []; 
      currentTrack = 0;
      
      if (playlist.length > 0) {
        metadataSpan.textContent = `🎶 Playlist Spotifly activa (${playlist.length} tracks)`;
        cargarTrack(currentTrack);
      } else {
        metadataSpan.textContent = "⚠️ No hay pistas en la sección 'spotifly'";
      }
    })
    .catch(err => {
      if (modoActual !== "local") return;
      console.error("❌ Error al cargar playlist local:", err);
      metadataSpan.textContent = "⚠️ Error de red. Verifica tu conexión o usa Live Server.";
    });
}

// ===============================
// 🎧 CARGAR TRACK LOCAL
// ===============================
function cargarTrack(index) {
  if (modoActual !== "local") return;
  const track = playlist[index];
  if (!track) return;

  const caratulaTrack = track.caratula || COVER_DEFAULT;
  actualizarCaratulas(caratulaTrack);
  
  audio.src = track.enlace;
  audio.load();

  metadataSpan.textContent = `[${index + 1}] ${track.nombre} — ${track.artista} - ${track.genero || 'Sin género'} - ${track.duracion || '0:00'}`;
  actualizarFechaHoraSimple();

  if (gestureDetected) {
    audio.play().catch(err => console.warn("⚠️ Error al reproducir pista local:", err));
  }
}

// ===============================
// 🔁 REPRODUCCIÓN CONTINUA LOCAL
// ===============================
audio.addEventListener("ended", () => {
  if (modoActual === "local") {
    currentTrack++;
    if (currentTrack < playlist.length) {
      cargarTrack(currentTrack);
    } else {
      metadataSpan.textContent = "🎶 Playlist finalizada";
    }
  }
});

// ===============================
// 🎛️ BOTÓN PLUS (ALTERNANCIA)
// ===============================
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

// ===============================
// 🚀 INICIALIZACIÓN
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  activarModoRadio();
});

// Clic derecho personalizado
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);
});

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
