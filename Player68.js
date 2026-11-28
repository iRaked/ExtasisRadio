/* Player67.js */
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTRUCTOR DE INTERFAZ DINÁMICA (VERSIÓN SOLO RADIO)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function inicializarInterfazPlayer67() {
    // Evitar duplicados si ya existe
    if (document.getElementById("stream1")) return;

    // 1. Sección Principal
    const sectionBg = document.createElement("section");
    sectionBg.className = "bg-water";
    sectionBg.id = "stream1";
    sectionBg.setAttribute("data-tag", "");

    // 2. Capa de Fondo (Exclusiva para PixiJS Video)
    const contenedorAnimado = document.createElement("div");
    contenedorAnimado.id = "contenedor-animado";
    contenedorAnimado.className = "capa-fondo";
    contenedorAnimado.style.display = "none";
    sectionBg.appendChild(contenedorAnimado);

    // 3. Audio Principal
    const audio = document.createElement("audio");
    audio.id = "player";
    audio.autoplay = true;
    audio.muted = true;
    sectionBg.appendChild(audio);

    // 4. Notas Musicales Flotantes
    const asideNotas = document.createElement("aside");
    asideNotas.className = "music-notes-container";
    const notas = ["♪", "♫", "♩", "♬", "♪", "♫", "♩", "♬"];
    notas.forEach(nota => {
        const span = document.createElement("span");
        span.className = "music-note";
        span.textContent = nota;
        asideNotas.appendChild(span);
    });
    sectionBg.appendChild(asideNotas);

    // 5. Caja Repro Box (Contiene toda la UI visible)
    const reproBox = document.createElement("div");
    reproBox.className = "repro-box";

    // 5.1 Header (DEPURADO: Sin botón de cambio de modo)
    const header = document.createElement("div");
    header.className = "repro-header";
    header.innerHTML = `
        <button class="btn-menu" id="btn-menu-tracks">
            <svg viewBox="0 0 512 512" class="icon-menu">
                <path d="M492 236H20c-11.046 0-20 8.954-20 20s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20zM492 76H20C8.954 76 0 84.954 0 96s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20zM492 396H20c-11.046 0-20 8.954-20 20s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20z"/>
            </svg>
        </button>
        
        <div class="radioescuchas">
            <i class="fas fa-users"></i> <span id="contadorRadio"></span>
        </div>
        
        <div class="right-controls-wrapper">
            <!-- Botón de fondo (Mantenido por si la cliente lo requiere) -->
            <button class="btn-plus" id="btn-bg-mode" title="Cambiar modo de fondo">
                <i class="fas fa-layer-group"></i>
            </button>
        </div>
    `;

    // 5.2 Visual Effects
    const visualEffects = document.createElement("section");
    visualEffects.id = "visual-effects";
    visualEffects.className = "visual-effects";
    visualEffects.innerHTML = `
        <div class="logo-waves-wrapper">
            <figure class="radio-logo">
                <img id="disc-img" src="https://santi-graphics.vercel.app/assets/covers/Cover1.png" alt="Carátula" />
            </figure>
            <div class="effects-layer">
                <div class="orbital_container">
                    <div class="orbital_arc arc2"></div>
                    <div class="avatar-glow"></div>
                </div>
            </div>
        </div>
    `;

    // 5.3 Footer (DEPURADO: Solo Play/Pause, sin controles de pista local)
    const footer = document.createElement("footer");
    footer.className = "footer-2_5d";
    footer.innerHTML = `
        <div class="left-zone">
            <div class="meta-marquee">
                <div class="meta-track" id="meta-track">Cargando metadatos...</div>
            </div>
        </div>
          
        <div class="bloque-bienvenida">
            <div class="logo-container">
                <img src="https://iraked.github.io/SantiGraphics/assets/bg/Clear2.png" alt="Logo" class="logo-base zoom-effect">
            </div>
            <div class="context-bienvenida">
                <p class="animtext">
                    <span class="word">¡Bienvenidos!</span>
                    <span class="word">Freedom in your Soul</span>
                </p>
            </div>
        </div>

        <div class="botonera">
            <div id="buttons" class="flex justify-center items-center mt-6">
                <!-- ÚNICO BOTÓN: PLAY/PAUSE -->
                <button class="flex justify-center items-center w-20 h-20 rounded-full soft btn-play" id="btn-play-pause">
                    <svg class="icon-play icons w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 173.861 173.861">
                        <defs>
                            <filter id="inset-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feComponentTransfer in="SourceAlpha"><feFuncA type="table" tableValues="1 0" /></feComponentTransfer>
                                <feGaussianBlur stdDeviation="12" />
                                <feOffset dx="20" dy="20" result="offsetblur" />
                                <feFlood flood-color="rgb(0, 0, 0)" result="color" />
                                <feComposite in2="offsetblur" operator="in" />
                                <feComposite in2="SourceAlpha" operator="in" />
                                <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode /></feMerge>
                            </filter>
                        </defs>
                        <g transform="translate(5,5)">
                            <path d="M34.857 3.613C20.084-4.861 8.107 2.081 8.107 19.106v125.637c0 17.042 11.977 23.975 26.75 15.509L144.67 97.275c14.778-8.477 14.778-22.211 0-30.686L34.857 3.613z" filter="url(#inset-shadow)" fill="#17191e"/>
                        </g>
                    </svg>
                    <svg class="icon-pause icons w-8 h-8 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
                        <rect x="30" y="20" width="20" height="80" fill="#17191e"/>
                        <rect x="70" y="20" width="20" height="80" fill="#17191e"/>
                    </svg>
                </button>
            </div>
        </div>

        <div class="right-zone">
            <i class="fas fa-volume-down volume-icon" id="volumeIcon"></i>
            <div class="volume-track">
                <input type="range" min="0" max="100" value="70" class="volume-bar" id="volumeBar" />
            </div>
            <i class="fas fa-volume-up volume-icon"></i>
        </div>
    `;

    // 5.4 Mensaje Personalizado (Clic derecho)
    const customMsg = document.createElement("div");
    customMsg.id = "custom-message";
    customMsg.className = "custom-message";
    customMsg.textContent = "Rick Graphics";

    // Ensamblar UI dentro de repro-box
    reproBox.append(header, visualEffects, footer, customMsg);
    sectionBg.appendChild(reproBox);

    // 6. Insertar Sección Principal en el Body
    document.body.appendChild(sectionBg);

    // 7. Modal de Tracks (Adaptado exclusivamente para Historial de Radio)
    const modal = document.createElement("div");
    modal.id = "modal-tracks";
    modal.className = "modal hidden";
    modal.innerHTML = `
        <div class="modal-content">
            <button id="close-modal" class="modal-x">✕</button>
            <h2 class="modal-title">Historial de Radio</h2>
            <p class="modal-info">Últimas reproducciones: <span id="current-track-name">Cargando...</span></p>
            <ul class="track-list"></ul>
        </div>
    `;
    document.body.appendChild(modal);

    // 8. Disparar evento para avisar a Repro67.js que el DOM está listo
    window.dispatchEvent(new Event("repro-ready"));
    console.log("✅ Interfaz Player67 construida con éxito (Versión Solo Radio).");
}

// Ejecutar al cargar el DOM
document.addEventListener("DOMContentLoaded", inicializarInterfazPlayer67);