//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏗️ CONSTRUCTORES DINÁMICOS DEL DOM - Player55.js
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildAudioElement() {
  const audio = document.createElement("audio");
  audio.id = "audio";
  audio.preload = "metadata";
  return audio;
}

function buildPlayerStage() {
  const stage = document.createElement("div");
  stage.className = "player-stage";

  const container = document.createElement("div");
  container.className = "player-container";

  // Anillos decorativos
  const arcRings = document.createElement("div");
  arcRings.className = "arc-rings";
  arcRings.innerHTML = `
    <div class="arc-ring-inner"></div>
    <div class="arc-ring-outer"></div>
  `;
  container.appendChild(arcRings);

  // Carrusel de carátulas (9 elementos)
  buildCarouselArc(container);

  // Iconos de navegación
  buildNavIcons(container);

  // Panel de metadatos
  buildMetadataPanel(container);

  // Overlay de contenido
  buildContentOverlay(container);

  stage.appendChild(container);
  return stage;
}

function buildCarouselArc(container) {
  const carousel = document.createElement("div");
  carousel.className = "carousel-arc";

  const coversData = [
    { a: "30deg", pos: "0", src: "https://santi-graphics.vercel.app/assets/covers/Cover6.png" },
    { a: "45deg", pos: "1", src: "https://santi-graphics.vercel.app/assets/covers/Cover12.png" },
    { a: "60deg", pos: "2", src: "https://santi-graphics.vercel.app/assets/covers/Cover1.png" },
    { a: "75deg", pos: "3", src: "https://santi-graphics.vercel.app/assets/covers/Cover8.png" },
    { a: "90deg", pos: "4", src: "https://santi-graphics.vercel.app/assets/covers/Cover2.png", active: true },
    { a: "105deg", pos: "5", src: "https://santi-graphics.vercel.app/assets/covers/Cover9.png" },
    { a: "120deg", pos: "6", src: "https://santi-graphics.vercel.app/assets/covers/Cover10.png" },
    { a: "135deg", pos: "7", src: "https://santi-graphics.vercel.app/assets/covers/Cover11.png" },
    { a: "150deg", pos: "8", src: "https://santi-graphics.vercel.app/assets/covers/Cover7.png" }
  ];

  coversData.forEach(c => {
    const cover = document.createElement("div");
    cover.className = `arc-cover ${c.active ? "active" : ""}`;
    cover.style.setProperty("--a", c.a);
    cover.dataset.pos = c.pos;
    const img = document.createElement("img");
    img.src = c.src;
    img.alt = "";
    cover.appendChild(img);
    carousel.appendChild(cover);
  });

  container.appendChild(carousel);
}

function buildNavIcons(container) {
  const navIcons = document.createElement("div");
  navIcons.className = "nav-icons-arc";

  const navData = [
    { a: "60deg", section: "video", icon: "fa-video" },
    { a: "75deg", section: "folder", icon: "fa-folder" },
    { a: "90deg", section: "music", icon: "fa-music", active: true },
    { a: "105deg", section: "favorites", icon: "fa-heart" },
    { a: "120deg", section: "games", icon: "fa-gamepad" }
  ];

  navData.forEach(n => {
    const ico = document.createElement("div");
    ico.className = `nav-ico ${n.active ? "active" : ""}`;
    ico.style.setProperty("--a", n.a);
    ico.dataset.section = n.section;
    ico.innerHTML = `<i class="fas ${n.icon}"></i>`;
    navIcons.appendChild(ico);
  });

  container.appendChild(navIcons);
}

function buildMetadataPanel(container) {
  const metadataPanel = document.createElement("div");
  metadataPanel.className = "metadata-panel";
  metadataPanel.innerHTML = `
    <div class="track-card">
      <p id="trackPlaylist" class="track-playlist">ACTUAL</p>
      <h2 id="trackTitle">Ay amor</h2>
      <p id="trackArtist">Los Caligaris</p>
      <p class="track-time">
        <span id="currentTime">0:00</span>
        <span class="time-separator"> - </span>
        <span id="totalDuration">5:35</span>
      </p>
      <div class="track-actions">
        <div class="action-icons">
          <button class="btn-act" id="btnFavorite" title="Favorito">
            <i class="far fa-heart"></i>
          </button>
          <button class="btn-act" id="btnInfo" title="Información">
            <i class="fas fa-info-circle"></i>
          </button>
          <button class="btn-act" id="btnShuffle" title="Aleatorio">
            <i class="fas fa-random"></i>
          </button>
          <button class="btn-act" id="btnRepeat" title="Repetir">
            <i class="fas fa-redo"></i>
          </button>
        </div>
      </div>
      <div class="progress-container" id="progressContainer">
        <div class="progress-bar">
          <div class="progress-fill" id="progressFill"></div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(metadataPanel);
}

function buildContentOverlay(container) {
  const overlay = document.createElement("div");
  overlay.className = "content-overlay";
  overlay.id = "contentOverlay";

  // Sección Videos
  const videoSection = document.createElement("section");
  videoSection.className = "content-section";
  videoSection.id = "section-video";
  videoSection.innerHTML = `
    <div class="section-header">
      <h3><i class="fas fa-video"></i> Videos YouTube</h3>
      <button class="btn-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="media-grid" id="videoContainer"></div>
  `;
  overlay.appendChild(videoSection);

  // Sección Playlists
  const folderSection = document.createElement("section");
  folderSection.className = "content-section";
  folderSection.id = "section-folder";
  folderSection.innerHTML = `
    <div class="section-header">
      <h3><i class="fas fa-folder"></i> Playlists</h3>
      <button class="btn-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="folder-container" id="folderContainer"></div>
  `;
  overlay.appendChild(folderSection);

  // Sección Music
  const musicSection = document.createElement("section");
  musicSection.className = "content-section active";
  musicSection.id = "section-music";
  musicSection.innerHTML = `
    <div class="section-header">
      <h3><i class="fas fa-music"></i> Music</h3>
      <button class="btn-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="playlist-container" id="playlistContainer"></div>
  `;
  overlay.appendChild(musicSection);

  // Sección Favoritos
  const favoritesSection = document.createElement("section");
  favoritesSection.className = "content-section";
  favoritesSection.id = "section-favorites";
  favoritesSection.innerHTML = `
    <div class="section-header">
      <h3><i class="fas fa-heart"></i> Favoritos</h3>
      <button class="btn-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="favorites-container" id="favoritesContainer"></div>
  `;
  overlay.appendChild(favoritesSection);

  // Sección Videojuegos
  const gamesSection = document.createElement("section");
  gamesSection.className = "content-section";
  gamesSection.id = "section-games";
  gamesSection.innerHTML = `
    <div class="section-header">
      <h3><i class="fas fa-gamepad"></i> Videojuegos</h3>
      <button class="btn-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="games-selector">
      <button class="game-btn active" data-game="mario-luigi">
        <i class="fas fa-gamepad"></i> Mario & Luigi
      </button>
      <button class="game-btn" data-game="farm-merge">
        <i class="fas fa-tractor"></i> Farm Merge
      </button>
    </div>
    <div id="activeGameContainer" class="gba-bezel-container"></div>
  `;
  overlay.appendChild(gamesSection);

  container.appendChild(overlay);
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INICIALIZACIÓN - Construir y montar todo el DOM
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  // 1. Crear elemento de audio
  const audio = buildAudioElement();
  document.body.appendChild(audio);

  // 2. Construir y montar el reproductor
  const playerStage = buildPlayerStage();
  document.body.appendChild(playerStage);
  
  console.log("🎧 Player55 DOM dinámico construido exitosamente");
  
  // 3. AVISAR A Repro55.js QUE EL DOM YA EXISTE
  window.dispatchEvent(new Event('player-dom-ready'));

  // 4. REGISTRO DEL SERVICE WORKER (Solo se ejecutará sin errores en https:// o localhost)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw55.js') 
        .then((registration) => {
          console.log('✅ SW registrado con éxito:', registration.scope);
        })
        .catch((error) => {
          // Este catch se activará en file://, lo cual es esperado e inofensivo
          console.log('ℹ️ SW no registrado (normal si estás abriendo el archivo localmente sin servidor)');
        });
    });
  }
});