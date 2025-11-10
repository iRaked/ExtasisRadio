// ===============================
// 🎧 INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
// ===============================
let trackData = [];
let currentTrack = null;
let modoActual = "radio";
let audio = document.getElementById("player");
let gestureDetected = false;
let radioIntervalId = null;
let lastTrackTitle = "";
let contadorIntervalId = null;

// Estados Local
let isShuffling = false;
let trackHistory = [];

// ===============================
// 🎯 ELEMENTOS CLAVE DEL DOM
// ===============================
const playPauseBtn = document.getElementById("btn-play");
const nextBtn = document.getElementById("btn-fwd");
const prevBtn = document.getElementById("btn-rwd");
const shuffleBtn = document.getElementById("btn-shuffle");
const btnPower = document.getElementById("btn-power");

// Metadatos
const discImg = document.querySelector(".cover-img");
const trackTitleElement = document.getElementById("titulo");
const trackArtistElement = document.getElementById("artista");
const trackGenreElement = document.getElementById("genero");
const contadorElemento = document.getElementById("contadorRadio");
const statusIndicator = document.getElementById("status-indicator");
const informacionElemento = document.getElementById("informacion");

// ===============================
// 🖼️ FUNCIONES AUXILIARES (Carátulas, Formato y Marquesina)
// ===============================

// Usa Cover1.png como fallback
function validarCaratula(url, fallback = "assets/covers/Cover1.png") {
    if (!discImg) return;
    const img = new Image();
    img.onload = () => {
        discImg.src = url;
        discImg.classList.add("rotating");
    };
    img.onerror = () => {
        discImg.src = fallback;
        discImg.classList.remove("rotating");
    };
    img.src = url;
}

function formatArtist(artist) {
    return artist.toLowerCase().trim().split(/ [(&]/)[0];
}
function formatTitle(title) {
    return title.toLowerCase().trim().split(/ [(&]/)[0];
}

function obtenerCaratulaDesdeiTunes(artist, title) {
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
        if (discImg) discImg.src = 'assets/covers/Cover1.png';
        return;
    }

    const query = encodeURIComponent(`${formatArtist(artist)} ${formatTitle(title)}`);
    const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

    $.ajax({
        dataType: 'jsonp',
        url: url,
        success: function(data) {
            let cover = 'assets/covers/Cover1.png';
            if (data.results && data.results.length === 1) {
                cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
            }
            validarCaratula(cover);
        },
        error: function() {
            if (discImg) discImg.src = 'assets/covers/Cover1.png';
        }
    });
}

// ==================================
// MARQUESINA METADATOS (FINAL CORREGIDA)
// ==================================
function aplicarMarquesina(element) {
    if (!element) return;

    const contentElement = element.querySelector('.track-content');
    if (!contentElement) return;

    contentElement.classList.remove('marquee');

    const originalPosition = contentElement.style.position;
    const originalDisplay = contentElement.style.display;

    contentElement.style.position = 'absolute';
    contentElement.style.display = 'inline-block';

    const scrollW = contentElement.scrollWidth;

    const clientW = element.clientWidth;

    contentElement.style.position = originalPosition;
    contentElement.style.display = originalDisplay;

    const requiredMargin = 2;

    if (scrollW > clientW + requiredMargin) {
        contentElement.classList.add('marquee');
    }
}

// ===============================
// 📦 LÓGICA DE PISTAS LOCALES (ADAPTADA A TU JSON)
// ===============================

function cargarTracksDesdeJSON() {
    fetch("Repro32.json")
        .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! status: ${res.status}`))
        .then(data => {
            trackData = [];
            const artistSpan = trackArtistElement ? trackArtistElement.querySelector('.track-content') : null;

            if (typeof data !== 'object' || data === null) {
                 if (artistSpan) artistSpan.textContent = "Error: Formato JSON incorrecto.";
                 return;
            }

            // Itera sobre todas las secciones y combina las pistas
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    // Mapeo de campos del JSON a las propiedades que espera el reproductor
                    const mappedTracks = data[key].map(item => ({
                        url: item.enlace,
                        name: item.nombre,
                        artist: item.artista,
                        cover: item.caratula,
                        section: item.seccion,
                        genre: item.genero // ✅ INCLUYE EL GÉNERO
                    }));
                    trackData = trackData.concat(mappedTracks);
                }
            }

            if (trackData.length === 0) {
                 if (artistSpan) artistSpan.textContent = "Error: No se encontraron pistas válidas.";
                 return;
            }

            // Carga los metadatos de la primera pista
            currentTrack = 0;
            // 🟡 Si ya hubo gesto, la reproducción se debe activar.
            if (gestureDetected) {
                activarReproduccion(0, "manual"); // Intentar reproducir si ya hubo gesto
            } else {
                activarReproduccion(0, "initial-load"); // Solo cargar metadatos
            }
        })
        .catch(err => {
            console.error("❌ Error al cargar JSON Local:", err);
            const artistSpan = trackArtistElement ? trackArtistElement.querySelector('.track-content') : null;
            if (artistSpan) artistSpan.textContent = "Error: Repro32.json no encontrado o con error.";
        });
}

// ===============================
// 🔑 Función central para Modo Local.
// ===============================
function activarReproduccion(index, modo = "manual") {
    if (modoActual !== "local" || index < 0 || index >= trackData.length || !trackData[index]?.url) return;

    const track = trackData[index];
    currentTrack = index;

    // 🟢 Usamos los SPANs
    const titleSpan = trackTitleElement ? trackTitleElement.querySelector('.track-content') : null;
    const artistSpan = trackArtistElement ? trackArtistElement.querySelector('.track-content') : null;

    if (titleSpan) titleSpan.textContent = track.name;
    if (artistSpan) artistSpan.textContent = track.artist || "Artista Desconocido";

    // ✅ ACTUALIZACIÓN DEL GÉNERO
    if (trackGenreElement) {
        trackGenreElement.textContent = track.genre || "";
    }

    // Aplicar marquesina (Usa los DIVs padres para el límite visible)
    aplicarMarquesina(trackTitleElement);
    aplicarMarquesina(trackArtistElement);

    audio.src = track.url;
    audio.load();

    validarCaratula(track.cover || "assets/covers/Cover1.png");

    if (modo === "initial-load") {
        actualizarIconoPlayPause(false);
        return;
    }

    if (gestureDetected) {
        audio.muted = false;
        audio.play().then(() => {
            actualizarIconoPlayPause(true);
        }).catch((err) => {
            console.error("❌ Fallo al reproducir pista local (tras next/prev/shuffle):", err);
            actualizarIconoPlayPause(false);
        });
    } else {
        actualizarIconoPlayPause(false);
    }
}

// ===================================
// 📻 MODO RADIO - LÓGICA DE ACTUALIZACIÓN (Metadatos con Marquesina)
// ===================================

function detenerActualizacionRadio() {
    if (radioIntervalId !== null) clearInterval(radioIntervalId);
    radioIntervalId = null;
}

function iniciarActualizacionRadio() {
    detenerActualizacionRadio();
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') return;
    const radioUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";
    function actualizarDesdeServidor() {

        if (modoActual !== "radio") { detenerActualizacionRadio(); return; }
        $.ajax({dataType: 'jsonp', url: radioUrl, success: function(data) {
            const cleanedTitle = data.songtitle.trim().replace(/SANTI MIX DJ/gi, '').replace(/\|\s*$/g, '').trim();
            if (!cleanedTitle || cleanedTitle === lastTrackTitle || cleanedTitle.toLowerCase().includes('offline')) return;
            lastTrackTitle = cleanedTitle;
            const songtitleSplit = cleanedTitle.split(/ - | – /);
            let artist = songtitleSplit.length >= 2 ? songtitleSplit[0].trim() : "Radio";
            let title = songtitleSplit.length >= 2 ? songtitleSplit.slice(1).join(' - ').trim() : cleanedTitle;

            // 🟢 Usamos los SPANs
            const titleSpan = trackTitleElement ? trackTitleElement.querySelector('.track-content') : null;
            const artistSpan = trackArtistElement ? trackArtistElement.querySelector('.track-content') : null;

            if (artistSpan) artistSpan.textContent = artist;
            if (titleSpan) titleSpan.textContent = title;

            // Aplicar marquesina
            aplicarMarquesina(trackTitleElement);
            aplicarMarquesina(trackArtistElement);
            
            // 🛑 Limpiar Género en Modo Radio
            if (trackGenreElement) trackGenreElement.textContent = "";

            obtenerCaratulaDesdeiTunes(artist, title);
        }, error: function() {
             if (trackArtistElement && trackArtistElement.querySelector('.track-content')) {
                 trackArtistElement.querySelector('.track-content').textContent = "Error Conexión";
             }
           }, timeout: 10000});
    }
    actualizarDesdeServidor();
    radioIntervalId = setInterval(actualizarDesdeServidor, 12000);
}

// ===================================
// 📻 MODO RADIO - LÓGICA CONTADOR RADIOESCUCHAS (Integración)
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
        $.ajax({dataType: 'jsonp', url: contadorUrl, success: function(data) {
            contadorElemento.textContent = data.currentlisteners || "0";
        }, error: function() { contadorElemento.textContent = "0"; }, timeout: 5000});
    }
    actualizarContador();
    contadorIntervalId = setInterval(actualizarContador, 15000);
}

// ===============================
// 🔄 ALTERNANCIA DE MODOS Y VISUALES
// ===============================

function actualizarIconoPlayPause(is_playing) {
    if (!playPauseBtn) return;
    if (is_playing) {
        playPauseBtn.classList.remove('fa-play');
        playPauseBtn.classList.add('fa-pause');
        if (discImg) discImg.classList.add("rotating");
    } else {
        playPauseBtn.classList.remove('fa-pause');
        playPauseBtn.classList.add('fa-play');
        if (discImg) discImg.classList.remove("rotating");
    }
}

// Limpia metadatos y usa Cover1.png (CORREGIDA)
function limpiarMetadatos(initial = false) {
    const titleSpan = trackTitleElement ? trackTitleElement.querySelector('.track-content') : null;
    const artistSpan = trackArtistElement ? trackArtistElement.querySelector('.track-content') : null;

    // 🟢 Ahora limpia los SPAN internos
    if (titleSpan) titleSpan.textContent = initial ? "Conectando..." : "Cargando...";
    if (artistSpan) artistSpan.textContent = "";
    // 🛑 Limpia el Género
    if (trackGenreElement) trackGenreElement.textContent = "";

    if (discImg) validarCaratula("assets/covers/Cover1.png");
    lastTrackTitle = "";
    // 🟢 Limpia el contador
    if (contadorElemento) contadorElemento.textContent = "";
    if (shuffleBtn) shuffleBtn.classList.remove('active');
}

function activarModoRadio() {
    modoActual = "radio";
    limpiarMetadatos(true);
    detenerActualizacionRadio();
    detenerContadorRadioescuchas(); // 🛑 Detiene si estaba activo

    audio.pause();
    audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
    audio.load();

    if (gestureDetected) {
        audio.muted = false;
        audio.play().then(() => {
            actualizarIconoPlayPause(true);
        }).catch(() => {
            actualizarIconoPlayPause(false);
        });
    } else {
        actualizarIconoPlayPause(false);
    }

    iniciarActualizacionRadio();
    iniciarContadorRadioescuchas(); // ✅ Lo inicia en modo Radio
}

function activarModoLocal() {
    modoActual = "local";

    limpiarMetadatos();
    detenerActualizacionRadio();
    detenerContadorRadioescuchas(); // ✅ Lo detiene en modo Local
    audio.pause();

    cargarTracksDesdeJSON();
    actualizarIconoPlayPause(false);
}


//Actualiza el texto y el color del texto del indicador de estado.
function actualizarEstadoOnlineOffline() {
    if (!statusIndicator) return;

    // 1. Limpieza: Elimina cualquier clase de CSS que pueda interferir.
    statusIndicator.className = '';

    // 2. Limpieza: Asegura que el fondo sea transparente, no un color superpuesto.
    statusIndicator.style.backgroundColor = 'transparent';

    if (modoActual === "radio") {
        // Modo Radio: ONLINE (Color de texto Verde Neón #00FF00)
        statusIndicator.textContent = "ONLINE";
        statusIndicator.style.color = "#00FF00";
    } else {
        // Modo Local: OFFLINE (Color de texto Azul #0096FF)
        statusIndicator.textContent = "OFFLINE";
        statusIndicator.style.color = "#0096FF";
    }
}

// ===============================
// 🧭 INICIALIZACIÓN Y LISTENERS
// ===============================

// Activación tras gesto humano (Listener global)
document.addEventListener("click", () => {
    if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;

        if (audio.src && audio.paused) {
             audio.play().then(() => {
                 actualizarIconoPlayPause(true);
             }).catch(() => {});
        }
    }
}, { once: true });

document.addEventListener("DOMContentLoaded", () => {
    activarModoRadio();

// ===============================
// BOTONERA Y LISTENERS LOCALES
// ===============================
    // Play/Pause
    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            if (!audio.src) return;
            if (!gestureDetected) gestureDetected = true;
            audio.muted = false;

            if (audio.paused || audio.ended) {
                // Solo intenta reproducir si hay pistas cargadas en modo local.
                if (modoActual === "local" && trackData.length === 0) {
                    // 🟢 Usamos el SPAN para el mensaje
                    const artistSpan = trackArtistElement ? trackArtistElement.querySelector('.track-content') : null;
                    if (artistSpan) artistSpan.textContent = "Cargando Pistas...";
                    return;
                }

                audio.play().then(() => {
                    actualizarIconoPlayPause(true);
                }).catch(err => {
                    console.warn("⚠️ Fallo Play/Pause:", err);
                    if (modoActual === "local") {
                         // 🟢 Usamos el SPAN para el mensaje de error
                         const artistSpan = trackArtistElement ? trackArtistElement.querySelector('.track-content') : null;
                         if (artistSpan) artistSpan.textContent = "Error: URL de Pista Rota";
                    }
                });
            } else {
                audio.pause();
                actualizarIconoPlayPause(false);
            }
        });
    }

// ==================================
// ➡️ FUNCIÓN AVANZAR (NEXT) Y ⬅️ RETROCEDER (PREV)
// ===================================

function nextTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;

    if (isShuffling) {
        // En modo Shuffle, guarda la pista actual en el historial antes de avanzar
        if (currentTrack !== null) trackHistory.push(currentTrack);

        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * trackData.length);
        } while (newIndex === currentTrack && trackData.length > 1);

        activarReproduccion(newIndex, "shuffle");

    } else {
        // Modo secuencial
        let nextIndex = (currentTrack + 1) % trackData.length;
        activarReproduccion(nextIndex, "next");
    }
}

function prevTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;

    let prevIndex;
    if (isShuffling && trackHistory.length > 0) {
        // 1. Elimina el currentTrack si ya fue añadido por un 'next' previo (para evitar duplicados)
        if (trackHistory.length > 0 && trackHistory[trackHistory.length - 1] === currentTrack) {
             trackHistory.pop();
        }
        // 2. Retrocede al último track del historial
        prevIndex = trackHistory.pop();
    } else {
        // Modo secuencial (wrap-around)
        prevIndex = (currentTrack - 1 + trackData.length) % trackData.length;
    }

    if (prevIndex !== undefined) {
        activarReproduccion(prevIndex, "prev");
    }
}

function toggleShuffle() {
    if (modoActual !== "local") return;
    isShuffling = !isShuffling;

    if (isShuffling) {
        if(shuffleBtn) shuffleBtn.classList.add('active');
        trackHistory = []; // Limpia el historial

        if (trackData.length > 0) {
            // Guarda la pista actual en el historial antes de saltar (para poder volver a ella)
            if (currentTrack !== null) trackHistory.push(currentTrack);
            // Inicia la reproducción aleatoria inmediata
            nextTrack();
        }

    } else {
        if(shuffleBtn) shuffleBtn.classList.remove('active');
        trackHistory = [];
    }
}

    // Power (Cambio de Modo) - 🔄 Sincronizado con estado ON/OFFLINE
    if (btnPower) {
        btnPower.addEventListener("click", () => {
            if (modoActual === "radio") {
                activarModoLocal();
            } else {
                activarModoRadio();
            }

            // 🎨 ACTUALIZACIÓN DE ESTADO
            actualizarEstadoOnlineOffline();
        });
    }

    // ==================================
    // LISTENERS DE BOTONES LOCALES
    // ==================================
    // ➡️ Botón Siguiente (FWD)
    if (nextBtn) nextBtn.addEventListener('click', nextTrack);

    // ⬅️ Botón Retroceder (RWD)
    if (prevBtn) prevBtn.addEventListener('click', prevTrack);

    // 🔀 Botón Aleatorio (Shuffle)
    if (shuffleBtn) shuffleBtn.addEventListener('click', toggleShuffle);

    // MANEJO DEL FINAL DE PISTA (Modo Local)
    if (audio) {
        audio.onended = () => {
            if (modoActual !== "local") return;
            nextTrack();
        };
    }

    // ==================================
    // INFORMACION FECHA Y HORA
    // ==================================
    //Obtiene, formatea y actualiza la fecha y hora actual en el DOM.
    function actualizarInformacion() {
    if (!informacionElemento) return;

    const now = new Date();
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const diaSemana = diasSemana[now.getDay()];
    const diaMes = String(now.getDate()).padStart(2, '0');
    const mes = meses[now.getMonth()];
    const anio = now.getFullYear();

    // Formato de hora (HH:MM)
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');

    // Construye la cadena final: Viernes 07 de Noviembre, 2025 | 17:00
    const formatoFinal = `${diaSemana} ${diaMes} de ${mes}, ${anio} | ${horas}:${minutos}`;

    informacionElemento.textContent = formatoFinal;
}

    // 🆕 INICIALIZACIÓN DE FECHA Y HORA
    actualizarInformacion();
    setInterval(actualizarInformacion, 60000);

// ==================================
// CONTROL DE VOLUMEN
// ==================================
const volumeBar = document.getElementById("volumeBar");
const volumeIcon = document.getElementById("volumeIcon");

function inicializarVolumen() {
    if (!audio || !volumeBar) return;

    audio.volume = volumeBar.value / 100;
    actualizarEstiloBarraVolumen(volumeBar.value);
    actualizarIconoVolumen(audio.volume);
}

function actualizarEstiloBarraVolumen(volumen) {
    if (!volumeBar) return;
    const value = volumen;
    volumeBar.style.background = `linear-gradient(to right, #3688ff 0%, #3688ff ${value}%, #292d38 ${value}%, #292d38 100%)`;
}

function actualizarIconoVolumen(volumeValue) {
    if (!volumeIcon) return;
    volumeIcon.classList.remove('fa-volume-off', 'fa-volume-down', 'fa-volume-up');

    if (volumeValue === 0) {
        volumeIcon.classList.add('fa-volume-off');
    } else if (volumeValue > 0.6) {
        volumeIcon.classList.add('fa-volume-up');
    } else {
        volumeIcon.classList.add('fa-volume-down');
    }
}

if (volumeBar) {
    volumeBar.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);

        audio.volume = value / 100;
        actualizarEstiloBarraVolumen(value);
        actualizarIconoVolumen(audio.volume);
    });
}

inicializarVolumen();

// Cierre del DOMContentLoaded
});