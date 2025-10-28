let currentTrack = 0;
let isPlaying = false;
let modo = localStorage.getItem('modoRepro') || 'local';
let playlist = [];
let emisora = '';
let repeatMode = null;
let shuffleMode = false;

const audio = document.getElementById('audioStreaming');
const btnPlay = document.querySelector('.btn-play');
const btnOnline = document.querySelector('.btn-online');
const playIcon = btnPlay.querySelector('i');
const metaText = document.querySelector('.meta-text');

audio.muted = false;
audio.autoplay = false;

// 🔓 Desbloqueo ceremonial por gesto humano
['click', 'touchstart', 'keydown'].forEach(evento => {
  window.addEventListener(evento, () => {
    if (audio.muted) audio.muted = false;
    audio.play().catch(() => {});
  }, { once: true });
});

// 🎼 Cargar JSON y preparar playlist
fetch('Repro26.json')
  .then(res => res.json())
  .then(data => {
    playlist = data.hits;
    emisora = 'Casino Digital Radio';
    renderPanelDerechoLocal(); // ← activa la visualización de la playlist

    if (modo === 'streaming') {
      audio.src = 'https://technoplayerserver.net:8018/stream?icy=http';
      btnOnline.textContent = 'STREAMING';
      metaText.textContent = '🔴 Transmisión en vivo';
        
      renderPanelDerechoStreaming({
      titulo: 'Transmisión en vivo',
      artista: emisora,
      caratula: 'assets/covers/Cover1.png'
    });

      // 🪄 Gesto humano para activar reproducción en streaming
      ['click', 'touchstart', 'keydown'].forEach(evento => {
        window.addEventListener(evento, () => {
          if (audio.muted) audio.muted = false;
          audio.play().then(() => {
            isPlaying = true;
            playIcon.className = 'fas fa-pause';
            console.log('[ALEXIA] Streaming activado tras gesto humano');
          }).catch(err => {
            console.warn('[ALEXIA] Streaming bloqueado:', err);
          });
        }, { once: true });
      });

    } else {
      btnOnline.textContent = 'MÚSICA';
      cargarTrack(currentTrack);
    }
  });

// 🔁 BOTON STREAMING - Alternar modo STREAMING / MÚSICA
btnOnline.addEventListener('click', () => {
  // 🔄 Alternar modo
  modo = modo === 'local' ? 'streaming' : 'local';
  localStorage.setItem('modoRepro', modo);
  btnOnline.textContent = modo === 'local' ? 'MÚSICA' : 'STREAMING';

  // 🔒 Resetear botones no válidos en modo streaming
  repeatTrack = false;
  shuffleMode = false;

  const repeatBtn = document.querySelector('.btn-repeat');
  const shuffleBtn = document.querySelector('.btn-shuffle');

  repeatBtn.classList.remove('active');
  shuffleBtn.classList.remove('active');

  if (modo === 'streaming') {
    audio.src = 'https://technoplayerserver.net:8018/stream?icy=http';
    audio.load();
    audio.play().then(() => {
      isPlaying = true;
      playIcon.className = 'fas fa-pause';
      metaText.textContent = '🔴 Transmisión en vivo';
    }).catch(err => {
      console.warn('[ALEXIA] Streaming bloqueado:', err);
    });

    renderPanelDerechoStreaming({
      titulo: 'Transmisión en vivo',
      artista: emisora,
      caratula: 'assets/covers/Cover1.png'
    });

  } else {
    cargarTrack(currentTrack);
    renderPanelDerechoLocal();
    console.log('[ALEXIA] Modo local activado: botones reactivables');
  }

  console.log(`[ALEXIA] Modo cambiado a: ${modo}`);
});

// 🎧 Cargar track local
function cargarTrack(index) {
  const track = playlist[index];
  if (!track || !track.enlace) return;
    
  actualizarCaratula(track.caratula);
  audio.src = track.enlace;
  audio.load();

  metaText.textContent = `${track.artista} - ${track.nombre}`;

  audio.play().then(() => {
    isPlaying = true;
    playIcon.className = 'fas fa-pause';
  }).catch(err => {
    console.warn('[ALEXIA] Autoplay bloqueado:', err);
  });
}

// Reproducción continua
audio.addEventListener('ended', () => {
  if (modo === 'local') {
    if (repeatTrack) {
      cargarTrack(currentTrack); // 🔂 Repite el mismo
    } else if (shuffleMode) {
      let nextTrack;
      do {
        nextTrack = Math.floor(Math.random() * playlist.length);
      } while (nextTrack === currentTrack && playlist.length > 1);
      currentTrack = nextTrack;
      cargarTrack(currentTrack);
    } else {
      currentTrack++;
      if (currentTrack < playlist.length) {
        cargarTrack(currentTrack);
      } else {
        console.log('[ALEXIA] Playlist finalizada sin repetición');
      }
    }
    renderPanelDerechoLocal();
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ BOTONERA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ BOTÓN PLAY/PAUSE universal
btnPlay.addEventListener('click', () => {
  if (!audio.src || audio.src === '#') {
    audio.src = 'https://technoplayerserver.net:8018/stream?icy=http';
    audio.load();
  }

  if (audio.paused || audio.ended) {
    audio.play().then(() => {
      isPlaying = true;
      playIcon.className = 'fas fa-pause';
      console.log('[ALEXIA] Reproducción iniciada');
    }).catch(err => {
      console.warn('[ALEXIA] Error al reproducir:', err);
    });
  } else {
    audio.pause();
    isPlaying = false;
    playIcon.className = 'fas fa-play';
    console.log('[ALEXIA] Reproducción pausada');
  }
});

//Botón Repeat
const repeatBtn = document.querySelector('.btn-repeat');

repeatBtn.addEventListener('click', () => {
  if (modo !== 'local') {
    console.warn('[ALEXIA] Repeat no disponible en modo streaming');
    repeatTrack = false;
    repeatBtn.classList.remove('active');
    return;
  }

  repeatTrack = !repeatTrack;
  repeatBtn.classList.toggle('active', repeatTrack);
  console.log(`[ALEXIA] Repetición de pista ${repeatTrack ? 'activada' : 'desactivada'}`);
});

// Botón Shuffle
const shuffleBtn = document.getElementById('btnShuffle');

shuffleBtn.addEventListener('click', () => {
  if (modo !== 'local') {
    console.warn('[ALEXIA] Shuffle no disponible en modo streaming');
    shuffleMode = false;
    shuffleBtn.classList.remove('active');
    return;
  }

  shuffleMode = !shuffleMode;
  shuffleBtn.classList.toggle('active', shuffleMode);

  if (shuffleMode) {
    const nextTrack = Math.floor(Math.random() * playlist.length);
    currentTrack = nextTrack;
    cargarTrack(currentTrack);
    renderPanelDerechoLocal();
    console.log('[ALEXIA] Shuffle activado: reproducción aleatoria iniciada');
  } else {
    console.log('[ALEXIA] Shuffle desactivado');
  }
});

// Duración de cada Track ====================================================
const timeDisplay = document.getElementById('timeDisplay');
let timeInterval = null;

// ⏱️ Actualizar visualmente el tiempo
function updateTimeDisplay() {
  const currentTime = Math.floor(audio.currentTime);
  const minutes = String(Math.floor(currentTime / 60)).padStart(2, '0');
  const seconds = String(currentTime % 60).padStart(2, '0');
  timeDisplay.textContent = `${minutes}:${seconds}`;
}

// ▶️ Iniciar contador cuando se reproduce
audio.addEventListener('play', () => {
  clearInterval(timeInterval);
  timeInterval = setInterval(updateTimeDisplay, 1000);
});

// ⏸️ Detener contador cuando se pausa
audio.addEventListener('pause', () => {
  clearInterval(timeInterval);
});

// 🔁 Reiniciar contador al cargar nuevo track
audio.addEventListener('loadedmetadata', () => {
  timeDisplay.textContent = '00:00';
});

// Barra de Volumen
const volumeBar = document.querySelector('.volume-bar');
const volumeIcon = document.getElementById('volumeIcon');

audio.volume = 0.7;
volumeBar.value = 70;
actualizarEstiloVolumen(70);
actualizarIconoVolumen(70);

volumeBar.addEventListener('input', () => {
  const valor = parseInt(volumeBar.value, 10);
  audio.volume = valor / 100;
  actualizarEstiloVolumen(valor);
  actualizarIconoVolumen(valor);
});

function actualizarEstiloVolumen(valor) {
  volumeBar.style.background = `linear-gradient(to right, #d4af37 0%, #d4af37 ${valor}%, #292d38 ${valor}%, #292d38 100%)`;
}

function actualizarIconoVolumen(valor) {
  if (valor === 0) {
    volumeIcon.className = 'fas fa-volume-mute volume-icon';
  } else if (valor < 50) {
    volumeIcon.className = 'fas fa-volume-down volume-icon';
  } else {
    volumeIcon.className = 'fas fa-volume-up volume-icon';
  }
}

// Información de Contacto
const btnContacto = document.getElementById('btnContacto');
const modalContacto = document.getElementById('modalContacto');
const closeModal = modalContacto.querySelector('.close-modal');

btnContacto.addEventListener('click', () => {
  modalContacto.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
  modalContacto.classList.add('hidden');
});

window.addEventListener('click', (e) => {
  if (e.target === modalContacto) {
    modalContacto.classList.add('hidden');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ METADATOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOCAL
function renderPanelDerechoLocal() {
  const panel = document.querySelector('.panel-right');
  panel.innerHTML = ''; // limpiar contenido anterior

  playlist.forEach((track, index) => {
    const bloque = document.createElement('div');
    bloque.className = 'track-block';
    if (index === currentTrack) bloque.classList.add('active');

    bloque.innerHTML = `
      <div class="track-cover"><img src="${track.caratula}" alt="Carátula" /></div>
      <div class="track-meta">
        <div class="track-title">${track.nombre}</div>
        <div class="track-info">
          <span class="track-artist">${track.artista}</span>
          <span class="track-duration">⏱️ ${track.duracion || '--:--'}</span>
        </div>
      </div>
      <div class="track-number">${String(index + 1).padStart(2, '0')}</div>
    `;

    // 🎯 Activar clic en cada bloque
    bloque.addEventListener('click', () => {
      currentTrack = index;
      cargarTrack(currentTrack);
      renderPanelDerechoLocal(); // ← actualiza visualmente el bloque activo
      actualizarCaratula(track.caratula);
    });

    panel.appendChild(bloque);
  });
}

// Activar clic en cada track
panel.querySelectorAll('.track-block').forEach((bloque, index) => {
  bloque.addEventListener('click', () => {
    currentTrack = index;
    cargarTrack(currentTrack);
    renderPanelDerechoLocal(); // ← actualiza visualmente el bloque activo
  });
});

// STREAMING
function renderPanelDerechoStreaming({ titulo, artista, caratula }) {
  const panel = document.querySelector('.panel-right');
  panel.innerHTML = ''; // limpiar
  actualizarCaratula(caratula);

  const bloque = document.createElement('div');
  bloque.className = 'track-block active';

  bloque.innerHTML = `
    <div class="track-cover"><img src="${caratula}" /></div>
    <div class="track-meta">
      <div class="track-title">${titulo}</div>
      <div class="track-info">
        <span class="track-artist">${artista}</span>
        <span class="track-duration">LIVE</span>
      </div>
    </div>
    <div class="track-number">🔴</div>
  `;

  panel.appendChild(bloque);
}

function actualizarCaratula(caratulaURL) {
  const coverImg = document.querySelector('.cover-img');
  if (!coverImg) return;

  const urlValida = typeof caratulaURL === 'string' && caratulaURL.trim() !== '';
  coverImg.src = urlValida ? caratulaURL : 'assets/covers/Cover1.png';
}