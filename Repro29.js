let modo = "local";
let playlist = [];
let currentIndex = 0;
let emisora = "Casino Digital Radio";
let shuffle = false;
let repeat = false;

const audio = document.getElementById("player");
const modeLabel = document.getElementById("mode-label");
const playlistLabel = document.getElementById("playlist-label");

const btnLocal = document.getElementById("btn-local");
const btnRadio = document.getElementById("btn-radio");
const playBtn = document.getElementById("btn-play");
const pauseBtn = document.getElementById("btn-pause");
const btnShuffle = document.getElementById("btn-shuffle");
const btnRepeat = document.getElementById("btn-repeat");

const scrollArea = document.querySelector('#submenu-musica .psp-subbutton-scroll');
const iconWrapper = document.querySelector('#icon-musica').closest('.psp-icon-wrapper');

btnLocal.disabled = true;
let fullPlaylistData = {}; // JSON completo

// 🎧 Cargar JSON y registrar eventos dependientes
fetch("Repro29.json")
  .then(res => res.json())
  .then(data => {
    fullPlaylistData = data;
    btnLocal.disabled = false;

    // ✅ Restaurar modo solo cuando el JSON ya está cargado
    const savedMode = localStorage.getItem("pspMode");
    if (savedMode === "streaming") {
      modo = "streaming";
      currentIndex = 0;
      renderTrack(currentIndex);
      syncStatus();
      mostrarMetadatosEnVideo();
    } else if (savedMode === "local") {
      modo = "local";
      currentIndex = 0;
      playlist = Object.values(fullPlaylistData).flat();
      renderTrack(currentIndex);
      syncStatus();
      mostrarMetadatosEnVideo();
    }

    // 🎧 Activar modo Local (todas las playlists)
    btnLocal.addEventListener("click", () => {
        console.log("Modo local activado");
      if (!fullPlaylistData || Object.keys(fullPlaylistData).length === 0) return;

      modo = "local";
      currentIndex = 0;
      playlist = Object.values(fullPlaylistData).flat();
      if (!playlist.length) return;

      localStorage.setItem("pspMode", modo);
      renderTrack(currentIndex);
      syncStatus();
      mostrarMetadatosEnVideo();

      if (playlistLabel) {
        playlistLabel.textContent = "Playlist: Todas";
        playlistLabel.style.display = "inline";
      }
    });

    // 🎧 Activar playlist por sección desde cada subbotón (sin cambiar modo)
    document.querySelectorAll('#submenu-musica .playlist-item').forEach(button => {
      const seccion = button.dataset.seccion;
      if (!seccion || !fullPlaylistData[seccion]) return;

      button.addEventListener('click', () => {
  playlist = fullPlaylistData[seccion];
  currentIndex = 0;

  renderTrack(currentIndex);
  syncStatus();
  mostrarMetadatosEnVideo();

  // ✅ Señalar visualmente la playlist activa
  document.querySelectorAll('#submenu-musica .playlist-item').forEach(btn => {
    btn.classList.remove('active');
  });
  button.classList.add('active');

  if (playlistLabel) {
    playlistLabel.textContent = `Playlist: ${seccion.replace(/_/g, ' ')}`;
    playlistLabel.style.display = "inline";
  }
    });
  });
});

// 🎧 Activar modo Radio
btnRadio.addEventListener("click", () => {
  modo = "streaming";
  currentIndex = 0;
  localStorage.setItem("pspMode", modo);
  renderTrack(currentIndex);
  syncStatus();
  mostrarMetadatosEnVideo();
});

// 🎧 Reproducir pista actual
function renderTrack(index) {
  if (modo === "streaming") {
    audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
    audio.muted = false;
    audio.play();
  } else {
    const track = playlist[index];
    if (!track) return;
    audio.src = track.enlace;
    audio.muted = false;
    audio.play();
  }

  const icon = document.querySelector("#btn-toggle i");
  if (icon) {
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
  }

// Dentro de renderTrack()
if (modo === "local" && playlist[index]) {
  colorOndasPorGenero(playlist[index].genero);
}

  // ✅ Actualizar marca visual en Video
  mostrarMetadatosEnVideo();
}

// 🎧 Sincronizar estado visual
function syncStatus() {
  if (modeLabel) modeLabel.textContent = `Modo: ${modo === "local" ? "Música" : "Radio"}`;
  if (playlistLabel) {
    playlistLabel.style.display = modo === "local" ? "inline" : "none";
  }
}

// 🎧 Botonera Play/Pause
playBtn.addEventListener("click", () => {
  audio.muted = false;
  audio.play();
});

pauseBtn.addEventListener("click", () => {
  audio.pause();
});

// 🔀 Shuffle toggle
btnShuffle.addEventListener("click", () => {
  shuffle = !shuffle;
  btnShuffle.classList.toggle("active", shuffle);

  if (shuffle && modo === "local" && playlist.length > 1) {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } while (nextIndex === currentIndex);
    currentIndex = nextIndex;
    renderTrack(currentIndex);
    syncStatus();
  }
});

// 🔁 Repeat toggle
btnRepeat.addEventListener("click", () => {
  repeat = !repeat;
  btnRepeat.classList.toggle("active", repeat);
});

// 🎧 Autoplay tras gesto humano
let hasActivatedAudio = false;
document.addEventListener("click", () => {
  if (!hasActivatedAudio && audio.paused) {
    audio.muted = false;
    audio.play().catch(err => console.warn("Autoplay bloqueado:", err));
    hasActivatedAudio = true;
  }
}, { once: true });

// 🎧 Reproducción continua
audio.addEventListener("ended", () => {
  if (modo === "local") {
    if (repeat) {
      renderTrack(currentIndex); // Repite el mismo
    } else if (shuffle) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentIndex && playlist.length > 1);
      currentIndex = nextIndex;
      renderTrack(currentIndex);
    } else {
      currentIndex++;
      if (currentIndex >= playlist.length) currentIndex = 0;
      renderTrack(currentIndex);
    }
  }
});

// 🎮 Despliegue de Submenús
document.querySelectorAll('.psp-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    const id = icon.dataset.submenu;
    const target = document.getElementById('submenu-' + id);
    if (!target) return;

    const isVisible = !target.classList.contains('hidden');
    document.querySelectorAll('.psp-submenu').forEach(el => el.classList.add('hidden'));
    if (!isVisible) target.classList.remove('hidden');
  });
});

// 🎨 Cambiar fondo (tema)
const mainContainer = document.querySelector('.psp-main-container');

// 🖌️ Aplicar skin y guardar
document.querySelectorAll('.skin-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const skin = btn.dataset.skin;
    document.body.classList.remove("skin1", "skin2", "skin3", "skin4", "skin5");
    document.body.classList.add(skin);
    localStorage.setItem("pspSkin", skin);
  });
});

// 🎨 Aplicar fondo y guardar
document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const bg = btn.dataset.bg;
    mainContainer.style.backgroundImage = `url('${bg}')`;
    mainContainer.style.backgroundSize = "cover";
    mainContainer.style.backgroundPosition = "center";
    mainContainer.style.backgroundRepeat = "no-repeat";
    mainContainer.style.backgroundAttachment = "fixed";
    localStorage.setItem("pspBackground", bg);
  });
});

// 🔄 Restaurar fondo por defecto
document.getElementById("btn-restore-bg").addEventListener("click", () => {
  const defaultBG = "assets/bg/BG-PSP.jpg";
  mainContainer.style.backgroundImage = `url('${defaultBG}')`;
  mainContainer.style.backgroundSize = "cover";
  mainContainer.style.backgroundPosition = "center";
  mainContainer.style.backgroundRepeat = "no-repeat";
  mainContainer.style.backgroundAttachment = "fixed";
  localStorage.setItem("pspBackground", defaultBG);
});

// 🧬 Restaurar skin y fondo desde localStorage
window.addEventListener("DOMContentLoaded", () => {
  const savedSkin = localStorage.getItem("pspSkin");
  const savedBG = localStorage.getItem("pspBackground");

  if (savedSkin) {
    document.body.classList.remove("skin1", "skin2", "skin3", "skin4", "skin5");
    document.body.classList.add(savedSkin);
  }

  if (savedBG) {
    mainContainer.style.backgroundImage = `url('${savedBG}')`;
    mainContainer.style.backgroundSize = "cover";
    mainContainer.style.backgroundPosition = "center";
    mainContainer.style.backgroundRepeat = "no-repeat";
    mainContainer.style.backgroundAttachment = "fixed";
  }
});

// 🖌️ Cambiar skin (colores universales)
document.querySelectorAll('.skin-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const skin = btn.dataset.skin;
    document.body.classList.remove("skin1", "skin2", "skin3", "skin4", "skin5");
    document.body.classList.add(skin);
  });
});

// 🎮 Recorte al superar Botón Principal (Estilo PSP)
if (scrollArea && iconWrapper) {
  scrollArea.addEventListener('scroll', () => {
    if (scrollArea.scrollTop > 0) {
      iconWrapper.classList.add('scrolled');
    } else {
      iconWrapper.classList.remove('scrolled');
    }
  });
}

// 🎬 Mostrar metadatos en sección Video
function mostrarMetadatosEnVideo() {
  const wrapper = document.querySelector("#submenu-video .video-track-wrapper");
  if (!wrapper) return;

  wrapper.innerHTML = ""; // Limpiar contenido previo

  if (modo === "streaming") {
    const item = document.createElement("div");
    item.className = "video-track active";

    const img = document.createElement("img");
    img.src = "assets/covers/Cover1.png";
    img.alt = "Casino Digital Radio";
    img.className = "video-cover";

    const info = document.createElement("div");
    info.className = "video-info";
    info.innerHTML = `
      <strong>Casino Digital Radio</strong><br>
      <em>Transmisión en vivo</em><br>
      <span class="duracion">Duración: <span class="duracion-real">∞</span></span>
    `;

    item.appendChild(img);
    item.appendChild(info);
    wrapper.appendChild(item);
    return;
  }

  // Si no es streaming, renderiza los tracks locales
  playlist.forEach((track, index) => {
    const item = document.createElement("div");
    item.className = "video-track";
    if (index === currentIndex) item.classList.add("active");

    const img = document.createElement("img");
    img.src = track.caratula;
    img.alt = `${track.artista} - ${track.nombre}`;
    img.className = "video-cover";

    const info = document.createElement("div");
    info.className = "video-info";
    info.innerHTML = `
      <strong>${track.nombre}</strong><br>
      <em>${track.artista}</em><br>
      <span class="duracion">Duración: <span class="duracion-real">cargando...</span></span>
    `;

info.innerHTML = `
  <strong>${track.nombre}</strong><br>
  <em>${track.artista}</em><br>
  <span class="duracion">Duración: <span class="duracion-real">${track.duracion || "–"}</span></span>
`;


    item.addEventListener("click", () => {
      modo = "local";
      currentIndex = index;
      renderTrack(currentIndex);
      syncStatus();
      mostrarMetadatosEnVideo();
    });

    item.appendChild(img);
    item.appendChild(info);
    wrapper.appendChild(item);
  });
}

// Señalamiento de Playlist en Música
function marcarPlaylistActivaEnMusica() {
  const tracks = document.querySelectorAll("#submenu-musica .music-track");
  tracks.forEach((track, index) => {
    track.classList.toggle("active", index === currentIndex);
  });
}

// 🧭 Actualizar fecha, hora y metadatos en una sola línea
function actualizarFechaHoraYTrack() {
  const fechaHoraEl = document.getElementById("fecha-hora");
  const trackEl = document.getElementById("track-actual");
  if (!fechaHoraEl || !trackEl) return;

  // 🕒 Fecha y hora actual
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const hora = ahora.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  fechaHoraEl.textContent = `${fecha} – ${hora}`;

  // 🎧 Metadatos en línea según modo
  if (modo === "streaming") {
    trackEl.textContent = `${emisora} – Transmisión en vivo`;
  } else {
    const track = playlist[currentIndex];
    if (track) {
      trackEl.textContent = `${track.artista} – ${track.nombre}`;
    } else {
      trackEl.textContent = `Sin pista seleccionada`;
    }
  }
}

// ⏱️ Activar actualización cada segundo
setInterval(actualizarFechaHoraYTrack, 1000);

// 🌊 Color de ondas por género
function colorOndasPorGenero(genero) {
  const normalizado = genero?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const colores = {
    "pop rock": "#8f94fb",
    "reggae": "#00ff00",
    "regional mexicano": "#c0392b",
    "corrido tumbado": "#bdc3c7",
    "corrido belico": "#ff0000",
    "norteno": "#2ecc71",
    "cumbia nortena": "#fbc531",
    "tropi pop": "#f39c12",
    "pop latino": "#ffe66d",
    "salsa": "#f1c40f",
    "regueton": "#ff0000",
    "trap": "#2c5364",
    "rumba": "#f7c59f",
    "rock en español": "#3498db",
    "ska": "#ffffff",
    "rock urbano": "#95a5a6",
    "pop electronico": "#a29bfe",
    "cumbia": "#feb47b",
    "cumbia norteña": "#a044ff",
    "cheta": "#ee0979",
    "cuarteto": "#ffd200",
    "rap": "#414345",
    "pop": "#ffc0cb",
    "balada pop": "#ffc3a0",
    "bolero": "#ecf0f1",
    "balada romantica": "#fad0c4",
    "dance": "#ffff1c",
    "trance": "#ffaf7b",
    "house": "#dd2476",
    "dancehall": "#64f38c",
    "metal": "#000000",
    "synthpop": "#4a00e0",
    "electronica": "#92fe9d"
  };
  const color = colores[normalizado] || "#444";
  document.documentElement.style.setProperty("--color-ondas", color);
}