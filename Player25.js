//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. FUNCIONES DE CREACIÓN DE ELEMENTOS (HTML DINÁMICO)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function crearAudio() {
  const audio = document.createElement("audio");
  audio.id = "player";
  audio.setAttribute("autoplay", "");
  audio.setAttribute("muted", "");
  audio.src = "https://stream-179.surfernetwork.com/xk7mncypfa0uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJ4azdtbmN5cGZhMHV2IiwiaG9zdCI6InN0cmVhbS0xNzkuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiJFWWhhaUdHblR1cXM1T0ZsQVJkYklnIiwiaWF0IjoxNzg3NTE0MzczLCJleHAiOjE3ODc1MTQ0MzN9.jD9Ywk3MTar7pVggqmh-z8usYfm1Ka-QIqg5WkhM4qI";
  return audio;
}

function crearDiscoVinil() {
  const div = document.createElement("div");
  div.className = "ctn-disc";
  const img = document.createElement("img");
  img.src = "https://santi-graphics.vercel.app/assets/img/Disc-Power.png";
  img.alt = "Disco de vinil";
  img.className = "disc-img";
  div.appendChild(img);
  return div;
}

function crearLogoWrapper() {
  const div = document.createElement("div");
  div.className = "wrapper";
  const img = document.createElement("img");
  img.src = "https://santi-graphics.vercel.app/assets/img/DiscoRG.jpg";
  img.alt = "Logo Central";
  img.className = "cover-art";
  div.appendChild(img);
  return div;
}

function crearFussionBase() {
  const div = document.createElement("div");
  div.className = "ctn-base";
  const img = document.createElement("img");
  img.src = "https://santi-graphics.vercel.app/assets/img/Fussion3.png";
  img.alt = "Imagen Base";
  img.className = "stage-fussion";
  div.appendChild(img);
  return div;
}

function crearMetadatos() {
  const div = document.createElement("div");
  div.className = "metadata-marquee marquee";
  const span = document.createElement("span");
  span.id = "player-track";
  span.textContent = "En La Disco RG — Conectando...";
  div.appendChild(span);
  return div;
}

function crearInfoMarquee() {
  const div = document.createElement("div");
  div.className = "info-marquee marquee";
  const span = document.createElement("span");
  span.id = "player-info";
  span.textContent = "Cargando fecha y oyentes...";
  div.appendChild(span);
  return div;
}

function crearControles() {
  const div = document.createElement("div");
  div.className = "controls-wrapper";

  const btnPlay = document.createElement("button");
  btnPlay.id = "playPause";
  const imgPlay = document.createElement("img");
  imgPlay.src = "https://santi-graphics.vercel.app/assets/img/play-btn-silver.png";
  imgPlay.alt = "Play/Pause";
  btnPlay.appendChild(imgPlay);

  const btnPlus = document.createElement("button");
  btnPlus.id = "plus";
  const imgPlus = document.createElement("img");
  imgPlus.src = "https://santi-graphics.vercel.app/assets/img/plus-btn-silver.png";
  imgPlus.alt = "Plus";
  btnPlus.appendChild(imgPlus);

  div.appendChild(btnPlay);
  div.appendChild(btnPlus);
  return div;
}

function crearBotonesAvanceRetroceso() {
  const fragment = document.createDocumentFragment();

  const btnRwd = document.createElement("button");
  btnRwd.id = "btn-rwd";
  btnRwd.className = "btn-rwd";
  const iRwd = document.createElement("i");
  iRwd.className = "fas fa-backward-step";
  btnRwd.appendChild(iRwd);

  const btnFwd = document.createElement("button");
  btnFwd.id = "btn-fwd";
  btnFwd.className = "btn-fwd";
  const iFwd = document.createElement("i");
  iFwd.className = "fas fa-forward-step";
  btnFwd.appendChild(iFwd);

  fragment.appendChild(btnRwd);
  fragment.appendChild(btnFwd);
  return fragment;
}

function crearDecorativos() {
  const div = document.createElement("div");
  div.className = "decorative-wrapper";

  const turbineContainer = document.createElement("div");
  turbineContainer.className = "turbine-cover-container";
  const imgTurbine = document.createElement("img");
  imgTurbine.src = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
  imgTurbine.alt = "Carátula en Turbina";
  imgTurbine.className = "turbine-cover-img";
  turbineContainer.appendChild(imgTurbine);

  const imgOverlay = document.createElement("img");
  imgOverlay.src = "https://santi-graphics.vercel.app/assets/img/Button-Silver.png";
  imgOverlay.alt = "Botón decorativo";
  imgOverlay.className = "decorative-overlay";

  div.appendChild(turbineContainer);
  div.appendChild(imgOverlay);
  return div;
}

function crearMensajePersonalizado() {
  const div = document.createElement("div");
  div.id = "custom-message";
  div.className = "custom-message";
  div.textContent = "Santi Graphics";
  return div;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. ENSAMBLADOR Y LÓGICA DE EVENTOS (ORDEN CRÍTICO)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function inicializarReproductor() {
  const body = document.body;
  body.innerHTML = ""; // Limpia el body para evitar duplicados

  // 2.1 Crear y ensamblar el contenedor principal
  const mainContainer = document.createElement("div");
  mainContainer.className = "main-container";
  
  mainContainer.appendChild(crearAudio());
  mainContainer.appendChild(crearDiscoVinil());
  mainContainer.appendChild(crearLogoWrapper());
  mainContainer.appendChild(crearFussionBase());
  mainContainer.appendChild(crearMetadatos());
  mainContainer.appendChild(crearInfoMarquee());
  mainContainer.appendChild(crearControles());
  mainContainer.appendChild(crearBotonesAvanceRetroceso());
  mainContainer.appendChild(crearDecorativos());
  mainContainer.appendChild(crearMensajePersonalizado());
  
  // 2.2 Inyectar al DOM (¡AHORA LOS ELEMENTOS YA EXISTEN!)
  body.appendChild(mainContainer);

  // 2.3 Inicializar efectos visuales
  if (typeof $.fn.ripples === 'function') {
    $('.main-container').ripples({ resolution: 512, dropRadius: 20, perturbance: 0.04 });
    console.log("💧 Efecto Ripples inicializado.");
  }

  // 2.4 LÓGICA DE EVENTOS (Segura, porque el DOM ya existe)
  const audio = document.getElementById("player");
  const btnPlay = document.getElementById("playPause");
  const btnPlus = document.getElementById("plus");
  const btnRwd = document.getElementById("btn-rwd");
  const btnFwd = document.getElementById("btn-fwd");
  const trackSpan = document.getElementById("player-track");
  const infoSpan = document.getElementById("player-info");
  const discImg = document.querySelector(".disc-img");
  const turbineCoverImg = document.querySelector(".turbine-cover-img");
  const customMsg = document.getElementById("custom-message");

  let gestureDetected = false;
  let modoActual = "radio";

  // Función auxiliar para actualizar UI de Play/Pause
  function setPlayState(isPlaying) {
    if (!btnPlay) return;
    const img = btnPlay.querySelector("img");
    if (isPlaying) {
      img.src = "https://santi-graphics.vercel.app/assets/img/pause-btn-silver.png";
      if (discImg) discImg.style.animationPlayState = "running";
    } else {
      img.src = "https://santi-graphics.vercel.app/assets/img/play-btn-silver.png";
      if (discImg) discImg.style.animationPlayState = "paused";
    }
  }

  // Evento Play/Pause
  if (btnPlay) {
    btnPlay.addEventListener("click", () => {
      if (!gestureDetected) { gestureDetected = true; audio.muted = false; }
      if (audio.paused || audio.ended) {
        audio.play().then(() => setPlayState(true)).catch(console.warn);
      } else {
        audio.pause();
        setPlayState(false);
      }
    });
  }

  // Evento Plus (Cambio de modo - Ejemplo básico)
  if (btnPlus) {
    btnPlus.addEventListener("click", () => {
      if (!gestureDetected) { gestureDetected = true; audio.muted = false; }
      modoActual = (modoActual === "radio") ? "local" : "radio";
      if (trackSpan) trackSpan.textContent = `Modo cambiado a: ${modoActual.toUpperCase()}`;
      // Aquí iría la lógica completa de carga de JSON o Radio
    });
  }

  // Evento Clic Derecho
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (customMsg) {
      customMsg.classList.add("show");
      setTimeout(() => customMsg.classList.remove("show"), 2000);
    }
  });

  // Sincronización con eventos nativos del audio
  if (audio) {
    audio.addEventListener('playing', () => setPlayState(true));
    audio.addEventListener('pause', () => setPlayState(false));
    
    // Desbloqueo de audio en el primer clic en cualquier parte
    document.addEventListener("click", () => {
      if (!gestureDetected) {
        gestureDetected = true;
        audio.muted = false;
        if (audio.paused) audio.play().catch(() => {});
      }
    }, { once: true });
  }

  console.log("✅ Estructura HTML dinámica y lógica de eventos ensambladas correctamente.");
  
  // Disparar evento por si otros scripts (como Repro25.js) necesitan escuchar
  window.dispatchEvent(new Event("repro-ready"));
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. LANZAMIENTO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener("DOMContentLoaded", () => {
  inicializarReproductor();
});
