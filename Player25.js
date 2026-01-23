// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 PLAYER25.JS - LÓGICA PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentTrack = 0;
let isPlaying = false;
let playlist = [];
let emisora = 'Casino Digital';
let modo = 'radio'; 
let modoShuffle = false; 
let radioIntervalId = null;
let trackHistory = []; 
let ultimaPistaStreaming = "";

// Referencias de elementos (se asignan en vincularElementos)
let audio, caratula, titulo, artista, album, radio, playBtn, btnPlay, btnPrev, btnNext, btnShuffle, btnMenu, btnFondo, btnHistorial, reproductor, contadorRadio, modalTracks, trackList, currentTrackNameModal;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MUDANZA Y VINCULACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function vincularElementos() {
    audio = document.getElementById('player');
    caratula = document.querySelector('.caratula img');
    titulo = document.querySelector('.titulo');
    artista = document.querySelector('.artista');
    album = document.querySelector('.album');
    radio = document.querySelector('.radio');
    playBtn = document.querySelector('.play img');
    btnPlay = document.querySelector('.play');
    btnPrev = document.querySelector('.prev');
    btnNext = document.querySelector('.next');
    btnShuffle = document.querySelector('.shuffle');
    btnMenu = document.querySelector('.menu');
    btnFondo = document.querySelector('.fondo'); 
    btnHistorial = document.querySelector('.historial');
    reproductor = document.getElementById('Repro');
    contadorRadio = document.getElementById("contadorRadio");
    modalTracks = document.getElementById('modalTracks');
    trackList = document.getElementById('trackList');
    currentTrackNameModal = document.getElementById('currentTrackNameModal');
    
    iniciarTodo(); 
}

// Escuchar la señal de Repro25.js para comenzar
window.addEventListener("repro-ready", vincularElementos);

function iniciarTodo() {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CARGA DE DATOS Y CONFIGURACIÓN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    fetch('https://radio-tekileros.vercel.app/Spotifly.json')
        .then(res => res.json())
        .then(data => {
            playlist = data.spotifly.map(p => ({
                cover: p.caratula,
                url: p.enlace,
                artist: p.artista,
                name: p.nombre,
                album: p.album || 'Álbum desconocido'
            }));

            if (modo === 'radio') {
                audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
                audio.load();
                gestionarCicloRadio(true);
                if (btnMenu) btnMenu.querySelector('img').style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 0, 0.8))';
                bloquearBotonesLocal(true);
            } else {
                cargarTrack(currentTrack);
            }
        });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // EVENTOS DE BOTONERA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    btnPlay.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => { 
                isPlaying = true; 
                playBtn.src = 'https://santi-graphics.vercel.app/assets/img/btn-pause.png'; 
            });
        } else {
            audio.pause(); 
            isPlaying = false; 
            playBtn.src = 'https://santi-graphics.vercel.app/assets/img/btn-play.png';
        }
    });

    btnPrev.addEventListener('click', () => { 
        if (modo === 'local') { 
            currentTrack = (currentTrack - 1 + playlist.length) % playlist.length; 
            cargarTrack(currentTrack); 
        } 
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LÓGICA CORREGIDA: BOTÓN NEXT (FWD)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (btnNext) {
        // Eliminamos cualquier listener previo para evitar duplicidad
        btnNext.onclick = null; 

        btnNext.addEventListener('click', (e) => {
            // Evitamos que el evento se propague o se ejecute dos veces
            e.preventDefault();
            e.stopImmediatePropagation();

            if (modo === 'local' && playlist.length > 0) {
                if (modoShuffle) {
                    // Modo Aleatorio: elige una al azar distinta a la actual
                    let nextTrack;
                    do {
                        nextTrack = Math.floor(Math.random() * playlist.length);
                    } while (nextTrack === currentTrack && playlist.length > 1);
                    currentTrack = nextTrack;
                } else {
                    // Modo Normal: Avance estricto de 1 en 1
                    currentTrack = (currentTrack + 1) % playlist.length;
                }

                console.log("Cargando track index:", currentTrack);
                cargarTrack(currentTrack);
            }
        });
    }

    btnMenu.addEventListener('click', () => {
        if (modo === 'local') {
            modo = 'radio';
            btnMenu.querySelector('img').style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 0, 0.8))';
            bloquearBotonesLocal(true);
            audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
            audio.play().then(() => { isPlaying = true; playBtn.src = 'https://santi-graphics.vercel.app/assets/img/btn-pause.png'; });
            gestionarCicloRadio(true);
        } else {
            modo = 'local';
            btnMenu.querySelector('img').style.filter = 'drop-shadow(0 0 6px rgba(186, 0, 255, 0.8))';
            bloquearBotonesLocal(false);
            gestionarCicloRadio(false);
            cargarTrack(currentTrack);
        }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LÓGICA DEL BOTÓN SHUFFLE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    btnShuffle.addEventListener('click', () => {
        if (modo !== 'local') return; // El shuffle solo funciona en modo local

        modoShuffle = !modoShuffle; // Alternar estado

        if (modoShuffle) {
            // Efecto visual: Resaltar botón cuando está activo
            btnShuffle.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))';
            btnShuffle.style.opacity = '1';

            // Elegir pista aleatoria inmediatamente
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * playlist.length);
            } while (randomIndex === currentTrack && playlist.length > 1);

            currentTrack = randomIndex;
            cargarTrack(currentTrack);
            console.log("Shuffle Activado: Pista aleatoria cargada.");
        } else {
            // Volver al estado normal
            btnShuffle.style.filter = 'none';
            btnShuffle.style.opacity = '1';
            console.log("Shuffle Desactivado.");
        }
    });

    // Modificación en btnNext para que respete el shuffle si está activo
    btnNext.addEventListener('click', () => { 
        if (modo === 'local') { 
            if (modoShuffle) {
                currentTrack = Math.floor(Math.random() * playlist.length);
            } else {
                currentTrack = (currentTrack + 1) % playlist.length;
            }
            cargarTrack(currentTrack); 
        } 
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LÓGICA DEL BOTÓN FONDO (MODO TRANSPARENTE)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (btnFondo) {
        btnFondo.addEventListener('click', () => {
            // Alternar la clase en el contenedor principal
            reproductor.classList.toggle('fondo-activo');

            // Feedback Visual: Si está activo, el botón brilla en blanco; si no, vuelve al púrpura
            const imgFondo = btnFondo.querySelector('img');
            if (reproductor.classList.contains('fondo-activo')) {
                imgFondo.style.filter = 'drop-shadow(0 0 12px rgba(255, 255, 255, 1))';
                console.log("Modo Transparente: Activado");
            } else {
                imgFondo.style.filter = 'drop-shadow(0 0 6px rgba(186, 0, 255, 0.8))';
                console.log("Modo Transparente: Desactivado");
            }
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VOLUMEN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const slider = document.getElementById('volumenSlider');
    const bMenos = document.querySelector('.volumen-control:first-of-type');
    const bMas = document.querySelector('.volumen-control:last-of-type');

    if (slider) {
        slider.addEventListener('input', () => {
            const val = slider.value;
            audio.volume = val / 100;
            slider.style.background = `linear-gradient(to right, white ${val}%, transparent ${val}%)`;
        });
        if (bMenos) bMenos.onclick = () => { slider.value = Math.max(0, parseInt(slider.value) - 10); slider.dispatchEvent(new Event('input')); };
        if (bMas) bMas.onclick = () => { slider.value = Math.min(100, parseInt(slider.value) + 10); slider.dispatchEvent(new Event('input')); };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODAL Y CIERRE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    btnHistorial.onclick = (e) => { e.stopPropagation(); toggleModal(true); };
    document.querySelector('.close-modal').onclick = () => toggleModal(false);
    window.onclick = (e) => { if (e.target === modalTracks) toggleModal(false); };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MINI EQ CANVAS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const canvas = document.getElementById('miniEQ'), ctx = canvas.getContext('2d');
    setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < 5; i++) {
            const h = isPlaying ? Math.random() * canvas.height : 2;
            ctx.fillStyle = 'white'; ctx.fillRect(i * 4, canvas.height - h, 2, h);
        }
    }, 100);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCIONES DE APOYO (FUERA DE INICIARTODO)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function desbloqueoAutoplay() {
    if (audio && audio.muted) audio.muted = false;
    if (audio && audio.paused && audio.src) {
        audio.play().then(() => {
            isPlaying = true;
            if(playBtn) playBtn.src = 'https://santi-graphics.vercel.app/assets/img/btn-pause.png';
        }).catch(() => {});
    }
}

['click', 'touchstart', 'keydown'].forEach(evento => {
    window.addEventListener(evento, desbloqueoAutoplay, { once: true });
});

async function actualizarMetadatosStreaming() {
    if (modo !== 'radio') return;
    const urlStats = `https://technoplayerserver.net:8018/stats?json=1&sid=1&t=${Date.now()}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlStats)}`;

    try {
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        const data = JSON.parse(proxyData.contents);
        const rawTitle = data.songtitle || "";
        
        if (rawTitle === ultimaPistaStreaming && rawTitle !== "") {
            if (contadorRadio) contadorRadio.textContent = data.currentlisteners || 0;
            return; 
        }
        ultimaPistaStreaming = rawTitle;

        let { artista: fArtist, titulo: fTitle } = limpiarMetadatosRadio(rawTitle);

        if (contadorRadio) contadorRadio.textContent = data.currentlisteners || 0;
        if (titulo) titulo.textContent = fTitle;
        if (artista) artista.textContent = fArtist;
        if (radio) radio.textContent = "Casino Digital"; 
        if (album) album.textContent = "Streaming AutoDJ";

        registrarEnHistorial(fArtist, fTitle);
        buscarCaratulaReal(fArtist, fTitle);
        activarScroll('.titulo-container');
        activarScroll('.artista-container');
    } catch (e) { console.error("Error Metadatos:", e); }
}

function limpiarMetadatosRadio(texto) {
    if (!texto || texto.includes("Stream") || texto.includes("Unknown")) {
        return { artista: "Casino Digital", titulo: "Siente la música" };
    }
    let limpio = texto.replace(/WWW\..*\..*|http:\/\/.*|\[.*\]|<.*>|128kbps|64kbps|mp3/gi, "").trim();
    const separadores = [" - ", " – ", " — ", " / "];
    let art = "Casino Digital", tit = limpio;
    for (const sep of separadores) {
        if (limpio.includes(sep)) {
            const parts = limpio.split(sep);
            art = parts[0].trim();
            tit = parts.slice(1).join(sep).trim();
            break;
        }
    }
    return { artista: art, titulo: tit };
}

async function buscarCaratulaReal(artistaQuery, tituloQuery) {
    if (artistaQuery === "Casino Digital") {
        caratula.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        return;
    }
    const termino = `${artistaQuery} ${tituloQuery}`.toLowerCase().replace(/\(.*\)/g, "");
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(termino)}&media=music&limit=1`;
    try {
        const res = await fetch(itunesUrl);
        const json = await res.json();
        if (json.results && json.results.length > 0) {
            caratula.src = json.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
        } else {
            caratula.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        }
    } catch (e) { caratula.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png"; }
}

function gestionarCicloRadio(activar) {
    if (radioIntervalId) clearInterval(radioIntervalId);
    if (activar) {
        ultimaPistaStreaming = "";
        actualizarMetadatosStreaming();
        radioIntervalId = setInterval(actualizarMetadatosStreaming, 8000);
    }
}

function cargarTrack(index) {
    if (modo !== 'local' || !playlist[index]) return;
    const track = playlist[index];
    audio.src = track.url;
    caratula.src = track.cover || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';
    radio.textContent = "Spotifly"; 
    titulo.textContent = track.name;
    artista.textContent = track.artist;
    album.textContent = track.album;
    activarScroll('.titulo-container');
    activarScroll('.artista-container');
    if (isPlaying) audio.play().catch(() => {});
}

function bloquearBotonesLocal(bloquear) {
    const estado = bloquear ? '0.4' : '1';
    [btnPrev, btnNext, btnShuffle].forEach(btn => {
        if(btn) {
            btn.disabled = bloquear;
            btn.style.opacity = estado;
            btn.style.cursor = bloquear ? 'not-allowed' : 'pointer';
        }
    });
}

function registrarEnHistorial(artista, titulo) {
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ":" + ahora.getMinutes().toString().padStart(2, '0');
    if (trackHistory.length > 0 && trackHistory[0].title === titulo) return;
    trackHistory.unshift({ time: hora, artist: artista, title: titulo }); 
    if (trackHistory.length > 20) trackHistory.pop();
}

function generarListaModal() {
    if (!trackList) return;
    trackList.innerHTML = ''; 
    if (modo === 'radio') {
        currentTrackNameModal.textContent = "Historial Casino Digital";
        trackHistory.forEach(track => {
            const li = document.createElement('li');
            li.textContent = `${track.time} | ${track.artist} - ${track.title}`;
            trackList.appendChild(li);
        });
    } else {
        currentTrackNameModal.textContent = "Lista de Pistas Locales";
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="track-name">${index + 1}. ${track.name}</span> <span class="track-artist">- ${track.artist}</span>`;
            if (index === currentTrack) li.classList.add('active-track');
            li.onclick = () => { currentTrack = index; cargarTrack(currentTrack); toggleModal(false); };
            trackList.appendChild(li);
        });
    }
}

function toggleModal(s) { s ? modalTracks.classList.remove('hidden') : modalTracks.classList.add('hidden'); if(s) generarListaModal(); }

function activarScroll(s) {
    const c = document.querySelector(s); if (!c) return;
    const t = c.querySelector('span'); if (!t) return;
    t.style.animation = 'none';
    setTimeout(() => { if (t.scrollWidth > c.offsetWidth) t.style.animation = 'scroll-left 8s linear infinite'; }, 50);
}

// =================================
// Bloqueo de Context Menu y Mensaje
// =================================
document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const msg = document.getElementById("custom-message");
    if(msg) {
        msg.classList.add("show");
        setTimeout(() => msg.classList.remove("show"), 2000);
    }
});