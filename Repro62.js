/* Repro65.js */
// ===============================
// INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
// ===============================
let trackData = [];
let currentTrack = null;
let modoActual = "radio"; // "radio" o "local"
let gestureDetected = false;
let repeatMode = "none";
let isShuffling = false;
let trackHistory = [];
let radioIntervalId = null; 
let lastTrackTitle = "";
let contadorIntervalId = null;

// ===============================
// ELEMENTOS CLAVE DEL DOM
// ===============================
let audio = document.getElementById("player");
let playPauseBtn = document.getElementById("btn-play-pause");
let nextBtn = document.getElementById("next-button");
let prevBtn = document.getElementById("prev-button");
let shuffleBtn = document.getElementById("shuffle-button");
let repeatBtn = document.getElementById("repeat-button");
let btnRadio = document.getElementById("btn-radio");
let iconPlay = playPauseBtn ? playPauseBtn.querySelector(".icon-play") : null;
let iconPause = playPauseBtn ? playPauseBtn.querySelector(".icon-pause") : null;
let discImg = document.getElementById("disc-img");
let currentTrackName = document.getElementById("current-track-name");
let currentArtistName = document.getElementById("current-artist-name");
let metaTrack = document.getElementById("meta-track");
let volumeBar = document.getElementById("volumeBar");
let volumeIcon = document.getElementById("volumeIcon");
let contadorElemento = document.getElementById("contadorRadio");
let modalTracks = document.getElementById("modal-tracks");
let menuBtn = document.getElementById("btn-menu-tracks");
let closeModalBtn = document.getElementById("close-modal");
let trackList = document.querySelector(".track-list");
let currentTrackNameModal = document.getElementById('current-track-name') || document.getElementById('current-track-name-modal');

// ===============================
// FUNCIONES AUXILIARES (Carátulas)
// ===============================
function validarCaratula(url) {
    if (!discImg) return;
    const img = new Image();
    img.onload = () => {
        discImg.src = url;
        discImg.classList.add("rotating");
    };
    img.onerror = () => {
        discImg.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        discImg.classList.add("rotating");
    };
    img.src = url;
}

function actualizarCaratula(track) {
    if (!discImg) return;
    if (modoActual === "local") {
        const currentTrackObj = track || (currentTrack !== null ? trackData[currentTrack] : null);
        if (!currentTrackObj) {
            discImg.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
            return;
        }
        const cover = currentTrackObj.cover || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        validarCaratula(cover);
    } else {
        if (discImg.src && discImg.src.includes("https://santi-graphics.vercel.app/assets/img/Plato.png") === false) {
            discImg.src = "https://santi-graphics.vercel.app/assets/img/Plato.png";
            discImg.classList.add("rotating");
        }
    }
}

// ===============================
// CARGA DE PISTAS DESDE JSON (MODO LOCAL)
// ===============================
function cargarTracksDesdeJSON() {
    // 1. Nueva URL del JSON para Rumba
    fetch("https://radio-tekileros.vercel.app/Rumba.json")
        .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! status: ${res.status}`))
        .then(data => {
            // 2. Accedemos a la nueva raíz "rumba"
            const pistas = data["rumba"];

            if (!Array.isArray(pistas) || pistas.length === 0) {
                console.warn("❌ No se encontraron pistas válidas en el JSON de Rumba.");
                return;
            }

            // 3. Mapeo con FALLBACK INTELIGENTE para la URL del audio
            trackData = pistas.map(p => ({
                cover: p.caratula || "https://santi-graphics.vercel.app/assets/covers/Cover1.png",
                
                // 🔑 LÓGICA DE RESPALDO: 
                // Intenta leer 'enlace'. Si es undefined o null, usa 'dropbox_url'.
                url: p.enlace || p.dropbox_url, 
                
                artist: p.artista || "Artista Desconocido",
                name: p.nombre || "Canción Desconocida",
                album: p.album || "Álbum Desconocido",
                emotion: p.emotion || "",
                genero: p.genero || "",
                duracion: p.duracion || "0:00",
                id: p.id || "",
                seccion: p.seccion || ""
            }));

            currentTrack = 0;

            // Carga inicial de metadatos y SRC
            activarReproduccion(0, "initial-load"); 
            generarListaModal();
            console.log("✅ Pistas cargadas desde Rumba.json. Audio src preparado.");
        })
        .catch(err => {
            console.error("❌ Error CRÍTICO al cargar JSON:", err);
        });
}

// ===============================
// ▶️ FUNCIÓN UNIVERSAL DE REPRODUCCIÓN
// ===============================
function activarReproduccion(index, modo = "manual") {
    if (modoActual !== "local" || index < 0 || index >= trackData.length) return;

    const track = trackData[index];
    if (!track?.url) return;

    currentTrack = index;
        // --- ACTUALIZACIÓN VISUAL (Guardas críticas) ---
    if (currentTrackName) currentTrackName.textContent = track.name;
    if (currentArtistName) currentArtistName.textContent = track.artist || "Artista Desconocido";
    
    // 🔑 MARQUESINA CON ARTISTA Y TÍTULO (DIRECTO)
    if (metaTrack) {
        const textoCompleto = `${track.artist || "Artista Desconocido"} | ${track.name}`;
        metaTrack.textContent = textoCompleto;
        metaTrack.setAttribute("data-tag", textoCompleto);
        
        // Ajuste de velocidad dinámico según la longitud del texto
        const duracion = Math.max(12, textoCompleto.length * 0.35);
        metaTrack.style.setProperty('--scroll-duration', `${duracion}s`);
    }
    
    // --- CARGA DE AUDIO ---
    audio.src = track.url;
    audio.load(); 
    
    if (discImg) discImg.classList.add("rotating");
    actualizarCaratula(track);

    if (modo === "initial-load") {
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden");
        if (discImg) discImg.classList.remove("rotating");
        return; 
    }

    // --- REPRODUCCIÓN ---
    if (gestureDetected) {
        audio.muted = false;
        audio.play().then(() => {
            if (iconPlay) iconPlay.classList.add("hidden");
            if (iconPause) iconPause.classList.remove("hidden");
            actualizarModalActualTrack(); 
        }).catch(err => {
            console.error(`❌ Error de reproducción: ${audio.src}`, err);
            if (iconPause) iconPause.classList.add("hidden");
            if (iconPlay) iconPlay.classList.remove("hidden");
            if (discImg) discImg.classList.remove("rotating");
        });
    } else {
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden");
        if (discImg) discImg.classList.remove("rotating");
    }
}


// ==========================================================================
// MODO RADIO - LÓGICA DE ACTUALIZACIÓN (UNIFICADA Y ESTABLE)
// ==========================================================================

// 1. FUNCIONES AUXILIARES ORIGINALES (Se mantienen intactas, son robustas)
function formatArtist(artist) { 
    artist = artist.toLowerCase().trim();
    if (artist.includes(" &")) {
        artist = artist.substr(0, artist.indexOf(' &'));
    } else if (artist.includes("feat")) {
        artist = artist.substr(0, artist.indexOf(' feat'));
    } else if (artist.includes("ft.")) {
        artist = artist.substr(0, artist.indexOf(' ft.'));
    }
    return artist;
}

function formatTitle(title) { 
    title = title.toLowerCase().trim();
    if (title.includes("&")) {
        title = title.replace('&', 'and');
    } else if (title.includes("(")) {
        title = title.substr(0, title.indexOf(' ('));
    } else if (title.includes("ft")) {
        title = title.substr(0, title.indexOf(' ft'));
    }
    return title;
}

function detenerActualizacionRadio() {
    if (radioIntervalId !== null) {
        clearInterval(radioIntervalId);
        radioIntervalId = null;
    }
}

function obtenerCaratulaDesdeiTunes(artist, title) {
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
        if (discImg) {
            discImg.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
            discImg.classList.add("rotating");
        }
        return;
    }
    
    const formattedArtist = formatArtist(artist);
    const formattedTitle = formatTitle(title);
    const query = encodeURIComponent(`${formattedArtist} ${formattedTitle}`);
    const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

    $.ajax({
        dataType: 'jsonp',
        url: url,
        success: function(data) {
            let cover = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
            if (data.results && data.results.length >= 1) { // Cambiado a >= 1 por seguridad
                cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
            }
            if (discImg) {
                discImg.src = cover;
                discImg.classList.add("rotating");
            }
        },
        error: function() {
            if (discImg) {
                discImg.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
                discImg.classList.add("rotating");
            }
        }
    });
}


// Contador
function detenerContadorRadioescuchas() {
    if (contadorIntervalId !== null) {
        clearInterval(contadorIntervalId);
        contadorIntervalId = null;
    }
    if (contadorElemento) {
        contadorElemento.textContent = "0";
    }
}
        
// ===============================
// 2. LÓGICA DE METADATOS DEL NUEVO SERVIDOR (BLINDADA Y DEFINITIVA)
// ===============================
function iniciarActualizacionRadio() {
    detenerActualizacionRadio();
    iniciarContadorRadioescuchas();

    // Usamos el endpoint JSON que ya confirmamos que responde correctamente
    const radioUrl = "https://radio.technoplayerserver.com:8048/stats?json=1";
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(radioUrl)}`;

    async function actualizarDesdeServidor() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(proxyUrl, { 
                cache: 'no-cache',
                signal: controller.signal 
            });
            clearTimeout(timeoutId);

            if (!response.ok) return;

            const data = await response.json();
            const serverData = JSON.parse(data.contents); 
            
            if (!serverData) return;

            const rawTitle = serverData.songtitle ? serverData.songtitle.trim() : "";

            // 🔑 VALIDACIÓN DEFINITIVA: Si no hay título, aplicamos el fallback exacto solicitado
            if (!rawTitle || rawTitle === "") {
                const fallbackText = "ESCUCHAS RADIO FREEDOM IN YOUR SOUL - EXPRESION TACTIL UNIVERSAL";
                
                if (currentArtistName) currentArtistName.textContent = "Radio";
                if (currentTrackName) currentTrackName.textContent = fallbackText;
                if (metaTrack) metaTrack.textContent = fallbackText;
                
                // Carátula por defecto
                if (discImg) {
                    discImg.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
                    discImg.classList.add("rotating");
                }
                
                lastTrackTitle = fallbackText; // Evita peticiones innecesarias al no haber cambio
                return; 
            }

            // Si en el futuro el AutoDJ empieza a enviar data, la procesamos normalmente
            if (rawTitle === lastTrackTitle) return;
            lastTrackTitle = rawTitle;

            let artist = "Radio";
            let title = rawTitle;

            if (rawTitle.includes(" - ")) {
                const parts = rawTitle.split(" - ");
                artist = parts[0].trim();
                title = parts.slice(1).join(" - ").trim();
            }

            if (currentArtistName) currentArtistName.textContent = artist;
            if (currentTrackName) currentTrackName.textContent = title;
            if (metaTrack) metaTrack.textContent = `${artist} - ${title}`;
            
            obtenerCaratulaDesdeiTunes(artist, title);

        } catch (error) {
            // Silencioso (Timeout o error de red)
        }
    }

    actualizarDesdeServidor();
    radioIntervalId = setInterval(actualizarDesdeServidor, 15000); // 15 segundos
}

// ===============================
// 3. LÓGICA DEL CONTADOR (Optimizada con JSON)
// ===============================
function iniciarContadorRadioescuchas() {
    detenerContadorRadioescuchas();
    if (!contadorElemento) return;

    const statsUrl = "https://radio.technoplayerserver.com:8048/stats?json=1";
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(statsUrl)}`;

    async function actualizarContador() {
        if (modoActual !== "radio") return;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(proxyUrl, { 
                cache: 'no-cache',
                signal: controller.signal 
            });
            clearTimeout(timeoutId);

            if (!response.ok) return;
            
            const data = await response.json();
            const serverData = JSON.parse(data.contents);
            
            if (serverData && serverData.currentlisteners !== undefined) {
                contadorElemento.textContent = serverData.currentlisteners;
            }
        } catch (error) {
            // Silencioso
        }
    }
    
    actualizarContador();
    contadorIntervalId = setInterval(actualizarContador, 20000); // 20 segundos
}

// ===============================
// ACTIVAR MODO RADIO (URL DE STREAM ACTUALIZADA)
// ===============================
function activarModoRadio() {
    modoActual = "radio";
    detenerActualizacionRadio();
    
    // 🛑 LIMPIEZA VISUAL INMEDIATA
    if (currentArtistName) currentArtistName.textContent = "Conectando...";
    if (currentTrackName) currentTrackName.textContent = "Obteniendo datos...";
    
    if (discImg) {
        discImg.src = "https://santi-graphics.vercel.app/assets/img/Plato.png";
        discImg.classList.add("rotating");
    }
    
    audio.pause();
    
    // 🔑 CLAVE: Nueva URL del stream
    audio.src = "https://radio.technoplayerserver.com:8048/stream";
    audio.load();

    if (!gestureDetected) {
        audio.muted = true;
    } else {
        audio.muted = false;
    }
    
    audio.play().then(() => {
        if (iconPlay) iconPlay.classList.add("hidden");
        if (iconPause) iconPause.classList.remove("hidden");
    }).catch(err => {
        console.warn("🔒 Error al iniciar Radio automáticamente:", err);
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden"); 
    });

    iniciarActualizacionRadio();
}

// Activar Modo Local (se mantiene)
function activarModoLocal() {
    modoActual = "local";
    detenerActualizacionRadio();
    detenerContadorRadioescuchas();
    
    // Pausamos explícitamente
    audio.pause(); 
    
    if (discImg) discImg.classList.remove("rotating");
    
    // Mantenemos el mute si el gesto no ha ocurrido (aunque es poco probable a estas alturas)
    audio.muted = !gestureDetected;
    
    // 🔑 CRÍTICO: Resetear el icono a PLAY (Pista 0 está lista para reproducir)
    if (iconPause) iconPause.classList.add("hidden");
    if (iconPlay) iconPlay.classList.remove("hidden"); 
    
    cargarTracksDesdeJSON(); 
}

function actualizarMetaModo() {
    if (metaTrack) {
        metaTrack.textContent = modoActual === "radio" ? "🔊 Modo Radio activo" : "🎶 Modo Local activo";
    }
}

function actualizarBotonRadio() {
    const btn = document.getElementById("btn-radio");
    if (btn) {
        if (modoActual === "radio") {
            // MODO RADIO: "ENCENDIDO ORO"
            // Añadimos la clase que tiene todos los filtros de brillo y sombras
            btn.classList.add('active');
            
            // Ajustes de soporte por si hay estilos inline previos
            btn.style.backgroundColor = ""; // Dejamos que el CSS tome el mando
            btn.style.boxShadow = ""; 
            btn.style.color = "#000"; // Texto/Icono negro para resaltar sobre el oro
        } else {
            // MODO NORMAL: "OBSIDIANA EN REPOSO"
            btn.classList.remove('active');
            
            // Limpiamos estilos inline para que brille el diseño base de obsidiana
            btn.style.backgroundColor = "";
            btn.style.boxShadow = "";
            btn.style.color = "#d4af37"; // El texto vuelve a ser oro mate
        }
    }
}

// ===============================
// INICIALIZACIÓN Y GESTOS
// ===============================
function inicializarReproductor() {
    if (modoActual === "radio") {
        if (currentTrackName) currentTrackName.textContent = "Conectando Radio...";
        if (metaTrack) metaTrack.textContent = "🔊 Modo Radio activo";
        actualizarBotonRadio();
        if (discImg) {
            discImg.src = "https://santi-graphics.vercel.app/assets/img/Plato.png";
            discImg.classList.add("rotating");
        }
        activarModoRadio(); // Llama a la versión que fuerza el SRC y play silenciado
    } else {
        cargarTracksDesdeJSON();
    }
}

// Activación tras gesto humano (CRÍTICO: Listener global para capturar el primer click)
document.addEventListener("click", () => {
    if (!gestureDetected) {
        gestureDetected = true;
        
        // 🔑 CLAVE: La reproducción ya se inició (silenciada). Solo necesitamos quitar el mute.
        audio.muted = false; 

        if (audio.src && audio.paused) {
             // Si por alguna razón está pausado, intentamos forzar el play (ahora sin mute)
            audio.play().then(() => {
                if (iconPlay) iconPlay.classList.add("hidden");
                if (iconPause) iconPause.classList.remove("hidden");
                if (discImg) discImg.classList.add("rotating");
            });
        }
        
        // Si el audio estaba reproduciendo silenciado, solo se des-silencia.
        if (!audio.paused && modoActual === "radio") {
             if (iconPlay) iconPlay.classList.add("hidden");
             if (iconPause) iconPause.classList.remove("hidden");
        }
        
        console.log("🟢 Gesto humano: Audio desbloqueado.");
    }
}, { once: true }); 

document.addEventListener("DOMContentLoaded", () => {
    inicializarReproductor();
    inicializarVolumen();
    
    // TRUCO DEL GESTO: Intentar un mute/unmute al inicio
    if (audio) {
        audio.muted = true;
        audio.muted = false;
    }

    // ==========================================
    // 1. CONTROLADOR DE PLAY/PAUSE
    // ==========================================
    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            if (!audio.src) {
                console.error("❌ No hay stream cargado");
                return;
            }
            if (!gestureDetected) {
                gestureDetected = true;
                audio.muted = false;
            }
            if (audio.paused || audio.ended) {
                audio.play().then(() => {
                    playPauseBtn.classList.add("is-playing"); 
                    if (iconPlay) iconPlay.classList.add("hidden");
                    if (iconPause) iconPause.classList.remove("hidden");
                    if (discImg) discImg.classList.add("rotating"); 
                }).catch(err => {
                    console.warn("⚠️ Error en reproducción:", err);
                    playPauseBtn.classList.remove("is-playing");
                });
            } else {
                audio.pause();
                playPauseBtn.classList.remove("is-playing"); 
                if (iconPause) iconPause.classList.add("hidden");
                if (iconPlay) iconPlay.classList.remove("hidden");
                if (discImg) discImg.classList.remove("rotating");
            }
        });
    }

    // ==========================================
    // 2. LISTENERS DE BOTONES DE CONTROL
    // ==========================================
    if (nextBtn) nextBtn.addEventListener('click', nextTrack);
    if (prevBtn) prevBtn.addEventListener('click', prevTrack);
    if (shuffleBtn) shuffleBtn.addEventListener('click', toggleShuffle);
    if (repeatBtn) repeatBtn.addEventListener('click', toggleRepeat);

    // ==========================================
    // 3. 🔑 LISTENER DEL BOTÓN RADIO / LOCAL (BLINDADO)
    // ==========================================
    if (btnRadio) {
        btnRadio.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("📻 Botón Radio/Local presionado. Modo actual:", modoActual);
            
            // Desbloquear audio con el gesto
            if (!gestureDetected) { 
                gestureDetected = true; 
                if(audio) audio.muted = false;
            } 

            if (modoActual === "radio") {
                console.log("🔄 Cambiando a MODO LOCAL");
                activarModoLocal();
            } else {
                console.log("🔄 Cambiando a MODO RADIO");
                activarModoRadio();
            }

            actualizarMetaModo();
            actualizarBotonRadio();
        });
    }

    // ==========================================
    // 4. MANEJO DEL FINAL DE PISTA
    // ==========================================
    if (audio) {
        audio.onended = () => {
            if (modoActual !== "local") return;
            if (audio.loop) return;
            nextTrack();
        };
    }
    
    // ==========================================
    // 5. LISTENERS DEL MODAL (Abrir/Cerrar)
    // ==========================================
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleModal(true);
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleModal(false);
        });
    }

    if (modalTracks) {
        modalTracks.addEventListener('click', (e) => {
            if (e.target === modalTracks) {
                toggleModal(false);
            }
        });
    }
}); // <-- CIERRE DEL DOMContentLoaded

// ===============================
// ➡️ FUNCIÓN AVANZAR (NEXT)
// ===============================
function nextTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;

    if (currentTrack === null) currentTrack = 0;

    if (isShuffling) {
        let newIndex;
        if (trackData.length > 1) trackHistory.push(currentTrack);

        do {
            newIndex = Math.floor(Math.random() * trackData.length);
        } while (newIndex === currentTrack && trackData.length > 1);
        
        activarReproduccion(newIndex, "shuffle");

    } else {
        let nextIndex = (currentTrack + 1) % trackData.length;
        activarReproduccion(nextIndex, "next");
    }
}

// ===============================
// FUNCIÓN RETROCEDER (PREVIOUS)
// ===============================
function prevTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;

    let prevIndex;

    if (isShuffling && trackHistory.length > 0) {
        if (trackHistory.length > 0 && trackHistory[trackHistory.length - 1] === currentTrack) {
            trackHistory.pop(); 
        }
        prevIndex = trackHistory.pop();
    } else {
        prevIndex = (currentTrack - 1 + trackData.length) % trackData.length;
    }
    
    if (prevIndex !== undefined) {
        activarReproduccion(prevIndex, "prev");
    }
}

// ===============================
// FUNCIÓN REPETIR (REPEAT)
// ===============================
function toggleRepeat() {
    if (repeatMode !== "one") {
        repeatMode = "one";
        if (repeatBtn) {
            repeatBtn.classList.add("active-one");
            repeatBtn.classList.remove("active-all"); 
        }
        audio.loop = true;
    } else {
        repeatMode = "none";
        if (repeatBtn) repeatBtn.classList.remove("active-one");
        audio.loop = false;
    }
}

// ===============================
// FUNCIÓN ALEATORIO (SHUFFLE)
// ===============================
function toggleShuffle() {
    isShuffling = !isShuffling;

    if (isShuffling) {
        if (shuffleBtn) shuffleBtn.classList.add("active");
        trackHistory = [currentTrack];
        
        if (modoActual === "local" && trackData.length > 1) {
            nextTrack();
        }

    } else {
        if (shuffleBtn) shuffleBtn.classList.remove("active");
        trackHistory = [];
    }
}

// ===============================
// FUNCIÓN DE GENERACIÓN Y MANEJO DEL MODAL (LÓGICA DUAL)
// ===============================
function generarListaModal() {
    if (!trackList) return;

    trackList.innerHTML = ''; 
    
    // --- LÓGICA MODO RADIO (HISTORIAL) ---
    if (modoActual === "radio") {
        if (currentTrackNameModal) currentTrackNameModal.textContent = "Historial de Radio (Últimas 20)";
        
        if (trackHistory.length === 0) {
            const li = document.createElement('li');
            li.textContent = "Esperando la primera actualización de pista...";
            trackList.appendChild(li);
            return;
        }

        trackHistory.forEach((track, index) => {
            const li = document.createElement('li');
            // Formato: Hora | Artista - Título (Corregido: track.artist)
            li.textContent = `${track.time} | ${track.artist} - ${track.title}`; 
            // Las pistas del historial no son clicables para reproducción
            trackList.appendChild(li);
        });

    // --- LÓGICA MODO LOCAL (LISTA COMPLETA) ---
    } else if (modoActual === "local") {
        if (currentTrackNameModal) currentTrackNameModal.textContent = "Lista de Pistas Locales";
        
        if (trackData.length === 0) return;

        trackData.forEach((track, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-index', index);
            li.textContent = `${index + 1}. ${track.artist} | ${track.name}`;

            li.addEventListener('click', () => {
                // Aquí el modo local es necesario
                if (modoActual !== "local") return; 
                
                const selectedIndex = parseInt(li.getAttribute('data-index'));
                activarReproduccion(selectedIndex, "modal-click");
                toggleModal(false);
            });

            trackList.appendChild(li);
        });
        // Llama a esta función para resaltar la pista actual
        actualizarModalActualTrack(); 
    }
}
    
// ===============================
// 🔒 FUNCIÓN ABRIR/CERRAR MODAL (VERSIÓN COMPLETA Y BLINDADA)
// ===============================
function toggleModal(show) {
    if (!modalTracks) {
        console.error("❌ ERROR: No se encontró el elemento #modal-tracks en el HTML");
        return;
    }

    if (show) {
        modalTracks.classList.remove('hidden');
        generarListaModal(); // Genera la lista dinámica (Radio o Local)
        
        // Usamos 'true' (capture) para interceptar el clic antes de que otros scripts lo anulen
        document.addEventListener("click", cerrarPorOutside, true);
        document.addEventListener("keydown", cerrarPorEsc);
    } else {
        modalTracks.classList.add('hidden');
        
        document.removeEventListener("click", cerrarPorOutside, true);
        document.removeEventListener("keydown", cerrarPorEsc);
    }
}

function cerrarPorOutside(e) {
    if (!modalTracks) return;
    
    // Si el clic ocurrió DENTRO del modal, no hacemos nada (lo dejamos abierto)
    if (modalTracks.contains(e.target)) {
        return;
    }
    
    // Si el clic fue FUERA del modal, lo cerramos
    toggleModal(false);
}

function cerrarPorEsc(e) {
    if (e.key === "Escape") {
        toggleModal(false);
    }
}


// ===============================
// FUNCIÓN DE RESALTADO DE PISTA ACTIVA
// ===============================
function actualizarModalActualTrack() {
    if (modoActual !== 'local' || trackData.length === 0) return;

    // Desactiva el resaltado de la pista anterior
    document.querySelectorAll('.track-list li').forEach(li => {
        li.classList.remove('active-track');
    });
    
    // Resalta la pista actual y la desplaza
    const currentTrackItem = document.querySelector(`.track-list li[data-index="${currentTrack}"]`);
    if (currentTrackItem) {
        currentTrackItem.classList.add('active-track');
        // Asegura que la pista activa sea visible
        currentTrackItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    if (currentTrackNameModal && currentTrack !== null) {
        // Muestra el nombre de la pista actual en el encabezado del modal
        currentTrackNameModal.textContent = trackData[currentTrack].name;
    }
}

// ===============================
// FUNCIÓN DE CONTROL DE VOLUMEN (SILVER)
// ===============================
function actualizarBarraVolumen(volume) {
    const percentage = volume * 100;
    
    if (volumeBar) {
        // En lugar de pintar colores aquí, enviamos el valor al CSS
        // Esto garantiza que el degradado y el pivote compartan el mismo eje
        volumeBar.style.setProperty('--p', `${percentage}%`);
    }

    if (volumeIcon) {
        if (volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute volume-icon';
        } else if (volume > 0.6) {
            volumeIcon.className = 'fas fa-volume-up volume-icon';
        } else {
            volumeIcon.className = 'fas fa-volume-down volume-icon';
        }
    }
}

function inicializarVolumen() {
    const initialVolume = 70; 
    const audioVolume = initialVolume / 100;

    // Buscamos los elementos en el DOM (ya que se crean dinámicamente)
    const volumeBar = document.getElementById('volumeBar');
    const volumeIcon = document.getElementById('volumeIcon');

    if (volumeBar) {
        volumeBar.value = initialVolume;
        actualizarBarraVolumen(audioVolume);
        
        if (audio) { audio.volume = audioVolume; }

        volumeBar.addEventListener('input', () => {
            const val = volumeBar.value;
            const newVolume = val / 100;
            
            if (audio) { audio.volume = newVolume; }
            actualizarBarraVolumen(newVolume);
        });
    }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANIMACIÓN DE TEXTO BIENVENIDA (SIN LOGS)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  const words = document.getElementsByClassName('word');
  const wordArray = [];
  let currentWord = 0;

  if (words.length === 0) return;

  words[currentWord].style.opacity = 1;
  
  for (let i = 0; i < words.length; i++) {
    splitLetters(words[i]);
  }

  function changeWord() {
    const cw = wordArray[currentWord];
    const nw = currentWord === words.length - 1 ? wordArray[0] : wordArray[currentWord + 1];
    
    for (let i = 0; i < cw.length; i++) {
      animateLetterOut(cw, i);
    }
    
    for (let i = 0; i < nw.length; i++) {
      nw[i].className = 'letter behind';
      nw[0].parentElement.style.opacity = 1;
      animateLetterIn(nw, i);
    }
    
    currentWord = (currentWord === wordArray.length - 1) ? 0 : currentWord + 1;
  }

  function animateLetterOut(cw, i) {
    setTimeout(() => {
      cw[i].className = 'letter out';
    }, i * 80);
  }

  function animateLetterIn(nw, i) {
    setTimeout(() => {
      nw[i].className = 'letter in';
    }, 340 + (i * 80));
  }

  function splitLetters(word) {
    const content = word.innerHTML;
    word.innerHTML = '';
    const letters = [];
    
    for (let i = 0; i < content.length; i++) {
      const letter = document.createElement('span');
      letter.className = 'letter';
      letter.innerHTML = content.charAt(i);
      word.appendChild(letter);
      letters.push(letter);
    }
    wordArray.push(letters);
  }

  changeWord();
  setInterval(changeWord, 4000);
});

// ==================================
// INFORMACIÓN FECHA Y HORA (modular)
// ==================================
(() => {
  const STATE = { intervalId: null, selector: '#info-time-text' };

  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  function formatear(now) {
    const diaSemana = diasSemana[now.getDay()];
    const diaMes = String(now.getDate()).padStart(2,'0');
    const mes = meses[now.getMonth()];
    const anio = now.getFullYear();
    const horas = String(now.getHours()).padStart(2,'0');
    const minutos = String(now.getMinutes()).padStart(2,'0');
    // Ej.: Viernes 07 de Noviembre, 2025 | 17:00
    return `${diaSemana} ${diaMes} de ${mes}, ${anio} | ${horas}:${minutos}`;
  }

  function tick(el) {
    el.textContent = formatear(new Date());
  }

  function start(selector = STATE.selector) {
    const el = document.querySelector(selector);
    if (!el) return; // sin ruido si aún no existe
    // Evita duplicados
    if (STATE.intervalId) clearInterval(STATE.intervalId);
    tick(el);
    STATE.intervalId = setInterval(() => tick(el), 60000);
  }

  // Arranque seguro cuando DOM esté listo
  document.addEventListener('DOMContentLoaded', () => start());

  // API mínima en window para reiniciar desde otros scripts si fuera necesario
  window.InfoTime = {
    start,
    stop: () => { if (STATE.intervalId) clearInterval(STATE.intervalId); STATE.intervalId = null; }
  };
})();


// ==================================
// Mostrar mensaje al hacer clic derecho
// ==================================
document.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // evitar menú contextual
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  // Ocultar automáticamente después de unos segundos
  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);
});

// ===============================
// SOPORTE PARA MODO DINÁMICO (Repro62.js)
// ===============================
window.addEventListener("repro-ready", () => {
    // Re-capturar referencias (ahora el DOM fue reconstruido por Repro62.js)
    audio = document.getElementById("player");
    playPauseBtn = document.getElementById("btn-play-pause");
    nextBtn = document.getElementById("next-button");
    prevBtn = document.getElementById("prev-button");
    shuffleBtn = document.getElementById("shuffle-button");
    repeatBtn = document.getElementById("repeat-button");
    btnRadio = document.getElementById("btn-radio");
    iconPlay = playPauseBtn ? playPauseBtn.querySelector(".icon-play") : null;
    iconPause = playPauseBtn ? playPauseBtn.querySelector(".icon-pause") : null;
    discImg = document.getElementById("disc-img");
    currentTrackName = document.getElementById("current-track-name");
    currentArtistName = document.getElementById("current-artist-name");
    metaTrack = document.getElementById("meta-track");
    volumeBar = document.getElementById("volumeBar");
    volumeIcon = document.getElementById("volumeIcon");
    contadorElemento = document.getElementById("contadorRadio");
    modalTracks = document.getElementById("modal-tracks");
    menuBtn = document.getElementById("btn-menu-tracks");
    closeModalBtn = document.getElementById("close-modal");
    trackList = document.querySelector(".track-list");
    currentTrackNameModal = document.getElementById('current-track-name') || document.getElementById('current-track-name-modal');

    // Re-inicializar
    inicializarReproductor();
    inicializarVolumen();
    
    // Re-registrar listeners (los anteriores ya no sirven porque los elementos son nuevos)
    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            if (!audio || !audio.src) return;
            if (!gestureDetected) { gestureDetected = true; audio.muted = false; }
            if (audio.paused || audio.ended) {
                audio.play().then(() => {
                    playPauseBtn.classList.add("is-playing"); 
                    if (iconPlay) iconPlay.classList.add("hidden");
                    if (iconPause) iconPause.classList.remove("hidden");
                    if (discImg) discImg.classList.add("rotating"); 
                }).catch(() => { playPauseBtn.classList.remove("is-playing"); });
            } else {
                audio.pause();
                playPauseBtn.classList.remove("is-playing"); 
                if (iconPause) iconPause.classList.add("hidden");
                if (iconPlay) iconPlay.classList.remove("hidden");
                if (discImg) discImg.classList.remove("rotating");
            }
        });
    }

    if (nextBtn) nextBtn.addEventListener('click', nextTrack);
    if (prevBtn) prevBtn.addEventListener('click', prevTrack);
    if (shuffleBtn) shuffleBtn.addEventListener('click', toggleShuffle);
    if (repeatBtn) repeatBtn.addEventListener('click', toggleRepeat);

    if (audio) {
        audio.onended = () => { if (modoActual !== "local" || audio.loop) return; nextTrack(); };
    }
    
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleModal(true); });
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleModal(false); });
    }
    if (modalTracks) {
        modalTracks.addEventListener('click', (e) => { if (e.target === modalTracks) toggleModal(false); });
    }

    document.addEventListener("click", () => {
        if (!gestureDetected && audio) {
            gestureDetected = true;
            audio.muted = false;
            if (audio.src && audio.paused) {
                audio.play().then(() => {
                    if (iconPlay) iconPlay.classList.add("hidden");
                    if (iconPause) iconPause.classList.remove("hidden");
                    if (discImg) discImg.classList.add("rotating");
                });
            }
        }
    }, { once: true });
});

// ==========================================================================
// SOPORTE PARA INTERFAZ DINÁMICA (Re-vincular eventos tras crear el DOM)
// ==========================================================================
window.addEventListener("repro-ready", () => {
    console.log("🔄 Re-vinculando eventos a la nueva interfaz dinámica...");

    // 1. Re-capturar referencias del DOM recién creado
    const btnRadio = document.getElementById("btn-radio");
    const audio = document.getElementById("player");

    // 2. Re-atachar el listener de cambio de modo (Radio <-> Local)
    if (btnRadio) {
        // Eliminamos listeners antiguos por si acaso
        const newBtnRadio = btnRadio.cloneNode(true);
        btnRadio.parentNode.replaceChild(newBtnRadio, btnRadio);
        
        newBtnRadio.addEventListener("click", () => {
            console.log("📻 Botón Radio/Local presionado");
            
            // Desbloquear audio con el gesto
            if (!gestureDetected) { 
                gestureDetected = true; 
                if(audio) audio.muted = false;
            } 

            const contenedorFondo = document.querySelector('.bg-water');

            if (modoActual === "radio") {
                activarModoLocal();
                if (contenedorFondo) contenedorFondo.classList.remove('modo-radio-active');
            } else {
                activarModoRadio();
                if (contenedorFondo) contenedorFondo.classList.add('modo-radio-active');
            }

            actualizarMetaModo();
            actualizarBotonRadio();
        });
    }

    // 3. Re-atachar otros controles críticos si es necesario
    const playPauseBtn = document.getElementById("btn-play-pause");
    if (playPauseBtn && audio) {
        playPauseBtn.addEventListener("click", () => {
            if (!gestureDetected) { gestureDetected = true; audio.muted = false; }
            if (audio.paused || audio.ended) {
                audio.play().then(() => {
                    playPauseBtn.classList.add("is-playing"); 
                    const iconPlay = playPauseBtn.querySelector(".icon-play");
                    const iconPause = playPauseBtn.querySelector(".icon-pause");
                    if (iconPlay) iconPlay.classList.add("hidden");
                    if (iconPause) iconPause.classList.remove("hidden");
                    const discImg = document.getElementById("disc-img");
                    if (discImg) discImg.classList.add("rotating");
                }).catch(() => { playPauseBtn.classList.remove("is-playing"); });
            } else {
                audio.pause();
                playPauseBtn.classList.remove("is-playing"); 
                const iconPlay = playPauseBtn.querySelector(".icon-play");
                const iconPause = playPauseBtn.querySelector(".icon-pause");
                if (iconPause) iconPause.classList.add("hidden");
                if (iconPlay) iconPlay.classList.remove("hidden");
                const discImg = document.getElementById("disc-img");
                if (discImg) discImg.classList.remove("rotating");
            }
        });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOTOR DE FONDOS R64: DUAL (PIXIJS PARA VIDEO + RIPPLES PARA IMAGEN)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let pixiApp = null;
let ripplesInstance = null;

function cambiarFondoR64(url) {
    if (!url) return;

    const esVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');

    // LIMPIEZA TOTAL DE EFECTOS ANTERIORES
    if (pixiApp) {
        pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
        pixiApp = null;
    }
    if (ripplesInstance) {
        try {
            $('#contenedor-animado').ripples('destroy');
        } catch(e) {
            console.warn("Ripples no estaba activo");
        }
        ripplesInstance = null;
    }
    $('#contenedor-animado').empty();

    if (esVideo) {
        console.log("🎬 MODO VIDEO: Activando PixiJS");
        activarFondoVideo(url);
    } else {
        console.log("🖼️ MODO IMAGEN: Activando Ripples");
        activarFondoImagen(url);
    }
}

// ==========================================================================
// MODO VIDEO: PIXIJS (EFECTO HIPER AGRESIVO)
// ==========================================================================
function activarFondoVideo(url) {
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    
    video.play().then(() => {
        console.log("✅ Video reproduciéndose");
        
        pixiApp = new PIXI.Application({
            width: 600,
            height: 400,
            transparent: true,
            backgroundAlpha: 0,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        
        $('#contenedor-animado').empty().append(pixiApp.view).show();
        
        // CAPA 1: EFECTO AUTOMÁTICO (MÁS AGRESIVO)
        const autoDisplacementTexture = PIXI.Texture.from('https://i.imgur.com/2yYayZk.png');
        const autoDisplacementSprite = new PIXI.Sprite(autoDisplacementTexture);
        autoDisplacementTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
        autoDisplacementSprite.scale.set(5); // 🔥 Aumentado de 3 a 5
        pixiApp.stage.addChild(autoDisplacementSprite);
        
        // CAPA 2: EFECTO MANUAL (MUCHO MÁS AGRESIVO)
        const manualDisplacementTexture = PIXI.Texture.from('https://i.imgur.com/2yYayZk.png');
        const manualDisplacementSprite = new PIXI.Sprite(manualDisplacementTexture);
        manualDisplacementTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
        manualDisplacementSprite.scale.set(12); // 🔥 Aumentado de 6 a 12 (Distorsión extrema al pasar el mouse)
        pixiApp.stage.addChild(manualDisplacementSprite);
        
        // VIDEO CON AMBOS FILTROS
        const videoTexture = PIXI.Texture.from(video);
        const videoSprite = new PIXI.Sprite(videoTexture);
        videoSprite.width = 600;
        videoSprite.height = 400;
        
        const autoFilter = new PIXI.filters.DisplacementFilter(autoDisplacementSprite);
        const manualFilter = new PIXI.filters.DisplacementFilter(manualDisplacementSprite);
        videoSprite.filters = [autoFilter, manualFilter];
        
        pixiApp.stage.addChild(videoSprite);
        
        // INTERACCIÓN MANUAL
        pixiApp.stage.eventMode = 'static';
        pixiApp.stage.hitArea = pixiApp.screen;
        
        pixiApp.stage.on('pointermove', (event) => {
            // Ajustado el offset para centrar mejor el efecto más grande
            manualDisplacementSprite.x = event.global.x - 200;
            manualDisplacementSprite.y = event.global.y - 200;
        });
        
        // ANIMACIÓN AUTOMÁTICA (MÁS RÁPIDA Y FLUIDA)
        pixiApp.ticker.add(() => {
            autoDisplacementSprite.x += 2.5; // 🔥 Aumentado de 1.5 a 2.5
            autoDisplacementSprite.y += 2.5;
        });
        
        console.log("✅ PixiJS activo: Efecto HIPER agresivo automático + manual");
    }).catch(err => {
        console.error("❌ Error:", err);
    });
}

// ==========================================================================
// MODO IMAGEN: JQUERY RIPPLES
// ==========================================================================
function activarFondoImagen(url) {
    console.log("🖼️ MODO IMAGEN: Aplicando Ripples a .bg-water");
    
    const $bgWater = $('.bg-water');
    
    // Aplicar la imagen como fondo de .bg-water
    $bgWater.css('background-image', `url('${url}')`);
    
    // Esperar a que la imagen cargue
    const img = new Image();
    img.onload = function() {
        console.log("✅ Imagen cargada. Aplicando Ripples con parámetros originales...");
        
        setTimeout(() => {
            try {
                // PARÁMETROS ORIGINALES EXACTOS - 100% MANUAL
                ripplesInstance = $bgWater.ripples({
                    resolution: 200,
                    dropRadius: 20,
                    perturbance: 0.04,
                    interactive: true
                });
                
                console.log("✅ Ripples activo. Mueve el mouse sobre el fondo.");
            } catch(e) {
                console.error("❌ Error al aplicar Ripples:", e);
            }
        }, 200);
    };
    
    img.onerror = function() {
        console.error("❌ No se pudo cargar la imagen:", url);
    };
    
    img.src = url;
}

// ==========================================================================
// GESTOR DE FONDOS R65: VIDEO -> AGUA -> TRANSPARENTE (VALORES RESTAURADOS)
// ==========================================================================
let estadoFondo = 0; // 0: Video, 1: Agua, 2: Transparente

const CONFIG_FONDOS = {
    video: 'https://santi-graphics.vercel.app/assets/video/Freedom.mp4',
    imagen: 'https://i.ibb.co/wrhf6TLM/Freedom-Custom.png'
};

function limpiarFondos() {
    // 1. Destruir PixiJS (Video)
    if (pixiApp) {
        pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
        pixiApp = null;
    }
    // 2. Destruir Ripples (Imagen)
    if (ripplesInstance) {
        try {
            $('.bg-water').ripples('destroy');
        } catch(e) {
            console.warn("Ripples ya estaba destruido o inactivo");
        }
        ripplesInstance = null;
    }
    // 3. Limpiar contenedor animado y estado del botón
    $('#contenedor-animado').empty().hide();
    $('#btn-bg-mode').removeClass('modo-transparente');
    
    // 4. 🛑 ELIMINADO: Ya no restauramos el fondo base aquí
    // Cada modo se encargará de configurar su propio fondo explícitamente
}

function aplicarModoFondo() {
    limpiarFondos();

    if (estadoFondo === 0) {
        // MODO 1: VIDEO (PixiJS)
        console.log("🎬 MODO FONDO: Video");
        // No configuramos background-image aquí porque PixiJS usa un canvas transparente
        // El video se renderiza directamente en el canvas de Pixi
        $('#contenedor-animado').show();
        activarFondoVideo(CONFIG_FONDOS.video);
        
    } else if (estadoFondo === 1) {
        // MODO 2: IMAGEN ESTÁTICA + EFECTO AGUA (Ripples)
        console.log("💧 MODO FONDO: Imagen con efecto agua");
        // Configuramos el fondo explícitamente con los valores originales
        $('.bg-water').css('background', `url('${CONFIG_FONDOS.imagen}') no-repeat center center / cover`);
        activarFondoImagen(CONFIG_FONDOS.imagen);
        
    } else if (estadoFondo === 2) {
        // MODO 3: TRANSPARENCIA TOTAL
        console.log("🫥 MODO FONDO: Transparencia Total");
        $('#btn-bg-mode').addClass('modo-transparente');
        
        $('.bg-water').css('background', 'transparent');
        $('.bg-water').css('background-color', 'transparent');
        $('.bg-water').css('background-image', 'none');
        $('#contenedor-animado').empty().hide();
    }
}

function ciclarFondo() {
    estadoFondo = (estadoFondo + 1) % 3; // Ciclo: 0 -> 1 -> 2 -> 0...
    aplicarModoFondo();
}

// ==========================================
// INICIALIZACIÓN DEL GESTOR
// ==========================================
$(document).ready(function() {
    $('#btn-bg-mode').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        ciclarFondo();
    });

    // Iniciar en el modo por defecto (0 = Video) al cargar
    aplicarModoFondo();
});
