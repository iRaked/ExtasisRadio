let modo = "local"; // "local" o "streaming"
let playlist = [];
let currentIndex = 0;
let emisora = "Casino Digital Radio";
let shuffle = false;

const audio = document.getElementById("audioStreaming");
const toggleBtn = document.getElementById("btn-toggle");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.querySelector(".progress-container");
const queue = document.getElementById("modal-queue");
const artist = document.getElementById("modal-artist");
const title = document.getElementById("modal-title");

const btnPlus = document.getElementById("btn-plus");
const btnModo = document.getElementById("btn-modo");
const container = document.getElementById("iFone");

const volumeControl = document.getElementById("volume-control");
const speedControl = document.getElementById("speed-control");
const loopToggle = document.getElementById("loop-toggle");
const shuffleToggle = document.getElementById("shuffle-toggle");

// Mostrar/ocultar el panel
btnPlus.addEventListener("click", () => {
  console.log("＋ clickeado");
  container.classList.toggle("visible");
});

// Cambiar modo de reproducción
btnModo.addEventListener("click", () => {
  modo = modo === "local" ? "streaming" : "local";
  currentIndex = 0;
  renderTrack(currentIndex);
});

// Volumen inicial
audio.volume = 0.7;
volumeControl.value = 0.7;
audio.muted = false;

// Cargar JSON y preparar playlist
fetch("Repro7.json")
  .then(res => res.json())
  .then(data => {
    playlist = data.hits;
    renderPlaylist();
    renderTrack(currentIndex);
  });

// Activar skin gris para modo Streaming
function activarModoStreaming() {
  container.classList.add("streaming-mode");
  container.style.background = "linear-gradient(135deg, #444, #222)";
  artist.textContent = emisora;
  title.textContent = "🔴 Transmisión en vivo";
  queue.innerHTML = "";
}

// Autoplay tras gesto confiable
function activarAutoplayTrasGesto() {
  document.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(err => {
        console.warn('Autoplay bloqueado por el navegador:', err);
      });
    }
  }, { once: true });
}

// Reproducir pista actual
function renderTrack(index) {
  const defaultCover = document.getElementById("default-cover");

  if (modo === "streaming") {
    audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
    activarModoStreaming();
    defaultCover.style.display = "flex";
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
    defaultCover.style.display = "none";
  }

  activarAutoplayTrasGesto();
  audio.load();
  audio.play().catch(err => console.warn("⚠️ Error al reproducir:", err));

  const icon = toggleBtn.querySelector("i");
  icon.classList.remove("fa-play");
  icon.classList.add("fa-pause");
}

// Play/pause
toggleBtn.addEventListener("click", () => {
  const icon = toggleBtn.querySelector("i");
  if (audio.paused) {
    audio.play();
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
  } else {
    audio.pause();
    icon.classList.remove("fa-pause");
    icon.classList.add("fa-play");
  }
});

// Progreso visual
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

// Reproducción continua
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
      if (currentIndex >= playlist.length) {
        currentIndex = 0;
      }
    }
    renderTrack(currentIndex);
  }
});

// Renderizar playlist
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

// Fondo por género
function fondoPorGenero(genero) {
  const normalizado = genero?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const fondos = {
    "pop rock": "linear-gradient(135deg, #4e54c8, #8f94fb)",
    "reggae": "linear-gradient(135deg, #f7b733, #fc4a1a)",
    "regional mexicano": "linear-gradient(135deg, #8e44ad, #c0392b)",
    "corrido tumbado": "linear-gradient(135deg, #2c3e50, #bdc3c7)",
    "corrido belico": "linear-gradient(135deg, #1e1e1e, #ff0000)",
    "norteno": "linear-gradient(135deg, #34495e, #2ecc71)",
    "cumbia nortena": "linear-gradient(135deg, #6a3093, #fbc531)",
    "tropi pop": "linear-gradient(135deg, #f39c12, #d35400)",
    "pop latino": "linear-gradient(135deg, #ff6b81, #ffe66d)",
    "salsa": "linear-gradient(135deg, #e74c3c, #f1c40f)",
    "regueton": "linear-gradient(135deg, #1e1e1e, #ff0000)", // 🔥 agregado
    "trap": "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    "rumba": "linear-gradient(135deg, #ff6f61, #f7c59f)",
    "rock en español": "linear-gradient(135deg, #2c3e50, #3498db)",
    "ska": "linear-gradient(135deg, #000000, #ffffff)",
    "rock urbano": "linear-gradient(135deg, #7f8c8d, #95a5a6)",
    "pop electronico": "linear-gradient(135deg, #ff4ecd, #a29bfe)",
    "cumbia": "linear-gradient(135deg, #ff7e5f, #feb47b)",
    "cumbia norteña": "linear-gradient(135deg, #6a3093, #a044ff)",
    "cheta": "linear-gradient(135deg, #ff6a00, #ee0979)",
    "cuarteto": "linear-gradient(135deg, #f7971e, #ffd200)",
    "rap": "linear-gradient(135deg, #232526, #414345)",
    "pop": "linear-gradient(135deg, #ff4ecd, #ffc0cb)",
    "balada pop": "linear-gradient(135deg, #ffafbd, #ffc3a0)"
  };
  return fondos[normalizado] || "linear-gradient(135deg, #111, #222)";
}

// Volumen
volumeControl.addEventListener("input", () => {
  audio.muted = false;
  audio.volume = parseFloat(volumeControl.value);
});

// Velocidad
speedControl.addEventListener("change", () => {
  audio.playbackRate = parseFloat(speedControl.value);
});

// Loop
loopToggle.addEventListener("click", () => {
  audio.loop = !audio.loop;
  loopToggle.textContent = `Loop: ${audio.loop ? "On" : "Off"}`;
});

// 🔀 Shuffle toggle
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