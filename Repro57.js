/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚀 MOTOR JARVIS & SPOTUNE: NÚCLEO ESTABLE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const Jarvis = {
    card: document.querySelector('.card-vertical'),
    player: document.getElementById('spotune-player')
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VARIABLES GLOBALES DE ESTADO Y ELEMENTOS DE RADIO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let isRadioMode = true;
let modoActual = "radio"; // "radio" o "local"
let radioUpdateIntervalId = null;
let lastTrackTitleRadio = "";

// Elementos del DOM (asegurate que estos IDs existan en tu HTML)
const contadorElemento = document.getElementById('listeners-count'); 
const currentTrackName = document.getElementById('hud-title');
const currentArtistName = document.getElementById('hud-artist');
const metaTrack = document.getElementById('meta-track'); 
const discImg = document.querySelector('.cd-vinyl img') || document.querySelector('.cd-vinyl');
const hudCoverImg = document.getElementById('hud-cover-img'); // Elemento de la carátula en el HUD

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📻 MODO RADIO - MOTOR DE LECTURA JSON BLINDADO (DESDE EL MILISEGUNDO 1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function iniciarActualizacionRadioUnificada() {
    // Si ya hay un intervalo corriendo, lo limpiamos para evitar duplicados
    if (radioUpdateIntervalId) {
        clearInterval(radioUpdateIntervalId);
        radioUpdateIntervalId = null;
    }
    
    const radioJsonUrl = "http://technoplayerserver.net:8240/stats?json=1&sid=1";
    
    // Lista de proxies alternativos rotativos que evitan el bloqueo 403
    const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(radioJsonUrl)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(radioJsonUrl)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(radioJsonUrl)}`
    ];

    async function obtenerDatosDelServidor() {
        let jsonData = null;

        // Búsqueda en cadena rápida con timeout agresivo (3 segundos)
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
                    // Si usamos allorigins/get devuelve un objeto envuelto en contents, si no, es texto directo
                    if (proxyUrl.includes('allorigins.win/get')) {
                        const parsedWrapper = JSON.parse(textData);
                        jsonData = JSON.parse(parsedWrapper.contents);
                    } else {
                        jsonData = JSON.parse(textData);
                    }
                    break; 
                }
            } catch (e) {
                continue; // Si un proxy falla, pasa al siguiente al instante
            }
        }

        if (!jsonData) {
            // Silencioso pero constante: no rompe el hilo, reintentará en el próximo ciclo
            return;
        }

        try {
            // 1. ACTUALIZAR OYENTES
            const listeners = jsonData.currentlisteners ?? "8";
            if (typeof contadorElemento !== 'undefined' && contadorElemento) {
                contadorElemento.textContent = listeners;
            }

            // 2. METADATOS
            const rawTitle = jsonData.songtitle || "";
            const cleanedTitle = rawTitle.trim().replace(/AUTODJ/gi, '').replace(/\|\s*$/g, '').trim();

            if (!cleanedTitle || cleanedTitle.toLowerCase().includes('offline')) {
                return;
            }

            if (cleanedTitle !== lastTrackTitleRadio) {
                lastTrackTitleRadio = cleanedTitle;
                
                const songtitleSplit = cleanedTitle.split(/ - | – /);
                let artist = "Radio Tekileros";
                let title = cleanedTitle; 

                if (songtitleSplit.length >= 2) {
                    artist = songtitleSplit[0].trim();
                    title = songtitleSplit.slice(1).join(' - ').trim(); 
                }

                if (typeof currentTrackName !== 'undefined' && currentTrackName) currentTrackName.textContent = title;
                if (typeof currentArtistName !== 'undefined' && currentArtistName) currentArtistName.textContent = artist;
                
                if (typeof metaTrack !== 'undefined' && metaTrack) {
                    metaTrack.textContent = `${artist} - ${title}`;
                    metaTrack.setAttribute("data-tag", `${artist} - ${title}`);
                }

                const newHistoryEntry = { 
                    artist, 
                    title, 
                    cover: 'https://santi-graphics.vercel.app/assets/covers/Cover1.png' 
                };

                if (typeof trackHistory !== 'undefined') {
                    if (trackHistory.length === 0 || trackHistory[0].title !== title) {
                        trackHistory.unshift(newHistoryEntry);
                        if (trackHistory.length > 20) trackHistory.pop();
                    }
                    if (typeof renderRadioHistory === 'function') renderRadioHistory();
                }

                if (title.length < 80 && typeof obtenerCaratulaDesdeiTunesUnificada === 'function') {
                    obtenerCaratulaDesdeiTunesUnificada(artist, title);
                }
            }
        } catch (error) {
            console.error("❌ Error procesando datos de radio:", error);
        }
    }

    // 🚀 DISPARO INMEDIATO: Ejecuta el primer escaneo al instante (Milisegundo 1)
    obtenerDatosDelServidor();    
    
    // 🔄 HILO PERMANENTE: Sigue recolectando datos cada 6 segundos sin perder el hilo nunca
    radioUpdateIntervalId = setInterval(obtenerDatosDelServidor, 6000);
}

// ==============================================================
// Función de limpieza (detiene el intervalo y resetea el título)
// ==============================================================
function detenerActualizacionRadioUnificada() {
    if (radioUpdateIntervalId !== null) {
        clearInterval(radioUpdateIntervalId);
        radioUpdateIntervalId = null;
    }
    lastTrackTitleRadio = "";
}

// Función auxiliar para obtener carátula desde iTunes
function obtenerCaratulaDesdeiTunesUnificada(artist, title) {
    if (!hudCoverImg && !discImg) return;
    
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
                
                // Aplicamos la carátula al HUD principal
                if (hudCoverImg) hudCoverImg.src = cover;
                if (discImg) discImg.classList.add("rotating");

                // 🚀 GUARDAMOS LA CARÁTULA EN EL HISTORIAL ACTUAL Y REPINTAMOS
                if (trackHistory.length > 0) {
                    trackHistory[0].cover = cover;
                    renderRadioHistory();
                }
            })
            .catch(() => {
                if (hudCoverImg) hudCoverImg.src = 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';
                if (discImg) discImg.classList.add("rotating");
            });
    } catch (e) {
        console.warn("Error obteniendo carátula:", e);
    }
}

// ====================================================================
// 🌌 2. CONTROL DEL REPRODUCTOR (JARVIS UI)
// ====================================================================

window.openSpotune = function(coverSrc, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    
    if (hudCoverImg && coverSrc) {
        hudCoverImg.src = coverSrc;
    }

    requestAnimationFrame(() => {
        if (Jarvis.player) {
            Jarvis.player.style.display = 'block';
            void Jarvis.player.offsetWidth; 
            Jarvis.player.style.opacity = '1';
            Jarvis.player.style.pointerEvents = 'auto';
        }
        
        if (Jarvis.card) {
            Jarvis.card.classList.add('player-active');
        }
        
        const cd = document.querySelector('.cd-vinyl');
        if (cd) cd.classList.add('playing');
    });
};

window.closeSpotune = function(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const cd = document.querySelector('.cd-vinyl');

    requestAnimationFrame(() => {
        if (Jarvis.card) {
            Jarvis.card.classList.remove('player-active');
        }
        
        if (cd) cd.classList.remove('playing');

        setTimeout(() => {
            if (Jarvis.player && Jarvis.card && !Jarvis.card.classList.contains('player-active')) {
                Jarvis.player.style.display = 'none';
            }
        }, 400); 
    });
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎵 MOTOR SPOTUNE: LÓGICA FUNCIONAL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Spotune = {
    audio: new Audio(),
    playlist: [],
    currentIndex: 0,
    isPlaying: false
};

let trackHistory = [];
let repeatMode = "none";
let isShuffling = false;

Spotune.audio.loop = false;

window.addEventListener('DOMContentLoaded', () => {
    const shuffleBtn = document.querySelector('.btn-shuffle');
    const repeatBtn = document.querySelector('.btn-repeat');
    if (shuffleBtn) shuffleBtn.classList.remove("active");
    if (repeatBtn) repeatBtn.classList.remove("active-one");
});

// 1. CARGA DE DATOS Y ASIGNACIÓN INMEDIATA (Playlist Local)
async function loadPlaylist() {
    try {
        const res = await fetch('https://radio-tekileros.vercel.app/Spotifly.json');
        const data = await res.json();
        Spotune.playlist = data.spotifly;

        renderPlaylist(); 

        if (isRadioMode) {
            initRadioMode();
        } else {
            const firstTrack = Spotune.playlist[0];
            if (firstTrack) {
                Spotune.currentIndex = 0;
                Spotune.audio.src = firstTrack.enlace;
                updateHudInfo(firstTrack.nombre.toUpperCase(), firstTrack.artista.toUpperCase(), firstTrack.caratula);
            }
        }

    } catch (e) {
        if (hudCoverImg) hudCoverImg.src = "https://santi-graphics.vercel.app/assets/img/CD.png";
    }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📻 INICIALIZAR / CAMBIAR A MODO RADIO
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function initRadioMode() {
    isRadioMode = true;
    modoActual = "radio"; 
    Spotune.audio.src = "https://technoplayerserver.net/8240/stream"; 
    
    updateHudInfo("AUTO DJ", "RADIO PLAY", "https://santi-graphics.vercel.app/assets/covers/Cover1.png");
    
    const modeBtn = document.querySelector('.hud-mode-btn');
    if (modeBtn) modeBtn.style.color = "#ffffff";

    const hudLabel = document.querySelector('.hud-label');
    if (hudLabel) hudLabel.textContent = "HISTORIAL DE RADIO";

    renderRadioHistory();
    
    // Lanzar la lectura periódica del servidor
    iniciarActualizacionRadioUnificada();

    playTrack(); 
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💿 CAMBIAR A MODO LOCAL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function initLocalMode() {
    isRadioMode = false;
    modoActual = "local";
    detenerActualizacionRadioUnificada(); 
    
    const modeBtn = document.querySelector('.hud-mode-btn');
    if (modeBtn) modeBtn.style.color = "#00f2ff";  

    const hudLabel = document.querySelector('.hud-label');
    if (hudLabel) hudLabel.textContent = "PLAYLIST SPOTUNE";

    renderPlaylist(); 

    if (Spotune.playlist.length > 0) {
        loadTrack(Spotune.currentIndex, true);
    }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📜 RENDERIZAR VISTA DE HISTORIAL (MODO RADIO)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderRadioHistory() {
    const list = document.getElementById('playlist-data');
    if (!list) return;
    
    list.innerHTML = ''; 
    
    if (trackHistory.length === 0) {
        const li = document.createElement('li');
        li.style.cursor = "default";
        li.innerHTML = `<span style="color: #00f2ff;">LIVE</span> Transmisión en curso...`;
        list.appendChild(li);
        return;
    }

    trackHistory.forEach((item, i) => {
        const li = document.createElement('li');
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "10px";
        li.style.cursor = "default";

        const coverSrc = item.cover || 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';
        const activeColor = i === 0 ? "#00f2ff" : "#ffffff";

        li.innerHTML = `
            <img src="${coverSrc}" alt="Cover" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover; flex-shrink: 0;">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <div style="font-size: 0.85rem; color: ${activeColor}; font-weight: bold; overflow: hidden; text-overflow: ellipsis;">${item.title.toUpperCase()}</div>
                <div style="font-size: 0.75rem; color: #888888; overflow: hidden; text-overflow: ellipsis;">${item.artist.toUpperCase()}</div>
            </div>
        `;
        list.appendChild(li);
    });
}

window.toggleRadioMode = function(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    if (isRadioMode) {
        initLocalMode();
    } else {
        initRadioMode();
    }
};

function updateHudInfo(title, artist, coverSrc) {
    const titleEl = document.getElementById('hud-title');
    const artistEl = document.getElementById('hud-artist');

    if (titleEl) titleEl.textContent = title;
    if (artistEl) artistEl.textContent = artist;
    if (hudCoverImg) hudCoverImg.src = coverSrc || "https://santi-graphics.vercel.app/assets/img/CD.png";
}

function loadTrack(index, autoPlay) {
    if (isRadioMode) return; 
    if (!Spotune.playlist[index]) return;
    
    Spotune.currentIndex = index;
    const t = Spotune.playlist[index];

    updateHudInfo(t.nombre.toUpperCase(), t.artista.toUpperCase(), t.caratula);
    Spotune.audio.src = t.enlace;

    const list = document.getElementById('playlist-data');
    if (!list) return;
    const items = list.querySelectorAll('li');

    items.forEach((li, i) => {
        li.classList.toggle('active-track', i === index);
    });

    const activeItem = items[index];
    if (activeItem) {
        list.insertBefore(activeItem, list.firstChild);
        activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    if (autoPlay) playTrack();
}

function playTrack() {
    Spotune.audio.play().then(() => {
        Spotune.isPlaying = true;
        const playIcon = document.querySelector('.btn-play i');
        const cdVinyl = document.querySelector('.cd-vinyl');
        if (playIcon) playIcon.className = 'fa-solid fa-pause';
        if (cdVinyl) cdVinyl.classList.add('playing');
    }).catch(() => {});
}

function pauseTrack() {
    Spotune.audio.pause();
    Spotune.isPlaying = false;
    const playIcon = document.querySelector('.btn-play i');
    const cdVinyl = document.querySelector('.cd-vinyl');
    if (playIcon) playIcon.className = 'fa-solid fa-play';
    if (cdVinyl) cdVinyl.classList.remove('playing');
}

function nextTrack() {
    if (isRadioMode) return; 
    if (Spotune.playlist.length === 0) return;
    if (Spotune.currentIndex === null) Spotune.currentIndex = 0;

    if (isShuffling) {
        let newIndex;
        if (Spotune.playlist.length > 1) trackHistory.push(Spotune.currentIndex);

        do {
            newIndex = Math.floor(Math.random() * Spotune.playlist.length);
        } while (newIndex === Spotune.currentIndex && Spotune.playlist.length > 1);

        loadTrack(newIndex, true);
    } else {
        let nextIndex = (Spotune.currentIndex + 1) % Spotune.playlist.length;
        loadTrack(nextIndex, true);
    }
}

function prevTrack() {
    if (isRadioMode) return; 
    if (Spotune.playlist.length === 0) return;

    let prevIndex;

    if (isShuffling && trackHistory.length > 0) {
        if (trackHistory[trackHistory.length - 1] === Spotune.currentIndex) {
            trackHistory.pop();
        }
        prevIndex = trackHistory.pop();
    } else {
        prevIndex = (Spotune.currentIndex - 1 + Spotune.playlist.length) % Spotune.playlist.length;
    }

    if (prevIndex !== undefined) {
        loadTrack(prevIndex, true);
    }
}

function toggleRepeat() {
    if (isRadioMode) return;
    const repeatBtn = document.querySelector('.btn-repeat');
    if (repeatMode !== "one") {
        repeatMode = "one";
        if (repeatBtn) repeatBtn.classList.add("active-one");
        Spotune.audio.loop = true;
    } else {
        repeatMode = "none";
        if (repeatBtn) repeatBtn.classList.remove("active-one");
        Spotune.audio.loop = false;
    }
}

function toggleShuffle() {
    if (isRadioMode) return;
    isShuffling = !isShuffling;
    const shuffleBtn = document.querySelector('.btn-shuffle');

    if (isShuffling) {
        if (shuffleBtn) shuffleBtn.classList.add("active");
        trackHistory = [Spotune.currentIndex];
        if (Spotune.playlist.length > 1) nextTrack();
    } else {
        if (shuffleBtn) shuffleBtn.classList.remove("active");
        trackHistory = [];
    }
}

const btnPlay = document.querySelector('.btn-play');
const btnFwd = document.querySelector('.btn-fwd');
const btnRwd = document.querySelector('.btn-rwd');
const btnRepeat = document.querySelector('.btn-repeat');
const btnShuffle = document.querySelector('.btn-shuffle');

if (btnPlay) btnPlay.onclick = (e) => { e.stopPropagation(); Spotune.isPlaying ? pauseTrack() : playTrack(); };
if (btnFwd) btnFwd.onclick = (e) => { e.stopPropagation(); nextTrack(); };
if (btnRwd) btnRwd.onclick = (e) => { e.stopPropagation(); prevTrack(); };
if (btnRepeat) btnRepeat.onclick = (e) => { e.stopPropagation(); toggleRepeat(); };
if (btnShuffle) btnShuffle.onclick = (e) => { e.stopPropagation(); toggleShuffle(); };

function renderPlaylist() {
    const list = document.getElementById('playlist-data');
    if (!list) return;
    list.innerHTML = '';
    Spotune.playlist.forEach((t, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${(i + 1).toString().padStart(2, '0')}</span> ${t.nombre.toUpperCase()} - ${t.artista.toUpperCase()}`;
        li.onclick = (e) => { 
            e.stopPropagation(); 
            if (isRadioMode) initLocalMode(); 
            loadTrack(i, true); 
        };
        list.appendChild(li);
    });
}

Spotune.audio.onended = () => {
    if (!isRadioMode && repeatMode === "none") nextTrack();
};

// INICIO Y ARRANQUE AUTOMÁTICO DESDE EL MILISEGUNDO 1
loadPlaylist();

window.addEventListener('DOMContentLoaded', () => {
    openSpotune();
});

document.body.addEventListener('click', () => {
    if (!Spotune.isPlaying) playTrack();
}, { once: true });