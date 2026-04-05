//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧱 COMPONENTES DEL TRANSPLANTE (REFACTORIZADO)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const UI = {
    crearAudio: () => {
        const audio = document.createElement('audio');
        audio.id = 'audioStreaming';
        audio.autoplay = true;
        audio.muted = true;
        return audio;
    },

    crearHeader: () => {
        const header = document.createElement('header');
        header.className = 'header';
        const redes = [
            { name: 'Discord', icon: 'fab fa-discord', url: 'https://discord.com/invite/tu-servidor' },
            { name: 'Facebook', icon: 'fab fa-facebook-f', url: 'https://facebook.com' },
            { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com' },
            { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://youtube.com' },
            { name: 'TikTok', icon: 'fab fa-tiktok', url: 'https://tiktok.com' }
        ];

        header.innerHTML = `
            <div class="header-top">
                <div class="brand">
                    <img src="https://santi-graphics.vercel.app/assets/SG.ico" alt="Logo" class="brand-icon" />
                    <span class="radio-title">Casino Digital Radio</span>
                </div>
                <button class="btn-online">STREAMING</button>
            </div>
            <div class="header-bottom">
                ${redes.map(r => `
                    <a href="${r.url}" target="_blank" class="btn-social">
                        <i class="${r.icon}"></i>
                        <span>${r.name}</span>
                    </a>`).join('')}
                <div class="btn-social" id="btnContacto">
                    <i class="fas fa-envelope"></i>
                    <span>Contacto</span>
                </div>
            </div>`;
        return header;
    },

    crearPaneles: () => {
        const container = document.createDocumentFragment();
        
        const top = document.createElement('div');
        top.className = 'panel-top';
        top.innerHTML = `
            <div class="panel-top-left"><i class="fas fa-microphone"></i><span>REPRODUCIENDO:</span></div>
            <div class="panel-top-meta"><div class="meta-container"><span class="meta-text">Cargando...</span></div></div>`;
        
        const middle = document.createElement('div');
        middle.className = 'panel-middle';
        middle.innerHTML = `
            <div class="panel-left">
                <div class="cover-cd-wrapper">
                    <img src="https://santi-graphics.vercel.app/assets/img/CD.png" alt="CD" class="cd-img" />
                    <img src="https://santi-graphics.vercel.app/assets/covers/Cover1.png" alt="Carátula" class="cover-img" />
                </div>
            </div>
            <div class="panel-right"></div>`; // Aquí se renderiza la lista luego

        container.appendChild(top);
        container.appendChild(middle);
        return container;
    },

    crearFooter: () => {
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
                <div class="volume-track"><input type="range" min="0" max="100" value="50" class="volume-bar" /></div>
                <i class="fas fa-volume-up volume-icon"></i>
            </div>`;
        return footer;
    },

    crearModal: () => {
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
            </div>`;
        return modal;
    }
};

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💉 INYECTOR DE DOM (EL MOMENTO DE LA VERDAD)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function inicializarReproductor() {
    console.log("Iniciando transplante de órganos digitales...");
    
    const body = document.body;
    body.innerHTML = ''; 

    const mainContainer = document.createElement('div');
    mainContainer.id = 'main-container';

    // Construcción atómica
    mainContainer.appendChild(UI.crearAudio());
    mainContainer.appendChild(UI.crearHeader());
    mainContainer.appendChild(UI.crearPaneles());
    mainContainer.appendChild(UI.crearFooter());

    body.appendChild(mainContainer);
    body.appendChild(UI.crearModal());

    // CRITICAL: Pequeño delay para asegurar que el motor de renderizado del navegador 
    // termine de registrar los IDs antes de disparar la lógica del Player.
    requestAnimationFrame(() => {
        console.log("DOM listo y renderizado. Disparando Player26.js...");
        window.dispatchEvent(new Event('dom-ready'));
    });
}

// Ejecutar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarReproductor);
} else {
    inicializarReproductor();
}
