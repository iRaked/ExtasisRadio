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
  if (coverImg) coverImg.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png"; // respaldo inicial

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
  // Detener metadatos
  if (radioMetaIntervalId !== null) {
    console.log("🛑 Deteniendo actualización de metadatos de Radio");
    clearInterval(radioMetaIntervalId);
    radioMetaIntervalId = null;
  }
  // Detener contador de oyentes (opcional, pero recomendado para ahorrar recursos)
  if (contadorIntervalId !== null) {
    clearInterval(contadorIntervalId);
    contadorIntervalId = null;
  }
}

// ===============================
// 🖼️ CARÁTULA DINÁMICA (iTunes JSONP)
// ===============================
function obtenerCaratulaDesdeiTunes(artist, title) {
  const fallback = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
  if (!window.$ || !$.ajax) {
    if (coverImg) coverImg.src = fallback;
    return;
  }

  // Limpieza simple para mejorar coincidencia en iTunes
  const cleanArtist = artist.toLowerCase().replace(/ &.*$| feat.*$| ft\.?.*$/i, "").trim();
  const cleanTitle = title.toLowerCase().replace(/ &| ft\.?.*$/i, "").replace(/\s*\(.*\)\s*$/g, "").trim();
  
  const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: "jsonp",
    url,
    success: function (data) {
      let cover = fallback;
      if (data && data.results && data.results.length > 0) {
        const art100 = data.results[0].artworkUrl100;
        if (art100) cover = art100.replace("100x100", "400x400");
      }
      if (coverImg) coverImg.src = cover;
    },
    error: function () {
      if (coverImg) coverImg.src = fallback;
    },
    timeout: 5000
  });
}

// ===============================
// 📻 METADATOS Y CONTADOR R37
// ===============================
function startRadioMetadata() {
  const radioUrl = "https://technoplayerserver.net:8018/currentsong?sid=1";
  const statsUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function updateMetadata() {
  if (currentMode !== "Radio") return; 

  try {
    const res = await fetch(proxyUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error("Proxy ocupado"); // Si falla, saltamos al catch sin limpiar la UI

    const raw = await res.text();
    const cleaned = raw.trim().replace(/AUTODJ|SANTI MIX DJ/gi, "").replace(/\|\s*$/g, "").trim();

    // 🛑 VALIDACIÓN R32: Si los datos son basura o iguales, NO HACEMOS NADA.
    // No limpiamos, no parpadeamos, mantenemos lo anterior.
    if (!cleaned || cleaned.toLowerCase().includes("offline") || cleaned === lastRadioTitle) {
      return; 
    }
    
    lastRadioTitle = cleaned;
    const parts = cleaned.split(/ - | – /);
    let artist = "Casino Digital Radio";
    let title = cleaned;

    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    }

    // Actualizamos solo si llegamos aquí con éxito
    if (trackArtistEl) trackArtistEl.textContent = artist;
    if (trackTitleEl) trackTitleEl.textContent = title;
    
    
    obtenerCaratulaDesdeiTunes(artist, title);

  } catch (err) {
    // 🛡️ COMPORTAMIENTO R32: Ante el error, SILENCIO TOTAL.
    // No ponemos "Error", no ponemos "—", no cambiamos la carátula.
    // Simplemente esperamos al siguiente ciclo de 10 segundos.
    console.log("R37: Reintento silencioso..."); 
  }
}

  // Función para el contador de oyentes vía JSONP (Evita CORS)
  function updateListeners() {
    if (currentMode !== "Radio" || !window.$) return;
    $.ajax({
      dataType: "jsonp",
      url: statsUrl,
      success: function(data) {
        const countEl = document.getElementById("listeners-count");
        if (countEl) countEl.textContent = data.currentlisteners || "0";
      }
    });
  }

  // Ejecución inicial e intervalos
  updateMetadata();
  updateListeners();
  
  radioMetaIntervalId = setInterval(updateMetadata, 10000);
  contadorIntervalId = setInterval(updateListeners, 15000);
}


  // ===============================
  // 🎵 MODO MÚSICA (Repro37.json)
  // ===============================
  function startMusicAll() {
    stopRadioIntervals();
    stopListenersCounter();

    fetch("Repro37.json")
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
  if (!track) return;

  // 🔍 BUSCADOR DE ENLACE INTELIGENTE
  // Prioridad: 1. enlace | 2. dropbox_url | 3. Cualquier prop que termine en .mp3 o .m4a
  const audioSrc = track.enlace || track.dropbox_url || 
                   Object.values(track).find(val => typeof val === 'string' && (val.includes('.mp3') || val.includes('.MP3') || val.includes('.m4a')));

  if (!audioSrc) {
    console.warn("No se encontró una fuente de audio válida para:", track.nombre);
    playNextTrack(); // Saltar a la siguiente si esta falla
    return;
  }

  // Actualización de UI
  const coverSrc = track.caratula || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
  if (coverImg) coverImg.src = `${coverSrc}?t=${Date.now()}`;
  
  // Normalizar nombres (maneja 'nombre' o 'name')
  if (trackTitleEl) trackTitleEl.textContent = track.nombre || track.name || "Sin título";
  if (trackArtistEl) trackArtistEl.textContent = track.artista || "Desconocido";
  if (trackAlbumEl) trackAlbumEl.textContent = track.album || track.seccion || "Casino Digital";

  // Reinicio y Reproducción
  player.pause();
  player.src = audioSrc;
  player.load();

  player.play()
    .then(() => updatePlayIcon(true))
    .catch((err) => {
      console.error("Error en reproducción:", err);
      updatePlayIcon(false);
    });
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
// 📂 GESTIÓN DE PLAYLISTS EXTERNAS
// ===============================

const playlistSources = {
  "Spotune": "https://radio-tekileros.vercel.app/Spotifly.json",
  "Ruido de Lata": "https://radio-tekileros.vercel.app/HardCore.json",
  "Baladas Rock": "https://radio-tekileros.vercel.app/BaladasRock.json",
  "Festival Razteca": "https://radio-tekileros.vercel.app/Razteca.json",
  "Viña Rock": "https://radio-tekileros.vercel.app/ViñaRock.json",
  "Heavy Metal": "https://radio-tekileros.vercel.app/HeavyMetal.json",
  "Rimas y Calle": "https://radio-tekileros.vercel.app/Rimas.json",
  "Rock en tu Idioma": "https://radio-tekileros.vercel.app/RockIdioma.json",
  "Skañol": "https://radio-tekileros.vercel.app/Skañol.json",
  "Zona Ska": "https://radio-tekileros.vercel.app/ZonaSka.json",
  "Asfalto Urbano": "https://radio-tekileros.vercel.app/AsfaltoUrbano.json",
  "Metal en Ñ": "https://radio-tekileros.vercel.app/Metañero.json",
  "Sesion Slam": "https://radio-tekileros.vercel.app/SesionSlam.json",
  "Rock Bar": "https://radio-tekileros.vercel.app/RockBar.json",
  "Furia Rosa": "https://radio-tekileros.vercel.app/FuriaRosa.json",
  "Ritmo Rebelde": "https://radio-tekileros.vercel.app/RitmoRebelde.json",
  "Rock Agropecuario": "https://radio-tekileros.vercel.app/RockAgropecuario.json",
  "Rock Cumbiero": "https://radio-tekileros.vercel.app/RockCumbiero.json",
  "Novedades": "https://radio-tekileros.vercel.app/Actual.json"
};

// Función para convertir cualquier estructura de JSON en un array plano de canciones
function flattenMusicData(data) {
  let allTracks = [];
  
  // Recorremos las llaves principales (ej: "skañol", "vina_rock", "spotifly")
  Object.values(data).forEach(value => {
    if (Array.isArray(value)) {
      // Caso 1: Es un array directo de tracks
      allTracks = allTracks.concat(value);
    } else if (typeof value === 'object' && value !== null) {
      // Caso 2: Es un objeto con sub-llaves (como Viña Rock con artistas)
      Object.values(value).forEach(subValue => {
        if (Array.isArray(subValue)) {
          allTracks = allTracks.concat(subValue);
        }
      });
    }
  });
  return allTracks;
}

function loadPlaylist(name) {
  // 1. Matar la radio primero que nada
  stopRadioIntervals(); 
  
  const url = playlistSources[name];
  if (!url) return;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      // Limpiar rastro de radio en la UI inmediatamente
      lastRadioTitle = ""; 
      
      const tracks = flattenMusicData(data);
      if (tracks.length > 0) {
        currentPlaylist = tracks;
        currentTrackIndex = 0;
        updateModeAndPlaylist("Música", name);
        playCurrentTrack();
      }
    })
    .catch(err => console.error("Error:", err));
}

// Re-generar los botones del menú lateral dinámicamente
function renderPlaylistMenu() {
  const container = document.querySelector(".playlist-list");
  if (!container) return;
  
  container.innerHTML = ""; // Limpiar existentes
  
  Object.keys(playlistSources).forEach(name => {
    const div = document.createElement("div");
    div.className = "playlist-item";
    div.textContent = name;
    div.onclick = () => loadPlaylist(name);
    container.appendChild(div);
  });
}

// Llamar al render al iniciar
renderPlaylistMenu();

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
  // Cambiamos la variable CSS
  root.style.setProperty("--background-image", `url('${bgPath}')`);
  
  if (videoElement) {
    videoElement.style.display = "none";
    // IMPORTANTE: Quitar la clase que ajusta el layout para video
    document.body.classList.remove("video-active");
  }
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


// ==========================================
// 🖼️ MOTOR DE FONDOS (SIN LOCAL STORAGE)
// ==========================================
function inicializarFondos() {
  const bgOptions = document.querySelectorAll('.bg-option');
  
  bgOptions.forEach(option => {
    const bgUrl = option.getAttribute('data-bg');
    
    // 1. Inyectar miniatura si existe la URL
    if (bgUrl) {
      option.style.backgroundImage = `url('${bgUrl}')`;
      option.style.backgroundSize = "cover";
      option.style.backgroundPosition = "center";
    }

    // 2. Evento de cambio al hacer clic
    option.onclick = () => {
      // Cambiamos la variable CSS y el fondo del body
      document.body.style.backgroundImage = `url('${bgUrl}')`;
      document.documentElement.style.setProperty('--background-image', `url('${bgUrl}')`);
      
      console.log("Fondo cambiado a:", bgUrl);
    };
  });
}

// Ejecutar al cargar la ventana para asegurar que el DOM está completo
window.onload = inicializarFondos;

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

  // ==========================================
// 🎧 CONTADOR DE RADIOESCUCHAS (R37-SHOUTCAST)
// ==========================================
function stopListenersCounter() {
  if (contadorIntervalId !== null) {
    console.log("📡 Deteniendo contador de oyentes");
    clearInterval(contadorIntervalId);
    contadorIntervalId = null;
  }
  // Buscamos el elemento directamente para evitar referencias nulas
  const listenersDisplay = document.getElementById("sonic_listeners");
  if (listenersDisplay) {
    listenersDisplay.textContent = "--";
  }
}

function startListenersCounter() {
  // 1. Limpieza de seguridad
  stopListenersCounter();

  const contadorUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(contadorUrl)}`;

  async function updateCounter() {
    // Solo actualizamos si estamos en modo Radio
    if (currentMode !== "Radio") {
      stopListenersCounter();
      return;
    }

    const listenersDisplay = document.getElementById("sonic_listeners");
    if (!listenersDisplay) return;

    try {
      const res = await fetch(proxyUrl, { cache: "no-cache" });
      if (!res.ok) throw new Error("Error en Proxy");

      const data = await res.json();
      
      // SHOUTCAST devuelve 'currentlisteners' en su JSON de stats
      const count = data.currentlisteners !== undefined ? data.currentlisteners : "0";
      listenersDisplay.textContent = count;

    } catch (err) {
      console.warn("R37: Error silencioso en contador:", err.message);
      // No reseteamos a "--" para evitar parpadeo visual, mantenemos el último valor o 0
      if (!listenersDisplay.textContent || listenersDisplay.textContent === "--") {
        listenersDisplay.textContent = "0";
      }
    }
  }

  // Ejecución inmediata y ciclo de 15 segundos
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

  // ===============================
  // 📐 DIMENSIONES DEL REPRODUCTOR
  // ===============================
  function updatePlayerDimensions() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const cmToPx = 37.8; // conversión estándar
    const footerHeight = 1.3 * cmToPx;

    const playerWidth = viewportWidth;
    const playerHeight = viewportHeight - footerHeight;

    console.log(`Reproductor: ${playerWidth}x${playerHeight}px`);
  }

  // Ejecutar al cargar y cada vez que se redimensiona la ventana
  window.addEventListener('resize', updatePlayerDimensions);
  updatePlayerDimensions();
});