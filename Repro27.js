let currentTrack = 0;
let isPlaying = false;
let modo = localStorage.getItem('modoRepro') || 'local';
let playlist = [];
let emisora = 'Casino Digital Radio';
let repeatTrack = false;
let shuffleMode = false;

const audio = document.getElementById('audioStreaming');
const btnPlay = document.getElementById('playPause');
const btnOnline = document.getElementById('plus');
const metadataSpan = document.querySelector('.metadata-marquee span');
const infoSpan = document.querySelector('.info-marquee span');
const coverImg = document.querySelector('.cover-art');

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
fetch('Repro27.json')
  .then(res => res.json())
  .then(data => {
    playlist = data.hits;

    if (modo === 'streaming') {
      activarStreaming();
    } else {
      cargarTrack(currentTrack);
    }
  });

// 🔁 BOTÓN STREAMING - Alternar modo STREAMING / LOCAL
btnOnline.addEventListener('click', () => {
  modo = modo === 'local' ? 'streaming' : 'local';
  localStorage.setItem('modoRepro', modo);

  repeatTrack = false;
  shuffleMode = false;

  if (modo === 'streaming') {
    activarStreaming();
  } else {
    cargarTrack(currentTrack);
  }

  console.log(`[ALEXIA] Modo cambiado a: ${modo}`);
});

// ▶️ BOTÓN PLAY/PAUSE universal
btnPlay.addEventListener('click', () => {
  const playImg = btnPlay.querySelector('img');

  // 🔁 Cambiar imagen inmediatamente según estado actual
  if (!isPlaying) {
    playImg.src = 'assets/img/btn-pause.png';
    isPlaying = true;
    audio.play().then(() => {
      console.log('[ALEXIA] Reproducción iniciada');
    }).catch(err => {
      console.warn('[ALEXIA] Error al reproducir:', err);
      playImg.src = 'assets/img/btn-play.png'; // revertir si falla
      isPlaying = false;
    });
  } else {
    playImg.src = 'assets/img/btn-play.png';
    isPlaying = false;
    audio.pause();
    console.log('[ALEXIA] Reproducción pausada');
  }
});

// 🎧 Cargar track local
function cargarTrack(index) {
  const track = playlist[index];
  if (!track || !track.enlace) return;

  actualizarCaratula(track.caratula);
  audio.src = track.enlace;
  audio.load();

  metadataSpan.textContent = `[${index + 1}] ${track.nombre} — ${track.artista} - ${track.genero || 'Sin género'} - ${track.duracion || '0:00'}`;
  infoSpan.textContent = `Día: ${track.dia || 'Martes'} • Mes: ${track.mes || 'Octubre'} • Año: ${track.anio || '2025'} • Hora: ${track.hora || '00:00'}`;

  audio.play().then(() => {
    isPlaying = true;
  }).catch(err => {
    console.warn('[ALEXIA] Autoplay bloqueado:', err);
  });
}

// 🔴 Activar modo streaming = https://laradiossl.online:12000/stream
function activarStreaming() {
  audio.src = 'https://technoplayerserver.net:8018/stream?icy=http';
  audio.load();

  metadataSpan.textContent = `🔴 Transmisión en vivo — ${emisora}`;
  infoSpan.textContent = `Día: ${getDia()} • Mes: ${getMes()} • Año: ${getAnio()} • Hora: ${getHora()}`;
  actualizarCaratula('assets/covers/Cover1.png');

  audio.play().then(() => {
    isPlaying = true;
    console.log('[ALEXIA] Streaming activado');
  }).catch(err => {
    console.warn('[ALEXIA] Streaming bloqueado:', err);
  });
}

// 🖼️ Actualizar carátula Local
function actualizarCaratula(caratulaURL) {
  if (!coverImg) return;
  const urlValida = typeof caratulaURL === 'string' && caratulaURL.trim() !== '';
  coverImg.src = urlValida ? caratulaURL : 'assets/covers/Cover1.png';
}

// 🕓 Funciones de fecha/hora
setInterval(() => {
  if (modo === 'local' || modo === 'streaming') {
    actualizarFechaHora();
  }
}, 1000);

function actualizarFechaHora() {
  const ahora = new Date();
  const dia = ahora.toLocaleDateString('es-MX', { weekday: 'long' });
  const mes = ahora.toLocaleDateString('es-MX', { month: 'long' });
  const anio = ahora.getFullYear();
  const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  infoSpan.textContent = `Día: ${dia} • Mes: ${mes} • Año: ${anio} • Hora: ${hora}`;
}

// 🔁 Reproducción continua
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
  }
});

// METADATOS STREAMING
let spotifyToken = null;

// Activación
actualizarMetadatosStreaming('Casino Digital Radio');
// Datos del Servidor
// if (modo === 'streaming') {actualizarMetadatosStreaming(`${tituloServidor} ${artistaServidor}`); }


async function obtenerTokenSpotify() {
  const clientId = 'TU_CLIENT_ID';
  const clientSecret = 'TU_CLIENT_SECRET';
  const credenciales = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credenciales}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();
  spotifyToken = data.access_token;
}

// Buscar en Spotify
async function buscarMetadatosSpotify(query) {
  if (!spotifyToken) await obtenerTokenSpotify();

  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
    headers: { Authorization: `Bearer ${spotifyToken}` }
  });

  const data = await res.json();
  const track = data.tracks?.items?.[0];

  if (track) {
    return {
      titulo: track.name,
      artista: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      caratula: track.album.images[0]?.url || null
    };
  }

  return null;
}

// Buscar en iTunes
async function buscarMetadatosiTunes(query) {
  const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
  const data = await res.json();
  const track = data.results?.[0];

  if (track) {
    return {
      titulo: track.trackName,
      artista: track.artistName,
      album: track.collectionName,
      caratula: track.artworkUrl100?.replace('100x100bb', '600x600bb') || null
    };
  }

  return null;
}

// Aplicar Datos
function aplicarMetadatos({ titulo, artista, album, caratula }) {
  document.querySelector('.cover-art').src = caratula || 'assets/covers/Cover1.png';
  document.querySelector('.metadata-marquee span').textContent = `🔴 ${titulo} — ${artista}`;
  document.querySelector('.info-marquee span').textContent = `Álbum: ${album || 'Desconocido'} • Fuente: Streaming`;
}

// Logica Principal
async function actualizarMetadatosStreaming(nombreBusqueda) {
  let resultado = await buscarMetadatosSpotify(nombreBusqueda);

  if (!resultado) {
    console.warn('[LEGADO] Spotify no encontró resultados, intentando iTunes...');
    resultado = await buscarMetadatosiTunes(nombreBusqueda);
  }

  if (!resultado) {
    console.warn('[LEGADO] iTunes tampoco encontró resultados, usando portada local...');
    resultado = {
      titulo: 'Transmisión en vivo',
      artista: 'Casino Digital Radio',
      album: 'Sin datos',
      caratula: null
    };
  }

  aplicarMetadatos(resultado);
}