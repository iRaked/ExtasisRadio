// ===============================
// 🎨 CONFIGURACIÓN DE ASSETS (EDITAR AQUÍ PARA CAMBIAR TODAS LAS IMÁGENES)
// ===============================
const ASSETS = {
  // Carátula por defecto
  coverDefault: "https://santi-graphics.vercel.app/assets/img/DiscoRG.jpg",
  
  // Botones de control
  playBtn: "https://santi-graphics.vercel.app/assets/img/play-btn-silver.png",
  pauseBtn: "https://santi-graphics.vercel.app/assets/img/pause-btn-silver.png",
  plusBtn: "https://santi-graphics.vercel.app/assets/img/plus-btn-silver.png",
  
  // Elementos decorativos y de fondo
  discVinyl: "https://santi-graphics.vercel.app/assets/img/Disc-Power.png",
  fussionBase: "https://santi-graphics.vercel.app/assets/img/Fussion3.png",
  buttonDecorative: "https://santi-graphics.vercel.app/assets/img/Button-Silver.png",
  bgClear: "https://santi-graphics.vercel.app/assets/bg/Clear2.png"
};

// ===============================
// 🎧 VARIABLES GLOBALES Y ESTADOS
// ===============================
let modoActual = "radio";
let gestureDetected = false;
let playlist = [];
let currentTrack = 0;
let zenoEventSource = null;
let ultimaPistaStreaming = "";

// Referencias al DOM
let audio, btnPlay, btnOnline, btnRwd, btnFwd, metadataSpan, infoSpan, discImg, turbineCoverImg;

// ===============================
// 🛠️ FUNCIONES AUXILIARES
// ===============================
// Esta función aplica las rutas del objeto ASSETS al HTML automáticamente al cargar
function aplicarAssetsAlDOM() {
  const setSrc = (selector, url) => {
    const el = document.querySelector(selector);
    if (el) el.src = url;
  };

  setSrc('.disc-img', ASSETS.discVinyl);
  setSrc('.cover-art', ASSETS.coverDefault);
  setSrc('.stage-fussion', ASSETS.fussionBase);
  setSrc('#playPause img', ASSETS.playBtn);
  setSrc('#plus img', ASSETS.plusBtn);
  setSrc('.turbine-cover-img', ASSETS.coverDefault);
  setSrc('.decorative-overlay', ASSETS.buttonDecorative);
}

function actualizarCaratulas(nuevaRuta) {
  if (turbineCoverImg) {
    // Si no se pasa ruta, usa la por defecto
    turbineCoverImg.src = nuevaRuta || ASSETS.coverDefault;
  }
}

function actualizarFechaHoraSimple() {
  try {
    const ahora = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const fecha = ahora.toLocaleDateString('es-MX', opciones);
    const hora = ahora.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
    if (infoSpan) {
      infoSpan.textContent = `${fecha} • ${hora}`;
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

// ==========================================
// 🖼️ CARÁTULAS: JSONP
// ==========================================
function obtenerCaratulaDesdeiTunes(artist, title) {
  if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
    actualizarCaratulas(ASSETS.coverDefault);
    return;
  }
  
  const formattedArtist = artist.toLowerCase().trim().replace(/\s*&\s*.*|\s*feat\.?.*|\s*ft\..*/gi, "");
  const formattedTitle = title.toLowerCase().trim().replace(/\s*&\s*/gi, " and ").replace(/\s*\(.*\)/gi, "");
  const query = encodeURIComponent(`${formattedArtist} ${formattedTitle}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: 'jsonp',
    url: url,
    success: function(data) {
      let cover = ASSETS.coverDefault; // Fallback a Default Cover
      if (data.results && data.results.length > 0) {
        cover = data.results[0].artworkUrl100.replace('100x100bb', '400x400bb');
      }
      actualizarCaratulas(cover);
    },
    error: function() {
      actualizarCaratulas(ASSETS.coverDefault); // Fallback a cover en caso de error
    }
  });
}

function detenerActualizacionRadio() {
  if (zenoEventSource) {
    zenoEventSource.close();
    zenoEventSource = null;
  }
}

// ==========================================
// 📻 MODO RADIO: EVENTSOURCE DIRECTO
// ==========================================
function iniciarActualizacionRadio() {
  detenerActualizacionRadio();

  const radioUrl = "https://api.zeno.fm/mounts/metadata/subscribe/bmv9fcypfa0uv";
  zenoEventSource = new EventSource(radioUrl);

  zenoEventSource.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      const cleanedTitle = data.streamTitle ? data.streamTitle.trim() : "";

      if (!cleanedTitle || cleanedTitle === ultimaPistaStreaming) {
        return;
      }
      
      ultimaPistaStreaming = cleanedTitle;
      
      const songtitleSplit = cleanedTitle.split(/ - | – /);
      let artist = "En La Disco RG";
      let title = cleanedTitle; 

      if (songtitleSplit.length >= 2) {
        artist = songtitleSplit[0].trim();
        title = songtitleSplit.slice(1).join(" - ").trim(); 
      }
      
      if (metadataSpan) {
        metadataSpan.textContent = `En La Disco RG — ${title} — ${artist}`;
      }
      
      obtenerCaratulaDesdeiTunes(artist, title);

    } catch (error) {
      // Ignorar tramas de "ping" o datos vacíos
    }
  });

  zenoEventSource.addEventListener("error", (err) => {
    console.warn("⚠️ Conexión SSE interrumpida, el navegador reintentará automáticamente...");
  });
}

function activarModoRadio() {
  modoActual = "radio";
  detenerActualizacionRadio();
  
  if (metadataSpan) metadataSpan.textContent = "En La Disco RG — Conectando...";
  actualizarCaratulas(ASSETS.coverDefault); // Default Cover
  
  if (audio) {
    audio.pause();
    audio.src = "https://stream-179.surfernetwork.com/xk7mncypfa0uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJ4azdtbmN5cGZhMHV2IiwiaG9zdCI6InN0cmVhbS0xNzkuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiJFWWhhaUdHblR1cXM1T0ZsQVJkYklnIiwiaWF0IjoxNzg3NTE0MzczLCJleHAiOjE3ODc1MTQ0MzN9.jD9Ywk3MTar7pVggqmh-z8usYfm1Ka-QIqg5WkhM4qI";
    audio.load();

    if (!gestureDetected) {
      audio.muted = true;
    } else {
      audio.muted = false;
    }

    audio.play().then(() => {
      if (btnPlay) btnPlay.querySelector('img').src = ASSETS.pauseBtn;
      if (discImg) discImg.style.animationPlayState = "running";
    }).catch(err => {
      console.log("⏳ Audio en espera de interacción del usuario.");
      if (btnPlay) btnPlay.querySelector('img').src = ASSETS.playBtn;
      if (discImg) discImg.style.animationPlayState = "paused";
    });
  }

  iniciarActualizacionRadio();
}

// ===============================
// 🎶 MODO LOCAL
// ===============================
function activarModoLocal() {
  modoActual = "local";
  detenerActualizacionRadio();
  
  if (metadataSpan) metadataSpan.textContent = "🎶 Cargando Playlist...";
  actualizarCaratulas(ASSETS.coverDefault); // Default Cover
  
  if (audio) {
    audio.pause();
    audio.muted = !gestureDetected;
  }
  if (btnPlay) btnPlay.querySelector('img').src = ASSETS.playBtn;
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
        if (metadataSpan) metadataSpan.textContent = `🎶 Playlist activa (${playlist.length} tracks)`;
        cargarTrack(currentTrack);
      } else {
        if (metadataSpan) metadataSpan.textContent = "⚠️ No hay pistas";
      }
    })
    .catch(err => {
      console.error("❌ Error al cargar playlist:", err);
      if (metadataSpan) metadataSpan.textContent = "⚠️ Error de red";
    });
}

function cargarTrack(index) {
  if (modoActual !== "local" || !playlist[index] || !audio) return;
  const track = playlist[index];

  // Si el track no tiene carátula, Default Cover
  actualizarCaratulas(track.caratula || ASSETS.coverDefault);
  audio.src = track.enlace;
  audio.load();

  if (metadataSpan) {
    metadataSpan.textContent = `[${index + 1}] ${track.nombre} — ${track.artista}`;
  }
  actualizarFechaHoraSimple();

  if (gestureDetected) {
    audio.play().then(() => {
      if (btnPlay) btnPlay.querySelector('img').src = ASSETS.pauseBtn;
      if (discImg) discImg.style.animationPlayState = "running";
    }).catch(() => {
      if (btnPlay) btnPlay.querySelector('img').src = ASSETS.playBtn;
      if (discImg) discImg.style.animationPlayState = "paused";
    });
  } else {
    if (btnPlay) btnPlay.querySelector('img').src = ASSETS.playBtn;
    if (discImg) discImg.style.animationPlayState = "paused";
  }
}

// ===============================
// 🚀 INICIALIZACIÓN Y GESTOS
// ===============================
function inicializarReproductor() {
  audio = document.getElementById("player");
  btnPlay = document.getElementById("playPause");
  btnOnline = document.getElementById("plus");
  btnRwd = document.getElementById("btn-rwd");
  btnFwd = document.getElementById("btn-fwd");
  metadataSpan = document.querySelector(".metadata-marquee span");
  infoSpan = document.querySelector(".info-marquee span");
  discImg = document.querySelector(".disc-img");
  turbineCoverImg = document.querySelector(".turbine-cover-img");

  aplicarAssetsAlDOM();

  actualizarFechaHoraSimple();
  setInterval(actualizarFechaHoraSimple, 60000);

  if (audio) { 
    audio.muted = true; 
    audio.muted = false; 
  }

  document.addEventListener("click", () => {
    if (!gestureDetected) {
      gestureDetected = true;
      audio.muted = false;
      if (audio && audio.src && audio.paused) {
        audio.play().then(() => {
          if (btnPlay) btnPlay.querySelector('img').src = ASSETS.pauseBtn;
          if (discImg) discImg.style.animationPlayState = "running";
        }).catch(() => {});
      }
    }
  }, { once: true });

  if (btnPlay && audio) {
    btnPlay.addEventListener("click", () => {
      if (!gestureDetected) { 
        gestureDetected = true; 
        audio.muted = false; 
      }
      if (audio.paused || audio.ended) {
        audio.play().then(() => {
          btnPlay.querySelector('img').src = ASSETS.pauseBtn;
          if (discImg) discImg.style.animationPlayState = "running";
        }).catch(() => {});
      } else {
        audio.pause();
        btnPlay.querySelector('img').src = ASSETS.playBtn;
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

  activarModoRadio();
  console.log("✅ Reproductor En La Disco RG inicializado.");
}

document.addEventListener("DOMContentLoaded", inicializarReproductor);
window.addEventListener("repro-ready", inicializarReproductor);

// Ripples
$(document).ready(function() {
  if (typeof $.fn.ripples === 'function') {
    $('.main-container').ripples({ resolution: 512, dropRadius: 20, perturbance: 0.04 });
  }
});
