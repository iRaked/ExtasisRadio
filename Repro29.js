//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// INICIALIZACIÓN
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
let modo = "streaming"; // 🔹 Radio por defecto
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

// 🔹 Skin por defecto: aqua
document.body.classList.add("skin3");

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// CARGA DE JSON
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
fetch("https://radio-tekileros.vercel.app/Repro29.json")
  .then(res => res.json())
  .then(data => {
    fullPlaylistData = data;
    btnLocal.disabled = false;

    // Arranque en modo streaming
    modo = "streaming";
    currentIndex = 0;
    renderTrack(currentIndex);
    syncStatus();
    mostrarMetadatosEnVideo();

    // Activar modo Local (todas las playlists)
    btnLocal.addEventListener("click", () => {
      if (!fullPlaylistData || Object.keys(fullPlaylistData).length === 0) return;
      modo = "local";
      currentIndex = 0;
      playlist = Object.values(fullPlaylistData).flat();
      if (!playlist.length) return;

      renderTrack(currentIndex);
      syncStatus();
      mostrarMetadatosEnVideo();

      if (playlistLabel) {
        playlistLabel.textContent = "Playlist: Todas";
        playlistLabel.style.display = "inline";
      }
    });

    //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
    // ACTIVACIÓN DE PLAYLIST POR SECCIÓN
    //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
    document.querySelectorAll('#submenu-musica .playlist-item').forEach(button => {
      const seccion = button.dataset.seccion;
      if (!seccion || !fullPlaylistData[seccion]) return;

      button.addEventListener('click', () => {
        const seleccion = fullPlaylistData[seccion];
        if (!Array.isArray(seleccion) || !seleccion.length) return;

        modo = "local";
        playlist = seleccion;
        currentIndex = 0;

        renderTrack(currentIndex);
        syncStatus();
        mostrarMetadatosEnVideo();

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

    //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
    // ACTIVACIÓN "TODA LA MÚSICA"
    //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
    const btnTodaMusica = document.getElementById('btn-toda-musica');
    if (btnTodaMusica) {
      btnTodaMusica.addEventListener('click', () => {
        const todas = Object.values(fullPlaylistData).flat().filter(t => t && t.enlace);
        if (!todas.length) return;

        modo = "local";
        playlist = todas;
        currentIndex = 0;

        renderTrack(currentIndex);
        syncStatus();
        mostrarMetadatosEnVideo();

        document.querySelectorAll('#submenu-musica .playlist-item').forEach(btn => {
          btn.classList.remove('active');
        });
        btnTodaMusica.classList.add('active');

        if (playlistLabel) {
          playlistLabel.textContent = 'Playlist: Todas';
          playlistLabel.style.display = 'inline';
        }
      });
    }
  });

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// RENDERIZACIÓN DE PISTA ACTUAL (con validación de color)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
function renderTrack(index) {
  if (modo === "streaming") {
    audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
    audio.muted = false;
    audio.play().catch(err => console.warn('Play streaming falló:', err));
  } else {
    const track = playlist?.[index];
    if (!track || !track.enlace) return;
    audio.src = track.enlace;
    audio.muted = false;
    audio.play().catch(err => console.warn('Play local falló:', err));

    // 🔹 Actualizar color por género (siempre, aunque sea cadena vacía)
    colorOndasPorGenero(track.genero || "");
  }

  const icon = document.querySelector("#btn-toggle i");
  if (icon) {
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
  }

  mostrarMetadatosEnVideo();
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// SINCRONIZACIÓN VISUAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
function syncStatus() {
  if (modeLabel) modeLabel.textContent = `Modo: ${modo === "local" ? "Música" : "Radio"}`;
  if (playlistLabel) {
    playlistLabel.style.display = modo === "local" ? "inline" : "none";
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// ACTIVACIÓN MODO RADIO (restaura skin + fallback + inicia actualización)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
btnRadio.addEventListener("click", () => {
  modo = "streaming";
  currentIndex = 0;
  renderTrack(currentIndex);

  const skin = [...document.body.classList].find(c => c.startsWith("skin")) || "skin3";
  const skinColors = {
    skin1: "#ffffff",
    skin2: "#d0aaff",
    skin3: "#00ffff",
    skin4: "#aaff00",
    skin5: "#ff4444"
  };
  const baseColor = skinColors[skin];

  document.body.style.setProperty("--color-ondas", baseColor, "important");
  document.body.style.setProperty("--icon-color", baseColor, "important");
  document.body.style.setProperty("--text-color", baseColor, "important");

  // Fallback inmediato (sin depender del DOM)
  radioMeta.artist = "Casino Digital Radio";
  radioMeta.title = "AutoDJ";

  syncStatus();
  mostrarMetadatosEnVideo();

  // Intervalo vivo
  if (radioIntervalId) clearInterval(radioIntervalId);
  actualizarDesdeServidor();
  radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// ESTADO CENTRAL DE METADATOS RADIO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let radioIntervalId = null;
let lastTrackTitle = "";
let trackHistory = [];

// Estado fuente de verdad (no depende del DOM)
const radioMeta = {
  artist: "Casino Digital Radio",
  title: "AutoDJ"
};

// Arranque inicial en modo streaming: fuerza una actualización inmediata
document.addEventListener("DOMContentLoaded", () => {
  if (modo === "streaming") {
    // Fallback inmediato
    radioMeta.artist = "Casino Digital Radio";
    radioMeta.title = "AutoDJ";
    mostrarMetadatosEnVideo();

    // Primera consulta y luego intervalo
    actualizarDesdeServidor();
    radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
  }
});


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// METADATOS MODO RADIO (cabecera + historial con carátula)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function actualizarDesdeServidor() {
  try {
    const radioUrl = "https://technoplayerserver.net:8018/currentsong?sid=1";
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;
    const response = await fetch(proxyUrl, { cache: "no-cache" });
    const raw = await response.text();

    const cleanedTitle = raw.replace(/AUTODJ/gi, "").replace(/\|\s*$/g, "").trim();

    let artist = "Casino Digital Radio";
    let title = "AutoDJ";

    if (cleanedTitle && !/offline/i.test(cleanedTitle)) {
      const parts = cleanedTitle.split(/\s[-–]\s/);
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      } else {
        title = cleanedTitle;
      }
    }

    const fullTrackInfo = `${artist} - ${title}`;

    // Actualiza siempre radioMeta para cabecera
    radioMeta.artist = artist;
    radioMeta.title = title;

    // Solo si cambia el track, agrega al historial
    if (fullTrackInfo !== lastTrackTitle) {
      lastTrackTitle = fullTrackInfo;
      radioMeta.caratula = "https://santi-graphics.vercel.app/assets/covers/Cover1.png"; // fallback inmediato

      const currentTrackTime = new Date().toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit"
      });

      trackHistory.unshift({
        artist,
        title,
        time: currentTrackTime,
        caratula: radioMeta.caratula
      });
      if (trackHistory.length > 20) trackHistory.pop();
    }

    console.log("🎶 Track actualizado:", radioMeta.artist, "-", radioMeta.title);

    mostrarMetadatosEnVideo();

    // Intentar obtener carátula remota y sincronizar historial
    if (typeof obtenerCaratulaDesdeiTunes === "function") {
      obtenerCaratulaDesdeiTunes(artist, title, (coverUrl) => {
        if (coverUrl) {
          radioMeta.caratula = coverUrl;
          if (trackHistory.length > 0) {
            trackHistory[0].caratula = coverUrl;
          }
          console.log("🖼️ Carátula aplicada:", coverUrl);
          mostrarMetadatosEnVideo();
        }
      });
    }
  } catch (error) {
    console.error("❌ Error al actualizar metadatos de radio:", error);
    radioMeta.artist = "Casino Digital Radio";
    radioMeta.title = "AutoDJ";
    radioMeta.caratula = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
    mostrarMetadatosEnVideo();
  }
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// OBTENER CARÁTULA DESDE ITUNES (actualiza radioMeta + historial)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function obtenerCaratulaDesdeiTunes(artist, title, onCoverReady) {
  if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
    const fallback = 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';
    radioMeta.caratula = fallback;
    if (trackHistory.length > 0) trackHistory[0].caratula = fallback;
    if (onCoverReady) onCoverReady(fallback);
    return;
  }

  // 🔹 Usamos directamente artist + title, sin funciones auxiliares
  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  $.ajax({
    dataType: 'jsonp',
    url: url,
    success: function(data) {
      let cover = 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';
      if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
        cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
      }
      radioMeta.caratula = cover;
      if (trackHistory.length > 0) trackHistory[0].caratula = cover;
      if (onCoverReady) onCoverReady(cover);
      console.log("🖼️ Carátula obtenida:", cover);
      mostrarMetadatosEnVideo();
    },
    error: function() {
      const fallback = 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';
      radioMeta.caratula = fallback;
      if (trackHistory.length > 0) trackHistory[0].caratula = fallback;
      if (onCoverReady) onCoverReady(fallback);
      mostrarMetadatosEnVideo();
    },
    timeout: 8000
  });
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// METADATOS EN VIDEO (Radio + Local)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function mostrarMetadatosEnVideo() {
  const wrapper = document.querySelector("#submenu-video .video-track-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  // --- MODO RADIO ---
  if (modo === "streaming") {
    const item = document.createElement("div");
    item.className = "video-track active";
    item.innerHTML = `
      <img src="${radioMeta.caratula || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png'}" alt="${radioMeta.artist}" class="video-cover">
      <div class="video-info">
        <strong>${radioMeta.title}</strong><br>
        <em>${radioMeta.artist}</em><br>
        <span class="duracion">Duración: <span class="duracion-real">∞</span></span>
      </div>`;
    wrapper.appendChild(item);

    if (trackHistory.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "video-info";
      emptyMsg.textContent = "Esperando la primera actualización de pista...";
      wrapper.appendChild(emptyMsg);
    } else {
      trackHistory.forEach((entry, idx) => {
        const histItem = document.createElement("div");
        histItem.className = "video-track";
        if (idx === 0) histItem.classList.add("active");
        histItem.innerHTML = `
          <img src="${entry.caratula || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png'}" alt="${entry.artist}" class="video-cover">
          <div class="video-info">
            <strong>${entry.title}</strong><br>
            <em>${entry.artist}</em><br>
            <span class="duracion">Hora: ${entry.time}</span>
          </div>`;
        wrapper.appendChild(histItem);
      });
    }
    return;
  }

  // --- MODO LOCAL ---
  if (modo === "local" && playlist.length > 0) {
    playlist.forEach((track, index) => {
      const item = document.createElement("div");
      item.className = "video-track";
      if (index === currentIndex) item.classList.add("active");
      item.innerHTML = `
        <img src="${track.caratula || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png'}" alt="${track.artista} - ${track.nombre}" class="video-cover">
        <div class="video-info">
          <strong>${track.nombre}</strong><br>
          <em>${track.artista}</em><br>
          <span class="duracion">Duración: <span class="duracion-real">${track.duracion || "–"}</span></span>
        </div>`;
      item.addEventListener("click", () => {
        modo = "local";
        currentIndex = index;
        renderTrack(currentIndex);
        syncStatus();
        mostrarMetadatosEnVideo();
      });
      wrapper.appendChild(item);
    });
  }
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// BOTONERA (PLAY / PAUSE / SHUFFLE / REPEAT)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
playBtn.addEventListener("click", () => {
  audio.muted = false;
  audio.play();
});

pauseBtn.addEventListener("click", () => {
  audio.pause();
});

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

btnRepeat.addEventListener("click", () => {
  repeat = !repeat;
  btnRepeat.classList.toggle("active", repeat);
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// AUTOPLAY TRAS GESTO HUMANO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
let hasActivatedAudio = false;
document.addEventListener("click", () => {
  if (!hasActivatedAudio && audio.paused) {
    audio.muted = false;
    audio.play().catch(err => console.warn("Autoplay bloqueado:", err));
    hasActivatedAudio = true;
  }
}, { once: true });

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// REPRODUCCIÓN CONTINUA (ENDED)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
audio.addEventListener("ended", () => {
  if (modo === "local") {
    if (repeat) {
      renderTrack(currentIndex);
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// SUBMENÚS PSP (DESPLIEGUE)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// SKINS Y FONDOS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
const mainContainer = document.querySelector('.psp-main-container');

// Aplicar skin (sin guardar, aqua por defecto)
document.querySelectorAll('.skin-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const skin = btn.dataset.skin;
    document.body.classList.remove("skin1", "skin2", "skin3", "skin4", "skin5");
    document.body.classList.add(skin);
  });
});

// Aplicar fondo (sin guardar)
document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const bg = btn.dataset.bg;
    mainContainer.style.backgroundImage = `url('${bg}')`;
    mainContainer.style.backgroundSize = "cover";
    mainContainer.style.backgroundPosition = "center";
    mainContainer.style.backgroundRepeat = "no-repeat";
    mainContainer.style.backgroundAttachment = "fixed";
  });
});

// Restaurar fondo por defecto (sin guardar)
document.getElementById("btn-restore-bg").addEventListener("click", () => {
  const defaultBG = "https://santi-graphics.vercel.app/assets/bg/BG-PSP.jpg";
  mainContainer.style.backgroundImage = `url('${defaultBG}')`;
  mainContainer.style.backgroundSize = "cover";
  mainContainer.style.backgroundPosition = "center";
  mainContainer.style.backgroundRepeat = "no-repeat";
  mainContainer.style.backgroundAttachment = "fixed";
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// SCROLL PSP (RECORTE AL SUPERAR BOTÓN PRINCIPAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
if (scrollArea && iconWrapper) {
  scrollArea.addEventListener('scroll', () => {
    if (scrollArea.scrollTop > 0) {
      iconWrapper.classList.add('scrolled');
    } else {
      iconWrapper.classList.remove('scrolled');
    }
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// FECHA/HORA + METADATOS EN CABECERA
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
function actualizarFechaHoraYTrack() {
  const fechaHoraEl = document.getElementById("fecha-hora");
  const trackEl = document.getElementById("track-actual");
  if (!fechaHoraEl || !trackEl) return;

  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const hora = ahora.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  fechaHoraEl.textContent = `${fecha} – ${hora}`;

  if (modo === "streaming") {
    // Usa radioMeta (incluye fallback AutoDJ)
    trackEl.textContent = `${radioMeta.artist} – ${radioMeta.title}`;
  } else {
    const track = playlist[currentIndex];
    trackEl.textContent = track ? `${track.artista} – ${track.nombre}` : `Sin pista seleccionada`;
  }
}
setInterval(actualizarFechaHoraYTrack, 1000);

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// COLOR DE ONDAS E ICONOS POR GÉNERO (normalizado + !important)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
function colorOndasPorGenero(genero) {
  const normalizado = genero
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const colores = {
    "rap": "#414345",
    "pop latino": "#ffe66d",
    "tropi pop": "#f39c12",
    "pop rock": "#8f94fb",
    "reggae": "#00ff00",
    "pop electronico": "#a29bfe",
    "rock en espanol": "#3498db",
    "ska": "#ffffff",
    "rock urbano": "#95a5a6",
    "cumbia": "#feb47b",
    "cumbia nortena": "#fbc531",
    "regional mexicano": "#c0392b",
    "norteno": "#2ecc71",
    "corrido tumbado": "#bdc3c7",
    "corrido belico": "#ff0000",
    "rumba": "#f7c59f",
    "cheta": "#ee0979",
    "cuarteto": "#ffd200",
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
  console.log("[Genero]", genero, "→", normalizado, "→ color:", color);

  if (modo === "local") {
    // 🔹 Escribe en body con prioridad !important
    document.body.style.setProperty("--color-ondas", color, "important");
    document.body.style.setProperty("--icon-color", color, "important");
    document.body.style.setProperty("--text-color", color, "important");

    const ondas = getComputedStyle(document.body).getPropertyValue("--color-ondas").trim();
    const iconos = getComputedStyle(document.body).getPropertyValue("--icon-color").trim();
    console.log("[CSS Vars BODY] --color-ondas:", ondas, "| --icon-color:", iconos);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
// MENSAJE PERSONALIZADO (CLIC DERECHO)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);

});


