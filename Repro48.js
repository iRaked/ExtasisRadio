// ======================================================
// 🎧 1. INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
// ======================================================
const API_RADIO = "https://antyserv.in:8094/stats?sid=1&json=1";
const STREAM_URL = "https://antyserv.in:8094/stream";

let trackData = [];
let currentTrack = 0;
let modoActual = "radio"; //local-radio
let archivoActivo = "Actual.json";
let gestureDetected = false;
let audio = document.getElementById("player");
let intervalMetadata = null;
let trackHistory = [];
let isShuffling = false;
let repeatMode = "none";
let contadorIntervalId = null;

// Referencias DOM
const playPauseBtn = document.getElementById("btn-play-pause");
const nextBtn = document.getElementById("next-button");
const prevBtn = document.getElementById("prev-button");
const shuffleBtn = document.getElementById("shuffle-button");
const repeatBtn = document.getElementById("repeat-button");
const btnRadio = document.getElementById("btn-radio");
const menuBtn = document.getElementById("btn-menu-tracks");
const discImg = document.getElementById("disc-img");
const currentTrackName = document.getElementById("current-track-name");
const currentArtistName = document.getElementById("current-artist-name");
const modalTracks = document.getElementById("modal-tracks");
const trackList = document.querySelector(".track-list");
const currentTrackNameModal = document.getElementById('current-track-name-modal');
const volumeBar = document.getElementById("volumeBar");
const contadorElemento = document.getElementById("contadorRadio");

// ======================================================
// 🔓 2. BLOQUE: PRIMER GESTO (DESBLOQUEO DE AUDIO)
// ======================================================
const unlockAudio = () => {
    if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;
        
        if (modoActual === "radio") {
            activarReproduccion(0, "manual");
        } else if (trackData.length > 0) {
            activarReproduccion(currentTrack, "manual");
        }
        console.log("🔊 Audio desbloqueado por interacción del usuario.");
    }
};

document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("touchstart", unlockAudio, { once: true });

// ======================================================
// 📦 3. BLOQUE: CARGA Y NORMALIZACIÓN DE DATOS (JSON)
// ======================================================
function cargarTracksDesdeJSON(archivo = "Actual.json", nombreLista = "Novedades") {
    const URL_BASE = "https://radio-tekileros.vercel.app/";
    fetch(`${URL_BASE}${archivo}`)
        .then(res => res.ok ? res.json() : Promise.reject(`Error: ${res.status}`))
        .then(data => {
            const rootKey = Object.keys(data).find(key => Array.isArray(data[key]));
            const pistasRaw = data[rootKey];
            if (!pistasRaw) return;

            trackData = pistasRaw.map(p => ({
                name: p.nombre || "Sin Título",
                artist: p.artista || "Artista Desconocido",
                cover: p.caratula || "https://santi-graphics.vercel.app/assets/covers/Cover1.png",
                url: p.dropbox_url || p.enlace || ""
            })).filter(t => t.url !== "");

            archivoActivo = archivo;
            currentTrack = 0;
            activarReproduccion(0, "initial-load"); 
        })
        .catch(err => console.error("❌ Error en JSON:", err));
}

// ======================================================
// 📻 4. MODO RADIO: LOGICA DE CONTROL Y METADATOS
// ======================================================
let radioIntervalId = null;
let lastTrackTitle = "";

function detenerActualizacionRadio() {
    if (radioIntervalId !== null) {
        clearInterval(radioIntervalId);
        radioIntervalId = null;
        console.log("📻 Actualización de radio detenida.");
    }
}

async function buscarCaratulaiTunes(artista, titulo) {
    // 1. Limpieza profunda del título para mejorar la puntería de iTunes
    let tituloLimpio = titulo.toLowerCase()
        .replace(/\(v[ií]deoclip.*\)/gi, '')
        .replace(/\[v[ií]deoclip.*\]/gi, '')
        .replace(/\(official.*\)/gi, '')
        .replace(/\[official.*\]/gi, '')
        .replace(/\(en vivo.*\)/gi, '')
        .replace(/hd|4k|official|video|audio|lyric/gi, '')
        .trim();

    // 2. Si el artista se repite en el título (como en tu log), lo quitamos
    let artistaLimpio = artista.toLowerCase().trim();
    if (tituloLimpio.startsWith(artistaLimpio)) {
        tituloLimpio = tituloLimpio.replace(artistaLimpio, '').replace(/^[\s-–]+/, '').trim();
    }

    const term = encodeURIComponent(`${artistaLimpio} ${tituloLimpio}`);
    const url = `https://itunes.apple.com/search?term=${term}&media=music&limit=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            // Devolvemos la imagen en alta resolución
            return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
        }
    } catch (error) { 
        console.error("❌ Error iTunes API:", error); 
    }
    
    // Si falla o no encuentra, plato por defecto
    return "https://santi-graphics.vercel.app/assets/img/Plato.png";
}

function iniciarActualizacionRadio() {
    detenerActualizacionRadio(); 
    if (typeof $ === 'undefined') return;

    const radioUrl = "https://antyserv.in:8094/stats?sid=1&json=1";

    async function actualizarDesdeServidor() {
        if (modoActual !== "radio") { detenerActualizacionRadio(); return; }

        $.ajax({
            dataType: 'jsonp',
            url: radioUrl,
            success: async function(data) {
                if (modoActual !== "radio") return;

                const rawTitle = data.songtitle || "";
                const cleanedTitle = rawTitle.trim()
                    .replace(/SANTI MIX DJ/gi, '').replace(/BY\s+[A-Z0-9]+/gi, '')
                    .replace(/\|\s*$/g, '').trim();

                if (!cleanedTitle || cleanedTitle === lastTrackTitle || cleanedTitle.toLowerCase().includes('offline')) return;
                
                lastTrackTitle = cleanedTitle;
                const songtitleSplit = cleanedTitle.split(/ - | – /);
                let artist = songtitleSplit.length >= 2 ? songtitleSplit[0].trim() : "Radio";
                let title = songtitleSplit.length >= 2 ? songtitleSplit.slice(1).join(' - ').trim() : cleanedTitle;

                // --- 🔍 LOG DE CONTROL ---
                console.log(`🎵 Buscando en iTunes: ${artist} - ${title}`);

                // 1. ESPERAMOS LA CARÁTULA
                let coverUrl;
                try {
                    coverUrl = await buscarCaratulaiTunes(artist, title);
                    console.log("📸 Resultado iTunes:", coverUrl);
                } catch (e) {
                    coverUrl = "https://santi-graphics.vercel.app/assets/img/Plato.png";
                }

                // 2. CREAMOS EL OBJETO CON LA DATA REAL
                const nuevoRegistro = { 
                    title: title, 
                    artist: artist, 
                    cover: coverUrl, 
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                };

                // 3. ACTUALIZAMOS EL HISTORIAL (Asegúrate de que trackHistory esté definido al inicio del JS)
                if (typeof trackHistory !== 'undefined') {
                    trackHistory.unshift(nuevoRegistro);
                    if (trackHistory.length > 20) trackHistory.pop();
                }

                // 4. ACTUALIZAMOS LA INTERFAZ
                const metaContainer = document.getElementById("meta-track");
                const discImg = document.getElementById("disc-img");
                
                if (metaContainer) metaContainer.textContent = `${title} - ${artist} - [AUTO DJ]`;
                
                // Si tienes un elemento de carátula principal, se actualiza aquí:
                if (discImg) {
                    discImg.src = coverUrl;
                    discImg.onerror = function() { this.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png'; };
                }

                // 5. SI EL MODAL ESTÁ ABIERTO, RE-RENDERIZAMOS EL CONTENIDO
                if (typeof modalTracks !== 'undefined' && !modalTracks.classList.contains('hidden')) {
                    generarContenidoModalContextual();
                }
            }
        });
    }
    actualizarDesdeServidor();
    radioIntervalId = setInterval(actualizarDesdeServidor, 12000);
}

// Función auxiliar para refrescar el historial sin disparar el toggle del modal
function actualizarListaSinAbrir() {
    if (!trackList || modoActual !== "radio") return;
    trackList.innerHTML = trackHistory.slice(0, 20).map((t, i) => {
        const portada = t.cover || "https://santi-graphics.vercel.app/assets/img/Plato.png";
        return `
        <li class="history-item ${i === 0 ? 'active-track' : ''}">
            <div class="modal-thumb-container">
                <img src="${portada}" class="modal-track-img" onerror="this.src='https://santi-graphics.vercel.app/assets/img/Plato.png'">
            </div>
            <div class="modal-track-info">
                <span class="modal-track-title">${t.title}</span>
                <span class="modal-track-artist">${t.artist} ${t.time ? ' • ' + t.time : ''}</span>
            </div>
        </li>`;
    }).join('');
}

// ======================================================
// 🎶 5. BLOQUE: MOTOR DE REPRODUCCIÓN (SIN ERRORES)
// ======================================================
function activarReproduccion(index = 0, modoAccion = "manual") {
    // Validamos que la función exista antes de llamarla para evitar el crash
    if (typeof detenerActualizacionRadio === 'function') detenerActualizacionRadio();
    if (typeof detenerContadorAudiencia === 'function') detenerContadorAudiencia();
    
    const metaContainer = document.getElementById("meta-track");
    const genreElement = document.getElementById("track-genre");
    if (metaContainer) metaContainer.textContent = "Cargando..."; 
    if (genreElement) genreElement.textContent = "";
    lastTrackTitle = ""; 

    audio.pause();
    audio.src = "";
    const nextBtn = document.getElementById("next-button");
    const prevBtn = document.getElementById("prev-button");

    if (modoActual === "radio") {
        audio.src = STREAM_URL;
        audio.loop = false;
        if (typeof iniciarActualizacionRadio === 'function') iniciarActualizacionRadio();
        if (typeof iniciarContadorAudiencia === 'function') iniciarContadorAudiencia();
        if (nextBtn) nextBtn.style.opacity = "0.3";
        if (prevBtn) prevBtn.style.opacity = "0.3";
    } else {
        if (!trackData || trackData.length === 0) return;
        currentTrack = index;
        const track = trackData[index];
        audio.src = track.url;
        audio.loop = (repeatMode === "one");

        if (metaContainer) {
            const nombre = track.name || "Sin Título";
            const artista = track.artist || "Artista Desconocido";
            metaContainer.textContent = `${nombre} - ${artista} - [CASINO DIGITAL]`;
            if (typeof aplicarMarquesina === 'function') aplicarMarquesina(metaContainer);
        }
        
        if (genreElement) genreElement.textContent = "LOCAL";
        if (typeof iniciarContadorAudiencia === 'function') iniciarContadorAudiencia();
        if (nextBtn) nextBtn.style.opacity = "1";
        if (prevBtn) prevBtn.style.opacity = "1";
    }

    if (audio.src !== "" && audio.src !== window.location.href) {
        audio.load();
        if (gestureDetected && modoAccion !== "initial-load") {
            audio.play().then(updateUIPlay).catch(e => console.log("Audio play deferred"));
        } else {
            updateUIStop();
        }
    }
}

// ======================================================
// 📈 6. BLOQUE: CONTADOR DE AUDIENCIA (MODO PERSISTENTE)
// ======================================================

function detenerContadorAudiencia() {
    if (window.contadorIntervalId !== null) {
        clearInterval(window.contadorIntervalId);
        window.contadorIntervalId = null;
    }
}

function iniciarContadorAudiencia() {
    detenerContadorAudiencia();
    
    const contadorElemento = document.getElementById("contadorRadio");
    if (!contadorElemento) return;

    const statsUrl = "https://antyserv.in:8094/stats?sid=1&json=1";

    const actualizarContador = () => {
        // SOLO HACEMOS LA PETICIÓN SI ESTAMOS EN RADIO
        // Si estamos en LOCAL, no hacemos nada (mantiene el último número que tenga el SPAN)
        if (modoActual === "radio") {
            if (typeof $ !== 'undefined' && typeof $.ajax !== 'undefined') {
                $.ajax({
                    dataType: 'jsonp',
                    url: statsUrl,
                    success: function(data) {
                        // Actualiza con los oyentes reales
                        contadorElemento.textContent = data.currentlisteners || "1";
                    },
                    error: function() { 
                        // Si falla la conexión, ponemos 1 por defecto para no dejarlo vacío
                        if (contadorElemento.textContent === "...") {
                            contadorElemento.textContent = "1";
                        }
                    },
                    timeout: 8000
                });
            }
        } 
        // Nota: Si modoActual es "local", simplemente no entra al IF 
        // y el <span> conserva lo que ya tenía escrito.
    };

    // Si el contador está vacío (primera carga), ponemos puntos suspensivos
    if (!contadorElemento.textContent.trim()) {
        contadorElemento.textContent = "...";
    }

    actualizarContador();
    // Seguimos pidiendo datos cada 15 segundos para que, aunque estés en LOCAL,
    // el contador de la radio se actualice en segundo plano si así lo deseas.
    // Si NO quieres que gaste datos en local, mete el setInterval dentro del IF.
    window.contadorIntervalId = setInterval(actualizarContador, 15000);
}

// ======================================================
// 🔘 7. BLOQUE: BOTONERA Y CONTROLES (OPERACIÓN INMEDIATA)
// ======================================

// --- 5.1 SHUFFLE: Salto inmediato SOLO al activarse ---
if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
        isShuffling = !isShuffling;
        
        if (isShuffling) {
            // 1. Activar visualmente
            shuffleBtn.classList.add("active");
            
            // 2. Acción Inmediata: Solo salta si se ACABA de activar
            if (modoActual === "local" && trackData.length > 0) {
                console.log("🔀 Shuffle ACTIVADO: Saltando a pista aleatoria...");
                nextTrack(); 
            }
        } else {
            // 3. Desactivar visualmente (No hace nada más, se queda en la canción actual)
            shuffleBtn.classList.remove("active");
            console.log("➡️ Shuffle DESACTIVADO: Se mantiene el orden secuencial.");
        }
    });
}

// --- 5.2 REPEAT: Forzado de bucle instantáneo ---
if (repeatBtn) {
    repeatBtn.addEventListener("click", () => {
        if (repeatMode === "none") {
            repeatMode = "one";
            repeatBtn.classList.add("active-one");
            if (modoActual === "local") audio.loop = true; 
        } else {
            repeatMode = "none";
            repeatBtn.classList.remove("active-one");
            if (modoActual === "local") audio.loop = false;
        }
        console.log(`🔁 Repeat: ${repeatMode} | Audio Loop: ${audio.loop}`);
    });
}

// --- 5.3 Navegación de Tracks ---
function nextTrack() {
    if (modoActual === "radio" || trackData.length === 0) return;
    
    let nextIndex;
    if (isShuffling) {
        // Lógica de azar real: busca uno distinto al actual
        nextIndex = Math.floor(Math.random() * trackData.length);
        if (nextIndex === currentTrack && trackData.length > 1) {
            nextIndex = (nextIndex + 1) % trackData.length;
        }
    } else {
        nextIndex = (currentTrack + 1) % trackData.length;
    }
    activarReproduccion(nextIndex);
}

function prevTrack() {
    if (modoActual === "radio" || trackData.length === 0) return;
    let prevIndex = (currentTrack - 1 + trackData.length) % trackData.length;
    activarReproduccion(prevIndex);
}

// --- 5.4 Control Play/Pause y UI ---
if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
        if (!gestureDetected) unlockAudio();
        if (audio.paused) audio.play().then(updateUIPlay).catch(e => console.error("Error Play:", e));
        else { audio.pause(); updateUIStop(); }
    });
}

function updateUIPlay() {
    if (discImg) discImg.classList.add("rotating");
    const iconPlay = playPauseBtn?.querySelector(".icon-play");
    const iconPause = playPauseBtn?.querySelector(".icon-pause");
    if (iconPlay) iconPlay.classList.add("hidden");
    if (iconPause) iconPause.classList.remove("hidden");
}

function updateUIStop() {
    if (discImg) discImg.classList.remove("rotating");
    const iconPlay = playPauseBtn?.querySelector(".icon-play");
    const iconPause = playPauseBtn?.querySelector(".icon-pause");
    if (iconPause) iconPause.classList.add("hidden");
    if (iconPlay) iconPlay.classList.remove("hidden");
}

// --- 5.5 Listener de Fin de Pista ---
if (audio) {
    audio.onended = () => {
        if (modoActual === "local") {
            // Si el modo repeat 'one' fallara por el navegador, nextTrack lo rescata
            if (repeatMode !== "one") {
                nextTrack();
            } else {
                audio.play(); // Re-asegurar el loop
            }
        }
    };
}

// Vinculación final
if (nextBtn) nextBtn.onclick = nextTrack;
if (prevBtn) prevBtn.onclick = prevTrack;

// ======================================================
// 🪟 8. BLOQUE: MODALES Y SELECTORES (CONTEXTUAL)
// ======================================================

function toggleModal(show) {
    if (!modalTracks) return;
    show ? modalTracks.classList.remove('hidden') : modalTracks.classList.add('hidden');
}

// --- 8.1 CIERRES UNIVERSALES ---
document.addEventListener('keydown', (e) => { if (e.key === "Escape") toggleModal(false); });

if (modalTracks) {
    modalTracks.addEventListener('click', (e) => {
        if (e.target === modalTracks) toggleModal(false);
    });
    
    const closeBtn = modalTracks.querySelector('#close-modal');
    if (closeBtn) closeBtn.onclick = () => toggleModal(false);
}

// --- 8.2 SELECTOR DE FUENTES (Botón Nota) ---
function abrirSelectorDeCanales() {
    if (!trackList) return;
    if (currentTrackNameModal) currentTrackNameModal.textContent = "Sintonizar Señal";

    const opciones = [
        { id: "radio", nombre: "RADIO EN VIVO", desc: "Streaming Directo", img: "https://santi-graphics.vercel.app/assets/img/Plato.png" },
        { id: "Actual.json", nombre: "NOVEDADES", desc: "Listado 1", img: "https://santi-graphics.vercel.app/assets/covers/Cover2.png" },
        { id: "Exitos.json", nombre: "ÉXITOS", desc: "Listado 2", img: "https://santi-graphics.vercel.app/assets/covers/Cover6.png" }
    ];

    trackList.innerHTML = opciones.map(opt => `
        <li class="canal-option ${modoActual === 'radio' && opt.id === 'radio' ? 'active-track' : ''}" data-id="${opt.id}">
            <div class="modal-thumb-container"><img src="${opt.img}" class="modal-track-img"></div>
            <div class="modal-track-info">
                <span class="modal-track-title">${opt.nombre}</span>
                <span class="modal-track-artist">${opt.desc}</span>
            </div>
        </li>
    `).join('');

    trackList.querySelectorAll('.canal-option').forEach(li => {
        li.onclick = () => {
            const id = li.getAttribute('data-id');
            if (id === "radio") {
                modoActual = "radio";
                activarReproduccion();
            } else {
                modoActual = "local";
                cargarTracksDesdeJSON(id);
            }
            toggleModal(false);
        };
    });
    toggleModal(true);
}

// --- 8.3 LISTA DINÁMICA (Botón Menú) ---
function generarContenidoModalContextual() {
    if (!trackList) return;

    // 1. MODO LOCAL
    if (modoActual === "local") {
        if (currentTrackNameModal) currentTrackNameModal.textContent = "Lista de Reproducción";
        
        if (!trackData || trackData.length === 0) {
            trackList.innerHTML = `<li class="no-history">No hay canciones cargadas.</li>`;
        } else {
            trackList.innerHTML = trackData.map((t, i) => `
                <li class="${i === currentTrack ? 'active-track' : ''}" onclick="activarReproduccion(${i}, 'manual'); toggleModal(false);">
                    <div class="modal-thumb-container">
                        <img src="${t.cover || 'https://santi-graphics.vercel.app/assets/img/Plato.png'}" class="modal-track-img" onerror="this.src='https://santi-graphics.vercel.app/assets/img/Plato.png'">
                    </div>
                    <div class="modal-track-info">
                        <span class="modal-track-title">${i + 1}. ${t.name || 'Sin título'}</span>
                        <span class="modal-track-artist">${t.artist || 'Artista desconocido'}</span>
                    </div>
                </li>
            `).join('');
        }
    } 
    // 2. MODO RADIO
    else {
        if (currentTrackNameModal) currentTrackNameModal.textContent = "Recientemente en Radio";
        
        if (!trackHistory || trackHistory.length === 0) {
            trackList.innerHTML = `<li class="no-history">Esperando metadatos del servidor...</li>`;
        } else {
            // Renderizamos los últimos 20 tracks del historial
            trackList.innerHTML = trackHistory.slice(0, 20).map((t, i) => {
                // Prioridad: Carátula de iTunes (t.cover) -> Plato por defecto
                const portada = t.cover || "https://santi-graphics.vercel.app/assets/img/Plato.png";
                const titulo = t.title || "Sintonizando...";
                const artista = t.artist || "Radio en Vivo";
                const hora = t.time || "";

                return `
                <li class="history-item ${i === 0 ? 'active-track' : ''}">
                    <div class="modal-thumb-container">
                        <img src="${portada}" 
                             class="modal-track-img" 
                             alt="Cover"
                             onerror="this.src='https://santi-graphics.vercel.app/assets/img/Plato.png'; this.onerror=null;">
                    </div>
                    <div class="modal-track-info">
                        <span class="modal-track-title">${titulo}</span>
                        <span class="modal-track-artist">${artista} ${hora ? ' • ' + hora : ''}</span>
                    </div>
                </li>`;
            }).join('');
        }
    }
    // Abrimos el modal solo si la función no fue llamada de forma interna (opcional)
    toggleModal(true);
}

// ===============================
// 🔊 9. FUNCIÓN DE CONTROL DE VOLUMEN
// ===============================

/**
 * Actualiza visualmente el carril del volumen y el icono
 * @param {number} volume - Valor decimal entre 0 y 1
 */
function actualizarBarraVolumen(volume) {
    const percentage = volume * 100;
    
    // COLORES IDENTIDAD RIVER
    const activeColor = '#ff0000';   // Rojo vibrante
    const inactiveColor = '#1a1a1a'; // Gris casi negro (fondo del carril)

    if (volumeBar) {
        // 1. Inyectamos la variable CSS para el gradiente dinámico
        volumeBar.style.setProperty('--v-pct', `${percentage}%`);
        
        // 2. Mantenemos el gradiente de respaldo por si el navegador lo requiere
        volumeBar.style.background = `linear-gradient(
            to right,
            ${activeColor} 0%,
            ${activeColor} ${percentage}%,
            ${inactiveColor} ${percentage}%,
            ${inactiveColor} 100%
        )`;
    }
}

function inicializarVolumen() {
    const initialVolume = 70; // Volumen inicial por defecto
    const audioVolume = initialVolume / 100;

    if (volumeBar) {
        // Configuramos estado inicial
        volumeBar.value = initialVolume;
        actualizarBarraVolumen(audioVolume);
        
        if (audio) {
            audio.volume = audioVolume;
        }

        // Evento de escucha para el movimiento del pibote
        volumeBar.addEventListener('input', () => {
            const newVolume = volumeBar.value / 100;
            
            if (audio) {
                audio.volume = newVolume;
            }
            
            // Sincronización visual inmediata
            actualizarBarraVolumen(newVolume);

            // Control de iconos dinámico (Mute / Down / Up)
            if (volumeIcon) {
                if (newVolume === 0) {
                    volumeIcon.className = 'fas fa-volume-mute volume-icon';
                    volumeIcon.style.color = '#555'; // Icono apagado
                } else if (newVolume < 0.5) {
                    volumeIcon.className = 'fas fa-volume-down volume-icon';
                    volumeIcon.style.color = '#fff';
                } else {
                    volumeIcon.className = 'fas fa-volume-up volume-icon';
                    volumeIcon.style.color = '#fff';
                }
            }
        });
    }
}

// ==================================
// 10. INFORMACIÓN FECHA Y HORA (modular)
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
    // Ej.: Viernes 07 de Noviembre, 2025 | 17:00
    return `${diaSemana} ${diaMes} de ${mes}, ${anio} | ${horas}:${minutos}`;
  }

  function tick(el) {
    el.textContent = formatear(new Date());
  }

  function start(selector = STATE.selector) {
    const el = document.querySelector(selector);
    if (!el) return; // sin ruido si aún no existe
    // Evita duplicados
    if (STATE.intervalId) clearInterval(STATE.intervalId);
    tick(el);
    STATE.intervalId = setInterval(() => tick(el), 60000);
  }

  // Arranque seguro cuando DOM esté listo
  document.addEventListener('DOMContentLoaded', () => start());

  // API mínima en window para reiniciar desde otros scripts si fuera necesario
  window.InfoTime = {
    start,
    stop: () => { if (STATE.intervalId) clearInterval(STATE.intervalId); STATE.intervalId = null; }
  };
})();

// ===============================================
// 💫 11. GESTIÓN DE EFECTOS VISUALES (NOTAS)
// ===============================================

function setupEfectosVisuales() {
    const contenedor = document.querySelector(".interfaz-estadio");
    if (!contenedor) return;

    // Evitar duplicados si la función se llama varias veces
    if (document.getElementById("burbujas")) return;

    // 1. Crear e inyectar el Canvas de las notas
    const canvas = document.createElement("canvas");
    canvas.id = "burbujas";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "2"; // Por encima del agua (z-index: 1)
    canvas.style.pointerEvents = "none"; // No bloquea los clics a la UI o al agua
    
    // Lo añadimos al contenedor (se renderiza sobre el fondo)
    contenedor.appendChild(canvas);

    // 2. Inicializar la animación
    inicializarNotasCanvas();
}

function inicializarNotasCanvas() {
    const canvas = document.getElementById("burbujas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Ajustar resolución interna al tamaño real
    const resize = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    const notasSimbolos = ["♪", "♫", "♩", "♬"];
    const particulas = [];

    // Generar 30 notas con variaciones de velocidad y opacidad
    for (let i = 0; i < 30; i++) {
        particulas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vel: Math.random() * 0.8 + 0.3, 
            simbolo: notasSimbolos[Math.floor(Math.random() * notasSimbolos.length)],
            size: Math.random() * 12 + 12,
            opacity: Math.random() * 0.9 + 0.3 
        });
    }

    function animar() {
        if (!document.getElementById("burbujas")) return; // Stop si el canvas se elimina
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particulas.forEach(p => {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.font = `${p.size}px Arial`;
            ctx.fillText(p.simbolo, p.x, p.y);
            
            p.y -= p.vel; // Movimiento ascendente
            
            // Resetear posición al salir de pantalla
            if (p.y < -20) {
                p.y = canvas.height + 20;
                p.x = Math.random() * canvas.width;
            }
        });
        requestAnimationFrame(animar);
    }
    animar();
}

// ===============================================
// 🌊 12. ACTIVACIÓN DE EFECTOS ESPECIALES (PIXI + RIPPLES)
// ===============================================

function inicializarEfectosAvanzados() {
    const $container = $('#pixi-container');
    if (!$container.length) return;

    // 1. Configuración de Estilo para Ripples
    // Forzamos el fondo aquí para que el plugin lo detecte y aplique el efecto
    $container.css({
        'position': 'absolute',
        'top': '0',
        'left': '0',
        'width': '100%',
        'height': '100%',
        'z-index': '1', // Capa base de fondo
        'background-image': 'url("assets/bg/Monumental.jpg")',
        'background-size': 'cover',
        'background-position': 'center',
        'pointer-events': 'auto' // Permite interactuar con las ondas
    });

    // 2. ACTIVAR EFECTO DE AGUA (JQuery Ripples)
    if ($.fn.ripples) {
        $container.ripples({
            resolution: 512,
            dropRadius: 20,
            perturbance: 0.04,
            interactive: true // MANUAL interactive: false
        });

        // Gotas automáticas para dar vida al estadio
        // ESTO ES LO QUE LO ACTIVA SOLO:
        setInterval(() => {
            if ($container.is(':visible')) {
                const x = Math.random() * $container.width();
                const y = Math.random() * $container.height();
                $container.ripples('drop', x, y, 15, 0.03);
            }
        }, 3000);
    }

    // 3. PIXI.JS (Opcional - Capa de partículas extra)
    // Solo se inicializa si necesitas partículas avanzadas de Pixi
    try {
        const app = new PIXI.Application({
            width: $container.width(),
            height: $container.height(),
            backgroundAlpha: 0, 
            resizeTo: document.querySelector(".interfaz-estadio")
        });
        $container.append(app.view);
        $(app.view).css({ 'position': 'absolute', 'top': '0', 'pointer-events': 'none' });
    } catch (e) {
        console.log("PIXI no inicializado: ", e);
    }
    
    console.log("🌊 Sistema visual sintonizado: Agua (Z1) y Notas (Z2).");
}

// ==================================
// 13. Mostrar mensaje al hacer clic derecho
// ==================================
document.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // evitar menú contextual
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  // Ocultar automáticamente después de unos segundos
  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);
});

// ======================================================
// 🚀 14. INICIALIZACIÓN FINAL (UNIFICADA)
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Carga inicial
    if (typeof cargarTracksDesdeJSON === 'function') {
        cargarTracksDesdeJSON("Actual.json");
    }
    
    // 2. Inicializar sistemas
    if (typeof iniciarContadorAudiencia === 'function') iniciarContadorAudiencia();
    if (typeof inicializarVolumen === 'function') inicializarVolumen();
    if (typeof inicializarEfectosAvanzados === 'function') inicializarEfectosAvanzados();
    if (typeof setupEfectosVisuales === 'function') setupEfectosVisuales();

    // 3. Asignación de Eventos (Sin duplicados)
    if (typeof btnRadio !== 'undefined' && btnRadio) {
        btnRadio.onclick = (e) => { e.preventDefault(); abrirSelectorDeCanales(); };
    }

    if (typeof menuBtn !== 'undefined' && menuBtn) {
        menuBtn.onclick = (e) => {
            e.preventDefault();
            if (typeof generarContenidoModalContextual === 'function') {
                generarContenidoModalContextual();
            }
        };
    }

    if (typeof nextBtn !== 'undefined' && nextBtn) nextBtn.onclick = nextTrack;
    if (typeof prevBtn !== 'undefined' && prevBtn) prevBtn.onclick = prevTrack;

}); // <--- ESTA LLAVE CIERRA EL DOMContentLoaded Y EL ARCHIVO