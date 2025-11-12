//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 01 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ===============================
// 🎧 INICIALIZACIÓN GLOBAL
// ===============================
let gestureDetected = false;
let lastTrackTitle = "";
let trackHistory = [];
let radioIntervalId = null;
let contadorIntervalId = null;

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

// ▶️ Inicialización del stream y gesto humano
document.addEventListener("click", () => {
  if (!gestureDetected) {
    gestureDetected = true;
    audio.src = "https://technoplayerserver.net/8240/stream";
    audio.load();
    audio.muted = false;
    audio.play().then(() => {
      playIcon.classList.replace("fa-play", "fa-pause");
    }).catch(err => console.warn("⚠️ Error al iniciar stream:", err));
    console.log("🟢 Gesto humano: stream desbloqueado.");
  }
}, { once: true });

// ===============================
// Función global para registrar historial
// ===============================
function pushHistoryEntry(artist, title, cover) {
  const time = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const entry = { artist, title, time, cover };
  if (trackHistory.length === 0 || trackHistory[0].title !== title) {
    trackHistory.unshift(entry);
    if (trackHistory.length > 20) trackHistory.pop();
  }
}

// ===============================
// 🔘 Modal Historial en panel derecho
// ===============================
const historyModal = document.getElementById("history-modal");
const closeHistoryModal = document.getElementById("close-history-modal");
const historyList = document.getElementById("history-list");
const contenidoIcon = contenidoBtn ? contenidoBtn.querySelector("i") : null;

if (contenidoBtn && historyModal && historyList) {
  contenidoBtn.addEventListener("click", () => {
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
    console.log("📜 Modal Historial abierto desde contenido-btn");
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
} else {
  console.warn("⚠️ No se registró Historial: faltan nodos (contenidoBtn/historyModal/historyList).");
}

// ===============================
// 🔁 Ciclo de actualización del servidor (METADATOS)
// ===============================
function iniciarActualizacionRadio() {
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

  actualizarDesdeServidor();
  radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
}
iniciarActualizacionRadio();

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 02 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ===============================
// 👥 Contador de radioescuchas (XML)
// ===============================
function detenerContadorRadioescuchas() {
  if (contadorIntervalId !== null) clearInterval(contadorIntervalId);
  contadorIntervalId = null;
  if (contadorElemento) contadorElemento.textContent = "";
}

function iniciarContadorRadioescuchas() {
  detenerContadorRadioescuchas();
  if (!contadorElemento) return;

  const statsUrl = "https://technoplayerserver.net/8240/stats?json=1";
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
    } catch (err) {
      console.error("❌ Error contador:", err);
      contadorElemento.textContent = "0";
    }
  }

  actualizarContador();
  contadorIntervalId = setInterval(actualizarContador, 10000);
}

// Llamada inicial
iniciarContadorRadioescuchas();

// ===============================
// 🔘 Animaciones de botones
// ===============================
const powerIcon  = document.querySelector(".btn-power i");
const menuBtn    = document.getElementById("menu-btn");
const menuIcon   = menuBtn ? menuBtn.querySelector("i") : null;
const rewindIcon = document.querySelector(".rewind-btn i");
const forwardIcon= document.querySelector(".forward-btn i");
const repeatBtn  = document.querySelector(".repeat-btn");
const repeatIcon = repeatBtn ? repeatBtn.querySelector("i") : null;
const shuffleBtn = document.querySelector(".shuffle-btn");
const shuffleIcon= shuffleBtn ? shuffleBtn.querySelector("i") : null;

powerIcon && powerIcon.addEventListener("click", () => {
  powerIcon.classList.add("animate-spin");
  setTimeout(() => powerIcon.classList.remove("animate-spin"), 600);
});

menuBtn && menuBtn.addEventListener("click", () => {
  if (menuIcon) {
    menuIcon.classList.add("animate-spin");
    setTimeout(() => menuIcon.classList.remove("animate-spin"), 600);
  }
  const playlistModal = document.getElementById("playlist-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  playlistModal.classList.remove("hidden");

  closeModalBtn && closeModalBtn.addEventListener("click", () => {
    playlistModal.classList.add("hidden");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !playlistModal.classList.contains("hidden")) {
      playlistModal.classList.add("hidden");
    }
  });

  document.addEventListener("click", (e) => {
    const content = playlistModal.querySelector(".modal-content");
    const clickedOutside = content && !content.contains(e.target) && !menuBtn.contains(e.target);
    if (!playlistModal.classList.contains("hidden") && clickedOutside) {
      playlistModal.classList.add("hidden");
    }
  }, { once: true });
});

rewindIcon && rewindIcon.addEventListener("click", () => {
  rewindIcon.classList.add("animate-spin");
  setTimeout(() => rewindIcon.classList.remove("animate-spin"), 600);
});

forwardIcon && forwardIcon.addEventListener("click", () => {
  forwardIcon.classList.add("animate-spin");
  setTimeout(() => forwardIcon.classList.remove("animate-spin"), 600);
});

// 🔁 Repeat toggle
let repeatActive = false;
repeatBtn && repeatBtn.addEventListener("click", () => {
  if (!repeatActive) {
    repeatActive = true;
    repeatBtn.classList.add("repeat-active");
    repeatIcon && repeatIcon.classList.add("animate-spin");
    setTimeout(() => repeatIcon && repeatIcon.classList.remove("animate-spin"), 600);
  } else {
    repeatActive = false;
    repeatBtn.classList.remove("repeat-active");
  }
});

// 🔀 Shuffle toggle
let shuffleActive = false;
shuffleBtn && shuffleBtn.addEventListener("click", () => {
  if (!shuffleActive) {
    shuffleActive = true;
    shuffleBtn.classList.add("shuffle-active");
    shuffleIcon && shuffleIcon.classList.add("animate-spin");
    setTimeout(() => shuffleIcon && shuffleIcon.classList.remove("animate-spin"), 600);
  } else {
    shuffleActive = false;
    shuffleBtn.classList.remove("shuffle-active");
  }
});

// Botón Play/Pause
playBtn.addEventListener("click", () => {
  if (!audio.src) audio.src = "https://technoplayerserver.net/8240/stream";

  if (audio.paused) {
    audio.play().then(() => {
      playIcon.classList.replace("fa-play", "fa-pause");
      COVER_ART_EL.classList.add("rotating");
    });
  } else {
    audio.pause();
    playIcon.classList.replace("fa-pause", "fa-play");
    COVER_ART_EL.classList.remove("rotating");
  }
});
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 03 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ===============================
// 🔊 Volumen inicial y eventos (versión ligera)
// ===============================
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

// ===============================
// 🕒 Hora/Fecha y Ubicación
// ===============================
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

// ===============================
// Particles Rain Effect
// ===============================
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
