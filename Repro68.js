/* Repro65.js - VERSIÓN PURA RADIO (COMPLETA Y DEPURADA) */

// ===============================
// 1. INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
// ===============================
let gestureDetected = false;
let trackHistory = [];
let radioIntervalId = null; 
let lastTrackTitle = "";
let contadorIntervalId = null;

// ===============================
// 2. ELEMENTOS CLAVE DEL DOM
// ===============================
let audio = document.getElementById("player");
let playPauseBtn = document.getElementById("btn-play-pause");
let iconPlay = playPauseBtn ? playPauseBtn.querySelector(".icon-play") : null;
let iconPause = playPauseBtn ? playPauseBtn.querySelector(".icon-pause") : null;
let discImg = document.getElementById("disc-img");
let currentTrackName = document.getElementById("current-track-name");
let currentArtistName = document.getElementById("current-artist-name");
let metaTrack = document.getElementById("meta-track");
let volumeBar = document.getElementById("volumeBar");
let volumeIcon = document.getElementById("volumeIcon");
let contadorElemento = document.getElementById("contadorRadio");
let modalTracks = document.getElementById("modal-tracks");
let menuBtn = document.getElementById("btn-menu-tracks");
let closeModalBtn = document.getElementById("close-modal");
let trackList = document.querySelector(".track-list");
let currentTrackNameModal = document.getElementById('current-track-name') || document.getElementById('current-track-name-modal');

// ===============================
// 3. FUNCIONES AUXILIARES (Carátulas)
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

function formatArtist(artist) { 
    artist = artist.toLowerCase().trim();
    if (artist.includes(" &")) artist = artist.substr(0, artist.indexOf(' &'));
    else if (artist.includes("feat")) artist = artist.substr(0, artist.indexOf(' feat'));
    else if (artist.includes("ft.")) artist = artist.substr(0, artist.indexOf(' ft.'));
    return artist;
}

function formatTitle(title) { 
    title = title.toLowerCase().trim();
    if (title.includes("&")) title = title.replace('&', 'and');
    else if (title.includes("(")) title = title.substr(0, title.indexOf(' ('));
    else if (title.includes("ft")) title = title.substr(0, title.indexOf(' ft'));
    return title;
}

function obtenerCaratulaDesdeiTunes(artist, title) {
    if (typeof $ === 'undefined' || typeof $.ajax === 'undefined') {
        if (discImg) { discImg.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png'; discImg.classList.add("rotating"); }
        return;
    }
    const query = encodeURIComponent(`${formatArtist(artist)} ${formatTitle(title)}`);
    const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

    $.ajax({
        dataType: 'jsonp',
        url: url,
        success: function(data) {
            let cover = 'https://santi-graphics.vercel.app/assets/img/Plato.png';
            if (data.results && data.results.length >= 1) {
                cover = data.results[0].artworkUrl100.replace('100x100', '400x400');
            }
            if (discImg) { discImg.src = cover; discImg.classList.add("rotating"); }
        },
        error: function() {
            if (discImg) { discImg.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png'; discImg.classList.add("rotating"); }
        }
    });
}

// ===============================
// 4. LÓGICA DE METADATOS Y CONTADOR DE RADIO
// ===============================
function detenerActualizacionRadio() {
    if (radioIntervalId !== null) { clearInterval(radioIntervalId); radioIntervalId = null; }
}

function detenerContadorRadioescuchas() {
    if (contadorIntervalId !== null) { clearInterval(contadorIntervalId); contadorIntervalId = null; }
    if (contadorElemento) contadorElemento.textContent = "0";
}

function iniciarActualizacionRadio() {
    detenerActualizacionRadio();
    iniciarContadorRadioescuchas();

    const radioUrl = "https://radio.technoplayerserver.com:8048/stats?json=1";
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(radioUrl)}`;

    async function actualizarDesdeServidor() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(proxyUrl, { cache: 'no-cache', signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) return;

            const data = await response.json();
            const serverData = JSON.parse(data.contents); 
            if (!serverData) return;

            const rawTitle = serverData.songtitle ? serverData.songtitle.trim() : "";

            // FALLBACK DEFINITIVO SI NO HAY TÍTULO
            if (!rawTitle || rawTitle === "") {
                const fallbackText = "ESCUCHAS RADIO FREEDOM IN YOUR SOUL - EXPRESION TACTIL UNIVERSAL";
                if (currentArtistName) currentArtistName.textContent = "Radio";
                if (currentTrackName) currentTrackName.textContent = fallbackText;
                if (metaTrack) metaTrack.textContent = fallbackText;
                if (discImg) { discImg.src = 'https://santi-graphics.vercel.app/assets/img/Plato.png'; discImg.classList.add("rotating"); }
                lastTrackTitle = fallbackText;
                return; 
            }

            if (rawTitle === lastTrackTitle) return;
            lastTrackTitle = rawTitle;

            let artist = "Radio";
            let title = rawTitle;

            if (rawTitle.includes(" - ")) {
                const parts = rawTitle.split(" - ");
                artist = parts[0].trim();
                title = parts.slice(1).join(" - ").trim();
            }

            if (currentArtistName) currentArtistName.textContent = artist;
            if (currentTrackName) currentTrackName.textContent = title;
            if (metaTrack) metaTrack.textContent = `${artist} - ${title}`;
            
            obtenerCaratulaDesdeiTunes(artist, title);

            // Guardar en historial para el modal
            const currentTrackTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            trackHistory.unshift({ artist, title, time: currentTrackTime });
            if (trackHistory.length > 20) trackHistory.pop();

        } catch (error) { /* Silencioso */ }
    }

    actualizarDesdeServidor();
    radioIntervalId = setInterval(actualizarDesdeServidor, 15000);
}

function iniciarContadorRadioescuchas() {
    detenerContadorRadioescuchas();
    if (!contadorElemento) return;

    const statsUrl = "https://radio.technoplayerserver.com:8048/stats?json=1";
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(statsUrl)}`;

    async function actualizarContador() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(proxyUrl, { cache: 'no-cache', signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) return;
            
            const data = await response.json();
            const serverData = JSON.parse(data.contents);
            
            if (serverData && serverData.currentlisteners !== undefined) {
                contadorElemento.textContent = serverData.currentlisteners;
            }
        } catch (error) { /* Silencioso */ }
    }
    
    actualizarContador();
    contadorIntervalId = setInterval(actualizarContador, 20000);
}

// ===============================
// 5. INICIALIZACIÓN DEL REPRODUCTOR
// ===============================
function inicializarReproductor() {
    if (currentTrackName) currentTrackName.textContent = "Conectando Radio...";
    if (metaTrack) metaTrack.textContent = "🔊 Modo Radio activo";
    if (discImg) {
        discImg.src = "https://santi-graphics.vercel.app/assets/img/Plato.png";
        discImg.classList.add("rotating");
    }
    
    audio.src = "https://radio.technoplayerserver.com:8048/stream";
    audio.load();
    audio.muted = true; 
    
    audio.play().then(() => {
        if (iconPlay) iconPlay.classList.add("hidden");
        if (iconPause) iconPause.classList.remove("hidden");
    }).catch(err => {
        console.warn("🔒 Esperando interacción del usuario para audio:", err);
    });

    iniciarActualizacionRadio();
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
        console.log("🟢 Gesto humano: Audio desbloqueado.");
    }
}, { once: true }); 

// ===============================
// 6. EVENT LISTENERS PRINCIPALES
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    inicializarReproductor();
    inicializarVolumen();
    
    if (audio) { audio.muted = true; audio.muted = false; }

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            if (!audio.src) return;
            if (!gestureDetected) { gestureDetected = true; audio.muted = false; }
            
            if (audio.paused || audio.ended) {
                audio.play().then(() => {
                    playPauseBtn.classList.add("is-playing"); 
                    if (iconPlay) iconPlay.classList.add("hidden");
                    if (iconPause) iconPause.classList.remove("hidden");
                    if (discImg) discImg.classList.add("rotating"); 
                }).catch(err => {
                    console.warn("⚠️ Error en reproducción:", err);
                    playPauseBtn.classList.remove("is-playing");
                });
            } else {
                audio.pause();
                playPauseBtn.classList.remove("is-playing"); 
                if (iconPause) iconPause.classList.add("hidden");
                if (iconPlay) iconPlay.classList.remove("hidden");
                if (discImg) discImg.classList.remove("rotating");
            }
        });
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleModal(true); });
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleModal(false); });
    }
    if (modalTracks) {
        modalTracks.addEventListener('click', (e) => { if (e.target === modalTracks) toggleModal(false); });
    }
});

// ===============================
// 7. LÓGICA DEL MODAL (SOLO HISTORIAL DE RADIO)
// ===============================
function generarListaModal() {
    if (!trackList) return;
    trackList.innerHTML = ''; 
    
    if (currentTrackNameModal) currentTrackNameModal.textContent = "Historial de Radio";
    
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
}

function toggleModal(show) {
    if (!modalTracks) return;
    if (show) {
        modalTracks.classList.remove('hidden');
        generarListaModal();
        document.addEventListener("click", cerrarPorOutside, true);
        document.addEventListener("keydown", cerrarPorEsc);
    } else {
        modalTracks.classList.add('hidden');
        document.removeEventListener("click", cerrarPorOutside, true);
        document.removeEventListener("keydown", cerrarPorEsc);
    }
}

function cerrarPorOutside(e) {
    if (!modalTracks) return;
    if (!modalTracks.contains(e.target)) toggleModal(false);
}

function cerrarPorEsc(e) {
    if (e.key === "Escape") toggleModal(false);
}

// ===============================
// 8. CONTROL DE VOLUMEN
// ===============================
function actualizarBarraVolumen(volume) {
    const percentage = volume * 100;
    if (volumeBar) volumeBar.style.setProperty('--p', `${percentage}%`);

    if (volumeIcon) {
        if (volume === 0) volumeIcon.className = 'fas fa-volume-mute volume-icon';
        else if (volume > 0.6) volumeIcon.className = 'fas fa-volume-up volume-icon';
        else volumeIcon.className = 'fas fa-volume-down volume-icon';
    }
}

function inicializarVolumen() {
    const initialVolume = 70; 
    const audioVolume = initialVolume / 100;

    if (volumeBar) {
        volumeBar.value = initialVolume;
        actualizarBarraVolumen(audioVolume);
        if (audio) audio.volume = audioVolume;

        volumeBar.addEventListener('input', () => {
            const newVolume = volumeBar.value / 100;
            if (audio) audio.volume = newVolume;
            actualizarBarraVolumen(newVolume);
        });
    }
}

// ===============================
// 9. SOPORTE PARA INTERFAZ DINÁMICA (Re-vincular tras crear el DOM)
// ===============================
window.addEventListener("repro-ready", () => {
    console.log("🔄 Re-vinculando eventos a la nueva interfaz dinámica...");

    audio = document.getElementById("player");
    playPauseBtn = document.getElementById("btn-play-pause");
    iconPlay = playPauseBtn ? playPauseBtn.querySelector(".icon-play") : null;
    iconPause = playPauseBtn ? playPauseBtn.querySelector(".icon-pause") : null;
    discImg = document.getElementById("disc-img");
    currentTrackName = document.getElementById("current-track-name");
    currentArtistName = document.getElementById("current-artist-name");
    metaTrack = document.getElementById("meta-track");
    volumeBar = document.getElementById("volumeBar");
    volumeIcon = document.getElementById("volumeIcon");
    contadorElemento = document.getElementById("contadorRadio");
    modalTracks = document.getElementById("modal-tracks");
    menuBtn = document.getElementById("btn-menu-tracks");
    closeModalBtn = document.getElementById("close-modal");
    trackList = document.querySelector(".track-list");

    inicializarReproductor();
    inicializarVolumen();
    
    if (playPauseBtn && audio) {
        playPauseBtn.addEventListener("click", () => {
            if (!gestureDetected) { gestureDetected = true; audio.muted = false; }
            if (audio.paused || audio.ended) {
                audio.play().then(() => {
                    playPauseBtn.classList.add("is-playing"); 
                    if (iconPlay) iconPlay.classList.add("hidden");
                    if (iconPause) iconPause.classList.remove("hidden");
                    if (discImg) discImg.classList.add("rotating");
                }).catch(() => { playPauseBtn.classList.remove("is-playing"); });
            } else {
                audio.pause();
                playPauseBtn.classList.remove("is-playing"); 
                if (iconPause) iconPause.classList.add("hidden");
                if (iconPlay) iconPlay.classList.remove("hidden");
                if (discImg) discImg.classList.remove("rotating");
            }
        });
    }

    if (menuBtn) menuBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleModal(true); });
    if (closeModalBtn) closeModalBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleModal(false); });
    if (modalTracks) modalTracks.addEventListener('click', (e) => { if (e.target === modalTracks) toggleModal(false); });

    document.addEventListener("click", () => {
        if (!gestureDetected && audio) {
            gestureDetected = true;
            audio.muted = false;
            if (audio.src && audio.paused) {
                audio.play().then(() => {
                    if (iconPlay) iconPlay.classList.add("hidden");
                    if (iconPause) iconPause.classList.remove("hidden");
                    if (discImg) discImg.classList.add("rotating");
                });
            }
        }
    }, { once: true });
});

// ==========================================================================
// 10. MOTOR DE FONDOS (PIXIJS + RIPPLES)
// ==========================================================================
let pixiApp = null;
let ripplesInstance = null;
let estadoFondo = 0; 

const CONFIG_FONDOS = {
    video: 'https://santi-graphics.vercel.app/assets/video/Freedom.mp4',
    imagen: 'https://i.ibb.co/wrhf6TLM/Freedom-Custom.png'
};

function limpiarFondos() {
    if (pixiApp) { pixiApp.destroy(true, { children: true, texture: true, baseTexture: true }); pixiApp = null; }
    if (ripplesInstance) {
        try { $('.bg-water').ripples('destroy'); } catch(e) {}
        ripplesInstance = null;
    }
    $('#contenedor-animado').empty().hide();
    if ($('#btn-bg-mode').length) $('#btn-bg-mode').removeClass('modo-transparente');
}

function aplicarModoFondo() {
    limpiarFondos();
    if (estadoFondo === 0) {
        $('#contenedor-animado').show();
        activarFondoVideo(CONFIG_FONDOS.video);
    } else if (estadoFondo === 1) {
        $('.bg-water').css('background', `url('${CONFIG_FONDOS.imagen}') no-repeat center center / cover`);
        activarFondoImagen(CONFIG_FONDOS.imagen);
    } else if (estadoFondo === 2) {
        if ($('#btn-bg-mode').length) $('#btn-bg-mode').addClass('modo-transparente');
        $('.bg-water').css('background', 'transparent');
        $('.bg-water').css('background-color', 'transparent');
        $('.bg-water').css('background-image', 'none');
        $('#contenedor-animado').empty().hide();
    }
}

function ciclarFondo() {
    estadoFondo = (estadoFondo + 1) % 3;
    aplicarModoFondo();
}

$(document).ready(function() {
    if ($('#btn-bg-mode').length) {
        $('#btn-bg-mode').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            ciclarFondo();
        });
    }
    aplicarModoFondo();
});

function activarFondoVideo(url) {
    const video = document.createElement('video');
    video.src = url; video.crossOrigin = 'anonymous'; video.muted = true; video.loop = true; video.playsInline = true;
    
    video.play().then(() => {
        pixiApp = new PIXI.Application({ width: 600, height: 400, transparent: true, backgroundAlpha: 0, resolution: window.devicePixelRatio || 1, autoDensity: true });
        $('#contenedor-animado').empty().append(pixiApp.view).show();
        
        const autoDisplacementTexture = PIXI.Texture.from('https://i.imgur.com/2yYayZk.png');
        const autoDisplacementSprite = new PIXI.Sprite(autoDisplacementTexture);
        autoDisplacementTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
        autoDisplacementSprite.scale.set(5);
        pixiApp.stage.addChild(autoDisplacementSprite);
        
        const manualDisplacementTexture = PIXI.Texture.from('https://i.imgur.com/2yYayZk.png');
        const manualDisplacementSprite = new PIXI.Sprite(manualDisplacementTexture);
        manualDisplacementTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
        manualDisplacementSprite.scale.set(12);
        pixiApp.stage.addChild(manualDisplacementSprite);
        
        const videoTexture = PIXI.Texture.from(video);
        const videoSprite = new PIXI.Sprite(videoTexture);
        videoSprite.width = 600; videoSprite.height = 400;
        
        videoSprite.filters = [
            new PIXI.filters.DisplacementFilter(autoDisplacementSprite),
            new PIXI.filters.DisplacementFilter(manualDisplacementSprite)
        ];
        
        pixiApp.stage.addChild(videoSprite);
        pixiApp.stage.eventMode = 'static';
        pixiApp.stage.hitArea = pixiApp.screen;
        
        pixiApp.stage.on('pointermove', (event) => {
            manualDisplacementSprite.x = event.global.x - 200;
            manualDisplacementSprite.y = event.global.y - 200;
        });
        
        pixiApp.ticker.add(() => {
            autoDisplacementSprite.x += 2.5;
            autoDisplacementSprite.y += 2.5;
        });
    }).catch(err => console.error("❌ Error Video Pixi:", err));
}

function activarFondoImagen(url) {
    const $bgWater = $('.bg-water');
    const img = new Image();
    img.onload = function() {
        setTimeout(() => {
            try {
                ripplesInstance = $bgWater.ripples({ resolution: 200, dropRadius: 20, perturbance: 0.04, interactive: true });
            } catch(e) { console.error("❌ Error Ripples:", e); }
        }, 200);
    };
    img.src = url;
}

// ==========================================================================
// 11. ANIMACIONES Y UTILIDADES FINALES (INTACTAS)
// ==========================================================================

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANIMACIÓN DE TEXTO BIENVENIDA (SIN LOGS)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  const words = document.getElementsByClassName('word');
  const wordArray = [];
  let currentWord = 0;

  if (words.length === 0) return;

  words[currentWord].style.opacity = 1;
  
  for (let i = 0; i < words.length; i++) {
    splitLetters(words[i]);
  }

  function changeWord() {
    const cw = wordArray[currentWord];
    const nw = currentWord === words.length - 1 ? wordArray[0] : wordArray[currentWord + 1];
    
    for (let i = 0; i < cw.length; i++) {
      animateLetterOut(cw, i);
    }
    
    for (let i = 0; i < nw.length; i++) {
      nw[i].className = 'letter behind';
      nw[0].parentElement.style.opacity = 1;
      animateLetterIn(nw, i);
    }
    
    currentWord = (currentWord === wordArray.length - 1) ? 0 : currentWord + 1;
  }

  function animateLetterOut(cw, i) {
    setTimeout(() => {
      cw[i].className = 'letter out';
    }, i * 80);
  }

  function animateLetterIn(nw, i) {
    setTimeout(() => {
      nw[i].className = 'letter in';
    }, 340 + (i * 80));
  }

  function splitLetters(word) {
    const content = word.innerHTML;
    word.innerHTML = '';
    const letters = [];
    
    for (let i = 0; i < content.length; i++) {
      const letter = document.createElement('span');
      letter.className = 'letter';
      letter.innerHTML = content.charAt(i);
      word.appendChild(letter);
      letters.push(letter);
    }
    wordArray.push(letters);
  }

  changeWord();
  setInterval(changeWord, 4000);
});

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
  if (msg) {
      msg.classList.add("show");
      setTimeout(() => {
        msg.classList.remove("show");
      }, 2000);
  }
});