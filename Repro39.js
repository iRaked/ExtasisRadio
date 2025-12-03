//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 AUDIO PRINCIPAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <audio id="player" autoplay muted></audio>
function crearAudio() {
  const audio = document.createElement("audio");
  audio.id = "player";
  audio.setAttribute("autoplay", "");
  audio.setAttribute("muted", "");
  return audio;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌊 SECTION PRINCIPAL (bg-water + ripples)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <section class="bg-water ripples jquery-ripples" id="stream1">
function crearSectionPrincipal() {
  const section = document.createElement("section");
  section.className = "bg-water ripples jquery-ripples";
  section.id = "stream1";
  section.dataset.tag = "";

  // Audio principal
  section.appendChild(crearAudio());

  // GIF overlay encima del BG
  const gifOverlay = document.createElement("img");
  gifOverlay.src = "assets/background/Butterflies.gif"; // tu gif aquí
  gifOverlay.alt = "Animación de fondo";
  gifOverlay.style.position = "absolute";
  gifOverlay.style.top = "0";
  gifOverlay.style.left = "0";
  gifOverlay.style.width = "100%";
  gifOverlay.style.height = "100%";
  gifOverlay.style.objectFit = "cover";
  gifOverlay.style.zIndex = "0";           // queda detrás del reproductor
  gifOverlay.style.pointerEvents = "none"; // no bloquea interacción
  section.appendChild(gifOverlay);

  return section;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💫 CANVAS BURBUJAS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <canvas id="burbujas" ...>
function crearCanvasBurbujas() {
  const canvas = document.createElement("canvas");
  canvas.id = "burbujas";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "0";
  canvas.style.pointerEvents = "none";
  return canvas;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✨ PIXI CONTAINER
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <div id="pixi-container" ...>
function crearPixiContainer() {
  const div = document.createElement("div");
  div.id = "pixi-container";
  div.style.position = "absolute";
  div.style.top = "0";
  div.style.left = "0";
  div.style.width = "100%";
  div.style.height = "100%";
  div.style.pointerEvents = "none";
  div.style.zIndex = "0";
  return div;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 REPRO BOX (contenedor principal)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <div class="repro-box"> ... </div>
function crearReproBox() {
  const reproBox = document.createElement("div");
  reproBox.className = "repro-box";

  // Header
  reproBox.appendChild(crearHeader());

  return reproBox;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏷️ HEADER (menú, info-time, contador, botón radio)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <div class="repro-header"> ... </div>
function crearHeader() {
  const header = document.createElement("div");
  header.className = "repro-header";

  // Botón menú
  const btnMenu = document.createElement("button");
  btnMenu.className = "btn-menu";
  btnMenu.id = "btn-menu-tracks";
  btnMenu.innerHTML = `
    <svg viewBox="0 0 512 512" class="icon-menu">
      <path d="M492 236H20c-11.046 0-20 8.954-20 20s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20zM492 76H20C8.954 76 0 84.954 0 96s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20zM492 396H20c-11.046 0-20 8.954-20 20s8.954 20 20 20h472c11.046 0 20-8.954 20-20s-8.954-20-20-20z"/>
    </svg>
  `;
  header.appendChild(btnMenu);

  // Nueva sección de información (fecha/hora)
  const infoTime = document.createElement("div");
  infoTime.className = "info-time";
  const spanInfo = document.createElement("span");
  spanInfo.id = "info-time-text";
  spanInfo.textContent = "Cargando...";
  infoTime.appendChild(spanInfo);
  header.appendChild(infoTime);

  // Contador de radioescuchas
  const radioescuchas = document.createElement("div");
  radioescuchas.className = "radioescuchas";
  radioescuchas.innerHTML = `<i class="fas fa-users"></i><span id="contadorRadio"></span>`;
  header.appendChild(radioescuchas);

  // Botón radio
  const btnRadio = document.createElement("button");
  btnRadio.className = "btn-radio";
  btnRadio.id = "btn-radio";
  btnRadio.setAttribute("aria-label", "Icono de Nota Musical");
  btnRadio.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55a4 4 0 1 0 2 3.45V7h4V3h-8z"/>
    </svg>
  `;
  header.appendChild(btnRadio);

  return header;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💿 VISUAL EFFECTS (logo, carátula, orbital glow)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <section id="visual-effects" class="visual-effects"> ...
function crearVisualEffects() {
  const section = document.createElement("section");
  section.id = "visual-effects";
  section.className = "visual-effects";

  const wrapper = document.createElement("div");
  wrapper.className = "logo-waves-wrapper";

  // Logo / Carátula
  const figure = document.createElement("figure");
  figure.className = "radio-logo";
  const img = document.createElement("img");
  img.id = "disc-img";
  img.src = "assets/covers/Cover1.png";
  img.alt = "Carátula";
  figure.appendChild(img);
  wrapper.appendChild(figure);

  // Effects layer
  const effectsLayer = document.createElement("div");
  effectsLayer.className = "effects-layer";

  const orbitalContainer = document.createElement("div");
  orbitalContainer.className = "orbital_container";

  const orbitalArc = document.createElement("div");
  orbitalArc.className = "orbital_arc arc2";

  const avatarGlow = document.createElement("div");
  avatarGlow.className = "avatar-glow";

  orbitalContainer.appendChild(orbitalArc);
  orbitalContainer.appendChild(avatarGlow);
  effectsLayer.appendChild(orbitalContainer);

  wrapper.appendChild(effectsLayer);
  section.appendChild(wrapper);

  return section;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎚️ FOOTER (meta-marquee, controles, volumen)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <footer class="footer-2_5d"> ...
function crearFooter() {
  const footer = document.createElement("footer");
  footer.className = "footer-2_5d";

  // Left zone: meta-marquee
  const leftZone = document.createElement("div");
  leftZone.className = "left-zone";

  const metaMarquee = document.createElement("div");
  metaMarquee.className = "meta-marquee";

  const metaTrack = document.createElement("div");
  metaTrack.className = "meta-track";
  metaTrack.id = "meta-track";
  metaTrack.textContent = "Cargando metadatos...";

  metaMarquee.appendChild(metaTrack);
  leftZone.appendChild(metaMarquee);

  footer.appendChild(leftZone);

  // Botonera
  footer.appendChild(crearBotonera());

  // Right zone: volumen
  const rightZone = document.createElement("div");
  rightZone.className = "right-zone";

  const volDown = document.createElement("i");
  volDown.className = "fas fa-volume-down volume-icon";
  volDown.id = "volumeIcon";

  const volTrack = document.createElement("div");
  volTrack.className = "volume-track";

  const volBar = document.createElement("input");
  volBar.type = "range";
  volBar.min = "0";
  volBar.max = "100";
  volBar.value = "70";
  volBar.className = "volume-bar";
  volBar.id = "volumeBar";

  volTrack.appendChild(volBar);

  const volUp = document.createElement("i");
  volUp.className = "fas fa-volume-up volume-icon";

  rightZone.appendChild(volDown);
  rightZone.appendChild(volTrack);
  rightZone.appendChild(volUp);

  footer.appendChild(rightZone);

  return footer;
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏯️ BOTONERA (repeat, prev, play/pause, next, shuffle)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <div class="botonera"> ...
function crearBotonera() {
  const botonera = document.createElement("div");
  botonera.className = "botonera";

  const buttons = document.createElement("div");
  buttons.id = "buttons";
  buttons.className = "flex justify-center items-center mt-6";

  // Repeat
  const btnRepeat = document.createElement("button");
  btnRepeat.id = "repeat-button";
  btnRepeat.className = "flex justify-center items-center w-8 h-8 rounded-full soft";
  btnRepeat.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512.016 512.016" class="w-4 h-4" fill="#282b33">
      <path d="M507.336 100.696l-96-96C406.76.12 399.88-1.256 393.896 1.24c-5.984 2.496-9.888 8.288-9.888 14.752v48h-208c-97.216 0-176 78.784-176 176 0 8.832 7.168 16 16 16h64c8.832 0 16-7.168 16-16 0-44.192 35.808-80 80-80h208v48c0 6.464 3.904 12.32 9.888 14.784 5.984 2.496 12.864 1.12 17.44-3.456l96-96c6.24-6.24 6.24-16.384 0-22.624zM496.008 255.992h-64c-8.832 0-16 7.168-16 16 0 44.192-35.808 80-80 80h-208v-48c0-6.464-3.904-12.32-9.888-14.784s-12.832-1.088-17.44 3.488l-96 96c-6.24 6.24-6.24 16.384 0 22.624l96 96c4.576 4.576 11.456 5.952 17.44 3.456s9.888-8.32 9.888-14.784v-48h208c97.216 0 176-78.784 176-176 0-8.832-7.168-16-16-16z"/>
    </svg>
  `;
  buttons.appendChild(btnRepeat);

  // Prev
  const btnPrev = document.createElement("button");
  btnPrev.id = "prev-button";
  btnPrev.className = "flex justify-center items-center w-12 h-12 ml-6 rounded soft";
  btnPrev.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45.771 45.772" class="w-6 h-6" fill="#fff">
      <path d="M18.982 4.75c-1.217-.502-2.504-.222-3.433.711L1.245 19.892c-1.678 1.686-1.65 4.411.028 6.098l14.374 14.433c.929.932 2.113 1.213 3.33.71 1.215-.502 1.795-1.688 1.795-3.003V7.753c-.001-1.315-.572-2.503-1.79-3.003zM43.876 4.64c-1.216-.502-2.558-.222-3.486.711L26.058 19.783c-1.677 1.686-1.663 4.41.015 6.098L40.44 40.312c.93.932 2.217 1.213 3.435.711 1.215-.503 1.897-1.688 1.897-3.004V7.644c-.001-1.317-.679-2.502-1.896-3.004z"/>
    </svg>
  `;
  buttons.appendChild(btnPrev);

  // Play/Pause
  const btnPlayPause = document.createElement("button");
  btnPlayPause.id = "btn-play-pause";
  btnPlayPause.className = "flex justify-center items-center w-20 h-20 ml-6 rounded-full soft btn-play";
  btnPlayPause.setAttribute("aria-label", "Play/Pause");
  btnPlayPause.innerHTML = `
    <!-- Ícono PLAY -->
    <svg class="icon-play icons w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 173.861 173.861">
      <g transform="translate(5,5)">
        <path d="M34.857 3.613C20.084-4.861 8.107 2.081 8.107 19.106v125.637c0 17.042 11.977 23.975 26.75 15.509L144.67 97.275c14.778-8.477 14.778-22.211 0-30.686L34.857 3.613z" fill="#17191e"/>
      </g>
    </svg>
    <!-- Ícono PAUSE -->
    <svg class="icon-pause icons w-8 h-8 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect x="30" y="20" width="20" height="80" fill="#17191e"/>
      <rect x="70" y="20" width="20" height="80" fill="#17191e"/>
    </svg>
  `;
  buttons.appendChild(btnPlayPause);

  // Next
  const btnNext = document.createElement("button");
  btnNext.id = "next-button";
  btnNext.className = "flex justify-center items-center w-12 h-12 ml-6 rounded soft";
  btnNext.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57 57" class="w-6 h-6" fill="#fff">
      <path d="M56.575 27.683l-27-19c-.306-.216-.703-.242-1.036-.07A.9988.9988 0 0028 9.5v17.777L1.575 8.694a1.0033 1.0033 0 00-1.036-.069C.208 8.797 0 9.14 0 9.513v37.975c0 .373.208.716.539.888.146.074.304.111.461.111.202 0 .403-.062.575-.182L28 29.723V47.5c0 .373.208.716.539.888.146.075.304.112.461.112.202 0 .404-.062.575-.183l27-19c.267-.186.425-.492.425-.817s-.158-.631-.425-.817z"/>
    </svg>
  `;
  buttons.appendChild(btnNext);

  // Shuffle
  const btnShuffle = document.createElement("button");
  btnShuffle.id = "shuffle-button";
  btnShuffle.className = "flex justify-center items-center w-8 h-8 ml-6 rounded-full soft";
  btnShuffle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375.633 375.633" class="w-4 h-4" fill="#282b33" stroke="none">
        <path d="M375.627 279.726l-78.877 67.608v-45.079h-13.277c-41.919 0-72.786-18.781-98.268-43.648 
  9.828-11.569 18.738-23.214 27.027-34.108 1.904-2.513 3.796-4.993 5.684-7.473 
  18.852 19.494 39.129 32.645 65.562 32.645h13.277v-37.568l78.872 67.623zM0 129.466h39.308c24.927 0 
  44.377 11.716 62.321 29.371 2.953-3.791 5.939-7.74 8.953-11.683 7.337-9.66 15.093-19.831 
  23.497-29.975-24.813-23.187-54.75-40.309-94.77-40.309H0v52.596zM296.75 28.299v44.818h-13.277c-69.375 
  0-108.488 51.421-143.004 96.804-31.046 40.749-57.85 75.989-101.161 75.989H0v52.59h39.308c69.386 
  0 108.498-51.394 143.015-96.766 31.035-40.798 57.844-76.033 101.15-76.033h13.277v37.84l78.883-67.629-78.883-67.613z"/>
    </svg>
  `;
  buttons.appendChild(btnShuffle);

  botonera.appendChild(buttons);
  return botonera;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📜 MODAL TRACKS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// <div id="modal-tracks" class="modal hidden"> ...
function crearModalTracks() {
  const modal = document.createElement("div");
  modal.id = "modal-tracks";
  modal.className = "modal hidden";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  // Botón cerrar
  const btnClose = document.createElement("button");
  btnClose.id = "close-modal";
  btnClose.className = "modal-x";
  btnClose.textContent = "✕";
  modalContent.appendChild(btnClose);

  // Título
  const titulo = document.createElement("h2");
  titulo.className = "modal-title";
  titulo.textContent = "Tracks disponibles";
  modalContent.appendChild(titulo);

  // Info actual (ID corregido: current-track-name-modal)
  const info = document.createElement("p");
  info.className = "modal-info";
  info.innerHTML = `Reproduciendo: <span id="current-track-name-modal">Cargando...</span>`;
  modalContent.appendChild(info);

  // Lista dinámica
  const lista = document.createElement("ul");
  lista.className = "track-list";
  modalContent.appendChild(lista);

  modal.appendChild(modalContent);
  return modal;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌊 Waves EQ (Vue)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inicializa el ecualizador animado
function inicializarWavesEQ() {
  new Vue({
    el: "#app",
    data: {
      bars: Array(49).fill(0).map(() => 5 + Math.random() * 30)
    },
    methods: {
      updateBars() {
        this.bars.shift();
        this.bars.push(5 + Math.random() * 30);
      }
    },
    created() {
      setInterval(this.updateBars, 150);
    }
  });
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💧 Activación Ripples
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inicializa el efecto de ondas en bg-water
function inicializarRipples() {
  try {
    $('.bg-water').ripples({
      resolution: 200,
      perturbance: 0.04
    });
  } catch (e) {
    $('.error').show().text(e);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎈 Burbujas Pixi
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inicializa las burbujas animadas con Pixi.js
function inicializarPixiBubbles() {
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundAlpha: 0
  });

  document.getElementById("pixi-container").appendChild(app.view);

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

  const burbujas = [];

  for (let i = 0; i < 30; i++) {
    const burbuja = new PIXI.Graphics();
    const radius = Math.random() * 8 + 4;
    burbuja.beginFill(0xffffff, 0.2);
    burbuja.drawCircle(0, 0, radius);
    burbuja.endFill();
    burbuja.x = Math.random() * app.renderer.width;
    burbuja.y = Math.random() * app.renderer.height;
    burbuja.vy = Math.random() * 0.5 + 0.2;
    app.stage.addChild(burbuja);
    burbujas.push(burbuja);
  }

  app.ticker.add(() => {
    burbujas.forEach(b => {
      b.y -= b.vy;
      if (b.y < -10) {
        b.y = app.renderer.height + 10;
        b.x = Math.random() * app.renderer.width;
      }
    });
  });
}


//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧩 ENSAMBLADOR FINAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Une todas las piezas y las inserta en body
function inicializarReproductor() {
  const body = document.body;
  body.innerHTML = ""; // limpia cualquier contenido previo

  // Section principal
  const section = crearSectionPrincipal();

  // ReproBox
  const reproBox = crearReproBox();
  reproBox.appendChild(crearVisualEffects());
  reproBox.appendChild(crearFooter());

  // Mensaje personalizado
  const customMessage = document.createElement("div");
  customMessage.id = "custom-message";
  customMessage.className = "custom-message";
  customMessage.textContent = "Santi Graphics";
  reproBox.appendChild(customMessage);

  section.appendChild(reproBox);
  body.appendChild(section);

  // Modal tracks
  body.appendChild(crearModalTracks());

  // Inicializadores de efectos visuales
  inicializarWavesEQ();
  inicializarRipples();

  // 🔑 Señal explícita para Player20.js
  window.dispatchEvent(new Event("repro-ready"));
}

// ⚡️ Ejecutar ensamblador de inmediato (defer garantiza que body ya existe)
inicializarReproductor();