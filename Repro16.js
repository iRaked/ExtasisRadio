//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 01 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏰ FECHA Y HORA
document.addEventListener("DOMContentLoaded", () => {
  const fechaElem = document.getElementById('fecha');
  const reloj = document.getElementById("Clock");

  function actualizarFecha() {
    const now = new Date();
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    if (fechaElem) fechaElem.textContent = `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
  }

  function actualizarReloj() {
    const ahora = new Date();
    if (reloj) reloj.textContent = `${String(ahora.getHours()).padStart(2,"0")}:${String(ahora.getMinutes()).padStart(2,"0")}:${String(ahora.getSeconds()).padStart(2,"0")}`;
  }

  actualizarFecha();
  actualizarReloj();
  setInterval(actualizarReloj,1000);
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 02 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 ESTADOS Y ELEMENTOS
let modoActual = "radio"; // Estado inicial por defecto
let playlist = [];
let currentIndex = 0;
let primerGesto = false;       // control de autoreproducción
let radioIntervalId = null;    // control de intervalos streaming
const audio = document.getElementById('audio-player');

const artistElem = document.querySelector('.artist');
const trackElem = document.querySelector('.track');
const albumElem = document.querySelector('.album');
const coverElem = document.querySelector('.cover');
const mainCoverElem = document.querySelector('.main-cover');
const listenersOutput = document.getElementById("sonic_listeners");

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 03 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎶 FUNCIONES DE METADATOS
function actualizarMetadatos(song) {
  if (artistElem) artistElem.textContent = song.artist || "Artista desconocido";
  if (trackElem) trackElem.textContent = song.title || "Título desconocido";
  if (albumElem) albumElem.textContent = song.album || "Álbum desconocido";

  const bg = song.cover ? `url('${song.cover}')` : "url('assets/covers/Cover1.png')";
  if (coverElem) coverElem.style.backgroundImage = bg;
  if (mainCoverElem) mainCoverElem.style.backgroundImage = bg;
}

function activarScrollSiNecesario() {
  const scrolling = document.querySelector('.scrolling');
  const meta = document.querySelector('.meta');
  if (scrolling && meta) {
    const necesitaScroll = meta.scrollWidth > scrolling.clientWidth;
    meta.classList.remove('animated');
    void meta.offsetWidth;
    meta.classList.toggle('animated', necesitaScroll);
  }
}

function limpiarMetadatos(initial = false) {
  if (trackElem) trackElem.textContent = initial ? "Conectando..." : "Cargando...";
  if (artistElem) artistElem.textContent = "";
  if (albumElem) albumElem.textContent = "";
  if (coverElem) coverElem.style.backgroundImage = "url('assets/covers/Cover1.png')";
  if (mainCoverElem) mainCoverElem.style.backgroundImage = "url('assets/covers/Cover1.png')";
  if (listenersOutput) listenersOutput.textContent = "--";
  const meta = document.querySelector('.meta');
  if (meta) meta.classList.remove('animated');
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 04 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 MODO LOCAL/MUSIC
function loadTrack(index) {
  const song = playlist[index];
  if (!song) return;
  actualizarMetadatos(song);
  activarScrollSiNecesario();
  audio.src = song.dropbox_url || '';
  audio.load();
}

function activarModoLocal() {
  modoActual = "local";
  limpiarMetadatos();

  if (radioIntervalId) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }

  fetch('Repro16.json')
    .then(res => res.json())
    .then(data => {
      playlist = data;
      currentIndex = 0;
      loadTrack(currentIndex);
      if (primerGesto) {
        audio.play().catch(err => console.warn("⚠️ Error al iniciar reproducción local:", err));
      }
    })
    .catch(err => console.error('❌ Error al cargar playlist local:', err));
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STREAMING METADATA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let lastStreamTitle = "";

function actualizarMetadatosStreaming() {
  const radioUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";

  $.ajax({
    dataType: "jsonp",
    url: radioUrl,
    timeout: 10000,
    success: function(data) {
      if (!data || !data.songtitle) return;

      const cleanedTitle = String(data.songtitle).trim();
      if (!cleanedTitle || cleanedTitle === lastStreamTitle || cleanedTitle.toLowerCase().includes("offline")) return;
      lastStreamTitle = cleanedTitle;

      const parts = cleanedTitle.split(/ - | – /);
      const artist = parts.length >= 2 ? parts[0].trim() : "Radio";
      const title = parts.length >= 2 ? parts.slice(1).join(" - ").trim() : cleanedTitle;

      if (artistElem) artistElem.textContent = artist;
      if (trackElem) trackElem.textContent = title;
      if (albumElem) albumElem.textContent = "";

      activarScrollSiNecesario();

      // Intentar carátula dinámica
      obtenerCaratulaDesdeiTunes(artist, title);

      // Fallback inmediato si no hay carátula
      if (coverElem && !coverElem.style.backgroundImage) {
        coverElem.style.backgroundImage = "url('assets/covers/Cover1.png')";
      }
      if (mainCoverElem && !mainCoverElem.style.backgroundImage) {
        mainCoverElem.style.backgroundImage = "url('assets/covers/Cover1.png')";
      }
    },
    error: function() {
      if (artistElem) artistElem.textContent = "Error Conexión";
      if (trackElem) trackElem.textContent = "";
    }
  });
}

function obtenerCaratulaDesdeiTunes(artist, title) {
  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: 'jsonp',
    url: url,
    success: function(data) {
      let cover = "assets/covers/Cover1.png";
      if (data.results && data.results.length > 0) {
        cover = data.results[0].artworkUrl100.replace('100x100','400x400');
      }
      if (coverElem) coverElem.style.backgroundImage = `url('${cover}')`;
      if (mainCoverElem) mainCoverElem.style.backgroundImage = `url('${cover}')`;
      console.log("🎨 Carátula actualizada:", cover);
    },
    error: function() {
      if (coverElem) coverElem.style.backgroundImage = "url('assets/covers/Cover1.png')";
      if (mainCoverElem) mainCoverElem.style.backgroundImage = "url('assets/covers/Cover1.png')";
    }
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 05 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 MODO RADIO/STREAMING
function activarModoRadio() {
  modoActual = "radio";
  limpiarMetadatos(true);

  if (radioIntervalId) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }

  audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
  audio.load();

  if (primerGesto) {
    audio.play().catch(err => console.error("❌ Error al reproducir streaming:", err));
  }

  actualizarMetadatosStreaming();
  radioIntervalId = setInterval(actualizarMetadatosStreaming, 12000);
  lastStreamTitle = ""; // fuerza a refrescar metadatos
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 06 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 AUTOREPRODUCCIÓN TRAS PRIMER GESTO HUMANO
document.addEventListener("click", () => {
  if (!primerGesto) {
    primerGesto = true;
    audio.muted = false;

    if (modoActual === "radio") {
      // Si ya hay metadatos, solo reproducir
      audio.play().catch(err => console.error("❌ Error al reproducir streaming:", err));
    } else if (modoActual === "local") {
      if (playlist.length > 0) {
        loadTrack(currentIndex);
        audio.play().catch(err => console.warn("⚠️ Error al iniciar local:", err));
      } else {
        activarModoLocal();
      }
    }
  }
}, { once: true });

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 06 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ BOTONES DE CONTROL
const playBtn = document.getElementById('play-btn');
const playIcon = playBtn.querySelector('i');
const forwardBtn = document.querySelector('.btn-fwd');
const forwardIcon = forwardBtn.querySelector('i');
const rewindBtn = document.querySelector('.btn-rwd');
const rewindIcon = rewindBtn.querySelector('i');
const musicBtn = document.querySelector('.btn-music');

playBtn.addEventListener('click', () => {
  if (audio.src) {
    if (audio.paused) {
      audio.play().then(() => {
        playIcon.classList.remove('fa-play');
        playIcon.classList.add('fa-pause');
      });
    } else {
      audio.pause();
      playIcon.classList.remove('fa-pause');
      playIcon.classList.add('fa-play');
    }
  }
});

forwardBtn.addEventListener('click', () => {
  if (modoActual === "local" && currentIndex + 1 < playlist.length) {
    currentIndex++;
    loadTrack(currentIndex);
    audio.play();
  }
  forwardIcon.classList.add('animate-spin');
  setTimeout(() => forwardIcon.classList.remove('animate-spin'),600);
});

rewindBtn.addEventListener('click', () => {
  if (modoActual === "local" && currentIndex - 1 >= 0) {
    currentIndex--;
    loadTrack(currentIndex);
    audio.play();
  }
  rewindIcon.classList.add('animate-spin');
  setTimeout(() => rewindIcon.classList.remove('animate-spin'),600);
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 07 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 08 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 LISTENERS
function actualizarListeners() {
  const nuevoValor = Math.floor(Math.random() * 100) + 1;
  if (listenersOutput) listenersOutput.textContent = nuevoValor;
}
setInterval(actualizarListeners,120000);
actualizarListeners();

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 09 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎶 BOTÓN MUSIC PARA ALTERNAR MODOS
musicBtn.addEventListener("click", () => {
  if (modoActual === "radio") {
    activarModoLocal();   // al cambiar a local, inicia reproducción automática
  } else {
    activarModoRadio();   // al volver a radio, inicia stream
  }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 10 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 ESTADO INICIAL
document.addEventListener("DOMContentLoaded", () => {
  activarModoRadio(); // inicia en streaming por defecto
});
