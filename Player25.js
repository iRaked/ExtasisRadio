//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 AUDIO PRINCIPAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearAudio() {
  const audio = document.createElement("audio");
  audio.id = "player";
  audio.setAttribute("autoplay", "");
  audio.setAttribute("muted", "");
  audio.src = "https://stream-179.surfernetwork.com/xk7mncypfa0uv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJ4azdtbmN5cGZhMHV2IiwiaG9zdCI6InN0cmVhbS0xNzkuc3VyZmVybmV0d29yay5jb20iLCJydHRsIjo1LCJqdGkiOiJFWWhhaUdHblR1cXM1T0ZsQVJkYklnIiwiaWF0IjoxNzg3NTE0MzczLCJleHAiOjE3ODc1MTQ0MzN9.jD9Ywk3MTar7pVggqmh-z8usYfm1Ka-QIqg5WkhM4qI";
  return audio;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌊 CONTENEDOR PRINCIPAL (main-container + bg-water)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearMainContainer() {
  const container = document.createElement("div");
  container.className = "main-container";
  
  // El audio va dentro del contenedor principal
  container.appendChild(crearAudio());
  
  return container;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💿 DISCO DE VINIL (Fondo)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ LOGO / PORTADA CENTRAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌌 IMAGEN BASE (Fussion3)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 METADATOS (Marquesina Superior)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearMetadatos() {
  const div = document.createElement("div");
  div.className = "metadata-marquee marquee";
  
  const span = document.createElement("span");
  span.id = "player-track";
  span.textContent = "[1] Título del Track — Artista - Género - 0:00";
  
  div.appendChild(span);
  return div;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🕒 INFO Y RADIOESCUCHAS (Marquesina Inferior)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearInfoMarquee() {
  const div = document.createElement("div");
  div.className = "info-marquee marquee";
  
  const span = document.createElement("span");
  span.id = "player-info";
  span.textContent = "Día: Domingo • Mes: Agosto • Año: 2026 • Hora: 00:00 | 🎧 Radioescuchas: 0";
  
  div.appendChild(span);
  return div;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎛️ CONTROLES PRINCIPALES (Play/Plus)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearControles() {
  const div = document.createElement("div");
  div.className = "controls-wrapper";

  // Botón Play/Pause
  const btnPlay = document.createElement("button");
  btnPlay.id = "playPause";
  const imgPlay = document.createElement("img");
  imgPlay.src = "https://santi-graphics.vercel.app/assets/img/play-btn-silver.png";
  imgPlay.alt = "Play/Pause";
  btnPlay.appendChild(imgPlay);

  // Botón Plus (Modo)
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏪ ⏩ BOTONES AVANCE Y RETROCESO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ DECORATIVOS (Turbina + Carátula lateral)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 MENSAJE PERSONALIZADO (Clic derecho)
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function crearMensajePersonalizado() {
  const div = document.createElement("div");
  div.id = "custom-message";
  div.className = "custom-message";
  div.textContent = "Santi Graphics";
  return div;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💧 ACTIVACIÓN RIPPLES
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function inicializarRipples() {
  try {
    $('.main-container').ripples({
      resolution: 512,
      dropRadius: 20,
      perturbance: 0.04
    });
    console.log("💧 Efecto Ripples inicializado.");
  } catch (e) {
    console.warn("⚠️ Error al inicializar Ripples:", e);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧩 ENSAMBLADOR FINAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function inicializarReproductor() {
  const body = document.body;
  
  // 1. Crear contenedor principal
  const mainContainer = crearMainContainer();
  
  // 2. Ensamblar capas en orden de z-index
  mainContainer.appendChild(crearDiscoVinil());
  mainContainer.appendChild(crearLogoWrapper());
  mainContainer.appendChild(crearFussionBase());
  mainContainer.appendChild(crearMetadatos());
  mainContainer.appendChild(crearInfoMarquee());
  mainContainer.appendChild(crearControles());
  mainContainer.appendChild(crearBotonesAvanceRetroceso());
  mainContainer.appendChild(crearDecorativos());
  mainContainer.appendChild(crearMensajePersonalizado());
  
  // 3. Inyección al DOM (reemplaza o limpia el body para evitar duplicados)
  body.innerHTML = ""; 
  body.appendChild(mainContainer);

  // 4. Inicialización de Motores Visuales
  inicializarRipples();

  // 5. Disparar evento de listo para que Repro25.js pueda tomar el control
  window.dispatchEvent(new Event("repro-ready"));
  console.log("✅ Estructura HTML dinámica ensamblada correctamente.");
}

// Lanzamiento
document.addEventListener("DOMContentLoaded", () => {
  inicializarReproductor();
});
