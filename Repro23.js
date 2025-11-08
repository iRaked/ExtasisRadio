// ===============================
// 🎧 ESTADO GLOBAL
// ===============================
let modoActual = "radio";
let gestureDetected = false;
let currentIndex = -1;

// Local
let localPlaylist = [];

// Radio
let radioIntervalId = null;
let lastSongtitle = "";

// 🎯 DOM
const audio = document.getElementById("audio-player");
const cover = document.querySelector(".caratula-img");
const queue = document.getElementById("queue");
const playBtn = document.getElementById("btn-toggle");
const playIcon = playBtn?.querySelector("i");
const onlineBtn = document.getElementById("btn-online");
const volumeBar = document.getElementById("volumeBar");
const volumeIcon = document.getElementById("volumeIcon");

// ===============================
// 🔧 UTILIDADES VISUALES
// ===============================
function updatePlayIcon(isPlaying) {
  if (!playIcon) return;
  playIcon.classList.toggle("fa-play", !isPlaying);
  playIcon.classList.toggle("fa-pause", isPlaying);
}

function limpiarCaratula() {
  if (!cover) return;
  cover.src = "assets/covers/Cover1.png";
  cover.classList.remove("default-disc");
}

function setCover(srcCandidate, fallback = "assets/covers/Cover1.png") {
  if (!cover) return;
  const src = srcCandidate && srcCandidate.trim().length > 5 ? srcCandidate : fallback;
  cover.src = src;
  cover.classList.toggle("default-disc", src === fallback);
  cover.onerror = () => {
    cover.src = fallback;
    cover.classList.add("default-disc");
  };
}

function actualizarEstadoOnlineOffline() {
  if (!onlineBtn) return;
  if (modoActual === "radio") {
    onlineBtn.textContent = "ONLINE";
    onlineBtn.style.color = "#00ffff"; // Aqua
  } else {
    onlineBtn.textContent = "OFFLINE";
    onlineBtn.style.color = "#00FF00"; // Verde neón
  }
}

// ===============================
// 📜 PLAYLIST (común para ambos modos)
// ===============================
function highlightQueueItem(index) {
  const items = queue.querySelectorAll("li");
  items.forEach((li, i) => li.classList.toggle("active", i === index));
}

function buildLocalQueue() {
  queue.innerHTML = "";
  localPlaylist.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = `${track.artista} — ${track.nombre}`;
    li.addEventListener("click", () => playTrack(index));
    queue.appendChild(li);
  });
}

function buildRadioQueuePlaceholder() {
  queue.innerHTML = "";
  const li = document.createElement("li");
  li.id = "radio-current";
  li.textContent = "Conectando radio…";
  li.style.cursor = "default";
  queue.appendChild(li);
}

// ===============================
// ▶️ LOCAL: REPRODUCCIÓN
// ===============================
function updatePlayerLocal(track) {
  setCover(track.caratula, "assets/covers/Vinyl-Disc-FX.png");
  audio.src = track.enlace;
  audio.load();
  aplicarVolumenActual(); // asegura volumen
  if (gestureDetected) {
    audio.play().then(() => updatePlayIcon(true)).catch(() => updatePlayIcon(false));
  } else {
    updatePlayIcon(false);
  }
}

function playTrack(index) {
  if (index < 0 || index >= localPlaylist.length) return;
  currentIndex = index;
  updatePlayerLocal(localPlaylist[index]);
  highlightQueueItem(index);
  audio.onended = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < localPlaylist.length) {
      playTrack(nextIndex);
    } else {
      currentIndex = -1;
      updatePlayIcon(false);
    }
  };
}

function cargarLocalJSON() {
  fetch("Repro23.json")
    .then(res => res.json())
    .then(data => {
      const hits = Array.isArray(data.hits) ? data.hits : [];
      localPlaylist = hits;
      buildLocalQueue();
      if (localPlaylist.length > 0) {
        if (gestureDetected) {
          playTrack(0);
        } else {
          currentIndex = 0;
          updatePlayerLocal(localPlaylist[0]);
          highlightQueueItem(0);
        }
      }
    })
    .catch(err => {
      console.warn("⚠️ Error cargando Repro23.json:", err?.message || err);
      queue.innerHTML = "<li>Error al cargar playlist local</li>";
    });
}

// ===============================
// 📻 RADIO: METADATOS + REPRODUCCIÓN
// ===============================
function activarRadioStream() {
  audio.pause();
  audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
  audio.load();
  aplicarVolumenActual(); // asegura volumen
  if (gestureDetected) {
    audio.muted = false;
    audio.play().then(() => updatePlayIcon(true)).catch(() => updatePlayIcon(false));
  } else {
    updatePlayIcon(false);
  }
}

function actualizarRadioMetadatos(artist, title) {
  const li = document.getElementById("radio-current");
  if (li) li.textContent = `${artist} — ${title}`;
}

function obtenerCaratulaDesdeiTunes(artist, title) {
  if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
    setCover("assets/covers/Cover1.png");
    return;
  }
  const query = encodeURIComponent(`${artist} ${title}`.trim());
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;
  $.ajax({
    dataType: 'jsonp',
    url: url,
    success: function(data) {
      let coverUrl = "assets/covers/Cover1.png";
      if (data.results && data.results.length === 1) {
        coverUrl = data.results[0].artworkUrl100.replace('100x100', '400x400');
      }
      setCover(coverUrl, "assets/covers/Cover1.png");
    },
    error: function() {
      setCover("assets/covers/Cover1.png");
    }
  });
}

function iniciarActualizacionRadio() {
  if (radioIntervalId) clearInterval(radioIntervalId);
  buildRadioQueuePlaceholder();
  const radioUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";
  const fetchAndUpdate = () => {
    if (modoActual !== "radio") return;
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') return;
    $.ajax({
      dataType: 'jsonp',
      url: radioUrl,
      success: function(data) {
        const raw = (data.songtitle || "").trim();
        if (!raw) return;
        const cleaned = raw.replace(/SANTI MIX DJ/gi, '').replace(/\|\s*$/g, '').trim();
        if (!cleaned || cleaned === lastSongtitle || cleaned.toLowerCase().includes('offline')) return;
        lastSongtitle = cleaned;
        const parts = cleaned.split(/ - | – /);
        const artist = parts.length >= 2 ? parts[0].trim() : "Radio";
        const title = parts.length >= 2 ? parts.slice(1).join(' - ').trim() : cleaned;
        actualizarRadioMetadatos(artist, title);
        obtenerCaratulaDesdeiTunes(artist, title);
      },
      error: function() {},
      timeout: 10000
    });
  };
  fetchAndUpdate();
  radioIntervalId = setInterval(fetchAndUpdate, 12000);
}

function detenerActualizacionRadio() {
  if (radioIntervalId) clearInterval(radioIntervalId);
  radioIntervalId = null;
}

// ===============================
// 🔄 ALTERNANCIA DE MODOS
// ===============================
function activarModoRadio() {
  modoActual = "radio";
  limpiarCaratula();
  queue.innerHTML = "";
  detenerActualizacionRadio();
  activarRadioStream();
  iniciarActualizacionRadio();
  actualizarEstadoOnlineOffline();
  currentIndex = -1;
}

function activarModoLocal() {
  modoActual = "local";
  limpiarCaratula();
  detenerActualizacionRadio();
  audio.pause();
  cargarLocalJSON();
  actualizarEstadoOnlineOffline();
}

// ===============================
// 🎚️ CONTROL DE VOLUMEN
// ===============================
function clampVolumeValue(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? 50 : Math.max(0, Math.min(100, n));
}

function updateVolumeUI(percent) {
  if (!volumeBar) return;
  // Actualiza la variable CSS --value para pintar el track vertical
  volumeBar.style.setProperty('--value', `${percent}%`);
}

function updateVolumeIcon(vol) {
  if (!volumeIcon) return;
  volumeIcon.classList.remove('fa-volume-off', 'fa-volume-down', 'fa-volume-up');
  if (vol === 0) {
    volumeIcon.classList.add('fa-volume-off');
  } else if (vol > 0.6) {
    volumeIcon.classList.add('fa-volume-up');
  } else {
    volumeIcon.classList.add('fa-volume-down');
  }
}

function aplicarVolumenActual() {
  if (!volumeBar) return;
  const percent = clampVolumeValue(volumeBar.value);
  audio.volume = percent / 100;
  updateVolumeUI(percent);
  updateVolumeIcon(audio.volume);
}

// Listener del slider
if (volumeBar) {
  volumeBar.addEventListener('input', (e) => {
    const percent = clampVolumeValue(e.target.value);
    audio.volume = percent / 100;
    updateVolumeUI(percent);
    updateVolumeIcon(audio.volume);
  });
}

// Inicializa al cargar
aplicarVolumenActual();

// Refuerza volumen cuando el audio carga metadatos
audio.addEventListener('loadedmetadata', aplicarVolumenActual);
audio.addEventListener('loadeddata', aplicarVolumenActual);

// ===============================
// 🧭 LISTENERS GESTO Y BOTONES
// ===============================

// Primer gesto: desbloquea reproducción y aplica volumen
document.addEventListener("click", () => {
  if (!gestureDetected) {
    gestureDetected = true;
    audio.muted = false;
    aplicarVolumenActual(); // asegura volumen al desbloquear
    if (audio.src && audio.paused) {
      audio.play().then(() => updatePlayIcon(true)).catch(() => {});
    }
  }
}, { once: true });

if (playBtn) {
  playBtn.addEventListener("click", () => {
    if (modoActual === "radio" && (!audio.src || audio.src.indexOf("technoplayerserver") === -1)) {
      activarRadioStream();
      return;
    }
    if (modoActual === "local" && (audio.src === "" || currentIndex === -1) && localPlaylist.length > 0) {
      playTrack(0);
      return;
    }
    if (audio.paused) {
      audio.play().then(() => updatePlayIcon(true));
    } else {
      audio.pause();
      updatePlayIcon(false);
    }
  });
}

if (onlineBtn) {
  onlineBtn.addEventListener("click", () => {
    if (modoActual === "radio") {
      activarModoLocal();
    } else {
      activarModoRadio();
    }
  });
}

// ===============================
// 🚀 INICIALIZACIÓN
// ===============================
activarModoRadio();
actualizarEstadoOnlineOffline();