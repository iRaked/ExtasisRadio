//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏗️ CONSTRUCTOR DINÁMICO GLOBAL
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
  const particlesCanvas = document.createElement("canvas");
  particlesCanvas.id = "particles";
  document.body.appendChild(particlesCanvas);

  const lyricsScript = document.createElement("script");
  lyricsScript.src = "https://radio-tekileros.vercel.app/lyricsRepro.js";
  document.body.appendChild(lyricsScript);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ◀️ PANEL IZQUIERDO (LP)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  audioPlayer.src = "https://technoplayerserver.net:8018/stream"; 
  blockAudio.appendChild(audioPlayer);
  leftPanel.appendChild(blockAudio);

  // Header Info
  const infoDj = document.createElement("section");
  infoDj.id = "info-dj";
  infoDj.className = "info-dj";
  infoDj.innerHTML = `
      <header class="datetime-container">
        <i class="fas fa-clock"></i> <span id="current-time">00:00:00</span>
        <span class="date-separator">|</span>
        <i class="fas fa-calendar-alt"></i> <span id="current-date">--/--/----</span>
        <span class="date-separator">|</span>
        <i class="fas fa-map-marker-alt"></i> <span id="current-city">DUBAI</span>
      </header>
      <aside class="listeners-container">
        <span><i class="fas fa-headphones"></i></span>
        <output id="contadorRadio" class="listeners-count">--</output>
      </aside>
  `;
  leftPanel.appendChild(infoDj);

  // Efectos Visuales, Volumen, Track Info y Botonera
  buildVisualEffectsLP(leftPanel);
  buildVolumeBlockLP(leftPanel);
  buildTrackInfoLP(leftPanel);
  buildControlButtonsLP(leftPanel);

  mainContainer.appendChild(leftPanel);
}

// Sub-constructor de Ondas (44 barras exactas)
function buildVisualEffectsLP(leftPanel) {
  const visualEffects = document.createElement("section");
  visualEffects.id = "visual-effects";
  visualEffects.className = "visual-effects";

  visualEffects.innerHTML = `<figure class="radio-logo"></figure>
    <div class="pulse-effect-container">
      <span class="pulse-ring pulse-ring-1"></span>
      <span class="pulse-ring pulse-ring-2"></span>
      <span class="pulse-ring pulse-ring-3"></span>
    </div>
    <div class="mask-wrapper"><div class="mask-center"></div><div class="audio-waves" id="audio-waves"></div></div>
    <aside class="music-notes-container" id="notes-container"></aside>
    <output class="ondas-sonoras"></output><div class="glow-effect"></div>`;

  leftPanel.appendChild(visualEffects);

  // Generación dinámica de ondas
  const wavesContainer = visualEffects.querySelector("#audio-waves");
  const baseWaves = [15, 35, 25, 40, 20, 30, 35, 45, 30, 25];
  for (let i = 0; i < 44; i++) {
    const bar = document.createElement("div");
    bar.className = "wave-bar";
    bar.style.setProperty("--delay", `${(i * 0.1).toFixed(1)}s`);
    bar.style.setProperty("--height", `${baseWaves[i % 10]}px`);
    wavesContainer.appendChild(bar);
  }

  // Generación de notas
  const notesContainer = visualEffects.querySelector("#notes-container");
  ["♪", "♫", "♩", "♬", "♪", "♫", "♩", "♬"].forEach(s => {
    const span = document.createElement("span");
    span.className = "music-note";
    span.textContent = s;
    notesContainer.appendChild(span);
  });
}

function buildVolumeBlockLP(leftPanel) {
  const centerZone = document.createElement("div");
  centerZone.className = "center-zone";
  centerZone.innerHTML = `
    <i class="fas fa-volume-down volume-icon" id="volumeIcon"></i>
    <div class="volume-track">
      <input type="range" min="0" max="100" step="1" value="70" class="volume-bar" id="volumeBar" />
    </div>
    <span id="volumePercentage" class="volume-percentage">70%</span>
  `;
  leftPanel.appendChild(centerZone);
}

function buildTrackInfoLP(leftPanel) {
  const trackInfo = document.createElement("section");
  trackInfo.id = "track-info";
  trackInfo.className = "track-info";
  
  const mkScroll = (tag, id, text, scrollable = false) => `
    <div class="scroll-wrapper"><div class="scroll-inner">
      <${tag} class="scroll-text${scrollable ? " scrollable" : ""}" id="${id}">${text}</${tag}>
    </div></div>`;

  trackInfo.innerHTML = `
    <div class="track-display-container">
      <figure class="cover-art-container">
        <img id="cover-art" src="https://santi-graphics.vercel.app/assets/covers/Cover1.png" alt="Carátula" />
      </figure>
      <article class="info-track-container">
        ${mkScroll("h5", "track-playlist", "Playlist: Hits", true)}
        ${mkScroll("h2", "track-title", "Título del Track")}
        ${mkScroll("h3", "track-artist", "Artista", true)}
        ${mkScroll("p", "track-album", "Álbum")}
        ${mkScroll("h4", "track-emotion", "Emoción")}
      </article>
    </div>
  `;
  leftPanel.appendChild(trackInfo);
}

function buildControlButtonsLP(leftPanel) {
  const blockControls = document.createElement("section");
  blockControls.id = "block-controls";
  blockControls.className = "block-controls";
  const container = document.createElement("div");
  container.className = "control-buttons";

  const buttons = [
    { id: "power-btn", cls: "btn-power", ico: "fa-power-off" },
    { id: "repeat-btn", cls: "btn-repeat", ico: "fa-redo" },
    { id: "rewind-btn", cls: "btn-rewind", ico: "fa-backward" },
    { id: "play-btn", cls: "btn-play", ico: "fa-play" },
    { id: "forward-btn", cls: "btn-forward", ico: "fa-forward" },
    { id: "shuffle-btn", cls: "btn-shuffle", ico: "fa-random" },
    { id: "menu-btn", cls: "btn-menu", ico: "fa-list-ul" },
    { id: "music-btn", cls: "btn-music", ico: "fa-music" }
  ];

  buttons.forEach(b => {
    const btn = document.createElement("button");
    btn.id = b.id;
    btn.className = b.cls;
    btn.innerHTML = `<i class="fas ${b.ico}"></i>`;
    container.appendChild(btn);
  });

  blockControls.appendChild(container);
  leftPanel.appendChild(blockControls);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ PANEL DERECHO Y MODALES (RP)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildRightPanel(mainContainer) {
  const rightPanel = document.createElement("div");
  rightPanel.id = "right-panel";
  rightPanel.className = "right-panel";
  rightPanel.innerHTML = `<div class="lyrics-container"></div>`;
  mainContainer.appendChild(rightPanel);

  // Bloques de Modales (Historial, Menú, Tracks)
  const modals = [
    { id: "history-modal", cls: "modal-history", title: "Historial de reproducción", listId: "history-list" },
    { id: "playlist-modal", cls: "modal-menu", title: "Listas de Reproducción", listId: "playlist-menu-list" },
    { id: "modal-playlist", cls: "modal-tracks", title: "Tracks", listId: "modal-playlist-tracks" }
  ];

  modals.forEach(m => {
    const sec = document.createElement("section");
    sec.className = "block-modal";
    sec.innerHTML = `
      <div id="${m.id}" class="modal ${m.cls} hidden">
        <div class="modal-content">
          <button class="close-btn" id="close-${m.id}">❌</button>
          <h2>${m.title}</h2>
          <ul id="${m.listId}" class="track-list"></ul>
        </div>
      </div>`;
    mainContainer.appendChild(sec);
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INICIALIZACIÓN DE LA MÁQUINA
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const main = buildMainContainer();
buildLeftPanel(main);
buildRightPanel(main);
document.body.appendChild(main);
attachParticlesAndScript();

// Registro de eventos para modales
document.getElementById("menu-btn").onclick = () => document.getElementById("playlist-modal").classList.toggle("hidden");
document.getElementById("music-btn").onclick = () => document.getElementById("history-modal").classList.toggle("hidden");
document.querySelectorAll(".close-btn").forEach(btn => btn.onclick = () => btn.closest(".modal").classList.add("hidden"));

console.log("💎 Player36 Dinámico Iniciado con Técnica DOM.");