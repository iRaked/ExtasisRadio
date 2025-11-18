// ======== ESTADO GLOBAL (correcciones necesarias) ========
let currentTrack = 0;
let isPlaying = false;
let modo = 'streaming'; // por defecto radio
let playlist = [];
let emisora = 'Casino Digital Radio';
let repeatTrack = false; // ← estaba sin declarar
let shuffleMode = false;

let radioMetaInterval = null;
let lastRadioTitle = '';
let trackHistory = []; // historial ilimitado

const audio = document.getElementById('audioStreaming');
const btnPlay = document.querySelector('.btn-play');
const btnOnline = document.querySelector('.btn-online');
const playIcon = btnPlay.querySelector('i');
const metaText = document.querySelector('.meta-text');
const coverImg = document.querySelector('.cover-img'); // carátula grande del panel izquierdo

audio.muted = false;
audio.autoplay = false;


// ======== HELPERS DE PORTADA (iTunes JSONP con jQuery) ========
function formatArtist(artist) {
  if (!artist) return '';
  artist = artist.toLowerCase().trim();
  if (artist.includes(' &')) artist = artist.substring(0, artist.indexOf(' &'));
  if (artist.includes(' feat')) artist = artist.substring(0, artist.indexOf(' feat'));
  if (artist.includes(' ft.')) artist = artist.substring(0, artist.indexOf(' ft.'));
  return artist;
}

function formatTitle(title) {
  if (!title) return '';
  title = title.toLowerCase().trim();
  if (title.includes('&')) title = title.replace('&', 'and');
  if (title.includes(' (')) title = title.substring(0, title.indexOf(' ('));
  if (title.includes(' ft')) title = title.substring(0, title.indexOf(' ft'));
  return title;
}

function actualizarCaratula(url) {
  if (!coverImg) return;
  const valida = typeof url === 'string' && url.trim() !== '';
  coverImg.src = valida ? url : 'assets/covers/Cover1.png';
}

function obtenerCaratulaDesdeiTunes(artist, title) {
  const hasJQ = typeof window.$ !== 'undefined' && typeof $.ajax !== 'undefined';
  if (!hasJQ) {
    const cover = 'assets/covers/Cover1.png';
    actualizarCaratula(cover);
    guardarEnHistorial(artist, title, cover);
    return;
  }

  const query = encodeURIComponent(`${formatArtist(artist)} ${formatTitle(title)}`.trim());
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: 'jsonp',
    url,
    success: function (data) {
      let cover = 'assets/covers/Cover1.png';
      if (data && data.results && data.results.length >= 1) {
        cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
      }
      actualizarCaratula(cover);
      guardarEnHistorial(artist, title, cover); // ← ahora sí guardamos con la portada correcta
    },
    error: function () {
      const cover = 'assets/covers/Cover1.png';
      actualizarCaratula(cover);
      guardarEnHistorial(artist, title, cover);
    }
  });
}

// ======== POLLING DE METADATOS RADIO ========
function detenerPollingRadio() {
  if (radioMetaInterval) clearInterval(radioMetaInterval);
  radioMetaInterval = null;
  lastRadioTitle = '';
}

function iniciarPollingRadio() {
  detenerPollingRadio();

  const radioUrl = 'https://technoplayerserver.net:8018/currentsong?sid=1';
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function actualizarMeta() {
    try {
      const res = await fetch(proxyUrl, { cache: 'no-cache' });
      const raw = await res.text();

      const cleaned = raw.trim()
        .replace(/AUTODJ/gi, '')
        .replace(/\|\s*$/g, '')
        .trim();

      if (!cleaned || cleaned.toLowerCase().includes('offline')) {
        metaText.textContent = 'Datos bloqueados';
        renderPanelDerechoStreaming({
          titulo: 'Transmisión en vivo',
          artista: emisora
        });
        actualizarCaratula('assets/covers/Cover1.png');
        return;
      }

      if (cleaned === lastRadioTitle) return;
      lastRadioTitle = cleaned;

      const split = cleaned.split(/ - | – /);
      let artista = emisora;
      let titulo = cleaned;

      if (split.length >= 2) {
        artista = split[0].trim();
        titulo = split.slice(1).join(' - ').trim();
      }

      metaText.textContent = `${artista} - ${titulo}`;

      // Portada dinámica (actualiza coverImg global)
      obtenerCaratulaDesdeiTunes(artista, titulo);

      // Alimenta historial con portada incluida
      const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const cover = coverImg ? coverImg.src : 'assets/covers/Cover1.png';
      const newEntry = { artist: artista, title: titulo, time, cover };

      if (trackHistory.length === 0 || trackHistory[0].title !== titulo) {
        trackHistory.unshift(newEntry);
      }

      // Render panel derecho con metadatos + historial
      renderPanelDerechoStreaming({ titulo, artista });
    } catch (err) {
      console.warn('[ALEXIA] Error al obtener metadatos:', err);
    }
  }

  // Primera carga inmediata + interval
  actualizarMeta();
  radioMetaInterval = setInterval(actualizarMeta, 10000);
}

// ======== INICIALIZACIÓN DE PLAYLIST LOCAL ========
fetch('Repro26.json')
  .then(res => res.json())
  .then(data => {
    playlist = data.hits || [];
    if (modo === 'streaming') {
      audio.src = 'https://technoplayerserver.net:8018/stream?icy=http';
      btnOnline.textContent = 'STREAMING';
      metaText.textContent = '🔴 Transmisión en vivo';
      actualizarCaratula('assets/covers/Cover1.png'); // limpieza al entrar a radio
      iniciarPollingRadio();
    } else {
      btnOnline.textContent = 'MÚSICA';
      renderPanelDerechoLocal();
      cargarTrack(currentTrack);
    }
  });


// ======== ALTERNANCIA DE MODO ========
btnOnline.addEventListener('click', () => {
  modo = modo === 'local' ? 'streaming' : 'local';
  btnOnline.textContent = modo === 'local' ? 'MÚSICA' : 'STREAMING';

  // Reset controles
  repeatTrack = false;
  shuffleMode = false;
  document.querySelector('.btn-repeat')?.classList.remove('active');
  document.querySelector('.btn-shuffle')?.classList.remove('active');

  if (modo === 'streaming') {
    // Limpieza visual/caratula
    actualizarCaratula('assets/covers/Cover1.png');

    // Fuente y reproducción
    audio.pause();
    audio.src = 'https://technoplayerserver.net:8018/stream?icy=http';
    audio.load();
    audio.play().then(() => {
      isPlaying = true;
      playIcon.className = 'fas fa-pause';
      metaText.textContent = '🔴 Transmisión en vivo';
    }).catch(err => console.warn('[ALEXIA] Streaming bloqueado:', err));

    // Metadatos y panel
    iniciarPollingRadio();

  } else {
    // Salir de radio: detener polling y limpiar panel
    detenerPollingRadio();

    audio.pause();
    renderPanelDerechoLocal();

    // Cargar track actual y su carátula local
    cargarTrack(currentTrack);
  }

  console.log(`[ALEXIA] Modo cambiado a: ${modo}`);
});


// ======== PLAY/PAUSE UNIVERSAL ========
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


// ======== BOTONES REPEAT Y SHUFFLE (MODO LOCAL) ========
const repeatBtn = document.getElementById('btnRepeat');
const shuffleBtn = document.getElementById('btnShuffle');

// Función Repeat
repeatBtn.addEventListener('click', () => {
  if (modo !== 'local') {
    console.warn('[ALEXIA] Repeat no disponible en modo streaming');
    repeatTrack = false;
    repeatBtn.classList.remove('active-glow');
    return;
  }

  repeatTrack = !repeatTrack;
  if (repeatTrack) {
    repeatBtn.classList.add('active-glow');   // Glow dorado
    console.log('[ALEXIA] Repetición activada');
  } else {
    repeatBtn.classList.remove('active-glow');
    console.log('[ALEXIA] Repetición desactivada');
  }
});

// Función Shuffle
shuffleBtn.addEventListener('click', () => {
  if (modo !== 'local') {
    console.warn('[ALEXIA] Shuffle no disponible en modo streaming');
    shuffleMode = false;
    shuffleBtn.classList.remove('active-glow');
    return;
  }

  shuffleMode = !shuffleMode;
  if (shuffleMode) {
    shuffleBtn.classList.add('active-glow');  // Glow dorado
    console.log('[ALEXIA] Shuffle activado');

    // Inicia reproducción aleatoria inmediatamente
    let nextTrack;
    do {
      nextTrack = Math.floor(Math.random() * playlist.length);
    } while (nextTrack === currentTrack && playlist.length > 1);

    currentTrack = nextTrack;
    cargarTrack(currentTrack);
    renderPanelDerechoLocal();
  } else {
    shuffleBtn.classList.remove('active-glow');
    console.log('[ALEXIA] Shuffle desactivado');
  }
});



// ======== LOCAL: CARGA Y RENDER ========
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

audio.addEventListener('ended', () => {
  if (modo === 'local') {
    if (repeatTrack) {
      cargarTrack(currentTrack);
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

function renderPanelDerechoLocal() {
  const panel = document.querySelector('.panel-right');
  if (!panel) return;
  panel.innerHTML = '';

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

    bloque.addEventListener('click', () => {
      currentTrack = index;
      cargarTrack(currentTrack);
      renderPanelDerechoLocal();
    });

    panel.appendChild(bloque);
  });
}


// ======== STREAMING: PANEL DERECHO + HISTORIAL ========
function renderPanelDerechoStreaming({ titulo, artista }) {
  const panel = document.querySelector('.panel-right');
  if (!panel) return;
  panel.innerHTML = '';

  // Bloque activo (pista en vivo)
  const bloqueActual = document.createElement('div');
  bloqueActual.className = 'track-block active';
  bloqueActual.innerHTML = `
    <div class="track-cover">
      <img src="${coverImg ? coverImg.src : 'assets/covers/Cover1.png'}" alt="Carátula" />
    </div>
    <div class="track-meta">
      <div class="track-title">${titulo}</div>
      <div class="track-info">
        <span class="track-artist">${artista}</span>
        <span class="track-duration">LIVE</span>
      </div>
    </div>
    <div class="track-number">🔴</div>
  `;
  panel.appendChild(bloqueActual);

  // Historial completo debajo (sin límite) con mini carátulas reales
  if (trackHistory.length > 0) {
    trackHistory.forEach((entry, index) => {
      const bloqueHist = document.createElement('div');
      bloqueHist.className = 'track-block';
      bloqueHist.innerHTML = `
        <div class="track-cover">
          <img src="${entry.cover || 'assets/covers/Cover1.png'}" alt="Historial" />
        </div>
        <div class="track-meta">
          <div class="track-title">${entry.title}</div>
          <div class="track-info">
            <span class="track-artist">${entry.artist}</span>
            <span class="track-duration">${entry.time}</span>
          </div>
        </div>
        <div class="track-number">${String(index + 1).padStart(2, '0')}</div>
      `;
      panel.appendChild(bloqueHist);
    });
  }
}

function guardarEnHistorial(artist, title, cover) {
  const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const newEntry = { artist, title, time, cover };

  if (trackHistory.length === 0 || trackHistory[0].title !== title) {
    trackHistory.unshift(newEntry);
  }

  // Render panel derecho con metadatos + historial
  renderPanelDerechoStreaming({ titulo: title, artista: artist });
}


// ======== VOLUMEN INICIAL Y CONTROL ========
const volumeBar = document.querySelector('.volume-bar');
const volumeIcon = document.getElementById('volumeIcon');

// Inicializar volumen en 70%
audio.volume = 0.7;
if (volumeBar) {
  volumeBar.value = 70;
  actualizarEstiloVolumen(70);
  actualizarIconoVolumen(70);
}

// Listener para cambios en la barra
if (volumeBar) {
  volumeBar.addEventListener('input', () => {
    const valor = parseInt(volumeBar.value, 10);
    audio.volume = valor / 100;
    actualizarEstiloVolumen(valor);
    actualizarIconoVolumen(valor);
  });
}

// Función para pintar el gradiente de la barra
function actualizarEstiloVolumen(valor) {
  if (!volumeBar) return;
  volumeBar.style.background = `linear-gradient(to right, #d4af37 0%, #d4af37 ${valor}%, #292d38 ${valor}%, #292d38 100%)`;
}

// Función para cambiar el ícono según nivel
function actualizarIconoVolumen(valor) {
  if (!volumeIcon) return;
  if (valor === 0) {
    volumeIcon.className = 'fas fa-volume-mute volume-icon';
  } else if (valor < 50) {
    volumeIcon.className = 'fas fa-volume-down volume-icon';
  } else {
    volumeIcon.className = 'fas fa-volume-up volume-icon';
  }
}


// 🔓 Desbloqueo universal por primer gesto humano
let gestureDetected = false;

document.addEventListener('click', () => {
  if (!gestureDetected) {
    gestureDetected = true;
    audio.muted = false;

    if (audio.src && audio.paused) {
      audio.play().then(() => {
        playIcon.className = 'fas fa-pause';
        console.log('[ALEXIA] Audio desbloqueado y reproducido');
      }).catch(err => console.warn('[ALEXIA] Error al reproducir tras gesto:', err));
    }
  }
}, { once: true });