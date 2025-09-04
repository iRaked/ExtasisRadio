document.addEventListener("DOMContentLoaded", () => {
  // 🎶 Elementos del sistema
  const audio = document.getElementById("audio-player");
  const playPauseBtn = document.getElementById("btn-play-pause");
  const prevBtn = document.getElementById("prev-button");
  const nextBtn = document.getElementById("next-button");
  const iconPlay = playPauseBtn.querySelector(".icon-play");
  const iconPause = playPauseBtn.querySelector(".icon-pause");
  // 🎯 Elementos clave del modal
  const menuBtn = document.getElementById("btn-menu-tracks");
  const modalTracks = document.getElementById("modal-tracks");
  const closeModal = document.getElementById("close-modal");
  const trackList = document.querySelector(".track-list");
  const currentTrackName = document.getElementById("current-track-name");
  const discImg = document.querySelector(".disc-img");
  const nameDisplay = document.querySelector(".repro-name");
  const idDisplay = document.querySelector(".repro-id");

  let currentTrack = 0;
  let trackData = [];
    
  // ===============================
  // 📂 ABRIR MODAL
  // ===============================
  if (menuBtn && modalTracks) {
    menuBtn.addEventListener("click", () => {
      modalTracks.classList.remove("hidden");
    });
  }

  // ===============================
  // ❌ CERRAR MODAL
  // ===============================
  if (closeModal && modalTracks) {
    closeModal.addEventListener("click", () => {
      modalTracks.classList.add("hidden");
    });
  }

  // ===============================
  // 🎼 Cargar metadata externa
  // ===============================
  fetch('metadata.json')
    .then(res => res.json())
    .then(data => {
      trackData = data;

      // Generar lista en el modal
      trackList.innerHTML = '';
      trackData.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = track.name;
        li.setAttribute('data-index', index);
        li.addEventListener('click', () => {
          playTrack(index);
          modalTracks.classList.add('hidden');
        });
        trackList.appendChild(li);
      });

      // Auto-play inicial (solo si hay interacción previa)
      document.body.addEventListener("click", () => {
        playTrack(0);
      }, { once: true });
    });

  // ===============================
  // 🎧 Reproducir pista
  // ===============================
  function playTrack(input) {
    let track;

    if (typeof input === "number") {
      currentTrack = input;
      track = trackData[input];
    } else if (typeof input === "object") {
      currentTrack = input.index;
      track = input;
    }

    if (!track) return;

    audio.src = track.url;
    audio.play().catch(err => {
      console.warn("Autoplay bloqueado:", err);
    });

    if (currentTrackName) currentTrackName.textContent = track.name;
    if (discImg) discImg.src = track.cover;

    const modalTrackName = document.getElementById("modal-track-name");
    if (modalTrackName) modalTrackName.textContent = track.name;

    window.currentTrackIndex = currentTrack;
  }

  // ===============================
  // ⏮ Botón Previous
  // ===============================
  function previousTrack() {
    currentTrack = (currentTrack - 1 + trackData.length) % trackData.length;
    playTrack(currentTrack);
  }

  prevBtn?.addEventListener("click", previousTrack);

  // ===============================
  // ⏩ Botón Next
  // ===============================
  function nextSong() {
    currentTrack = (currentTrack + 1) % trackData.length;
    playTrack(currentTrack);
    updateUI(currentTrack);
    pulseForwardButton();
  }

  function updateUI(index) {
    document.querySelectorAll('.track-card').forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });
  }

  function pulseForwardButton() {
    const btn = document.getElementById('next-button');
    btn.classList.add('pulse');
    setTimeout(() => btn.classList.remove('pulse'), 300);
  }

  // ===============================
  // 🔁 Botón Repeat
  // ===============================
  const repeatBtn = document.querySelector(".btn-repeat");
  let repeatMode = 0;

  repeatBtn?.addEventListener("click", () => {
    repeatMode = (repeatMode + 1) % 3;

    switch (repeatMode) {
      case 0:
        audio.loop = false;
        audio.removeEventListener("ended", repeatPlaylist);
        repeatBtn.classList.remove("repeat-track", "repeat-list");
        break;
      case 1:
        audio.loop = true;
        repeatBtn.classList.add("repeat-track");
        repeatBtn.classList.remove("repeat-list");
        break;
      case 2:
        audio.loop = false;
        audio.addEventListener("ended", repeatPlaylist);
        repeatBtn.classList.add("repeat-list");
        repeatBtn.classList.remove("repeat-track");
        break;
    }
  });

  function repeatPlaylist() {
    currentTrack = (currentTrack + 1) % trackData.length;
    playTrack(currentTrack);
  }

  // ===============================
  // ⏪ Botón Rewind doble clic
  // ===============================
  let rewindClicks = 0;
  let rewindTimer;

  prevBtn?.addEventListener("click", () => {
    rewindClicks++;

    if (rewindClicks === 1) {
      audio.currentTime = Math.max(0, audio.currentTime - 5);
      rewindTimer = setTimeout(() => {
        rewindClicks = 0;
      }, 400);
    }

    if (rewindClicks === 2) {
      clearTimeout(rewindTimer);
      rewindClicks = 0;
      previousTrack();
    }
  });
});

  // ===============================
  // ⏩ BOTÓN FORWARD
  // ===============================
  function nextSong() {
    const playlist = getCurrentPlaylist();
    const currentIndex = getCurrentTrackIndex();

    if (isShuffleOn) {
      playNextShuffledTrack();
    } else {
      const nextIndex = (currentIndex + 1) % playlist.length;
      const nextTrack = playlist[nextIndex];
      playTrack(nextTrack);
      updateUI(nextIndex);
    }

    pulseForwardButton();
  }

  function getCurrentTrackIndex() {
    // Devuelve el índice actual desde el estado global o local
    return window.currentTrackIndex || 0;
  }

  function updateUI(index) {
    // Actualiza el aura, el avatar, el título, etc.
    document.querySelectorAll('.track-card').forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });
  }

  function pulseForwardButton() {
    const btn = document.getElementById('next-button');
    btn.classList.add('pulse');
    setTimeout(() => btn.classList.remove('pulse'), 300);
  }

  // ===============================
  // 🔀 BOTÓN SHUFFLE
  // ===============================

  

  // ===============================
  // 🔁 BOTÓN PLAY/PAUSE
  // ===============================
  playPauseBtn.addEventListener("click", () => {
  if (audio.paused || audio.ended) {
    audio.play(); // 🔊 Reproduce si está pausado o terminó
  } else {
    audio.pause(); // ⏸️ Pausa si está reproduciendo
  }
});


// ===============================
// 🌌 PARTÍCULAS
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

// ===============================
// ▶️ MODAL?
// ===============================

let trackUrls = [];
let trackNames = [];
let trackCovers = [];

fetch('metadata.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(track => {
      trackUrls.push(track.url);
      trackNames.push(track.name);
      trackCovers.push(track.cover);
    });

    // Actualiza el sistema con el primer track
    playTrack(0);
    updateTrackName(0);
    updateCover(0);
  });

function playTrack(index) {
  currentTrack = index;
  audio.src = trackUrls[index];
  
  updateTrackName(index);
  updateCover(index);
}

function updateTrackName(index) {
  if (currentTrackName) {
    currentTrackName.textContent = trackNames[index];
  }
  const modalTrackName = document.getElementById("modal-track-name");
  if (modalTrackName) {
    modalTrackName.textContent = trackNames[index];
  }
}

function updateCover(index) {
  const coverImg = document.getElementById("track-cover");
  if (coverImg) {
    coverImg.src = trackCovers[index];
  }
}