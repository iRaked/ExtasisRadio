// ===============================
// 🎧 SISTEMA DE REPRODUCCIÓN COMPLETO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // 🎯 Elementos clave del sistema
  const audio = document.getElementById("audio-player");
  const playPauseBtn = document.getElementById("btn-play-pause");
  const iconPlay = playPauseBtn.querySelector(".icon-play");
  const iconPause = playPauseBtn.querySelector(".icon-pause");
  const nextBtn = document.getElementById("next-button");
  const prevBtn = document.getElementById("prev-button");
  const shuffleBtn = document.getElementById("shuffle-button");

  // ===============================
  // SISTEMA MODAL
  // ===============================
  const trackList = document.querySelector(".track-list");
  const currentTrackName = document.getElementById("current-track-name");
  const modalTrackName = document.getElementById("modal-track-name");
  const discImg = document.querySelector(".disc-img");
  const nameDisplay = document.querySelector(".repro-name");
  const idDisplay = document.querySelector(".repro-id");
  const modalTracks = document.getElementById("modal-tracks");

  // 📦 Estado del sistema
  let trackData = [];
  let currentTrack = null;

  // ===============================
  // 🎼 Cargar metadata y generar lista ✓
  // ===============================
  fetch("metadata.json")
    .then(res => res.json())
    .then(data => {
      trackData = data;
      if (!Array.isArray(trackData) || trackData.length === 0) {
        console.warn("❌ No se encontraron pistas");
        return;
      }

      trackList.innerHTML = "";

      trackData.forEach((track, index) => {
        const li = document.createElement("li");
        li.textContent = track.name;
        li.classList.add("modal-track-item");
        li.setAttribute("data-index", index);

        li.addEventListener("click", () => {
          playTrack(index, false);
          modalTracks.classList.add("hidden");
        });

        trackList.appendChild(li);
      });

      playTrack(0, false);
    });

// ===============================
// 🎵 Función para cargar y reproducir pista
// ===============================
function playTrack(index, autoplay = true) {
  if (typeof index !== "number" || index < 0 || index >= trackData.length) {
    restaurarDiscoBase(); // 🌀 Restaurar disco base si el índice es inválido
    return;
  }

  const track = trackData[index];
  if (!track || !track.url) {
    restaurarDiscoBase(); // 🌀 Restaurar disco base si no hay pista válida
    return;
  }

  currentTrack = index;
  audio.src = track.url;

  if (autoplay) {
    audio.play().catch(err => {
      console.warn("Autoplay bloqueado:", err);
    });
  }

  discImg.src = track.cover || generarRutaDiscoBase(); // 🎯 Mostrar carátula o disco base
}

// ===============================
// 🍐 Restaurar disco base cuando no hay pista activa
// ===============================
function restaurarDiscoBase() {
  discImg.src = generarRutaDiscoBase(); // ✅ Forzar recarga con parámetro dinámico
}

// ===============================
// 🌀 Generar ruta única para el disco base (evita caché)
// ===============================
function generarRutaDiscoBase() {
  const timestamp = new Date().getTime();
  return `assets/Vinyl-Disc-FX.png?${timestamp}`;
}

// ===============================
// 🎯 Evento al terminar la pista
// ===============================
audio.addEventListener("ended", () => {
  iconPause.classList.add("hidden");
  iconPlay.classList.remove("hidden");

  if (repeatMode === "track") {
    audio.currentTime = 0;
    audio.play();
    console.log("🔂 Repetición automática de pista");
  } else if (repeatMode === "list") {
    currentTrack = (currentTrack + 1) % trackData.length;
    playTrack(currentTrack);
    console.log("🔁 Avance automático en lista");
  } else {
    restaurarDiscoBase(); // ✅ Restaurar disco base al finalizar sin repetición
    console.log("⏹ Fin de pista sin repetición");
  }
});

// ===============================
// ⏸ Evento al pausar manualmente
// ===============================
audio.addEventListener("pause", () => {
  iconPause.classList.add("hidden");
  iconPlay.classList.remove("hidden");

  restaurarDiscoBase(); // ✅ Restaurar disco base al pausar
});
    
// ===============================
// 🎛️ BOTÓN MENU — MODAL ✓
// ===============================
const menuBtn = document.getElementById("btn-menu-tracks");
const closeModalBtn = document.getElementById("close-modal");

menuBtn?.addEventListener("click", () => {
  if (!trackData || trackData.length === 0) {
    console.warn("📂 No hay pistas para mostrar en el modal");
    return;
  }

  modalTracks.classList.remove("hidden");
  console.log("🎛️ Modal abierto");
});

closeModalBtn?.addEventListener("click", () => {
  modalTracks.classList.add("hidden");
  console.log("❌ Modal cerrado");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalTracks.classList.contains("hidden")) {
    modalTracks.classList.add("hidden");
    console.log("❌ Modal cerrado con ESC");
  }
});

  // ===============================
  // 🔁 BOTÓN PLAY/PAUSE ✓
  // ===============================
  playPauseBtn.addEventListener("click", () => {
    if (!audio.src || currentTrack === null || !trackData[currentTrack]) {
      console.warn("🎧 No hay pista válida cargada");
      return;
    }

    if (audio.paused || audio.ended) {
      audio.play().then(() => {
        iconPlay.classList.add("hidden");
        iconPause.classList.remove("hidden");
      }).catch(err => {
        console.warn("⚠️ Error al reproducir:", err);
      });
    } else {
      audio.pause();
      iconPause.classList.add("hidden");
      iconPlay.classList.remove("hidden");
    }
  });

  // ===============================
// ⏪ BOTÓN REWIND — 1 clic: pista anterior | sostenido: retroceso de 5s ✓
// ===============================
let rewindHoldTimer = null;

prevBtn?.addEventListener("mousedown", () => {
  rewindHoldTimer = setTimeout(() => {
    if (!audio.src || currentTrack === null || !trackData[currentTrack]) return;
    audio.currentTime = Math.max(0, audio.currentTime - 5);
    console.log("⏪ Retroceso de 5 segundos (clic sostenido)");
  }, 600); // Tiempo de activación sostenida
});

prevBtn?.addEventListener("mouseup", () => {
  clearTimeout(rewindHoldTimer);
});

prevBtn?.addEventListener("click", () => {
  if (!trackData || trackData.length === 0 || currentTrack === null) return;
  currentTrack = (currentTrack - 1 + trackData.length) % trackData.length;
  playTrack(currentTrack);
  console.log("⏮ Cambio a pista anterior (clic simple)");
});
  
  // ===============================
// ⏭ BOTÓN FORWARD ✓
// ===============================
let forwardClickCount = 0;
let forwardClickTimer = null;

nextBtn?.addEventListener("click", () => {
  forwardClickCount++;

  if (forwardClickCount === 1) {
    forwardClickTimer = setTimeout(() => {
      // 🟢 Acción de 1 clic: ir a pista siguiente
      if (!trackData || trackData.length === 0 || currentTrack === null) return;
      currentTrack = (currentTrack + 1) % trackData.length;
      playTrack(currentTrack);
      console.log("⏭ Cambio a pista siguiente:", trackData[currentTrack].name);
      forwardClickCount = 0;
    }, 300);
  }

  if (forwardClickCount === 2) {
    clearTimeout(forwardClickTimer);
    forwardClickCount = 0;

    // 🟢 Acción de doble clic: adelantar 10 segundos
    if (!audio.src || currentTrack === null || !trackData[currentTrack]) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    console.log("⏩ Avance de 10 segundos");
  }
});

// ===============================
// 🔁 BOTÓN REPEAT — 1 clic: repetir pista | 2 clics o clic sostenido: repetir lista ✓
// ===============================
const repeatBtn = document.getElementById("repeat-button");

let repeatMode = "none"; // Modos posibles: "none", "track", "list"
let repeatClickCount = 0;
let repeatClickTimer = null;

// 🌀 Detectar clic sostenido
let holdTimer = null;
repeatBtn?.addEventListener("mousedown", () => {
  holdTimer = setTimeout(() => {
    repeatMode = "list";
    console.log("🔁 Modo: repetir lista completa");
    repeatBtn.classList.add("repeat-list");
  }, 600); // Sostenido por 600ms activa modo lista
});

repeatBtn?.addEventListener("mouseup", () => {
  clearTimeout(holdTimer);
});

repeatBtn?.addEventListener("click", () => {
  repeatClickCount++;

  if (repeatClickCount === 1) {
    repeatClickTimer = setTimeout(() => {
      // 🟢 Acción de 1 clic: repetir pista actual
      repeatMode = "track";
      console.log("🔂 Modo: repetir pista actual");
      repeatBtn.classList.remove("repeat-list");
      repeatBtn.classList.add("repeat-track");
      repeatClickCount = 0;
    }, 300);
  }

  if (repeatClickCount === 2) {
    clearTimeout(repeatClickTimer);
    repeatClickCount = 0;

    // 🟢 Acción de doble clic: repetir lista
    repeatMode = "list";
    console.log("🔁 Modo: repetir lista completa");
    repeatBtn.classList.remove("repeat-track");
    repeatBtn.classList.add("repeat-list");
  }
});

// ===============================
// 🎯 Evento al terminar la pista (actualizado)
// ===============================
audio.addEventListener("ended", () => {
  iconPause.classList.add("hidden");
  iconPlay.classList.remove("hidden");

  if (repeatMode === "track") {
    audio.currentTime = 0;
    audio.play();
    console.log("🔂 Repetición automática de pista");
  } else if (repeatMode === "list") {
    currentTrack = (currentTrack + 1) % trackData.length;
    playTrack(currentTrack);
    console.log("🔁 Avance automático en lista");
  } else {
    discImg.src = "assets/Vinyl-Disc-FX.png";

    console.log("⏹ Fin de pista sin repetición");
  }
});

// ===============================
// 🔀 BOTÓN SHUFFLE ✓
// ===============================

    shuffleBtn?.addEventListener("click", () => {
  if (!Array.isArray(trackData) || trackData.length < 2) {
    console.warn("🔀 No hay suficientes pistas para mezclar");
    return;
  }

  // Mezclar el array de pistas usando Fisher-Yates
  for (let i = trackData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trackData[i], trackData[j]] = [trackData[j], trackData[i]];
  }

  // Reiniciar desde la primera pista mezclada
  currentTrack = 0;
  playTrack(currentTrack);

  // Regenerar visuales del modal
  trackList.innerHTML = "";
  trackData.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = track.name;
    li.classList.add("modal-track-item");
    li.setAttribute("data-index", index);
    li.addEventListener("click", () => {
      playTrack(index, false);
      modalTracks.classList.add("hidden");
    });
    trackList.appendChild(li);
  });

  console.log("🔀 Lista mezclada. Nueva danza iniciada.");
});

  // ===============================
  // 🎯 Sincronización visual con eventos del audio
  // ===============================
  audio.addEventListener("play", () => {
    iconPlay.classList.add("hidden");
    iconPause.classList.remove("hidden");
  });

  audio.addEventListener("pause", () => {
    iconPause.classList.add("hidden");
    iconPlay.classList.remove("hidden");
  });

  audio.addEventListener("ended", () => {
    iconPause.classList.add("hidden");
    iconPlay.classList.remove("hidden");
  });
});

// ===============================
// 🌌 PARTÍCULAS ✓
// ===============================
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
const container = document.getElementById("reproductor-rick");

function resizeCanvas() {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const particlesArray = [];

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 5 + 1;
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 3 - 1.5;
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.size > 0.2) this.size -= 0.1;
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
}

function handleParticles() {
  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
    particlesArray[i].draw();
    if (particlesArray[i].size <= 0.2) {
      particlesArray.splice(i, 1);
      i--;
    }
  }
}

function createParticles() {
  if (particlesArray.length < 100) {
    particlesArray.push(new Particle());
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleParticles();
  createParticles();
  requestAnimationFrame(animateParticles);
}

animateParticles();
