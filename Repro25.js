// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INICIALIZACIÓN DE VARIABLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let currentTrack = 0;
let isPlaying = false;
let playlist = [];
let emisora = 'Spotifly';
let modo = 'local'; 
let modoShuffle = false; 
let radioIntervalId = null;
let trackHistory = []; // Almacena las últimas 20 de la radio

// Elementos de la Interfaz
const audio = document.getElementById('player');
const caratula = document.querySelector('.caratula img');
const titulo = document.querySelector('.titulo');
const artista = document.querySelector('.artista');
const album = document.querySelector('.album');
const radio = document.querySelector('.radio');
const playBtn = document.querySelector('.play img');
const btnPlay = document.querySelector('.play');
const btnPrev = document.querySelector('.prev');
const btnNext = document.querySelector('.next');
const btnShuffle = document.querySelector('.shuffle');
const btnMenu = document.querySelector('.menu');
const btnFondo = document.querySelector('.fondo'); 
const btnHistorial = document.querySelector('.historial'); // Corregido: sin ".btn" delante
const reproductor = document.getElementById('Repro');
const contadorRadio = document.getElementById("contadorRadio");

// Elementos del Modal
const modalTracks = document.getElementById('modalTracks');
const trackList = document.getElementById('trackList');
const currentTrackNameModal = document.getElementById('currentTrackNameModal');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESBLOQUEO Y CARGA INICIAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function desbloqueoAutoplay() {
    if (audio && audio.muted) audio.muted = false;
    if (audio.paused && audio.src) {
        audio.play().then(() => {
            isPlaying = true;
            playBtn.src = 'assets/img/btn-pause.png';
        }).catch(() => {});
    }
}

['click', 'touchstart', 'keydown'].forEach(evento => {
    window.addEventListener(evento, desbloqueoAutoplay, { once: true });
});

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
        if (modo === 'local') cargarTrack(currentTrack);
    });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LÓGICA DE HISTORIAL Y MODAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

    if (modo === 'streaming') {
        currentTrackNameModal.textContent = "Historial Radio (Últimas 20)";
        if (trackHistory.length === 0) {
            trackList.innerHTML = '<li>Esperando datos de la radio...</li>';
            return;
        }
        trackHistory.forEach(track => {
            const li = document.createElement('li');
            li.textContent = `${track.time} | ${track.artist} - ${track.title}`;
            trackList.appendChild(li);
        });
    } else {
        currentTrackNameModal.textContent = "Lista de Pistas Locales";
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-index', index);
            
            // 💡 CAMBIO AQUÍ: Formato Título - Artista
            li.innerHTML = `<span class="track-name">${index + 1}. ${track.name}</span> <span class="track-artist">- ${track.artist}</span>`;
            
            if (index === currentTrack) li.classList.add('active-track');

            li.addEventListener('click', () => {
                currentTrack = index;
                cargarTrack(currentTrack);
                toggleModal(false);
            });
            trackList.appendChild(li);
        });
        actualizarModalActualTrack();
    }
}

function toggleModal(show) {
    if (show) {
        modalTracks.classList.remove('hidden');
        generarListaModal();
    } else {
        modalTracks.classList.add('hidden');
    }
}

function actualizarModalActualTrack() {
    if (modo !== 'local') return;
    document.querySelectorAll('.track-list li').forEach(li => li.classList.remove('active-track'));
    const current = document.querySelector(`.track-list li[data-index="${currentTrack}"]`);
    if (current) {
        current.classList.add('active-track');
        current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        currentTrackNameModal.textContent = playlist[currentTrack].name;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METADATOS STREAMING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function actualizarMetadatosStreaming() {
    if (modo !== 'streaming') return;
    const cacheBuster = new Date().getTime();
    const urlStats = `https://technoplayerserver.net:8018/stats?json=1&sid=1&t=${cacheBuster}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlStats)}`;

    try {
        const response = await fetch(proxyUrl);
        const proxyData = await response.json();
        const data = JSON.parse(proxyData.contents);

        const rawTitle = data.songtitle || "Transmisión en Vivo";
        const oyentesReales = data.currentlisteners || 0;

        let artistName = "Casino Digital", songTitle = rawTitle;
        const separators = [" - ", " – ", " — "];
        for (const sep of separators) {
            if (rawTitle.includes(sep)) {
                const parts = rawTitle.split(sep);
                artistName = parts[0].trim();
                songTitle = parts.slice(1).join(sep).trim();
                break;
            }
        }

        if (contadorRadio) contadorRadio.textContent = oyentesReales;
        if (titulo) titulo.textContent = songTitle;
        if (artista) artista.textContent = artistName;
        
        // 💡 Aquí forzamos Casino Digital en el campo de la radio
        if (radio) radio.textContent = "Casino Digital"; 
        if (album) album.textContent = "Streaming AutoDJ";
        
        registrarEnHistorial(artistName, songTitle); // Registro automático
        buscarCaratulaReal(artistName, songTitle);
        activarScroll('.titulo-container');
        activarScroll('.artista-container');
    } catch (e) {}
}

async function buscarCaratulaReal(artistaQuery, tituloQuery) {
    const limpiar = (t) => t.toLowerCase().replace(/\(.*\)|\[.*\]/g, "").replace(/feat\..*|ft\..*|prod\..*|official video/gi, "").trim();
    const busqueda = `${limpiar(artistaQuery)} ${limpiar(tituloQuery)}`;
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(busqueda)}&media=music&limit=1`;
    try {
        const res = await fetch(itunesUrl);
        const json = await res.json();
        if (json.results && json.results.length > 0) {
            const highRes = json.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
            if (!caratula.src.includes(json.results[0].artworkUrl100.split('/')[4])) caratula.src = highRes;
        } else {
            if (!caratula.src.includes("Cover1.png")) caratula.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        }
    } catch (e) {}
}

function gestionarCicloRadio(activar) {
    if (radioIntervalId) clearInterval(radioIntervalId);
    if (activar) {
        actualizarMetadatosStreaming();
        radioIntervalId = setInterval(actualizarMetadatosStreaming, 10000);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REPRODUCCIÓN LOCAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function cargarTrack(index) {
    if (modo !== 'local' || !playlist[index]) return;
    const track = playlist[index];
    audio.src = track.url;
    caratula.src = track.cover || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';
    
    // 💡 Aseguramos que aquí diga Spotifly solo si es local
    radio.textContent = "Spotifly"; 
    
    titulo.textContent = track.name;
    artista.textContent = track.artist;
    album.textContent = track.album;
    
    activarScroll('.titulo-container');
    activarScroll('.artista-container');
    if (isPlaying) audio.play().catch(() => {});
}

function activarScroll(selector) {
    const contenedor = document.querySelector(selector);
    if (!contenedor) return;
    const texto = contenedor.querySelector('span');
    if (!texto) return;
    texto.style.animation = 'none';
    texto.style.transform = 'translateX(0)';
    setTimeout(() => {
        if (texto.scrollWidth > contenedor.offsetWidth) {
            texto.style.animation = 'scroll-left 8s linear infinite';
        }
    }, 50);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENTOS Y BOTONERA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
btnPlay.addEventListener('click', () => {
    if (audio.paused) {
        audio.play().then(() => { isPlaying = true; playBtn.src = 'https://santi-graphics.vercel.app/assets/img/btn-pause.png'; });
    } else {
        audio.pause(); isPlaying = false; playBtn.src = 'https://santi-graphics.vercel.app/assets/img/btn-play.png';
    }
});

btnPrev.addEventListener('click', () => { if (modo === 'local') { currentTrack = (currentTrack - 1 + playlist.length) % playlist.length; cargarTrack(currentTrack); } });
btnNext.addEventListener('click', () => { if (modo === 'local') { currentTrack = (currentTrack + 1) % playlist.length; cargarTrack(currentTrack); } });

btnMenu.addEventListener('click', () => {
    if (modo === 'local') {
        modo = 'streaming';
        btnMenu.querySelector('img').style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 0, 0.8))';
        audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
        audio.play().then(() => { isPlaying = true; playBtn.src = 'assets/img/btn-pause.png'; });
        gestionarCicloRadio(true);
    } else {
        modo = 'local';
        
        btnMenu.querySelector('img').style.filter = 'drop-shadow(0 0 6px rgba(186, 0, 255, 0.8))';
        gestionarCicloRadio(false);
        cargarTrack(currentTrack);
    }
});

btnFondo.addEventListener('click', () => {
    reproductor.classList.toggle('fondo-activo');
    const isAct = reproductor.classList.contains('fondo-activo');
    btnFondo.querySelector('img').style.filter = isAct ? 'drop-shadow(0 0 10px white) brightness(1.2)' : 'drop-shadow(0 0 6px rgba(186, 0, 255, 0.8))';
});

btnHistorial.addEventListener('click', (e) => { e.stopPropagation(); toggleModal(true); });
document.querySelector('.close-modal').addEventListener('click', () => toggleModal(false));
modalTracks.addEventListener('click', (e) => { if (e.target === modalTracks) toggleModal(false); });
document.addEventListener('keydown', (e) => { if (e.key === "Escape") toggleModal(false); });

// EQ y Volumen
const slider = document.getElementById('volumenSlider');
slider.addEventListener('input', () => { audio.volume = slider.value / 100; });

const canvas = document.getElementById('miniEQ'), ctx = canvas.getContext('2d');
setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 5; i++) {
        const h = isPlaying ? Math.random() * canvas.height : 2;
        ctx.fillStyle = 'white'; ctx.fillRect(i * 4, canvas.height - h, 2, h);
    }
}, 100);

// Bloqueo de Context Menu y Mensaje
document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const msg = document.getElementById("custom-message");
    msg.classList.add("show");
    setTimeout(() => msg.classList.remove("show"), 2000);
});