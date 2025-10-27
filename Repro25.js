let currentTrack = 0;
let isPlaying = false;
let playlist = [];
let emisora = '';
let modo = localStorage.getItem('modoRepro') || 'local';

const audio = document.getElementById('audioStreaming');
const caratula = document.querySelector('.caratula img');
const titulo = document.querySelector('.titulo');
const artista = document.querySelector('.artista');
const album = document.querySelector('.album');
const radio = document.querySelector('.radio');
const playBtn = document.querySelector('.play img');
const btnPlay = document.querySelector('.play');
const btnPrev = document.querySelector('.prev');
const btnNext = document.querySelector('.next');
const shuffleBtn = document.querySelector('.shuffle');
const btnMenu = document.querySelector('.menu');
const streamDiv = document.getElementById('Streaming');

// 🔓 Desbloqueo ceremonial por gesto humano (una sola vez)
function desbloquearMutePorGesto() {
  if (audio && audio.muted) {
    audio.muted = false;
    audio.play().then(() => {
      console.log('[ALEXIA] Reproducción activada tras gesto humano');
    }).catch(err => {
      console.warn('[ALEXIA] Error al reproducir tras gesto humano:', err);
    });
  }

  document.removeEventListener('click', desbloquearMutePorGesto);
  document.removeEventListener('touchstart', desbloquearMutePorGesto);
  document.removeEventListener('mousemove', desbloquearMutePorGesto);
  document.removeEventListener('scroll', desbloquearMutePorGesto);
}

// 🪄 Invocación simbólica al gesto humano
document.addEventListener('click', desbloquearMutePorGesto, { once: true });
document.addEventListener('touchstart', desbloquearMutePorGesto, { once: true });
document.addEventListener('mousemove', desbloquearMutePorGesto, { once: true });
document.addEventListener('scroll', desbloquearMutePorGesto, { once: true });

// Guardar estados al recargar - Inicio
modo = localStorage.getItem('modoRepro') || 'local';

// Cargar JSON y primer track
fetch('https://radio-tekileros.vercel.app/Repro25.json')
  .then(res => res.json())
  .then(data => {
    playlist = data.tracks;
    emisora = data.emisora;
    cargarTrack(currentTrack);

    // 🪄 Activar modo streaming automáticamente (sin reproducción directa)
    if (btnMenu) {
      btnMenu.click();
      console.log('[ALEXIA2] Modo streaming activado por invocación simbólica');
    }

    // 🔓 Paso 2: desbloqueo ceremonial por gesto humano
    document.addEventListener('touchstart', () => {
      btnPlay.click();
    }, { once: true });
  });

// 🧠 Ritual simbólico para activar reproducción tras gesto humano (solo si aún estás en modo local)
function activarReproduccionSimbolica() {
  if (modo === 'local') {
    if (btnMenu) {
      btnMenu.click();
      console.log('[ALEXIA] Modo streaming activado por gesto humano');
    }

    setTimeout(() => {
      if (btnPlay && audio.paused) {
        btnPlay.click();
        console.log('[ALEXIA] Reproducción activada por gesto humano');
      }
    }, 300);
  }

  document.removeEventListener('mousemove', activarReproduccionSimbolica);
  document.removeEventListener('touchstart', activarReproduccionSimbolica);
  document.removeEventListener('scroll', activarReproduccionSimbolica);
}

function desbloqueoAutoplay() {
  if (audio && audio.muted) {
    audio.muted = false;
  }

  audio.play().then(() => {
    isPlaying = true;
    playBtn.src = 'assets/img/btn-pause.png';
    console.log('[ALEXIA] Reproducción desbloqueada por gesto humano');
  }).catch(err => {
    console.warn('[ALEXIA] Autoplay aún bloqueado:', err);
  });
}

// 🎯 Gesto humano directo (solo uno será suficiente)
['click', 'touchstart', 'keydown'].forEach(evento => {
  window.addEventListener(evento, desbloqueoAutoplay, { once: true });
});

// 🔁 Reproducción continua en modo local
audio.addEventListener('ended', () => {
  if (modo === 'local') {
    currentTrack = (currentTrack + 1) % playlist.length;
    cargarTrack(currentTrack);
  }
});

// Cargar track y actualizar visuales ***********************************************
function limpiarMetadatos() {
  caratula.src = 'assets/covers/Cover1.png';
  radio.textContent = '';
  titulo.textContent = '';
  artista.textContent = '';
  album.textContent = '';
}

function cargarTrack(index) {
  limpiarMetadatos();

  const track = playlist[index];
  if (!track || !track.url) {
    console.warn('[LEGADO] Track local no disponible o sin fuente válida');
    audio.src = '';
    radio.textContent = emisora;
    titulo.textContent = 'Título desconocido';
    artista.textContent = 'Artista desconocido';
    album.textContent = 'Álbum desconocido';
    return;
  }

  audio.src = track.url;
  caratula.src = track.cover || 'assets/covers/Cover1.png';

  const partes = track.name.split(' - ');
  const artistaNombre = partes[0]?.trim() || 'Artista desconocido';
  const tituloNombre = partes[1]?.trim() || track.name;

  radio.textContent = emisora;
  titulo.textContent = tituloNombre;
  artista.textContent = artistaNombre;
  album.textContent = track.album || 'Álbum desconocido';

  activarScroll('.titulo-container');
  activarScroll('.artista-container');
  activarScroll('.album-container');

  audio.play().then(() => {
    isPlaying = true;
    playBtn.src = 'assets/img/btn-pause.png';
    console.log('[LEGADO] Reproducción local activada');
  }).catch(err => {
    isPlaying = false;
    playBtn.src = 'assets/img/btn-play.png';
    console.warn('[LEGADO] Reproducción bloqueada por el navegador:', err);
  });
}

// Metadatos Modo Streaming *********************************************************
async function actualizarMetadatos(modo) {
  limpiarMetadatos();

  if (modo === 'local') {
    const track = playlist[currentTrack];
    if (!track) {
      console.warn('[LEGADO] Track local no disponible');
      return;
    }

    caratula.src = track.cover || 'assets/covers/Cover1.png';

    const partes = track.name.split(' - ');
    const artistaNombre = partes[0]?.trim() || 'Artista desconocido';
    const tituloNombre = partes[1]?.trim() || track.name;

    radio.textContent = emisora;
    titulo.textContent = tituloNombre;
    artista.textContent = artistaNombre;
    album.textContent = track.album || 'Álbum desconocido';

    console.log('[LEGADO] Metadatos locales actualizados');
  }

  if (modo === 'streaming') {
    const nombreBusqueda = emisora || 'streaming radio';

    try {
      const responseSpotify = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(nombreBusqueda)}&type=track&limit=1`, {
        headers: {
          Authorization: `Bearer ${spotifyToken}` // ← token válido requerido
        }
      });

      const dataSpotify = await responseSpotify.json();
      const trackSpotify = dataSpotify.tracks?.items?.[0];

      if (trackSpotify) {
        caratula.src = trackSpotify.album?.images?.[0]?.url || 'https://i.postimg.cc/3w29QFHs/Cover1.png';
        radio.textContent = emisora;
        titulo.textContent = trackSpotify.name || 'Título desconocido';
        artista.textContent = trackSpotify.artists?.[0]?.name || 'Artista desconocido';
        album.textContent = trackSpotify.album?.name || 'Álbum desconocido';

        console.log('[LEGADO] Metadatos streaming actualizados desde Spotify');
        return;
      } else {
        throw new Error('No se encontraron datos en Spotify');
      }
    } catch (err) {
      console.warn('[LEGADO] Error al obtener metadatos desde Spotify:', err);
    }

    // Fallback a iTunes si Spotify falla
    try {
      const responseItunes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(nombreBusqueda)}&entity=song&limit=1`);
      const dataItunes = await responseItunes.json();
      const trackItunes = dataItunes.results?.[0];

      if (trackItunes) {
        caratula.src = trackItunes.artworkUrl100?.replace('100x100bb', '600x600bb') || 'assets/covers/Cover1.png';
        radio.textContent = emisora;
        titulo.textContent = trackItunes.trackName || 'Título desconocido';
        artista.textContent = trackItunes.artistName || 'Artista desconocido';
        album.textContent = trackItunes.collectionName || 'Álbum desconocido';

        console.log('[LEGADO] Metadatos streaming actualizados desde iTunes');
        return;
      } else {
        throw new Error('No se encontraron datos en iTunes');
      }
    } catch (err) {
      console.warn('[LEGADO] Error al obtener metadatos desde iTunes:', err);
    }

    // Fallback final si ambas APIs fallan
    caratula.src = 'assets/covers/Cover1.png';
    radio.textContent = emisora;
    titulo.textContent = 'Título desconocido';
    artista.textContent = 'Artista desconocido';
    album.textContent = 'Álbum desconocido';
  }
}

// Activar scroll si desborda --------------------------------------
function activarScroll(selector) {
  const contenedor = document.querySelector(selector);
  const texto = contenedor.querySelector('span');

  texto.style.animation = 'none';
  texto.style.transform = 'translateX(0)';

  setTimeout(() => {
    const desborda = texto.scrollWidth > contenedor.offsetWidth;
    if (desborda) {
      texto.style.animation = 'scroll-left 8s linear infinite';
    }
  }, 50);
}

// Botón Play/Pause *************************************************************
btnPlay.addEventListener('click', () => {
  if (!audio) {
    console.warn('[ALEXIA2] Nodo #audioStreaming no encontrado');
    return;
  }

  if (modo === 'local') {
    if (!audio.src || audio.src === '') {
      const track = playlist[currentTrack];
      audio.src = track.url;
      audio.load();
    }

    if (audio.paused) {
      audio.play().then(() => {
        isPlaying = true;
        playBtn.src = 'assets/img/btn-pause.png';
        actualizarMetadatos(modo);
        console.log('[ALEXIA2] Reproducción local activada');
      }).catch(err => {
        console.warn('[ALEXIA2] Error al reproducir audio local:', err);
      });
    } else {
      audio.pause();
      isPlaying = false;
      playBtn.src = 'assets/img/btn-play.png';
      console.log('[ALEXIA2] Reproducción local pausada');
    }
  }

  if (modo === 'streaming') {
    // No reasignar src si ya está en el HTML
    if (audio.paused) {
      audio.play().then(() => {
        isPlaying = true;
        playBtn.src = 'assets/img/btn-pause.png';
        console.log('[ALEXIA2] Stream activado por botón Play');
      }).catch(err => {
        console.warn('[ALEXIA2] Error al reproducir stream:', err);
      });
    } else {
      audio.pause();
      isPlaying = false;
      playBtn.src = 'assets/img/btn-play.png';
      console.log('[ALEXIA2] Stream detenido por botón Play');
    }
  }
});

// Botones Rewind & Forward
btnPrev.addEventListener('click', () => {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  cargarTrack(currentTrack);
  if (isPlaying) audio.play();
});

btnNext.addEventListener('click', () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  cargarTrack(currentTrack);
  if (isPlaying) audio.play();
});

// Doble clic: ajustar tiempo
btnPrev.addEventListener('dblclick', () => {
  audio.currentTime = Math.max(0, audio.currentTime - 10);
});

btnNext.addEventListener('dblclick', () => {
  audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
});

// Ecualizador miniatura
const canvas = document.getElementById('miniEQ');
const ctx = canvas.getContext('2d');

function drawEQ() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const barWidth = 2;
  const gap = 2;
  const bars = 5;

  for (let i = 0; i < bars; i++) {
    const x = i * (barWidth + gap);
    const height = Math.random() * canvas.height;
    ctx.fillStyle = 'white';
    ctx.fillRect(x, canvas.height - height, barWidth, height);
  }
}
setInterval(drawEQ, 100);

// Botón Shuffle
const btnShuffle = document.querySelector('.shuffle');
let modoShuffle = false;

btnShuffle.addEventListener('click', () => {
  modoShuffle = !modoShuffle;

  const img = btnShuffle.querySelector('img');
  if (modoShuffle) {
    img.style.filter = 'drop-shadow(0 0 6px rgba(0, 186, 255, 0.8))';
    currentTrack = Math.floor(Math.random() * playlist.length);
    cargarTrack(currentTrack);
    console.log('[LEGADO] Shuffle activado');
  } else {
    img.style.filter = 'drop-shadow(0 0 6px rgba(186, 0, 255, 0.8))';
    console.log('[LEGADO] Shuffle desactivado');
  }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOTÓN MENU (Local ↔ Streaming)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function desactivarGlowMenu() {
  const menuImg = btnMenu.querySelector('img');
  if (menuImg) {
    menuImg.style.filter = 'drop-shadow(0 0 6px rgba(186, 0, 255, 0.8))';
  }
}

function activarGlowMenuStreaming() {
  const menuImg = btnMenu.querySelector('img');
  if (menuImg) {
    menuImg.style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 0, 0.8))';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!btnMenu || !audio || !playBtn) {
    console.warn('[LEGADO] Elementos clave no encontrados: btnMenu, audioStreaming o playBtn');
    return;
  }

  btnMenu.addEventListener('click', () => {
    limpiarMetadatos(); // ← limpieza ritual antes de actualizar

    if (modo === 'local') {
      modo = 'streaming';
      bloquearBotonesEnStreaming(); // ← reactiva botones al volver a modo local
      activarGlowMenuStreaming();

      if (!audio.paused && audio.src) {
        audio.pause();
        isPlaying = false;
        playBtn.src = 'assets/img/btn-play.png';
      }

      audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
      audio.load();

      audio.play().then(() => {
        isPlaying = true;
        playBtn.src = 'assets/img/btn-pause.png';
        console.log('[LEGADO] Stream activado directamente');
      }).catch(err => {
        console.warn('[LEGADO] Reproducción bloqueada por navegador:', err);
      });

      if (streamDiv) {
        streamDiv.style.display = 'block';
        streamDiv.innerHTML = '';
      }

      actualizarMetadatos(modo);
      bloquearBotonesEnStreaming(); // ← ahora sí, con modo ya actualizado
      obtenerRadioescuchasDesdeShoutcast(); // ← sincroniza nombre y oyentes desde el servidor

      console.log('[LEGADO] Modo cambiado a streaming');
    } else {
      modo = 'local';
      bloquearBotonesEnStreaming(); // ← reactiva botones al volver a modo local
      desactivarGlowMenu();

      audio.pause();
      isPlaying = false;
      playBtn.src = 'assets/img/btn-play.png';

      const track = playlist[currentTrack];
      if (track && track.url) {
        audio.src = track.url;
        audio.load();
      } else {
        console.warn('[LEGADO] Track local no tiene fuente válida');
      }

      if (streamDiv) {
        streamDiv.innerHTML = '';
        streamDiv.style.display = 'none';
      }

      actualizarMetadatos(modo);
      console.log('[LEGADO] Stream detenido y modo cambiado a local');
    }

    localStorage.setItem('modoRepro', modo);
  });
});

// Efecto visual en botones ======================================================
const botones = document.querySelectorAll('.botonera button');
botones.forEach(boton => {
  boton.addEventListener('click', () => {
    boton.classList.add('efecto-activo');
    setTimeout(() => {
      boton.classList.remove('efecto-activo');
    }, 300);
  });
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESACTIVAR BOTONES EN MODO STREAMING
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function bloquearBotonesEnStreaming() {
  if (modo === 'streaming') {
    btnPrev.disabled = true;
    btnNext.disabled = true;
    shuffleBtn.disabled = true;

    btnPrev.style.opacity = '0.4';
    btnNext.style.opacity = '0.4';
    shuffleBtn.style.opacity = '0.4';
    console.log('[LEGADO] Botones prev, next y shuffle desactivados en modo streaming');
  } else {
    btnPrev.disabled = false;
    btnNext.disabled = false;
    shuffleBtn.disabled = false;

    btnPrev.style.opacity = '1';
    btnNext.style.opacity = '1';
    shuffleBtn.style.opacity = '1';
    console.log('[LEGADO] Botones prev, next y shuffle activados en modo local');
  }
}

// Volumen =======================================================================
const slider = document.getElementById('volumenSlider');
slider.value = 70;
audio.volume = 0.7;

// Fondo visual sincronizado con valor inicial
const porcentaje = `${slider.value}%`;
slider.style.background = `linear-gradient(to right, white ${porcentaje}, transparent ${porcentaje})`;

slider.addEventListener('input', () => {
  const value = slider.value;
  const porcentaje = `${value}%`;
  slider.style.background = `linear-gradient(to right, white ${porcentaje}, transparent ${porcentaje})`;
  audio.volume = value / 100;
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RADIOESCUCHAS + EMISORA STREAMING = Modo Aleatorio
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function generarContadorSimbolico() {
  const numero = Math.floor(Math.random() * 39) + 1;
  const contador = document.getElementById('contadorRadio');
  if (contador) {
    contador.textContent = numero;
  }
  console.log(`[SIMBÓLICO] Radioescuchas simulados: ${numero}`);
}

generarContadorSimbolico();
setInterval(generarContadorSimbolico, 180000); // Cada 3 Minutos
