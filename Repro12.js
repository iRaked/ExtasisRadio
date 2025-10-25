document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const player = document.getElementById("player");
  const radioModeBtn = document.getElementById("radioMode");
  const musicModeBtn = document.getElementById("musicMode");
  const playBtn = document.getElementById("btn-play");
  const playIcon = playBtn.querySelector("i");
  const videoElement = document.querySelector("video");
  const playlistItems = document.querySelectorAll(".playlist-item");

  let currentMode = "Radio"; // Valor inicial por defecto
  let currentPlaylist = [];
  let currentTrackIndex = 0;
  let repeatMode = null;
    
    

  // ============================
  // 🔊 AUTOPLAY Y ACTIVACIÓN
  // ============================
  if (player.autoplay) {
    player.play().catch(err => {
      console.warn("Autoplay bloqueado:", err);
    });
  }

  document.body.addEventListener("click", () => {
    if (player.autoplay && player.paused) {
      player.muted = false;
      player.play().catch(() => {});
    }
  }, { once: true });

  // ============================
// 🎙️ MODOS DE REPRODUCCIÓN
// ============================

function updateIcon(isPlaying) {
  playIcon.classList.toggle("fa-play", !isPlaying);
  playIcon.classList.toggle("fa-pause", isPlaying);
}

function setSourceAndPlay(src) {
  player.src = src;
  player.play().then(() => updateIcon(true)).catch(err => {
    console.warn("Error al reproducir:", err);
  });
}

function updateModeAndPlaylist(mode, playlistName = null) {
  const modeLabel = document.getElementById("mode-label");
  const playlistLabel = document.getElementById("playlist-label");

  modeLabel.textContent = `Modo: ${mode}`;

  if (mode === "Radio") {
    playlistLabel.textContent = "";
    playlistLabel.style.display = "none";
  } else {
    playlistLabel.style.display = "inline";
    playlistLabel.textContent = `Playlist: ${playlistName || "Todas las playlists"}`;
  }
}

//Activar Modo RADIO
function activateRadioMode() {
  setSourceAndPlay("https://technoplayerserver.net:8018/stream?icy=http");
  repeatMode = null;
  updateModeAndPlaylist("Radio");
}

radioModeBtn.addEventListener("click", () => {
  setSourceAndPlay("https://technoplayerserver.net:8018/stream?icy=http");
  repeatMode = null;
  updateModeAndPlaylist("Radio");

  // 🎨 Metadatos simbólicos para modo radio
  const radioTrack = {
    nombre: "AUTO DJ",
    artista: "Casino Digital",
    album: "Mix",
    caratula: "https://i.postimg.cc/3w29QFHs/Cover1.png"
  };

  actualizarMetadatos(radioTrack);
});

// 🧭 Activar modo Radio por defecto si no se ha cambiado
activateRadioMode();

musicModeBtn.addEventListener("click", () => {
  fetch("Repro12.json")
    .then(res => res.json())
    .then(data => {
      const allTracks = Object.values(data).flat();
      if (allTracks.length > 0) {
        currentPlaylist = allTracks;
        currentTrackIndex = 0;
        currentPlaylist = allTracks;
        currentTrackIndex = 0;
        playCurrentTrack(); // ✅ función ya definida y funcional
        updateModeAndPlaylist("Música", "Todas las playlists");
      } else {
        console.warn("🚫 No se encontraron pistas en ninguna sección.");
      }
    })
    .catch(err => console.error("Error al cargar todas las playlists:", err));
});

// ============================
// 🎵 REPRODUCCIÓN CONTINUA
// ============================
function playCurrentTrack() {
  const track = currentPlaylist[currentTrackIndex];
    console.log("🎧 Track actual:", track);
  if (track?.enlace) {
    // ============================
    // 🖼️ ACTUALIZACIÓN DE METADATOS VISUALES
    // ============================
    const caratula = document.querySelector(".cover-art");
    const titulo = document.getElementById("track-title");
    const artista = document.getElementById("track-artist");
    const album = document.getElementById("track-album");

    if (caratula && titulo && artista && album) {
      caratula.src = track.caratula || "assets/covers/Cover-Vinyl-Disc-FX1.png";
      titulo.textContent = track.nombre || "Sin título";
      artista.textContent = track.artista || "Desconocido";
      album.textContent = track.album || "Sin álbum";
    }

    // 🎵 Reproducir audio con reinicio
console.log("🎧 track.enlace:", track.enlace);

// 🔁 Detener y limpiar cualquier reproducción previa
player.pause();
player.removeAttribute("src");
player.load();

// ⏳ Pequeño delay para liberar el buffer anterior
setTimeout(() => {
  player.src = track.enlace;
  console.log("🔊 player.src después de asignar:", player.src);

  player.load();
  player.play().then(() => {
    console.log("✅ Reproducción confirmada:", track.nombre);
    updateIcon(true);
  }).catch(err => {
    console.warn("Error al reproducir:", err);
  });
}, 100);

    // 🧪 Validación de cambio
    console.log("▶️ Reproduciendo:", track.nombre, "| Índice:", currentTrackIndex);
  } else {
    console.warn("🚫 Enlace inválido o pista no encontrada");
  }
}


  function playNextTrack() {
    currentTrackIndex++;
    if (currentTrackIndex < currentPlaylist.length) {
      playCurrentTrack();
    } else {
      console.log("🎶 Playlist finalizada");
      updateIcon(false);
    }
  }

// Listener
  player.addEventListener("ended", () => {
  if (isShuffleMode) {
    playRandomTrack();
    return;
  }

  switch (repeatMode) {
    case "track":
      playCurrentTrack();
      break;
    case "playlist":
      currentTrackIndex++;
      if (currentTrackIndex < currentPlaylist.length) {
        playCurrentTrack();
      } else {
        currentTrackIndex = 0;
        playCurrentTrack();
      }
      break;
    default:
      playNextTrack();
      break;
  }
});

  // ============================
  // 📂 ACTIVACIÓN DE PLAYLISTS
  // ============================
  function normalizeKey(str) {
    return str
      .replace(/[^\w\s]/gi, "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");
  }

  function activatePlaylist(playlistName, fullData) {
    const normalizedTarget = normalizeKey(playlistName);
    const keyMap = Object.keys(fullData).reduce((acc, key) => {
      acc[normalizeKey(key)] = key;
      return acc;
    }, {});
    const realKey = keyMap[normalizedTarget];
    const tracks = fullData[realKey];

    if (Array.isArray(tracks) && tracks.length > 0) {
      currentPlaylist = tracks;
      currentTrackIndex = 0;
      playCurrentTrack();
    } else {
      console.warn("Playlist vacía o no encontrada:", realKey);
    }
  }

  function loadAndPlayPlaylist(name) {
    fetch("Repro12.json")
      .then(res => res.json())
      .then(data => activatePlaylist(name, data))
      .catch(err => console.error("Error al cargar JSON:", err));
  }

  function playAllPlaylists() {
    fetch("Repro12.json")
      .then(res => res.json())
      .then(data => {
        const allTracks = Object.values(data).flat();
        if (allTracks.length > 0) {
          currentPlaylist = allTracks;
          currentTrackIndex = 0;
          playCurrentTrack();
        }
      })
      .catch(err => console.error("Error al cargar todas las playlists:", err));
  }

  playlistItems.forEach(item => {
    item.addEventListener("click", () => {
      const name = item.textContent.trim();
      loadAndPlayPlaylist(name);
    });
  });

  const allBtn = document.createElement("div");
  allBtn.className = "playlist-item";
  allBtn.textContent = "🎧 Todas las playlists";
  allBtn.addEventListener("click", playAllPlaylists);
  document.querySelector(".playlist-list").appendChild(allBtn);

  // ============================
//  MARQUESINA LISTA DE REPRODUCCION y MODO VISIBLE
// ============================
const modeLabel = document.getElementById("mode-label");
const playlistLabel = document.getElementById("playlist-label");

// 🟡 Actualiza modo de reproducción y controla visibilidad de playlist
function updateModeAndPlaylist(mode, playlistName = null) {
  modeLabel.textContent = `Modo: ${mode}`;

  if (mode === "Radio") {
    playlistLabel.textContent = ""; // 🔕 Borra contenido
    playlistLabel.style.display = "none"; // 🔒 Oculta completamente
  } else {
    playlistLabel.style.display = "inline"; // 🔁 Reactiva
    playlistLabel.textContent = `Playlist: ${playlistName || "Todas las playlists"}`;
  }
}

// 🎙️ Radio
radioModeBtn.addEventListener("click", () => {
  updateModeAndPlaylist("Radio");
});

// 🎵 Música (Todas las playlists)
musicModeBtn.addEventListener("click", () => {
    const musicModeBtn = document.getElementById("musicMode");
  updateModeAndPlaylist("Música", "Todas las playlists");
});

// 📂 Playlist individual
playlistItems.forEach(item => {
  item.addEventListener("click", () => {
    const name = item.textContent.trim();
    updateModeAndPlaylist("Música", name);
  });
});

// 🎧 Playlist generada en JS
allBtn.addEventListener("click", () => {
  updateModeAndPlaylist("Música", "Todas las playlists");
});

  // ============================
  // 🎛️ BOTÓN PLAY/PAUSE
  // ============================

  playBtn.addEventListener("click", () => {
    if (!player.src || player.src === "#") {
      setSourceAndPlay("https://technoplayerserver.net:8018");
      return;
    }

    if (player.paused || player.ended) {
      player.play().then(() => updateIcon(true)).catch(err => {
        console.warn("Error al reproducir:", err);
      });
    } else {
      player.pause();
      updateIcon(false);
    }
  });

  player.addEventListener("pause", () => updateIcon(false));
  player.addEventListener("play", () => updateIcon(true));

  // ============================
  // 🎛️ BOTÓN FORWARD
  // ============================
const forwardBtn = document.getElementById("btn-fwd");
const forwardIcon = forwardBtn.querySelector("i");

forwardBtn.addEventListener("click", (event) => {
  if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) {
    console.warn("🚫 Playlist vacía o no inicializada.");
    return;
  }

  if (typeof currentTrackIndex !== "number") {
    currentTrackIndex = 0;
  }

  if (event.detail === 2) {
    // ✌️ Doble clic: avanzar 10 segundos
    if (player.src && !player.paused && !isNaN(player.duration)) {
      player.currentTime = Math.min(player.duration, player.currentTime + 10);
      console.log("⏩ Avance de 10 segundos (doble clic)");
    }
  } else {
    // 👆 Clic único: siguiente pista
    if (currentTrackIndex + 1 < currentPlaylist.length) {
      currentTrackIndex++;
      const nextTrack = currentPlaylist[currentTrackIndex];

      if (nextTrack && nextTrack.enlace) {
        player.src = nextTrack.enlace;

        // 🧪 Log de validación
        console.log("🧪 Validando nextTrack:", nextTrack);

        actualizarMetadatos(nextTrack);

        player.play().then(() => {
          console.log(`⏭ Reproduciendo: ${nextTrack.nombre || nextTrack.name} - ${nextTrack.artista || "Desconocido"}`);
          updateIcon(true);
        }).catch(err => {
          console.error("Error al reproducir siguiente pista:", err);
        });
      } else {
        console.warn("🚫 Enlace inválido en el siguiente track.");
      }
    } else {
      console.log("🚫 Fin de playlist.");
      updateIcon(false);
    }
  }

  forwardIcon.classList.add("animate-spin");
  setTimeout(() => forwardIcon.classList.remove("animate-spin"), 600);
});

  // ============================
  // 🎛️ BOTÓN REWARD
  // ============================
const rewindBtn = document.getElementById("btn-rwd");
const rewindIcon = rewindBtn.querySelector("i");

rewindBtn.addEventListener("click", (event) => {
  if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) {
    console.warn("🚫 Playlist vacía o no inicializada.");
    return;
  }

  if (typeof currentTrackIndex !== "number") {
    currentTrackIndex = 0;
  }

  if (event.detail === 2) {
    // ✌️ Doble clic: retroceder 10 segundos
    if (player.src && !player.paused && !isNaN(player.duration)) {
      player.currentTime = Math.max(0, player.currentTime - 10);
      console.log("⏪ Retroceso de 10 segundos (doble clic)");
    }
  } else {
    // 👆 Clic único: pista anterior
    if (currentTrackIndex > 0) {
      currentTrackIndex--;
      const previousTrack = currentPlaylist[currentTrackIndex];

      if (previousTrack && previousTrack.enlace) {
        player.src = previousTrack.enlace;
        player.play().then(() => {
          console.log(`⏮ Reproduciendo: ${previousTrack.nombre} - ${previousTrack.artista}`);
          updateIcon(true);
        }).catch(err => {
          console.error("Error al reproducir pista anterior:", err);
        });
      } else {
        console.warn("🚫 Enlace inválido en la pista anterior.");
      }
    } else {
      console.log("🚫 Ya estás en la primera pista.");
    }
  }

  rewindIcon.classList.add("animate-spin");
  setTimeout(() => rewindIcon.classList.remove("animate-spin"), 600);
});

  // ============================
  // 🔁 BOTÓN REPEAT
  // ============================
const repeatBtn = document.getElementById("btn-rep");
let repeatHoldTimer = null;

if (repeatBtn) {
  function setRepeatMode(mode) {
  repeatMode = mode;
  repeatBtn.classList.remove("repeat-track", "repeat-playlist");

  switch (mode) {
    case "track":
      repeatBtn.classList.add("repeat-track");
      break;
    case "playlist":
      repeatBtn.classList.add("repeat-playlist");
      break;
    default:
      // No glow
      break;
  }
}

  repeatBtn.addEventListener("click", (event) => {
    if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;
    if (typeof currentTrackIndex !== "number") currentTrackIndex = 0;

    if (event.detail === 2) {
      setRepeatMode("playlist");
      console.log("🔁 Repetición activada: toda la playlist");
    } else {
      setRepeatMode("track");
      console.log("🔂 Repetición activada: pista actual");
    }
  });

  repeatBtn.addEventListener("mousedown", () => {
    repeatHoldTimer = setTimeout(() => {
      setRepeatMode(null);
      console.log("🚫 Repetición desactivada por clic sostenido");
    }, 2000);
  });

  repeatBtn.addEventListener("mouseup", () => {
    clearTimeout(repeatHoldTimer);
  });

  repeatBtn.addEventListener("mouseleave", () => {
    clearTimeout(repeatHoldTimer);
  });
} else {
  console.warn("🚫 repeatBtn no encontrado en el DOM");
}

  // ============================
  //  BOTÓN SHUFFLE
  // ============================
const shuffleBtn = document.getElementById("btn-shuffle");
let isShuffleMode = false;

function playRandomTrack() {
  if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;

  const randomIndex = Math.floor(Math.random() * currentPlaylist.length);
  currentTrackIndex = randomIndex;
  playCurrentTrack();
}

shuffleBtn.addEventListener("click", () => {
  isShuffleMode = !isShuffleMode;

  if (isShuffleMode) {
    shuffleBtn.classList.add("shuffle-active");
    console.log("🔀 Modo aleatorio activado");
    playRandomTrack();
  } else {
    shuffleBtn.classList.remove("shuffle-active");
    console.log("⏹️ Modo aleatorio desactivado");
  }
});

    // ============================
    // 🖼️ ACTUALIZACIÓN DE METADATOS VISUALES
    // ============================
const track = currentPlaylist[currentTrackIndex];
actualizarMetadatos(track);

function actualizarMetadatos(track) {
  if (!track) {
    console.warn("🚫 Track no definido para metadatos");
    return;
  }

  // 🧪 Log correcto
  console.log("🧪 Track recibido para metadatos:", track);

  // 🎨 Carátula
  const caratula = document.querySelector(".cover-art");
  const caratulaSrc = track.caratula || track.cover || "https://i.postimg.cc/3w29QFHs/Cover1.png";
  if (caratula) {
    caratula.src = `${caratulaSrc}?t=${Date.now()}`;
  }

  // 📝 Metadatos
  const titulo = document.getElementById("track-title");
  const artista = document.getElementById("track-artist");
  const album = document.getElementById("track-album");

  const nombre = track.nombre || track.name || "Sin título";
  const artistaNombre = track.artista || (nombre.includes(" - ") ? nombre.split(" - ")[0].trim() : "Desconocido");
  const tituloNombre = nombre.includes(" - ") ? nombre.split(" - ")[1].trim() : nombre;
  const albumNombre = track.album || "Sin álbum";

  if (titulo) titulo.textContent = tituloNombre;
  if (artista) artista.textContent = artistaNombre;
  if (album) album.textContent = albumNombre;

  console.log("🎨 Metadatos actualizados:", { tituloNombre, artistaNombre, albumNombre });
}

  // ============================
  // BARRA DE ESTADO DEL TRACK
  // ============================
const timeBar = document.getElementById("time-bar");

player.addEventListener("timeupdate", () => {
  if (
    currentMode === "Música" &&
    player.duration &&
    isFinite(player.duration) &&
    !isNaN(player.currentTime)
  ) {
    const porcentaje = (player.currentTime / player.duration) * 100;
    timeBar.value = porcentaje;
    timeBar.style.setProperty('--progress-percent', `${porcentaje}%`);
  }
});

timeBar.addEventListener("input", () => {
  if (
    currentMode === "Música" &&
    player.duration &&
    isFinite(player.duration)
  ) {
    const nuevoTiempo = (parseFloat(timeBar.value) / 100) * player.duration;
    if (!isNaN(nuevoTiempo) && nuevoTiempo >= 0 && nuevoTiempo <= player.duration) {
      player.currentTime = nuevoTiempo;
    }
  }
});

function updateModeAndPlaylist(mode, playlistName = null) {
  const modeLabel = document.getElementById("mode-label");
  const playlistLabel = document.getElementById("playlist-label");
  const blockProgreso = document.getElementById("block-progreso");

  currentMode = mode;
  modeLabel.textContent = `Modo: ${mode}`;

  if (mode === "Radio") {
    playlistLabel.textContent = "";
    playlistLabel.style.display = "none";
    if (blockProgreso) blockProgreso.style.display = "none";
  } else {
    playlistLabel.style.display = "inline";
    playlistLabel.textContent = `Playlist: ${playlistName || "Todas las playlists"}`;
    if (blockProgreso) blockProgreso.style.display = "flex";
  }
}

  // ============================
  // BARRA DE VOLUMEN
  // ============================
// Referencias a elementos
const audio = document.querySelector("audio"); // Asegúrate de que exista un <audio> en el DOM
const volumeSlider = document.getElementById("volumeSlider");
const volumeIcon = document.getElementById("volumeIcon");
const volumePercentage = document.getElementById("volumePercentage");

let isMuted = false;
let lastVolume = parseFloat(volumeSlider.value) || 0.7;

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  actualizarVolumen(lastVolume);
});

// Función principal
function actualizarVolumen(valor) {
  valor = Math.max(0, Math.min(1, parseFloat(valor) || 0));
  audio.volume = valor;
  volumeSlider.value = valor;
  volumePercentage.textContent = `${Math.round(valor * 100)}%`;

  const porcentaje = Math.round(valor * 100);
  volumeSlider.style.setProperty('--volume-percent', `${porcentaje}%`);

  if (valor === 0 || isMuted) {
    volumeIcon.className = "fas fa-volume-mute";
  } else if (valor < 0.5) {
    volumeIcon.className = "fas fa-volume-down";
  } else {
    volumeIcon.className = "fas fa-volume-up";
  }
}

// Click en ícono para silenciar/restaurar
volumeIcon.addEventListener("click", () => {
  if (!isMuted) {
    lastVolume = parseFloat(volumeSlider.value);
    actualizarVolumen(0);
    isMuted = true;
  } else {
    actualizarVolumen(lastVolume);
    isMuted = false;
  }
});

// Cambio manual del slider
volumeSlider.addEventListener("input", () => {
  isMuted = false;
  actualizarVolumen(parseFloat(volumeSlider.value));
});

// Accesibilidad con teclado
volumeSlider.addEventListener("keydown", (e) => {
  let current = parseFloat(volumeSlider.value);
  let nuevo = current;

  switch (e.key) {
    case "ArrowUp":
    case "PageUp":
      e.preventDefault();
      nuevo = Math.min(current + 0.1, 1);
      break;
    case "ArrowDown":
    case "PageDown":
      e.preventDefault();
      nuevo = Math.max(current - 0.1, 0);
      break;
    case "Home":
      e.preventDefault();
      nuevo = 0;
      break;
    case "End":
      e.preventDefault();
      nuevo = 1;
      break;
  }

  actualizarVolumen(nuevo);
});

  // ============================
  // 🎛️ BOTONERA LATERAL
  // ============================

  const toggleMap = {
    "menu-trigger": "menu-switch",
    "paint-trigger": "color-switch",
    "playlist-trigger": "playlist-switch",
    "background-trigger": "background-switch"
  };

  Object.entries(toggleMap).forEach(([triggerId, targetId]) => {
    const trigger = document.getElementById(triggerId);
    const target = document.getElementById(targetId);
    if (trigger && target) {
      trigger.addEventListener("click", () => {
        target.classList.toggle("visible");
      });
    }
  });

  // ============================
  // 🎨 FONDOS Y COLORES
  // ============================

  const colorOptions = document.querySelectorAll(".color-option");
  const restoreBtn = document.getElementById("restore-default");
  const bgOptions = document.querySelectorAll(".bg-option");

  function applyBackground(bgPath) {
    root.style.setProperty("--background-image", `url('${bgPath}')`);
    localStorage.setItem("backgroundImage", bgPath);
    if (videoElement) videoElement.style.display = "none";
    document.body.classList.remove("video-active");
  }

  bgOptions.forEach(option => {
    option.addEventListener("click", () => {
      const bgPath = option.dataset.bg;
      if (bgPath) applyBackground(bgPath);
    });
  });

  const savedBg = localStorage.getItem("backgroundImage");
  if (savedBg) {
    applyBackground(savedBg);
  } else {
    if (videoElement) videoElement.style.display = "block";
    document.body.classList.add("video-active");
  }

  function applyGradient(type) {
    const gradients = {
      gold: "linear-gradient(45deg, #fbe8a6, #f6d365, #d4af37)",
      unicorn: "linear-gradient(45deg, #ffb6f9, #ffb6f9, #b2f7ef, #f9f871, #d0a2ff, #d0a2ff)",
      turquoise: "linear-gradient(45deg, #00c9a7, #00e6e6, #00ffff, #00bfff)"
    };
    const gradient = gradients[type] || "#3688ff50";
    root.style.setProperty("--base-color", gradient);
    localStorage.setItem("baseColor", gradient);
  }

  colorOptions.forEach(option => {
    option.addEventListener("click", () => {
      const solidColor = option.dataset.color;
      if (solidColor) {
        root.style.setProperty("--base-color", solidColor);
        localStorage.setItem("baseColor", solidColor);
      } else {
        const gradientClass = [...option.classList].find(cls =>
          ["gold", "unicorn", "turquoise"].includes(cls)
        );
        if (gradientClass) applyGradient(gradientClass);
      }
    });
  });

  restoreBtn.addEventListener("click", () => {
    const defaultColor = "#3688ff50";
    root.style.setProperty("--base-color", defaultColor);
    localStorage.setItem("baseColor", defaultColor);
    localStorage.removeItem("backgroundImage");
    root.style.setProperty("--background-image", "none");
    if (videoElement) videoElement.style.display = "block";
    document.body.classList.add("video-active");
  });

  const savedColor = localStorage.getItem("baseColor");
  if (savedColor) {
    root.style.setProperty("--base-color", savedColor);
  }

  // ============================
  // INFORMACION FECHA, HORA, UBICACION Y RADIOESCUCHAS
  // ============================
function updateClockAndDate() {
  const now = new Date();
  const time = now.toLocaleTimeString("es-MX", { hour12: false });
  const date = now.toLocaleDateString("es-MX");

  document.getElementById("current-time").textContent = time;
  document.getElementById("current-date").textContent = date;
}

// Actualiza cada segundo
setInterval(updateClockAndDate, 1000);
updateClockAndDate(); // Inicializa al cargar

//_______________________________
function updateLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        .then(res => res.json())
        .then(data => {
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state;
          if (city) {
            document.getElementById("current-city").textContent = city;
          } else {
            console.warn("No se pudo determinar la ciudad.");
          }
        })
        .catch(err => console.warn("Error al obtener ubicación:", err));
    },
    err => console.warn("Permiso de ubicación denegado:", err)
  );
}

updateLocation();
//_______________________________
function updateListeners() {
  const count = Math.floor(Math.random() * 50) + 1;
  document.getElementById("sonic_listeners").textContent = count;
}

// Inicializa y actualiza cada 3 minutos
updateListeners();
setInterval(updateListeners, 180000);


}); // ← cierre del document.addEventListener("DOMContentLoaded")