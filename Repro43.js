$(document).ready(function() {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // --- VARIABLES DE NÚCLEO ---
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const audio = document.getElementById('player');
    const radioURL = "https://laradiossl.online:12000/stream";
    const playlists = [
        "https://radio-tekileros.vercel.app/Repro43.json",
        "https://radio-tekileros.vercel.app/HardCore.json",
        "https://radio-tekileros.vercel.app/BaladasRock.json",
        "https://radio-tekileros.vercel.app/Razteca.json",
        "https://radio-tekileros.vercel.app/ViñaRock.json",
        "https://radio-tekileros.vercel.app/HeavyMetal.json",
        "https://radio-tekileros.vercel.app/Rimas.json",
        "https://radio-tekileros.vercel.app/RockIdioma.json",
        "https://radio-tekileros.vercel.app/Skañol.json",
        "https://radio-tekileros.vercel.app/ZonaSka.json",
        "https://radio-tekileros.vercel.app/AsfaltoUrbano.json",
        "https://radio-tekileros.vercel.app/Metañero.json",
        "https://radio-tekileros.vercel.app/SesionSlam.json",
        "https://radio-tekileros.vercel.app/RockBar.json"
    ];

    let currentMode = "RADIO";
    let currentPlaylistIndex = 0;
    let tracks = [];
    let currentTrackIndex = 0;
    let isSystemOn = false;
    let isRepeat = false;
    let isShuffle = false;
    let radioIntervalId = null;
    let trackHistory = [];
    let ultimaPistaStreaming = "";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// --- SISTEMA DE ARRANQUE (BOOT) ---
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Lo dejamos declarado pero vacío
let bootSFX; 

$(document).one('click touchstart', function() {
    if (!isSystemOn) {
        // CREAMOS EL AUDIO DENTRO DEL EVENTO (Clave para móviles)
        bootSFX = new Audio('https://radio-tekileros.vercel.app/assets/audio/Codec.mp3');
        bootSFX.volume = 0.6;
        
        // Forzamos la carga y reproducción inmediata
        bootSFX.play()
            .then(() => {
                console.log("Codec Sound: ON");
                // Pequeño delay para que el sonido se aprecie antes de que entre la música
                setTimeout(() => { bootSystem(); }, 800); 
            })
            .catch(e => {
                console.error("Móvil bloqueó audio o URL falló:", e);
                bootSystem(); // Booteamos aunque sea en silencio para no trabar la web
            });
    }
});

    function bootSystem() {
        isSystemOn = true;
        audio.muted = false;
        $('.btn-power').addClass('system-on');
        updateVolVisual();
        updateSwitch();
        loadMode();
        startCodecClock();
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // --- GESTIÓN DE MODOS ---
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    $('#power-btn').click(function() {
        if (!isSystemOn) return;
        currentMode = (currentMode === "RADIO") ? "MUSIC" : "RADIO";
        updateSwitch();
        loadMode();
    });

    function updateSwitch() {
        const $modeText = $('#current-mode');
        $modeText.text(currentMode);
        if (currentMode === "MUSIC") {
            $modeText.addClass('music-active').css('color', '#00ff00');
        } else {
            $modeText.removeClass('music-active').css('color', '#fff');
        }
    }

    function loadMode() {
        audio.pause();
        audio.src = "";
        limpiarInterfazMetadatos();
        if (radioIntervalId) clearInterval(radioIntervalId);
        
        if (currentMode === "RADIO") {
            audio.src = radioURL;
            audio.play().catch(e => console.warn("Interacción requerida"));
            actualizarMetadatosStreaming();
            radioIntervalId = setInterval(actualizarMetadatosStreaming, 8000);
        } else {
            fetchPlaylist(playlists[currentPlaylistIndex]);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// --- PROCESAMIENTO DE DATOS (JSON) ---
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function fetchPlaylist(url) {
    $.ajax({
        url: url, 
        dataType: 'json', 
        cache: false,
        success: function(data) {
            // Función interna para aplanar cualquier estructura de JSON
            const flattenTracks = (obj) => {
                let foundTracks = [];
                
                // Si es un array, revisamos si sus elementos son tracks o necesitan más exploración
                if (Array.isArray(obj)) {
                    obj.forEach(item => {
                        if (item.enlace || item.dropbox_url) {
                            foundTracks.push(item);
                        } else if (typeof item === 'object') {
                            foundTracks = foundTracks.concat(flattenTracks(item));
                        }
                    });
                } 
                // Si es un objeto, exploramos todas sus llaves (bandas, secciones, etc.)
                else if (typeof obj === 'object' && obj !== null) {
                    Object.values(obj).forEach(value => {
                        if (value.enlace || value.dropbox_url) {
                            foundTracks.push(value);
                        } else {
                            foundTracks = foundTracks.concat(flattenTracks(value));
                        }
                    });
                }
                return foundTracks;
            };

            // Ejecutamos el aplanado
            tracks = flattenTracks(data);

            console.log(`LOG: Se han extraído ${tracks.length} pistas de la frecuencia.`);

            if (tracks.length > 0) {
                currentTrackIndex = 0;
                playTrack();
            } else {
                console.warn("ALERTA: No se encontraron datos de audio en el JSON.");
            }
        },
        error: function() {
            console.error("ERROR: Fallo en la conexión con el servidor de datos.");
        }
    });
}

    function playTrack() {
        if (!tracks.length) return;
        const t = tracks[currentTrackIndex];
        audio.src = t.enlace || t.dropbox_url;
        audio.play().catch(e => console.log("Buffer ready"));
        updateMetadata(t.nombre, t.artista, t.seccion || "PLAYLIST", t.caratula);
        // --- INSERCIÓN MEDIA SESSION API ---
        updateMediaSession();
    }

    function updateMetadata(title, artist, playlist, cover) {
        $('.title-meta').text(title);
        $('.artist-meta').text(artist);
        $('.playlist-meta').text(playlist);
        $('#current-cover').attr('src', cover);
    }

    function refreshTrackListUI() {
        const $container = $('#track-list');
        $container.empty();
        tracks.forEach((track, index) => {
            const isCurrent = index === currentTrackIndex;
            const $item = $(`
                <div class="track-item ${isCurrent ? 'active-track' : ''}" data-index="${index}">
                    <img src="${track.caratula}" alt="Cover">
                    <span class="track-number">${(index + 1).toString().padStart(2, '0')}</span>
                    <div class="track-info-text">
                        <span class="track-name">${track.nombre}</span>
                        <span class="track-artist">${track.artista}</span>
                    </div>
                    <span class="track-dur">${track.duracion || '--:--'}</span>
                </div>
            `);
            $item.click(function() {
                currentTrackIndex = index;
                playTrack();
                closeModal(); 
            });
            $container.append($item);
        });

        // --- SISTEMA DE AUTO-SCROLL TÁCTICO ---
        // Esperamos un momento a que el modal se muestre para calcular el scroll
        setTimeout(() => {
            const $activeItem = $container.find('.active-track');
            if ($activeItem.length) {
                $container.animate({
                    scrollTop: $activeItem.position().top + $container.scrollTop() - ($container.height() / 2) + ($activeItem.height() / 2)
                }, 500); // 500ms para un desplazamiento suave
            } else {
                // Si no hay track sonando (ej: primer inicio), ir al inicio
                $container.scrollTop(0);
            }
        }, 300);
    }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// --- METADATOS STREAMING (RADIO) ---
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function limpiarInterfazMetadatos() {
    $('.title-meta').text("CONECTANDO...");
    $('.artist-meta').text("BUSCANDO SEÑAL");
    $('.playlist-meta').text("CODEC 140.85");
    $('#current-cover').attr('src', 'https://santi-graphics.vercel.app/assets/covers/Cover1.png');
}

async function actualizarMetadatosStreaming() {
    if (currentMode !== 'RADIO') return;
    const urlStats = `https://laradiossl.online:12000/stats?json=1&t=${Date.now()}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlStats)}`;

    try {
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        if (!proxyData.contents) return;

        const data = JSON.parse(proxyData.contents);
        const rawTitle = data.songtitle || "";

        if (rawTitle === ultimaPistaStreaming && rawTitle !== "") return;
        ultimaPistaStreaming = rawTitle;

        let { artista: fArtist, titulo: fTitle } = limpiarMetadatosRadio(rawTitle);

        // --- RESPUESTA INSTANTÁNEA ---
        // Esto se ejecuta sin esperar a nadie
        $('.title-meta').text(fTitle);
        $('.artist-meta').text(fArtist);
        $('.playlist-meta').text(data.servertitle || "RADIO PSIKOSIS");
        updateMediaSession();

        // --- PROCESO EN SEGUNDO PLANO ---
        // Ejecutamos la búsqueda de carátula pero NO usamos 'await' aquí
        // para que no bloquee la visualización de los textos
        buscarCaratulaReal(fArtist, fTitle).then(() => {
            // Una vez que la carátula cargue (cuando sea que termine), registramos
            registrarEnHistorial(fArtist, fTitle);
            updateMediaSession();
        });

    } catch (e) { 
        console.error("Error metadatos:", e); 
    }
}

function limpiarMetadatosRadio(texto) {
    if (!texto || texto.includes("Stream") || texto.includes("Unknown")) {
        return { artista: "Casino Digital", titulo: "Siente la música" };
    }
    let limpio = texto.replace(/WWW\..*\..*|http:\/\/.*|\[.*\]|<.*>|128kbps|64kbps|mp3/gi, "").trim();
    const parts = limpio.split(" - ");
    return { 
        artista: parts[0] ? parts[0].trim() : "Casino Digital", 
        titulo: parts[1] ? parts[1].trim() : limpio 
    };
}

function registrarEnHistorial(artista, titulo) {
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ":" + ahora.getMinutes().toString().padStart(2, '0');
    
    // Capturamos la carátula que el DOM ya actualizó gracias al await
    const caratulaActual = $('#current-cover').attr('src');

    if (trackHistory.length > 0 && trackHistory[0].title === titulo) return;

    trackHistory.unshift({ 
        time: hora, 
        artist: artista, 
        title: titulo, 
        cover: caratulaActual 
    });

    if (trackHistory.length > 30) trackHistory.pop();
}

async function buscarCaratulaReal(artista, titulo) {
    const term = encodeURIComponent(`${artista} ${titulo}`);
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&limit=1`);
        const json = await res.json();
        if (json.results && json.results.length > 0) {
            const highResCover = json.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
            $('#current-cover').attr('src', highResCover);
            return highResCover;
        } else {
            // Si no hay resultados, ponemos la de por defecto para no heredar la del artista anterior
            $('#current-cover').attr('src', 'https://santi-graphics.vercel.app/assets/covers/Cover1.png');
        }
    } catch (e) { 
        console.warn("Sin portada"); 
    }
    return null;
}
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // --- PROTOCOLO DE RECONEXIÓN AUTOMÁTICA ---
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let reconnectTimeout;

audio.addEventListener('waiting', () => {
    // Si el audio se queda "esperando" más de 10 segundos, forzamos reinicio
    console.log("Señal débil... iniciando temporizador de rescate.");
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
        if (audio.paused) return; // Si el usuario lo pausó, no hacemos nada
        console.log("Reconectando frecuencia...");
        const currentSrc = audio.src;
        audio.src = ""; // Limpiamos buffer
        audio.src = currentSrc;
        audio.load();
        audio.play().catch(e => console.log("Reintento fallido, esperando señal..."));
    }, 10000); // 10 segundos de margen
});

audio.addEventListener('playing', () => {
    // Si la música empieza a sonar, cancelamos el temporizador de rescate
    clearTimeout(reconnectTimeout);
});

// Detectar si el dispositivo vuelve a estar online
window.addEventListener('online', () => {
    console.log("Señal recuperada. Reestableciendo enlace.");
    if (isSystemOn && audio.paused && currentMode === "RADIO") {
        loadMode();
    }
});

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // --- GESTIÓN DE MODALES (VERSIÓN TÁCTICA) ---
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // Función centralizada para abrir modales
    function openModal(modalId) {
        if (!isSystemOn) return;
        
        // Cerramos cualquier otro modal abierto primero
        $('.codec-modal').fadeOut(200).removeClass('active');
        
        const $target = $(`#${modalId}`);
        $target.fadeIn(300).addClass('active');
        
        // Empujamos un estado al historial para que el botón "Atrás" del móvil no cierre la web
        window.history.pushState({ modalOpen: true, id: modalId }, "");
    }

    // Función centralizada para cerrar modales
    function closeModal() {
        const $activeModal = $('.codec-modal.active');
        if ($activeModal.length === 0) return;

        $activeModal.fadeOut(300).removeClass('active');

        if (window.history.state && window.history.state.modalOpen) {
            window.history.back();
        }
    }

    // --- ESCUCHA PARA EL SELECTOR DE PLAYLISTS (ELIMINA EL FALLO) ---
    // Este bloque faltaba: activa los clics en los diskettes del modal de contenido
    $(document).on('click', '.playlist-item', function() {
        if (!isSystemOn) return;

        const index = $(this).data('index');
        currentPlaylistIndex = index;

        console.log("FRECUENCIA CAMBIADA A: " + index);

        // Cambiamos modo a MUSIC
        currentMode = "MUSIC";
        updateSwitch();

        // Detenemos radio e iniciamos carga de JSON
        if (radioIntervalId) clearInterval(radioIntervalId);
        fetchPlaylist(playlists[currentPlaylistIndex]);

        closeModal();
    });

    // Listeners de Botones de la Interfaz
    $('#music-btn').click(function() {
        const $container = $('#track-list');
        $container.empty();

        if (currentMode === 'RADIO') {
            $('.modal-title').text("RADIO HISTORY 30 RECENT TRACKS");
            trackHistory.forEach((track, index) => {
                $container.append(`
                    <div class="track-item">
                        <img src="${track.cover}" alt="Cover">
                        <span class="track-number">${track.time}</span>
                        <div class="track-info-text">
                            <span class="track-name">${track.title}</span>
                            <span class="track-artist">${track.artist}</span>
                        </div>
                    </div>
                `);
            });
            $container.scrollTop(0); // En radio siempre ver lo más reciente arriba
        } else {
            $('.modal-title').text("PLAYLIST ACTUAL");
            refreshTrackListUI(); // Esto ya incluye el auto-scroll al track activo
        }
        openModal('music-modal');
    });

    $('#contenido-btn').click(function() {
        $('#content-modal .modal-title').text("SELECT FREQUENCY"); 
        openModal('content-modal');
    });

    // Cierre por clic en botones X
    $('.codec-modal-close, #close-music-modal, #close-content-modal').click(function() {
        closeModal();
    });

    // Cierre por tecla ESC
    $(document).on('keydown', function(e) {
        if (e.key === "Escape") closeModal();
    });

    // GESTIÓN DEL BOTÓN ATRÁS (Móvil / Navegador)
    window.onpopstate = function(event) {
        if ($('.codec-modal.active').length) {
            $('.codec-modal').fadeOut(300).removeClass('active');
        }
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // --- CONTROLES TACTICOS (PLAY/PAUSE INTEGRAL) ---
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Función unificada para el cambio visual
    function setPlayIcon(isPlaying) {
        const btn = document.getElementById('play-btn');
        if (!btn) return;
        btn.className = isPlaying ? 'fas fa-pause btn-play' : 'fas fa-play btn-play';
    }

    // Sincronización con el hardware (Para cuando la pista cambia sola)
    audio.addEventListener('play', () => setPlayIcon(true));
    audio.addEventListener('pause', () => setPlayIcon(false));

    // Control de Click (Cambio inmediato para Radio)
    $('#play-btn').off('click').on('click', function(e) {
        e.preventDefault();
        if (!isSystemOn) return;

        if (audio.paused) {
            // 1. Cambio visual INSTANTÁNEO (No espera al buffer)
            setPlayIcon(true);

            if (currentMode === "RADIO") {
                if (!audio.src || audio.src === window.location.href) {
                    audio.src = radioURL;
                }
            }
            
            audio.play().catch(err => {
                console.error("Error en reproducción:", err);
                setPlayIcon(false); // Revertir si falla
            });
        } else {
            // 1. Cambio visual INSTANTÁNEO
            setPlayIcon(false);

            audio.pause();

            if (currentMode === "RADIO") {
                audio.src = ""; // Cortar flujo de datos
                audio.load();
            }
        }
    });


    // --- PROTOCOLO REPEAT (SISTEMA INTEGRAL) ---
    // 1. EL BOTÓN: Limpiamos y asignamos acción limpia
    $('#repeat-btn').off('click').on('click', function(e) {
        e.preventDefault();
        isRepeat = !isRepeat; // Cambiamos el estado global
        
        // Cambio visual inmediato
        if (isRepeat) {
            $(this).css({
                'color': '#00ff00',
                'text-shadow': '0 0 10px rgba(0, 255, 0, 0.8)'
            });
            console.log("LOG: Modo Repeat ACTIVADO");
        } else {
            $(this).css({
                'color': '#ffffff',
                'text-shadow': 'none'
            });
            console.log("LOG: Modo Repeat DESACTIVADO");
        }
    });

    // 2. EL CEREBRO: Único punto de control de fin de pista
    audio.onended = function() {
        console.log("Fin de track. Verificando protocolo Repeat: " + isRepeat);
        
        if (isRepeat) {
            // REPETICIÓN TÁCTICA: Reinicio inmediato
            audio.currentTime = 0;
            audio.play().catch(err => console.warn("Error al repetir:", err));
        } 
        else if (currentMode === "MUSIC" && tracks.length > 0) {
            // Lógica normal de avance o Shuffle
            if (isShuffle) {
                currentTrackIndex = Math.floor(Math.random() * tracks.length);
            } else {
                currentTrackIndex++;
            }

            if (currentTrackIndex < tracks.length) {
                playTrack();
            } else {
                // Si llegamos al final de la playlist, saltamos a la siguiente
                console.log("Fin de lista. Buscando siguiente frecuencia...");
                currentPlaylistIndex = (currentPlaylistIndex + 1) % playlists.length;
                fetchPlaylist(playlists[currentPlaylistIndex]);
            }
        } 
        else if (currentMode === "RADIO") {
            // Reconexión de radio si se pierde el stream
            loadMode();
        }
    };

    // Botón Shuffle
    $('#shuffle-btn').click(function() {
        isShuffle = !isShuffle;
        $(this).css('color', isShuffle ? '#00ff00' : '#fff'); // Verde neón si está activo
        if (isShuffle && currentMode === "MUSIC") {
            // Activar aleatorio de inmediato saltando a un track al azar
            currentTrackIndex = Math.floor(Math.random() * tracks.length);
            playTrack();
        }
        console.log("Modo Shuffle:", isShuffle);
    });

    // Avance (FWD)
    $('#fwd-btn').click(function() {
        if (currentMode === "MUSIC" && tracks.length > 0) {
            if (isShuffle) {
                currentTrackIndex = Math.floor(Math.random() * tracks.length);
            } else {
                currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
            }
            playTrack();
        }
    });

    // Retroceso (RWD)
    $('#rwd-btn').click(function() {
        if (currentMode === "MUSIC" && tracks.length > 0) {
            currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
            playTrack();
        }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // --- GESTIÓN DE VOLUMEN TÁCTICA ---
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const slider = document.getElementById('volumenSlider');
    // Selección precisa por clase para evitar fallos de jerarquía
    const btnMenos = document.querySelector('.volumen-control:first-of-type');
    const btnMas = document.querySelector('.volumen-control:nth-of-type(2)');

    function updateVolVisual() {
        if (!slider) return;
        const val = slider.value;
        audio.volume = val / 100;
        audio.muted = false;
        
        // Efecto de llenado: Blanco sólido para el progreso, tenue para el resto
        slider.style.background = `linear-gradient(to right, #fff ${val}%, rgba(255,255,255,0.1) ${val}%)`;
    }

    if (slider) {
        // Establecemos valor inicial al 80%
        slider.value = 80;
        
        // Listener para movimiento manual de la barra
        slider.addEventListener('input', updateVolVisual);

        // Control por botones (◄ y ►)
        if (btnMenos) {
            btnMenos.style.cursor = "pointer"; // Asegura que sea clickable
            btnMenos.onclick = (e) => {
                e.preventDefault();
                slider.value = Math.max(0, parseInt(slider.value) - 10);
                updateVolVisual();
            };
        }

        if (btnMas) {
            btnMas.style.cursor = "pointer";
            btnMas.onclick = (e) => {
                e.preventDefault();
                slider.value = Math.min(100, parseInt(slider.value) + 10);
                updateVolVisual();
            };
        }

        // Ejecución inmediata para aplicar el 80% al arrancar
        updateVolVisual();
    }
}); // <--- CIERRE DEL DOCUMENT READY

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // --- MOVIL MEDIA SESSION API ---
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function updateMediaSession() {
    if ('mediaSession' in navigator) {
        const title = $('.title-meta').text();
        const artist = $('.artist-meta').text();
        const cover = $('#current-cover').attr('src');

        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: 'Codec Communications',
            artwork: [
                { src: cover, sizes: '96x96',   type: 'image/png' },
                { src: cover, sizes: '512x512', type: 'image/png' },
            ]
        });

        // Controles desde la pantalla de bloqueo
        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => $('#rwd-btn').click());
        navigator.mediaSession.setActionHandler('nexttrack', () => $('#fwd-btn').click());
    }
}

// --- FUNCIÓN DEL RELOJ DE MISIÓN ---
    function startCodecClock() {
        setInterval(() => {
            const now = new Date();
            const h = now.getHours().toString().padStart(2, '0');
            const m = now.getMinutes().toString().padStart(2, '0');
            const s = now.getSeconds().toString().padStart(2, '0');
            $('#digital-clock').text(`${h}:${m}:${s}`);
        }, 1000);
    }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// --- SEGURIDAD Y CONTEXTO ---
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const msg = document.getElementById("custom-message");
    if(msg) {
        msg.classList.add("show");
        setTimeout(() => msg.classList.remove("show"), 2000);
    }
});

/**
 * PROTOCOLO DE ESCALADO TÁCTICO - ASFALTO URBANO
 * Ajusta un contenedor de 500x795 a cualquier pantalla móvil.
 */
const fixCodecScale = () => {
    const mainContainer = document.querySelector('.main-container');
    const rootScaler = document.getElementById('root-scaler');
    
    if (!mainContainer || !rootScaler) return;

    // Dimensiones originales del diseño MGS
    const DESIGN_WIDTH = 500;
    const DESIGN_HEIGHT = 795;

    // Espacio disponible en el dispositivo real
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Cálculo de ratio (min selecciona el eje más restrictivo)
    const scale = Math.min(windowWidth / DESIGN_WIDTH, windowHeight / DESIGN_HEIGHT);

    // Aplicamos el escalado al contenedor
    // Usamos un factor de 0.98 para evitar que toque los bordes del cristal
    if (windowWidth < DESIGN_WIDTH || windowHeight < DESIGN_HEIGHT) {
        mainContainer.style.transform = `scale(${scale * 0.98})`;
    } else {
        mainContainer.style.transform = 'scale(1)';
    }

    // Aseguramos que el origen sea el centro
    mainContainer.style.transformOrigin = 'center center';
};

// Ejecución inmediata y en cambios de orientación
window.addEventListener('resize', fixCodecScale);
window.addEventListener('DOMContentLoaded', fixCodecScale);
// Ejecución de respaldo por si el DOM tarda
setTimeout(fixCodecScale, 100);