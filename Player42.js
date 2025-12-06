// ===============================
// 🎧 INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
// ===============================
let trackData = [];
let currentTrack = null;
let modoActual = "radio"; // "radio" o "local"
let audio = document.getElementById("player");
let gestureDetected = false;
let repeatMode = "none";
let isShuffling = false;
let trackHistory = [];
let radioIntervalId = null; 
let lastTrackTitle = "";
let contadorIntervalId = null;

// ===============================
// 🎯 ELEMENTOS CLAVE DEL DOM
// ===============================
const playPauseBtn = document.getElementById("btn-play-pause");
const nextBtn = document.getElementById("next-button");
const prevBtn = document.getElementById("prev-button");
const shuffleBtn = document.getElementById("shuffle-button");
const repeatBtn = document.getElementById("repeat-button");
const btnRadio = document.getElementById("btn-radio");

const iconPlay = playPauseBtn ? playPauseBtn.querySelector(".icon-play") : null;
const iconPause = playPauseBtn ? playPauseBtn.querySelector(".icon-pause") : null;

const discImg = document.getElementById("disc-img");
const currentTrackName = document.getElementById("current-track-name");
const currentArtistName = document.getElementById("current-artist-name");
const metaTrack = document.getElementById("meta-track"); 

const volumeBar = document.getElementById("volumeBar");
const volumeIcon = document.getElementById("volumeIcon");

const contadorElemento = document.getElementById("contadorRadio");

const modalTracks = document.getElementById("modal-tracks");
const menuBtn = document.getElementById("btn-menu-tracks");
const closeModalBtn = document.getElementById("close-modal");
const trackList = document.querySelector(".track-list"); 
const currentTrackNameModal = document.getElementById('current-track-name-modal');

// ===============================
// 🖼️ FUNCIONES AUXILIARES (Carátulas)
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
// 📦 CARGA DE PISTAS DESDE JSON (MODO LOCAL)
// ===============================
function cargarTracksDesdeJSON() {
    fetch("https://radio-tekileros.vercel.app/Bandida.json")
        .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! status: ${res.status}`))
        .then(data => {
            const pistas = data.bandida;

            if (!Array.isArray(pistas) || pistas.length === 0) {
                console.warn("❌ No se encontraron pistas válidas en el JSON.");
                return;
            }

            // 🔑 Mapeo al formato que Player20.js espera
            trackData = pistas.map(p => ({
                cover: p.caratula,
                url: p.dropbox_url,
                artist: p.artista,
                name: p.nombre,
                album: p.album,
                emotion: p.emotion,
                genero: p.genero,
                duracion: p.duracion,
                id: p.id,
                seccion: p.seccion
            }));

            currentTrack = 0;

            // Carga inicial de metadatos y SRC
            activarReproduccion(0, "initial-load"); 
            generarListaModal();
            console.log("✅ Pistas cargadas desde Bandida.json. Audio src preparado.");
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
    if (metaTrack) {
        metaTrack.textContent = track.name;
        metaTrack.setAttribute("data-tag", track.name);
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


// ===============================
// 📻 MODO RADIO - LÓGICA DE ACTUALIZACIÓN (Reforzada)
// ===============================

// Funciones Auxiliares (formatArtist, formatTitle, obtenerCaratulaDesdeiTunes, detenerActualizacionRadio)
// NOTA: Se asume que las funciones formatArtist, formatTitle y obtenerCaratulaDesdeiTunes están definidas.
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
            discImg.src = 'assets/covers/Plato.png';
            discImg.classList.add("rotating");
        }
        return;
    }
    // ... (Lógica de jQuery AJAX para iTunes) ...
    const formattedArtist = formatArtist(artist);
    const formattedTitle = formatTitle(title);
    const query = encodeURIComponent(`${formattedArtist} ${formattedTitle}`);
    const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

    $.ajax({
        dataType: 'jsonp',
        url: url,
        success: function(data) {
            let cover = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
            if (data.results && data.results.length === 1) {
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


// ===============================
// 📻 MODO RADIO - LÓGICA DE ACTUALIZACIÓN (Historial y Metadatos)
// ===============================
function iniciarActualizacionRadio() {
    detenerActualizacionRadio();
    iniciarContadorRadioescuchas();

    const radioUrl = "https://technoplayerserver.net:8018/currentsong?sid=1";
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

    async function actualizarDesdeServidor() {
        try {
            const response = await fetch(proxyUrl, { cache: 'no-cache' });
            const newSongTitleRaw = await response.text();
            
            const cleanedTitle = newSongTitleRaw.trim().replace(/AUTODJ/gi, '').replace(/\|\s*$/g, '').trim();

            if (!cleanedTitle || cleanedTitle.toLowerCase().includes('offline') || cleanedTitle === lastTrackTitle) {
                 if (cleanedTitle && cleanedTitle.toLowerCase().includes('offline')) {
                     if (currentArtistName) currentArtistName.textContent = "¡Música sí!";
                     if (currentTrackName) currentTrackName.textContent = "Datos bloqueados";
                 }
                 return;
            }
            
            lastTrackTitle = cleanedTitle;
            
            const songtitleSplit = cleanedTitle.split(/ - | – /);
            let artist = "Radio";
            let title = cleanedTitle; 

            if (songtitleSplit.length >= 2) {
                artist = songtitleSplit[0].trim();
                title = songtitleSplit.slice(1).join(' - ').trim(); 
            }
            
            // 🛑 CRÍTICO: ALIMENTAR EL HISTORIAL DE RADIO
            const currentTrackTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const newHistoryEntry = {
                artist: artist,
                title: title,
                time: currentTrackTime
            };

            // Asegura que no se añada la misma pista dos veces seguidas
            if (trackHistory.length === 0 || trackHistory[0].title !== title) {
                trackHistory.unshift(newHistoryEntry); // Añadir al inicio
                // Limitar el historial a 20 entradas
                if (trackHistory.length > 20) {
                    trackHistory.pop();
                }
            }
            // ---------------------------------------------
            
            const fullTrackInfo = `${artist} - ${title}`;

            // Actualización Visual (Controles principales)
            if (currentArtistName) currentArtistName.textContent = artist;
            if (currentTrackName) currentTrackName.textContent = title;
            if (metaTrack) metaTrack.textContent = fullTrackInfo;
            
            // ... (Lógica de marquesina y carátula) ...

            obtenerCaratulaDesdeiTunes(artist, title);

        } catch (error) {
            console.error("❌ Error CRÍTICO en la actualización de Radio:", error);
            if (currentArtistName) currentArtistName.textContent = "Error";
            if (currentTrackName) currentTrackName.textContent = "al cargar metadatos";
        }
    }

    actualizarDesdeServidor();
    radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
}
    
// ===================================
// 📻 MODO RADIO - LÓGICA CONTADOR RADIOESCUCHAS
// ===================================
function detenerContadorRadioescuchas() {
    if (contadorIntervalId !== null) clearInterval(contadorIntervalId);
    contadorIntervalId = null;
    if (contadorElemento) contadorElemento.textContent = "";
}

function iniciarContadorRadioescuchas() {
    detenerContadorRadioescuchas();
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined' || !contadorElemento) return;
    const contadorUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";
    function actualizarContador() {
        if (modoActual !== "radio") { detenerContadorRadioescuchas(); return; }
        $.ajax({
            dataType: 'jsonp',
            url: contadorUrl,
            success: function(data) {
                contadorElemento.textContent = data.currentlisteners || "0";
            },
            error: function() {
                contadorElemento.textContent = "0";
            },
            timeout: 5000
        });
    }
    actualizarContador();
    contadorIntervalId = setInterval(actualizarContador, 15000);
}

// ===============================
// 🔄 ALTERNANCIA DE MODOS
// ===============================

if (btnRadio) {
    btnRadio.addEventListener("click", () => {
        // Captura el gesto si no ha ocurrido (el cambio de modo es un gesto válido)
        if (!gestureDetected) { 
            gestureDetected = true; 
            audio.muted = false;
        } 

        if (modoActual === "radio") {
            activarModoLocal();
        } else {
            activarModoRadio();
        }
        actualizarMetaModo();
        actualizarBotonRadio();
    });
}

// Activar Modo Radio (CRÍTICO: Inicia el stream silenciado)
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
    
    // 🔑 CLAVE 1: Pausar y resetear el estado de reproducción del modo anterior
    audio.pause();
    
    // 🔑 CLAVE 2: Asignar el SRC
    audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
    audio.load();

    // 1. Asegurarse de que el audio esté silenciado temporalmente (el gesto ya lo desbloqueó)
    if (!gestureDetected) {
        audio.muted = true;
    } else {
        audio.muted = false; // Si ya hay gesto, no silenciamos
    }
    
    // 2. Intentar reproducir el nuevo stream
    audio.play().then(() => {
        // ÉXITO en la reproducción
        if (iconPlay) iconPlay.classList.add("hidden");
        if (iconPause) iconPause.classList.remove("hidden");
    }).catch(err => {
        // FALLO, pero la fuente está cargada y lista para reintentar con el botón Play/Pause
        console.warn("🔒 Error al iniciar Radio automáticamente en transición:", err);
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden"); 
    });

    iniciarActualizacionRadio(); // Inicia la búsqueda de metadatos
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
            btn.style.backgroundColor = "#9400D350";   // rojo intenso para modo radio
        } else {
            btn.style.backgroundColor = "#3688ff";   // azul para modo normal
        }
    }
}

// ===============================
// 🧭 INICIALIZACIÓN Y GESTOS
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
    
    // 🔑 TRUCO DEL GESTO: Intentar un mute/unmute.
    if (audio) {
        audio.muted = true;
        audio.muted = false;
    }


    // ===============================
    // 🎛️ BOTONERA
    // ===============================

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            if (!audio.src) {
                console.warn("⚠️ No hay fuente de audio (audio.src) definida para reproducir.");
                return;
            }

            if (!gestureDetected) {
                gestureDetected = true;
                audio.muted = false;
            }

            if (audio.paused || audio.ended) {
                audio.play().then(() => {
                    if (iconPlay) iconPlay.classList.add("hidden");
                    if (iconPause) iconPause.classList.remove("hidden");
                    if (discImg) discImg.classList.add("rotating");
                }).catch(err => {
                    console.warn("⚠️ Error al reanudar:", err);
                });
            } else {
                audio.pause();
                if (iconPause) iconPause.classList.add("hidden");
                if (iconPlay) iconPlay.classList.remove("hidden");
                if (discImg) discImg.classList.remove("rotating");
            }
        });
    }

    // LISTENERS DE BOTONES LOCALES
    if (nextBtn) nextBtn.addEventListener('click', nextTrack);
    if (prevBtn) prevBtn.addEventListener('click', prevTrack);
    if (shuffleBtn) shuffleBtn.addEventListener('click', toggleShuffle);
    if (repeatBtn) repeatBtn.addEventListener('click', toggleRepeat);

    // MANEJO DEL FINAL DE PISTA
    if (audio) {
        audio.onended = () => {
            if (modoActual !== "local") return;
            if (audio.loop) {
                return;
            }
            nextTrack();
        };
    }
    
    // LISTENERS DEL MODAL (Abrir/Cerrar)
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            toggleModal(true);
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
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
    
    iniciarBurbujas(); 
}); 

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
// ⬅️ FUNCIÓN RETROCEDER (PREVIOUS)
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
// 🔁 FUNCIÓN REPETIR (REPEAT)
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
// 🔀 FUNCIÓN ALEATORIO (SHUFFLE)
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
// 🪟 FUNCIÓN DE GENERACIÓN Y MANEJO DEL MODAL (LÓGICA DUAL)
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
            // Formato: Hora | Artista - Título
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
            li.textContent = `${index + 1}. ${track.name}`;

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
// 🔒 FUNCIÓN ABRIR/CERRAR MODAL (VERSIÓN COMPLETA)
// ===============================
function toggleModal(show) {
    if (!modalTracks) return; 

    if (show) {
        modalTracks.classList.remove('hidden');
        generarListaModal(); // lógica dual (Radio/Local)

        // Listener para cerrar con clic fuera de la caja principal
        document.addEventListener("click", cerrarPorOutside);
        // Listener para cerrar con ESC
        document.addEventListener("keydown", cerrarPorEsc);

    } else {
        modalTracks.classList.add('hidden');

        // Limpieza de listeners
        document.removeEventListener("click", cerrarPorOutside);
        document.removeEventListener("keydown", cerrarPorEsc);
    }
}

function cerrarPorOutside(e) {
    const reproBox = document.querySelector(".repro-box");
    if (!reproBox) return;

    // Si el click NO ocurrió dentro de la caja principal, cerramos el modal
    if (!reproBox.contains(e.target)) {
        toggleModal(false);
    }
}

function cerrarPorEsc(e) {
    if (e.key === "Escape") {
        toggleModal(false);
    }
}


// ===============================
// 💡 FUNCIÓN DE RESALTADO DE PISTA ACTIVA
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
// 🔊 FUNCIÓN DE CONTROL DE VOLUMEN
// ===============================
function actualizarBarraVolumen(volume) {
    const percentage = volume * 100;
    const activeColor = '#ff0000';
    const inactiveColor = '#722F37';

    if (volumeBar) {
        volumeBar.style.background = `linear-gradient(
            to right,
            ${activeColor} 0%,
            ${activeColor} ${percentage}%,
            ${inactiveColor} ${percentage}%,
            ${inactiveColor} 100%
        )`;
    }
}

function inicializarVolumen() {
    const initialVolume = 70; 
    const audioVolume = initialVolume / 100;

    if (volumeBar) {
        volumeBar.value = initialVolume;
        actualizarBarraVolumen(audioVolume);
        
        if (audio) {
            audio.volume = audioVolume;
        }

        volumeBar.addEventListener('input', () => {
            const newVolume = volumeBar.value / 100;
            
            if (audio) {
                audio.volume = newVolume;
            }
            
            actualizarBarraVolumen(newVolume);

            if (volumeIcon) {
                volumeIcon.className = (newVolume === 0) ? 
                    'fas fa-volume-mute volume-icon' : 
                    'fas fa-volume-down volume-icon';
            }
        });
    }
}

// ===============================
// 🌌 PARTÍCULAS — FONDO VIVO (Lógica de las burbujas)
// ===============================

function iniciarBurbujas() {
    const canvas = document.getElementById("burbujas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let burbujas = Array.from({ length: 30 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 8 + 2,
        d: Math.random() * 1 + 0.5
    }));

    function dibujarBurbujas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";

        burbujas.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();

            b.y -= b.d;

            if (b.y < -10) {
                b.y = canvas.height + 10;
                b.x = Math.random() * canvas.width;
            }
        });

        requestAnimationFrame(dibujarBurbujas);
    }

    dibujarBurbujas();
}


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
