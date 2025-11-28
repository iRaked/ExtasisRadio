//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 AUDIO PRINCIPAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearAudio() {
  const audio = document.createElement("audio");
  audio.id = "player";
  audio.autoplay = true;
  audio.muted = true;
  return audio;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧭 MAIN CONTAINER + BACKGROUND
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearMainContainer() {
  const main = document.createElement("div");
  main.id = "main-container";
  main.className = "main-container";

  const background = document.createElement("div");
  background.id = "background-layer";

  main.appendChild(background);
  return main;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ◀️ LEFT PANEL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearLeftPanel() {
  const leftPanel = document.createElement("div");
  leftPanel.id = "left-panel";
  leftPanel.className = "left-panel";

  // Botonera
  leftPanel.appendChild(crearBotonera());

  // Header info-dj
  leftPanel.appendChild(crearInfoDJ());

  // Efectos visuales (Contiene Logo y Pulse, se mantiene arriba)
  leftPanel.appendChild(crearVisualEffects());

  // Mask + audio waves (Parte del Plato-Ondas)
  leftPanel.appendChild(crearMaskWrapper());

  // Music notes (Parte del Plato-Ondas)
  leftPanel.appendChild(crearMusicNotes());

  // Ondas sonoras (Parte del Plato-Ondas)
  leftPanel.appendChild(crearOndasSonoras());

  // Glow effect (Parte del Plato-Ondas)
  leftPanel.appendChild(crearGlowEffect());

  // 🔊 Volumen - ¡NUEVA POSICIÓN! 
  // Ahora está DESPUÉS de todos los elementos visuales del 'Plato-Ondas'
  leftPanel.appendChild(crearBlockVolumen());

  // 🎵 Track-info (carátula/Plato + metadatos) - ¡NUEVA POSICIÓN!
  // Ahora está DEBAJO del volumen. Si la carátula (Plato)
  // está visualmente arriba por CSS, esto contendrá los metadatos.
  leftPanel.appendChild(crearTrackInfo());

  return leftPanel;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ BOTONERA
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearBoton(id, clase, icono) {
  const btn = document.createElement("button");
  btn.id = id;
  btn.className = clase;
  btn.innerHTML = `<i class="${icono}"></i>`;
  return btn;
}

function crearBotonera() {
  const section = document.createElement("section");
  section.id = "block-controls";
  section.className = "block-controls";

  const div = document.createElement("div");
  div.className = "control-buttons";

  div.append(
    crearBoton("power-btn", "btn-power", "fas fa-power-off"),
    crearBoton("repeat-btn", "btn-engendro repeat-btn", "fas fa-redo"),
    crearBoton("rewind-btn", "btn-engendro rewind-btn", "fas fa-backward"),
    crearBoton("play-btn", "btn-engendro btn-engendro-play play-btn", "fas fa-play"),
    crearBoton("forward-btn", "btn-engendro forward-btn", "fas fa-forward"),
    crearBoton("shuffle-btn", "btn-engendro shuffle-btn", "fas fa-random"),
    crearBoton("menu-btn", "btn-menu", "fas fa-list-ul"),
    crearBoton("contenido-btn", "btn-engendro contenido-btn", "fas fa-music")
  );

  section.appendChild(div);
  return section;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔊 BLOQUE VOLUMEN
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearBlockVolumen() {
  const section = document.createElement("section");
  section.id = "block-volumen";
  section.className = "block-volumen";

  const div = document.createElement("div");
  div.className = "volume-control";

  const icon = document.createElement("i");
  icon.id = "volumeIcon";
  icon.className = "fas fa-volume-down";

  const input = document.createElement("input");
  input.type = "range";
  input.className = "volume-slider";
  input.id = "volumeSlider";
  input.min = "0";
  input.max = "1";
  input.step = "0.1";
  input.value = "0.7";

  const span = document.createElement("span");
  span.id = "volumePercentage";
  span.className = "volume-percentage";
  span.textContent = "70%";

  div.append(icon, input, span);
  section.appendChild(div);

  return section;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 BLOQUE TRACK-INFO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearTrackInfo() {
  const section = document.createElement("section");
  section.id = "track-info";
  section.className = "track-info";

  const displayContainer = document.createElement("div");
  displayContainer.className = "track-display-container";

  // Cover art
  const figure = document.createElement("figure");
  figure.className = "cover-art-container";

  const img = document.createElement("img");
  img.id = "cover-art";
  img.src = "assets/covers/DalePlay.png";
  img.alt = "Carátula del Track";

  figure.appendChild(img);

  // Info track container
  const article = document.createElement("article");
  article.className = "info-track-container";

  // Playlist
  article.appendChild(crearScrollWrapper("h5", "scroll-text scrollable", "track-playlist", "Radio Dale Play"));

  // Title
  article.appendChild(crearScrollWrapper("h2", "scroll-text", "track-title", "Título del Track largo"));

  // Artist
  article.appendChild(crearScrollWrapper("h3", "scroll-text scrollable", "track-artist", "Artista largo con muchos nombres"));

  // Album
  article.appendChild(crearScrollWrapper("p", "scroll-text", "track-album", "Álbum"));

  displayContainer.append(figure, article);
  section.appendChild(displayContainer);

  return section;
}

// Helper para scroll-wrapper
function crearScrollWrapper(tag, clase, id, texto) {
  const wrapper = document.createElement("div");
  wrapper.className = "scroll-wrapper";

  const inner = document.createElement("div");
  inner.className = "scroll-inner";

  const el = document.createElement(tag);
  el.className = clase;
  el.id = id;
  el.textContent = texto;

  inner.appendChild(el);
  wrapper.appendChild(inner);
  return wrapper;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🕒 HEADER INFO-DJ
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearInfoDJ() {
  const section = document.createElement("section");
  section.id = "info-dj";
  section.className = "info-dj";

  // Header con fecha, hora y ciudad
  const header = document.createElement("header");
  header.className = "datetime-container";

  const iconClock = document.createElement("i");
  iconClock.className = "fas fa-clock";
  const spanTime = document.createElement("span");
  spanTime.id = "current-time";
  spanTime.textContent = "00:00:00";

  const sep1 = document.createElement("span");
  sep1.className = "date-separator";
  sep1.textContent = "|";

  const iconCalendar = document.createElement("i");
  iconCalendar.className = "fas fa-calendar-alt";
  const spanDate = document.createElement("span");
  spanDate.id = "current-date";
  spanDate.textContent = "21/08/2025";

  const sep2 = document.createElement("span");
  sep2.className = "date-separator";
  sep2.textContent = "|";

  const iconCity = document.createElement("i");
  iconCity.className = "fas fa-map-marker-alt";
  const spanCity = document.createElement("span");
  spanCity.id = "current-city";
  spanCity.textContent = "CDMX";

  header.append(
    iconClock, spanTime,
    sep1, iconCalendar, spanDate,
    sep2, iconCity, spanCity
  );

  // Aside con contador de oyentes
  const aside = document.createElement("aside");
  aside.className = "listeners-container";

  const spanIcon = document.createElement("span");
  spanIcon.innerHTML = '<i class="fas fa-headphones"></i>';

  const output = document.createElement("output");
  output.id = "contadorRadio";
  output.className = "listeners-count";
  output.textContent = "--";

  aside.append(spanIcon, output);

  section.append(header, aside);
  return section;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✨ EFECTOS VISUALES (LEFT PANEL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearVisualEffects() {
  const section = document.createElement("section");
  section.id = "visual-effects";
  section.className = "visual-effects";

  // Logo de la radio
  const figure = document.createElement("figure");
  figure.className = "radio-logo";

  // Contenedor de pulsos
  const pulseContainer = document.createElement("div");
  pulseContainer.className = "pulse-effect-container";

  const ring1 = document.createElement("span");
  ring1.className = "pulse-ring pulse-ring-1";

  const ring2 = document.createElement("span");
  ring2.className = "pulse-ring pulse-ring-2";

  const ring3 = document.createElement("span");
  ring3.className = "pulse-ring pulse-ring-3";

  pulseContainer.append(ring1, ring2, ring3);

  section.append(figure, pulseContainer);
  return section;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌊 MASK + AUDIO WAVES (LEFT PANEL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearMaskWrapper() {
  const wrapper = document.createElement("div");
  wrapper.className = "mask-wrapper";

  // Centro de la máscara
  const maskCenter = document.createElement("div");
  maskCenter.className = "mask-center";

  // Contenedor de waves
  const audioWaves = document.createElement("div");
  audioWaves.className = "audio-waves";

  // Configuración de las barras (delay + height)
  const waveConfig = [
    { delay: "0.1s", height: "15px" },
    { delay: "0.2s", height: "35px" },
    { delay: "0.3s", height: "25px" },
    { delay: "0.4s", height: "40px" },
    { delay: "0.5s", height: "20px" },
    { delay: "0.6s", height: "30px" },
    { delay: "0.7s", height: "35px" },
    { delay: "0.8s", height: "45px" },
    { delay: "0.9s", height: "30px" },
    { delay: "1.0s", height: "25px" },
    { delay: "0.4s", height: "40px" },
    { delay: "0.5s", height: "20px" },
    { delay: "0.1s", height: "15px" },
    { delay: "0.2s", height: "35px" },
    { delay: "0.3s", height: "25px" },
    { delay: "0.4s", height: "40px" },
    { delay: "0.5s", height: "20px" },
    { delay: "0.6s", height: "30px" },
    { delay: "0.7s", height: "35px" },
    { delay: "0.8s", height: "45px" },
    { delay: "0.9s", height: "30px" },
    { delay: "1.0s", height: "25px" },
    { delay: "0.1s", height: "15px" },
    { delay: "0.2s", height: "35px" },
    { delay: "0.3s", height: "25px" },
    { delay: "0.4s", height: "40px" },
    { delay: "0.5s", height: "20px" },
    { delay: "0.6s", height: "30px" },
    { delay: "0.7s", height: "35px" },
    { delay: "0.8s", height: "45px" },
    { delay: "0.9s", height: "30px" },
    { delay: "1.0s", height: "25px" },
    { delay: "0.4s", height: "40px" },
    { delay: "0.5s", height: "20px" }
  ];

  // Generar las barras dinámicamente
  waveConfig.forEach(cfg => {
    const bar = document.createElement("div");
    bar.className = "wave-bar";
    bar.style.setProperty("--delay", cfg.delay);
    bar.style.setProperty("--height", cfg.height);
    audioWaves.appendChild(bar);
  });

  wrapper.append(maskCenter, audioWaves);
  return wrapper;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎼 MUSIC NOTES (LEFT PANEL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearMusicNotes() {
  const aside = document.createElement("aside");
  aside.className = "music-notes-container";

  const notes = ["♪", "♫", "♩", "♬", "♪", "♫", "♩", "♬"];

  notes.forEach(symbol => {
    const span = document.createElement("span");
    span.className = "music-note";
    span.textContent = symbol;
    aside.appendChild(span);
  });

  return aside;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔊 ONDAS SONORAS + GLOW EFFECT (LEFT PANEL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearOndasSonoras() {
  const output = document.createElement("output");
  output.className = "ondas-sonoras";
  return output;
}

function crearGlowEffect() {
  const glow = document.createElement("div");
  glow.className = "glow-effect";
  return glow;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ PANEL DERECHO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearRightPanel() {
  const rightPanel = document.createElement("div");
  rightPanel.id = "right-panel";
  rightPanel.className = "right-panel";

  // Lyrics container
  const lyricsContainer = document.createElement("div");
  lyricsContainer.className = "lyrics-container";
  rightPanel.appendChild(lyricsContainer);
    
  // Particle layer
  rightPanel.appendChild(crearParticleLayer());
    
  // Logo container
  rightPanel.appendChild(crearLogoContainer());

  // MODALES
  rightPanel.appendChild(crearBlockHistory());
  rightPanel.appendChild(crearPlaylistModal());
  rightPanel.appendChild(crearModalPlaylist());

  return rightPanel;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗂️ MODAL HISTORIAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearBlockHistory() {
  const section = document.createElement("section");
  section.id = "block-history";
  section.className = "block-modal";

  const historyModal = document.createElement("div");
  historyModal.id = "history-modal";
  historyModal.className = "modal hidden";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  // Botón de cierre
  const closeBtn = document.createElement("span");
  closeBtn.id = "close-history-modal";
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';

  // Título
  const h2 = document.createElement("h2");
  h2.textContent = "Historial de reproducción";

  // Lista de historial
  const ul = document.createElement("ul");
  ul.id = "history-list";
  ul.className = "track-list";

  modalContent.append(closeBtn, h2, ul);
  historyModal.appendChild(modalContent);
  section.appendChild(historyModal);

  return section;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📂 MODAL PLAYLISTS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearPlaylistModal() {
  const modal = document.createElement("div");
  modal.id = "playlist-modal";
  modal.className = "modal hidden";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  // Botón de cierre
  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.id = "close-modal-btn";
  closeBtn.textContent = "❌";

  // Título
  const h2 = document.createElement("h2");
  h2.textContent = "Listas de Reproducción";

  // Lista de playlists
  const ul = document.createElement("ul");
  ul.className = "track-list";

  const liActual = document.createElement("li");
  liActual.dataset.list = "actual";
  liActual.textContent = "Actual";

  const liHits = document.createElement("li");
  liHits.dataset.list = "hits";
  liHits.textContent = "Hits";

  const liRuido = document.createElement("li");
  liRuido.dataset.list = "ruido";
  liRuido.textContent = "Ruido de Lata";

  // Nueva playlist: Baladas Rock
  const liBaladas = document.createElement("li");
  liBaladas.dataset.list = "baladasrock";
  liBaladas.textContent = "Baladas Rock";

  // Añadir todas las opciones al listado
  ul.append(liActual, liHits, liRuido, liBaladas);

  modalContent.append(closeBtn, h2, ul);
  modal.appendChild(modalContent);

  return modal;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎶 MODAL TRACKS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearModalPlaylist() {
  const section = document.createElement("section");
  section.id = "block-modal";
  section.className = "block-modal";

  const modal = document.createElement("div");
  modal.id = "modal-playlist";
  modal.className = "modal hidden";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  // Botón de cierre
  const closeBtn = document.createElement("button");
  closeBtn.id = "close-playlist-modal";
  closeBtn.className = "close-btn";
  closeBtn.setAttribute("aria-label", "Cerrar modal");
  closeBtn.textContent = "❌";

  // Info dinámica de la pista actual
  const pInfo = document.createElement("p");
  pInfo.className = "modal-info";
  pInfo.innerHTML = `Reproduciendo:
    <span id="current-track-display">
      Sin pista seleccionada — Sin artista
    </span>`;

  // Lista de tracks
  const ul = document.createElement("ul");
  ul.id = "modal-playlist-tracks";
  ul.className = "track-list";

  // Ejemplo de ítem enriquecido
  const li = document.createElement("li");
  li.className = "modal-track-item";

  const img = document.createElement("img");
  img.src = "assets/covers/Cover1.png";
  img.alt = "Carátula";
  img.className = "track-cover";

  const divInfo = document.createElement("div");
  divInfo.className = "track-info";
  divInfo.innerHTML = `
    <strong>Título del Track</strong><br>
    <span>🎤 Artista</span><br>
    <span>💿 Álbum</span><br>
    <span>⏱️ 3:45</span>
  `;

  li.append(img, divInfo);
  ul.appendChild(li);

  modalContent.append(closeBtn, pInfo, ul);
  modal.appendChild(modalContent);
  section.appendChild(modal);

  return section;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✨ RIGHT PARTICLE LAYER - EFFECTS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearParticleLayer() {
  const particleLayer = document.createElement("div");
  particleLayer.id = "right-particle-layer";
  particleLayer.className = "right-particle-layer";
  return particleLayer;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌌 LOGO CONTAINER
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearLogoContainer() {
  const logoContainer = document.createElement("div");
  logoContainer.className = "logo-container";

  const img = document.createElement("img");
  img.src = "assets/img/Logo-DP.png";
  img.alt = "Logo";
  img.className = "logo-base";

  const logoEffect = document.createElement("div");
  logoEffect.className = "logo-effect";

  logoContainer.append(img, logoEffect);
  return logoContainer;
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INICIALIZACIÓN - UI
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function initUI() {
  const audio = crearAudio();
  const main = crearMainContainer();
  const leftPanel = crearLeftPanel();
  const rightPanel = crearRightPanel();

  // Insertar en el body
  document.body.append(audio, main);

  // Insertar ambos paneles dentro del main
  main.append(leftPanel, rightPanel);
}

initUI();
