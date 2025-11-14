//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 01 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let trackData = [];
let currentTrack = null;
let modoActual = "radio";
let gestureDetected = false;
let repeatMode = "none";
let isShuffling = false;
let trackHistory = [];
let radioIntervalId = null;
let contadorIntervalId = null;

// Referencias clave del DOM
const audio = document.getElementById("player");
const discImg = document.getElementById("art");
const currentTrackName = document.getElementById("title");
const currentArtistName = document.getElementById("ctn-dj");
const metaTrack = document.getElementById("nowPlaying");

// Volumen
const volumeSlider = document.getElementById("volumeSlider");
const volumeIcon = document.getElementById("volumeIcon");
const volumePercentage = document.getElementById("volumePercentage");

// Historial (modal)
const historyButton = document.getElementById("historyButton");
const historyContainer = document.getElementById("historyContainer");
const closeHistory = document.getElementById("closeHistory");
const trackList = document.querySelector(".track-list");

// Botonera de control (IDs corregidos según tu HTML)
const playPauseBtn = document.getElementById("play-btn");
const nextBtn = document.getElementById("forward-btn");
const prevBtn = document.getElementById("rewind-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const repeatBtn = document.getElementById("repeat-btn");
const btnRadio = document.getElementById("music-btn");
const menuBtn = document.getElementById("menu-btn");

// Iconos de play/pause dentro del botón
const iconPlay = playPauseBtn ? playPauseBtn.querySelector(".fa-play") : null;
const iconPause = playPauseBtn ? playPauseBtn.querySelector(".fa-pause") : null;

// Contador de radioescuchas (sección listeners-container)
const contadorElemento = document.getElementById("listeners");

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ INIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INICIALIZACIÓN DEL REPRODUCTOR
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener("DOMContentLoaded", () => {
    // Decidir modo inicial
    if (modoActual === "radio") {
        activarModoRadio();
    } else {
        cargarTracksDesdeJSON();
    }

    // Enlazar botonera
    if (playPauseBtn) playPauseBtn.addEventListener("click", togglePlayPause);
    if (nextBtn) nextBtn.addEventListener("click", nextTrack);
    if (prevBtn) prevBtn.addEventListener("click", prevTrack);
    if (shuffleBtn) shuffleBtn.addEventListener("click", toggleShuffle);
    if (repeatBtn) repeatBtn.addEventListener("click", toggleRepeat);
    if (btnRadio) btnRadio.addEventListener("click", toggleMusicRadio);
    if (menuBtn) menuBtn.addEventListener("click", toggleMenu);

    // Historial modal
    if (historyButton) historyButton.addEventListener("click", () => toggleModal(true));
    if (closeHistory) closeHistory.addEventListener("click", () => toggleModal(false));

    // Volumen
    inicializarVolumen();

    // Fecha y hora
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Animaciones de fondo
    iniciarAnimacionesFondo();
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 02 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 CARGA DE PISTAS DESDE JSON (MODO LOCAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cargarTracksDesdeJSON() {
    fetch("Repro1.json")
        .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! status: ${res.status}`))
        .then(data => {
            // Aplanar todas las secciones en un solo array
            trackData = [];
            for (const seccion in data) {
                if (Array.isArray(data[seccion])) {
                    data[seccion].forEach(track => {
                        trackData.push(track);
                    });
                }
            }

            if (trackData.length === 0) {
                console.warn("❌ No se encontraron pistas válidas en el JSON.");
                return;
            }

            currentTrack = 0;
            activarReproduccion(0, "initial-load"); 
            generarListaModal();
            console.log("✅ Pistas cargadas desde Repro1.json");
        })
        .catch(err => {
            console.error("❌ Error al cargar JSON:", err);
        });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CONTINUIDAD EN MODO LOCAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Listener global: cuando termina una pista
audio.addEventListener("ended", () => {
  if (modoActual !== "local" || trackData.length === 0) return;

  // Si está en modo repeat-one → vuelve a reproducir la misma pista
  if (repeatMode === "one") {
    activarReproduccion(currentTrack, "repeat-one");
    return;
  }

  // Si está en shuffle → elige aleatoriamente la siguiente
  if (isShuffling) {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * trackData.length);
    } while (newIndex === currentTrack && trackData.length > 1);

    activarReproduccion(newIndex, "shuffle-auto");
    return;
  }

  // Caso normal → avanza a la siguiente pista
  let nextIndex = (currentTrack + 1) % trackData.length;
  activarReproduccion(nextIndex, "auto-next");
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 03 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ FUNCIÓN UNIVERSAL DE REPRODUCCIÓN
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Metadatos en modo local
function actualizarMetaLocal(track) {
    const metaTexto = `${track.nombre} — ${track.artista || "Artista Desconocido"} — ${track.genero || "Género desconocido"}`;
    if (currentTrackName) currentTrackName.textContent = metaTexto;
    if (metaTrack) {
        metaTrack.textContent = metaTexto;
        metaTrack.setAttribute("data-tag", metaTexto);
    }
}

// Metadatos en modo radio (se usa en Bloque 04)
function actualizarMetaRadio(artist, title) {
    const metaTexto = `${artist} — ${title}`;
    if (currentTrackName) currentTrackName.textContent = metaTexto;
    if (metaTrack) {
        metaTrack.textContent = metaTexto;
        metaTrack.setAttribute("data-tag", metaTexto);
    }
}

function activarReproduccion(index, modo = "manual") {
    if (modoActual !== "local" || index < 0 || index >= trackData.length) return;

    const track = trackData[index];
    if (!track?.enlace) return;

    currentTrack = index;

    // --- Marquesina en modo local ---
    actualizarMetaLocal(track);

    // --- Audio ---
    audio.src = track.enlace;
    audio.load();

    // --- Carátula ---
    if (discImg) {
        discImg.style.backgroundImage = `url(${track.caratula || "assets/covers/Cover1.png"})`;
        discImg.classList.add("rotating");
    }

    // --- Estado inicial ---
    if (modo === "initial-load") {
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden");
        if (discImg) discImg.classList.remove("rotating");
        return;
    }

    // --- Reproducción ---
    if (gestureDetected) {
        audio.muted = false;
        audio.play().then(() => {
            if (iconPlay) iconPlay.classList.add("hidden");
            if (iconPause) iconPause.classList.remove("hidden");
            activarAnimaciones();
            actualizarModalActualTrack();
        }).catch(err => {
            console.error(`❌ Error de reproducción: ${audio.src}`, err);
            if (iconPause) iconPause.classList.add("hidden");
            if (iconPlay) iconPlay.classList.remove("hidden");
            desactivarAnimaciones();
        });
    } else {
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden");
        desactivarAnimaciones();
    }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 04 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 MODO RADIO — LÓGICA DE ACTUALIZACIÓN Y CONTROL (CON LIMPIEZA)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function activarModoRadio() {
    modoActual = "radio";
    limpiarEstados(); // 🧼 limpieza antes de activar el modo

    // Estado intermedio visual (para no dejar vacío)
    if (currentTrackName) currentTrackName.textContent = "🔄 Actualizando datos de Radio...";
    if (currentArtistName) currentArtistName.textContent = "Espere un momento...";
    if (metaTrack) {
        metaTrack.textContent = "Conectando con el servidor...";
        metaTrack.setAttribute("data-tag", "Conectando...");
    }

    if (discImg) {
        discImg.style.backgroundImage = "url('assets/img/Cover-Vinyl-Disc-FX1')";
        discImg.classList.add("rotating");
    }

    // Resetear audio y reproducir
    audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
    audio.load();

    audio.play().then(() => {
        if (iconPlay) iconPlay.classList.add("hidden");
        if (iconPause) iconPause.classList.remove("hidden");
        activarAnimaciones();
    }).catch(err => {
        console.warn("🔒 Error al iniciar Radio automáticamente:", err);
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden");
        desactivarAnimaciones();
    });

    // Reiniciar rutinas activas de radio
    iniciarActualizacionRadio();
    iniciarContadorRadioescuchas();
}

function activarModoLocal() {
    modoActual = "local";
    limpiarEstados(); // 🧼 limpieza antes de activar el modo

    // 🔑 Detener cualquier intervalo de radio que siga activo
    detenerActualizacionRadio();
    detenerContadorRadioescuchas();

    audio.muted = !gestureDetected;

    // Cargar pistas y dejar que activarReproduccion() coloque la marquesina y carátula
    cargarTracksDesdeJSON();

    // El color del botón se actualiza fuera (en actualizarBotonRadio)
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 ACTUALIZACIÓN DE METADATOS EN MODO RADIO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function iniciarActualizacionRadio() {
    detenerActualizacionRadio();

    const radioUrl = "https://technoplayerserver.net:8018/currentsong?sid=1";
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

    async function actualizarDesdeServidor() {
        try {
            const response = await fetch(proxyUrl, { cache: 'no-cache' });
            const newSongTitleRaw = await response.text();
            const cleanedTitle = newSongTitleRaw.trim();

            if (!cleanedTitle || cleanedTitle.toLowerCase().includes('offline')) {
                if (currentTrackName) currentTrackName.textContent = "Datos bloqueados";
                return;
            }

            const songtitleSplit = cleanedTitle.split(/ - | – /);
            let artist = "Radio";
            let title = cleanedTitle;

            if (songtitleSplit.length >= 2) {
                artist = songtitleSplit[0].trim();
                title = songtitleSplit.slice(1).join(' - ').trim();
            }

        // Guardar entrada en historial
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        trackHistory.unshift({
            artist: artist,
            title: title,
            cover: discImg ? discImg.style.backgroundImage.replace(/url\(["']?|["']?\)/g, "") : "assets/covers/Plato.png",
            time: timeString
        });

        // Limitar historial a 20 entradas para no saturar
        if (trackHistory.length > 20) {
            trackHistory.pop();
        }

            // --- Marquesina en modo radio ---
            actualizarMetaRadio(artist, title);

            // --- Carátula desde iTunes ---
            obtenerCaratulaDesdeiTunes(artist, title);

        } catch (error) {
            console.error("❌ Error en actualización de Radio:", error);
            if (currentTrackName) currentTrackName.textContent = "Error al cargar metadatos";
        }
    }

    actualizarDesdeServidor();
    radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
}

// Detener actualización de radio
function detenerActualizacionRadio() {
    if (radioIntervalId !== null) {
        clearInterval(radioIntervalId);
        radioIntervalId = null;
    }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 FUNCIÓN PARA OBTENER CARÁTULA DESDE ITUNES
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function obtenerCaratulaDesdeiTunes(artist, title) {
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
        // Fallback si no hay jQuery disponible
        if (discImg) {
            discImg.style.backgroundImage = "url('assets/covers/Cover1.png')";
            discImg.classList.add("rotating");
        }
        return;
    }

    const query = encodeURIComponent(`${artist} ${title}`);
    const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

    $.ajax({
        dataType: 'jsonp',
        url: url,
        success: function(data) {
            let cover = 'assets/covers/Cover1.png'; // fallback
            if (data.results && data.results.length > 0) {
                cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
            }
            if (discImg) {
                discImg.style.backgroundImage = `url(${cover})`;
                discImg.classList.add("rotating");
            }
        },
        error: function() {
            if (discImg) {
                discImg.style.backgroundImage = "url('assets/covers/Cover1.png')";
                discImg.classList.add("rotating");
            }
        }
    });
}

// ==============================================
// Contador de radioescuchas (USANDO FETCH)
// ==============================================
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
        if (modoActual !== "radio") { 
            detenerContadorRadioescuchas(); 
            return; 
        }

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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 05 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ BOTONERA DE CONTROL (PLAY/PAUSE, NEXT, PREV, SHUFFLE, REPEAT, MUSIC, MENU)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ▶️ Play/Pause
function togglePlayPause() {
    if (!audio.src) {
        console.warn("⚠️ No hay fuente de audio definida.");
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
            activarAnimaciones();
        }).catch(err => {
            console.warn("⚠️ Error al reproducir:", err);
        });
    } else {
        audio.pause();
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden");
        desactivarAnimaciones();
    }
}

// ⏩ Next Track
function nextTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;

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

// ⏪ Previous Track
function prevTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;

    let prevIndex;

    if (isShuffling && trackHistory.length > 0) {
        if (trackHistory[trackHistory.length - 1] === currentTrack) {
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

// 🔀 Shuffle
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

// 🔁 Repeat
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

// 🎵 Music/Radio toggle
function toggleMusicRadio() {
    if (modoActual === "radio") {
        activarModoLocal();
    } else {
        activarModoRadio();
    }
    actualizarMetaModo();
    actualizarBotonRadio();
}

// 📋 Menu (pendiente)
function toggleMenu() {
    console.log("📋 Lógica del botón Menu pendiente de implementación.");
}

// ============================
// ESTILOS DINAMICOS
// ============================
// Play/Pause: alterna clase active
function togglePlayPause() {
    if (!audio.src) return;

    if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;
    }

    if (audio.paused || audio.ended) {
        audio.play().then(() => {
            playPauseBtn.classList.add("active");
            if (iconPlay) iconPlay.classList.add("hidden");
            if (iconPause) iconPause.classList.remove("hidden");
            activarAnimaciones();
        });
    } else {
        audio.pause();
        playPauseBtn.classList.remove("active");
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden");
        desactivarAnimaciones();
    }
}

// 🔀 Shuffle: alterna clase shuffle-active (persistente como Repeat)
function toggleShuffle() {
    isShuffling = !isShuffling;

    if (isShuffling) {
        shuffleBtn.classList.add("shuffle-active");
        trackHistory = [currentTrack];
        if (modoActual === "local" && trackData.length > 1) {
            nextTrack();
        }
    } else {
        shuffleBtn.classList.remove("shuffle-active");
        trackHistory = [];
    }
}

// 🔁 Repeat: alterna clase active-one (persistente)
function toggleRepeat() {
    if (repeatMode !== "one") {
        repeatMode = "one";
        repeatBtn.classList.add("active-one");
        audio.loop = true;
    } else {
        repeatMode = "none";
        repeatBtn.classList.remove("active-one");
        audio.loop = false;
    }
}

// Repeat: alterna clase active-one
function toggleRepeat() {
    if (repeatMode !== "one") {
        repeatMode = "one";
        repeatBtn.classList.add("active-one");
        audio.loop = true;
    } else {
        repeatMode = "none";
        repeatBtn.classList.remove("active-one");
        audio.loop = false;
    }
}

// Menu y Music: glow rojo tras clic
menuBtn.addEventListener("click", () => {
    menuBtn.classList.add("glow");
    setTimeout(() => menuBtn.classList.remove("glow"), 600);
});

btnRadio.addEventListener("click", () => {
    btnRadio.classList.add("glow");
    setTimeout(() => btnRadio.classList.remove("glow"), 600);
    toggleMusicRadio();
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ ACTIVAR/DESACTIVAR BOTONES SEGÚN MODO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function actualizarEstadoBotonera() {
    const disableInRadio = [menuBtn, repeatBtn, prevBtn, nextBtn, shuffleBtn];

    if (modoActual === "radio") {
        disableInRadio.forEach(btn => {
            if (btn) {
                btn.disabled = true;              // desactiva funcionalmente
                btn.classList.add("disabled");    // opcional: estilo visual
            }
        });
    } else {
        disableInRadio.forEach(btn => {
            if (btn) {
                btn.disabled = false;             // reactiva en local
                btn.classList.remove("disabled"); // limpia estilo visual
            }
        });
    }
}

function actualizarEstadoBotonera() {
    const disableInRadio = [menuBtn, repeatBtn, prevBtn, nextBtn, shuffleBtn];
    
    if (modoActual === "radio") {
        // Desactivar controles que no aplican en radio
        disableInRadio.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.classList.add("disabled");
            }
        });
        // Activar botón Historial
        if (historyButton) {
            historyButton.disabled = false;
            historyButton.classList.remove("disabled");
        }
    } else {
        // Reactivar controles en local
        disableInRadio.forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove("disabled");
            }
        });
        // Desactivar botón Historial en local
        if (historyButton) {
            historyButton.disabled = true;
            historyButton.classList.add("disabled");
        }
    }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 05b ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 ENLACE DEL BOTÓN MUSIC (ALTERNANCIA RADIO/LOCAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function toggleMusicRadio() {
    // 🧼 Limpieza antes de cambiar de modo
    limpiarEstados();

    if (modoActual === "radio") {
        activarModoLocal();
    } else {
        activarModoRadio();
        iniciarActualizacionRadio();       // 🔄 reinicia búsqueda de metadatos
        iniciarContadorRadioescuchas();    // 🔄 reinicia contador de oyentes
    }
    actualizarBotonRadio(); // solo cambia color/estado del botón
    actualizarEstadoBotonera();  // activa/desactiva botones según modo
}

// Actualizar estilo del botón Music
function actualizarBotonRadio() {
    if (btnRadio) {
        if (modoActual === "local") {
            // Activo en modo local → color rojo
            btnRadio.style.backgroundColor = "#ff0000";
        } else {
            // Neutral en modo radio → transparente
            btnRadio.style.backgroundColor = "transparent";
        }
    }
}

// Listener del botón Music (solo uno)
if (btnRadio) {
    btnRadio.addEventListener("click", () => {
        btnRadio.classList.add("glow");
        setTimeout(() => btnRadio.classList.remove("glow"), 600);
        toggleMusicRadio();
    });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 05c ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧼 LIMPIEZA GLOBAL DE ESTADOS ENTRE MODOS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function limpiarEstados() {
    detenerActualizacionRadio();
    detenerContadorRadioescuchas();

    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;

    if (playPauseBtn) playPauseBtn.classList.remove("active");
    if (iconPause) iconPause.classList.add("hidden");
    if (iconPlay) iconPlay.classList.remove("hidden");

    desactivarAnimaciones();

    // 🔑 Limpieza suave: solo metaTrack, no todo
    if (metaTrack) {
        metaTrack.textContent = "";
        metaTrack.setAttribute("data-tag", "");
    }

    // 👉 currentTrackName y currentArtistName se limpian solo si estamos en local
    if (modoActual === "local") {
        if (currentTrackName) currentTrackName.textContent = "";
        if (currentArtistName) currentArtistName.textContent = "";
    }

    // ❌ No tocamos carátula ni clase rotating
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MENU ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 Botón Menu despliega modal con playlists desde JSON
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Referencias
const modalPlaylist = document.getElementById("modalPlaylist");
const modalPlaylistTracks = document.getElementById("modalPlaylistTracks");
const playlistTitle = document.getElementById("playlistTitle");
const closePlaylistModal = document.getElementById("closePlaylistModal");

// Listener del botón Menu
menuBtn.addEventListener("click", () => {
    if (!trackData || trackData.length === 0) {
        console.warn("❌ No hay pistas cargadas desde JSON");
        return;
    }

    // Encabezado: nombre de la playlist (puedes ajustar según tu JSON)
    playlistTitle.textContent = "Essentials Playlist";

    // Limpiar lista
    modalPlaylistTracks.innerHTML = "";

    // Renderizar cada track
    trackData.forEach((track, index) => {
        const li = document.createElement("li");
        li.classList.add("modal-track-item");
        li.innerHTML = `
            <img src="${track.caratula || 'assets/covers/Cover1.png'}" alt="Carátula" class="track-cover" />
            <div class="track-info">
                <strong>${track.nombre}</strong>
                <span>🎤 ${track.artista || "Desconocido"}</span>
            </div>
        `;
        li.addEventListener("click", () => {
            activarReproduccion(index, "modal-click");
            modalPlaylist.classList.add("hidden");
        });
        modalPlaylistTracks.appendChild(li);
    });

    // Mostrar modal
    modalPlaylist.classList.remove("hidden");
    console.log("🎛️ Modal Playlist abierto desde botón Menu");
});

// Cierre por botón ❌
closePlaylistModal.addEventListener("click", () => {
    modalPlaylist.classList.add("hidden");
    console.log("❌ Modal Playlist cerrado");
});

// Cierre con tecla ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalPlaylist.classList.contains("hidden")) {
        modalPlaylist.classList.add("hidden");
        console.log("❌ Modal Playlist cerrado con ESC");
    }
});

// Cierre por clic fuera del modal
document.addEventListener("click", (e) => {
    const isClickOutside = !modalPlaylist.contains(e.target) && !menuBtn.contains(e.target);
    if (!modalPlaylist.classList.contains("hidden") && isClickOutside) {
        modalPlaylist.classList.add("hidden");
        console.log("❌ Modal Playlist cerrado por clic fuera");
    }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 06 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🪟 HISTORIAL DE RADIO (MODAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Abrir o cerrar el modal Historial
function toggleHistoryModal(show) {
    const modalHistory = document.getElementById("modalHistory");
    if (!modalHistory) return;

    if (show) {
        generarHistorialModal(); // genera contenido antes de mostrar
        modalHistory.classList.remove("hidden");
        const playerContainer = document.querySelector(".player-container");
        if (playerContainer) playerContainer.classList.add("blur-background");
    } else {
        modalHistory.classList.add("hidden");
        const playerContainer = document.querySelector(".player-container");
        if (playerContainer) playerContainer.classList.remove("blur-background");
    }
}

// Generar lista de historial en el modal
function generarHistorialModal() {
    const trackList = document.getElementById("modalHistoryTracks");
    if (!trackList) return;

    trackList.innerHTML = "";

    const historyTitle = document.getElementById("historyTitle");
    if (historyTitle) historyTitle.textContent = "Historial de Radio";

    if (trackHistory.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Esperando la primera actualización de pista...";
        trackList.appendChild(li);
        return;
    }

    trackHistory.forEach(entry => {
        const li = document.createElement("li");
        li.classList.add("modal-history-track-item");
        li.innerHTML = `
            <img src="${entry.cover || 'assets/covers/Plato.png'}" 
                 alt="Carátula" class="track-cover" />
            <div class="track-info">
                <strong>${entry.artist} — ${entry.title}</strong>
                <span>🕒 ${entry.time}</span>
            </div>
        `;
        trackList.appendChild(li);
    });
}

// Listener del botón Historial
if (historyButton) {
    historyButton.addEventListener("click", () => toggleHistoryModal(true));
}

// Cierre por botón ❌
if (closeHistory) {
    closeHistory.addEventListener("click", () => toggleHistoryModal(false));
}

// Cierre con tecla ESC
document.addEventListener("keydown", (e) => {
    const modalHistory = document.getElementById("modalHistory");
    if (e.key === "Escape" && modalHistory && !modalHistory.classList.contains("hidden")) {
        toggleHistoryModal(false);
    }
});

// Cierre por clic fuera del modal
document.addEventListener("click", (e) => {
    const modalHistory = document.getElementById("modalHistory");
    if (!modalHistory) return;
    const isClickOutside = !modalHistory.contains(e.target) && !historyButton.contains(e.target);
    if (!modalHistory.classList.contains("hidden") && isClickOutside) {
        toggleHistoryModal(false);
    }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 07 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔊 CONTROL DE VOLUMEN (FUNCIONAL)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function inicializarVolumen() {
  if (!audio || !volumeSlider || !volumeIcon || !volumePercentage) return;

  // 1) Estado inicial
  let previousVolume = 0.7;
  const initialVolume = parseFloat(volumeSlider.value || "0.7");
  audio.volume = initialVolume;
  volumePercentage.textContent = Math.round(initialVolume * 100) + '%';
  volumeSlider.style.setProperty('--volume-percent', Math.round(initialVolume * 100) + '%');
  updateVolumeIcon(initialVolume);

  // 2) Listener del slider
  volumeSlider.addEventListener('input', function () {
    const volume = parseFloat(volumeSlider.value);
    audio.volume = volume;
    volumePercentage.textContent = Math.round(volume * 100) + '%';
    volumeSlider.style.setProperty('--volume-percent', Math.round(volume * 100) + '%');
    updateVolumeIcon(volume);
  });

  // 3) Listener del icono (mute/unmute)
  volumeIcon.addEventListener('click', function () {
    if (audio.volume > 0) {
      previousVolume = audio.volume;
      audio.volume = 0;
      volumeSlider.value = 0;
      volumePercentage.textContent = '0%';
      volumeSlider.style.setProperty('--volume-percent', '0%');
      updateVolumeIcon(0);
    } else {
      audio.volume = previousVolume;
      volumeSlider.value = previousVolume;
      volumePercentage.textContent = Math.round(previousVolume * 100) + '%';
      volumeSlider.style.setProperty('--volume-percent', Math.round(previousVolume * 100) + '%');
      updateVolumeIcon(previousVolume);
    }
  });

  // 4) Actualizador de icono por nivel
  function updateVolumeIcon(volume) {
    volumeIcon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-off', 'fa-volume-mute');
    if (volume >= 0.7) {
      volumeIcon.classList.add('fa-volume-up');
    } else if (volume >= 0.3) {
      volumeIcon.classList.add('fa-volume-down');
    } else if (volume > 0) {
      volumeIcon.classList.add('fa-volume-off');
    } else {
      volumeIcon.classList.add('fa-volume-mute');
    }
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 08 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 ANIMACIONES Y EFECTOS VISUALES (DISCO, NOTAS, ONDAS EQ, BURBUJAS)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Activar animaciones de reproducción
function activarAnimaciones() {
    const playerContainer = document.querySelector('.player-container');
    const discImg = document.getElementById('art');
    const notes = document.querySelector('.music-notes-container');
    const waves = document.querySelector('.audio-waves');

    if (playerContainer) playerContainer.classList.add('playing');
    if (discImg) discImg.classList.add('rotating');
    if (notes) notes.classList.add('active-notes');
    if (waves) waves.classList.add('active-waves');
}

// Desactivar animaciones de reproducción
function desactivarAnimaciones() {
    const playerContainer = document.querySelector('.player-container');
    const discImg = document.getElementById('art');
    const notes = document.querySelector('.music-notes-container');
    const waves = document.querySelector('.audio-waves');

    if (playerContainer) playerContainer.classList.remove('playing');
    if (discImg) discImg.classList.remove('rotating');
    if (notes) notes.classList.remove('active-notes');
    if (waves) waves.classList.remove('active-waves');
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 09 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🕒 FECHA Y HORA EN VIVO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updateDateTime() {
    const now = new Date();

    // Formatear la hora (formato 24h)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;

    // Formatear la fecha (formato dd/mm/yyyy)
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // +1 porque los meses van de 0 a 11
    const year = now.getFullYear();
    const dateString = `${day}/${month}/${year}`;

    // Actualizar los elementos en el DOM
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');

    if (timeElement) timeElement.textContent = timeString;
    if (dateElement) dateElement.textContent = dateString;
}

// Actualizar inmediatamente al cargar la página
updateDateTime();

// Actualizar cada segundo
setInterval(updateDateTime, 1000);

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 10 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖱️ GESTIÓN DE GESTOS Y DESBLOQUEO DE AUDIO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Listener global para capturar el primer click del usuario
document.addEventListener("click", () => {
    if (!gestureDetected) {
        gestureDetected = true;

        // Desbloquear audio
        audio.muted = false;

        // Si el audio ya tiene src pero está pausado, intentamos reproducir
        if (audio.src && audio.paused) {
            audio.play().then(() => {
                if (iconPlay) iconPlay.classList.add("hidden");
                if (iconPause) iconPause.classList.remove("hidden");
                activarAnimaciones();
            }).catch(err => {
                console.warn("⚠️ Error al iniciar tras gesto:", err);
            });
        }

        // Si el audio estaba reproduciendo silenciado, solo se des-silencia
        if (!audio.paused && modoActual === "radio") {
            if (iconPlay) iconPlay.classList.add("hidden");
            if (iconPause) iconPause.classList.remove("hidden");
            activarAnimaciones();
        }

        console.log("🟢 Gesto humano detectado: Audio desbloqueado.");
    }
}, { once: true });