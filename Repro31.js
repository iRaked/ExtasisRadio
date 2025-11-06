document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================
    // ⚙️ 1. VARIABLES GLOBALES
    // ==========================================================
    let modo = "streaming"; // por defecto
    let playlist = []; 
    let currentIndex = 0; 
    let repeat = false; 
    let shuffle = false;
    let audioActivado = false; 

    // Rutas de Portadas de Streaming (Asegúrate de que existan)
    const portadasStreaming = [
        "assets/covers/Cover1.png", 
        "assets/covers/Cover2.png", 
        "assets/covers/Cover3.png", 
        "assets/covers/Cover4.png", 
        "assets/covers/Cover5.png"
    ]; 
    let streamingCoverIndex = 0; 

    // Elementos del DOM
    const audio = document.getElementById("player");
    const btnOnline = document.getElementById("btn-online");
    const btnPlayPause = document.getElementById("btn-playpause");
    const btnBack = document.getElementById("btn-prev"); 
    const btnNext = document.getElementById("btn-next");
    const btnRepeat = document.getElementById("btn-repeat");
    const btnShuffle = document.getElementById("btn-shuffle");

    // Elementos de información y Carrusel Contenedor
    const titleElement = document.getElementById("current-title");
    const artistElement = document.getElementById("current-artist");
    const currentGenre = document.getElementById("current-genre");
    const carouselContainer = document.getElementById("caratula-carousel"); // EL CONTENEDOR

    // Carrusel IDs (9 elementos)
    const CAROUSEL_IDS = ["l4", "l3", "l2", "l1", "center", "r1", "r2", "r3", "r4"];


    // ==========================================================
    // ⚠️ 1.5. CREACIÓN Y MONTAJE INICIAL DE LAS CARÁTULAS EN EL DOM
    // ==========================================================
    if (carouselContainer) {
        CAROUSEL_IDS.forEach(id => {
            const card = document.createElement('div');
            card.id = id;
            card.classList.add('card'); // Asegúrate de tener una clase base 'card' en tu CSS
            if (id === 'center') {
                card.classList.add('center-card');
            } else if (id.startsWith('l')) {
                card.classList.add('left-card');
            } else if (id.startsWith('r')) {
                card.classList.add('right-card');
            }
            carouselContainer.appendChild(card);
        });
        console.log("✅ 9 elementos del Carrusel creados dinámicamente.");
    }

// ==========================================================
// 🌊 Función para cambiar el color de las ondas (Ecualizador)
// ==========================================================
function colorOndasPorGenero(genero) {
  const DEFAULT_COLOR = "#3688ff";

  // 1. Normaliza el género para evitar errores por tildes o mayúsculas
  const normalizado = genero?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

  // 2. Mapa editorializado de colores por género
  const colores = {
    "pop rock": "#8f94fb", "reggae": "#00ff00", "regional mexicano": "#c0392b",
    "corrido tumbado": "#bdc3c7", "corrido belico": "#ff0000", "norteno": "#2ecc71",
    "cumbia nortena": "#fbc531", "tropi pop": "#f39c12", "pop latino": "#ffe66d",
    "salsa": "#f1c40f", "regueton": "#ff0000", "trap": "#2c5364",
    "rumba": "#f7c59f", "rock en español": "#3498db", "ska": "#000000",
    "rock urbano": "#95a5a6", "pop electronico": "#a29bfe", "cumbia": "#feb47b",
    "cumbia norteña": "#a044ff", "cheta": "#ee0979", "cuarteto": "#ffd200",
    "rap": "#414345", "pop": "#ffc0cb", "balada pop": "#ffc3a0",
    "bolero": "#ecf0f1", "balada romantica": "#fad0c4", "dance": "#ffff1c",
    "trance": "#ffaf7b", "house": "#dd2476", "dancehall": "#64f38c",
    "metal": "#000000", "synthpop": "#4a00e0", "electronica": "#92fe9d"
  };

  // 3. Determina el color final
  const color = colores[normalizado] || DEFAULT_COLOR;

  // 4. Aplica el color a la variable CSS
  document.documentElement.style.setProperty("--color-ondas", color);

  // 5. Fuerza reactividad en Vue para que las barras se re-rendericen
  if (typeof ecualizador !== "undefined") {
    ecualizador.actualizarColorClase?.();
  }

  // 6. Aplica el color directamente a los elementos SVG ya renderizados
  document.querySelectorAll('.eq-bar-filled').forEach(bar => {
    bar.setAttribute("stroke", color);
  });

  // 7. Registro editorial
  console.log(`🎨 Ondas ajustadas a: ${color} para género: ${genero}`);
}

// ==========================================================
// 🎵 2. FUNCIONES BASE DEL REPRODUCTOR (Actualizado)
// ==========================================================
function actualizarBotonPlay() {
    const icon = btnPlayPause?.querySelector("i");
    if (!icon) return;
    icon.classList.remove("fa-play", "fa-pause");
    icon.classList.add(audio.paused ? "fa-play" : "fa-pause");
}

function actualizarInformacion(pista) {
    // Asumo que titleElement, artistElement, y currentGenre están definidos en el DOM
    const titleElement = document.getElementById("current-title");
    const artistElement = document.getElementById("current-artist");
    const currentGenre = document.getElementById("current-genre"); 

    if (titleElement) {
        titleElement.textContent = pista?.nombre || "Radio En Vivo";
    }
    if (artistElement) {
        artistElement.textContent = pista?.artista || "Streaming...";
    }
    if (currentGenre) {
        // Muestra solo el valor del género (e.g., "rap")
        currentGenre.textContent = pista?.genero || "";
    }
}

function reproducirPista(index) {
    if (modo === "local" && playlist.length > 0) {
        currentIndex = (index + playlist.length) % playlist.length;
        const pista = playlist[currentIndex];
        audio.src = pista.enlace;
        audio.muted = false;
        audio.play().catch(err => console.warn("Error al reproducir pista local:", err));
        actualizarBotonPlay();
        actualizarInformacion(pista);

        // ✅ NUEVA INTEGRACIÓN: Cambiar el color de las ondas al iniciar la pista
        colorOndasPorGenero(pista.genero); 
        
        console.log(`▶️ Reproduciendo: ${pista.nombre} - ${pista.artista} (${pista.genero || 'Sin Género'}).`);
    }
}
        
// ==========================================================
// 🎵 2.5. LÓGICA DE CONTROL (Shuffle y Repeat)
// ==========================================================

function getNextIndex() {
    if (modo !== "local" || !playlist.length) return currentIndex;

    if (shuffle) {
        let newIndex;
        // Bucle para asegurar que la nueva pista no sea la misma que la actual (a menos que solo haya 1)
        do {
            newIndex = Math.floor(Math.random() * playlist.length);
        } while (newIndex === currentIndex && playlist.length > 1);
        return newIndex;
    } else {
        // Lógica secuencial normal (vuelve al inicio)
        return (currentIndex + 1) % playlist.length;
    }
}

// 🔀 Botón SHUFFLE (Con respuesta instantánea)
if (btnShuffle) {
    btnShuffle.addEventListener("click", () => {
        shuffle = !shuffle; // Alternar estado
        btnShuffle.classList.toggle("active", shuffle);
        console.log(`🔀 Modo Aleatorio: ${shuffle ? 'ACTIVADO' : 'DESACTIVADO'}.`);

        // ✅ LÓGICA DE RESPUESTA INSTANTÁNEA: Si se activa y estamos en reproducción, salta.
        if (shuffle && modo === "local" && !audio.paused && playlist.length > 1) {
            currentIndex = getNextIndex(); // Obtiene el índice aleatorio
            reproducirPista(currentIndex); // Salta a la nueva pista
            actualizarPortadasLocalSimple(); // Actualiza el carrusel
            console.log("⏭️ Salto instantáneo a pista aleatoria.");
        }
    });
}

// 🔁 Botón REPEAT (Simplemente ON/OFF con clase 'active')
if (btnRepeat) {
    btnRepeat.addEventListener("click", () => {
        repeat = !repeat; // Alternar estado
        // Aplica/quita la clase 'active' para el cambio de fondo en CSS
        btnRepeat.classList.toggle("active", repeat); 
        console.log(`🔁 Modo Repetir Playlist: ${repeat ? 'ACTIVADO' : 'DESACTIVADO'}.`);
    });
}

    // ==========================================================
    // 🖼 3. LÓGICA DEL CARRUSEL (9 Carátulas y Animación)
    // ==========================================================
    
    // Las funciones moverCarruselIzquierda y moverCarruselDerecha se mantienen igual
    function moverCarruselIzquierda(newCoverUrl, newCoverIndex) {
        const cards = CAROUSEL_IDS.map(id => document.getElementById(id)).filter(e => e);
        if (cards.length !== 9) { return; } 
        
        for (let i = 0; i < cards.length - 1; i++) {
            const sourceCard = cards[i + 1]; 
            const targetCard = cards[i];      
            
            targetCard.innerHTML = sourceCard.innerHTML;
            targetCard.style.backgroundImage = sourceCard.style.backgroundImage;
            targetCard.dataset.index = sourceCard.dataset.index;
        }

        const r4Card = document.getElementById("r4");
        if (r4Card) {
            r4Card.style.backgroundImage = `url('${newCoverUrl}')`;
            r4Card.innerHTML = `<img src="${newCoverUrl}" />`;
            r4Card.dataset.index = newCoverIndex;
        }
        
        const newCenterCard = document.getElementById("center");
        if (newCenterCard) {
            newCenterCard.classList.add("animar-movimiento");
            setTimeout(() => newCenterCard.classList.remove("animar-movimiento"), 600);
        }
    }

    function moverCarruselDerecha(newCoverUrl, newCoverIndex) {
        const cards = CAROUSEL_IDS.map(id => document.getElementById(id)).filter(e => e);
        if (cards.length !== 9) { return; } 
        
        for (let i = cards.length - 1; i > 0; i--) {
            const sourceCard = cards[i - 1]; 
            const targetCard = cards[i];      
            
            targetCard.innerHTML = sourceCard.innerHTML;
            targetCard.style.backgroundImage = sourceCard.style.backgroundImage;
            targetCard.dataset.index = sourceCard.dataset.index;
        }

        const l4Card = document.getElementById("l4");
        if (l4Card) {
            l4Card.style.backgroundImage = `url('${newCoverUrl}')`;
            l4Card.innerHTML = `<img src="${newCoverUrl}" />`;
            l4Card.dataset.index = newCoverIndex;
        }
        
        const newCenterCard = document.getElementById("center");
        if (newCenterCard) {
            newCenterCard.classList.add("animar-movimiento");
            setTimeout(() => newCenterCard.classList.remove("animar-movimiento"), 600);
        }
    }
    
    // Función de inicialización forzada del carrusel (USADA AL INICIO Y CAMBIO DE MODO)
    function inicializarCarruselStreaming() {
        const cards = CAROUSEL_IDS.map(id => document.getElementById(id)).filter(e => e);
        if (cards.length !== 9 || !portadasStreaming.length) return;
        
        for (let i = 0; i < cards.length; i++) {
            const index = (streamingCoverIndex + (i - 4) + portadasStreaming.length) % portadasStreaming.length;
            const coverUrl = portadasStreaming[index];
            
            cards[i].style.backgroundImage = `url('${coverUrl}')`;
            cards[i].innerHTML = `<img src="${coverUrl}" />`;
            cards[i].dataset.index = index;
        }
        actualizarInformacion(null);
    }
    
    function actualizarPortadasLocalSimple() {
    if (modo !== "local" || !playlist.length) return;
    const center = document.getElementById("center");
    const leftCards = ["l1", "l2", "l3", "l4"].map(id => document.getElementById(id));
    const rightCards = ["r1", "r2", "r3", "r4"].map(id => document.getElementById(id));

    const pistaCentral = playlist[currentIndex];
    
    // 1. CORRECCIÓN: Usar pistaCentral?.caratula
    if (pistaCentral?.caratula && center) { 
        center.classList.add("animar");
        center.innerHTML = `<img src="${pistaCentral.caratula}" />`; // ⬅️ CAMBIO AQUÍ
        center.dataset.index = currentIndex;
        setTimeout(() => center.classList.remove("animar"), 600);
    }
    
    for (let i = 0; i < 4; i++) { 
        const offset = i + 1; 
        const indexDer = (currentIndex + offset) % playlist.length;
        const indexIzq = (currentIndex - offset + playlist.length) % playlist.length; 
        const pistaIzq = playlist[indexIzq];
        const pistaDer = playlist[indexDer];
        
        // 2. CORRECCIÓN: Usar pistaIzq?.caratula
        if (leftCards[i] && pistaIzq?.caratula) { 
            leftCards[i].style.backgroundImage = `url('${pistaIzq.caratula}')`; // ⬅️ CAMBIO AQUÍ
            leftCards[i].innerHTML = `<img src="${pistaIzq.caratula}" />`; // ⬅️ CAMBIO AQUÍ
            leftCards[i].dataset.index = indexIzq;
            leftCards[i].classList.add("animar");
        }
        
        // 3. CORRECCIÓN: Usar pistaDer?.caratula
        if (rightCards[i] && pistaDer?.caratula) {
            rightCards[i].style.backgroundImage = `url('${pistaDer.caratula}')`; // ⬅️ CAMBIO AQUÍ
            rightCards[i].innerHTML = `<img src="${pistaDer.caratula}" />`; // ⬅️ CAMBIO AQUÍ
            rightCards[i].dataset.index = indexDer;
            rightCards[i].classList.add("animar");
        }
    }
    setTimeout(() => {
        leftCards.forEach(card => card?.classList.remove("animar"));
        rightCards.forEach(card => card?.classList.remove("animar"));
    }, 700);
}

    function actualizarPortadasStreaming() {
        if (modo !== "streaming" || !portadasStreaming.length) return;

        streamingCoverIndex = (streamingCoverIndex + 1) % portadasStreaming.length;
        const nextIndexForR4 = (streamingCoverIndex + 4) % portadasStreaming.length;
        const newCoverUrl = portadasStreaming[nextIndexForR4];
        
        moverCarruselIzquierda(newCoverUrl, nextIndexForR4);
    }
    // Fin de las funciones de carrusel


    // ==========================================================
    // 💾 4. CARGA DE JSON Y CAMBIO DE MODO
    // ==========================================================

    function cambiarModoALocal() {
        fetch("Repro31.json")
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                const pistas = Array.isArray(data) 
                    ? data 
                    : (data.playlist && Array.isArray(data.playlist)) ? data.playlist : Object.values(data).flat().filter(item => item && typeof item.enlace === 'string');
                
                if (!pistas.length) {
                    console.error("❌ La playlist está vacía o el formato JSON es incorrecto.");
                    return;
                }

                playlist = pistas;
                modo = "local";
                currentIndex = 0;
                reproducirPista(currentIndex);
                actualizarPortadasLocalSimple(); 
                btnOnline.textContent = "OFFLINE";
                console.log("📁 Modo local activado y carrusel inicializado. ✅ JSON Cargado.");
            })
            .catch(err => {
                console.error("❌ Fallo crítico al cargar o procesar Repro31.json. Verifica la ruta y el formato.", err);
            });
    }

    // 🔊 Activación inicial (streaming)
    document.addEventListener("click", () => {
        if (!audioActivado && audio.paused) {
            audio.muted = false;
            audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
            audio.play().catch(err => console.warn("🔒 Autoplay bloqueado:", err));
            audioActivado = true;
            modo = "streaming";
            btnOnline.textContent = "RADIO";
            actualizarBotonPlay();
            actualizarInformacion(null); 
colorOndasPorGenero(null); // ⬅️ fuerza el color por defecto
        }
    }, { once: true });

    // 📁 Alternar entre modo local y streaming
    if (btnOnline) {
        btnOnline.addEventListener("click", () => {
            if (modo === "streaming") {
                cambiarModoALocal(); 
            } else {
                modo = "streaming";
                audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
                audio.muted = false;
                audio.play();
                actualizarBotonPlay();
                btnOnline.textContent = "RADIO";
                inicializarCarruselStreaming(); // Vuelve a inicializar las portadas de streaming
            }
        });
    }

// ==========================================================
// 🖱 5. EVENT LISTENERS
// ==========================================================

// ... (Play/Pause se mantiene igual)
if (btnPlayPause) {
    btnPlayPause.addEventListener("click", () => {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
        actualizarBotonPlay();
    });
}

// ... (btnNext se mantiene igual, asumiendo que todavía lo usas para avance secuencial)
if (btnNext) {
    btnNext.addEventListener("click", () => {
        if (modo === "local" && playlist.length > 0) {
            // Avance secuencial manual
            currentIndex = (currentIndex + 1) % playlist.length;
            reproducirPista(currentIndex);
            actualizarPortadasLocalSimple(); 
            console.log("⏭ Botón NEXT: Avanza pista en MODO LOCAL.");
        } else {
            console.log("⏭ Botón NEXT: Deshabilitado en modo streaming.");
        }
    });
}

// ... (btnBack se mantiene igual, asumiendo que todavía lo usas para retroceso secuencial)
if (btnBack) {
    btnBack.addEventListener("click", () => {
        if (modo === "local" && playlist.length > 0) {
            // Retroceso secuencial manual
            currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
            reproducirPista(currentIndex);
            actualizarPortadasLocalSimple(); 
            console.log("⏮ Botón PREV: Retrocede pista en MODO LOCAL.");
        } else {
            console.log("⏮ Botón PREV: Deshabilitado en modo streaming.");
        }
    });
}

// 🎵 Lógica de Reproducción Automática al Finalizar (audio.ended)
audio.addEventListener("ended", () => {
    if (modo !== "local" || playlist.length === 0) return;

    let nextIndex;
    
    // 🔀/🔁 Caso 1: SHUFFLE O REPEAT están activos
    if (shuffle || repeat) {
        // Usa getNextIndex, que maneja la lógica de aleatorio si shuffle es TRUE
        // o avanza secuencialmente si solo repeat es TRUE.
        nextIndex = getNextIndex();
    } 
    // 🛑 Caso 2: SECUENCIAL (Ni Shuffle ni Repeat)
    else {
        if (currentIndex < playlist.length - 1) {
            nextIndex = currentIndex + 1;
        } else {
            // Fin de la playlist, detener.
            audio.pause(); 
            actualizarBotonPlay();
            console.log("🛑 Final de la Playlist.");
            return; // Detiene la ejecución
        }
    }
    
    // Ejecuta la nueva pista obtenida (solo si no nos detuvimos al final)
    currentIndex = nextIndex;
    reproducirPista(currentIndex);
    actualizarPortadasLocalSimple();
});

// ... (Interval para Streaming se mantiene igual)
setInterval(() => {
    if (modo === "streaming") {
        actualizarPortadasStreaming(); 
        console.log("📡 Cambio de portada automático en Streaming.");
    }
}, 30000); 

// ... (Clic en las portadas laterales se mantiene igual)
// Clic en las portadas laterales para seleccionar
CAROUSEL_IDS.forEach(id => {
    const card = document.getElementById(id);
    if (card) {
        card.addEventListener("click", () => {
            const index = parseInt(card.dataset.index);
            if (!isNaN(index) && modo === "local") {
                currentIndex = index;
                reproducirPista(index);
                actualizarPortadasLocalSimple(); 
            }
        });
    }
});
    
    // ==========================================================
    // 🖼️ 6. INICIALIZACIÓN DEL CARRUSEL EN MODO DEFAULT
    // ==========================================================
    // ESTO GARANTIZA QUE LAS CARÁTULAS APAREZCAN AL INICIO.
    if (carouselContainer) {
        // Debemos esperar a que se creen los 9 elementos antes de inicializarlos
        setTimeout(inicializarCarruselStreaming, 100); 
    }
// ==========================================================
// 🎚️ 7. Referencia al input de volumen
// ==========================================================
// 🎚️ Referencia al input de volumen
const inputVolumen = document.querySelector(".right-bottom input[type='range']");

// 🔊 Aplicar volumen al audio
if (inputVolumen) {
  // ✅ Establecer el valor inicial en 70%
  inputVolumen.value = 70;
  audio.volume = 0.7;

  // 🎛️ Escuchar cambios en el slider
  inputVolumen.addEventListener("input", () => {
    const valor = parseInt(inputVolumen.value, 10);
    audio.volume = Math.min(Math.max(valor / 100, 0), 1); // Normaliza entre 0 y 1
    console.log(`🔊 Volumen ajustado a: ${valor}%`);
  });
}

});