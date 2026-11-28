/**
 * Player66 - Dynamic UI Constructor
 */
(function () {
  const STATIC_REPRO66_HTML = `
  <audio id="player" autoplay muted></audio>

  <main id="main-container">

    <section id="turntable-stage">
      <!-- Capa 1: Base -->
      <img src="https://santi-graphics.vercel.app/assets/img/Base.png" alt="Base" class="layer-base">

      <!-- Capa 2+3: Disco + Carátula (grupo que se desliza) -->
      <div class="disc-group">
        <div class="layer-cover">
          <img src="https://santi-graphics.vercel.app/assets/covers/Cover1.png" alt="Carátula">
        </div>
        <div class="layer-vinyl"></div>
      </div>

      <!-- Capa 4: Pivote -->
      <img src="https://santi-graphics.vercel.app/assets/img/Pivote.png" alt="Pivote" class="layer-spindle">

      <!-- Capa 5: Aguja -->
      <img src="https://santi-graphics.vercel.app/assets/img/Aguja.png" alt="Aguja" class="layer-needle">

      <div id="music-notes-container"></div>
    </section>

    <!-- PANEL IZQUIERDO -->
    <aside id="left-panel">

      <!-- 1. SECCIÓN SUPERIOR -->
      <div id="left-top-info">
      </div>

      <!-- 2. SECCIÓN EFECTOS -->
      <div id="left-effects">
        <!-- Aquí irán tus futuros botones de efectos -->
      </div>

      <!-- 3. SECCIÓN BOTONERA (Contenedor independiente) -->
      <div id="botonera-container">
        <div id="progress-block">
          <input type="range" id="time-bar" class="time-bar" min="0" max="100" value="0">
        </div>

        <div id="controls-block">
          <button id="btn-shuffle" class="ctrl-btn"><i class="fas fa-random"></i></button>
          <button id="btn-rwd" class="ctrl-btn"><i class="fas fa-backward"></i></button>
          <button id="btn-play" class="ctrl-btn play-btn"><i class="fas fa-play"></i></button>
          <button id="btn-fwd" class="ctrl-btn"><i class="fas fa-forward"></i></button>
          <button id="btn-rep" class="ctrl-btn"><i class="fas fa-redo"></i></button>
        </div>

        <div id="volume-block">
          <i id="volume-icon" class="fas fa-volume-up"></i>
          <input type="range" id="volume-slider" class="volume-bar" min="0" max="1" step="0.01" value="0.7">
        </div>
      </div>

    </aside>

    <!-- PANEL DERECHO -->
    <aside id="right-panel">
      <div id="history-header">
        <div id="history-title-group">
          <span id="panel-title">CASINO DIGITAL RADIO</span>
          <span id="listeners-badge" class="listeners-badge" title="Oyentes en vivo">
            <i class="fas fa-headphones" aria-hidden="true"></i>
            <span id="listeners-count">0</span>
          </span>
        </div>

        <div id="history-controls-group">
          <button id="btn-fav-filter" type="button" class="fav-filter-btn" aria-pressed="false" aria-label="Mostrar solo favoritos" title="Solo favoritos">
            <i class="fas fa-heart" aria-hidden="true"></i>
          </button>
          <button id="status-indicator" class="mode-switch radio-mode" type="button" role="switch" aria-checked="true">
            <span class="switch-track">
              <span class="switch-thumb"></span>
            </span>
            <span id="status-text">RADIO</span>
          </button>
        </div>
      </div>
      <ul id="history-list"></ul>
    </aside>

  </main>
  `;

  function mountHtml(html) {
    if (!document.body) return;
    document.body.innerHTML = html;
    window.dispatchEvent(new Event("player66:mounted"));
  }

  if (document.body) {
    mountHtml(STATIC_REPRO66_HTML);
  } else {
    document.addEventListener("DOMContentLoaded", () => mountHtml(STATIC_REPRO66_HTML), { once: true });
  }
})();