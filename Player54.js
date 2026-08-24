//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. FUNCIONES DE CREACIÓN DE ELEMENTOS (ESQUELETO HTML)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearAudio() {
  const audio = document.createElement("audio");
  audio.id = "player";
  // No se pone src ni autoplay aquí, main.js controlará la reproducción
  return audio;
}

function crearDiscoVinil() {
  const div = document.createElement("div");
  div.className = "ctn-disc";
  const img = document.createElement("img");
  img.src = ""; // Se llenará desde main.js (ASSETS.discVinyl)
  img.alt = "Disco de vinil";
  img.className = "disc-img";
  div.appendChild(img);
  return div;
}

function crearLogoWrapper() {
  const div = document.createElement("div");
  div.className = "wrapper";
  const img = document.createElement("img");
  img.src = ""; // Se llenará desde main.js (ASSETS.coverDefault)
  img.alt = "Logo Central";
  img.className = "cover-art";
  div.appendChild(img);
  return div;
}

function crearFussionBase() {
  const div = document.createElement("div");
  div.className = "ctn-base";
  const img = document.createElement("img");
  img.src = ""; // Se llenará desde main.js (ASSETS.fussionBase)
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
  imgPlay.src = ""; // Se llenará desde main.js (ASSETS.playBtn)
  imgPlay.alt = "Play/Pause";
  btnPlay.appendChild(imgPlay);

  const btnPlus = document.createElement("button");
  btnPlus.id = "plus";
  const imgPlus = document.createElement("img");
  imgPlus.src = ""; // Se llenará desde main.js (ASSETS.plusBtn)
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
  btnRwd.innerHTML = '<i class="fas fa-backward-step"></i>';

  const btnFwd = document.createElement("button");
  btnFwd.id = "btn-fwd";
  btnFwd.className = "btn-fwd";
  btnFwd.innerHTML = '<i class="fas fa-forward-step"></i>';

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
  imgTurbine.src = ""; // Se llenará desde main.js (ASSETS.coverDefault)
  imgTurbine.alt = "Carátula en Turbina";
  imgTurbine.className = "turbine-cover-img";
  turbineContainer.appendChild(imgTurbine);

  const imgOverlay = document.createElement("img");
  imgOverlay.src = ""; // Se llenará desde main.js (ASSETS.buttonDecorative)
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
// 2. ENSAMBLADOR Y LANZAMIENTO GLOBAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function inicializarEstructuraDOM() {
  const body = document.body;
  body.innerHTML = "";

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
  
  body.appendChild(mainContainer);

  // Efecto Ripples
  if (typeof $.fn.ripples === 'function') {
    $('.main-container').ripples({ resolution: 512, dropRadius: 20, perturbance: 0.04 });
  }

  console.log("✅ Estructura HTML dinámica inyectada correctamente.");
  
  window.dispatchEvent(new Event("repro-ready"));
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarEstructuraDOM();
});
