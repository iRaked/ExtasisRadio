//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 01 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏰ FECHA Y HORA
document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const nombreDia = dias[now.getDay()];
  const numeroDia = now.getDate();
  const nombreMes = meses[now.getMonth()];
  const año = now.getFullYear();
  const fechaFormateada = `${nombreDia}, ${numeroDia} de ${nombreMes} de ${año}`;
  const fechaElem = document.getElementById('fecha');
  if (fechaElem) fechaElem.textContent = fechaFormateada;

  const reloj = document.getElementById("Clock");
  function actualizarReloj() {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, "0");
    const minutos = String(ahora.getMinutes()).padStart(2, "0");
    const segundos = String(ahora.getSeconds()).padStart(2, "0");
    if (reloj) reloj.textContent = `${horas}:${minutos}:${segundos}`;
  }
  setInterval(actualizarReloj, 1000);
  actualizarReloj();
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 02 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 REPRODUCTOR MODULAR
let playlist = [];
let currentIndex = 0;

const audio = document.getElementById('audio-player');

// 🎶 Cargar pista
function loadTrack(index) {
  const song = playlist[index];
  if (!song) return;

  // 🎧 Actualiza metadatos visuales
  const artistElem = document.querySelector('.artist');
  const trackElem = document.querySelector('.track');
  const albumElem = document.querySelector('.album');

  if (artistElem) artistElem.textContent = song.artist;
  if (trackElem) trackElem.textContent = song.title;
  if (albumElem) albumElem.textContent = song.album || 'Álbum desconocido';

  activarScrollSiNecesario();

  // 🎧 Asigna fuente de audio y portada
  audio.src = song.dropbox_url || '';
  document.querySelector('.cover').style.backgroundImage = song.cover ? `url('${song.cover}')` : '';
  document.querySelector('.main-cover').style.backgroundImage = song.cover ? `url('${song.cover}')` : '';

  audio.load();
}

// 📦 Cargar playlist desde JSON
fetch('Repro16.json')
  .then(res => res.json())
  .then(data => {
    playlist = data;
    console.log(`🎶 Playlist cargada: ${playlist.length} pistas`);
    loadTrack(currentIndex);
  })
  .catch(err => console.error('❌ Error al cargar playlist:', err));

// 🎞️ Activación condicional de metadatos animados
function activarScrollSiNecesario() {
  const scrolling = document.querySelector('.scrolling');
  const meta = document.querySelector('.meta');

  if (scrolling && meta) {
    const necesitaScroll = meta.scrollWidth > scrolling.clientWidth;
    meta.classList.remove('animated'); // reinicia animación
    void meta.offsetWidth;             // fuerza reflow
    meta.classList.toggle('animated', necesitaScroll);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 04 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ BOTONES DE CONTROL
const playBtn = document.getElementById('play-btn');
const playIcon = playBtn.querySelector('i');
const forwardBtn = document.querySelector('.btn-fwd');
const forwardIcon = forwardBtn.querySelector('i');
const rewindBtn = document.querySelector('.btn-rwd');
const rewindIcon = rewindBtn.querySelector('i');

playBtn.addEventListener('click', () => {
  if (audio.src) {
    if (audio.paused) {
      audio.play().then(() => {
        playIcon.classList.remove('fa-play');
        playIcon.classList.add('fa-pause');
        playBtn.setAttribute('aria-label', 'Pausar música');
      }).catch(err => console.error('Error al reproducir audio:', err));
    } else {
      audio.pause();
      playIcon.classList.remove('fa-pause');
      playIcon.classList.add('fa-play');
      playBtn.setAttribute('aria-label', 'Reproducir música');
    }
  } else {
    console.warn("⚠️ No hay pista cargada.");
  }
});

forwardBtn.addEventListener('click', () => {
  if (currentIndex + 1 < playlist.length) {
    currentIndex++;
    loadTrack(currentIndex);
    audio.play().catch(err => console.error('Error al reproducir siguiente pista:', err));
  }
  forwardIcon.classList.add('animate-spin');
  setTimeout(() => forwardIcon.classList.remove('animate-spin'), 600);
});

rewindBtn.addEventListener('click', () => {
  if (currentIndex - 1 >= 0) {
    currentIndex--;
    loadTrack(currentIndex);
    audio.play().catch(err => console.error('Error al reproducir pista anterior:', err));
  }
  rewindIcon.classList.add('animate-spin');
  setTimeout(() => rewindIcon.classList.remove('animate-spin'), 600);
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 04 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔊 CONTROL DE VOLUMEN
const volumeIcon = document.getElementById("volumeIcon");
const volumeSlider = document.getElementById("volumeSlider");
const volumePercentage = document.getElementById("volumePercentage");
let isMuted = false;
let lastVolume = volumeSlider.value;

function actualizarVolumen(valor) {
  audio.volume = valor;
  volumeSlider.value = valor;
  const porcentaje = Math.round(valor * 100);
  volumePercentage.textContent = `${porcentaje}%`;

  // 🎚️ Actualiza barra visual interna (CSS variable)
  volumeSlider.style.setProperty('--volume-percent', `${porcentaje}%`);

  // 🎧 Cambia ícono según nivel
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
    actualizarVolumen(Math.min(current + 0.1, 1));
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    actualizarVolumen(Math.max(current - 0.1, 0));
  }
});

// Visitas ===========================================================================
// 🎧 Actualiza el contador de listeners cada 2 minutos con un número aleatorio
function actualizarListeners() {
  const nuevoValor = Math.floor(Math.random() * 100) + 1; // número entre 1 y 100
  const output = document.getElementById("sonic_listeners");
  if (output) output.textContent = nuevoValor;
}

// ⏱️ Inicia el ritual de actualización periódica
setInterval(actualizarListeners, 120000); // cada 2 minutos (120000 ms)
actualizarListeners(); // inicializa al cargar

// 🎶 Migración de música por streaming (preparación)
function cambiarMusicaPorStreaming(enlace) {
  // 🎯 Aquí puedes pausar la música actual si es local
  // player.pause(); ← si usas un reproductor JS

  // 🔗 Cargar nueva fuente desde servidor o streaming
  const audio = document.getElementById("audio-player");
  if (audio) {
    audio.src = enlace;
    audio.load();
    audio.play();
  }

  // 🧭 Opcional: actualizar contador o registrar evento
  registrarVisita("streaming_migrado");
  console.log("🔄 Música migrada al nuevo enlace:", enlace);
}

// 🕒 Comentario adicional: puedes usar esta función cuando llegue la hora
// cambiarMusicaPorStreaming("https://tu-servidor.com/stream.mp3");