//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN CONTAINER
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildMainContainer() {
  const mainContainer = document.createElement("div");
  mainContainer.id = "main-container";
  mainContainer.className = "main-container";

  const backgroundLayer = document.createElement("div");
  backgroundLayer.id = "background-layer";
  mainContainer.appendChild(backgroundLayer);

  return mainContainer;
}

function attachParticlesAndScript() {
  // Las partículas (canvas) y el script lyricsRepro.js van directamente al body,
  // fuera del main-container, al final de la página, como en el HTML original.
  
  const particlesCanvas = document.createElement("canvas");
  particlesCanvas.id = "particles";
  document.body.appendChild(particlesCanvas);

  const lyricsScript = document.createElement("script");
  lyricsScript.src = "https://radio-tekileros.vercel.app/lyricsRepro.js";
  document.body.appendChild(lyricsScript);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BLOQUE LEFT PANEL (LP)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildLeftPanel(mainContainer) {
  const leftPanel = document.createElement("div");
  leftPanel.id = "left-panel";
  leftPanel.className = "left-panel";

  // Audio principal
  const blockAudio = document.createElement("section");
  blockAudio.id = "block-audio";
  blockAudio.className = "block-audio";

  const audioPlayer = document.createElement("audio");
  audioPlayer.id = "player";
  audioPlayer.autoplay = true;
  audioPlayer.muted = true;
  audioPlayer.src = "URL_DE_TU_STREAMING_DE_RADIO_AQUI"; // Recordatorio de URL
  blockAudio.appendChild(audioPlayer);
  leftPanel.appendChild(blockAudio);

  // Mensaje personalizado
  const customMessage = document.createElement("div");
  customMessage.id = "custom-message";
  customMessage.className = "custom-message";
  customMessage.textContent = "Santi Graphics";
  leftPanel.appendChild(customMessage);

  // Header info
  const infoDj = document.createElement("section");
  infoDj.id = "info-dj";
  infoDj.className = "info-dj";

  const datetimeContainer = document.createElement("header");
  datetimeContainer.className = "datetime-container";
  
  datetimeContainer.innerHTML = `
      <i class="fas fa-clock"></i>
      <span id="current-time">00:00:00</span>
      <span class="date-separator">|</span>
      <i class="fas fa-calendar-alt"></i>
      <span id="current-date">21/08/2025</span>
      <span class="date-separator">|</span>
      <i class="fas fa-map-marker-alt"></i>
      <span id="current-city">DUBAI</span>
  `;
  infoDj.appendChild(datetimeContainer);

  const listenersContainer = document.createElement("aside");
  listenersContainer.className = "listeners-container";
  listenersContainer.innerHTML = `
    <span><i class="fas fa-headphones"></i></span>
    <output id="contadorRadio" class="listeners-count">--</output>
  `;
  infoDj.appendChild(listenersContainer);
  leftPanel.appendChild(infoDj);

  // Animaciones y efectos (LP) - Aquí está la clave del posicionamiento
  buildVisualEffectsLP(leftPanel);

  // Bloque volumen (LP)
  buildVolumeBlockLP(leftPanel);

  // Track info (LP)
  buildTrackInfoLP(leftPanel);

  // Botonera (LP)
  buildControlButtonsLP(leftPanel);

  // Añadir LP al MAIN
  mainContainer.appendChild(leftPanel);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUBBLOQUES LP - VISUAL EFFECTS (Posicionamiento de Ondas)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildVisualEffectsLP(leftPanel) {
  const visualEffects = document.createElement("section");
  visualEffects.id = "visual-effects";
  visualEffects.className = "visual-effects";

  // LOGO
  const radioLogo = document.createElement("figure");
  radioLogo.className = "radio-logo";
  visualEffects.appendChild(radioLogo);

  // Pulso detrás del logo
  const pulseEffectContainer = document.createElement("div");
  pulseEffectContainer.className = "pulse-effect-container";
  ["pulse-ring-1", "pulse-ring-2", "pulse-ring-3"].forEach(cls => {
    const ring = document.createElement("span");
    ring.className = `pulse-ring ${cls}`;
    pulseEffectContainer.appendChild(ring);
  });
  visualEffects.appendChild(pulseEffectContainer);

  // MÁSCARA como contenedor
  const maskWrapper = document.createElement("div");
  maskWrapper.className = "mask-wrapper";
  const maskCenter = document.createElement("div");
  maskCenter.className = "mask-center";
  maskWrapper.appendChild(maskCenter);

  // Ondas Engendro integradas (LA SECUENCIA COMPLETA)
  const audioWaves = document.createElement("div");
  audioWaves.className = "audio-waves";
  
  const wavesConfigBase = [
    { delay: "0.1s", height: "15px" }, { delay: "0.2s", height: "35px" },
    { delay: "0.3s", height: "25px" }, { delay: "0.4s", height: "40px" },
    { delay: "0.5s", height: "20px" }, { delay: "0.6s", height: "30px" },
    { delay: "0.7s", height: "35px" }, { delay: "0.8s", height: "45px" },
    { delay: "0.9s", height: "30px" }, { delay: "1.0s", height: "25px" },
  ];
  
  // La secuencia completa de 44 barras de tu HTML original
  const wavesConfig = wavesConfigBase // 10
    .concat(wavesConfigBase) // +10 = 20
    .concat(wavesConfigBase.slice(3, 5)) // +2 (0.4s, 0.5s) = 22
    .concat(wavesConfigBase) // +10 = 32
    .concat(wavesConfigBase) // +10 = 42
    .concat(wavesConfigBase.slice(3, 5)); // +2 (0.4s, 0.5s) = 44

  wavesConfig.forEach(cfg => {
    const waveBar = document.createElement("div");
    waveBar.className = "wave-bar";
    waveBar.style.setProperty("--delay", cfg.delay);
    waveBar.style.setProperty("--height", cfg.height);
    audioWaves.appendChild(waveBar);
  });
  
  maskWrapper.appendChild(audioWaves);
  visualEffects.appendChild(maskWrapper); // Añadir la máscara (que contiene las ondas)

  // Notas musicales flotantes
  const musicNotesContainer = document.createElement("aside");
  musicNotesContainer.className = "music-notes-container";
  ["♪", "♫", "♩", "♬", "♪", "♫", "♩", "♬"].forEach(symbol => {
    const noteSpan = document.createElement("span");
    noteSpan.className = "music-note";
    noteSpan.textContent = symbol;
    musicNotesContainer.appendChild(noteSpan);
  });
  visualEffects.appendChild(musicNotesContainer);

  // Ondas Sonoras decorativas
  const ondasSonoras = document.createElement("output");
  ondasSonoras.className = "ondas-sonoras";
  visualEffects.appendChild(ondasSonoras);

  // Efecto de brillo
  const glowEffect = document.createElement("div");
  glowEffect.className = "glow-effect";
  visualEffects.appendChild(glowEffect);

  leftPanel.appendChild(visualEffects);
}


function buildVolumeBlockLP(leftPanel) {
  const centerZone = document.createElement("div");
  centerZone.className = "center-zone";

  const volumeIcon = document.createElement("i");
  volumeIcon.className = "fas fa-volume-down volume-icon";
  volumeIcon.id = "volumeIcon";
  centerZone.appendChild(volumeIcon);

  const volumeTrack = document.createElement("div");
  volumeTrack.className = "volume-track";

  const volumeBar = document.createElement("input");
  volumeBar.type = "range";
  volumeBar.min = "0";
  volumeBar.max = "100";
  volumeBar.step = "1";
  volumeBar.value = "70";
  volumeBar.className = "volume-bar";
  volumeBar.id = "volumeBar";
  volumeTrack.appendChild(volumeBar);

  centerZone.appendChild(volumeTrack);

  const volumePercentage = document.createElement("span");
  volumePercentage.id = "volumePercentage";
  volumePercentage.className = "volume-percentage";
  volumePercentage.textContent = "70%";
  centerZone.appendChild(volumePercentage);

  leftPanel.appendChild(centerZone);
}

function buildTrackInfoLP(leftPanel) {
  const trackInfo = document.createElement("section");
  trackInfo.id = "track-info";
  trackInfo.className = "track-info";

  const trackDisplayContainer = document.createElement("div");
  trackDisplayContainer.className = "track-display-container";

  const coverArtContainer = document.createElement("figure");
  coverArtContainer.className = "cover-art-container";

  const coverArt = document.createElement("img");
  coverArt.id = "cover-art";
  coverArt.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
  coverArt.alt = "Carátula del Track";
  coverArtContainer.appendChild(coverArt);

  trackDisplayContainer.appendChild(coverArtContainer);

  const infoTrackContainer = document.createElement("article");
  infoTrackContainer.className = "info-track-container";

  const mkScroll = (tag, id, text, scrollable = false) => {
    const wrapper = document.createElement("div");
    wrapper.className = "scroll-wrapper";
    const inner = document.createElement("div");
    inner.className = "scroll-inner";
    const el = document.createElement(tag);
    el.className = `scroll-text${scrollable ? " scrollable" : ""}`;
    el.id = id;
    el.textContent = text;
    inner.appendChild(el);
    wrapper.appendChild(inner);
    return wrapper;
  };
  
  infoTrackContainer.appendChild(mkScroll("h5", "track-playlist", "Playlist: Hits", true));
  infoTrackContainer.appendChild(mkScroll("h2", "track-title", "Título del Track largo"));
  infoTrackContainer.appendChild(mkScroll("h3", "track-artist", "Artista largo con muchos nombres", true));
  infoTrackContainer.appendChild(mkScroll("p", "track-album", "Álbum"));
  infoTrackContainer.appendChild(mkScroll("h4", "track-emotion", "picardía"));

  trackDisplayContainer.appendChild(infoTrackContainer);
  trackInfo.appendChild(trackDisplayContainer);
  leftPanel.appendChild(trackInfo);
}

function buildControlButtonsLP(leftPanel) {
  const blockControls = document.createElement("section");
  blockControls.id = "block-controls";
  blockControls.className = "block-controls";

  const controlButtons = document.createElement("div");
  controlButtons.className = "control-buttons";

  const buttonsConfig = [
    { id: "power-btn", className: "btn-power", icon: "fas fa-power-off" },
    { id: "repeat-btn", className: "btn-repeat", icon: "fas fa-redo" },
    { id: "rewind-btn", className: "btn-rewind", icon: "fas fa-backward" },
    { id: "play-btn", className: "btn-play", icon: "fas fa-play" },
    { id: "forward-btn", className: "btn-forward", icon: "fas fa-forward" },
    { id: "shuffle-btn", className: "btn-shuffle", icon: "fas fa-random" },
    { id: "menu-btn", className: "btn-menu", icon: "fas fa-list-ul" },
    { id: "music-btn", className: "btn-music", icon: "fas fa-music" }
  ];

  buttonsConfig.forEach(cfg => {
    const button = document.createElement("button");
    button.id = cfg.id;
    button.className = cfg.className;
    const icon = document.createElement("i");
    icon.className = cfg.icon;
    button.appendChild(icon);
    controlButtons.appendChild(button);
  });

  blockControls.appendChild(controlButtons);
  leftPanel.appendChild(blockControls);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BLOQUE RIGHT PANEL (RP + Modales)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildRightPanel(mainContainer) {
  const rightPanel = document.createElement("div");
  rightPanel.id = "right-panel";
  rightPanel.className = "right-panel";

  // Karaoke container
  const lyricsContainer = document.createElement("div");
  lyricsContainer.className = "lyrics-container";
  rightPanel.appendChild(lyricsContainer);
  
  mainContainer.appendChild(rightPanel);


  // MODAL HISTORIAL
  const blockHistory = document.createElement("section");
  blockHistory.id = "block-history";
  blockHistory.className = "block-modal";

  const historyModal = document.createElement("div");
  historyModal.id = "history-modal";
  historyModal.className = "modal modal-history hidden";

  const historyContent = document.createElement("div");
  historyContent.className = "modal-content";

  const closeHistory = document.createElement("span");
  closeHistory.id = "close-history-modal";
  closeHistory.className = "close-btn";
  closeHistory.setAttribute("aria-label","Cerrar historial");
  const closeHistoryIcon = document.createElement("i");
  closeHistoryIcon.className = "fas fa-times";
  closeHistory.appendChild(closeHistoryIcon);
  historyContent.appendChild(closeHistory);

  const historyTitle = document.createElement("h2");
  historyTitle.textContent = "Historial de reproducción";
  historyContent.appendChild(historyTitle);

  const historyList = document.createElement("ul");
  historyList.id = "history-list";
  historyList.className = "track-list";
  historyContent.appendChild(historyList);

  historyModal.appendChild(historyContent);
  blockHistory.appendChild(historyModal);
  mainContainer.appendChild(blockHistory);


  // MODAL PLAYLIST MENU (Menú de Listas)
  const blockPlaylistMenu = document.createElement("section");
  blockPlaylistMenu.id = "block-playlist-menu";
  blockPlaylistMenu.className = "block-modal";

  const playlistModal = document.createElement("div");
  playlistModal.id = "playlist-modal";
  playlistModal.className = "modal modal-menu hidden";

  const playlistContent = document.createElement("div");
  playlistContent.className = "modal-content";

  const closePlaylistMenu = document.createElement("button");
  closePlaylistMenu.id = "close-modal-btn"; 
  closePlaylistMenu.className = "close-btn";
  closePlaylistMenu.setAttribute("aria-label","Cerrar menú de playlists");
  closePlaylistMenu.textContent = "❌";
  playlistContent.appendChild(closePlaylistMenu);

  const playlistTitle = document.createElement("h2");
  playlistTitle.textContent = "Listas de Reproducción";
  playlistContent.appendChild(playlistTitle);

  const playlistList = document.createElement("ul");
  playlistList.className = "track-list";
  ["Actual","Rumba Caliente","Bandida","Ruido de Lata","Baladas Rock"].forEach((label,i)=>{
    const li = document.createElement("li");
    li.setAttribute("data-list", ["actual","rumba","bandida","ruido","baladasrock"][i]);
    li.textContent = label;
    playlistList.appendChild(li);
  });
  playlistContent.appendChild(playlistList);

  playlistModal.appendChild(playlistContent);
  blockPlaylistMenu.appendChild(playlistModal);
  mainContainer.appendChild(blockPlaylistMenu);


  // MODAL TRACKS (Lista de Pistas)
  const blockTracks = document.createElement("section");
  blockTracks.id = "block-tracks";
  blockTracks.className = "block-modal";

  const modalPlaylist = document.createElement("div");
  modalPlaylist.id = "modal-playlist";
  modalPlaylist.className = "modal modal-tracks hidden";

  const tracksContent = document.createElement("div");
  tracksContent.className = "modal-content";

  const closeTracks = document.createElement("button");
  closeTracks.id = "close-playlist-modal";
  closeTracks.className = "close-btn";
  closeTracks.setAttribute("aria-label","Cerrar modal de tracks");
  closeTracks.textContent = "❌";
  tracksContent.appendChild(closeTracks);

  const modalInfo = document.createElement("p");
  modalInfo.className = "modal-info";
  modalInfo.textContent = "Reproduciendo: ";
  const currentTrackDisplay = document.createElement("span");
  currentTrackDisplay.id = "current-track-display";
  currentTrackDisplay.textContent = "Sin pista seleccionada — Sin artista";
  modalInfo.appendChild(currentTrackDisplay);
  tracksContent.appendChild(modalInfo);

  const trackList = document.createElement("ul");
  trackList.id = "modal-playlist-tracks";
  trackList.className = "track-list";

  const exampleItem = document.createElement("li");
  exampleItem.className = "modal-track-item";
  exampleItem.innerHTML = `
    <img src="https://santi-graphics.vercel.app/assets/covers/Cover1.png" alt="Carátula" class="track-cover" />
    <div class="track-info">
      <strong>Título del Track</strong><br>
      <span>🎤 Artista</span><br>
      <span>💿 Álbum</span><br>
      <span>⏱️ 3:45</span><br>
      <span>👁️ 12</span>
    </div>
  `;
  trackList.appendChild(exampleItem);
  tracksContent.appendChild(trackList);

  modalPlaylist.appendChild(tracksContent);
  blockTracks.appendChild(modalPlaylist);
  mainContainer.appendChild(blockTracks);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EJECUCIÓN COMPLETA (FINAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. Crear el contenedor principal
const mainContainer = buildMainContainer();

// 2. Construir los paneles dentro del mainContainer
buildLeftPanel(mainContainer);
buildRightPanel(mainContainer);

// 3. Inyectar el mainContainer al body
document.body.appendChild(mainContainer);

// 4. Inyectar las Partículas y el Script (FUERA del mainContainer, al final del body)
attachParticlesAndScript();