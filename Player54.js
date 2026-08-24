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
// 2. ENSAMBLADOR Y LANZAMIENTO GLOBAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function inicializarEstructuraDOM() {
  const body = document.body;
  body.innerHTML = ""; // Limpia el body para evitar duplicados

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

  if (typeof $.fn.ripples === 'function') {
    $('.main-container').ripples({ resolution: 512, dropRadius: 20, perturbance: 0.04 });
  }

  console.log("✅ Estructura HTML dinámica inyectada correctamente.");
  window.dispatchEvent(new Event("repro-ready"));
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarEstructuraDOM();
});
