// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Repro61.JS - LÓGICA PRINCIPAL (CORREGIDA)
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

// Referencias de elementos
let audio, caratula, titulo, artista, album, radio, playBtn, btnPlay, btnPrev, btnNext, btnShuffle, btnMenu, btnFondo, btnHistorial, reproductor, contadorRadio, modalTracks, trackList, currentTrackNameModal;

// Función de vinculación robusta
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
    
    // Si no encuentra el reproductor principal, salimos para evitar errores
    if (!reproductor || !audio) return;

    // INYECCIÓN INMEDIATA DE ESTADO DE CARGA
    if (titulo) titulo.textContent = "Cargando...";
    if (artista) artista.textContent = "Casino Digital Radio";
    if (album) album.textContent = "Preparando señal...";
    if (contadorRadio) contadorRadio.textContent = "0";
    
    iniciarTodo();
}

// Escuchar tanto el evento personalizado como el DOMContentLoaded por seguridad
window.addEventListener("repro-ready", vincularElementos);
document.addEventListener("DOMContentLoaded", () => {
    if (!reproductor) vincularElementos();
});

function iniciarTodo() {
    // CARGA DE DATOS Y CONFIGURACIÓN
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
                audio.src = "https://technoplayerserver.net:8042/stream?icy=http";
                audio.load();
                gestionarCicloRadio(true);
                if (btnMenu) {
                    const imgMenu = btnMenu.querySelector('img');
                    if(imgMenu) imgMenu.style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 0, 0.8))';
                }
                bloquearBotonesLocal(true);
            } else {
                cargarTrack(currentTrack);
            }
        }).catch(err => console.error("Error cargando Spotifly.json:", err));

    // EVENTOS DE BOTONERA (Verificando que existan antes de asignar)
    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().then(() => { 
                    isPlaying = true; 
                    if(playBtn) playBtn.src = 'https://santi-graphics.vercel.app/assets/img/btn-pause.png'; 
                }).catch(e => console.log("Play bloqueado por navegador:", e));
            } else {
                audio.pause(); 
                isPlaying = false; 
                if(playBtn) playBtn.src = 'https://santi-graphics.vercel.app/assets/img/btn-play.png';
            }
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => { 
            if (modo === 'local' && playlist.length > 0) { 
                currentTrack = (currentTrack - 1 + playlist.length) % playlist.length; 
                cargarTrack(currentTrack); 
            } 
        });
    }

    // LÓGICA UNIFICADA Y LIMPIA PARA EL BOTÓN NEXT (FWD)
    if (btnNext) {
        btnNext.addEventListener('click', (e) => {
            e.preventDefault();
            if (modo === 'local' && playlist.length > 0) { 
                if (modoShuffle) {
                    let nextTrack;
                    do {
                        nextTrack = Math.floor(Math.random() * playlist.length);
                    } while (nextTrack === currentTrack && playlist.length > 1);
                    currentTrack = nextTrack;
                } else {
                    currentTrack = (currentTrack + 1) % playlist.length;
                }
                cargarTrack(currentTrack);
            }
        });
    }

    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            const imgMenu = btnMenu.querySelector('img');
            if (modo === 'local') {
                modo = 'radio';
                if (titulo) titulo.textContent = "Sintonizando...";
                if (artista) artista.textContent = "Casino Digital";
                if (album) album.textContent = "Streaming AutoDJ";
                if (radio) radio.textContent = "Radio Online";
                if (caratula) caratula.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
                
                if(imgMenu) imgMenu.style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 0, 0.8))';
                bloquearBotonesLocal(true);
                audio.src = "https://technoplayerserver.net:8042/stream?icy=http";
                audio.play().then(() => { 
                    isPlaying = true; 
                    if(playBtn) playBtn.src = 'https://santi-graphics.vercel.app/assets/img/btn-pause.png'; 
                }).catch(e => {});
                gestionarCicloRadio(true);
            } else {
                modo = 'local';
                if (titulo) titulo.textContent = "Cargando biblioteca...";
                
                if(imgMenu) imgMenu.style.filter = 'drop-shadow(0 0 6px rgba(186, 0, 255, 0.8))';
                bloquearBotonesLocal(false);
                gestionarCicloRadio(false);
                cargarTrack(currentTrack);
            }
        });
    }

    // LÓGICA DEL BOTÓN SHUFFLE
    if (btnShuffle) {
        btnShuffle.addEventListener('click', () => {
            if (modo !== 'local') return;
            modoShuffle = !modoShuffle;
            if (modoShuffle) {
                btnShuffle.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.9))';
                let randomIndex;
                do {
                    randomIndex = Math.floor(Math.random() * playlist.length);
                } while (randomIndex === currentTrack && playlist.length > 1);
                currentTrack = randomIndex;
                cargarTrack(currentTrack);
            } else {
                btnShuffle.style.filter = 'none';
            }
        });
    }

    // LÓGICA DEL BOTÓN FONDO (MODO TRANSPARENTE)
    if (btnFondo) {
        btnFondo.addEventListener('click', () => {
            reproductor.classList.toggle('fondo-activo');
            const imgFondo = btnFondo.querySelector('img');
            if (reproductor.classList.contains('fondo-activo')) {
                if(imgFondo) imgFondo.style.filter = 'drop-shadow(0 0 12px rgba(255, 255, 255, 1))';
            } else {
                if(imgFondo) imgFondo.style.filter = 'drop-shadow(0 0 6px rgba(186, 0, 255, 0.8))';
            }
        });
    }

    // VOLUMEN
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

    // MODAL Y CIERRE
    if (btnHistorial) btnHistorial.onclick = (e) => { e.stopPropagation(); toggleModal(true); };
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) closeModalBtn.onclick = () => toggleModal(false);
    window.onclick = (e) => { if (e.target === modalTracks) toggleModal(false); };

    // MINI EQ CANVAS
    const canvas = document.getElementById('miniEQ');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        setInterval(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < 5; i++) {
                const h = isPlaying ? Math.random() * canvas.height : 2;
                ctx.fillStyle = 'white'; ctx.fillRect(i * 4, canvas.height - h, 2, h);
            }
        }, 100);
    }
}

// FUNCIONES DE APOYO
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
    const urlStats = `https://technoplayerserver.net:8042/stats?json=1&sid=1&t=${Date.now()}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlStats)}`;

    try {
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        const data = JSON.parse(proxyData.contents);

        if (contadorRadio) {
            contadorRadio.textContent = data.currentlisteners || "0";
        }

        const rawTitle = data.songtitle || "";
        if (rawTitle === ultimaPistaStreaming && rawTitle !== "") return; 
        
        ultimaPistaStreaming = rawTitle;
        let { artista: fArtist, titulo: fTitle } = limpiarMetadatosRadio(rawTitle);

        if (titulo) titulo.textContent = fTitle;
        if (artista) artista.textContent = fArtist;
        if (radio) radio.textContent = "Casino Digital"; 

        registrarEnHistorial(fArtist, fTitle);
        buscarCaratulaReal(fArtist, fTitle);
        
        activarScroll('.titulo-container');
        activarScroll('.artista-container');
    } catch (e) { 
        console.error("Error Metadatos:", e);
    }
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
    if (!caratula) return;
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
    if (caratula) caratula.src = track.cover || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';
    if (radio) radio.textContent = "Spotifly"; 
    if (titulo) titulo.textContent = track.name;
    if (artista) artista.textContent = track.artist;
    if (album) album.textContent = track.album;
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

function toggleModal(s) { 
    if(!modalTracks) return;
    s ? modalTracks.classList.remove('hidden') : modalTracks.classList.add('hidden'); 
    if(s) generarListaModal(); 
}

function activarScroll(s) {
    const c = document.querySelector(s); if (!c) return;
    const t = c.querySelector('span'); if (!t) return;
    t.style.animation = 'none';
    setTimeout(() => { if (t.scrollWidth > c.offsetWidth) t.style.animation = 'scroll-left 8s linear infinite'; }, 50);
}

// Bloqueo de Context Menu y Mensaje
document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const msg = document.getElementById("custom-message");
    if(msg) {
        msg.classList.add("show");
        setTimeout(() => msg.classList.remove("show"), 2000);
    }
});