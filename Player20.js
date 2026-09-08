// ===============================
// 🎧 INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
// ===============================
let trackData = [];
let currentTrack = null;
let modoActual = "radio"; // "radio" o "local"
let audio = document.getElementById("player");
let gestureDetected = false;
let repeatMode = "none";
let isShuffling = false;
let trackHistory = [];

// Variables unificadas para el modo radio (reemplazan a las antiguas)
let radioUpdateIntervalId = null;
let lastTrackTitleRadio = "";

// ===============================
// 🎯 ELEMENTOS CLAVE DEL DOM
// ===============================
const playPauseBtn = document.getElementById("btn-play-pause");
const nextBtn = document.getElementById("next-button");
const prevBtn = document.getElementById("prev-button");
const shuffleBtn = document.getElementById("shuffle-button");
const repeatBtn = document.getElementById("repeat-button");
const btnRadio = document.getElementById("btn-radio");

const iconPlay = playPauseBtn ? playPauseBtn.querySelector(".icon-play") : null;
const iconPause = playPauseBtn ? playPauseBtn.querySelector(".icon-pause") : null;

const discImg = document.getElementById("disc-img");
const currentTrackName = document.getElementById("current-track-name");
const currentArtistName = document.getElementById("current-artist-name");
const metaTrack = document.getElementById("meta-track"); 

const volumeBar = document.getElementById("volumeBar");
const volumeIcon = document.getElementById("volumeIcon");

const contadorElemento = document.getElementById("contadorRadio");

const modalTracks = document.getElementById("modal-tracks");
const menuBtn = document.getElementById("btn-menu-tracks");
const closeModalBtn = document.getElementById("close-modal");
const trackList = document.querySelector(".track-list"); 
const currentTrackNameModal = document.getElementById('current-track-name-modal');

// ===============================
// 🖼️ FUNCIONES AUXILIARES (Carátulas)
// ===============================
function validarCaratula(url) {
    if (!discImg) return;
    const img = new Image();
    img.onload = () => {
        discImg.src = url;
        discImg.classList.add("rotating");
    };
    img.onerror = () => {
        discImg.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        discImg.classList.add("rotating");
    };
    img.src = url;
}

function actualizarCaratula(track) {
    if (!discImg) return;
    if (modoActual === "local") {
        const currentTrackObj = track || (currentTrack !== null ? trackData[currentTrack] : null);
        if (!currentTrackObj) {
            discImg.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
            return;
        }
        const cover = currentTrackObj.cover || "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
        validarCaratula(cover);
    } else {
        if (discImg.src && discImg.src.includes("https://santi-graphics.vercel.app/assets/img/Plato.png") === false) {
            discImg.src = "https://santi-graphics.vercel.app/assets/img/Plato.png";
            discImg.classList.add("rotating");
        }
    }
}

// ===============================
// 📦 CARGA DE PISTAS DESDE JSON (MODO LOCAL)
// ===============================
function cargarTracksDesdeJSON() {
    fetch("https://radio-tekileros.vercel.app/Bandida.json")
        .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! status: ${res.status}`))
        .then(data => {
            const pistas = data.bandida;

            if (!Array.isArray(pistas) || pistas.length === 0) {
                console.warn("❌ No se encontraron pistas válidas en el JSON.");
                return;
            }

            trackData = pistas.map(p => ({
                cover: p.caratula || "https://santi-graphics.vercel.app/assets/covers/Cover1.png",
                url: p.dropbox_url || p.url_dropbox || p.enlace,
                artist: p.artista || "Artista Desconocido",
                name: p.nombre || "Sin Título",
                album: p.album || "Single",
                emotion: p.emotion,
                genero: p.genero,
                duracion: p.duracion,
                id: p.id,
                seccion: p.seccion
            })).filter(track => track.url);

            currentTrack = 0;
            activarReproduccion(0, "initial-load"); 
            generarListaModal();
            console.log("✅ Pistas cargadas desde Bandida.json. Audio src preparado.");
        })
        .catch(err => {
            console.error("❌ Error CRÍTICO al cargar JSON:", err);
        });
}

// ===============================
// ▶️ FUNCIÓN UNIVERSAL DE REPRODUCCIÓN
// ===============================
function activarReproduccion(index, modo = "manual") {
    if (modoActual !== "local" || index < 0 || index >= trackData.length) return;

    const track = trackData[index];
    if (!track?.url) return;

    currentTrack = index;
    
    if (currentTrackName) currentTrackName.textContent = track.name;
    if (currentArtistName) currentArtistName.textContent = track.artist || "Artista Desconocido";
    if (metaTrack) {
        metaTrack.textContent = track.name;
        metaTrack.setAttribute("data-tag", track.name);
    }
    
    audio.src = track.url;
    audio.load(); 
    
    if (discImg) discImg.classList.add("rotating");
    actualizarCaratula(track);

    if (modo === "initial-load") {
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden");
        if (discImg) discImg.classList.remove("rotating");
        return; 
    }

    if (gestureDetected) {
        audio.muted = false;
        audio.play().then(() => {
            if (iconPlay) iconPlay.classList.add("hidden");
            if (iconPause) iconPause.classList.remove("hidden");
            actualizarModalActualTrack(); 
        }).catch(err => {
            console.error(`❌ Error de reproducción: ${audio.src}`, err);
            if (iconPause) iconPause.classList.add("hidden");
            if (iconPlay) iconPlay.classList.remove("hidden");
            if (discImg) discImg.classList.remove("rotating");
        });
    } else {
        if (iconPause) iconPause.classList.add("hidden");
        if (iconPlay) iconPlay.classList.remove("hidden");
        if (discImg) discImg.classList.remove("rotating");
    }
}

// ====================================================================
// 📻 MODO RADIO - LÓGICA UNIFICADA (Metadatos + Contador + Carátula)
// ====================================================================
function detenerActualizacionRadioUnificada() {
    if (radioUpdateIntervalId !== null) {
        clearInterval(radioUpdateIntervalId);
        radioUpdateIntervalId = null;
    }
    if (contadorElemento) contadorElemento.textContent = "0";
}

function obtenerCaratulaDesdeiTunesUnificada(artist, title) {
    if (!discImg) return;
    
    let cleanArtist = artist.toLowerCase().trim();
    if (cleanArtist.includes(" &")) cleanArtist = cleanArtist.substring(0, cleanArtist.indexOf(' &'));
    else if (cleanArtist.includes("feat")) cleanArtist = cleanArtist.substring(0, cleanArtist.indexOf(' feat'));
    
    let cleanTitle = title.toLowerCase().trim();
    if (cleanTitle.includes("&")) cleanTitle = cleanTitle.replace('&', 'and');
    else if (cleanTitle.includes("(")) cleanTitle = cleanTitle.substring(0, cleanTitle.indexOf(' ('));

    try {
        const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
        const itunesUrl = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;
        
        // Proxy para evitar CORS en file:// y garantizar funcionamiento
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(itunesUrl)}`;

        fetch(proxyUrl)
            .then(res => res.json())
            .then(data => {
                const itunesData = JSON.parse(data.contents);
                let cover = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
                
                if (itunesData.results && itunesData.results.length > 0 && itunesData.results[0].artworkUrl100) {
                    cover = itunesData.results[0].artworkUrl100.replace('100x100', '400x400');
                }
                
                if (discImg) {
                    discImg.src = cover;
                    discImg.classList.add("rotating");
                }
            })
            .catch(() => {
                if (discImg) {
                    discImg.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
                    discImg.classList.add("rotating");
                }
            });
    } catch (e) {
        // Silencioso
    }
}

function iniciarActualizacionRadioUnificada() {
    detenerActualizacionRadioUnificada();
    
    const radioUrl = "https://server01.heplayer.com:7068/stats?sid=1";
    
    const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(radioUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(radioUrl)}`
    ];

    async function obtenerDatosDelServidor() {
        if (modoActual !== "radio") {
            detenerActualizacionRadioUnificada();
            return;
        }

        let xmlText = "";
        
        for (const proxyUrl of proxies) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                
                const response = await fetch(proxyUrl, { 
                    cache: 'no-store',
                    signal: controller.signal 
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    if (proxyUrl.includes('allorigins')) {
                        const data = await response.json();
                        xmlText = data.contents;
                    } else {
                        xmlText = await response.text();
                    }
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!xmlText) return;

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");

            // 1. ACTUALIZAR CONTADOR
            const listenersNode = xmlDoc.getElementsByTagName("CURRENTLISTENERS")[0];
            const listeners = listenersNode ? listenersNode.textContent.trim() : "0";
            if (contadorElemento) contadorElemento.textContent = listeners;

            // 2. ACTUALIZAR METADATOS
            const titleNode = xmlDoc.getElementsByTagName("SONGTITLE")[0];
            const rawTitle = titleNode ? titleNode.textContent : "";
            const cleanedTitle = rawTitle.trim().replace(/AUTODJ/gi, '').replace(/\|\s*$/g, '').trim();

            if (!cleanedTitle || cleanedTitle.toLowerCase().includes('offline')) {
                if (metaTrack) metaTrack.textContent = "🔊 Radio en vivo";
                return;
            }

            if (cleanedTitle !== lastTrackTitleRadio) {
                lastTrackTitleRadio = cleanedTitle;
                
                if (metaTrack) metaTrack.textContent = cleanedTitle;

                const songtitleSplit = cleanedTitle.split(/ - | – /);
                let artist = "Radio";
                let title = cleanedTitle; 

                if (songtitleSplit.length >= 2) {
                    artist = songtitleSplit[0].trim();
                    title = songtitleSplit.slice(1).join(' - ').trim(); 
                }

                // 3. ACTUALIZAR HISTORIAL
                const currentTrackTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const newHistoryEntry = { artist, title, time: currentTrackTime };

                if (trackHistory.length === 0 || trackHistory[0].title !== title) {
                    trackHistory.unshift(newHistoryEntry);
                    if (trackHistory.length > 20) trackHistory.pop();
                }

                // 4. ACTUALIZAR CARÁTULA
                obtenerCaratulaDesdeiTunesUnificada(artist, title);
            }
        } catch (error) {
            // Silencioso al parsear
        }
    }

    obtenerDatosDelServidor();
    radioUpdateIntervalId = setInterval(obtenerDatosDelServidor, 15000);
}

// ===============================
// 🔄 ALTERNANCIA DE MODOS
// ===============================
if (btnRadio) {
    btnRadio.addEventListener("click", () => {
        if (!gestureDetected) { 
            gestureDetected = true; 
            audio.muted = false;
        } 

        if (modoActual === "radio") {
            activarModoLocal();
        } else {
            activarModoRadio();
        }
        actualizarMetaModo();
        actualizarBotonRadio();
    });
}

function activarModoRadio() {
    modoActual = "radio";
    
    detenerActualizacionRadioUnificada();
    
    if (currentArtistName) currentArtistName.textContent = "Conectando...";
    if (currentTrackName) currentTrackName.textContent = "Obteniendo datos...";
    if (metaTrack) metaTrack.textContent = "🔊 Modo Radio Activo";
    
    if (discImg) {
        discImg.src = "https://santi-graphics.vercel.app/assets/img/Plato.png";
        discImg.classList.add("rotating");
    }
    
    audio.pause();
    audio.src = "https://server01.heplayer.com:7068/stream";
    audio.load();

    if (!gestureDetected) {
        audio.muted = true;
    } else {
        audio.muted = false;
    }
    
    audio.play().then(() => {
        if (iconPlay) iconPlay.classList.add("hidden");
        if (iconPause) iconPause.classList.remove("hidden");
    }).catch(err => {
        if (err.name !== 'NotAllowedError') {
            console.warn("🔒 Error al iniciar Radio:", err);
        }
    });

    iniciarActualizacionRadioUnificada();
}

function activarModoLocal() {
    modoActual = "local";
    
    detenerActualizacionRadioUnificada(); 
    
    audio.pause(); 
    if (discImg) discImg.classList.remove("rotating");
    audio.muted = !gestureDetected;
    
    if (iconPause) iconPause.classList.add("hidden");
    if (iconPlay) iconPlay.classList.remove("hidden"); 
    
    cargarTracksDesdeJSON(); 
}

function actualizarMetaModo() {
    if (metaTrack) {
        metaTrack.textContent = modoActual === "radio" ? "🔊 Modo Radio activo" : "🎶 Modo Local activo";
    }
}

function actualizarBotonRadio() {
    const btn = document.getElementById("btn-radio");
    if (btn) {
        if (modoActual === "radio") {
            btn.style.backgroundColor = "#9400D350";
            btn.style.borderColor = "#9400D3";
        } else {
            btn.style.backgroundColor = "#3688ff50";
            btn.style.borderColor = "#3688ff";
        }
    }
}

// ===============================
// 🧭 INICIALIZACIÓN Y GESTOS
// ===============================
function inicializarReproductor() {
    if (modoActual === "radio") {
        if (currentTrackName) currentTrackName.textContent = "Conectando Radio...";
        if (metaTrack) metaTrack.textContent = "🔊 Modo Radio Activo";
        actualizarBotonRadio();
        if (discImg) {
            discImg.src = "https://santi-graphics.vercel.app/assets/img/Plato.png";
            discImg.classList.add("rotating");
        }
        activarModoRadio();
    } else {
        cargarTracksDesdeJSON();
    }
}

document.addEventListener("click", () => {
    if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false; 

        if (audio.src && audio.paused) {
            audio.play().then(() => {
                if (iconPlay) iconPlay.classList.add("hidden");
                if (iconPause) iconPause.classList.remove("hidden");
                if (discImg) discImg.classList.add("rotating");
            });
        }
        
        if (!audio.paused && modoActual === "radio") {
             if (iconPlay) iconPlay.classList.add("hidden");
             if (iconPause) iconPause.classList.remove("hidden");
        }
    }
}, { once: true }); 

document.addEventListener("DOMContentLoaded", () => {
    inicializarReproductor();
    inicializarVolumen();
    
    if (audio) {
        audio.muted = true;
        audio.muted = false;
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            if (!audio.src) {
                console.warn("⚠️ No hay fuente de audio (audio.src) definida para reproducir.");
                return;
            }

            if (!gestureDetected) {
                gestureDetected = true;
                audio.muted = false;
            }

            if (audio.paused || audio.ended) {
                audio.play().then(() => {
                    if (iconPlay) iconPlay.classList.add("hidden");
                    if (iconPause) iconPause.classList.remove("hidden");
                    if (discImg) discImg.classList.add("rotating");
                }).catch(err => {
                    console.warn("⚠️ Error al reanudar:", err);
                });
            } else {
                audio.pause();
                if (iconPause) iconPause.classList.add("hidden");
                if (iconPlay) iconPlay.classList.remove("hidden");
                if (discImg) discImg.classList.remove("rotating");
            }
        });
    }

    if (nextBtn) nextBtn.addEventListener('click', nextTrack);
    if (prevBtn) prevBtn.addEventListener('click', prevTrack);
    if (shuffleBtn) shuffleBtn.addEventListener('click', toggleShuffle);
    if (repeatBtn) repeatBtn.addEventListener('click', toggleRepeat);

    if (audio) {
        audio.onended = () => {
            if (modoActual !== "local") return;
            if (audio.loop) return;
            nextTrack();
        };
    }
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            toggleModal(true);
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            toggleModal(false);
        });
    }

    if (modalTracks) {
        modalTracks.addEventListener('click', (e) => {
            if (e.target === modalTracks) {
                toggleModal(false);
            }
        });
    }
}); 

// ===============================
// ➡️ FUNCIÓN AVANZAR (NEXT)
// ===============================
function nextTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;

    if (currentTrack === null) currentTrack = 0;

    if (isShuffling) {
        let newIndex;
        if (trackData.length > 1) trackHistory.push(currentTrack);

        do {
            newIndex = Math.floor(Math.random() * trackData.length);
        } while (newIndex === currentTrack && trackData.length > 1);
        
        activarReproduccion(newIndex, "shuffle");
    } else {
        let nextIndex = (currentTrack + 1) % trackData.length;
        activarReproduccion(nextIndex, "next");
    }
}

// ===============================
// ⬅️ FUNCIÓN RETROCEDER (PREVIOUS)
// ===============================
function prevTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;

    let prevIndex;

    if (isShuffling && trackHistory.length > 0) {
        if (trackHistory.length > 0 && trackHistory[trackHistory.length - 1] === currentTrack) {
            trackHistory.pop(); 
        }
        prevIndex = trackHistory.pop();
    } else {
        prevIndex = (currentTrack - 1 + trackData.length) % trackData.length;
    }
    
    if (prevIndex !== undefined) {
        activarReproduccion(prevIndex, "prev");
    }
}

// ===============================
// 🔁 FUNCIÓN REPETIR (REPEAT)
// ===============================
function toggleRepeat() {
    if (repeatMode !== "one") {
        repeatMode = "one";
        if (repeatBtn) {
            repeatBtn.classList.add("active-one");
            repeatBtn.classList.remove("active-all"); 
        }
        audio.loop = true;
    } else {
        repeatMode = "none";
        if (repeatBtn) repeatBtn.classList.remove("active-one");
        audio.loop = false;
    }
}

// ===============================
// 🔀 FUNCIÓN ALEATORIO (SHUFFLE)
// ===============================
function toggleShuffle() {
    isShuffling = !isShuffling;

    if (isShuffling) {
        if (shuffleBtn) shuffleBtn.classList.add("active");
        trackHistory = [currentTrack];
        
        if (modoActual === "local" && trackData.length > 1) {
            nextTrack();
        }
    } else {
        if (shuffleBtn) shuffleBtn.classList.remove("active");
        trackHistory = [];
    }
}

// ===============================
// 🪟 FUNCIÓN DE GENERACIÓN Y MANEJO DEL MODAL
// ===============================
function generarListaModal() {
    if (!trackList) return;

    trackList.innerHTML = ''; 
    
    if (modoActual === "radio") {
        if (currentTrackNameModal) currentTrackNameModal.textContent = "Historial de Radio (Últimas 20)";
        
        if (trackHistory.length === 0) {
            const li = document.createElement('li');
            li.textContent = "Esperando la primera actualización de pista...";
            trackList.appendChild(li);
            return;
        }

        trackHistory.forEach((track) => {
            const li = document.createElement('li');
            li.textContent = `${track.time} | ${track.artist} - ${track.title}`; 
            trackList.appendChild(li);
        });

    } else if (modoActual === "local") {
        if (currentTrackNameModal) currentTrackNameModal.textContent = "Lista de Pistas Locales";
        
        if (trackData.length === 0) return;

        trackData.forEach((track, index) => {
            const li = document.createElement('li');
            li.setAttribute('data-index', index);
            li.textContent = `${index + 1}. ${track.name}`;

            li.addEventListener('click', () => {
                if (modoActual !== "local") return; 
                
                const selectedIndex = parseInt(li.getAttribute('data-index'));
                activarReproduccion(selectedIndex, "modal-click");
                toggleModal(false);
            });

            trackList.appendChild(li);
        });
        actualizarModalActualTrack(); 
    }
}
    
// ===============================
// 🔒 FUNCIÓN ABRIR/CERRAR MODAL
// ===============================
function toggleModal(show) {
    if (!modalTracks) return; 

    if (show) {
        modalTracks.classList.remove('hidden');
        generarListaModal();

        document.addEventListener("click", cerrarPorOutside);
        document.addEventListener("keydown", cerrarPorEsc);
    } else {
        modalTracks.classList.add('hidden');
        document.removeEventListener("click", cerrarPorOutside);
        document.removeEventListener("keydown", cerrarPorEsc);
    }
}

function cerrarPorOutside(e) {
    const reproBox = document.querySelector(".repro-box");
    if (!reproBox) return;

    if (!reproBox.contains(e.target)) {
        toggleModal(false);
    }
}

function cerrarPorEsc(e) {
    if (e.key === "Escape") {
        toggleModal(false);
    }
}

// ===============================
// 💡 FUNCIÓN DE RESALTADO DE PISTA ACTIVA
// ===============================
function actualizarModalActualTrack() {
    if (modoActual !== 'local' || trackData.length === 0) return;

    document.querySelectorAll('.track-list li').forEach(li => {
        li.classList.remove('active-track');
    });
    
    const currentTrackItem = document.querySelector(`.track-list li[data-index="${currentTrack}"]`);
    if (currentTrackItem) {
        currentTrackItem.classList.add('active-track');
        currentTrackItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    if (currentTrackNameModal && currentTrack !== null) {
        currentTrackNameModal.textContent = trackData[currentTrack].name;
    }
}

// ===============================
// 🔊 FUNCIÓN DE CONTROL DE VOLUMEN
// ===============================
function actualizarBarraVolumen(volume) {
    const percentage = volume * 100;
    if (volumeBar) {
        volumeBar.style.setProperty('--p', percentage + '%');
    }
}

function inicializarVolumen() {
    const initialVolume = 70; 
    const audioVolume = initialVolume / 100;

    if (volumeBar) {
        volumeBar.value = initialVolume;
        actualizarBarraVolumen(audioVolume);
        
        if (audio) {
            audio.volume = audioVolume;
        }

        volumeBar.addEventListener('input', () => {
            const newVolume = volumeBar.value / 100;
            
            if (audio) {
                audio.volume = newVolume;
            }
            
            actualizarBarraVolumen(newVolume);

            if (volumeIcon) {
                volumeIcon.className = (newVolume === 0) ? 
                    'fas fa-volume-mute volume-icon' : 
                    'fas fa-volume-down volume-icon';
            }
        });
    }
}

// ==================================
// INFORMACIÓN FECHA Y HORA (modular)
// ==================================
(() => {
  const STATE = { intervalId: null, selector: '#info-time-text' };
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  function formatear(now) {
    const diaSemana = diasSemana[now.getDay()];
    const diaMes = String(now.getDate()).padStart(2,'0');
    const mes = meses[now.getMonth()];
    const anio = now.getFullYear();
    const horas = String(now.getHours()).padStart(2,'0');
    const minutos = String(now.getMinutes()).padStart(2,'0');
    return `${diaSemana} ${diaMes} de ${mes}, ${anio} | ${horas}:${minutos}`;
  }

  function tick(el) {
    el.textContent = formatear(new Date());
  }

  function start(selector = STATE.selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (STATE.intervalId) clearInterval(STATE.intervalId);
    tick(el);
    STATE.intervalId = setInterval(() => tick(el), 60000);
  }

  document.addEventListener('DOMContentLoaded', () => start());

  window.InfoTime = {
    start,
    stop: () => { if (STATE.intervalId) clearInterval(STATE.intervalId); STATE.intervalId = null; }
  };
})();

// ==================================
// Mostrar mensaje al hacer clic derecho
// ==================================
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);
});