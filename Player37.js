/**
 * R37 - Dynamic UI Constructor
 * Build: 2026.02
 */

(function() {
    const uiTemplate = `
    <audio id="player" autoplay muted></audio>
    
    <main id="main-container">
        <video autoplay muted loop id="bg-video">
            <source src="https://santi-graphics.vercel.app/assets/video/StageCD.mp4" type="video/mp4" />
            Tu navegador no soporta video HTML5.
        </video>

        <header id="radio-header">
            <div class="title-deluxe">
                <span>C</span><span>A</span><span>S</span><span>I</span><span>N</span><span>O</span><span></span>
                <span>D</span><span>I</span><span>G</span><span>I</span><span>T</span><span>A</span><span>L</span><span></span>
                <span>R</span><span>A</span><span>D</span><span>I</span><span>O</span>
            </div>

            <div id="playback-status" class="playback-status">
                <span id="mode-label">Modo: —</span>
                <span id="playlist-label">Playlist: —</span>
            </div>
            
            <div id="menu-trigger" title="Menú">
                <i class="fas fa-bars"></i>
            </div>
        </header>

        <div id="menu-panel">
            <div id="menu-switch">
                <div class="menu-list">
                    <button class="menu-item" id="radioMode">Radio</button>
                    <button class="menu-item" id="musicMode">Música</button>
                </div>
            </div>
        </div>

        <section class="content-overlay">
            <section class="social-buttons">
                <a href="https://discord.com" class="social-btn" target="_blank"><i class="fab fa-discord"></i><span>Discord</span></a>
                <a href="https://facebook.com" class="social-btn" target="_blank"><i class="fab fa-facebook-f"></i><span>Facebook</span></a>
                <a href="https://instagram.com" class="social-btn" target="_blank"><i class="fab fa-instagram"></i><span>Instagram</span></a>
                <a href="https://tiktok.com" class="social-btn" target="_blank"><i class="fab fa-tiktok"></i><span>TikTok</span></a>
                <a href="https://twitch.tv" class="social-btn" target="_blank"><i class="fab fa-twitch"></i><span>Twitch</span></a>
            </section>
        
            <section id="info" class="info">
                <header class="datetime-container">
                    <i class="fas fa-clock"></i> <span id="current-time">00:00:00</span>
                    <span class="date-separator">|</span>
                    <i class="fas fa-calendar-alt"></i> <span id="current-date">--/--/----</span>
                    <span class="date-separator">|</span>
                    <i class="fas fa-map-marker-alt"></i> <span id="current-city">Latinoamérica</span>
                    <span class="date-separator">|</span>
                    <i class="fas fa-headphones"></i> <output id="listeners-count" class="listeners-count">0</output>
                </header>
            </section>
            
            <div id="background-trigger"><i class="fas fa-image"></i></div>
            <div id="background-panel">
                <div id="background-switch">
                    <div class="switch-header"><h2>Galería de Fondos</h2></div>
                    <section class="background-list">
                        ${[1,2,3,4,5,6,7,8,9,10].map(i => `<div class="bg-option" data-bg="https://santi-graphics.vercel.app/assets/bg/bg${i}.png"></div>`).join('')}
                    </section>
                </div>
            </div>

            <div id="playlist-trigger"><i class="fas fa-headphones-alt"></i></div>
            <div id="playlist-panel">
                <div id="playlist-switch">
                    <div class="switch-header"><h2>Explorar Listas</h2></div>
                    <section class="playlist-list" id="dynamic-playlist-container">
                        </section>
                </div>
            </div>

            <div id="paint-trigger"><i class="fas fa-paint-brush"></i></div>
            <section id="switch-panel">
                <aside id="color-switch">
                    <header class="switch-header"><h2>Tu Estilo</h2></header>
                    <section class="palette">
                        <div class="color-option solid" style="background-color:#ff000050" data-color="#ff000050" title="Rojo"></div>
                        <div class="color-option solid" style="background-color:#39ff1450" data-color="#39ff1450" title="Verde Neon"></div>
                        <div class="color-option solid" style="background-color:#ffff0050" data-color="#ffff0050" title="Amarillo"></div>
                        <div class="color-option solid" style="background-color:#8000ff50" data-color="#8000ff50" title="Púrpura"></div>
                        <div class="color-option solid" style="background-color:#ff69b450" data-color="#ff69b450" title="Rosa"></div>
                        <div class="color-option solid" style="background-color:#ff800050" data-color="#ff800050" title="Naranja"></div>
                        <div class="color-option gradient gold" title="Degradado Dorado"></div>
                        <div class="color-option gradient unicorn" title="Degradado Unicornio"></div>
                        <div class="color-option gradient turquoise" title="Degradado Turquesa"></div>
                        <div class="color-option restore" id="restore-default" title="Restaurar"></div>
                    </section>
                </aside>
            </section>
              
            <section id="repro-container" class="repro-container">
                <div class="cover-zone">
                    <div class="cover-art-border"></div>
                    <div class="cover-art-wrapper">
                        <img id="cover-img" src="https://santi-graphics.vercel.app/assets/covers/Cover1.png" alt="Carátula" class="cover-art">
                    </div>
                </div>

                <div class="player-zone">
                    <div class="track-info">
                        <h2 id="track-title" class="track-title">CASINO DIGITAL RADIO</h2>
                        <h3 id="track-artist" class="track-artist">AUTO DJ</h3>
                        <h4 id="track-album" class="track-album">SEÑAL EN VIVO</h4>
                    </div>

                    <section class="block-volumen">
                        <div class="volume-control">
                            <i id="volumeIcon" class="fas fa-volume-down"></i>
                            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="1" step="0.1" value="0.7">
                            <span id="volumePercentage" class="volume-percentage">70%</span>
                        </div>
                    </section>

                    <section class="block-controls">
                        <div class="control-buttons">
                            <button id="btn-rep" class="btn-repeat"><i class="fas fa-redo"></i></button>
                            <button id="btn-rwd" class="btn-rewind"><i class="fas fa-backward"></i></button>
                            <button id="btn-play" class="btn-play"><i class="fas fa-play"></i></button>
                            <button id="btn-fwd" class="btn-forward"><i class="fas fa-forward"></i></button>
                            <button id="btn-shuffle" class="btn-shuffle"><i class="fas fa-random"></i></button>
                        </div>
                    </section>

                    <section class="block-progreso">
                        <div class="progress-bar">
                            <input type="range" id="time-bar" class="time-bar" min="0" max="100" value="0">
                        </div>
                    </section>
                </div>
            </section>
        </section>
    </main>

    <footer id="custom-footer">
        <div class="footer-inner">
            <a href="#" target="_blank" class="footer-link">
                <img src="https://santi-graphics.vercel.app/assets/SG.ico" alt="icono" class="footer-icon">
                <h5 class="footer-year">©2026</h5>
            </a>
        </div>
    </footer>
    `;

    document.body.innerHTML = uiTemplate;
    console.log("R37 UI: Inyectada con éxito.");
})();