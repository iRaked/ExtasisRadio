// ==========================================================
// 🎧 Repro31.js — Núcleo simplificado y completo
// Condiciones: ondas por género, carátulas, inicialización tras gesto,
// cambio de modos radio/local y metadatos (radio con tu limpieza, iTunes covers)
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------------------------
  // ⚙️ Variables globales
  // ----------------------------------------------------------
  let modo = "radio";                  // "radio" | "local"
  let gestureDetected = false;         // desbloqueo humano
  let playlist = [];                   // modo local
  let currentIndex = 0;                // modo local
  let radioIntervalId = null;          // intervalo de metadatos radio
  let lastTrackTitle = "";             // evitar duplicados
  let streamingCoverIndex = 0;         // índice virtual para streaming covers

  const audio = document.getElementById("player");
  const btnOnline = document.getElementById("btn-online");

  const titleElement = document.getElementById("current-title");
  const artistElement = document.getElementById("current-artist");
  const genreElement = document.getElementById("current-genre");

  const btnPlayPause = document.getElementById("btn-playpause");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

  const carouselContainer = document.getElementById("caratula-carousel");
  const CAROUSEL_IDS = ["l4","l3","l2","l1","center","r1","r2","r3","r4"];

  // Portadas de streaming (orden ceremonial)
  const portadasStreaming = [
    "https://santi-graphics.vercel.app/assets/covers/Cover1.png",
    "https://santi-graphics.vercel.app/assets/covers/Cover2.png",
    "https://santi-graphics.vercel.app/assets/covers/Cover3.png",
    "https://santi-graphics.vercel.app/assets/covers/Cover4.png",
    "https://santi-graphics.vercel.app/assets/covers/Cover5.png"
  ];

  // ----------------------------------------------------------
  // 🌊 Ondas por género (conservada)
  // ----------------------------------------------------------
  function colorOndasPorGenero(genero) {
    const DEFAULT_COLOR = "#3688ff";
    const normalizado = genero?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

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
      "metal": "#000000", "synthpop": "#4a00e0", "electronica": "#92fe9d",
      "streaming": DEFAULT_COLOR, "radio": DEFAULT_COLOR
    };

    const color = colores[normalizado] || DEFAULT_COLOR;

    document.documentElement.style.setProperty("--color-ondas", color);
    document.querySelectorAll(".eq-bar-filled").forEach(bar => {
      bar.setAttribute("stroke", color);
    });
  }

  // ----------------------------------------------------------
  // 🖼 Carátulas — creación y orden ceremonial
  // ----------------------------------------------------------
  function asegurarCarruselEnDOM() {
    if (!carouselContainer) return;
    const existentes = CAROUSEL_IDS.map(id => document.getElementById(id)).filter(Boolean);
    if (existentes.length === 9) return;
    // Crear las 9 tarjetas
    CAROUSEL_IDS.forEach(id => {
      const card = document.createElement("div");
      card.id = id;
      card.classList.add("card");
      if (id === "center") card.classList.add("center-card");
      else if (id.startsWith("l")) card.classList.add("left-card");
      else if (id.startsWith("r")) card.classList.add("right-card");
      carouselContainer.appendChild(card);
    });
  }

  function inicializarCarruselStreaming() {
    asegurarCarruselEnDOM();
    const cards = CAROUSEL_IDS.map(id => document.getElementById(id)).filter(Boolean);
    if (cards.length !== 9) return;

    for (let i = 0; i < cards.length; i++) {
      const index = (streamingCoverIndex + (i - 4) + portadasStreaming.length * 2) % portadasStreaming.length;
      const coverUrl = portadasStreaming[index];
      cards[i].style.backgroundImage = `url('${coverUrl}')`;
      cards[i].innerHTML = `<img src="${coverUrl}" />`;
      cards[i].dataset.index = index;
    }
  }

  function moverCarruselIzquierda(newCoverUrl, newCoverIndex) {
    const cards = CAROUSEL_IDS.map(id => document.getElementById(id)).filter(Boolean);
    if (cards.length !== 9) return;

    // Mover contenido de derecha a izquierda
    for (let i = 0; i < cards.length - 1; i++) {
      const source = cards[i + 1];
      const target = cards[i];
      target.innerHTML = source.innerHTML;
      target.style.backgroundImage = source.style.backgroundImage;
      target.dataset.index = source.dataset.index;
    }
    // Nueva portada en r4
    const r4Card = document.getElementById("r4");
    if (r4Card) {
      r4Card.style.backgroundImage = `url('${newCoverUrl}')`;
      r4Card.innerHTML = `<img src="${newCoverUrl}" />`;
      r4Card.dataset.index = newCoverIndex;
    }
    // Animación sutil en center
    const centerCard = document.getElementById("center");
    if (centerCard) {
      centerCard.classList.add("animar-movimiento");
      setTimeout(() => centerCard.classList.remove("animar-movimiento"), 600);
    }
  }

  // Carátulas modo local (orden simétrico)
  function actualizarPortadasLocal() {
    if (modo !== "local" || !playlist.length) return;
    asegurarCarruselEnDOM();

    const center = document.getElementById("center");
    const leftCards = ["l4","l3","l2","l1"].map(id => document.getElementById(id));
    const rightCards = ["r1","r2","r3","r4"].map(id => document.getElementById(id));

    const pistaCentral = playlist[currentIndex];
    if (pistaCentral?.caratula && center) {
      center.style.backgroundImage = `url('${pistaCentral.caratula}')`;
      center.innerHTML = `<img src="${pistaCentral.caratula}" />`;
      center.dataset.index = currentIndex;
    }

    for (let i = 0; i < 4; i++) {
      const offset = i + 1;
      const indexIzq = (currentIndex - offset + playlist.length) % playlist.length;
      const indexDer = (currentIndex + offset) % playlist.length;
      const pistaIzq = playlist[indexIzq];
      const pistaDer = playlist[indexDer];

      if (leftCards[i] && pistaIzq?.caratula) {
        leftCards[i].style.backgroundImage = `url('${pistaIzq.caratula}')`;
        leftCards[i].innerHTML = `<img src="${pistaIzq.caratula}" />`;
        leftCards[i].dataset.index = indexIzq;
      }
      if (rightCards[i] && pistaDer?.caratula) {
        rightCards[i].style.backgroundImage = `url('${pistaDer.caratula}')`;
        rightCards[i].innerHTML = `<img src="${pistaDer.caratula}" />`;
        rightCards[i].dataset.index = indexDer;
      }
    }
  }

// ----------------------------------------------------------
// 🧭 Avance de historial con la carátula real del track (solo radio)
// ----------------------------------------------------------
function avanzarCarruselConCover(coverUrl) {
  if (modo !== "radio") return;

  // Empuja el carrusel hacia la izquierda mostrando esta carátula en r4
  const nextIndex = (streamingCoverIndex + 1) % portadasStreaming.length;
  moverCarruselIzquierda(coverUrl, nextIndex);
  streamingCoverIndex = nextIndex;

  // Animación sutil en center ya viene de moverCarruselIzquierda
}


  // ----------------------------------------------------------
  // 🖊️ Actualización de información visible
  // ----------------------------------------------------------
  function actualizarInformacion(pista) {
    if (titleElement) titleElement.textContent = pista?.nombre || "Radio En Vivo";
    if (artistElement) artistElement.textContent = pista?.artista || "Streaming...";
    if (genreElement) genreElement.textContent = pista?.genero || "...";
  }

  // ----------------------------------------------------------
// 🎶 Modo local — carga JSON y metadatos básicos
// ----------------------------------------------------------
function cargarPlaylistLocal() {
  // Estructura esperada: objeto con secciones (hits, regional_mexicano, etc.)
  return fetch("https://radio-tekileros.vercel.app/Repro31.json")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      // Aplanar todas las secciones en un solo array
      const rawList = Object.values(data)
        .filter(Array.isArray)
        .flat();

      if (!rawList.length) throw new Error("Playlist local vacía o formato inválido.");

      // Normalizar cada pista
      playlist = rawList.map(item => {
        return {
          nombre:   item.nombre   ?? "Título Desconocido",
          artista:  item.artista  ?? "Artista Desconocido",
          genero:   item.genero   ?? "pop",
          caratula: item.caratula ?? "https://santi-graphics.vercel.app/assets/covers/Cover1.png",
          enlace:   item.enlace   ?? null
        };
      }).filter(p => p.enlace); // solo pistas con enlace válido

      if (!playlist.length) throw new Error("No hay pistas con enlace válido.");

      // Arrancar en la primera pista
      currentIndex = 0;
      const pista = playlist[currentIndex];

      actualizarInformacion({ nombre: pista.nombre, artista: pista.artista, genero: pista.genero });
      colorOndasPorGenero(pista.genero);
      actualizarPortadasLocal();
    })
    .catch(err => {
      console.error("❌ Error al cargar JSON local:", err);
    });
}


// ----------------------------------------------------------
// Modo Local
// ----------------------------------------------------------
function activarModoLocal() {
  modo = "local";
  detenerActualizacionRadio();
  audio.pause();

  if (btnOnline) btnOnline.textContent = "OFFLINE";

  cargarPlaylistLocal()
    .then(() => {
      reproducirLocal(0); // reproducir primera pista
      console.log("📁 Modo local activado.");
    })
    .catch(err => {
      console.error("❌ Error al activar modo local:", err);
    });
}

// ----------------------------------------------------------
// ▶️ Reproducir pista local (orden simétrico correcto)
// ----------------------------------------------------------
function reproducirLocal(index) {
  if (modo !== "local" || !playlist.length) return;

  currentIndex = (index + playlist.length) % playlist.length;
  const pista = playlist[currentIndex];

  if (!pista?.enlace) {
    console.warn("⚠️ Pista sin enlace válido:", pista);
    return;
  }

  audio.src = pista.enlace;
  audio.play().catch(err => console.warn("🔒 Autoplay bloqueado (local):", err));

  actualizarInformacion({ nombre: pista.nombre, artista: pista.artista, genero: pista.genero });
  colorOndasPorGenero(pista.genero);

  // ✅ En local usamos el orden simétrico, no el avance cronológico
  actualizarPortadasLocal();
}

// ----------------------------------------------------------
// 📡 Modo radio — limpieza, iTunes cover y avance cronológico real
// ----------------------------------------------------------
function detenerActualizacionRadio() {
  if (radioIntervalId !== null) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }
}

// Estado interno para avance ceremonial
let radioHasShownCenter = false;   // ya se pintó al menos una carátula en center
let lastCenterCoverUrl = null;     // última carátula mostrada en center

// Utilidad: obtener carátula desde iTunes (promesa que resuelve con URL)
function getCoverFromiTunes(artist, title) {
  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;
  return fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.results && data.results.length > 0) {
        return data.results[0].artworkUrl100.replace("100x100", "400x400");
      }
      return "https://santi-graphics.vercel.app/assets/covers/Cover2.png"; // cover por defecto si no hay resultados
    })
    .catch(() => "https://santi-graphics.vercel.app/assets/covers/Cover1.png"); // fallback en error
}

function iniciarActualizacionRadio() {
  detenerActualizacionRadio();

  const radioUrl = "https://technoplayerserver.net:8018/currentsong?sid=1";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function actualizarDesdeServidor() {
    try {
      const response = await fetch(proxyUrl, { cache: "no-cache" });
      const raw = await response.text();

      // Limpieza compartida
      const cleanedTitle = raw
        .trim()
        .replace(/AUTODJ/gi, "")
        .replace(/\|\s*$/g, "")
        .trim();

      // 👉 Fallback suave cuando no hay metadatos nuevos
      if (!cleanedTitle || cleanedTitle === lastTrackTitle) {
        if (titleElement) titleElement.textContent = "Esperando al servidor...";
        if (artistElement) artistElement.textContent = "Casino Digital Radio";
        if (genreElement) genreElement.textContent = "Casino Digital Radio";
        colorOndasPorGenero("radio");
        return;
      }
      lastTrackTitle = cleanedTitle;

      // Separación artista - título
      const parts = cleanedTitle.split(/ - | – /);
      const artist = parts[0]?.trim() || "Casino Digital Radio";
      const title = parts.slice(1).join(" - ").trim() || cleanedTitle;

      // UI básica
      if (titleElement) titleElement.textContent = title;
      if (artistElement) artistElement.textContent = artist;
      if (genreElement) genreElement.textContent = "Casino Digital Radio";
      colorOndasPorGenero("radio");

      // Obtener carátula
      const coverUrl = await getCoverFromiTunes(artist, title);

      // Si ya hubo al menos una carátula en el centro, primero empujamos esa al historial
      if (radioHasShownCenter && lastCenterCoverUrl) {
        const nextIndex = (streamingCoverIndex + 1) % portadasStreaming.length;
        moverCarruselIzquierda(lastCenterCoverUrl, nextIndex);
        streamingCoverIndex = nextIndex;
      }

      // Luego pintamos la nueva carátula en el centro
      const center = document.getElementById("center");
      if (center) {
        center.style.backgroundImage = `url('${coverUrl}')`;
        center.innerHTML = `<img src="${coverUrl}" />`;
        center.dataset.index = streamingCoverIndex;
      }

      // Actualizar estado para la siguiente iteración
      radioHasShownCenter = true;
      lastCenterCoverUrl = coverUrl;

      console.log(`📡 Radio -> ${artist} - ${title}`);
    } catch (error) {
      // 👉 Fallback suave en caso de error de request
      if (titleElement) titleElement.textContent = "Esperando al servidor...";
      if (artistElement) artistElement.textContent = "Casino Digital Radio";
      if (genreElement) genreElement.textContent = "Casino Digital Radio";
      colorOndasPorGenero("radio");
      console.error("❌ Error metadatos radio:", error);
    }
  }

  // Primera ejecución inmediata y luego cada 10s
  actualizarDesdeServidor();
  radioIntervalId = setInterval(actualizarDesdeServidor, 10000);
}

  // ----------------------------------------------------------
// 🔄 Cambio de modos con reproducción automática
// ----------------------------------------------------------
function cambiarModoALocal() {
  modo = "local";
  detenerActualizacionRadio();
  audio.pause();
  btnOnline && (btnOnline.textContent = "OFFLINE");

  cargarPlaylistLocal()
    .then(() => {
      reproducirLocal(0); // reproducir primera pista automáticamente
      console.log("📁 Modo local activado y reproduciendo.");
    })
    .catch(err => console.error("❌ Error al activar modo local:", err));
}

function cambiarModoARadio() {
  modo = "radio";
  lastTrackTitle = ""; // reset para evitar bloqueo por coincidencia
  audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
  audio.muted = false; // aseguramos que no quede silenciado tras el gesto
  audio.play().catch(err => console.warn("🔒 Autoplay bloqueado (radio):", err));

  btnOnline && (btnOnline.textContent = "RADIO");
  inicializarCarruselStreaming();
  iniciarActualizacionRadio();
  colorOndasPorGenero("radio");
  console.log("📡 Modo radio activado y reproduciendo.");
}

// Alternar con botón ONLINE
if (btnOnline) {
  btnOnline.addEventListener("click", () => {
    if (!gestureDetected) {
      // primer gesto: desbloquea audio
      gestureDetected = true;
      audio.muted = false;
    }
    if (modo === "radio") {
      cambiarModoALocal();  // cambia a local y reproduce
    } else {
      cambiarModoARadio();  // cambia a radio y reproduce
    }
  });
}


  // ----------------------------------------------------------
  // ▶️ Botonera básica (Play/Pause y navegación local)
  // ----------------------------------------------------------
  function actualizarBotonPlay() {
    const icon = btnPlayPause?.querySelector("i");
    if (!icon) return;
    icon.classList.remove("fa-play","fa-pause");
    icon.classList.add(audio.paused ? "fa-play" : "fa-pause");
  }

  if (btnPlayPause) {
    btnPlayPause.addEventListener("click", () => {
      if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;
      }
      if (audio.paused) {
        audio.play().catch(err => console.warn("🔒 Play bloqueado:", err));
      } else {
        audio.pause();
      }
      actualizarBotonPlay();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (modo === "local" && playlist.length > 0) {
        currentIndex = (currentIndex + 1) % playlist.length;
        reproducirLocal(currentIndex);
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (modo === "local" && playlist.length > 0) {
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        reproducirLocal(currentIndex);
      }
    });
  }

// ----------------------------------------------------------
// 🔁 Repeat y 🔀 Shuffle — lógica de la botonera
// ----------------------------------------------------------
let repeatActivo = false;   // estado de repeat
let shuffleActivo = false;  // estado de shuffle

const btnRepeat = document.getElementById("btn-repeat");
const btnShuffle = document.getElementById("btn-shuffle");

// 🔁 Funcionalidad del botón Repeat
if (btnRepeat) {
  btnRepeat.addEventListener("click", () => {
    repeatActivo = !repeatActivo;

    if (repeatActivo) {
      // activar glow blanco
      btnRepeat.classList.add("glow-white");
      audio.loop = true; // repite la pista actual
      console.log("🔁 Repeat activado: pista actual se repetirá.");
    } else {
      btnRepeat.classList.remove("glow-white");
      audio.loop = false;
      console.log("🔁 Repeat desactivado.");
    }
  });
}

// 🔀 Funcionalidad del botón Shuffle
if (btnShuffle) {
  btnShuffle.addEventListener("click", () => {
    shuffleActivo = !shuffleActivo;

    if (shuffleActivo) {
      btnShuffle.classList.add("glow-white");
      console.log("🔀 Shuffle activado: modo aleatorio inmediato.");
      if (modo === "local" && playlist.length > 1) {
        // reproducir inmediatamente una pista aleatoria distinta
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * playlist.length);
        } while (newIndex === currentIndex);
        reproducirLocal(newIndex);
      }
    } else {
      btnShuffle.classList.remove("glow-white");
      console.log("🔀 Shuffle desactivado.");
    }
  });
}

// ----------------------------------------------------------
// 🔊 Barra de Volumen — lógica completa
// ----------------------------------------------------------
const volumeSlider = document.getElementById("volume-slider");
const volLow = document.querySelector(".right-bottom .fa-volume-low");
const volHigh = document.querySelector(".right-bottom .fa-volume-high");

// Configuración inicial
if (volumeSlider) {
  volumeSlider.min = 0;
  volumeSlider.max = 100;
  volumeSlider.step = 10;
  volumeSlider.value = 70;
  audio.volume = 0.7; // volumen inicial (70%)

  // Función central para aplicar volumen
  function setVolume(value) {
    const v = Math.max(0, Math.min(100, value));
    volumeSlider.value = v;
    audio.volume = v / 100;
    console.log(`🔊 Volumen: ${v}%`);
  }

  // Slider en tiempo real
  volumeSlider.addEventListener("input", () => {
    setVolume(parseInt(volumeSlider.value, 10));
  });

  // Teclas de flecha (10 en 10)
  volumeSlider.addEventListener("keydown", (e) => {
    let v = parseInt(volumeSlider.value, 10);
    if (e.key === "ArrowRight" || e.key === "ArrowUp") v = Math.min(100, v + 10);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") v = Math.max(0, v - 10);
    setVolume(v);
  });

  // Iconos volumen bajo/alto
  if (volLow) {
    volLow.addEventListener("click", () => {
      setVolume(parseInt(volumeSlider.value, 10) - 10);
    });
  }
  if (volHigh) {
    volHigh.addEventListener("click", () => {
      setVolume(parseInt(volumeSlider.value, 10) + 10);
    });
  }

  // Inicializar coherencia visual
  setVolume(70);
}


// ----------------------------------------------------------
// 🎶 Manejo del final de pista (integración con Repeat/Shuffle)
// ----------------------------------------------------------
audio.addEventListener("ended", () => {
  if (modo !== "local" || !playlist.length) return;

  if (repeatActivo) {
    // repetir la misma pista
    reproducirLocal(currentIndex);
    return;
  }

  if (shuffleActivo) {
    // reproducir aleatoria distinta
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * playlist.length);
    } while (newIndex === currentIndex);
    reproducirLocal(newIndex);
    return;
  }

  // reproducción normal (siguiente en orden)
  currentIndex = (currentIndex + 1) % playlist.length;
  reproducirLocal(currentIndex);
});


  // ----------------------------------------------------------
  // 🟢 Inicialización tras primer gesto humano
  // ----------------------------------------------------------
document.addEventListener("click", () => {
  if (!gestureDetected) {
    gestureDetected = true;
    audio.muted = false;

    if (modo === "radio") {
      cambiarModoARadio();   // activa stream y metadatos
    } else {
      activarModoLocal();    // solo si el usuario cambió manualmente
    }

    actualizarBotonPlay();
    console.log("🟢 Gesto humano: sistema inicializado.");
  }
}, { once: true });


  // ----------------------------------------------------------
  // 🚀 Arranque inicial (antes del gesto: prepara visual)
  // ----------------------------------------------------------
  inicializarCarruselStreaming();
  colorOndasPorGenero("radio");
  actualizarInformacion(null);
});

// Mostrar mensaje al hacer clic derecho
document.addEventListener("contextmenu", (e) => {
  e.preventDefault(); // evitar menú contextual
  const msg = document.getElementById("custom-message");
  msg.classList.add("show");

  // Ocultar automáticamente después de unos segundos
  setTimeout(() => {
    msg.classList.remove("show");
  }, 2000);
});



