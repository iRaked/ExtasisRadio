//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏗️ CONSTRUCTOR DEL DOM DINÁMICO (RIVER PLATE EDITION)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function crearMainContainer() {
    const main = document.createElement("div");
    main.className = "main-container";

    // 1. Mensaje y Audio
    main.appendChild(crearElemento("div", { id: "custom-message", className: "custom-message", textContent: "Santi Graphics" }));
    main.appendChild(crearElemento("audio", { id: "player", autoplay: true, muted: true }));

    // 2. Logo River 3D
    const logo3d = crearElemento("div", { className: "logo-river-3d" });
    logo3d.appendChild(crearElemento("img", { src: "https://santi-graphics.vercel.app/assets/img/AFA.png", alt: "Logo 3D", className: "logo-imagen" }));
    main.appendChild(logo3d);

    // 3. Interfaz Estadio
    const interfaz = crearElemento("div", { className: "interfaz-estadio" });
    
    // Pixi Container
    interfaz.appendChild(crearElemento("div", { 
        id: "pixi-container", 
        style: "position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0;" 
    }));

    // Repro Box
    const reproBox = crearElemento("div", { className: "repro-box" });
    reproBox.appendChild(crearHeaderDinamico());
    reproBox.appendChild(crearFooterDinamico());
    
    interfaz.appendChild(reproBox);
    main.appendChild(interfaz);

    // 4. Modal
    main.appendChild(crearModalTracksDinamico());

    return main;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏷️ COMPONENTES ESPECÍFICOS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function crearHeaderDinamico() {
    const header = crearElemento("div", { className: "repro-header" });
    
    header.innerHTML = `
        <button class="btn-menu" id="btn-menu-tracks">
            <svg viewBox="0 0 512 512" class="icon-menu">
                <path d="M492 236H20c-11.046 0-20 8.954-20 20s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20zM492 76H20C8.954 76 0 84.954 0 96s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20zM492 396H20c-11.046 0-20 8.954-20 20s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20z"/>
            </svg>
        </button>
        <div class="info-time"><span id="info-time-text">Cargando...</span></div>
        <div class="radioescuchas">
            <i class="fas fa-users"></i>
            <span id="contadorRadio"></span>
        </div>
        <button class="btn-radio" id="btn-radio" aria-label="Icono de Nota Musical">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55a4 4 0 1 0 2 3.45V7h4V3h-8z"/>
            </svg>
        </button>
    `;
    return header;
}

function crearFooterDinamico() {
    const footer = crearElemento("footer", { className: "footer-2_5d" });
    
    footer.innerHTML = `
        <div class="left-zone">
            <div class="meta-marquee">
                <div class="meta-track" id="meta-track">Cargando metadatos...</div>
            </div>
        </div>
        <div class="botonera">
            <div id="buttons" class="flex justify-center items-center mt-6">
                <button id="repeat-button" class="flex justify-center items-center w-8 h-8 rounded-full soft">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512.016 512.016" class="w-4 h-4" fill="#282b33"><path d="M507.336 100.696l-96-96C406.76.12 399.88-1.256 393.896 1.24c-5.984 2.496-9.888 8.288-9.888 14.752v48h-208c-97.216 0-176 78.784-176 176 0 8.832 7.168 16 16 16h64c8.832 0 16-7.168 16-16 0-44.192 35.808-80 80-80h208v48c0 6.464 3.904 12.32 9.888 14.784 5.984 2.496 12.864 1.12 17.44-3.456l96-96c6.24-6.24 6.24-16.384 0-22.624zM496.008 255.992h-64c-8.832 0-16 7.168-16 16 0 44.192-35.808 80-80 80h-208v-48c0-6.464-3.904-12.32-9.888-14.784s-12.832-1.088-17.44 3.488l-96 96c-6.24 6.24-6.24 16.384 0 22.624l96 96c4.576 4.576 11.456 5.952 17.44 3.456s9.888-8.32 9.888-14.784v-48h208c97.216 0 176-78.784 176-176 0-8.832-7.168-16-16-16z"/></svg>
                </button>
                <button id="prev-button" class="flex justify-center items-center w-12 h-12 ml-6 rounded soft">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45.771 45.772" class="w-6 h-6" fill="#fff"><path d="M18.982 4.75c-1.217-.502-2.504-.222-3.433.711L1.245 19.892c-1.678 1.686-1.65 4.411.028 6.098l14.374 14.433c.929.932 2.113 1.213 3.33.71 1.215-.502 1.795-1.688 1.795-3.003V7.753c-.001-1.315-.572-2.503-1.79-3.003zM43.876 4.64c-1.216-.502-2.558-.222-3.486.711L26.058 19.783c-1.677 1.686-1.663 4.41.015 6.098L40.44 40.312c.93.932 2.217 1.213 3.435.711 1.215-.503 1.897-1.688 1.897-3.004V7.644c-.001-1.317-.679-2.502-1.896-3.004z"/></svg>
                </button>
                <button class="flex justify-center items-center w-20 h-20 ml-6 rounded-full soft btn-play" id="btn-play-pause">
                    <svg class="icon-play icons w-8 h-8" viewBox="0 0 173.861 173.861">
                        <defs>
                            <filter id="inset-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feComponentTransfer in="SourceAlpha"><feFuncA type="table" tableValues="1 0" /></feComponentTransfer>
                                <feGaussianBlur stdDeviation="12" />
                                <feOffset dx="20" dy="20" />
                                <feFlood flood-color="rgb(0, 0, 0)" />
                                <feComposite operator="in" in2="SourceAlpha" />
                                <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode /></feMerge>
                            </filter>
                        </defs>
                        <path d="M34.857 3.613C20.084-4.861 8.107 2.081 8.107 19.106v125.637c0 17.042 11.977 23.975 26.75 15.509L144.67 97.275c14.778-8.477 14.778-22.211 0-30.686L34.857 3.613z" filter="url(#inset-shadow)" fill="#17191e"/>
                    </svg>
                    <svg class="icon-pause icons w-8 h-8 hidden" viewBox="0 0 120 120">
                        <rect x="30" y="20" width="20" height="80" fill="#17191e"/><rect x="70" y="20" width="20" height="80" fill="#17191e"/>
                    </svg>
                </button>
                <button id="next-button" class="flex justify-center items-center w-12 h-12 ml-6 rounded soft">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57 57" class="w-6 h-6" fill="#fff"><path d="M56.575 27.683l-27-19c-.306-.216-.703-.242-1.036-.07A.9988.9988 0 0028 9.5v17.777L1.575 8.694a1.0033 1.0033 0 00-1.036-.069C.208 8.797 0 9.14 0 9.513v37.975c0 .373.208.716.539.888.146.074.304.111.461.111.202 0 .403-.062.575-.182L28 29.723V47.5c0 .373.208.716.539.888.146.075.304.112.461.112.202 0 .404-.062.575-.183l27-19c.267-.186.425-.492.425-.817s-.158-.631-.425-.817z"/></svg>
                </button>
                <button id="shuffle-button" class="flex justify-center items-center w-8 h-8 ml-6 rounded-full soft">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375.633 375.633" class="w-4 h-4" fill="#282b33"><path d="M375.627 279.726l-78.877 67.608v-45.079h-13.277c-41.919 0-72.786-18.781-98.268-43.648 9.828-11.569 18.738-23.214 27.027-34.108 1.904-2.513 3.796-4.993 5.684-7.473 18.852 19.494 39.129 32.645 65.562 32.645h13.277v-37.568l78.872 67.623zM0 129.466h39.308c24.927 0 44.377 11.716 62.321 29.371 2.953-3.791 5.939-7.74 8.953-11.683 7.337-9.66 15.093-19.831 23.497-29.975-24.813-23.187-54.75-40.309-94.77-40.309H0v52.596zM296.75 28.299v44.818h-13.277c-69.375 0-108.488 51.421-143.004 96.804-31.046 40.749-57.85 75.989-101.161 75.989H0v52.59h39.308c69.386 0 108.498-51.394 143.015-96.766 31.035-40.798 57.844-76.033 101.15-76.033h13.277v37.84l78.883-67.629-78.883-67.613z"/></svg>
                </button>
            </div>
        </div>
        <div class="right-zone">
            <i class="fas fa-volume-down volume-icon" id="volumeIcon"></i>
            <div class="volume-track"><input type="range" min="0" max="100" value="70" class="volume-bar" id="volumeBar" /></div>
            <i class="fas fa-volume-up volume-icon"></i>
        </div>
    `;
    return footer;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//Modal
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearModalTracksDinamico() {
    const modal = crearElemento("div", { id: "modal-tracks", className: "modal hidden" });
    modal.innerHTML = `
        <div class="modal-content">
            <button id="close-modal" class="modal-x">✕</button>
            <h2 class="modal-title">Tracks disponibles</h2>
            <p class="modal-info">Reproduciendo: <span id="current-track-name">Cargando...</span></p>
            <ul class="track-list" id="track-list"></ul>
        </div>
    `;
    return modal;
}

// 🛠️ Función utilitaria para crear elementos rápido
function crearElemento(tag, attrs = {}) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'textContent') el.textContent = value;
        else if (key === 'innerHTML') el.innerHTML = value;
        else if (key === 'className') el.className = value;
        else el.setAttribute(key, value);
    }
    return el;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 LANZADOR PRINCIPAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function inicializarReproductorRiver() {
    document.body.innerHTML = "";
    document.body.appendChild(crearMainContainer());
    
    // Vinculación de variables globales tras la creación
    window.modalTracks = document.getElementById("modal-tracks");
    window.trackList = document.getElementById("track-list");
    window.player = document.getElementById("player");
    
    console.log("⚽ Estadio Monumental Cargado. Sistema Listo.");
    window.dispatchEvent(new Event("repro-ready"));
}

inicializarReproductorRiver();