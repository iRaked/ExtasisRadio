// ======== ESTADO GLOBAL ========
let currentTrack = 0;
let isPlaying = false;
let modo = 'streaming'; 
let playlist = [];
let trackData = [];
let emisora = 'Casino Digital Radio';
let repeatTrack = false; 
let shuffleMode = false;

// Variables para el control de intervalos (Limpieza robusta)
let timerInterval = null; 
let radioIntervalId = null;
let lastTrackTitle = '';
let trackHistory = []; 
let gestureDetected = false;

const audio = document.getElementById('audioStreaming');
const btnPlay = document.querySelector('.btn-play');
const btnOnline = document.querySelector('.btn-online');
const playIcon = btnPlay.querySelector('i');
const metaText = document.querySelector('.meta-text');
const coverImg = document.querySelector('.cover-img'); 
const displayTiempo = document.getElementById('timeDisplay');
const labelTiempo = document.querySelector('.status-block:first-child');

const DEFAULT_COVER = 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';
const LISTA_NEGRA = ["Casino Digital", "Siente la música", "Unknown", "Offline", "Autodj", "Streaming", "Santi Graphics", "Transmisión en vivo", "SANTI MIX DJ"];

audio.muted = false;
audio.autoplay = false;
audio.volume = 0.7;

// ======== HELPERS ========
function formatArtist(artist) {
    if (!artist) return '';
    return artist.toLowerCase().trim().split(/ [(&]/)[0].split(' feat')[0].split(' ft.')[0];
}

function formatTitle(title) {
    if (!title) return '';
    return title.toLowerCase().trim().replace('&', 'and').split(/ [(&]/)[0].split(' ft')[0];
}

function aplicarMarquesina(element) {
    if (!element) return;
    const content = element.querySelector('.track-content') || element; 
    content.classList.remove('marquee');
    if (content.scrollWidth > element.clientWidth + 2) {
        content.classList.add('marquee');
    }
}

function actualizarCaratula(url) {
    if (!coverImg) return;
    coverImg.src = (url && url.trim() !== '') ? url : DEFAULT_COVER;
}

// ======== LÓGICA DE TIEMPO (RELOJ VS TRACK) ========
function gestionarTiempo() {
    clearInterval(timerInterval);
    
    if (modo === 'streaming') {
        if (labelTiempo) labelTiempo.textContent = 'HORA LOCAL';
        const actualizarReloj = () => {
            const ahora = new Date();
            const h = String(ahora.getHours()).padStart(2, '0');
            const m = String(ahora.getMinutes()).padStart(2, '0');
            const s = String(ahora.getSeconds()).padStart(2, '0');
            if (displayTiempo) displayTiempo.textContent = `${h}:${m}:${s}`;
        };
        actualizarReloj();
        timerInterval = setInterval(actualizarReloj, 1000);
    } else {
        if (labelTiempo) labelTiempo.textContent = 'TIME TRACK';
        timerInterval = setInterval(() => {
            if (!audio.paused) {
                const current = audio.currentTime;
                const mins = String(Math.floor(current / 60)).padStart(2, '0');
                const secs = String(Math.floor(current % 60)).padStart(2, '0');
                if (displayTiempo) displayTiempo.textContent = `${mins}:${secs}`;
            }
        }, 1000);
    }
}

// ======== GESTIÓN DE HISTORIAL ========
function guardarEnHistorial(artist, title, cover = DEFAULT_COVER) {
    const artistClean = artist.trim();
    const titleClean = title.trim();
    const fullSearch = `${artistClean} ${titleClean}`.toLowerCase();

    if (LISTA_NEGRA.some(p => fullSearch.includes(p.toLowerCase())) || artistClean === emisora || !titleClean) return;
    if (trackHistory.length > 0 && trackHistory[0].title === titleClean) return;

    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    trackHistory.unshift({ artist: artistClean, title: titleClean, time, cover: cover });
    
    if (modo === 'streaming') renderPanelDerechoStreaming({ titulo: titleClean, artista: artistClean });
}

// ======== RADIO POLLING ========
function iniciarActualizacionRadio() {
    if (radioIntervalId) clearInterval(radioIntervalId);
    const radioUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";

    const actualizarServidor = () => {
        if (modo !== 'streaming') return;
        $.ajax({
            dataType: 'jsonp',
            url: radioUrl,
            success: function(data) {
                const cleaned = data.songtitle.trim().replace(/SANTI MIX DJ/gi, '').replace(/\|\s*$/g, '').trim();
                if (!cleaned || cleaned === lastTrackTitle || cleaned.toLowerCase().includes('offline')) return;
                
                lastTrackTitle = cleaned;
                const split = cleaned.split(/ - | – /);
                let artista = split.length >= 2 ? split[0].trim() : emisora;
                let titulo = split.length >= 2 ? split.slice(1).join(' - ').trim() : cleaned;

                metaText.textContent = `${artista} - ${titulo}`;
                aplicarMarquesina(metaText.parentElement);
                guardarEnHistorial(artista, titulo, DEFAULT_COVER);
                obtenerCaratulaDesdeiTunes(artista, titulo);
            },
            timeout: 8000
        });
    };
    actualizarServidor();
    radioIntervalId = setInterval(actualizarServidor, 12000);
}

function obtenerCaratulaDesdeiTunes(artist, title) {
    const query = encodeURIComponent(`${formatArtist(artist)} ${formatTitle(title)}`.trim());
    $.ajax({
        dataType: 'jsonp',
        url: `https://itunes.apple.com/search?term=${query}&media=music&limit=1`,
        success: function (data) {
            let cover = DEFAULT_COVER;
            if (data?.results?.length > 0) {
                cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
            }
            actualizarCaratula(cover);
            if (trackHistory.length > 0 && trackHistory[0].title === title.trim()) {
                trackHistory[0].cover = cover;
                renderPanelDerechoStreaming({ titulo: title, artista: artist });
            }
        }
    });
}

// ======== RENDERS ========
function cargarTrack(index) {
    const track = playlist[index];
    if (!track) return;
    actualizarCaratula(track.caratula);
    audio.src = track.enlace;
    metaText.textContent = `${track.artista} - ${track.nombre}`;
    aplicarMarquesina(metaText.parentElement);
    audio.load();
    if (gestureDetected) {
        audio.play().then(() => {
            isPlaying = true;
            playIcon.className = 'fas fa-pause';
        });
    }
}

function renderPanelDerechoLocal() {
    const panel = document.querySelector('.panel-right');
    if (!panel || modo !== 'local') return;

    panel.innerHTML = '';
    playlist.forEach((track, index) => {
        const isCurrent = index === currentTrack;
        const bloque = document.createElement('div');
        
        // Si es el actual, le clavamos la clase 'active' para el parpadeo
        bloque.className = `track-block ${isCurrent ? 'active' : ''}`;
        bloque.id = `track-${index}`; // ID para poder localizarlo
        
        bloque.innerHTML = `
            <div class="track-cover"><img src="${track.caratula}" /></div>
            <div class="track-meta">
                <div class="track-title">${track.nombre}</div>
                <div class="track-info">
                    <span class="track-artist">${track.artista}</span>
                    <span class="track-duration">⏱️ ${track.duracion || '--:--'}</span>
                </div>
            </div>
            <div class="track-number">${String(index + 1).padStart(2, '0')}</div>`;
        
        bloque.onclick = () => { 
            currentTrack = index; 
            cargarTrack(currentTrack); 
            renderPanelDerechoLocal(); 
        };
        panel.appendChild(bloque);
    });

    // AUTO-SCROLL: Mueve el track activo al tope del panel
    const activeTrack = document.getElementById(`track-${currentTrack}`);
    if (activeTrack) {
        setTimeout(() => {
            activeTrack.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function renderPanelDerechoStreaming(current) {
    const panel = document.querySelector('.panel-right');
    if (!panel || modo !== 'streaming') return;
    panel.innerHTML = '';
    const bloqueLive = document.createElement('div');
    bloqueLive.className = 'track-block active';
    bloqueLive.innerHTML = `
        <div class="track-cover"><img src="${coverImg.src}" /></div>
        <div class="track-meta">
            <div class="track-title">${current.titulo}</div>
            <div class="track-info"><span class="track-artist">${current.artista}</span><span class="track-duration">LIVE</span></div>
        </div>
        <div class="track-number">🔴</div>`;
    panel.appendChild(bloqueLive);

    trackHistory.forEach((item, idx) => {
        const bloque = document.createElement('div');
        bloque.className = 'track-block';
        bloque.innerHTML = `
            <div class="track-cover"><img src="${item.cover}" /></div>
            <div class="track-meta">
                <div class="track-title">${item.title}</div>
                <div class="track-info"><span class="track-artist">${item.artist}</span><span class="track-duration">${item.time}</span></div>
            </div>
            <div class="track-number">${String(idx + 1).padStart(2, '0')}</div>`;
        panel.appendChild(bloque);
    });
}

// ======== BLOQUE DE CAMBIO DE MODO (LIMPIEZA ATÓMICA) ========
btnOnline.onclick = () => {
    // 1. Matar TODOS los procesos de tiempo y radio de raíz
    clearInterval(radioIntervalId);
    clearInterval(timerInterval);
    radioIntervalId = null;
    timerInterval = null;

    // 2. Limpieza de variables de control y UI
    lastTrackTitle = '';
    trackHistory = [];
    if (displayTiempo) displayTiempo.textContent = '00:00';
    actualizarCaratula(DEFAULT_COVER);

    // 3. MATAR LA CONEXIÓN (IMPORTANTE)
    // No basta con pause(), hay que vaciar el buffer físico
    audio.pause();
    audio.removeAttribute('src'); 
    audio.load(); 

    // 4. Switch de modo
    modo = (modo === 'local') ? 'streaming' : 'local';
    btnOnline.textContent = (modo === 'local') ? 'MÚSICA' : 'STREAMING';

    // 5. Carga de nueva fuente
    if (modo === 'streaming') {
        audio.src = 'https://technoplayerserver.net:8018/stream?icy=http';
        iniciarActualizacionRadio(); 
    } else {
        cargarTrack(currentTrack);
        renderPanelDerechoLocal();
    }
    
    // 6. Reiniciar contadores (Reloj vs Track)
    gestionarTiempo();
    
    // 7. Playback
    if (gestureDetected) {
        audio.play().catch(e => console.warn("Reintento de audio..."));
    }
};

// 2. Play / Pause
btnPlay.onclick = () => {
    if (audio.paused) { 
        audio.play(); 
        playIcon.className = 'fas fa-pause'; 
    } else { 
        audio.pause(); 
        playIcon.className = 'fas fa-play'; 
    }
};

// ======== BOTONES REPEAT Y SHUFFLE (MODO LOCAL) ========
const repeatBtn = document.getElementById('btnRepeat');
const shuffleBtn = document.getElementById('btnShuffle');

// Función Repeat
repeatBtn.addEventListener('click', () => {
  if (modo !== 'local') {
    console.warn('[ALEXIA] Repeat no disponible en modo streaming');
    repeatTrack = false;
    repeatBtn.classList.remove('active-glow');
    return;
  }

  repeatTrack = !repeatTrack;
  if (repeatTrack) {
    repeatBtn.classList.add('active-glow');   // Glow dorado
    console.log('[ALEXIA] Repetición activada');
  } else {
    repeatBtn.classList.remove('active-glow');
    console.log('[ALEXIA] Repetición desactivada');
  }
});

// Función Shuffle
shuffleBtn.addEventListener('click', () => {
  if (modo !== 'local') {
    console.warn('[ALEXIA] Shuffle no disponible en modo streaming');
    shuffleMode = false;
    shuffleBtn.classList.remove('active-glow');
    return;
  }

  shuffleMode = !shuffleMode;
  if (shuffleMode) {
    shuffleBtn.classList.add('active-glow');  // Glow dorado
    console.log('[ALEXIA] Shuffle activado');

    // Inicia reproducción aleatoria inmediatamente
    let nextTrack;
    do {
      nextTrack = Math.floor(Math.random() * playlist.length);
    } while (nextTrack === currentTrack && playlist.length > 1);

    currentTrack = nextTrack;
    cargarTrack(currentTrack);
    renderPanelDerechoLocal();
  } else {
    shuffleBtn.classList.remove('active-glow');
    console.log('[ALEXIA] Shuffle desactivado');
  }
});

// 5. Volumen (Sincronización de pivote)
// ======== VOLUMEN INICIAL Y CONTROL ========
const volumeBar = document.querySelector('.volume-bar');
const volumeIcon = document.getElementById('volumeIcon');

// Inicializar volumen en 70%
audio.volume = 0.7;
if (volumeBar) {
  volumeBar.value = 70;
  actualizarEstiloVolumen(70);
  actualizarIconoVolumen(70);
}

// Listener para cambios en la barra
if (volumeBar) {
  volumeBar.addEventListener('input', () => {
    const valor = parseInt(volumeBar.value, 10);
    audio.volume = valor / 100;
    actualizarEstiloVolumen(valor);
    actualizarIconoVolumen(valor);
  });
}

// Función para pintar el gradiente de la barra
function actualizarEstiloVolumen(valor) {
  if (!volumeBar) return;
  volumeBar.style.background = `linear-gradient(to right, #d4af37 0%, #d4af37 ${valor}%, #292d38 ${valor}%, #292d38 100%)`;
}

// Función para cambiar el ícono según nivel
function actualizarIconoVolumen(valor) {
  if (!volumeIcon) return;
  if (valor === 0) {
    volumeIcon.className = 'fas fa-volume-mute volume-icon';
  } else if (valor < 50) {
    volumeIcon.className = 'fas fa-volume-down volume-icon';
  } else {
    volumeIcon.className = 'fas fa-volume-up volume-icon';
  }
}

// 6. Lógica de salto al terminar (Ended)
audio.onended = () => {
    if (modo === 'local') {
        if (repeatTrack) {
            audio.currentTime = 0;
            audio.play();
        } else {
            currentTrack = shuffleMode 
                ? Math.floor(Math.random() * playlist.length) 
                : (currentTrack + 1) % playlist.length;
            cargarTrack(currentTrack);
            renderPanelDerechoLocal();
        }
    }
};

// ======== INICIALIZACIÓN ========
document.addEventListener('click', () => {
    if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;
        if (modo === 'streaming') {
            audio.play().then(() => { isPlaying = true; playIcon.className = 'fas fa-pause'; });
        }
    }
}, { once: true });

fetch('https://radio-tekileros.vercel.app/Repro26.json')
    .then(res => res.json())
    .then(data => {
        playlist = data.hits || [];
        if (modo === 'streaming') {
            iniciarActualizacionRadio();
            audio.src = 'https://technoplayerserver.net:8018/stream?icy=http';
        } else {
            cargarTrack(currentTrack);
            renderPanelDerechoLocal();
        }
        gestionarTiempo();
    });

// ======== MODAL CONTACTO ========
const modal = document.getElementById('modalContacto');
const closeBtn = document.querySelector('.close-modal');
const triggers = [document.getElementById('btnContacto'), document.getElementById('openContact')];

triggers.forEach(btn => {
    if (btn) btn.onclick = (e) => { e.preventDefault(); modal.classList.remove('hidden'); };
});

if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
window.onclick = (e) => { if (e.target == modal) modal.classList.add('hidden'); };
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) modal.classList.add('hidden');
});