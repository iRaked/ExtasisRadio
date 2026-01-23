//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛠️ REPRO25.JS - CONSTRUCTOR DE INTERFAZ
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function crearAudioPrincipal() {
    const audio = document.createElement("audio");
    audio.id = "player";
    audio.autoplay = true;
    audio.muted = true;
    return audio;
}

function crearVolumenContenedor() {
    const contenedor = document.createElement("div");
    contenedor.className = "volumen-contenedor";

    const btnMenos = document.createElement("span");
    btnMenos.className = "volumen-control";
    btnMenos.textContent = "−";

    const volDiv = document.createElement("div");
    volDiv.className = "volumen";
    volDiv.innerHTML = `<input type="range" min="0" max="100" value="20" class="volumen-slider" id="volumenSlider">`;

    const btnMas = document.createElement("span");
    btnMas.className = "volumen-control";
    btnMas.textContent = "+";

    const icon = document.createElement("i");
    icon.className = "fas fa-headphones volumen-headphones";

    contenedor.append(btnMenos, volDiv, btnMas, icon);
    return contenedor;
}

function crearMetadata() {
    const meta = document.createElement("div");
    meta.className = "metadata";
    meta.innerHTML = `
        <div class="radio"></div>
        <div class="metadatos-contenedor">
            <div class="scroll-text titulo-container"><span class="titulo metadato"></span></div>
            <div class="scroll-text artista-container"><span class="artista metadato"></span></div>
            <div class="scroll-text album-container"><span class="album metadato"></span></div>
        </div>
    `;
    return meta;
}

function crearBotonera() {
    const botonera = document.createElement("div");
    botonera.className = "botonera";
    
    const botones = [
        { cl: "btn fondo", img: "btn.png", icon: "fa-eye", alt: "Transparente" },
        { cl: "btn menu", img: "btn.png", icon: "fa-music", alt: "Music/Radio" },
        { cl: "btn prev", img: "btn-rwd.png", alt: "Anterior" },
        { cl: "btn play", img: "btn-play.png", alt: "Reproducir" },
        { cl: "btn next", img: "btn-fwd.png", alt: "Siguiente" },
        { cl: "btn shuffle", img: "btn-shuffle.png", alt: "Shuffle" },
        { cl: "btn historial", img: "btn.png", icon: "fa-history", alt: "Historial" }
    ];

    botones.forEach(b => {
        const btn = document.createElement("button");
        btn.className = b.cl;
        let content = `<img src="https://santi-graphics.vercel.app/assets/img/${b.img}" alt="${b.alt}">`;
        if(b.icon) content += `<i class="fas ${b.icon}"></i>`;
        btn.innerHTML = content;
        botonera.appendChild(btn);
    });

    return botonera;
}

function crearModal() {
    const modal = document.createElement("div");
    modal.id = "modalTracks";
    modal.className = "modal-container hidden";
    modal.innerHTML = `
        <div class="repro-box">
            <div class="modal-header">
                <span id="currentTrackNameModal">Lista de Reproducción</span>
                <button class="close-modal">&times;</button>
            </div>
            <ul id="trackList" class="track-list"></ul>
        </div>
    `;
    return modal;
}

// 🧩 ENSAMBLADOR FINAL
function inicializarInterfaz() {
    const repro = document.createElement("div");
    repro.id = "Repro";
    repro.className = "reproductor";

    // 1. Mensaje Contextual
    const msg = document.createElement("div");
    msg.id = "custom-message";
    msg.className = "custom-message";
    msg.textContent = "Santi Graphics";

    // 2. Elementos Visuales
    const canvas = document.createElement("canvas");
    canvas.id = "miniEQ";
    canvas.width = 21;
    canvas.height = 20;

    const radioescuchas = document.createElement("div");
    radioescuchas.className = "radioescuchas";
    radioescuchas.innerHTML = `<i class="fas fa-users"></i> <span id="contadorRadio"></span>`;

    const caratula = document.createElement("div");
    caratula.className = "caratula";
    caratula.innerHTML = `<img src="https://santi-graphics.vercel.app/assets/covers/Cover1.png" alt="Carátula">`;

    const effects = document.createElement("div");
    effects.className = "effects";
    effects.innerHTML = `<button class="fx"><img src="https://santi-graphics.vercel.app/assets/img/Dance.gif" alt="Efectos"></button>`;

    // Construcción del DOM
    repro.append(msg, crearAudioPrincipal(), canvas, crearVolumenContenedor(), radioescuchas, caratula, effects, crearMetadata(), crearBotonera(), crearModal());
    
    document.body.prepend(repro);
    
    // Disparar evento para que Player25 sepa que ya puede actuar
    window.dispatchEvent(new Event("repro-ready"));
}

// Ejecución
document.addEventListener("DOMContentLoaded", inicializarInterfaz);