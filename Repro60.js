/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/* --- MOTOR DE AUDIO: NEÓN & STREAMING / LOCAL (R60 CON METADATOS R58) --- */
/* --- Autor: Rick --- */
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
$(document).ready(function() {
    const audio = document.getElementById('main-audio');
    let musicData = [];
    let radioHistory = []; 
    let isSystemStarted = false;
    let isLocalMode = false;
    let isHomeActive = false; // Variable auxiliar, pero la verdad absoluta es el DOM

    // Datos estáticos para el modo Radio en vivo
    const liveRadioTrack = {
        nombre: "AUTO DJ",
        artista: "Casino Digital",
        caratula: "https://santi-graphics.vercel.app/assets/covers/Cover1.png",
        duracion: "LIVE",
        enlace: "http://technoplayerserver.net:8240/stream"
    };

    // Variables para el motor de metadatos de Radio
    const RADIO_JSON_URL = "http://technoplayerserver.net:8240/stats?json=1&sid=1";
    let radioUpdateIntervalId = null;
    let lastTrackTitleRadio = "";

    function updateUI(track) {
        if (!track) return;
        $('#track-art').attr('src', track.caratula || track.imagen || track.cover || liveRadioTrack.caratula);
        $('#track-artist').text(track.artista || track.artist || 'Casino Digital');
        $('#track-name').text(track.nombre || track.title || 'AUTO DJ');

        if (!isLocalMode) {
            addToRadioHistory(track);
        }
    }

    function addToRadioHistory(track) {
        const lastItem = radioHistory[0];
        if (!lastItem || lastItem.enlace !== track.enlace || lastItem.nombre !== track.nombre) {
            radioHistory.unshift(track); 
            if (radioHistory.length > 20) radioHistory.pop(); 
        }
    }

    function updatePlayPauseUI(playing) {
        const btn = $('#play-pause-btn i');
        if (playing) {
            btn.removeClass('fa-play').addClass('fa-pause');
            $('.visualizer span').css('animation-play-state', 'running');
        } else {
            btn.removeClass('fa-pause').addClass('fa-play');
            $('.visualizer span').css('animation-play-state', 'paused');
        }
    }

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- 📻 MOTOR DE RADIO: METADATOS CON PROXIES + ITUNES --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    function iniciarModoRadio() {
        isLocalMode = false;
        clearAudioModeClasses();
        if (document.getElementById('btn-radio')) {
            document.getElementById('btn-radio').classList.add('active-radio');
        }

        radioHistory = []; 
        lastTrackTitleRadio = ""; 

        audio.src = liveRadioTrack.enlace;
        audio.load();
        
        $('#track-artist').text("Casino Digital");
        $('#track-name').text("AUTO DJ");
        $('#track-art').attr('src', liveRadioTrack.caratula);
        $('#progress').css('width', '100%');

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
            if (isLocalMode) return;
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

            // 🔥 CRUCIAL: Si el usuario cambió a modo local mientras esperábamos el fetch, abortamos aquí.
            // Esto evita que una respuesta tardía de la radio sobrescriba el primer track local.
            if (isLocalMode) return;

            if (!jsonData) return;

            try {
                const rawTitle = jsonData.songtitle || "";
                const cleanedTitle = rawTitle.trim().replace(/AUTODJ/gi, '').replace(/\|\s*$/g, '').trim();

                if (!cleanedTitle || cleanedTitle.toLowerCase().includes('offline')) {
                    return;
                }

                if (cleanedTitle !== lastTrackTitleRadio) {
                    // 🔥 DOBLE SEGURIDAD: Re-verificar justo antes de tocar el DOM
                    if (isLocalMode) return;

                    lastTrackTitleRadio = cleanedTitle;
                    
                    const songtitleSplit = cleanedTitle.split(/ - | – /);
                    let artist = "Casino Digital";
                    let title = cleanedTitle; 

                    if (songtitleSplit.length >= 2) {
                        artist = songtitleSplit[0].trim();
                        title = songtitleSplit.slice(1).join(' - ').trim(); 
                    }

                    $('#track-artist').text(artist);
                    $('#track-name').text(title);

                    const currentCover = $('#track-art').attr('src') || liveRadioTrack.caratula;
                    const trackEntry = { 
                        artista: artist, 
                        nombre: title, 
                        caratula: currentCover, 
                        enlace: liveRadioTrack.enlace 
                    };
                    
                    if (radioHistory.length === 0 || (radioHistory[0].nombre !== title && radioHistory[0].artista !== artist)) {
                        radioHistory.unshift(trackEntry);
                        if (radioHistory.length > 20) radioHistory.pop();
                    }

                    if ($('#dynamic-content-modal').is(':visible') && !isLocalMode) {
                        renderModalContent();
                    }

                    if (title.length < 80) {
                        obtenerCaratulaRadio(artist, title);
                    }
                }
            } catch (error) {
                console.error("❌ Error en radio metadata:", error);
            }
        }

        obtenerDatosRadio();    
        radioUpdateIntervalId = setInterval(obtenerDatosRadio, 6000);
        
        if (isSystemStarted) {
            audio.play().then(() => updatePlayPauseUI(true)).catch(err => console.log(err));
        }
    }

    function detenerActualizacionRadio() {
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
                    let cover = 'https://santi-graphics.vercel.app/assets/covers/Cover1.png'; 
                    if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
                        cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
                    }
                    $('#track-art').attr('src', cover);
                    
                    if (radioHistory.length > 0) {
                        radioHistory[0].caratula = cover;
                        if ($('#dynamic-content-modal').is(':visible') && !isLocalMode) {
                            renderModalContent();
                        }
                    }
                })
                .catch(() => {});
        } catch (e) {
            console.warn("Error en carátula radio:", e);
        }
    }

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- CAPTURA DE METADATOS DE STREAMING (LOCAL / SPOTIFLY) --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    async function loadMusicData() {
        try {
            const response = await fetch('https://radio-tekileros.vercel.app/Spotifly.json');
            const data = await response.json();
            musicData = Array.isArray(data) ? data : Object.values(data).find(Array.isArray);

            if (musicData && musicData.length > 0) {
                PlayerControl.currentIndex = 0;
                const firstTrack = musicData[0];
                audio.src = firstTrack.enlace;
                audio.load();
                updateUI(firstTrack);

                if (isSystemStarted) {
                    audio.play().then(() => {
                        const playIcon = document.querySelector('#play-pause-btn i');
                        const vinylElem = document.querySelector('#vinyl');
                        if (playIcon) playIcon.className = 'fa-solid fa-pause';
                        if (vinylElem) vinylElem.classList.add('spinning');
                    }).catch(err => console.log("Interacción requerida"));
                }
            }
        } catch (error) {
            console.error("Error al cargar el JSON local:", error);
        }
    }

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    // FUNCIÓN MAESTRA DE INICIO
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    async function startAudioSystem() {
        if (isSystemStarted) return;
        try {
            isSystemStarted = true;
            window.removeEventListener('click', startAudioSystem);
            window.removeEventListener('touchstart', startAudioSystem);
            iniciarModoRadio();
        } catch (error) {
            console.error("Error al iniciar el audio:", error);
        }
    }

    window.addEventListener('click', startAudioSystem);
    window.addEventListener('touchstart', startAudioSystem);

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    // BOTONERA PRINCIPAL (PLAY / PAUSE)
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    $('#play-pause-btn').click(function(e) {
        e.stopPropagation();
        if (!isSystemStarted) {
            startAudioSystem();
            return;
        }
        if (audio.paused) {
            audio.play().then(() => updatePlayPauseUI(true)).catch(err => console.log(err));
        } else {
            audio.pause();
            updatePlayPauseUI(false);
        }
    });

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- REPRODUCTOR PRO: SISTEMA DE CONTROL UNIFICADO --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    const PlayerControl = {
        currentIndex: 0,
        isRepeat: false,
        isShuffle: false,

        init() {
            const btnRepeat  = document.querySelector('.fa-repeat')?.parentElement;
            const btnShuffle = document.querySelector('.fa-shuffle')?.parentElement;
            const btnPrev    = document.querySelector('#prev-track');
            const btnNext    = document.querySelector('#next-track');

            if (btnRepeat) {
                btnRepeat.onclick = (e) => {
                    e.stopPropagation();
                    this.isRepeat = !this.isRepeat;
                    audio.loop = this.isRepeat;
                    if (this.isRepeat) {
                        btnRepeat.classList.add('active-repeat');
                    } else {
                        btnRepeat.classList.remove('active-repeat');
                    }
                };
            }

            if (btnShuffle) {
                btnShuffle.onclick = (e) => {
                    e.stopPropagation();
                    this.isShuffle = !this.isShuffle;
                    if (this.isShuffle) {
                        btnShuffle.classList.add('active-shuffle');
                    } else {
                        btnShuffle.classList.remove('active-shuffle');
                    }
                    if (this.isShuffle && musicData.length > 0) this.playRandom();
                };
            }

            if (btnNext) {
                btnNext.onclick = (e) => {
                    e.stopPropagation();
                    if (!isLocalMode) return;
                    this.isShuffle ? this.playRandom() : this.changeTrack(this.currentIndex + 1);
                };
            }

            if (btnPrev) {
                btnPrev.onclick = (e) => {
                    e.stopPropagation();
                    if (!isLocalMode) return;
                    this.changeTrack(this.currentIndex - 1);
                };
            }

            audio.onended = () => {
                if (this.isRepeat) {
                    audio.currentTime = 0;
                    audio.play();
                } else if (this.isShuffle && musicData.length > 0) {
                    this.playRandom();
                } else if (isLocalMode) {
                    this.changeTrack(this.currentIndex + 1);
                }
            };
        },

        changeTrack(index) {
            if (!musicData || musicData.length === 0) return;

            if (index >= musicData.length) {
                this.currentIndex = 0;
            } else if (index < 0) {
                this.currentIndex = musicData.length - 1;
            } else {
                this.currentIndex = index;
            }

            const track = musicData[this.currentIndex];
            audio.src = track.enlace;
            audio.load();
            updateUI(track);

            if (isSystemStarted) {
                audio.play().then(() => {
                    updatePlayPauseUI(true);
                }).catch(e => console.log("Gesto requerido"));
            }
        },

        playRandom() {
            if (!musicData || musicData.length === 0) return;
            let rand;
            do { rand = Math.floor(Math.random() * musicData.length); } 
            while (rand === this.currentIndex && musicData.length > 1);
            this.changeTrack(rand);
        }
    };

    PlayerControl.init();

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- GESTIÓN DE LOS 3 BOTONES CLAVE (Radio, Home, Music) --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    const btnRadio = document.getElementById('btn-radio');
    const btnHome = document.getElementById('btn-home');
    const btnMusic = document.getElementById('btn-music');

    function clearAudioModeClasses() {
        if (btnRadio) btnRadio.classList.remove('active-radio');
        if (btnMusic) btnMusic.classList.remove('active-music');
    }

    if (btnRadio) {
        btnRadio.onclick = async (e) => {
            e.stopPropagation();
            console.log("Cambiando a Modo Radio (Streaming con Metadatos)");
            iniciarModoRadio();
            if ($('#dynamic-content-modal').is(':visible')) renderModalContent();
        };
    }

        // ═══════════════════════════════════════════════════════════════
        // LIMPIEZA ABSOLUTA DE ESTADOS
        // ═══════════════════════════════════════════════════════════════
            if (btnMusic) {
        btnMusic.onclick = async (e) => {
            e.stopPropagation();
            
            // 1. LIMPIEZA CORRECTA DE ESTADOS (Lógica y Visual)
            isLocalMode = true;
            clearAudioModeClasses();
            btnMusic.classList.add('active-music');
            
            // Detener procesos de radio
            detenerActualizacionRadio();
            
            // Resetear controles de reproducción a cero
            PlayerControl.currentIndex = 0;
            PlayerControl.isRepeat = false;
            PlayerControl.isShuffle = false;
            audio.loop = false;
            
            // Pausar audio físicamente y reiniciar tiempo
            audio.pause();
            audio.currentTime = 0;
            
            // Limpiar clases visuales de botones de control
            const btnRepeat = document.querySelector('.fa-repeat')?.parentElement;
            const btnShuffle = document.querySelector('.fa-shuffle')?.parentElement;
            if (btnRepeat) btnRepeat.classList.remove('active-repeat');
            if (btnShuffle) btnShuffle.classList.remove('active-shuffle');
            
            // Establecer UI en estado de transición neutro
            $('#track-name').text("Cargando Playlist...");
            $('#track-artist').text("Modo Local");
            $('#track-art').attr('src', "https://santi-graphics.vercel.app/assets/covers/Cover1.png");
            $('#progress').css('width', '0%');
            $('#play-pause-btn i').removeClass('fa-pause').addClass('fa-play');
            $('.visualizer span').css('animation-play-state', 'paused');

            console.log("🎵 Cambiando a Modo Local");

            // ═══════════════════════════════════════════════════════════════
            // 2. CARGA DE DATOS (Fetch original, sin headers que rompen Vercel)
            // ═══════════════════════════════════════════════════════════════
            try {
                // Fetch limpio y directo, como funcionaba originalmente
                const response = await fetch('https://radio-tekileros.vercel.app/Spotifly.json', {
                    cache: 'no-cache' // Suficiente para evitar caché agresivo sin romper CORS
                });
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                musicData = Array.isArray(data) ? data : (data ? Object.values(data).find(Array.isArray) : []) || [];

                if (musicData && musicData.length > 0) {
                    const firstTrack = musicData[0];
                    
                    audio.src = firstTrack.enlace;
                    audio.load();
                    updateUI(firstTrack);

                    if (isSystemStarted) {
                        audio.play().then(() => {
                            updatePlayPauseUI(true);
                        }).catch(err => {
                            console.log("Autoplay bloqueado por el navegador");
                            updatePlayPauseUI(false);
                        });
                    }
                } else {
                    $('#track-name').text("Lista vacía");
                    $('#track-artist').text("Sin datos disponibles");
                }
            } catch (error) {
                console.error("❌ Error al cargar Spotifly.json:", error);
                $('#track-name').text("Error de carga");
                $('#track-artist').text("Verifica tu red");
            }

            // 3. Actualizar modal si está abierto
            if ($('#dynamic-content-modal').is(':visible')) {
                renderModalContent();
            }
        };
    }
    
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- GESTIÓN DEL BOTÓN HOME: LA VERDAD ABSOLUTA ES EL DOM --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
        if (btnHome) {
        btnHome.onclick = (e) => {
            e.stopPropagation();
            
            // Verificamos el estado real basándonos en si el modal está visible en pantalla
            const isModalVisible = $('#dynamic-content-modal').is(':visible');

            // Sincronizamos la bandera con la realidad del DOM
            isHomeActive = !isModalVisible;

            if (isHomeActive) {
                btnHome.classList.add('active-home');
                openDynamicModal();
            } else {
                closeAllModals();
            }
        };
    }

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- RENDERIZADO DEL MODAL (PLAYLIST VS HISTORIAL RADIO) --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    function openDynamicModal() {
    renderModalContent();
    // .stop(true, true) hace que el fadeIn sea instantáneo si había una animación previa
    $('#dynamic-content-modal').stop(true, true).fadeIn(200, function() {
        if (window.history && window.history.pushState) {
            window.history.pushState({ modalOpen: true }, '', '');
        }
    });
}

    function renderModalContent() {
        const modalTitle = document.getElementById('modal-title');
        const trackListContainer = document.getElementById('modal-track-list');
        
        if (!modalTitle || !trackListContainer) return; // Protección contra errores silenciosos
        
        trackListContainer.innerHTML = '';

        if (!isLocalMode) {
            modalTitle.textContent = "Historial de Radio";
            if (radioHistory.length === 0) {
                trackListContainer.innerHTML = '<p class="modal-empty-msg">Esperando transmisión...</p>';
                return;
            }

            radioHistory.forEach((track, index) => {
                const item = document.createElement('div');
                item.className = 'modal-track-item';
                
                if (index === 0) {
                    item.classList.add('active-track');
                }

                item.innerHTML = `
                    <img src="${track.caratula || track.imagen || track.cover || liveRadioTrack.caratula}" alt="Cover">
                    <div class="modal-track-info">
                        <span class="modal-track-title">${track.nombre || track.title || 'AUTO DJ'}</span>
                        <span class="modal-track-artist">${track.artista || track.artist || 'Casino Digital'}</span>
                    </div>
                `;
                trackListContainer.appendChild(item);
            });

        } else {
            modalTitle.textContent = "Playlist Local";
            if (!musicData || musicData.length === 0) {
                trackListContainer.innerHTML = '<p class="modal-empty-msg">Cargando lista de reproducción...</p>';
                return;
            }

            musicData.forEach((track, index) => {
                const item = document.createElement('div');
                item.className = 'modal-track-item';

                if (index === PlayerControl.currentIndex) {
                    item.classList.add('active-track');
                }

                item.innerHTML = `
                    <img src="${track.caratula || track.imagen || track.cover || ''}" alt="Cover">
                    <div class="modal-track-info">
                        <span class="modal-track-title">${track.nombre || track.title || 'Desconocido'}</span>
                        <span class="modal-track-artist">${track.artista || track.artist || 'Desconocido'}</span>
                    </div>
                `;

                item.onclick = () => {
                    PlayerControl.changeTrack(index);
                    closeAllModals();
                };

                trackListContainer.appendChild(item);
            });
        }
    }
    
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- MÉTODOS DE SALIDA DEL MODAL (ESC, CLIC FUERA, BACK MOBILE) --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    $(document).keydown(function(e) {
        if (e.key === "Escape" && $('#dynamic-content-modal').is(':visible')) {
            closeAllModals();
            if (window.history.state && window.history.state.modalOpen) {
                window.history.back();
            }
        }
    });

    $('#dynamic-content-modal').click(function(e) {
        if ($(e.target).is('#dynamic-content-modal')) {
            closeAllModals();
            if (window.history.state && window.history.state.modalOpen) {
                window.history.back();
            }
        }
    });

    $(window).on('popstate', function(e) {
        if ($('#dynamic-content-modal').is(':visible')) {
            closeAllModals();
        }
    });

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- LÓGICA DE BARRA DE TIEMPO (PROGRESS BAR) --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    audio.ontimeupdate = function() {
        if (isLocalMode && audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            $('#progress').css('width', progress + '%');
        } else if (!isLocalMode) {
            $('#progress').css('width', '100%');
        }
    };

    $('#progress-container').click(function(e) {
        e.stopPropagation();
        if (!isLocalMode) return;

        const width = $(this).width();
        const clickX = e.pageX - $(this).offset().left;
        if (audio.duration) {
            audio.currentTime = (clickX / width) * audio.duration;
        }
    });
});

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/* --- FUNCIONES GLOBALES AUXILIARES --- */
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function closeAllModals() {
    isHomeActive = false;
    const btnHome = document.getElementById('btn-home');
    if (btnHome) {
        btnHome.classList.remove('active-home');
    }
    // .stop(true, true) fuerza al DOM a aplicar display: none inmediatamente
    $('#dynamic-content-modal').stop(true, true).fadeOut(200);
}

function openHome() {
    console.log("Navegando a Home...");
}

function openFriends() {
    console.log("Navegando a Friends...");
}