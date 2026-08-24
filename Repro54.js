// ===============================
// 🎧 VARIABLES GLOBALES
// ===============================
let modoActual = "radio";
let gestureDetected = false;
let playlist = [];
let currentTrack = 0;
let radioIntervalId = null;
let zenoEventSource = null;
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
  if (turbineCoverImg) {
    turbineCoverImg.src = nuevaRuta;
  }
}

function actualizarFechaHoraSimple() {
  try {
    const ahora = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const fecha = ahora.toLocaleDateString('es-MX', opciones);
    const hora = ahora.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
    if (infoSpan) {
      infoSpan.textContent = `${fecha} ${hora} | 🎧 Radioescuchas: ${radioListeners}`;
    }
  } catch (e) {
    console.error("Error en fecha/hora:", e);
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

async function buscarCaratulaReal(artistaQuery, tituloQuery) {
  if (!artistaQuery || artistaQuery === "En La Disco RG" || artistaQuery === "Transmisión en Vivo") {
    actualizarCaratulas(COVER_DEFAULT);
    return;
  }
  
  const termino = `${artistaQuery} ${tituloQuery}`.toLowerCase().replace(/\(.*?\)|\[.*?\]|feat\.|ft\./g, " ").trim();
  const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(termino)}&media=music&limit=1`;
  
  try {
    const res = await fetch(itunesUrl);
    const json = await res.json();
    if (json.results && json.results.length > 0) {
      actualizarCaratulas(json.results[0].artworkUrl100.replace("100x100bb", "400x400bb"));
    } else {
      actualizarCaratulas(COVER_DEFAULT);
    }
  } catch (e) { 
    actualizarCaratulas(COVER_DEFAULT); 
  }
}

function detenerActualizacionRadio() {
  if (zenoEventSource) {
    zenoEventSource.close();
    zenoEventSource = null;
  }
}

// ===============================
// 📻 LÓGICA DE RADIO (SSE ZENO FM)
// ===============================
function iniciarMetadatosZeno() {
  detenerActualizacionRadio();

  const zenoUrl = "https://api.zeno.fm/mounts/metadata/subscribe/bmv9fcypfa0uv";
  
  try {
    zenoEventSource = new EventSource(zenoUrl);

    zenoEventSource.onmessage = function(event) {
      if (modoActual !== "radio") return;
      
      try {
        const data = JSON.parse(event.data);
        if (data && data.streamTitle) {
          let textoObtenido = data.streamTitle;
          
          if (textoObtenido === ultimaPistaStreaming && textoObtenido !== "") return;
          ultimaPistaStreaming = textoObtenido;

          let artist = "En La Disco RG";
          let title = textoObtenido;

          if (textoObtenido.includes(" - ")) {
            const partes = textoObtenido.split(" - ");
            artist = partes[0].trim();
            title = partes.slice(1).join(" - ").trim();
          }

          if (metadataSpan) {
            metadataSpan.textContent = `En La Disco RG — ${title} — ${artist}`;
          }

          buscarCaratulaReal(artist, title);
        }
      } catch (e) {
        // Ignorar pings
      }
    };

    zenoEventSource.onerror = function() {
      // El navegador reintenta automáticamente.
    };

  } catch (error) {
    console.error("❌ No se pudo inicializar EventSource:", error);
  }
}

function activarModoRadio() {
  modoActual = "radio";
  detenerActualizacionRadio();

  if (metadataSpan) metadataSpan.textContent = "En La Disco RG — Conectando...";
  actualizarCaratulas(COVER_DEFAULT);

  if (audio) {
    audio.pause();
    audio.src = "https://stream-179.surfernetwork.com/xk7mncypfa0uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJ4azdtbmN5cGZhMHV2IiwiaG9zdCI6InN0cmVhbS0xNzkuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiJFWWhhaUdHblR1cXM1T0ZsQVJkYklnIiwiaWF0IjoxNzg3NTE0MzczLCJleHAiOjE3ODc1MTQ0MzN9.jD9Ywk3MTar7pVggqmh-z8usYfm1Ka-QIqg5WkhM4qI";
    audio.load();
    audio.muted = !gestureDetected;
    
    if (gestureDetected) {
      audio.play().then(() => {
        // CORRECCIÓN: Actualización explícita de la UI al reproducir
        if (btnPlay) btnPlay.querySelector('img').src = PAUSE_BTN;
        if (discImg) discImg.style.animationPlayState = "running";
      }).catch(() => {
        if (btnPlay) btnPlay.querySelector('img').src = PLAY_BTN;
        if (discImg) discImg.style.animationPlayState = "paused";
      });
    } else {
      // CORRECCIÓN: Asegurar estado de pausa visual si no hay gesto
      if (btnPlay) btnPlay.querySelector('img').src = PLAY_BTN;
      if (discImg) discImg.style.animationPlayState = "paused";
    }
  }

  iniciarMetadatosZeno();
}

// ===============================
// 🎶 LÓGICA DE MODO LOCAL
// ===============================
function activarModoLocal() {
  modoActual = "local";
  detenerActualizacionRadio();

  if (metadataSpan) metadataSpan.textContent = "🎶 Cargando Playlist...";
  actualizarCaratulas(COVER_DEFAULT);
  
  if (audio) audio.pause();
  if (btnPlay) {
    const img = btnPlay.querySelector('img');
    if (img) img.src = PLAY_BTN;
  }
  if (discImg) discImg.style.animationPlayState = "paused";

  fetch("https://radio-tekileros.vercel.app/Spotifly.json")
    .then(res => res.json())
    .then(data => {
      if (modoActual !== "local") return;
      playlist = data.spotifly || []; 
      currentTrack = 0;
      if (playlist.length > 0) {
        if (metadataSpan) metadataSpan.textContent = `🎶 Playlist activa (${playlist.length} tracks)`;
        cargarTrack(currentTrack);
      }
    })
    .catch(err => {
      console.error("Error playlist:", err);
      if (metadataSpan) metadataSpan.textContent = "⚠️ Error de red";
    });
}

function cargarTrack(index) {
  if (modoActual !== "local" || !playlist[index] || !audio) return;
  const track = playlist[index];

  actualizarCaratulas(track.caratula || COVER_DEFAULT);
  audio.src = track.enlace;
  audio.load();

  if (metadataSpan) {
    metadataSpan.textContent = `[${index + 1}] ${track.nombre} — ${track.artista}`;
  }
  actualizarFechaHoraSimple();

  if (gestureDetected) {
    audio.play().then(() => {
      // CORRECCIÓN: Actualización explícita de la UI al reproducir
      if (btnPlay) btnPlay.querySelector('img').src = PAUSE_BTN;
      if (discImg) discImg.style.animationPlayState = "running";
    }).catch(() => {
      if (btnPlay) btnPlay.querySelector('img').src = PLAY_BTN;
      if (discImg) discImg.style.animationPlayState = "paused";
    });
  } else {
    if (btnPlay) btnPlay.querySelector('img').src = PLAY_BTN;
    if (discImg) discImg.style.animationPlayState = "paused";
  }
}

// ===============================
// 🚀 INICIALIZACIÓN
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

  actualizarFechaHoraSimple();
  setInterval(actualizarFechaHoraSimple, 60000);

  function desbloqueoAutoplay() {
    if (audio && audio.muted) audio.muted = false;
    if (audio && audio.paused && audio.src && modoActual === "radio") {
      audio.play().then(() => {
        if (btnPlay) btnPlay.querySelector('img').src = PAUSE_BTN;
        if (discImg) discImg.style.animationPlayState = "running";
      }).catch(() => {});
    }
  }
  ['click', 'touchstart', 'keydown'].forEach(evento => {
    document.addEventListener(evento, desbloqueoAutoplay, { once: true });
  });

  if (btnPlay && audio) {
    btnPlay.addEventListener("click", () => {
      if (!gestureDetected) { gestureDetected = true; audio.muted = false; }
      if (audio.paused || audio.ended) {
        audio.play().then(() => {
          btnPlay.querySelector('img').src = PAUSE_BTN;
          if (discImg) discImg.style.animationPlayState = "running";
        }).catch(() => {});
      } else {
        audio.pause();
        btnPlay.querySelector('img').src = PLAY_BTN;
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

  if (btnOnline) {
    btnOnline.addEventListener("click", () => {
      if (!gestureDetected) { gestureDetected = true; audio.muted = false; }
      modoActual === "radio" ? activarModoLocal() : activarModoRadio();
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

  activarModoRadio();
  console.log("✅ Reproductor 54 inicializado (Bug de UI corregido).");
}

document.addEventListener("DOMContentLoaded", inicializarReproductor);
window.addEventListener("repro-ready", inicializarReproductor);

// Ripples
$(document).ready(function() {
  if (typeof $.fn.ripples === 'function') {
    $('.main-container').ripples({ resolution: 512, dropRadius: 20, perturbance: 0.04 });
  }
});
