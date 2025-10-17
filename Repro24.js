document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("audio-player");
  const playPauseBtn = document.getElementById("btn-playpause");
  const playPauseIcon = playPauseBtn?.querySelector("i");
  const marquee = document.querySelector(".marquesina-content");
  const bars = document.querySelectorAll(".bar");
  const cintas = document.querySelectorAll(".cinta");
  const shuffleBtn = document.getElementById("btn-shuffle");
  const rewindBtn = document.getElementById("btn-rwd");
  const forwardBtn = document.getElementById("btn-fwd");

  let playlist = [];
  let currentIndex = -1;
  let isPlaying = false;
  let isShuffle = false;
  let rwdClickCount = 0;
  let rwdClickTimer = null;
  let fwdClickCount = 0;
  let fwdClickTimer = null;

  // 🔊 Cintas & EQ animación
function toggleBars(active) {
  // EQ Bars
  document.querySelectorAll(".eq-bars").forEach(eq => {
    eq.classList.toggle("eq-active", active);
  });

  // Cintas
  document.querySelectorAll(".cinta").forEach(cinta => {
    cinta.classList.toggle("cinta-activa", active);
  });
}
  
  // 🎛️ Icono play/pause
  function updatePlayIcon() {
    if (!playPauseIcon) return;
    playPauseIcon.classList.toggle("fa-play", !isPlaying);
    playPauseIcon.classList.toggle("fa-pause", isPlaying);
  }

  // 🪞 Marquesina
function updateMarquee(track) {
  const content = document.querySelector(".marquesina-content");
  if (!content || !track) return;
  content.textContent = `${track.nombre} — ${track.artista} [${track.seccion}]`;
  animateMarquee();
}
  function animateMarquee() {
  const container = document.querySelector(".marquesina");
  const content = document.querySelector(".marquesina-content");
  if (!container || !content) return;

  const contentWidth = content.scrollWidth;
  const containerWidth = container.clientWidth;

  if (contentWidth <= containerWidth) {
    content.style.transform = "translateX(0)";
    return;
  }

  let offset = containerWidth;

  function scroll() {
    offset -= 0.5;
    if (offset < -contentWidth) offset = containerWidth;
    content.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(scroll);
  }

  scroll();
}

  // ▶️ Reproducir pista por índice
  function playTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[index];
    audio.src = track.enlace;
    updateMarquee(track);

    audio.play().then(() => {
      isPlaying = true;
      toggleBars(true);
      updatePlayIcon();
    });

    audio.onended = () => {
      let nextIndex;

      if (isShuffle) {
        do {
          nextIndex = Math.floor(Math.random() * playlist.length);
        } while (nextIndex === currentIndex && playlist.length > 1);
      } else {
        nextIndex = currentIndex + 1;
      }

      if (nextIndex < playlist.length) {
        playTrack(nextIndex);
      } else {
        isPlaying = false;
        updatePlayIcon();
        toggleBars(false);
      }
    };
  }

// Boton Rewind
rewindBtn.addEventListener("click", () => {
  rwdClickCount++;

  if (rwdClickCount === 1) {
    rwdClickTimer = setTimeout(() => {
      // 🕹️ 1 clic: retroceder a la pista anterior
      if (currentIndex > 0) {
        playTrack(currentIndex - 1);
      } else {
        audio.currentTime = 0;
        audio.play();
      }

      rwdClickCount = 0;
    }, 300); // tiempo para detectar doble clic
  } else if (rwdClickCount === 2) {
    clearTimeout(rwdClickTimer);

    // ⏪ 2 clics: retroceder 10 segundos
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    audio.play();

    rwdClickCount = 0;
  }
});

  // 🎮 Botón play/pause
  playPauseBtn.addEventListener("click", () => {
    if (audio.src === "" || currentIndex === -1) {
      playTrack(0);
      return;
    }

    if (audio.paused) {
      audio.play().then(() => {
        isPlaying = true;
        toggleBars(true);
        updatePlayIcon();
      });
    } else {
      audio.pause();
      isPlaying = false;
      toggleBars(false);
      updatePlayIcon();
    }
  });

  // 🔀 Botón Shuffle
  shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;

  // Activación visual
  shuffleBtn.classList.toggle("active", isShuffle);

  // Animación de giro
  shuffleBtn.classList.add("spin");
  setTimeout(() => {
    shuffleBtn.classList.remove("spin");
  }, 400);

  // Activación lógica inmediata
  if (isShuffle && playlist.length > 1) {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } while (nextIndex === currentIndex);
    playTrack(nextIndex);
  }

  console.log("🔀 Shuffle:", isShuffle ? "Activado" : "Desactivado");
});

// Boton Forward
forwardBtn.addEventListener("click", () => {
  fwdClickCount++;

  if (fwdClickCount === 1) {
    fwdClickTimer = setTimeout(() => {
      // ⏩ 1 clic: siguiente pista
      if (currentIndex < playlist.length - 1) {
        playTrack(currentIndex + 1);
      } else {
        audio.currentTime = 0;
        audio.pause();
        isPlaying = false;
        updatePlayIcon();
        toggleBars(false);
      }

      fwdClickCount = 0;
    }, 300); // tiempo para detectar doble clic
  } else if (fwdClickCount === 2) {
    clearTimeout(fwdClickTimer);

    // ⏭️ 2 clics: adelantar 10 segundos
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    audio.play();

    fwdClickCount = 0;
  }
});

  // 📦 Cargar JSON
  fetch("Repro24.json")
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data.hits)) {
        console.warn("⚠️ El JSON no contiene un array válido en 'hits'");
        return;
      }
      playlist = [...data.hits];
    })
    .catch(err => {
      console.error("⚠️ Error al cargar JSON:", err.message);
    });

  // 🧪 Estado inicial
  toggleBars(false);
  updatePlayIcon();
});