// ===============================
// 🎧 INICIALIZACIÓN GLOBAL
// ===============================
let modoActual = "radio"; // inicia siempre en radio
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
const coverImg = document.querySelector(".cover-art");

// ===============================
// 🕓 FORMATO SIMPLE DE FECHA/HORA
// ===============================
function actualizarFechaHoraSimple() {
  const ahora = new Date();
  const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const fecha = ahora.toLocaleDateString('es-MX', opciones);
  const hora = ahora.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
  infoSpan.textContent = `${fecha} ${hora}`;
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

    // Si aún no hay gesto humano, lo capturamos aquí
    if (!gestureDetected) {
      gestureDetected = true;
      audio.muted = false;
    }

    if (audio.paused || audio.ended) {
      // Reanudar reproducción
      audio.play().then(() => {
        btnPlay.querySelector('img').src = 'https://santi-graphics.vercel.app/assets/img/pause-btn.png';
        coverImg.classList.add("rotating");
      }).catch(err => {
        console.warn("⚠️ Error al reproducir:", err);
      });
    } else {
      // Pausar reproducción
      audio.pause();
      btnPlay.querySelector('img').src = 'https://santi-graphics.vercel.app/assets/img/play-btn.png';
      coverImg.classList.remove("rotating");
    }
  });
}

// ===============================
// 🎛️ BOTONES RWD & FWD
// ===============================
if (btnRwd) {
  btnRwd.addEventListener("click", () => {
    if (modoActual === "local") {
      // Retrocede al track anterior
      currentTrack--;
      if (currentTrack < 0) {
        currentTrack = playlist.length - 1; // vuelve al último si está en el primero
      }
      cargarTrack(currentTrack);
    } else {
      console.log("⏪ Retroceso no disponible en modo radio");
    }
  });
}

if (btnFwd) {
  btnFwd.addEventListener("click", () => {
    if (modoActual === "local") {
      // Avanza al siguiente track
      currentTrack++;
      if (currentTrack >= playlist.length) {
        currentTrack = 0; // vuelve al primero si está en el último
      }
      cargarTrack(currentTrack);
    } else {
      console.log("⏩ Avance no disponible en modo radio");
    }
  });
}

// ===============================
// ▶️ SINCRONIZACIÓN VISUAL CON EVENTOS
// ===============================
audio.addEventListener('playing', () => {
  btnPlay.querySelector('img').src = 'https://santi-graphics.vercel.app/assets/img/pause-btn.png';
  coverImg.classList.add("rotating");
});
audio.addEventListener('pause', () => {
  btnPlay.querySelector('img').src = 'https://santi-graphics.vercel.app/assets/img/play-btn.png';
  coverImg.classList.remove("rotating");
});


// ===============================
// 🖱️ GESTO HUMANO PARA DESBLOQUEO
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
// 🧹 LIMPIEZAS Y CANCELACIONES
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
// 📻 ACTIVAR MODO RADIO
// ===============================
function activarModoRadio() {
  modoActual = "radio";
  detenerActualizacionRadio();
  cancelarItunesFetch();

  metadataSpan.textContent = "Casino Digital Radio — Conectando...";
  coverImg.src = "https://santi-graphics.vercel.app/assets/img/Plato.png";
  coverImg.classList.add("rotating");

  audio.pause();
  audio.src = "https://technoplayerserver.net:8042/stream?icy=http";
  audio.load();

  audio.muted = !gestureDetected;
  if (gestureDetected) {
    audio.play().catch(err => console.warn("🔒 Error al iniciar Radio:", err));
  }

  iniciarActualizacionRadio();
}

// ===============================
// 📻 ACTUALIZACIÓN DE METADATOS RADIO
// ===============================
let lastTrackTitle = "";

function iniciarActualizacionRadio() {
  detenerActualizacionRadio();

  const radioUrl = "https://technoplayerserver.net:8042/currentsong?sid=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function actualizarDesdeServidor() {
    if (modoActual !== "radio") return;

    try {
      const response = await fetch(proxyUrl, { cache: 'no-cache' });
      const rawTitle = await response.text();

      const cleanedTitle = rawTitle.trim()
        .replace(/AUTODJ/gi, '')
        .replace(/\|\s*$/g, '')
        .trim();

      if (!cleanedTitle || cleanedTitle.toLowerCase().includes('offline')) {
        metadataSpan.textContent = "Casino Digital Radio — Offline";
        return;
      }

      // Evitar repeticiones innecesarias
      if (cleanedTitle === lastTrackTitle) return;
      lastTrackTitle = cleanedTitle;

      // Separar artista y título
      const partes = cleanedTitle.split(/ - | – /);
      let artista = "Artista desconocido";
      let titulo = cleanedTitle;
      if (partes.length >= 2) {
        artista = partes[0].trim();
        titulo = partes.slice(1).join(' - ').trim();
      }

      // ✅ Mostrar inmediatamente en formato solicitado
      metadataSpan.textContent = `Casino Digital Radio — ${titulo} — ${artista}`;

      // 🖼️ Actualizar carátula
      obtenerCaratulaDesdeiTunes(artista, titulo);

    } catch (error) {
      console.error("❌ Error al actualizar metadatos de Radio:", error);
      metadataSpan.textContent = "Casino Digital Radio — Error al cargar metadatos";
    }
  }

  // ⚡ Primera actualización inmediata
  actualizarDesdeServidor();

  // 🔄 Intervalo cada 5 segundos para mayor frescura
  radioIntervalId = setInterval(actualizarDesdeServidor, 5000);
}

// ===============================
// 🖼️ CARÁTULA DESDE ITUNES
// ===============================
function obtenerCaratulaDesdeiTunes(artist, title) {
  if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
    if (modoActual !== "radio") return;
    coverImg.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
    coverImg.classList.add("rotating");
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
      let cover = 'assets/covers/Plato.png';
      if (data.results && data.results.length === 1) {
        cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
      }
      coverImg.src = cover;
      coverImg.classList.add("rotating");
    },
    error: function() {
      if (modoActual !== "radio") return;
      coverImg.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
      coverImg.classList.add("rotating");
    }
  });
}

// ===============================
// 🎶 ACTIVAR MODO LOCAL
// ===============================
function activarModoLocal() {
  modoActual = "local";
  detenerActualizacionRadio();
  cancelarItunesFetch();

  metadataSpan.textContent = "🎶 Playlist Local activa";
  coverImg.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
  audio.pause();

  fetch("Repro28.json")
    .then(res => res.json())
    .then(data => {
      if (modoActual !== "local") return;
      playlist = data.hits || [];
      currentTrack = 0;
      if (playlist.length > 0) {
        cargarTrack(currentTrack);
      } else {
        metadataSpan.textContent = "⚠️ No hay pistas locales";
      }
    })
    .catch(err => {
      if (modoActual !== "local") return;
      console.error("❌ Error al cargar playlist local:", err);
      metadataSpan.textContent = "⚠️ Error al cargar pistas locales";
    });
}

// ===============================
// 🎧 CARGAR TRACK LOCAL
// ===============================
function cargarTrack(index) {
  if (modoActual !== "local") return;
  const track = playlist[index];
  if (!track) return;

  coverImg.src = track.caratula || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
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

// ===============================
// 🚀 INICIALIZACIÓN
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  activarModoRadio();
});

// Mostrar mensaje al hacer clic derecho
document.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // evitar menú contextual
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  // Ocultar automáticamente después de unos segundos
  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);
});