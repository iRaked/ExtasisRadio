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
        "https://radio-tekileros.vercel.app/RockIdioma.json"
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
    $(document).one('click touchstart', function() {
        if (!isSystemOn) {
            const bootSFX = new Audio('https://radio-tekileros.vercel.app/assets/audio/Codec.mp3');
            bootSFX.volume = 0.6;
            bootSFX.play().then(() => {
                setTimeout(() => { bootSystem(); }, 500);
            }).catch(e => {
                bootSystem();
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
            url: url, dataType: 'json', cache: false,
            success: function(data) {
                let content = Array.isArray(data) ? data : data[Object.keys(data)[0]];
                tracks = Array.isArray(content) ? content : [];
                if (tracks.length > 0) {
                    currentTrackIndex = 0;
                    playTrack();
                }
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
                $('#music-modal').fadeOut(300).removeClass('active');
            });
            $container.append($item);
        });
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

            $('.title-meta').text(fTitle);
            $('.artist-meta').text(fArtist);
            $('.playlist-meta').text(data.servertitle || "RADIO PSIKOSIS");
            // --- INSERCIÓN MEDIA SESSION API B ---
            updateMediaSession();

            registrarEnHistorial(fArtist, fTitle);
            buscarCaratulaReal(fArtist, fTitle);
        } catch (e) { console.error("Error metadatos:", e); }
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
        if (trackHistory.length > 0 && trackHistory[0].title === titulo) return;
        trackHistory.unshift({ time: hora, artist: artista, title: titulo });
        if (trackHistory.length > 30) trackHistory.pop();
    }

    async function buscarCaratulaReal(artista, titulo) {
        const term = encodeURIComponent(`${artista} ${titulo}`);
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${term}&media=music&limit=1`);
            const json = await res.json();
            if (json.results && json.results.length > 0) {
                $('#current-cover').attr('src', json.results[0].artworkUrl100.replace("100x100bb", "600x600bb"));
            }
        } catch (e) { console.warn("Sin portada"); }
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
    // --- GESTIÓN DE MODALES ---
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    $('#music-btn').click(function() {
        if (!isSystemOn) return;
        $('#content-modal').fadeOut(200);
        const $container = $('#track-list');
        $container.empty();

        if (currentMode === 'RADIO') {
            $('.modal-title').text("RADIO HISTORY 30 RECENT TRACKS");
            trackHistory.forEach(track => {
                $container.append(`
                    <div class="track-item">
                        <span class="track-number">${track.time}</span>
                        <div class="track-info-text">
                            <span class="track-name">${track.title}</span>
                            <span class="track-artist">${track.artist}</span>
                        </div>
                    </div>
                `);
            });
        } else {
            $('.modal-title').text("PLAYLIST ACTUAL");
            refreshTrackListUI();
        }
        $('#music-modal').fadeIn(300).addClass('active');
    });

    $('#contenido-btn').click(function() {
        if (!isSystemOn) return;
        $('#music-modal').fadeOut(200);
        
        // --- CAMBIO DE TEXTO DE CABECERA AQUÍ ---
        $('#content-modal .modal-title').text("SELECT FREQUENCY"); 
        
        $('#content-modal').fadeIn(300).addClass('active');
    });

    $('.playlist-item').click(function() {
        currentPlaylistIndex = $(this).data('index');
        currentMode = "MUSIC";
        updateSwitch();
        fetchPlaylist(playlists[currentPlaylistIndex]);
        $('#content-modal').fadeOut(300);
    });

    $('.codec-modal-close, #close-music-modal, #close-content-modal').click(function() {
        $(this).closest('.codec-modal').fadeOut(300).removeClass('active');
    });


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // --- CONTROLES TACTICOS ---
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Play/Pause con cambio de icono
    $('#play-btn').click(function() {
        if (!isSystemOn) return;
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    });

    // Detectar eventos del audio para cambiar el icono automáticamente
    audio.onplay = () => $('#play-btn i').removeClass('fa-play').addClass('fa-pause');
    audio.onpause = () => $('#play-btn i').removeClass('fa-pause').addClass('fa-play');


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