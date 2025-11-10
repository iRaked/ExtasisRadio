// ===============================
// 🎧 INICIALIZACIÓN GLOBAL Y ESTADOS
// ===============================
let modo = "radio"; // "radio" o "local"
let playlist = [];
let currentIndex = 0;
let emisora = "Casino Digital Radio";
let shuffle = false;

const audio = document.getElementById("player");
const toggleBtn = document.getElementById("btn-toggle");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.querySelector(".progress-container");
const queue = document.getElementById("modal-queue");
const artist = document.getElementById("modal-artist");
const title = document.getElementById("modal-title");
const trackGenreElement = document.getElementById("genero");
const container = document.getElementById("iFone");

const btnPlus = document.getElementById("btn-plus");
const btnModo = document.getElementById("btn-modo");

const volumeControl = document.getElementById("volume-control");
const speedControl = document.getElementById("speed-control");
const loopToggle = document.getElementById("loop-toggle");
const shuffleToggle = document.getElementById("shuffle-toggle");

// Control de intervalos (para evitar múltiples timers en radio)
let radioMetaIntervalId = null;

// Mostrar/ocultar el panel
btnPlus.addEventListener("click", () => {
  console.log("＋ clickeado");
  container.classList.toggle("visible");
});

// Cambiar modo de reproducción
btnModo.addEventListener("click", () => {
  modo = modo === "local" ? "radio" : "local";
  currentIndex = 0;
  renderTrack(currentIndex);
});

// Volumen inicial
audio.volume = 0.7;
volumeControl.value = 0.7;
audio.muted = false;

// ===============================
// 📦 CARGA DE PLAYLIST
// ===============================
fetch("https://radio-tekileros.vercel.app/Repro9.json")
  .then(res => res.json())
  .then(data => {
    playlist = data.hits || [];
    renderPlaylist();
    renderTrack(currentIndex);
  });

// ===============================
// 🔊 AUTOPLAY TRAS GESTO
// ===============================
function activarAutoplayTrasGesto() {
  document.addEventListener(
    "click",
    () => {
      if (audio.paused) {
        audio.play().catch(err => {
          console.warn("Autoplay bloqueado por el navegador:", err);
        });
      }
    },
    { once: true }
  );
}

// ===============================
// 🧹 LIMPIEZA DE METADATOS (RADIO)
// ===============================
function limpiarMetadatosRadio(initial = false) {
  const titleSpan = title ? title.querySelector('.track-content') || title : null;
  const artistSpan = artist ? artist.querySelector('.track-content') || artist : null;

  if (titleSpan) titleSpan.textContent = initial ? "Conectando..." : "Cargando...";
  if (artistSpan) artistSpan.textContent = emisora || "";
  if (trackGenreElement) trackGenreElement.textContent = "";
  if (queue) queue.innerHTML = "";

  // ✅ Seleccionamos el <img> dentro del div
  const img = document.querySelector("#default-cover img");
  if (img) {
    img.src = "assets/covers/Cover1.png";
    img.style.display = "block";
  }

  window.lastTrackTitle = "";
}

// ===============================
// 🎨 ACTIVAR MODO RADIO
// ===============================
function activarModoRadio() {
  modo = "radio";
  container.classList.add("streaming-mode");
  container.style.background = "linear-gradient(135deg, #444, #222)";
  limpiarMetadatosRadio(true);

  audio.pause();
  audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
  audio.load();

  if (radioMetaIntervalId) clearInterval(radioMetaIntervalId);
  actualizarMetadatosStreaming(); // primer intento inmediato
  radioMetaIntervalId = setInterval(actualizarMetadatosStreaming, 12000);

  document.addEventListener("click", () => {
    audio.muted = false;
    if (audio.paused) audio.play().catch(() => {});
  }, { once: true });
}

// ===============================
// 🔁 ACTUALIZACIÓN DE METADATOS RADIO (corregida)
// ===============================
function actualizarMetadatosStreaming() {
  const radioUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";

  $.ajax({
    dataType: 'jsonp',
    url: radioUrl,
    success: function(data) {
      const cleanedTitle = (data.songtitle || "")
        .trim()
        .replace(/SANTI MIX DJ/gi, "")
        .replace(/\|\s*$/g, "")
        .trim();

      if (!cleanedTitle || cleanedTitle.toLowerCase().includes("offline")) return;
      if (window.lastTrackTitle === cleanedTitle) return;
      window.lastTrackTitle = cleanedTitle;

      const parts = cleanedTitle.split(/ - | – /);
      const artistName = parts.length >= 2 ? parts[0].trim() : emisora;
      const trackName = parts.length >= 2 ? parts.slice(1).join(" - ").trim() : cleanedTitle;

      const titleSpan = title ? title.querySelector('.track-content') || title : null;
      const artistSpan = artist ? artist.querySelector('.track-content') || artist : null;

      if (artistSpan) artistSpan.textContent = artistName;
      if (titleSpan) titleSpan.textContent = trackName;

      aplicarMarquesina(artist);
      aplicarMarquesina(title);

      if (trackGenreElement) trackGenreElement.textContent = "";

      // ✅ Carátula dinámica desde iTunes
      if (typeof obtenerCaratulaDesdeiTunes === "function") {
        obtenerCaratulaDesdeiTunes(artistName, trackName);
      } else {
        // Fallback si no existe la función
        const defaultCover = document.getElementById("default-cover");
        if (defaultCover) defaultCover.src = "assets/covers/Cover1.png";
      }
    },
    error: function() {
      const artistSpan = artist ? artist.querySelector('.track-content') || artist : null;
      if (artistSpan) artistSpan.textContent = "Error Conexión";

      // Fallback de carátula en caso de error
      const defaultCover = document.getElementById("default-cover");
      if (defaultCover) defaultCover.src = "assets/covers/Cover1.png";
    },
    timeout: 10000
  });
}

// ===============================
// 🎨 OBTENER CARÁTULA DESDE ITUNES (adaptada a default-cover)
// ===============================
function obtenerCaratulaDesdeiTunes(artist, title) {
  if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
    const img = document.querySelector("#default-cover img");
    if (img) img.src = "assets/covers/Cover1.png";
    return;
  }

  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: 'jsonp',
    url: url,
    success: function(data) {
      let cover = "assets/covers/Cover1.png";
      if (data.results && data.results.length > 0) {
        cover = data.results[0].artworkUrl100.replace("100x100", "400x400");
      }
      const img = document.querySelector("#default-cover img");
      if (img) {
        console.log("🎨 Carátula aplicada:", cover);
        img.src = cover + "?t=" + Date.now(); // fuerza refresco
        img.style.display = "block";
      }
    },
    error: function() {
      const img = document.querySelector("#default-cover img");
      if (img) img.src = "assets/covers/Cover1.png";
    }
  });
}

// ===============================
// ♻️ FUNCIÓN REUTILIZABLE PARA PINTAR METADATOS
// ===============================
function aplicarMetadatosTrack(track) {
  if (artist) artist.textContent = track.artista || "Artista desconocido";
  if (title) title.textContent = track.nombre || "Título desconocido";
  if (trackGenreElement) trackGenreElement.textContent = track.genero || "";

  aplicarMarquesina(artist);
  aplicarMarquesina(title);

  const img = document.querySelector("#default-cover img");
  if (img && track.caratula) {
    img.src = track.caratula;
    img.style.display = "block";
  }
}

// ===============================
// ▶️ RENDER TRACK (RADIO vs LOCAL)
// ===============================
function renderTrack(index) {
  const defaultCover = document.getElementById("default-cover");

  if (modo === "radio") {
    activarModoRadio();
    if (defaultCover) defaultCover.style.display = "flex";
  } else {
    // Modo local
    container.classList.remove("streaming-mode");

    const track = playlist[index];
    if (!track) return;

    audio.src = track.enlace;
    audio.load();

    if (artist) artist.textContent = track.artista || "Artista desconocido";
    if (title) title.textContent = track.nombre || "Título desconocido";

    renderPlaylist(index);

    const genero = track.genero || "desconocido";
    const fondo = fondoPorGenero(genero);
    console.log("🎨 Género:", genero, "| Fondo aplicado:", fondo);
    container.style.setProperty("background", fondo, "important");

    if (defaultCover) defaultCover.style.display = "none";
  }

  activarAutoplayTrasGesto();
  audio
    .play()
    .catch(err => console.warn("⚠️ Error al reproducir:", err));

  const icon = toggleBtn.querySelector("i");
  if (icon) {
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
  }
}

// ===============================
// 🎶 EFECTO MARQUESINA PARA TEXTO LARGO
// ===============================
function aplicarMarquesina(element) {
  if (!element) return;

  const content = element.querySelector(".track-content");
  if (!content) {
    // Si no existe el span interno, lo creamos
    const span = document.createElement("span");
    span.className = "track-content";
    span.textContent = element.textContent;
    element.textContent = "";
    element.appendChild(span);
  }

  const span = element.querySelector(".track-content");
  if (!span) return;

  // Reset estilos
  span.style.animation = "none";

  // Si el texto es más largo que el contenedor, aplicamos animación
  setTimeout(() => {
    if (span.scrollWidth > element.clientWidth) {
      span.style.animation = "marquee 10s linear infinite";
    }
  }, 100);
}

// ===============================
// ⏯️ PLAY/PAUSE
// ===============================
toggleBtn.addEventListener("click", () => {
  const icon = toggleBtn.querySelector("i");
  if (audio.paused) {
    audio.play();
    if (icon) {
      icon.classList.remove("fa-play");
      icon.classList.add("fa-pause");
    }
  } else {
    audio.pause();
    if (icon) {
      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");
    }
  }
});

// ===============================
// 📊 PROGRESO VISUAL (LOCAL)
// ===============================
audio.addEventListener("timeupdate", () => {
  if (modo === "local") {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${percent}%`;
  }
});

progressContainer.addEventListener("click", e => {
  if (modo === "local") {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  }
});

// ===============================
// 🔁 REPRODUCCIÓN CONTINUA (LOCAL)
// ===============================
audio.addEventListener("ended", () => {
  if (modo === "local") {
    if (shuffle) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentIndex && playlist.length > 1);
      currentIndex = nextIndex;
    } else {
      currentIndex++;
      if (currentIndex >= playlist.length) currentIndex = 0;
    }
    renderTrack(currentIndex);
  }
});

// ===============================
// 📜 RENDER PLAYLIST (LOCAL)
// ===============================
function renderPlaylist(activeIndex = -1) {
  queue.innerHTML = "";
  playlist.forEach((track, i) => {
    const genero = track.genero || "desconocido";
    const li = document.createElement("li");
    li.className = "modal-queue-item";
    li.style.background = fondoPorGenero(genero);
    if (i === activeIndex) li.classList.add("active");

    li.innerHTML = `
      <img src="${track.caratula || 'assets/covers/Cover1.png'}" alt="Cover" class="queue-cover" />
      <div class="queue-meta">
        <strong>${track.artista || 'Artista desconocido'}</strong><br>
        <span>${track.nombre || 'Título desconocido'}</span>
      </div>
    `;

    li.onclick = () => {
      currentIndex = i;
      renderTrack(i);
    };

    queue.appendChild(li);
  });
}

// ===============================
// 🎨 FONDO POR GÉNERO (NORMALIZADO)
// ===============================
function fondoPorGenero(genero) {
  const normalizado = genero?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const fondos = {
    "balada pop": "linear-gradient(135deg, #ffafbd, #ffc3a0)",
    "balada romantica": "linear-gradient(135deg, #ffdde1, #ee9ca7, #fad0c4)",
    "bolero": "linear-gradient(135deg, #654ea3, #eaafc8, #d8bfd8)",
    "cheta": "linear-gradient(135deg, #ff6a00, #ee0979)",
    "corrido belico": "linear-gradient(135deg, #1e1e1e, #ff0000)",
    "corrido tumbado": "linear-gradient(135deg, #2c3e50, #bdc3c7)",
    "cumbia": "linear-gradient(135deg, #ff7e5f, #feb47b)",
    "cumbia nortena": "linear-gradient(135deg, #6a3093, #a044ff)",
    "cuarteto": "linear-gradient(135deg, #f7971e, #ffd200)",
    "dance": "linear-gradient(135deg, #00c6ff, #0072ff, #00f2fe)",
    "dancehall": "linear-gradient(135deg, #ff9a9e, #fad0c4, #fbc2eb)",
    "electronica": "linear-gradient(135deg, #00f260, #0575e6, #8e2de2)",
    "house": "linear-gradient(135deg, #ff9966, #ff5e62, #f2d50f)",
    "jazz": "linear-gradient(135deg, #2c3e50, #fd746c, #ffb88c)",
    "norteno": "linear-gradient(135deg, #34495e, #2ecc71, #16a085)",
    "pop": "linear-gradient(135deg, #ff4ecd, #ffc0cb)",
    "pop electronico": "linear-gradient(135deg, #ff4ecd, #a29bfe)",
    "pop latino": "linear-gradient(135deg, #ff6b81, #ffe66d)",
    "pop rock": "linear-gradient(135deg, #4e54c8, #8f94fb)",
    "rap": "linear-gradient(135deg, #000000, #2c2c2c, #555555, #888888, #bbbbbb, #eeeeee)",
    "reggae": "linear-gradient(135deg, #00ff00, #ffff00, #ff0000)",
    "regueton": "linear-gradient(135deg, #1e1e1e, #ff0000)",
    "regional mexicano": "linear-gradient(135deg, #8e44ad, #c0392b)",
    "rock alternativo": "linear-gradient(135deg, #283c86, #45a247, #1f4037)",
    "rock en espanol": "linear-gradient(135deg, #2c3e50, #3498db)",
    "rock urbano": "linear-gradient(135deg, #7f8c8d, #95a5a6)",
    "rumba": "linear-gradient(135deg, #ff6f61, #f7c59f)",
    "salsa": "linear-gradient(135deg, #e74c3c, #f1c40f)",
    "ska": "linear-gradient(135deg, #000000, #ffffff)",
    "synthpop": "linear-gradient(135deg, #00c3ff, #ffff1c, #ff00cc)",
    "trance": "linear-gradient(135deg, #7f00ff, #e100ff, #00dbde)",
    "trap": "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    "tropi pop": "linear-gradient(135deg, #f39c12, #d35400)",
    "blues": "linear-gradient(135deg, #1e3c72, #2a5298, #6dd5ed)"
  };

  return fondos[normalizado] || "linear-gradient(135deg, #ff0000, #000000)";
}

// ===============================
// 🎚️ CONTROLES
// ===============================
volumeControl.addEventListener("input", () => {
  audio.muted = false;
  audio.volume = parseFloat(volumeControl.value);
});

speedControl.addEventListener("change", () => {
  audio.playbackRate = parseFloat(speedControl.value);
});

loopToggle.addEventListener("click", () => {
  audio.loop = !audio.loop;
  loopToggle.textContent = `Loop: ${audio.loop ? "On" : "Off"}`;
});

shuffleToggle.addEventListener("click", () => {
  shuffle = !shuffle;
  shuffleToggle.classList.toggle("active", shuffle);

  if (shuffle && modo === "local" && playlist.length > 1) {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } while (nextIndex === currentIndex);
    currentIndex = nextIndex;
    renderTrack(currentIndex);
  }

});
