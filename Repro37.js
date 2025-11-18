// ===============================
// 🎧 ESTADO GLOBAL
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // Audio y UI
  const player = document.getElementById("player");
  const playBtn = document.getElementById("btn-play");
  const playIcon = playBtn ? playBtn.querySelector("i") : null;
  const forwardBtn = document.getElementById("btn-fwd");
  const rewindBtn = document.getElementById("btn-rwd");
  const shuffleBtn = document.getElementById("btn-shuffle");
  const repeatBtn = document.getElementById("btn-rep");

  const volumeSlider = document.getElementById("volumeSlider");
  const volumeIcon = document.getElementById("volumeIcon");
  const volumePercentage = document.getElementById("volumePercentage");

  const timeBar = document.getElementById("time-bar");

  const modeLabel = document.getElementById("mode-label");
  const playlistLabel = document.getElementById("playlist-label");

  const trackTitleEl = document.getElementById("track-title");
  const trackArtistEl = document.getElementById("track-artist");
  const trackAlbumEl = document.getElementById("track-album");
  const coverImg = document.querySelector(".cover-art");

  // Paneles laterales
  const toggleMap = {
    "menu-trigger": "menu-switch",
    "paint-trigger": "color-switch",
    "playlist-trigger": "playlist-switch",
    "background-trigger": "background-switch",
  };

  // Botones de modo
  const radioModeBtn = document.getElementById("radioMode");
  const musicModeBtn = document.getElementById("musicMode");

  // Info superior
  const sonicListenersEl = document.getElementById("sonic_listeners");
  const currentTimeEl = document.getElementById("current-time");
  const currentDateEl = document.getElementById("current-date");
  const currentCityEl = document.getElementById("current-city");

  // Fondos y estilo
  const root = document.documentElement;
  const videoElement = document.getElementById("bg-video");
  const colorOptions = document.querySelectorAll(".color-option");
  const restoreBtn = document.getElementById("restore-default");
  const bgOptions = document.querySelectorAll(".bg-option");

  // Estado de reproducción
  let currentMode = "Radio"; // "Radio" o "Música"
  let currentPlaylist = []; // Para modo Música (de Repro37.json)
  let currentTrackIndex = 0;
  let repeatMode = null; // null | "track" | "playlist"
  let isShuffleMode = false;
  let gestureUnlocked = false;
  let contadorIntervalId = null;
  let radioMetaIntervalId = null;
  let lastRadioTitle = "";

  // ===============================
  // 🔌 AUTOPLAY Y GESTO HUMANO
  // ===============================
  if (player.autoplay) {
    player.play().catch(() => {
      // bloqueado: esperamos gesto
    });
  }

  document.body.addEventListener(
    "click",
    () => {
      gestureUnlocked = true;
      player.muted = false;
      if (player.paused) {
        player.play().catch(() => {});
      }
    },
    { once: true }
  );

  // ===============================
  // 🏷️ VISUAL DE MODO Y PLAYLIST
  // ===============================
  function updateModeAndPlaylist(mode, playlistName = null) {
    currentMode = mode;
    if (modeLabel) modeLabel.textContent = `Modo: ${mode}`;
    if (playlistLabel) {
      if (mode === "Radio") {
        playlistLabel.textContent = "";
        playlistLabel.style.display = "none";
        // En Radio, ocultar barra de progreso
        const blockProgreso = document.getElementById("block-progreso");
        if (blockProgreso) blockProgreso.style.display = "none";
      } else {
        playlistLabel.style.display = "inline";
        playlistLabel.textContent = `Playlist: ${playlistName || "Todas las playlists"}`;
        const blockProgreso = document.getElementById("block-progreso");
        if (blockProgreso) blockProgreso.style.display = "flex";
      }
    }
  }

  function updatePlayIcon(isPlaying) {
    if (!playIcon) return;
    playIcon.classList.toggle("fa-play", !isPlaying);
    playIcon.classList.toggle("fa-pause", isPlaying);
  }

  function setSourceAndPlay(src) {
    player.src = src;
    player.play().then(() => updatePlayIcon(true)).catch((err) => {
      console.warn("Error al reproducir:", err);
      updatePlayIcon(false);
    });
  }

  // ===============================
// 📻 MODO RADIO
// ===============================
function startRadio() {
  // 🔑 Limpieza total de intervalos y estados previos
  stopRadioIntervals();
  stopListenersCounter();
  lastRadioTitle = ""; // reset para forzar nueva carga de metadatos

  // Preparar estado visual inicial
  if (trackTitleEl) trackTitleEl.textContent = "CASINO DIGITAL RADIO";
  if (trackArtistEl) trackArtistEl.textContent = "AUTO DJ";
  if (trackAlbumEl) trackAlbumEl.textContent = "MIX 1";
  if (coverImg) coverImg.src = "assets/covers/Cover1.png"; // respaldo inicial

  // Carga del stream
  setSourceAndPlay("https://technoplayerserver.net:8018/stream?icy=http");

  // Actualizar modo
  updateModeAndPlaylist("Radio");

  // Iniciar metadatos dinámicos desde servidor
  startRadioMetadata();
  // Iniciar contador de radioescuchas
  startListenersCounter();
}

function stopRadioIntervals() {
  if (radioMetaIntervalId !== null) {
    clearInterval(radioMetaIntervalId);
    radioMetaIntervalId = null;
  }
}

// ===============================
// 🖼️ CARÁTULA DINÁMICA (iTunes JSONP) CON RESPALDO
// ===============================
function formatArtistForSearch(artist) {
  const lower = artist.toLowerCase().trim();
  return lower
    .replace(/ &.*$/i, "")
    .replace(/ feat.*$/i, "")
    .replace(/ ft\.?.*$/i, "");
}

function formatTitleForSearch(title) {
  const lower = title.toLowerCase().trim();
  return lower
    .replace(/ &/g, " and")
    .replace(/\s*\(.*\)\s*$/g, "")
    .replace(/\s*ft\.?.*$/i, "");
}

function obtenerCaratulaDesdeiTunes(artist, title) {
  if (!window.$ || !$.ajax) {
    if (coverImg) coverImg.src = "assets/covers/Cover1.png";
    return;
  }

  const formattedArtist = formatArtistForSearch(artist || "");
  const formattedTitle  = formatTitleForSearch(title || "");
  const query = encodeURIComponent(`${formattedArtist} ${formattedTitle}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: "jsonp",
    url,
    success: function (data) {
      let cover = "assets/covers/Cover1.png"; // respaldo
      if (data && data.results && data.results.length > 0) {
        const art100 = data.results[0].artworkUrl100;
        if (art100) cover = art100.replace("100x100", "400x400");
      }
      if (coverImg) coverImg.src = cover;
    },
    error: function () {
      if (coverImg) coverImg.src = "assets/covers/Cover1.png";
    },
    timeout: 5000
  });
}

// ===============================
// 📻 METADATOS RADIO
// ===============================
function startRadioMetadata() {
  const radioUrl = "https://technoplayerserver.net:8018/currentsong?sid=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function updateMetadata() {
    try {
      const res = await fetch(proxyUrl, { cache: "no-cache" });
      const raw = await res.text();

      // limpieza
      const cleaned = raw.trim().replace(/AUTODJ/gi, "").replace(/\|\s*$/g, "").trim();

      // evitar estados inválidos o sin cambios
      if (!cleaned || cleaned.toLowerCase().includes("offline") || cleaned === lastRadioTitle) {
        return;
      }
      lastRadioTitle = cleaned;

      // separar artista y título
      const parts = cleaned.split(/ - | – /);
      let artist = "Casino Digital Radio";
      let title = cleaned;
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      }

      if (trackArtistEl) trackArtistEl.textContent = artist || "Desconocido";
      if (trackTitleEl) trackTitleEl.textContent = title || "Sin título";
      if (trackAlbumEl) trackAlbumEl.textContent = `${artist} - ${title}`;

      // 🔑 Carátula dinámica con respaldo
      obtenerCaratulaDesdeiTunes(artist, title);

      console.log("🎶 Metadatos actualizados:", { artist, title });
    } catch (err) {
      console.warn("Error al obtener metadatos de radio:", err);
      if (trackArtistEl) trackArtistEl.textContent = "—";
      if (trackTitleEl) trackTitleEl.textContent = "—";
      if (coverImg) coverImg.src = "assets/covers/Cover1.png"; // respaldo seguro
    }
  }

  // primera ejecución inmediata y cada 10s
  updateMetadata();
  radioMetaIntervalId = setInterval(updateMetadata, 10000);
}


  // ===============================
  // 🎵 MODO MÚSICA (Repro37.json)
  // ===============================
  function startMusicAll() {
    stopRadioIntervals();
    stopListenersCounter();

    fetch("https://radio-tekileros.vercel.app/Repro37.json")
      .then((res) => res.json())
      .then((data) => {
        const allTracks = Object.values(data).flat();
        if (!Array.isArray(allTracks) || allTracks.length === 0) {
          console.warn("No se encontraron pistas.");
          return;
        }
        currentPlaylist = allTracks;
        currentTrackIndex = 0;
        updateModeAndPlaylist("Música", "Todas las playlists");
        playCurrentTrack();
      })
      .catch((err) => console.error("Error al cargar JSON:", err));
  }

  function playCurrentTrack() {
    const track = currentPlaylist[currentTrackIndex];
    if (!track || !track.enlace) {
      console.warn("Enlace inválido o pista no encontrada");
      return;
    }

    // Actualización de carátula y metadatos
    const coverSrc = track.caratula || "assets/covers/Cover1.png";
    if (coverImg) coverImg.src = `${coverSrc}?t=${Date.now()}`;
    if (trackTitleEl) trackTitleEl.textContent = track.nombre || track.name || "Sin título";
    if (trackArtistEl) trackArtistEl.textContent = track.artista || "Desconocido";
    if (trackAlbumEl) trackAlbumEl.textContent = track.album || "Sin álbum";

    // Reinicio limpio del reproductor
    player.pause();
    player.removeAttribute("src");
    player.load();

    setTimeout(() => {
      player.src = track.enlace;
      player.load();
      player.play().then(() => {
        updatePlayIcon(true);
      }).catch((err) => {
        console.warn("Error al reproducir:", err);
        updatePlayIcon(false);
      });
    }, 100);
  }

  function playNextTrack() {
    if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;
    if (repeatMode === "playlist") {
      currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
    } else {
      currentTrackIndex++;
      if (currentTrackIndex >= currentPlaylist.length) {
        updatePlayIcon(false);
        return;
      }
    }
    playCurrentTrack();
  }

  function playPrevTrack() {
    if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;
    if (currentTrackIndex > 0) {
      currentTrackIndex--;
      playCurrentTrack();
    } else {
      console.log("Ya estás en la primera pista.");
    }
  }

  function playRandomTrack() {
    if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;
    const randomIndex = Math.floor(Math.random() * currentPlaylist.length);
    currentTrackIndex = randomIndex;
    playCurrentTrack();
  }

// ===============================
// 📂 ACTIVACIÓN DE PLAYLISTS (robusta)
// ===============================
function normalizeLabel(str) {
  return (str || "")
    .replace(/\u00A0/g, " ")        // NBSP → espacio normal
    .replace(/\s+/g, " ")           // colapsar espacios
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quitar acentos
}

function activatePlaylist(playlistName, fullData) {
  // Texto normalizado del botón
  const norm = normalizeLabel(playlistName);

  // Mapa: texto del botón normalizado → clave del JSON
  const map = {
    "hits": "hits",
    "regional mexicano": "regional_mexicano",
    "viva latino": "viva_latino",
    "rock en espanol": "rock_espanol",      // cubre "Rock En Español"
    "rock espanol": "rock_espanol",         // por si cambias a "Rock Español"
    "mega mix": "mega_mix",
    "after party": "after_party",
    "pop electronico": "pop_electronico",   // cubre "Pop Electrónico"
    "baladas": "baladas",
    "essentials": "essentials"
  };

  const realKey = map[norm];
  const tracks = realKey ? fullData[realKey] : null;

  if (Array.isArray(tracks) && tracks.length > 0) {
    currentPlaylist = tracks;
    currentTrackIndex = 0;
    playCurrentTrack();
    updateModeAndPlaylist("Música", playlistName);
  } else {
    console.warn("Playlist vacía o no encontrada:", { playlistName, norm, realKey });
  }
}

function loadAndPlayPlaylist(name) {
  fetch("https://radio-tekileros.vercel.app/Repro37.json")
    .then(res => res.json())
    .then(data => activatePlaylist(name, data))
    .catch(err => console.error("Error al cargar JSON:", err));
}

function playAllPlaylists() {
  fetch("https://radio-tekileros.vercel.app/Repro37.json")
    .then(res => res.json())
    .then(data => {
      const allTracks = Object.values(data).flat();
      if (allTracks.length > 0) {
        currentPlaylist = allTracks;
        currentTrackIndex = 0;
        playCurrentTrack();
        updateModeAndPlaylist("Música", "Todas las playlists");
      } else {
        console.warn("No se encontraron pistas en ninguna playlist.");
      }
    })
    .catch(err => console.error("Error al cargar todas las playlists:", err));
}

// Asignar listeners a cada item del panel
const playlistItems = document.querySelectorAll(".playlist-item");
playlistItems.forEach(item => {
  item.addEventListener("click", () => {
    // Usa textContent e innerText, y limpia NBSP
    const raw = (item.innerText || item.textContent || "").replace(/\u00A0/g, " ");
    const name = raw.trim();
    loadAndPlayPlaylist(name);
  });
});

// Botón extra para “Todas las playlists”
const allBtn = document.createElement("div");
allBtn.className = "playlist-item";
allBtn.textContent = "🎧 Todas las playlists";
allBtn.addEventListener("click", playAllPlaylists);
document.querySelector(".playlist-list").appendChild(allBtn);

  // ===============================
  // ▶️ BOTONERA
  // ===============================
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      if (!player.src || player.src === "#") {
        // Si no hay fuente, inicializamos al stream de radio
        setSourceAndPlay("https://technoplayerserver.net:8018/stream?icy=http");
        updateModeAndPlaylist("Radio");
        return;
      }
      if (player.paused || player.ended) {
        player.play().then(() => updatePlayIcon(true)).catch((err) => {
          console.warn("Error al reproducir:", err);
        });
      } else {
        player.pause();
        updatePlayIcon(false);
      }
    });
  }

  if (forwardBtn) {
    const forwardIcon = forwardBtn.querySelector("i");
    forwardBtn.addEventListener("click", (event) => {
      if (currentMode !== "Música") return;
      if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;

      if (event.detail === 2) {
        if (player.src && !player.paused && !isNaN(player.duration)) {
          player.currentTime = Math.min(player.duration, player.currentTime + 10);
        }
      } else {
        playNextTrack();
      }

      if (forwardIcon) {
        forwardIcon.classList.add("animate-spin");
        setTimeout(() => forwardIcon.classList.remove("animate-spin"), 600);
      }
    });
  }

  if (rewindBtn) {
    const rewindIcon = rewindBtn.querySelector("i");
    rewindBtn.addEventListener("click", (event) => {
      if (currentMode !== "Música") return;
      if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;

      if (event.detail === 2) {
        if (player.src && !player.paused && !isNaN(player.duration)) {
          player.currentTime = Math.max(0, player.currentTime - 10);
        }
      } else {
        playPrevTrack();
      }

      if (rewindIcon) {
        rewindIcon.classList.add("animate-spin");
        setTimeout(() => rewindIcon.classList.remove("animate-spin"), 600);
      }
    });
  }

  if (repeatBtn) {
    let repeatHoldTimer = null;

    function setRepeat(mode) {
      repeatMode = mode; // null | "track" | "playlist"
      repeatBtn.classList.remove("repeat-track", "repeat-playlist");
      switch (mode) {
        case "track":
          repeatBtn.classList.add("repeat-track");
          break;
        case "playlist":
          repeatBtn.classList.add("repeat-playlist");
          break;
        default:
          break;
      }
    }

    repeatBtn.addEventListener("click", (event) => {
      if (currentMode !== "Música") return;
      if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;

      if (event.detail === 2) {
        setRepeat("playlist");
      } else {
        setRepeat("track");
      }
    });

    repeatBtn.addEventListener("mousedown", () => {
      repeatHoldTimer = setTimeout(() => {
        setRepeat(null);
      }, 2000);
    });
    repeatBtn.addEventListener("mouseup", () => clearTimeout(repeatHoldTimer));
    repeatBtn.addEventListener("mouseleave", () => clearTimeout(repeatHoldTimer));
  }

  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      if (currentMode !== "Música") return;
      isShuffleMode = !isShuffleMode;
      shuffleBtn.classList.toggle("shuffle-active", isShuffleMode);
      if (isShuffleMode) playRandomTrack();
    });
  }

  // Al terminar pista en Música
  player.addEventListener("ended", () => {
    if (currentMode !== "Música") return;
    if (repeatMode === "track") {
      playCurrentTrack();
      return;
    }
    if (isShuffleMode) {
      playRandomTrack();
      return;
    }
    playNextTrack();
  });

  // ===============================
  // 🔊 VOLUMEN
  // ===============================
  let isMuted = false;
  let lastVolume = parseFloat(volumeSlider?.value) || 0.7;

  function applyVolume(value) {
    const val = Math.max(0, Math.min(1, parseFloat(value) || 0));
    player.volume = val;
    if (volumeSlider) volumeSlider.value = val;
    if (volumePercentage) volumePercentage.textContent = `${Math.round(val * 100)}%`;

    if (volumeIcon) {
      if (val === 0 || isMuted) {
        volumeIcon.className = "fas fa-volume-mute";
      } else if (val < 0.5) {
        volumeIcon.className = "fas fa-volume-down";
      } else {
        volumeIcon.className = "fas fa-volume-up";
      }
    }
  }

  applyVolume(lastVolume);

  if (volumeIcon) {
    volumeIcon.addEventListener("click", () => {
      if (!isMuted) {
        lastVolume = parseFloat(volumeSlider?.value) || player.volume || 0.7;
        applyVolume(0);
        isMuted = true;
      } else {
        applyVolume(lastVolume);
        isMuted = false;
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      isMuted = false;
      applyVolume(parseFloat(volumeSlider.value));
    });
  }

  // ===============================
  // 📏 BARRA DE PROGRESO (solo Música)
  // ===============================
  player.addEventListener("timeupdate", () => {
    if (currentMode !== "Música") return;
    if (!player.duration || !isFinite(player.duration) || isNaN(player.currentTime)) return;
    const percentage = (player.currentTime / player.duration) * 100;
    if (timeBar) timeBar.value = percentage;
  });

  if (timeBar) {
    timeBar.addEventListener("input", () => {
      if (currentMode !== "Música") return;
      if (!player.duration || !isFinite(player.duration)) return;
      const newTime = (parseFloat(timeBar.value) / 100) * player.duration;
      if (!isNaN(newTime) && newTime >= 0 && newTime <= player.duration) {
        player.currentTime = newTime;
      }
    });
  }

  // ===============================
  // 🎛️ PANEL LATERAL (acordeón)
  // ===============================
  Object.entries(toggleMap).forEach(([triggerId, targetId]) => {
    const trigger = document.getElementById(triggerId);
    const target = document.getElementById(targetId);
    if (!trigger || !target) return;

    trigger.addEventListener("click", () => {
      const isVisible = target.classList.contains("visible");

      // Cerrar todos primero
      Object.values(toggleMap).forEach((id) => {
        const panel = document.getElementById(id);
        if (panel) panel.classList.remove("visible");
      });

      if (!isVisible) target.classList.add("visible");
    });
  });

  document.addEventListener("click", (e) => {
    const panels = Object.values(toggleMap).map((id) => document.getElementById(id));
    const clickedInside =
      panels.some((panel) => panel && panel.contains(e.target)) ||
      Object.keys(toggleMap).some((triggerId) => {
        const trigger = document.getElementById(triggerId);
        return trigger && trigger.contains(e.target);
      });

    if (!clickedInside) {
      panels.forEach((panel) => panel && panel.classList.remove("visible"));
    }
  });

  // ===============================
// 🎨 FONDOS Y COLORES (sin localStorage)
// ===============================
function applyBackground(bgPath) {
  root.style.setProperty("--background-image", `url('${bgPath}')`);
  if (videoElement) videoElement.style.display = "none";
  document.body.classList.remove("video-active");
}

bgOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const bgPath = option.dataset.bg;
    if (bgPath) applyBackground(bgPath);
  });
});

// Por defecto: mostrar video si no hay fondo seleccionado
if (videoElement) {
  videoElement.style.display = "block";
  document.body.classList.add("video-active");
}

function applyGradient(type) {
  const gradients = {
    gold: "linear-gradient(45deg, #fbe8a6, #f6d365, #d4af37)",
    unicorn: "linear-gradient(45deg, #ffb6f9, #b2f7ef, #f9f871, #d0a2ff)",
    turquoise: "linear-gradient(45deg, #00c9a7, #00e6e6, #00ffff, #00bfff)",
  };
  const gradient = gradients[type] || "#3688ff50";
  root.style.setProperty("--base-color", gradient);
}

colorOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const solidColor = option.dataset.color;
    if (solidColor) {
      root.style.setProperty("--base-color", solidColor);
    } else {
      const gradientClass = [...option.classList].find((cls) =>
        ["gold", "unicorn", "turquoise"].includes(cls)
      );
      if (gradientClass) applyGradient(gradientClass);
    }
  });
});

if (restoreBtn) {
  restoreBtn.addEventListener("click", () => {
    const defaultColor = "#3688ff50";
    root.style.setProperty("--base-color", defaultColor);
    root.style.setProperty("--background-image", "none");
    if (videoElement) videoElement.style.display = "block";
    document.body.classList.add("video-active");
  });
}

// Color por defecto al iniciar
root.style.setProperty("--base-color", "#3688ff50");

  // ===============================
  // 🕒 FECHA, HORA, CIUDAD
  // ===============================
  function updateClockAndDate() {
    const now = new Date();
    const time = now.toLocaleTimeString("es-MX", { hour12: false });
    const date = now.toLocaleDateString("es-MX");
    if (currentTimeEl) currentTimeEl.textContent = time;
    if (currentDateEl) currentDateEl.textContent = date;
  }
  setInterval(updateClockAndDate, 1000);
  updateClockAndDate();

  function updateLocation() {
    // Ubicación fija (sin geolocalización)
    if (currentCityEl) currentCityEl.textContent = "Latinoamérica";
  }
  updateLocation();

  // ===============================
  // 🎧 CONTADOR DE RADIOESCUCHAS (proxy)
  // ===============================
  function stopListenersCounter() {
    if (contadorIntervalId !== null) {
      clearInterval(contadorIntervalId);
      contadorIntervalId = null;
    }
    if (sonicListenersEl) sonicListenersEl.textContent = "--";
  }

  function startListenersCounter() {
    stopListenersCounter();
    const contadorUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(contadorUrl)}`;

    function updateCounter() {
      fetch(proxyUrl, { cache: "no-cache" })
        .then((res) => res.json())
        .then((data) => {
          if (sonicListenersEl) sonicListenersEl.textContent = data.currentlisteners || "0";
        })
        .catch(() => {
          if (sonicListenersEl) sonicListenersEl.textContent = "0";
        });
    }

    updateCounter();
    contadorIntervalId = setInterval(updateCounter, 15000);
  }

  // ===============================
  // 🔀 CAMBIO DE MODO (botones del panel)
  // ===============================
  if (radioModeBtn) {
    radioModeBtn.addEventListener("click", () => {
      startRadio();
    });
  }

  if (musicModeBtn) {
    musicModeBtn.addEventListener("click", () => {
      startMusicAll();
    });
  }

  // ===============================
  // 🚀 INICIO: Modo Radio por defecto
  // ===============================
  startRadio();
});


