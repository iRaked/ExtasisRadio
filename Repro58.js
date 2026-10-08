/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MOTOR iPOD / R58 (MODO RADIO POR DEFECTO + SWITCH)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
$(document).ready(function() {
    const audio = document.getElementById('player'); 
    let hits = []; 
    let currentIndex = 0;

    // Endpoints
    const URL_LOCAL_RAZTECA = "https://radio-tekileros.vercel.app/Razteca.json";
    const RADIO_STREAM_URL = "http://technoplayerserver.net:8240/stream";
    const RADIO_JSON_URL = "http://technoplayerserver.net:8240/stats?json=1&sid=1";

    // Estado inicial: Arranca en MODO RADIO (true)
    let isRadioMode = true;
    let radioUpdateIntervalId = null;
    let lastTrackTitleRadio = "";
    let radioHistory = []; // Historial de canciones para el modo radio

    function loadLocalPlaylist(autoPlayAfter = false) {
        detenerActualizacionRadio();
        
        $.getJSON(URL_LOCAL_RAZTECA, function(data) {
            hits = data.hits || data.razteca; 

            if (hits && hits.length > 0) {
                currentIndex = 0; 
                updateUI(currentIndex);

                if (autoPlayAfter) {
                    playTrack();
                }

                if ($('#modal-playlist').is(':visible')) {
                    fillPlaylist();
                }
            }
        }).fail(function() { console.error("Error al cargar playlist local Razteca"); });
    }

    function updateUI(index) {
        if (!hits[index]) return;
        const track = hits[index];

        $('#player-artist').text(track.artista);
        $('#player-title').text(track.nombre);
        $('#player-cover').attr('src', track.caratula);

        audio.src = track.enlace;
        audio.load();

        updateModalSelection(index);
    }

    function updateModalSelection(index) {
        $('.track-item').removeClass('active');$(`.track-item[data-index="${index}"]`).addClass('active');
    }

    function playTrack() {
        audio.muted = false;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                $('#btn-play-pause').find('i').removeClass('fa-play').addClass('fa-pause');
            }).catch(e => console.log("Gesto requerido o autoplay bloqueado"));
        }
    }
    
    audio.ontimeupdate = function() {
        if (!isNaN(audio.duration) && !isRadioMode) {
            const min = Math.floor(audio.currentTime / 60);
            const sec = Math.floor(audio.currentTime % 60);
            $('#player-time').text(`${min}:${sec < 10 ? '0' + sec : sec}`);
        } else if (isRadioMode) {
            $('#player-time').text("LIVE");
        }
    };

    //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📻 MOTOR DE RADIO (PUERTO 8042 + PROXIES + ITUNES)
    //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function iniciarModoRadio() {
        isRadioMode = true;
        audio.src = RADIO_STREAM_URL;
        audio.load();
        playTrack();

        $('#player-artist').text("RADIO PLAY");
        $('#player-title').text("AUTO DJ");
        $('#player-cover').attr('src', 'https://santi-graphics.vercel.app/assets/covers/Cover1.png');

        if (radioUpdateIntervalId) {
            clearInterval(radioUpdateIntervalId);
            radioUpdateIntervalId = null;
        }
        
        const proxies = [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(RADIO_JSON_URL)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(RADIO_JSON_URL)}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(RADIO_JSON_URL)}`
        ];

        async function obtenerDatosRadio() {
            if (!isRadioMode) return;
            let jsonData = null;

            for (let i = 0; i < proxies.length; i++) {
                const proxyUrl = proxies[i];
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);

                    const response = await fetch(proxyUrl, { 
                        cache: 'no-store',
                        signal: controller.signal 
                    });
                    
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const textData = await response.text();
                        if (proxyUrl.includes('allorigins.win/get')) {
                            const parsedWrapper = JSON.parse(textData);
                            jsonData = JSON.parse(parsedWrapper.contents);
                        } else {
                            jsonData = JSON.parse(textData);
                        }
                        break; 
                    }
                } catch (e) {
                    continue; 
                }
            }

            if (!jsonData) return;

            try {
                const rawTitle = jsonData.songtitle || "";
                const cleanedTitle = rawTitle.trim().replace(/AUTODJ/gi, '').replace(/\|\s*$/g, '').trim();

                if (!cleanedTitle || cleanedTitle.toLowerCase().includes('offline')) {
                    return;
                }

                if (cleanedTitle !== lastTrackTitleRadio) {
                    lastTrackTitleRadio = cleanedTitle;
                    
                    const songtitleSplit = cleanedTitle.split(/ - | – /);
                    let artist = "Radio R58";
                    let title = cleanedTitle; 

                    if (songtitleSplit.length >= 2) {
                        artist = songtitleSplit[0].trim();
                        title = songtitleSplit.slice(1).join(' - ').trim(); 
                    }

                    $('#player-artist').text(artist);
                    $('#player-title').text(title);

                    // Agregar al historial de radio (evitando duplicados consecutivos y manteniendo un límite de 20)
                    const trackEntry = { artista: artist, nombre: title };
                    if (radioHistory.length === 0 || (radioHistory[0].nombre !== title && radioHistory[0].artista !== artist)) {
                        radioHistory.unshift(trackEntry);
                        if (radioHistory.length > 20) radioHistory.pop();
                    }

                    // Si el modal de la playlist está abierto en modo radio, actualizar el historial en tiempo real
                    if ($('#modal-playlist').is(':visible') && isRadioMode) {
                        fillPlaylist();
                    }

                    if (title.length < 80) {
                        obtenerCaratulaRadio(artist, title);
                    }
                }
            } catch (error) {
                console.error("❌ Error en radio 8042:", error);
            }
        }

        obtenerDatosRadio();    
        radioUpdateIntervalId = setInterval(obtenerDatosRadio, 6000);
    }

    function detenerActualizacionRadio() {
        isRadioMode = false;
        if (radioUpdateIntervalId !== null) {
            clearInterval(radioUpdateIntervalId);
            radioUpdateIntervalId = null;
        }
        lastTrackTitleRadio = "";
    }

    function obtenerCaratulaRadio(artist, title) {
        let cleanArtist = artist.toLowerCase().trim();
        if (cleanArtist.includes(" &")) cleanArtist = cleanArtist.substring(0, cleanArtist.indexOf(' &'));
        else if (cleanArtist.includes("feat")) cleanArtist = cleanArtist.substring(0, cleanArtist.indexOf(' feat'));
        
        let cleanTitle = title.toLowerCase().trim();
        if (cleanTitle.includes("&")) cleanTitle = cleanTitle.replace('&', 'and');
        else if (cleanTitle.includes("(")) cleanTitle = cleanTitle.substring(0, cleanTitle.indexOf(' ('));

        try {
            const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
            const itunesUrl = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

            fetch(itunesUrl)
                .then(res => res.json())
                .then(data => {
                    let cover = 'https://santi-graphics.vercel.app/assets/img/Plato.png'; 
                    if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
                        cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
                    }
                    $('#player-cover').attr('src', cover);
                })
                .catch(() => {
                    $('#player-cover').attr('src', 'https://santi-graphics.vercel.app/assets/covers/Cover1.png');
                });
        } catch (e) {
            console.warn("Error en carátula radio:", e);
        }
    }

    //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Botón central para alternar entre Radio / Local
    //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    $('.wheel-center-dot').on('click', function(e) {
        e.stopPropagation();

        if (isRadioMode) {
            loadLocalPlaylist(true);
            console.log("Modo cambiado a: Local (Razteca)");
        } else {
            iniciarModoRadio();
            console.log("Modo cambiado a: Radio en Vivo (Puerto 8042)");
        }

        // Si el modal está abierto al hacer el cambio, se limpia y se repinta con el contenido del nuevo modo
        if ($('#modal-playlist').is(':visible')) {
            fillPlaylist();
        }

        $(this).css('box-shadow', '0 0 30px var(--neon-aqua, #00f2ff)');
        setTimeout(() => {
            $(this).css('box-shadow', '0 0 15px rgba(188, 19, 254, 0.3), inset 0 0 10px rgba(188, 19, 254, 0.2)');
        }, 300);
    });

    $('#btn-next').on('click', function(e) {
        e.stopPropagation();
        if (isRadioMode) return;
        if (hits.length === 0) return;
        currentIndex = (currentIndex + 1) % hits.length;
        updateUI(currentIndex);
        playTrack();
    });

    $('#btn-prev').on('click', function(e) {
        e.stopPropagation();
        if (isRadioMode) return;
        if (hits.length === 0) return;
        currentIndex = (currentIndex - 1 + hits.length) % hits.length;
        updateUI(currentIndex);
        playTrack();
    });

    $('#btn-play-pause').on('click', function(e) {
        e.stopPropagation();
        if (audio.paused) { 
            playTrack(); 
        } else { 
            audio.pause(); 
            $(this).find('i').removeClass('fa-pause').addClass('fa-play'); 
        }
    });

    function fillPlaylist() {
        const list = $('#track-list');
        list.empty(); // Limpieza previa obligatoria entre modos

        if (isRadioMode) {
            // Modo Radio: Pintar el historial de canciones (solo artista y título)
            if (radioHistory.length === 0) {
                list.append(`<li class="track-item"><span class="t-name">Esperando transmisión...</span><span class="t-artist">Radio Play</span></li>`);
                return;
            }
            radioHistory.forEach((track) => {
                list.append(`<li class="track-item radio-history-item">
                    <span class="t-name">${track.nombre}</span>
                    <span class="t-artist">${track.artista}</span>
                </li>`);
            });
        } else {
            // Modo Local: Pintar la playlist dinámica Razteca
            hits.forEach((track, index) => {
                const isActive = index === currentIndex ? 'active' : '';
                list.append(`<li class="track-item ${isActive}" data-index="${index}">
                    <span class="t-name">${track.nombre}</span>
                    <span class="t-artist">${track.artista}</span>
                </li>`);
            });
        }
    }

    $('#btn-menu').on('click', function(e) {
        e.stopPropagation();
        fillPlaylist();
        $('#modal-playlist').css('display', 'flex').hide().fadeIn(300);
    });

    $('#close-menu').on('click', function() { $('#modal-playlist').fadeOut(300); });

    $(document).on('click', '.track-item', function() {
        if (isRadioMode) return; // En modo radio los elementos del historial no son clickeables para reproducir pista local
        currentIndex = $(this).data('index');
        updateUI(currentIndex);
        playTrack();
        $('#modal-playlist').fadeOut(300);
    });

    audio.onended = function() {
        if (!isRadioMode) {
            currentIndex = (currentIndex + 1) % hits.length;
            updateUI(currentIndex);
            playTrack();
        }
    };

    $(document).one('click touchstart', function() {
        if (audio.paused) playTrack();
    });

    // 🚀 INICIO AUTOMÁTICO EN MODO RADIO (PUERTO 8042)
    iniciarModoRadio();
});