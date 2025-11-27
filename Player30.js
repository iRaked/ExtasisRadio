// =====================
// Variables globales
// =====================
let modo = "local"; // "local" o "streaming"
let playlist = [];
let currentIndex = 0;
let emisora = "Casino Digital Radio";
let shuffle = false;
let dataGlobal = {};

let radioIntervalId = null;
let lastTrackTitle = "";

// Referencias
const audio = document.getElementById("player");
const panel = document.getElementById("panel");
const container = document.getElementById("iFone");

const toggleBtn = document.getElementById("btn-toggle");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.querySelector(".progress-container");
const queue = document.getElementById("modal-queue");
const artist = document.getElementById("modal-artist");
const title = document.getElementById("modal-title");

const btnPlus = document.getElementById("btn-plus");
const btnModo = document.getElementById("btn-modo");

const volumeControl = document.getElementById("volume-control");
const speedControl = document.getElementById("speed-control");
const loopToggle = document.getElementById("loop-toggle");
const shuffleToggle = document.getElementById("shuffle-toggle");

const modeLabel = document.getElementById("mode-label");
const playlistLabel = document.getElementById("playlist-label");

// =====================
// Mostrar / Ocultar Panel
// =====================
function showPlayer() {
  panel.classList.add("is-open");
  container.classList.add("visible");
}
function hidePlayer() {
  container.classList.remove("visible");
  panel.classList.remove("is-open");
}

// =====================
// Inicialización
// =====================
audio.volume = 0.7;
volumeControl.value = 0.7;
audio.muted = false;

fetch("Repro30.json")
  .then(res => res.json())
  .then(data => {
    dataGlobal = data;

    // Sin restorePlaybackState: arrancamos siempre con todas las playlists
    playlist = Object.values(dataGlobal).flat();

    renderPlaylist(currentIndex);
    renderTrack(currentIndex);
    syncStatus("Todas");
  });

// =====================
// Funciones de reproducción
// =====================
function activarModoStreaming() {
  container.classList.add("streaming-mode");
  container.style.background = "linear-gradient(135deg, #444, #222)";
  artist.textContent = emisora;
  title.textContent = "🔴 Transmisión en vivo";
  clearQueue();
  setQueueMode("radio");

  const defaultCover = document.getElementById("default-cover");
  if (defaultCover) {
    defaultCover.innerHTML = `<img src="assets/covers/Cover1.png" alt="Carátula" />`;
    defaultCover.style.display = "flex";
  }

  iniciarActualizacionRadio();
}

function activarAutoplayTrasGesto() {
  document.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(err => console.warn("Autoplay bloqueado:", err));
    }
  }, { once: true });
}

function renderTrack(index) {
  const defaultCover = document.getElementById("default-cover");

  if (modo === "streaming") {
    audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
    activarModoStreaming();
  } else {
    container.classList.remove("streaming-mode");
    const track = playlist[index];
    if (!track) return;

    audio.src = track.enlace;
    artist.textContent = track.artista;
    title.textContent = track.nombre;
    renderPlaylist(index);

    const fondo = fondoPorGenero(track.genero);
    container.style.setProperty("background", fondo, "important");

    if (defaultCover) defaultCover.style.display = "none";

    // 🔑 Carátula dinámica desde iTunes para modo local
    obtenerCaratulaDesdeiTunes(track.artista, track.nombre);
  }

  activarAutoplayTrasGesto();
  audio.load();
  audio.play().catch(err => console.warn("⚠️ Error al reproducir:", err));

  const icon = toggleBtn.querySelector("i");
  icon.classList.remove("fa-play");
  icon.classList.add("fa-pause");
}

// =====================
// Estado visual
// =====================
function syncStatus(playlistName = null) {
  if (modeLabel) modeLabel.textContent = `Modo: ${modo === "local" ? "Música" : "Radio"}`;
  if (playlistLabel) {
    if (modo === "local") {
      playlistLabel.style.display = "inline";
      playlistLabel.textContent = `Playlist: ${playlistName || "Todas"}`;
    } else {
      playlistLabel.textContent = "";
      playlistLabel.style.display = "none";
    }
  }
}

// =====================
// Playlist externa
// =====================
window.activarPlaylistPlayer30 = function (tracks, nombre) {
  if (Array.isArray(tracks)) {
    playlist = tracks;
    currentIndex = 0;
    modo = "local";
    renderPlaylist();
    renderTrack(currentIndex);
    syncStatus(nombre);
  } else {
    console.warn("Playlist vacía o no encontrada:", nombre);
  }
};

//=====================================
// Reproducción continua
//=====================================
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

// Renderizar playlist visual
function renderPlaylist(activeIndex = -1) {
  queue.innerHTML = "";
  playlist.forEach((track, i) => {
    const li = document.createElement("li");
    li.className = "modal-queue-item";
    li.style.background = fondoPorGenero(track.genero);
    if (i === activeIndex) li.classList.add("active");

    li.innerHTML = `
      <img src="${track.caratula}" alt="Cover" class="queue-cover" />
      <div class="queue-meta">
        <strong>${track.artista}</strong><br>
        <span>${track.nombre}</span>
      </div>
    `;

    li.onclick = () => {
      currentIndex = i;
      renderTrack(i);
    };

    queue.appendChild(li);
  });
}


// =====================
// 📻 Radio - Metadatos con historial y carátulas
// =====================
function detenerActualizacionRadio() {
  if (radioIntervalId) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }
}

function iniciarActualizacionRadio() {
  detenerActualizacionRadio();

  const radioUrl = "https://technoplayerserver.net:8018/currentsong?sid=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function actualizarDesdeServidor() {
    try {
      if (modo !== "streaming") return;

      const response = await fetch(proxyUrl, { cache: "no-cache" });
      const newSongTitleRaw = await response.text();

      const cleanedTitle = newSongTitleRaw
        .trim()
        .replace(/AUTODJ/gi, "")
        .replace(/\|\s*$/g, "")
        .trim();

      if (!cleanedTitle || cleanedTitle.toLowerCase().includes("offline") || cleanedTitle === lastTrackTitle) {
        return;
      }

      lastTrackTitle = cleanedTitle;

      const songtitleSplit = cleanedTitle.split(/ - | – /);
      let artistName = "Radio";
      let trackName = cleanedTitle;

      if (songtitleSplit.length >= 2) {
        artistName = songtitleSplit[0].trim();
        trackName = songtitleSplit.slice(1).join(" - ").trim();
      }

      if (artist) artist.textContent = artistName;
      if (title) title.textContent = trackName;

      const coverUrl = await obtenerCaratulaDesdeiTunes(artistName, trackName);

      const queueElement = document.getElementById("modal-queue");
      if (queueElement && queueElement.dataset.mode === "radio") {
        const li = document.createElement("li");
        li.innerHTML = `
          <img src="${coverUrl}" alt="Carátula" style="width:40px;height:40px;margin-right:8px;border-radius:4px;" />
          <span>${artistName} - ${trackName}</span>
        `;
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "8px";

        queueElement.insertBefore(li, queueElement.firstChild);

        while (queueElement.children.length > 20) {
          queueElement.removeChild(queueElement.lastChild);
        }
      }
    } catch (error) {
      console.error("❌ Error en la actualización de Radio:", error);
      if (artist) artist.textContent = "Error";
      if (title) title.textContent = "al cargar metadatos";
    }
  }

  actualizarDesdeServidor();
  radioIntervalId = setInterval(actualizarDesdeServidor, 20000);
}

// ===============================
// 📀 Carátulas dinámicas desde iTunes (devuelve URL)
// ===============================
async function obtenerCaratulaDesdeiTunes(artist, title) {
  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const coverUrl = data.results[0].artworkUrl100.replace("100x100bb", "300x300bb");

      const defaultCover = document.getElementById("default-cover");
      if (defaultCover) {
        defaultCover.innerHTML = `<img src="${coverUrl}" alt="Carátula" />`;
      }

      return coverUrl;
    } else {
      const fallback = "assets/covers/Cover1.png";
      const defaultCover = document.getElementById("default-cover");
      if (defaultCover) {
        defaultCover.innerHTML = `<img src="${fallback}" alt="Carátula" />`;
      }
      return fallback;
    }
  } catch (error) {
    console.error("❌ Error al obtener carátula desde iTunes:", error);
    const fallback = "assets/covers/Cover1.png";
    const defaultCover = document.getElementById("default-cover");
    if (defaultCover) {
      defaultCover.innerHTML = `<img src="${fallback}" alt="Carátula" />`;
    }
    return fallback;
  }
}

// =====================
// Limpieza y banderas de lista
// =====================
function clearQueue() {
  const queueElement = document.getElementById("modal-queue");
  if (queueElement) queueElement.innerHTML = "";
}

function setQueueMode(mode) {
  const queueElement = document.getElementById("modal-queue");
  if (!queueElement) return;
  queueElement.dataset.mode = mode; // "radio" | "local"
}

// =====================
// Alternar modo con separación de funciones
// =====================
function toggleMode() {
  modo = modo === "local" ? "streaming" : "local";

  if (modo === "streaming") {
    detenerActualizacionRadio();
    clearQueue();
    setQueueMode("radio");
    activarModoStreaming();
  } else {
    detenerActualizacionRadio();
    clearQueue();
    setQueueMode("local");
    container.classList.remove("streaming-mode");
    renderPlaylist(currentIndex);
    renderTrack(currentIndex);
  }

  // Sin localStorage: solo actualizamos estado visual con el nombre actual
  syncStatus("Todas");

  const iconInner = document.querySelector("#btn-modo i");
  const iconHeader = document.querySelector("#btn-power i");
  const toRadio = modo === "streaming";
  [iconInner, iconHeader].forEach(icon => {
    if (!icon) return;
    icon.classList.toggle("fa-music", !toRadio);
    icon.classList.toggle("fa-broadcast-tower", toRadio);
  });
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOTONERA
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//=====================================
// PLUS
//=====================================
if (btnPlus) {
  btnPlus.addEventListener("click", () => {
    const isVisible = container.classList.contains("visible");
    if (isVisible) {
      hidePlayer();
    } else {
      showPlayer();
    }
  });
}

//=====================================
// MODO - POWER/MUSIC
//=====================================
function toggleMode() {
  modo = modo === "local" ? "streaming" : "local";

  renderTrack(currentIndex);
  // Sin localStorage: solo actualizamos estado visual con un valor fijo
  syncStatus("Todas");

  // Actualizar iconos en ambos botones
  const iconInner = document.querySelector("#btn-modo i");       // botón interior
  const iconHeader = document.querySelector("#btn-power i");     // botón cabecera

  if (modo === "local") {
    if (iconInner) {
      iconInner.classList.remove("fa-broadcast-tower");
      iconInner.classList.add("fa-music");
    }
    if (iconHeader) {
      iconHeader.classList.remove("fa-broadcast-tower");
      iconHeader.classList.add("fa-music");
    }
  } else {
    if (iconInner) {
      iconInner.classList.remove("fa-music");
      iconInner.classList.add("fa-broadcast-tower");
    }
    if (iconHeader) {
      iconHeader.classList.remove("fa-music");
      iconHeader.classList.add("fa-broadcast-tower");
    }
  }
}

// Botón interior del reproductor
btnModo.addEventListener("click", toggleMode);

// Botón de la cabecera
const btnPowerHeader = document.getElementById("btn-power");
if (btnPowerHeader) {
  btnPowerHeader.addEventListener("click", toggleMode);
}

//=====================================
// PLAY/PAUSE
//=====================================
function togglePlayPause() {
  const iconInner = toggleBtn.querySelector("i");          // botón interior
  const iconHeader = document.querySelector("#btn-playpause i"); // botón cabecera

  if (audio.paused) {
    audio.play();
    if (iconInner) {
      iconInner.classList.remove("fa-play");
      iconInner.classList.add("fa-pause");
    }
    if (iconHeader) {
      iconHeader.classList.remove("fa-play");
      iconHeader.classList.add("fa-pause");
    }
  } else {
    audio.pause();
    if (iconInner) {
      iconInner.classList.remove("fa-pause");
      iconInner.classList.add("fa-play");
    }
    if (iconHeader) {
      iconHeader.classList.remove("fa-pause");
      iconHeader.classList.add("fa-play");
    }
  }
}

toggleBtn.addEventListener("click", togglePlayPause);
const btnPlayPauseHeader = document.getElementById("btn-playpause");
if (btnPlayPauseHeader) {
  btnPlayPauseHeader.addEventListener("click", togglePlayPause);
}

//=====================================
// LOOP - REPEAT
//=====================================
function toggleLoop() {
  audio.loop = !audio.loop;
  if (loopToggle) {
    loopToggle.textContent = `Loop: ${audio.loop ? "On" : "Off"}`;
  }
  const iconHeader = document.querySelector("#btn-repeat i");
  if (iconHeader) {
    if (audio.loop) {
      iconHeader.classList.add("active");
    } else {
      iconHeader.classList.remove("active");
    }
  }
}
loopToggle.addEventListener("click", toggleLoop);
const btnRepeatHeader = document.getElementById("btn-repeat");
if (btnRepeatHeader) {
  btnRepeatHeader.addEventListener("click", toggleLoop);
}

//=====================================
// 🔀 SHUFFLE toggle
//=====================================
function toggleShuffle() {
  shuffle = !shuffle;
  if (shuffleToggle) {
    shuffleToggle.classList.toggle("active", shuffle);
  }
  const iconHeader = document.querySelector("#btn-shuffle i");
  if (iconHeader) {
    if (shuffle) {
      iconHeader.classList.add("active");
    } else {
      iconHeader.classList.remove("active");
    }
  }
  if (shuffle && modo === "local" && playlist.length > 1) {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } while (nextIndex === currentIndex);
    currentIndex = nextIndex;
    renderTrack(currentIndex);
  }
}
shuffleToggle.addEventListener("click", toggleShuffle);
const btnShuffleHeader = document.getElementById("btn-shuffle");
if (btnShuffleHeader) {
  btnShuffleHeader.addEventListener("click", toggleShuffle);
}

//=====================================
// VELOCIDAD - REWARD / FORWARD
//=====================================
speedControl.addEventListener("change", () => {
  audio.playbackRate = parseFloat(speedControl.value);
});
function toggleRewindSpeed(event) { /* ... sin cambios ... */ }
function toggleForwardSpeed(event) { /* ... sin cambios ... */ }
// Botones RWD/FWD ya enlazados

//=====================================
// Botones cabecera Top/Bottom
//=====================================
const btnTopHeader = document.getElementById("btn-top");
if (btnTopHeader) {
  btnTopHeader.addEventListener("click", () => navigatePlaylist("up"));
}
const btnBottomHeader = document.getElementById("btn-bottom");
if (btnBottomHeader) {
  btnBottomHeader.addEventListener("click", () => navigatePlaylist("down"));
}

//=====================================
// Función central para navegar playlist
//=====================================
function navigatePlaylist(direction) { /* ... sin cambios ... */ }

//=====================================
// Volumen
//=====================================
volumeControl.addEventListener("input", () => {
  audio.muted = false;
  audio.volume = parseFloat(volumeControl.value);
});

//=====================================
// Progreso visual
//=====================================
audio.addEventListener("timeupdate", () => {
  if (modo === "local") {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${percent}%`;
  }
});
progressContainer.addEventListener("click", (e) => {
  if (modo === "local") {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  }
});


//=====================================
// 🎨 Fondo por género musical
//=====================================
function fondoPorGenero(genero) {
  const normalizado = genero?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const fondos = {
  "balada pop": "linear-gradient(135deg, #ffafbd, #ffc3a0)",
  "balada romantica": "linear-gradient(135deg, #ff9a9e, #fad0c4)",
  "bolero": "linear-gradient(135deg, #8e44ad, #ecf0f1)",
  "cheta": "linear-gradient(135deg, #ff6a00, #ee0979)",
  "corrido belico": "linear-gradient(135deg, #1e1e1e, #ff0000)",
  "corrido tumbado": "linear-gradient(135deg, #2c3e50, #bdc3c7)",
  "cuarteto": "linear-gradient(135deg, #f7971e, #ffd200)",
  "cumbia": "linear-gradient(135deg, #ff7e5f, #feb47b)",
  "cumbia norteña": "linear-gradient(135deg, #6a3093, #a044ff)",
  "dance": "linear-gradient(135deg, #00c3ff, #ffff1c)",
  "dancehall": "linear-gradient(135deg, #f79d00, #64f38c)",
  "electronica": "linear-gradient(135deg, #00c9ff, #92fe9d)",
  "house": "linear-gradient(135deg, #ff512f, #dd2476)",
  "metal": "linear-gradient(135deg, #434343, #000000)",
  "norteno": "linear-gradient(135deg, #34495e, #2ecc71)",
  "pop": "linear-gradient(135deg, #ff4ecd, #ffc0cb)",
  "pop electronico": "linear-gradient(135deg, #ff4ecd, #a29bfe)",
  "pop latino": "linear-gradient(135deg, #ff6b81, #ffe66d)",
  "pop rock": "linear-gradient(135deg, #4e54c8, #8f94fb)",
  "rap": "linear-gradient(135deg, #232526, #414345)",
  "reggae": "linear-gradient(135deg, #00ff00, #ffff00, #ff0000)",
  "regional mexicano": "linear-gradient(135deg, #8e44ad, #c0392b)",
  "regueton": "linear-gradient(135deg, #1e1e1e, #ff0000)",
  "rock en español": "linear-gradient(135deg, #2c3e50, #3498db)",
  "rock urbano": "linear-gradient(135deg, #7f8c8d, #95a5a6)",
  "rumba": "linear-gradient(135deg, #ff6f61, #f7c59f)",
  "salsa": "linear-gradient(135deg, #e74c3c, #f1c40f)",
  "ska": "linear-gradient(135deg, #000000, #ffffff)",
  "synthpop": "linear-gradient(135deg, #8e2de2, #4a00e0)",
  "trap": "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  "trance": "linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)",
  "tropi pop": "linear-gradient(135deg, #f39c12, #d35400)"
};
  return fondos[normalizado] || "linear-gradient(135deg, #111, #222)";
}