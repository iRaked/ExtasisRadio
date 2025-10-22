// ===============================
// 🎧 INICIALIZACIÓN GLOBAL
// ===============================
let trackData = [];
let currentTrack = null;

// ===============================
// 📦 CARGA DE PISTAS DESDE JSON
// ===============================
fetch("Repro11.json")
  .then(res => res.json())
  .then(data => {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("❌ No se encontraron pistas");
      return;
    }
    trackData = data;

    // 🌀 Inicialización visual sin reproducción automática
    actualizarCaratula(null, "inicial");
    generarListaModal();

    // 🔒 Reproducción solo se activa desde el botón Play
    console.log("✅ Pistas cargadas. Reproductor listo para activación manual.");
  });

// ===============================
// 🎯 ELEMENTOS CLAVE DEL DOM
// ===============================
const audio = document.getElementById("audio-player");
const discImg = document.querySelector(".disc-img");
const currentTrackName = document.getElementById("current-track-name");
const trackList = document.querySelector(".track-list");
const modalTracks = document.getElementById("modal-tracks");

const btnVideo = document.getElementById('menu-video');
const modal = document.getElementById('video-modal');
const closeBtn = document.getElementById('close-video');
const video = document.getElementById('ritual-video');

const playPauseBtn = document.getElementById("btn-play-pause");
const nextBtn = document.getElementById("next-button");
const prevBtn = document.getElementById("prev-button");
const shuffleBtn = document.getElementById("shuffle-button");
const repeatBtn = document.getElementById("repeat-button");
const menuBtn = document.getElementById("btn-menu-tracks");
const closeModalBtn = document.getElementById("close-modal");

const iconPlay = playPauseBtn.querySelector(".icon-play");
const iconPause = playPauseBtn.querySelector(".icon-pause");

// ===============================
// 🧬 FUNCIÓN CENTRAL DE CARÁTULAS
// ===============================
function actualizarCaratula(track, estado) {
  if (!discImg) return;

  if (estado === "inicial") {
    discImg.src = "assets/covers/Cover-Vinyl-Disc-FX1.png";
    discImg.classList.remove("rotating");
  } else if (estado === "pausado") {
    discImg.src = "assets/covers/Plato.png";
    discImg.classList.remove("rotating");
      discImg.classList.add("rotating", "plato");
  } else if (estado === "reproduciendo" && track?.cover) {
    discImg.src = track.cover;
    discImg.classList.add("rotating");
  } else {
    discImg.src = "assets/covers/Cover1.png";
    discImg.classList.remove("rotating");
  }
}

// ===============================
// ▶️ FUNCIÓN UNIVERSAL DE REPRODUCCIÓN
// ===============================
function activarReproduccion(index, modo = "manual") {
  if (index < 0 || index >= trackData.length) return;

  const track = trackData[index];
  if (!track?.url) return;

  currentTrack = index;
  currentTrackName.textContent = track.name;
  audio.src = track.url;

  audio.play().then(() => {
    iconPlay.classList.add("hidden");
    iconPause.classList.remove("hidden");
    actualizarCaratula(track, "reproduciendo");
    console.log(`▶️ Reproducción (${modo}):`, track.name);
  }).catch(err => {
    console.warn(`❌ Error al reproducir (${modo}):`, err);
  });
}

document.addEventListener("click", () => {
  if (audio.paused && currentTrack !== null) {
    audio.play().catch(err => {
      console.warn("❌ Error al iniciar audio tras clic:", err);
    });
  }
}, { once: true });

// ===============================
// 🧭 INICIALIZACIÓN DEL REPRODUCTOR
// ===============================
function inicializarReproductor() {
  actualizarCaratula(null, "inicial");
  generarListaModal();
  activarReproduccion(0, "inicial");
}

// ===============================
// 📜 GENERACIÓN DE LISTA EN EL MODAL
// ===============================
function generarListaModal() {
  trackList.innerHTML = "";
  trackData.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = track.name;
    li.classList.add("modal-track-item");
    li.setAttribute("data-index", index);
    li.addEventListener("click", () => {
      activarReproduccion(index, "modal");
      modalTracks.classList.add("hidden");
    });
    trackList.appendChild(li);
  });
}

// ===============================
// 🎛️ BOTONERA Y EVENTOS
// ===============================
playPauseBtn.addEventListener("click", () => {
  // 🛡️ Protección contra reproducción sin pista cargada
  if (!audio.src || currentTrack === null) {
    activarReproduccion(0, "manual"); // Activación inicial desde botón
    return;
  }

  if (audio.paused || audio.ended) {
    // 🟢 Reanudar pista actual
    audio.play().then(() => {
      iconPlay.classList.add("hidden");
      iconPause.classList.remove("hidden");
      actualizarCaratula(trackData[currentTrack], "reproduciendo");
      console.log("▶️ Reanudando pista actual");
    }).catch(err => {
      console.warn("⚠️ Error al reanudar:", err);
    });
  } else {
    // ⏸ Pausar sin reiniciar
    audio.pause();
    iconPause.classList.add("hidden");
    iconPlay.classList.remove("hidden");
    actualizarCaratula(trackData[currentTrack], "pausado");
    console.log("⏸ Pausa activada");
  }
});

// ===============================
// ⏭ BOTÓN FORWARD — 1 clic: siguiente pista | 2 clics: +10s
// ===============================
let forwardClickCount = 0;
let forwardClickTimer = null;

nextBtn.addEventListener("click", () => {
  forwardClickCount++;

  if (forwardClickCount === 1) {
    forwardClickTimer = setTimeout(() => {
      const next = (currentTrack + 1) % trackData.length;
      activarReproduccion(next, "next");
      forwardClickCount = 0;
    }, 300); // Tiempo de doble clic
  }

  if (forwardClickCount === 2) {
    clearTimeout(forwardClickTimer);
    forwardClickCount = 0;

    if (!audio.src || currentTrack === null) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    console.log("⏩ Avance de 10 segundos");
  }
});

// ===============================
// ⏮ BOTÓN REWIND — 1 clic: pista anterior | 2 clics: -10s
// ===============================
let rewindClickCount = 0;
let rewindClickTimer = null;

prevBtn.addEventListener("click", () => {
  rewindClickCount++;

  if (rewindClickCount === 1) {
    rewindClickTimer = setTimeout(() => {
      const prev = (currentTrack - 1 + trackData.length) % trackData.length;
      activarReproduccion(prev, "prev");
      rewindClickCount = 0;
    }, 300);
  }

  if (rewindClickCount === 2) {
    clearTimeout(rewindClickTimer);
    rewindClickCount = 0;

    if (!audio.src || currentTrack === null) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    console.log("⏪ Retroceso de 10 segundos");
  }
});

// ===============================
// ⏮ BOTÓN REPEAT — 1 clic: repetir pista | 2 clics: repetir lista
// ===============================
let repeatMode = "none"; // Modos: "none", "track", "list"
let repeatClickCount = 0;
let repeatClickTimer = null;

repeatBtn.addEventListener("click", () => {
  repeatClickCount++;

  if (repeatClickCount === 1) {
    repeatClickTimer = setTimeout(() => {
      repeatMode = "track";
      repeatBtn.style.backgroundColor = "#8e44ad"; // 💜 Morado para repetir pista
      console.log("🔂 Modo: repetir pista actual");
      repeatClickCount = 0;
    }, 300);
  }

  if (repeatClickCount === 2) {
    clearTimeout(repeatClickTimer);
    repeatMode = "list";
    repeatBtn.style.backgroundColor = "#3498db"; // 💙 Azul para repetir lista
    console.log("🔁 Modo: repetir lista completa");
    repeatClickCount = 0;
  }
});


// Boton Shuffle
shuffleBtn.addEventListener("click", () => {
  trackData.sort(() => Math.random() - 0.5);
  generarListaModal();
  activarReproduccion(0, "shuffle");
  shuffleBtn.style.backgroundColor = "#3498db"; // 💙 Azul para modo shuffle
  console.log("🔀 Lista mezclada");
});

// Boton Menu
menuBtn.addEventListener("click", () => modalTracks.classList.remove("hidden"));
closeModalBtn.addEventListener("click", () => modalTracks.classList.add("hidden"));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modalTracks.classList.add("hidden");
});

// ===============================
// BOTON VIDEO + MODAL
// ===============================
btnVideo.addEventListener("click", () => {
  modal.classList.add("active");
  video.currentTime = 0;
  video.play();
  console.log("🎬 Modal de video activado");
});

closeBtn.addEventListener("click", cerrarModalVideo);
modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrarModalVideo();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("active")) {
    cerrarModalVideo();
  }
});

function cerrarModalVideo() {
  modal.classList.remove("active");
  video.pause();
  video.currentTime = 0;
  console.log("🛑 Modal de video cerrado");
}

// ===============================
// WATER FILTER — Activación Crystal Water Adaptado a Video
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  // 🎥 Crear y configurar el video
  const videoElement = document.createElement('video');
  videoElement.src = 'assets/video/Skull.mp4';
  videoElement.autoplay = true;
  videoElement.muted = true;
  videoElement.loop = true;
  videoElement.playsInline = true;
  videoElement.crossOrigin = 'anonymous';
  videoElement.style.display = 'none';
  document.body.appendChild(videoElement);

  // 🧱 Inicializar Pixi
  const app = new PIXI.Application({
    width: 480,
    height: 650,
    transparent: true,
    backgroundAlpha: 0,
  });

  document.getElementById('water-overlay').appendChild(app.view);

  // 🌊 Mapa de desplazamiento
  const displacementTexture = PIXI.Texture.from('https://i.imgur.com/2yYayZk.png');
  const displacementSprite = new PIXI.Sprite(displacementTexture);
  displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  displacementSprite.scale.set(1);
  app.stage.addChild(displacementSprite);

  // 🎥 Video como textura Pixi
  const videoTexture = PIXI.Texture.from(videoElement);
  const videoSprite = new PIXI.Sprite(videoTexture);
  videoSprite.width = app.screen.width;
  videoSprite.height = app.screen.height;
  videoSprite.filters = [new PIXI.filters.DisplacementFilter(displacementSprite)];
  app.stage.addChild(videoSprite);

  // 🖱️ Interacción con el cursor
  app.stage.interactive = true;
  app.stage.on('pointermove', (event) => {
    const pos = event.data.global;
    displacementSprite.x = pos.x;
    displacementSprite.y = pos.y;
  });

  // 🔄 Animación continua
  app.ticker.add(() => {
    displacementSprite.x += 1;
    displacementSprite.y += 1;
  });
});

// ===============================
// 🔁 EVENTOS DEL AUDIO
// ===============================
audio.addEventListener("pause", () => {
  iconPause.classList.add("hidden");
  iconPlay.classList.remove("hidden");
  actualizarCaratula(trackData[currentTrack], "pausado");
});

audio.addEventListener("ended", () => {
  const next = (currentTrack + 1) % trackData.length;
  activarReproduccion(next, "auto");
});

// ===============================
// 🌌 PARTÍCULAS — FONDO VIVO
// ===============================
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
const container = document.getElementById("reproductor-rick");

// 🔁 Ajustar tamaño del canvas al contenedor
function resizeCanvas() {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 🔮 Clase de partícula individual
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

const particlesArray = [];

// 🔁 Manejo de partículas activas
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

// ✨ Generar nuevas partículas
function createParticles() {
  if (particlesArray.length < 100) {
    particlesArray.push(new Particle());
  }
}

// 🔄 Animación continua
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleParticles();
  createParticles();
  requestAnimationFrame(animateParticles);
}
animateParticles();
