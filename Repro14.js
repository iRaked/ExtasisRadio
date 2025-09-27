console.log("🌱 DOM completamente cargado");
document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio-player');
  const playBtn = document.getElementById('play-btn');
  const playIcon = playBtn.querySelector('i');
  const forwardBtn = document.querySelector('.forward-btn');
  const forwardIcon = forwardBtn.querySelector('i');
  const rewindBtn = document.querySelector('.rewind-btn');
  const rewindIcon = rewindBtn.querySelector('i');

  const repeatBtn = document.querySelector('.repeat-btn');
  const repeatIcon = repeatBtn.querySelector('i');

  const volumeIcon = document.getElementById("volumeIcon");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumePercentage = document.getElementById("volumePercentage");

  const playlistBtn = document.getElementById("playlist-btn");
  const playlistIcon = document.querySelector("#playlist-btn i");

  const container = document.querySelector('.lyrics-container');
  const karaokePalette = ['#ff4081', '#00e5ff', '#ffd740', '#69f0ae', '#f50057'];
  let particlePalette = [];
  let movementProfile = { speed: 1.5, size: 3 };

  // 🎛️ Modal Playlist 3.0 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const contenidoBtn = document.getElementById("contenido-btn");
  const contenidoIcon = contenidoBtn.querySelector("i");
  const closePlaylistModal = document.getElementById("close-playlist-modal");
  const modalPlaylistTracks = document.getElementById("modal-playlist-tracks");
  const modalPlaylist = document.getElementById("modal-playlist");

  let playlist = [];
  let currentIndex = 0;
  let lyricsIndex = 0;
  let karaokeStarted = false;
  let animationActive = false;
  let repeatMode = 'none';
  let lastClickTime = 0;
  let splashIntervalId = null;
  let isMuted = false;
  let lastVolume = volumeSlider.value;

  // Cargar playlist desde metadata.json ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  fetch('Repro14.json')
    .then(res => res.json())
    .then(data => {
      playlist = data;
      loadTrack(currentIndex);
    })
    .catch(err => console.error('Error al cargar metadata:', err));

  // 🎨 Normalizar emoción para uso como clase CSS
function normalizarEmocion(emotion) {
  return emotion?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'default';
}

// 🎨 Aplicar clase CSS según emoción
function applyEmotionStyle(emotion) {
  const emotionEl = document.getElementById('track-emotion');
  if (!emotionEl || !emotion) return;

  const normalized = normalizarEmocion(emotion);
  const emotionClass = `emotion-${normalized}`;

  // Limpiar clases anteriores
  emotionEl.classList.forEach(cls => {
    if (cls.startsWith('emotion-')) emotionEl.classList.remove(cls);
  });

  // Aplicar nueva clase
  emotionEl.classList.add(emotionClass);
}

// 🎨 Aplicar estilo visual directo según género
function applyEmotionVisuals(genre) {
  const emotionEl = document.getElementById('track-emotion');
  if (!emotionEl || !genre) return;

  const palette = setEmotionByGenre(genre);
  const primaryColor = palette[0] || '#ff4081';

  emotionEl.style.color = primaryColor;
  emotionEl.style.transition = 'color 0.4s ease';
  emotionEl.style.animation = 'emotionPulse 3s ease-in-out infinite';
}

// 🎨 Paleta de colores por género
function setEmotionByGenre(genre) {
  switch (genre?.toLowerCase()) {
    case "balada": return ['#f5c6aa', '#d8b4e2', '#a0c4ff', '#ffe5b4'];
    case "cuarteto": return ['#ff9800', '#00bcd4', '#e91e63', '#ffeb3b'];
    case "cumbia": return ['#ffeb3b', '#69f0ae', '#ff4081', '#00e5ff'];
    case "pop": return ['#f06292', '#ffd54f', '#81d4fa', '#ce93d8'];
    case "rock": return ['#f44336', '#212121', '#ff0000', '#ff5722'];
    case "reggae": return ['#4caf50', '#ffeb3b', '#f44336'];
    case "regional": return ['#ff7043', '#8d6e63', '#a1887f', '#ffccbc'];
    case "metal": return ['#b0bec5', '#263238', '#ff1744', '#607d8b'];
    case "r&b": return ['#b39ddb', '#ce93d8', '#f3e5f5', '#d1c4e9'];
    case "ska": return ['#ffffff', '#000000'];
    case "rockabilly": return ['#ff1744', '#f50057', '#ff9100', '#00e5ff'];
    default: return ['#ff4081', '#00e5ff', '#ffd740', '#69f0ae', '#f50057'];
  }
}

// 🌀 Perfil de movimiento por género
function getMovementProfile(genre) {
  switch (genre?.toLowerCase()) {
    case "balada": return { speed: 0.5, size: 4 };
    case "cuarteto": return { speed: 1.5, size: 5 };
    case "cumbia": return { speed: 2.5, size: 3 };
    case "pop": return { speed: 2.0, size: 3 };
    case "rock": return { speed: 4.0, size: 2 };
    case "reggae": return { speed: 0.8, size: 4 };
    case "regional": return { speed: 2.0, size: 3 };
    case "metal": return { speed: 3.5, size: 2 };
    case "r&b": return { speed: 1.0, size: 4 };
    case "ska": return { speed: 2.2, size: 3 };
    case "rockabilly": return { speed: 2.2, size: 3 };
    default: return { speed: 1.5, size: 3 };
  }
}

// 🎵 Cargar pista y actualizar metadatos ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function loadTrack(index) {
  const song = playlist[index];
  if (!song) return;

  registrarVisita(song.id);
  document.getElementById('current-track-display').textContent = `${song.title} — ${song.artist}`;

  audio.src = song.dropbox_url;
  document.getElementById('track-title').textContent = song.title;
  document.getElementById('track-artist').textContent = song.artist;
  document.getElementById('track-album').textContent = song.album || 'Álbum desconocido';
  document.getElementById('track-emotion').textContent = song.emotion || 'Emoción no definida';
  document.getElementById('cover-art').src = song.cover;

  karaokeStarted = false;
  animationActive = false;
  lyricsIndex = 0;
  container.innerHTML = '';
  audio.load();

  document.body.classList.remove('skin-activa');

  // 🎨 Activar partículas según género
  particlePalette = setEmotionByGenre(song.genre);
  movementProfile = getMovementProfile(song.genre);
  console.log("🎨 Paleta de partículas:", particlePalette);

  // 🌀 Reiniciar partículas
  if (typeof particlesArray !== "undefined") {
    particlesArray.length = 0;
  }

  // 🌈 Aplicar estilo visual y clase emocional
  applyEmotionStyle(song.emotion);
  applyEmotionVisuals(song.genre);
}

// Visitas ===========================================================================
  function registrarVisita(id) {
    const visitas = JSON.parse(localStorage.getItem('visitas')) || {};
    visitas[id] = (visitas[id] || 0) + 1;
    localStorage.setItem('visitas', JSON.stringify(visitas));
    console.log(`👁️ Visita registrada para ${id}: ${visitas[id]}`);
  }

  // Volumen━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function actualizarVolumen(valor) {
    audio.volume = valor;
    volumeSlider.value = valor;
    volumePercentage.textContent = `${Math.round(valor * 100)}%`;

    const porcentaje = Math.round(valor * 100);
    volumeSlider.style.setProperty('--volume-percent', `${porcentaje}%`);

    if (valor == 0 || isMuted) {
      volumeIcon.className = "fas fa-volume-mute";
    } else if (valor < 0.5) {
      volumeIcon.className = "fas fa-volume-down";
    } else {
      volumeIcon.className = "fas fa-volume-up";
    }
  }

  volumeIcon.addEventListener("click", () => {
    if (!isMuted) {
      lastVolume = volumeSlider.value;
      actualizarVolumen(0);
      isMuted = true;
    } else {
      actualizarVolumen(lastVolume);
      isMuted = false;
    }
  });

  volumeSlider.addEventListener("input", () => {
    isMuted = false;
    actualizarVolumen(parseFloat(volumeSlider.value));
  });

  volumeSlider.addEventListener("keydown", (e) => {
    let current = parseFloat(volumeSlider.value);
    if (e.key === "ArrowUp") {
      e.preventDefault();
      let nuevo = Math.min(current + 0.1, 1);
      actualizarVolumen(nuevo);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      let nuevo = Math.max(current - 0.1, 0);
      actualizarVolumen(nuevo);
    }
  });


// KARAOKE━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Obtiene el ID de la canción actual (puedes adaptar esto según tu sistema)
function getCurrentSongId() {
  if (audio.dataset.songId) {
    return audio.dataset.songId;
  }

  if (Array.isArray(playlist) && playlist[currentIndex] && playlist[currentIndex].title) {
    return playlist[currentIndex].title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-');
  }

  return "i-like-you-mucho"; // Fallback seguro
}

// Carga dinámica de letras desde lyricsTimeline.js
function loadLyrics(songId) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `lyricsRepro14.js`; // ← archivo único que contiene todas las letras

    script.onload = () => {
      console.log("Buscando ID:", songId); // ← esto revela qué clave está buscando el sistema

      if (window.lyricsLibrary && window.lyricsLibrary[songId]) {
        resolve(window.lyricsLibrary[songId]);
      } else {
        reject(`No se encontraron letras para "${songId}"`);
      }
    };

    script.onerror = () => reject("Error al cargar lyricsTimeline.js");
    document.head.appendChild(script);
  });
}

// Karaoke sincronizado con audio.currentTime
function iniciarReproduccion(track) {
  console.log(`▶️ Reproduciendo: ${track.title} - ${track.artist}`);
  // Aquí puedes integrar tu lógica de audio/karaoke
}

// Sincronizar letras
function syncLyrics() {
  if (!Array.isArray(lyricsTimeline) || lyricsTimeline.length === 0) return;

  const now = audio.currentTime;
  console.log(`🎶 Tiempo actual: ${now.toFixed(2)}s — Línea actual: ${lyricsIndex}`);

  while (
    lyricsIndex < lyricsTimeline.length &&
    now >= lyricsTimeline[lyricsIndex].time
  ) {
    const { text } = lyricsTimeline[lyricsIndex];
    if (!text) {
      lyricsIndex++;
      continue;
    }

    const line = document.createElement('p');
    line.classList.add('lyric-line');
    line.style.setProperty('--line-delay', `${lyricsIndex * 0.1}s`);

    const words = text.trim().split(/\s+/);
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.textContent = word + ' ';
      span.style.setProperty('--delay', `${i * 0.2}s`);
      span.style.setProperty('--color', karaokePalette[i % karaokePalette.length]);
      line.appendChild(span);
    });

    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    lyricsIndex++;
  }

  if (!audio.paused && lyricsIndex < lyricsTimeline.length) {
    requestAnimationFrame(syncLyrics);
  } else {
    animationActive = false;
  }
}

// 🎵 PLAY
audio.addEventListener('play', async () => {
  const songId = getCurrentSongId();
  lyricsIndex = 0;

  if (!splashIntervalId) {
    const emotion = normalizarEmocion(playlist[currentIndex]?.emotion);
    splashIntervalId = setInterval(() => {
      lanzarSplashes(emotion);
    }, 8000);
  }

  try {
    lyricsTimeline = await loadLyrics(songId);
  } catch (err) {
    console.warn(err);
    lyricsTimeline = [];
  }

  if (!karaokeStarted) {
    container.innerHTML = '';
    karaokeStarted = true;
  }

  if (!animationActive) {
    animationActive = true;
    requestAnimationFrame(syncLyrics);
  }
});

// ⏸️ PAUSE
audio.addEventListener('pause', () => {
  clearInterval(splashIntervalId);
  splashIntervalId = null;
  console.log('⏸️ Reproducción pausada, splashes detenidos');
});

// 🏁 ENDED
audio.addEventListener('ended', () => {
  clearInterval(splashIntervalId);
  splashIntervalId = null;

  if (repeatMode === 'track') {
    audio.currentTime = 0;
    audio.play();
    console.log('🔁 Repetición de pista actual');
  } else if (repeatMode === 'playlist') {
    currentIndex = (currentIndex + 1) % playlist.length;
    loadTrack(currentIndex);
    audio.play().catch(err => console.error('Error al reproducir siguiente pista:', err));
    console.log(`⏭️ Avanzando a: ${playlist[currentIndex].title}`);
  } else {
    if (currentIndex + 1 < playlist.length) {
      currentIndex++;
      loadTrack(currentIndex);
      audio.play().catch(err => console.error('Error al reproducir siguiente pista:', err));
      console.log(`⏭️ Avanzando a: ${playlist[currentIndex].title}`);
    } else {
      console.log('🏁 Fin de playlist. Reproducción detenida.');
    }
  }
});

// UBICACION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    obtenerCiudad(latitude, longitude);
  }, () => {
    activarMarquesina('Ubicación desconocida');
  });
} else {
  activarMarquesina('Geolocalización no disponible');
}

function obtenerCiudad(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const ciudad = data.address.city || data.address.town || data.address.village || data.address.state || 'Ubicación desconocida';
      activarMarquesina(ciudad);
    })
    .catch(() => activarMarquesina('Error al obtener ubicación'));
}

function activarMarquesina(ciudad) {
  const ciudadElemento = document.getElementById('current-city');
  ciudadElemento.setAttribute('data-text', ciudad);
  ciudadElemento.textContent = ''; // el texto se mostrará por ::before
}

// Contador de Usuarios ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generarContadorSimbolico() {
  const numero = Math.floor(Math.random() * 99) + 1;
  document.getElementById('sonic_listeners').textContent = numero;
}

generarContadorSimbolico();
setInterval(generarContadorSimbolico, 60000);

// ▶️ Botón Play/Pause ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
playBtn.addEventListener('click', () => {
  if (audio.paused) {
    audio.play().then(() => {
      playIcon.classList.replace('fa-play', 'fa-pause');
      playBtn.setAttribute('aria-label', 'Pausar música');
    }).catch(err => console.error('Error al reproducir audio:', err));
  } else {
    audio.pause();
    playIcon.classList.replace('fa-pause', 'fa-play');
    playBtn.setAttribute('aria-label', 'Reproducir música');
  }
});

// Botón Forward ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
forwardBtn.addEventListener('click', () => {
  if (!Array.isArray(playlist) || playlist.length === 0 || currentIndex === null) return;

  if (currentIndex + 1 < playlist.length) {
    currentIndex++;
    loadTrack(currentIndex);
    audio.play().catch(err => console.error('Error al reproducir siguiente pista:', err));
    console.log(`⏭ Cambio a pista siguiente: ${playlist[currentIndex].title}`);
  } else {
    console.log("🚫 Fin de playlist.");
  }

  forwardIcon.classList.add('animate-spin');
  setTimeout(() => forwardIcon.classList.remove('animate-spin'), 600);
});

forwardBtn.addEventListener('dblclick', () => {
  if (!audio.src || currentIndex === null || !playlist[currentIndex]) return;

  audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  forwardIcon.classList.add('animate-spin');
  setTimeout(() => forwardIcon.classList.remove('animate-spin'), 600);
  console.log("⏩ Avance de 10 segundos (doble clic)");
});

// Botón Rewind ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
rewindBtn.addEventListener('click', () => {
  // ⏮ Cambio a pista anterior (clic simple)
  if (!Array.isArray(playlist) || playlist.length === 0 || currentIndex === null) return;

  if (currentIndex - 1 >= 0) {
    currentIndex--;
    loadTrack(currentIndex);
    audio.play().catch(err => console.error('Error al reproducir pista anterior:', err));
    console.log(`⏮ Cambio a pista anterior: ${playlist[currentIndex].title}`);
  } else {
    console.log("🚫 Inicio de playlist.");
  }

  rewindIcon.classList.add('animate-spin');
  setTimeout(() => rewindIcon.classList.remove('animate-spin'), 600);
});

rewindBtn.addEventListener('dblclick', () => {
  // ⏪ Retroceso de 10 segundos (doble clic)
  if (!audio.src || currentIndex === null || !playlist[currentIndex]) return;

  audio.currentTime = Math.max(0, audio.currentTime - 10);
  rewindIcon.classList.add('animate-spin');
  setTimeout(() => rewindIcon.classList.remove('animate-spin'), 600);
  console.log(`⏪ Retroceso de 10 segundos (doble clic) → ${audio.currentTime.toFixed(1)}s`);
});

// Botón Repeat ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
repeatBtn.addEventListener('click', () => {
  const now = Date.now();
  const timeDiff = now - lastClickTime;

  repeatBtn.classList.remove('repeat-track', 'repeat-playlist');
  repeatIcon.classList.remove('animate-spin');

  if (timeDiff < 400) {
    repeatMode = 'playlist';
    audio.loop = false;
    repeatBtn.classList.add('repeat-playlist');
    repeatIcon.className = 'fas fa-sync-alt';
    repeatBtn.setAttribute('aria-label', 'Repetir lista completa');
  } else {
    repeatMode = 'track';
    audio.loop = true;
    repeatBtn.classList.add('repeat-track');
    repeatIcon.className = 'fas fa-redo-alt';
    repeatBtn.setAttribute('aria-label', 'Repetir pista actual');
  }

  repeatIcon.classList.add('animate-spin');
  setTimeout(() => repeatIcon.classList.remove('animate-spin'), 600);
  lastClickTime = now;
});

// BOTON SHUFFLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const shuffleBtn = document.querySelector('.shuffle-btn');
const shuffleIcon = shuffleBtn.querySelector('i');

let isShuffled = false;
let originalPlaylist = [];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

shuffleBtn.addEventListener('click', () => {
  shuffleIcon.classList.add('animate-spin');
  setTimeout(() => shuffleIcon.classList.remove('animate-spin'), 600);

  const currentTrack = playlist[currentIndex];

  if (!isShuffled) {
    originalPlaylist = [...playlist];
    const remainingTracks = playlist.filter((_, i) => i !== currentIndex);
    const shuffled = shuffleArray(remainingTracks);
    playlist = [currentTrack, ...shuffled];
    currentIndex = 0;
    isShuffled = true;
    shuffleBtn.classList.add('shuffle-active');
    console.log('🔀 Playlist aleatoria activada (sin cambiar canción actual)');
  } else {
    playlist = [...originalPlaylist];
    currentIndex = playlist.findIndex(track => track.dropbox_url === currentTrack.dropbox_url);
    isShuffled = false;
    shuffleBtn.classList.remove('shuffle-active');
    console.log('🔁 Playlist restaurada al orden original (sin cambiar canción actual)');
  }
});

// Botón Playlist━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
contenidoBtn.addEventListener("click", () => {
  contenidoIcon?.classList.add("animate-spin");
  setTimeout(() => contenidoIcon?.classList.remove("animate-spin"), 600);

  if (!Array.isArray(playlist) || playlist.length === 0) {
    console.warn("❌ Playlist vacía o no cargada");
    return;
  }

  modalPlaylistTracks.innerHTML = "";
  const visitas = JSON.parse(localStorage.getItem('visitas')) || {};

  playlist.forEach((track, index) => {
    const li = document.createElement("li");
    li.classList.add("modal-track-item");
    li.innerHTML = `
      <img src="${track.cover}" alt="Carátula" class="track-cover" />
      <div class="track-info">
        <strong>${track.title}</strong><br>
        <span>🎤 ${track.artist}</span><br>
        <span>💿 ${track.album}</span><br>
        <span>⏱️ ${track.duration}</span><br>
        <span>👁️ ${visitas[track.id] || 0}</span>
      </div>
    `;
    li.addEventListener("click", () => {
      currentIndex = index;
      loadTrack(currentIndex);
      audio.play().catch(err => console.error("Error al reproducir:", err));
      modalPlaylist.classList.add("hidden");
    });
    modalPlaylistTracks.appendChild(li);
  });

  modalPlaylist.classList.remove("hidden");
  console.log("🎛️ Modal Playlist abierto desde contenido-btn");
});

closePlaylistModal.addEventListener("click", () => {
  modalPlaylist.classList.add("hidden");
  console.log("❌ Modal Playlist cerrado");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalPlaylist.classList.contains("hidden")) {
    modalPlaylist.classList.add("hidden");
    console.log("❌ Modal Playlist cerrado con ESC");
  }
});

// 🌌 PARTÍCULAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");

  if (!canvas || !ctx) {
    console.warn("⛔ Canvas o contexto no disponible.");
    return;
  }

  canvas.width = 1084;
  canvas.height = 640;

  const particlesArray = [];

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * movementProfile.size + 1;
      this.speedX = (Math.random() * 2 - 1) * movementProfile.speed;
      this.speedY = (Math.random() * 2 - 1) * movementProfile.speed;
      this.color = particlePalette[Math.floor(Math.random() * particlePalette.length)];
      console.log("✨ Partícula creada:", this.x, this.y, this.size, this.color);
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.size > 0.2) this.size -= 0.05;
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    draw() {
  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  console.log("🖌️ Dibujando partícula:", this.x, this.y, this.size, this.color);
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
    const nueva = new Particle();
    particlesArray.push(nueva);
    console.log("✨ Partícula creada con color:", nueva.color);
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleParticles();
  createParticles();
  requestAnimationFrame(animateParticles);
  console.log("🌌 Animando partículas — total:", particlesArray.length);
}

animateParticles();


}); // <<< Cierre del Script