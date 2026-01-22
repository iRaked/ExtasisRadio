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
// Variable global para evitar procesos repetidos innecesarios
let ultimaPistaStreaming = "";

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
// METADATOS STREAMING (VERSIÓN IMPLACABLE)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function actualizarMetadatosStreaming() {
    if (modo !== 'streaming') return;

    // Cache buster para forzar al servidor a dar el dato real actual
    const urlStats = `https://technoplayerserver.net:8018/stats?json=1&sid=1&t=${Date.now()}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlStats)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Error de red");
        const proxyData = await response.json();
        const data = JSON.parse(proxyData.contents);

        const rawTitle = data.songtitle || "";
        
        // 1. SI LA PISTA ES IGUAL A LA ANTERIOR, SOLO ACTUALIZAMOS OYENTES Y SALIMOS
        if (rawTitle === ultimaPistaStreaming && rawTitle !== "") {
            if (contadorRadio) contadorRadio.textContent = data.currentlisteners || 0;
            return; 
        }
        ultimaPistaStreaming = rawTitle;

        // 2. LIMPIEZA PROFUNDA DE METADATOS
        let { artista: finalArtist, titulo: finalTitle } = limpiarMetadatosRadio(rawTitle);

        // 3. ACTUALIZACIÓN INMEDIATA DE UI
        if (contadorRadio) contadorRadio.textContent = data.currentlisteners || 0;
        if (titulo) titulo.textContent = finalTitle;
        if (artista) artista.textContent = finalArtist;
        if (radio) radio.textContent = "Casino Digital"; 
        if (album) album.textContent = "Streaming AutoDJ";

        // 4. PROCESOS EN SEGUNDO PLANO (No bloquean la UI)
        registrarEnHistorial(finalArtist, finalTitle);
        buscarCaratulaReal(finalArtist, finalTitle);
        
        // Reiniciar animaciones de scroll
        activarScroll('.titulo-container');
        activarScroll('.artista-container');

    } catch (e) {
        console.error("Error en Metadatos:", e);
    }
}

// 🧠 Lógica de limpieza fuera para mayor velocidad
function limpiarMetadatosRadio(texto) {
    if (!texto || texto.includes("Stream") || texto.includes("Unknown")) {
        return { artista: "Casino Digital", titulo: "Siente la música" };
    }

    // Eliminamos tags de calidad, sitios web y basura común
    let limpio = texto
        .replace(/WWW\..*\..*|http:\/\/.*|\[.*\]|<.*>|128kbps|64kbps|mp3/gi, "")
        .replace(/\(.*\)/g, "") // Quita paréntesis (Remix, Edit, etc) para mejorar búsqueda
        .trim();

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BÚSQUEDA DE CARÁTULA (PRECISIÓN QUIRÚRGICA)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function buscarCaratulaReal(artistaQuery, tituloQuery) {
    // Si es el nombre por defecto, ponemos la carátula base rápido
    if (artistaQuery === "Casino Digital") {
        caratula.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        return;
    }

    const termino = `${artistaQuery} ${tituloQuery}`.toLowerCase();
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(termino)}&media=music&limit=1`;

    try {
        const res = await fetch(itunesUrl);
        const json = await res.json();
        
        if (json.results && json.results.length > 0) {
            const result = json.results[0];
            const highRes = result.artworkUrl100.replace("100x100bb", "600x600bb");
            
            // Solo actualizamos el DOM si la carátula es realmente distinta a la actual
            if (!caratula.src.includes(result.collectionId)) {
                caratula.src = highRes;
            }
        } else {
            caratula.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        }
    } catch (e) {
        caratula.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GESTIÓN DE CICLO (MÁS AGRESIVO)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function gestionarCicloRadio(activar) {
    if (radioIntervalId) clearInterval(radioIntervalId);
    if (activar) {
        ultimaPistaStreaming = ""; // Reset para forzar primera carga
        actualizarMetadatosStreaming();
        // Bajamos a 8 segundos para ser más "implacables" con el cambio de pista
        radioIntervalId = setInterval(actualizarMetadatosStreaming, 8000);
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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTROL DE VOLUMEN / EQ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const slider = document.getElementById('volumenSlider');
const btnMenos = document.querySelector('.volumen-control:first-of-type');
const btnMas = document.querySelector('.volumen-control:last-of-type');

if (slider) {
    // 1. Control por el Slider (Arrastrar)
    slider.addEventListener('input', () => {
        const val = slider.value;
        // Aplicar volumen al audio (de 0.0 a 1.0)
        audio.volume = val / 100;
        // Actualizar el "llenado" visual de la barra (Glow blanco)
        slider.style.background = `linear-gradient(to right, white ${val}%, transparent ${val}%)`;
    });

    // 2. Control por los botones - y +
    if (btnMenos) {
        btnMenos.onclick = () => {
            slider.value = Math.max(0, parseInt(slider.value) - 10);
            slider.dispatchEvent(new Event('input')); // Dispara la actualización
        };
    }

    if (btnMas) {
        btnMas.onclick = () => {
            slider.value = Math.min(100, parseInt(slider.value) + 10);
            slider.dispatchEvent(new Event('input')); // Dispara la actualización
        };
    }
}

const canvas = document.getElementById('miniEQ'), ctx = canvas.getContext('2d');
setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 5; i++) {
        const h = isPlaying ? Math.random() * canvas.height : 2;
        ctx.fillStyle = 'white'; ctx.fillRect(i * 4, canvas.height - h, 2, h);
    }
}, 100);

// =================================
// Bloqueo de Context Menu y Mensaje
// =================================
document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const msg = document.getElementById("custom-message");
    msg.classList.add("show");
    setTimeout(() => msg.classList.remove("show"), 2000);
});
