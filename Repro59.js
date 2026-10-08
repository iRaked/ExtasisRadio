/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- MOTOR DE AUDIO: DESBLOQUEO UNIVERSAL & GESTIÓN DE JSON --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

    const audio = document.getElementById('main-audio');
    const playBtn = document.querySelector('.btn-play-hub');
    const vinyl = document.querySelector('.vinyl-mega-img');
    let musicData = [];
    let isSystemStarted = false;

    // Datos estáticos para cuando esté en modo Radio en vivo
    const liveRadioTrack = {
        nombre: "AUTO DJ",
        artista: "Casino Digital",
        caratula: "https://santi-graphics.vercel.app/assets/covers/Cover1.png",
        duracion: "LIVE",
        enlace: "http://technoplayerserver.net:8240/stream"
    };

    // 1. FUNCIÓN DE ACTUALIZACIÓN DE INTERFAZ
    function updateUI(track) {
        if (!track) return;
        document.querySelector('.meta-thumb-lg').src = track.caratula;
        document.querySelector('.artist-txt').innerText = track.artista;
        document.querySelector('.title-txt').innerText = track.nombre;
        document.querySelector('.bar-anchor-txt').innerText = track.duracion;
    }

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    // 2. FUNCIÓN MAESTRA DE INICIO (Universal - Arranca con Radio en Vivo)
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    async function startAudioSystem() {
        if (isSystemStarted) return;

        try {
            audio.src = liveRadioTrack.enlace;
            audio.load();
            updateUI(liveRadioTrack);

            if (timeBarTxt) {
                timeBarTxt.innerText = "LIVE";
                timeBarTxt.classList.add('live-anim');
            }
            
            // ACTIVAR MODO LIVE EN LA BARRA Y LIBERAR ESTILO EN LÍNEA
            const timeBarContainer = document.querySelector('.time-bar');
            if (timeBarContainer) timeBarContainer.classList.add('live-mode');
            if (timeBarFill) timeBarFill.style.height = ''; 

            await audio.play();

            isSystemStarted = true;
            playBtn.querySelector('i').className = 'fa-solid fa-pause';
            if (vinyl) vinyl.classList.add('spinning');

            console.log("Sistema de audio iniciado con Stream de Radio.");

            window.removeEventListener('click', startAudioSystem);
            window.removeEventListener('touchstart', startAudioSystem);
        } catch (error) {
            console.error("Error al iniciar el audio:", error);
        }
    }

    // 3. LISTENERS GLOBALES PARA EL PRIMER GESTO
    window.addEventListener('click', startAudioSystem);
    window.addEventListener('touchstart', startAudioSystem);

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    // BOTONERA PRINCIPAL (PLAY / PAUSE)
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        if (!isSystemStarted) {
            startAudioSystem();
            return;
        }

        if (audio.paused) {
            audio.play();
            playBtn.querySelector('i').className = 'fa-solid fa-pause';
            if (vinyl) vinyl.classList.add('spinning');
        } else {
            audio.pause();
            playBtn.querySelector('i').className = 'fa-solid fa-play';
            if (vinyl) vinyl.classList.remove('spinning');
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
            const btnRepeat  = document.querySelector('.fa-repeat').parentElement;
            const btnShuffle = document.querySelector('.fa-shuffle').parentElement;
            const btnPrev    = document.querySelector('.fa-backward-step').parentElement;
            const btnNext    = document.querySelector('.fa-forward-step').parentElement;

            btnRepeat.onclick = (e) => {
                e.stopPropagation();
                this.isRepeat = !this.isRepeat;
                audio.loop = this.isRepeat;
                btnRepeat.style.color = this.isRepeat ? 'var(--neon-lila)' : 'white';
                btnRepeat.style.filter = this.isRepeat ? 'drop-shadow(0 0 8px var(--neon-lila))' : 'none';
            };

            btnShuffle.onclick = (e) => {
                e.stopPropagation();
                this.isShuffle = !this.isShuffle;
                btnShuffle.style.color = this.isShuffle ? 'var(--neon-lila)' : 'white';
                btnShuffle.style.filter = this.isShuffle ? 'drop-shadow(0 0 8px var(--neon-lila))' : 'none';
                if (this.isShuffle) this.playRandom();
            };

            btnNext.onclick = (e) => {
                e.stopPropagation();
                this.isShuffle ? this.playRandom() : this.changeTrack(this.currentIndex + 1);
            };

            btnPrev.onclick = (e) => {
                e.stopPropagation();
                this.changeTrack(this.currentIndex - 1);
            };

            audio.onended = () => {
                if (this.isRepeat) {
                    audio.currentTime = 0;
                    audio.play();
                } else if (this.isShuffle) {
                    this.playRandom();
                } else {
                    this.changeTrack(this.currentIndex + 1);
                }
            };
        },

        changeTrack(index) {
            if (!musicData || musicData.length === 0) return;

            if (index >= musicData.length) {
                this.stopPlayer();
                return;
            }

            if (index < 0) index = musicData.length - 1;

            this.currentIndex = index;
            const track = musicData[this.currentIndex];

            audio.src = track.enlace;
            audio.load();
            updateUI(track);

            if (isSystemStarted) {
                audio.play().then(() => {
                    playBtn.querySelector('i').className = 'fa-solid fa-pause';
                    if (vinyl) vinyl.classList.add('spinning');
                }).catch(e => console.log("Gesto requerido"));
            }
        },

        playRandom() {
            let rand;
            do { rand = Math.floor(Math.random() * musicData.length); } 
            while (rand === this.currentIndex && musicData.length > 1);
            this.changeTrack(rand);
        },

        stopPlayer() {
            console.log("Playlist terminada.");
            audio.pause();
            audio.currentTime = 0;
            playBtn.querySelector('i').className = 'fa-solid fa-play';
            if (vinyl) vinyl.classList.remove('spinning');
        }
    };

    PlayerControl.init();

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- ALTERNANCIA STREAMING (RADIO) / LOCAL (JSON) --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    const btnModeTop = document.querySelector('.btn-mode-top');
    const timeBarContainer = document.querySelector('.time-bar');
    let isLocalMode = false;

    btnModeTop.onclick = async (e) => {
        e.stopPropagation();
        isLocalMode = !isLocalMode;

        btnModeTop.classList.toggle('active', isLocalMode);
        btnModeTop.style.color = isLocalMode ? 'var(--neon-lila)' : 'rgba(255, 255, 255, 0.7)';
        btnModeTop.style.filter = isLocalMode ? 'drop-shadow(0 0 8px var(--neon-lila))' : 'none';

        if (!isLocalMode) {
            // MODO RADIO EN VIVO
            console.log("Cambiando a Modo Radio (Streaming)");
            audio.src = liveRadioTrack.enlace;
            audio.load();
            updateUI(liveRadioTrack);
            
            // Activar texto y animación de ondas LIVE, liberando el inline style de la barra
            if (timeBarTxt) {
                timeBarTxt.innerText = "LIVE";
                timeBarTxt.classList.add('live-anim');
            }
            if (timeBarContainer) timeBarContainer.classList.add('live-mode');
            if (timeBarFill) timeBarFill.style.height = ''; 

            if (isSystemStarted) {
                audio.play().then(() => {
                    playBtn.querySelector('i').className = 'fa-solid fa-pause';
                    if (vinyl) vinyl.classList.add('spinning');
                }).catch(err => console.log("Interacción requerida"));
            }
        } else {
            // MODO LOCAL (VERCEL JSON)
            console.log("Cambiando a Modo Local (JSON Vercel)");
            
            // Desactivar animación de ondas LIVE y modo live en barra
            if (timeBarTxt) {
                timeBarTxt.classList.remove('live-anim');
            }
            if (timeBarContainer) timeBarContainer.classList.remove('live-mode');
            if (timeBarFill) timeBarFill.style.height = '0%';

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
                            playBtn.querySelector('i').className = 'fa-solid fa-pause';
                            if (vinyl) vinyl.classList.add('spinning');
                        }).catch(err => console.log("Interacción requerida"));
                    }
                }
            } catch (error) {
                console.error("Error al cargar el JSON local:", error);
            }
        }
    };

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- LÓGICA DE VOLUMEN --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    const volContainer = document.querySelector('.side-bar-fixed.volume-bar') || document.querySelector('.side-bar-fixed:not(.time-bar)');
    const volFill = volContainer.querySelector('.bar-fill');
    const volIcon = volContainer.querySelector('.bar-anchor-icon');

    const updateVol = (e) => {
        const rect = volContainer.getBoundingClientRect();
        const totalHeight = rect.height;
        let pos = rect.bottom - e.clientY;
        let percentage = (pos / totalHeight) * 100;

        percentage = Math.max(0, Math.min(100, percentage));
        const finalVolume = percentage / 100;
        audio.volume = finalVolume;
        volFill.style.height = `${percentage}%`;

        if (volIcon) {
            if (finalVolume === 0) volIcon.className = 'fa-solid fa-volume-xmark bar-anchor-icon';
            else if (finalVolume < 0.5) volIcon.className = 'fa-solid fa-volume-low bar-anchor-icon';
            else volIcon.className = 'fa-solid fa-volume-high bar-anchor-icon';
        }
    };

    volContainer.onmousedown = (e) => {
        updateVol(e);
        const move = (ev) => updateVol(ev);
        const stop = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', stop);
        };
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', stop);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', stop);
    };

    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    /* --- LÓGICA DE BARRA DE TIEMPO (PROGRESS BAR) --- */
    /*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
    const timeBarFill = document.querySelector('.time-bar .bar-fill');
    const timeBarTxt  = document.querySelector('.time-bar .bar-anchor-txt');

    audio.addEventListener('timeupdate', () => {
        // Si estamos en modo radio en vivo, ignoramos el progreso normal de duración
        if (!isLocalMode) return;

        if (audio.duration) {
            const percentage = (audio.currentTime / audio.duration) * 100;
            timeBarFill.style.height = `${percentage}%`;
            timeBarTxt.innerText = formatTime(audio.currentTime);
        }
    });

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    timeBarContainer.onclick = (e) => {
        e.stopPropagation();
        if (!isLocalMode) return; // No permitir scrubbing en directo

        const rect = timeBarContainer.getBoundingClientRect();
        const totalHeight = rect.height;
        let pos = rect.bottom - e.clientY;
        let percentage = pos / totalHeight;

        if (audio.duration) {
            audio.currentTime = audio.duration * percentage;
        }
    };