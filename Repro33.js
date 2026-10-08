//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURACIÓN DE SERVIDOR RADIO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const STREAM_URL = "http://178.32.146.184:2852/stream.mp3";
const PROXY_URL  = "https://radio-nine-gilt.vercel.app/api/radio";
const radioServer = location.protocol === "https:" ? PROXY_URL : STREAM_URL;

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ESTADO GLOBAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const state = {
  mode: "radio",     // radio | local
  repeat: false,
  shuffle: false,
  trackIndex: 0,
  playlist: []
};

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INICIALIZACIÓN GLOBAL (ÚNICO DOMContentLoaded)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  // referencias principales
  const audio      = document.getElementById("player");
  const player     = document.querySelector(".player33");
  const speakerL   = document.querySelector(".speaker.left");
  const speakerR   = document.querySelector(".speaker.right");

  const musicBtn   = document.getElementById("music-btn");
  const repeatBtn  = document.getElementById("repeat-btn");
  const rewindBtn  = document.getElementById("rewind-btn");
  const playBtn    = document.getElementById("play-btn");
  const forwardBtn = document.getElementById("forward-btn");
  const shuffleBtn = document.getElementById("shuffle-btn");

  const volumeBar  = document.getElementById("volume-bar");
  const volumeIcon = document.querySelector('.volume .fa-volume-up, .volume .fa-volume-down, .volume .fa-volume-mute, .volume .fa-volume');

  const coverImg    = document.querySelector(".cover img");
  const marqueeSpan = document.querySelector(".marquee span");


  // Indicadores
  const radioIndicator   = document.querySelector(".indicator.radio") || document.createElement("div");
  if (!radioIndicator.classList.contains('indicator')) radioIndicator.classList.add("indicator", "radio");
  radioIndicator.textContent = "Radio";

  const repeatIndicator  = document.querySelector(".indicator.repeat") || document.createElement("div");
  if (!repeatIndicator.classList.contains('indicator')) repeatIndicator.classList.add("indicator", "repeat");
  repeatIndicator.textContent = "Repeat";

  const shuffleIndicator = document.querySelector(".indicator.shuffle") || document.createElement("div");
  if (!shuffleIndicator.classList.contains('indicator')) shuffleIndicator.classList.add("indicator", "shuffle");
  shuffleIndicator.textContent = "Shuffle";

  // Asegurar que los indicadores estén en el DOM si no lo estaban
  if (!player.contains(radioIndicator)) player.appendChild(radioIndicator);
  if (!player.contains(repeatIndicator)) player.appendChild(repeatIndicator);
  if (!player.contains(shuffleIndicator)) player.appendChild(shuffleIndicator);
  

  // visibilidad inicial según modo
  repeatIndicator.style.visibility  = state.mode === "local" && state.repeat ? "visible" : "hidden";
  shuffleIndicator.style.visibility = state.mode === "local" && state.shuffle ? "visible" : "hidden";
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // desbloqueo tras primer gesto humano
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const unlockAudio = () => {
    if (!audio.src) {
      audio.src = radioServer;
    }
    audio.muted = false;
    audio.play().catch(err => console.error("Error al reproducir (unlock):", err));
    
    document.removeEventListener("click", unlockAudio);
    document.removeEventListener("touchstart", unlockAudio);
  };
  document.addEventListener("click", unlockAudio);
  document.addEventListener("touchstart", unlockAudio);
  //=====================================
  // animaciones en speakers + icono play/pause
  //=====================================
  audio.addEventListener("play", () => {
    speakerL.classList.add("animate");
    speakerR.classList.add("animate");
    playBtn.innerHTML = '<i class="fa fa-pause"></i>';
  });
  audio.addEventListener("pause", () => {
    speakerL.classList.remove("animate");
    speakerR.classList.remove("animate");
    playBtn.innerHTML = '<i class="fa fa-play"></i>';
  });
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // utilidades
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async function ensurePlaylist() {
    if (state.playlist.length) return;
    try {
      const res  = await fetch("https://radio-tekileros.vercel.app/Actual.json");
      const data = await res.json();
      state.playlist = data.actual || [];
    } catch (err) {
      console.error("Error cargando JSON:", err);
    }
  }

  function updateIndicators() {
    const isLocal = state.mode === "local";
    
    // Visibilidad: Solo visible si es MODO LOCAL Y el estado es TRUE
    repeatIndicator.style.visibility  = isLocal && state.repeat ? "visible" : "hidden";
    shuffleIndicator.style.visibility = isLocal && state.shuffle ? "visible" : "hidden";
    
    // Estado activo (clase 'active')
    repeatIndicator.classList.toggle("active", state.repeat);
    shuffleIndicator.classList.toggle("active", state.shuffle);
    
    // Texto del indicador de modo
    radioIndicator.textContent = isLocal ? "Música" : "Radio";

    // Desactivar/Activar botones
    rewindBtn.disabled = !isLocal;
    forwardBtn.disabled = !isLocal;
    repeatBtn.disabled = !isLocal;
    shuffleBtn.disabled = !isLocal;
  }

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCIONES AUXILIARES PARA METADATOS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Imagen de respaldo global (fallback)
const DEFAULT_COVER_URL = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";

// Variables globales para el estado de metadatos (necesarias para la persistencia)
let radioIntervalId = null;
let lastTrackTitle = null;
let ultimaCaratulaValida = DEFAULT_COVER_URL; 

function safeCleanTitle(raw) {
  let s = String(raw || "").trim();
  if (!s) return "";
  let out = "", depth = 0;
  for (let ch of s) {
    if (ch === "[") { depth++; continue; }
    if (ch === "]" && depth > 0) { depth--; continue; }
    if (depth === 0) out += ch;
  }
  return out.trim();
}

function splitArtistTitle(cleaned) {
  const s = String(cleaned);
  const separators = [" - ", " – ", " — ", "-", "–", "—"];
  for (const sep of separators) {
    const pos = s.indexOf(sep);
    if (pos > 0) {
      return {
        artist: s.slice(0, pos).trim(),
        title: s.slice(pos + sep.length).trim()
      };
    }
  }
  return { artist: "Radio", title: s.trim() };
}

// ✨ La carátula usa ultimaCaratulaValida si entry.coverUrl es nulo o vacío
function actualizarUI(entry) {
  if (marqueeSpan) marqueeSpan.textContent = `${entry.artist} - ${entry.title}`;
  // Usamos ultimaCaratulaValida si no hay URL válida en la entrada actual
  if (coverImg) coverImg.src = entry.coverUrl || ultimaCaratulaValida; 
}

// ✨ Simplificada: ya no recibe fallback, solo valida
function validarCaratula(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(url);
    // Si falla, devuelve null, lo que forzará a usar ultimaCaratulaValida en obtenerCaratula
    img.onerror = () => resolve(null); 
    img.src = url;
  });
}

async function obtenerCaratulaDesdeiTunes(artist, title) {
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const url   = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;
    const res   = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data  = await res.json();
    if (data.resultCount > 0) {
      return data.results[0].artworkUrl100.replace("100x100", "400x400");
    }
  } catch (err) {
    console.warn("⚠️ iTunes falló:", err);
  }
  return null;
}

// ✨ Asegura la perseverancia: solo actualiza ultimaCaratulaValida si la carátula es válida
async function obtenerCaratula(artist, title) {
  const itunesUrl = await obtenerCaratulaDesdeiTunes(artist, title);
  
  if (itunesUrl) {
    // Intenta validar la URL obtenida
    const validatedUrl = await validarCaratula(itunesUrl);
    if (validatedUrl) {
      ultimaCaratulaValida = validatedUrl; // Guarda la carátula válida
      return validatedUrl;
    }
  }
  // Si no se encontró o falló la validación, devuelve la última carátula conocida
  return ultimaCaratulaValida; 
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METADATOS RADIO (fetch + proxy)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Nota: Las declaraciones let radioIntervalId, lastTrackTitle, ultimaCaratulaValida ya están al inicio

function detenerActualizacionRadio() {
  if (radioIntervalId !== null) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }
  // 🔹 Limpieza de estado al salir de radio
  lastTrackTitle = null;
  ultimaCaratulaValida = ultimaCaratulaValida; // Mantiene el último URL válido
}

function iniciarActualizacionRadio() {
  detenerActualizacionRadio();

  const radioStatsUrl = "http://178.32.146.184:2852/stats?sid=1&json=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioStatsUrl)}`;

  async function actualizarDesdeServidor() {
    try {
      if (state.mode !== "radio") { detenerActualizacionRadio(); return; }

      const res = await fetch(proxyUrl, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const cleanedTitle = safeCleanTitle(data?.songtitle);

      if (!cleanedTitle || cleanedTitle.toLowerCase().includes("offline")) {
        actualizarUI({ artist: "Radio", title: "En Vivo", coverUrl: ultimaCaratulaValida });
        return;
      }

      if (cleanedTitle === lastTrackTitle) {
        actualizarUI({ artist: "Radio", title: cleanedTitle, coverUrl: ultimaCaratulaValida });
        return;
      }

      // 🔹 Nuevo track detectado
      lastTrackTitle = cleanedTitle;
      const { artist, title } = splitArtistTitle(cleanedTitle);

      const coverUrl = await obtenerCaratula(artist, title); // Obtiene carátula con perseverancia
      
      actualizarUI({ artist, title, coverUrl }); // Usa la carátula devuelta (válida o la anterior)

    } catch (err) {
      console.error("❌ Error en metadatos radio:", err);
      actualizarUI({ artist: "Radio", title: "Error de Conexión", coverUrl: ultimaCaratulaValida });
    }
  }

  // 🔹 Lectura inmediata al entrar en radio
  actualizarDesdeServidor();

  // 🔹 Intervalo para refrescar cada 12s
  radioIntervalId = setInterval(actualizarDesdeServidor, 12000);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REPRODUCIR SEGÚN MODO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function playByMode() {
  const currentSrc = audio.src;
  let targetSrc = null;
  
  // 1. Limpieza de metadatos al salir de Radio
  if (state.mode === "local") {
    detenerActualizacionRadio();
    // Limpia la UI a DEFAULT_COVER_URL si no se carga una nueva carátula
    actualizarUI({ artist: "Cargando...", title: "Modo Local", coverUrl: DEFAULT_COVER_URL }); 
  }

  if (state.mode === "radio") {
    // MODO RADIO
    targetSrc = radioServer;
    
    // Actualización de UI a "Cargando" antes del fetch (usa la última carátula válida)
    actualizarUI({ artist: "Conectando", title: "Radio en Vivo", coverUrl: ultimaCaratulaValida });
    
    // Inicia ciclo de fetch (incluye la lectura inmediata)
    iniciarActualizacionRadio(); 

  } else {
    // MODO LOCAL
    
    await ensurePlaylist();

    if (state.playlist.length === 0) {
      state.mode = "radio";
      updateIndicators();
      
      targetSrc = radioServer;
      // Fallback a Radio
      actualizarUI({ artist: "Error Playlist", title: "Volviendo a Radio", coverUrl: ultimaCaratulaValida });
      iniciarActualizacionRadio();
    
    } else {
      const track = state.playlist[state.trackIndex];
      targetSrc = track.dropbox_url;
      
      // Actualiza la UI con datos locales
      actualizarUI({ 
        artist: track.artista, 
        title: track.nombre, 
        coverUrl: track.caratula
      });
    }
  }

  if (targetSrc && currentSrc !== targetSrc) {
    audio.pause();
    audio.src = targetSrc;
    audio.load();
  }
  
  updateIndicators();

  if (targetSrc) {
    audio.play().catch(err => {
      console.error(`Error al reproducir en modo ${state.mode}:`, err);
      audio.pause();
    });
  }
}

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BARRA DE TIEMPO INTERACTIVA
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Barra de tiempo
  const timeBar = document.querySelector(".player33 .time-bar") || document.createElement("div");
  if (!timeBar.classList.contains('time-bar')) timeBar.classList.add("time-bar");

  const progress = document.querySelector(".player33 .progress") || document.createElement("div");
  if (!progress.classList.contains('progress')) progress.classList.add("progress");
  if (!timeBar.contains(progress)) timeBar.appendChild(progress);
  if (!player.contains(timeBar)) player.appendChild(timeBar);

  let isSeeking = false;

  // Función para manejar el clic y arrastre en la barra
  const handleSeek = (e) => {
    if (state.mode !== 'local' || !isFinite(audio.duration) || audio.duration === 0) {
      return; // Solo permite buscar en modo local con duración definida
    }

    // 1. Calcular la posición del clic/ratón dentro de la barra
    const rect = timeBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    
    // 2. Establecer el nuevo tiempo de reproducción
    audio.currentTime = audio.duration * percent;
    
    // Opcional: actualizar la barra de progreso inmediatamente para la UI
    progress.style.width = (percent * 100) + "%";
  };

  // 1. Clic para saltar (Seek)
  timeBar.addEventListener("click", handleSeek);

  // 2. Arrastre para buscar (Seeking)
  timeBar.addEventListener("mousedown", (e) => {
    if (state.mode !== 'local') return;
    isSeeking = true;
    handleSeek(e); // manejar el primer clic
  });

  document.addEventListener("mousemove", (e) => {
    if (!isSeeking) return;
    // Prevenir la selección de texto mientras se arrastra
    e.preventDefault(); 
    handleSeek(e);
  });

  document.addEventListener("mouseup", () => {
    isSeeking = false;
  });

  // Sincronización visual de la barra (existe de antes)
  audio.addEventListener("timeupdate", () => {
    if (state.mode === "radio") {
      // Simulación para radio (barra pulsante)
      const t = Date.now() % 2000;
      const pct = (t / 2000) * 100;
      progress.style.width = pct + "%";
    } else {
      // Progreso real para música local
      if (audio.duration > 0 && isFinite(audio.duration)) {
        const percent = (audio.currentTime / audio.duration) * 100;
        if (!isSeeking) { // Evitar sobrescribir mientras el usuario arrastra
          progress.style.width = percent + "%";
        }
      } else {
        progress.style.width = "0%";
      }
    }
  });

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Inicializar volumen
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function updateVolumeIcon(vol) {
    if (!volumeIcon) return;
    if (vol === 0) {
      volumeIcon.className = "fa fa-volume-mute";
    } else if (vol > 0 && vol <= 0.3) {
      volumeIcon.className = "fa fa-volume-down";
    } else if (vol > 0.3 && vol <= 0.7) {
      volumeIcon.className = "fa fa-volume";
    } else {
      volumeIcon.className = "fa fa-volume-up";
    }
  }

  volumeBar.step = "0.1";
  if (!volumeBar.value) volumeBar.value = "0.7";
  audio.volume = Math.round(parseFloat(volumeBar.value) * 10) / 10;
  volumeBar.value = audio.volume.toString();
  updateVolumeIcon(audio.volume);

  // Función para obtener el siguiente índice aleatorio
  function getRandomTrackIndex(current, length) {
    let next = Math.floor(Math.random() * length);
    // Evita la misma pista (si es posible)
    if (length > 1 && next === current) next = (next + 1) % length;
    return next;
  }
    
  volumeBar.addEventListener("input", () => {
    const vol = Math.round(parseFloat(volumeBar.value) * 10) / 10;
    audio.volume = vol;
    volumeBar.value = vol.toString();
    updateVolumeIcon(vol);
  });

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BOTONERA
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //=====================================
  // Botón Music (Radio/Local)
  //=====================================
  musicBtn.addEventListener("click", async () => {
    state.mode = state.mode === "radio" ? "local" : "radio";
    await playByMode();
  });
  //=====================================
  // Botón Repeat
  //=====================================
  repeatBtn.addEventListener("click", () => {
    if (state.mode !== "local") return;
    state.repeat = !state.repeat;
    
    audio.loop = state.repeat; 
    
    if (state.repeat) {
      state.shuffle = false;
    }
    
    updateIndicators(); 
  });
  //=====================================
  // Botón Rewind
  //=====================================
  rewindBtn.addEventListener("click", async () => {
    if (state.mode === "local" && state.playlist.length) {
      // Si estamos cerca del inicio, ir a la pista anterior
      if (audio.currentTime < 3) {
        state.trackIndex = (state.trackIndex - 1 + state.playlist.length) % state.playlist.length;
        await playByMode();
      } else {
        // Si no, ir al inicio del track actual
        audio.currentTime = 0;
      }
    }
  });
  //=====================================
  // Botón Play/Pause
  //=====================================
  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      playByMode();
    }
    else audio.pause();
  });
  //=====================================
  //Botón Forward
  //=====================================
  forwardBtn.addEventListener("click", async () => {
    if (state.mode === "local" && state.playlist.length) {
      // Si está en shuffle, buscar el siguiente índice aleatorio
      if (state.shuffle) {
        state.trackIndex = getRandomTrackIndex(state.trackIndex, state.playlist.length);
      } else {
        // Secuencial
        state.trackIndex = (state.trackIndex + 1) % state.playlist.length;
      }
      await playByMode();
    }
  });
  //=====================================
  // Botón Shuffle
  //=====================================
  shuffleBtn.addEventListener("click", async () => {
    if (state.mode !== "local") return;
    
    state.shuffle = !state.shuffle;
    
    if (state.shuffle) {
      // 1. Desactivar Repeat
      state.repeat = false;
      audio.loop = false;
      
      // 2. Cargar una nueva pista aleatoria inmediatamente
      if (state.playlist.length > 1) {
        state.trackIndex = getRandomTrackIndex(state.trackIndex, state.playlist.length);
        await playByMode();
      }
    }
    
    updateIndicators();
  });

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTONAVEGACIÓN AL TERMINAR TRACK (Modo Local)
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  audio.addEventListener("ended", async () => {
    // Si es repeat, audio.loop ya lo maneja
    if (state.mode !== "local" || !state.playlist.length || state.repeat) return;

    if (state.shuffle) {
      // Reproducción aleatoria
      state.trackIndex = getRandomTrackIndex(state.trackIndex, state.playlist.length);
    } else {
      // Reproducción secuencial (avanzar)
      state.trackIndex = (state.trackIndex + 1) % state.playlist.length;
    }
    await playByMode();
  });

  // estado inicial
  updateIndicators();
}); // ← cierre único de DOMContentLoaded

//==================================
// Ecualizador miniatura (fuera del DOMContentLoaded)
//==================================
const canvas = document.getElementById('miniEQ');
if (canvas) {
  const ctx = canvas.getContext('2d');
  function drawEQ() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = 3;
    const gap = 2;
    const bars = 5;
    for (let i = 0; i < bars; i++) {
      const x = i * (barWidth + gap);
      const height = Math.random() * canvas.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, canvas.height - height, barWidth, height);
    }
  }
  setInterval(drawEQ, 120);
}

//==================================
// Mensaje clic derecho (fuera del DOMContentLoaded)
//==================================
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const msg = document.getElementById("custom-message");
  if (!msg) return;
  msg.classList.add("show");
  setTimeout(() => msg.classList.remove("show"), 2000);
});