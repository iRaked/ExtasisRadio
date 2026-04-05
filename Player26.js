//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧱 COMPONENTES DEL TRANSPLANTE
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. Audio Element
function crearAudioPrincipal() {
    const audio = document.createElement('audio');
    audio.id = 'audioStreaming';
    audio.autoplay = true;
    audio.muted = true;
    return audio;
}

// 2. Header (Top, Social & Modal)
function crearHeaderCompleto() {
    const header = document.createElement('header');
    header.className = 'header';

    // Top: Logo + Botón Streaming
    const top = document.createElement('div');
    top.className = 'header-top';
    top.innerHTML = `
        <div class="brand">
            <img src="https://santi-graphics.vercel.app/assets/SG.ico" alt="Logo" class="brand-icon" />
            <span class="radio-title">Casino Digital Radio</span>
        </div>
        <button class="btn-online">STREAMING</button>
    `;
    header.appendChild(top);

    // Bottom: Social Links
    const bottom = document.createElement('div');
    bottom.className = 'header-bottom';
    const redes = [
        { name: 'Discord', icon: 'fab fa-discord', url: 'https://discord.com/invite/tu-servidor' },
        { name: 'Facebook', icon: 'fab fa-facebook-f', url: 'https://facebook.com' },
        { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com' },
        { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://youtube.com' },
        { name: 'TikTok', icon: 'fab fa-tiktok', url: 'https://tiktok.com' }
    ];

    redes.forEach(red => {
        bottom.innerHTML += `
            <a href="${red.url}" target="_blank" class="btn-social">
                <i class="${red.icon}"></i>
                <span>${red.name}</span>
            </a>`;
    });

    // Botón Contacto
    const btnContacto = document.createElement('div');
    btnContacto.className = 'btn-social';
    btnContacto.id = 'btnContacto';
    btnContacto.innerHTML = `<i class="fas fa-envelope"></i><span>Contacto</span>`;
    bottom.appendChild(btnContacto);
    
    header.appendChild(bottom);
    return header;
}

// 3. Panel Meta (Now Playing)
function crearPanelMeta() {
    const div = document.createElement('div');
    div.className = 'panel-top';
    div.innerHTML = `
        <div class="panel-top-left">
            <i class="fas fa-microphone"></i>
            <span>REPRODUCIENDO:</span>
        </div>
        <div class="panel-top-meta">
            <div class="meta-container">
                <span class="meta-text">Nombre del artista - Título de la canción</span>
            </div>
        </div>
    `;
    return div;
}

// 4. Panel Middle (CD + Playlist)
function crearPanelMiddle() {
    const middle = document.createElement('div');
    middle.className = 'panel-middle';

    // Left: CD Wrapper
    const left = document.createElement('div');
    left.className = 'panel-left';
    left.innerHTML = `
        <div class="cover-cd-wrapper">
            <img src="https://santi-graphics.vercel.app/assets/img/CD.png" alt="CD" class="cd-img" />
            <img src="https://santi-graphics.vercel.app/assets/covers/Cover1.png" alt="Carátula" class="cover-img" />
        </div>
    `;

    // Right: Playlist Container
    const right = document.createElement('div');
    right.className = 'panel-right';
    // Se deja vacío para que renderPanelDerechoLocal() lo llene después

    middle.appendChild(left);
    middle.appendChild(right);
    return middle;
}

// 5. Footer (Controles & Volumen)
function crearFooter() {
    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML = `
        <div class="footer-left">
            <button class="btn-control btn-repeat" id="btnRepeat"><i class="fas fa-redo"></i></button>
            <button class="btn-control btn-play"><i class="fas fa-play"></i></button>
            <button class="btn-control btn-shuffle" id="btnShuffle"><i class="fas fa-random"></i></button>
        </div>
        <div class="footer-center">
            <div class="status-block">TIME TRACK</div>
            <div class="status-block" id="timeDisplay">00:00</div>
        </div>
        <div class="footer-right">
            <i class="fas fa-volume-down volume-icon" id="volumeIcon"></i>
            <div class="volume-track">
                <input type="range" min="0" max="100" value="50" class="volume-bar" />
            </div>
            <i class="fas fa-volume-up volume-icon"></i>
        </div>
    `;
    return footer;
}

// 6. Modal de Contacto
function crearModalContacto() {
    const modal = document.createElement('div');
    modal.id = 'modalContacto';
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Contacto</h2>
            <img src="https://santi-graphics.vercel.app/assets/img/Avatar.png" alt="Avatar" class="contact-img" />
            <div class="contact-info">
                <p><strong>Nick:</strong> RICK</p>
                <p><strong>ID:</strong> 1548724149</p>
            </div>
        </div>
    `;
    return modal;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💉 ENSAMBLADOR FINAL (EL TRANSPLANTE)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function inicializarDOM() {
    const body = document.body;
    body.innerHTML = ''; // Limpiamos el HTML original

    const mainContainer = document.createElement('div');
    mainContainer.id = 'main-container';

    // Inyectamos las piezas en orden
    mainContainer.appendChild(crearAudioPrincipal());
    mainContainer.appendChild(crearHeaderCompleto());
    mainContainer.appendChild(crearPanelMeta());
    mainContainer.appendChild(crearPanelMiddle());
    mainContainer.appendChild(crearFooter());

    body.appendChild(mainContainer);
    body.appendChild(crearModalContacto());

    console.log("Transplante completado: DOM Dinámico listo.");
    
    // Aquí lanzamos el evento para que Player26.js sepa que ya puede actuar
    window.dispatchEvent(new Event('dom-ready'));
}

// Iniciar proceso
document.addEventListener('DOMContentLoaded', inicializarDOM);