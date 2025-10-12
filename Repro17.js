let currentTrack = 0;
let isPlaying = false;
let audio = new Audio();
audio.volume = 0.7; // Volumen inicial real
let playlist = [];
let emisora = '';

const caratula = document.querySelector('.caratula img');
const titulo = document.querySelector('.titulo');
const artista = document.querySelector('.artista');
const album = document.querySelector('.album');
const radio = document.querySelector('.radio');
const playBtn = document.querySelector('.play img');
const btnPrev = document.querySelector('.prev');
const btnNext = document.querySelector('.next');

// Cargar JSON y primer track
fetch('Repro17.json')
  .then(res => res.json())
  .then(data => {
    playlist = data.tracks;
    emisora = data.emisora;
    cargarTrack(currentTrack);
  });

// Reproducción Continua
audio.addEventListener('ended', () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  cargarTrack(currentTrack);
});

// Cargar track y actualizar visuales
function cargarTrack(index) {
  const track = playlist[index];
  audio.src = track.url;
  caratula.src = track.cover;

  const partes = track.name.split(' - ');
  const artistaNombre = partes[0] || 'Artista desconocido';
  const tituloNombre = partes[1] || track.name;

  radio.textContent = emisora;
  titulo.textContent = tituloNombre;
  artista.textContent = artistaNombre;
  album.textContent = track.album;

  activarScroll('.titulo-container');
  activarScroll('.artista-container');
  activarScroll('.album-container');

  // Reproducir automáticamente
  audio.play();
  isPlaying = true;
  playBtn.src = 'assets/img/btn-pause.png';
}

// Activar scroll si desborda
function activarScroll(selector) {
  const contenedor = document.querySelector(selector);
  const texto = contenedor.querySelector('span');

  texto.style.animation = 'none';
  texto.style.transform = 'translateX(0)';

  setTimeout(() => {
    const desborda = texto.scrollWidth > contenedor.offsetWidth;
    if (desborda) {
      texto.style.animation = 'scroll-left 8s linear infinite';
    }
  }, 50);
}

// Botón play/pause con cambio de imagen
document.querySelector('.play').addEventListener('click', () => {
  if (!isPlaying) {
    audio.play();
    isPlaying = true;
    playBtn.src = 'https://i.ibb.co/Z6d3VxJR/btn-pause.png';
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.src = 'https://i.ibb.co/G4bpCyPR/btn-play.png';
  }
});

// Botones Rewind & Forward
btnPrev.addEventListener('click', () => {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  cargarTrack(currentTrack);
  if (isPlaying) audio.play();
});

btnNext.addEventListener('click', () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  cargarTrack(currentTrack);
  if (isPlaying) audio.play();
});

// Doble clic: ajustar tiempo
btnPrev.addEventListener('dblclick', () => {
  audio.currentTime = Math.max(0, audio.currentTime - 10);
});

btnNext.addEventListener('dblclick', () => {
  audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
});

// Ecualizador miniatura
const canvas = document.getElementById('miniEQ');
const ctx = canvas.getContext('2d');

function drawEQ() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const barWidth = 2;
  const gap = 2;
  const bars = 5;

  for (let i = 0; i < bars; i++) {
    const x = i * (barWidth + gap);
    const height = Math.random() * canvas.height;
    ctx.fillStyle = 'white';
    ctx.fillRect(x, canvas.height - height, barWidth, height);
  }
}
setInterval(drawEQ, 100);

// Efecto visual en botones
const botones = document.querySelectorAll('.botonera button');
botones.forEach(boton => {
  boton.addEventListener('click', () => {
    boton.classList.add('efecto-activo');
    setTimeout(() => {
      boton.classList.remove('efecto-activo');
    }, 300);
  });
});

// Volumen
const slider = document.getElementById('volumenSlider');
slider.value = 70;
audio.volume = 0.7;

// Fondo visual sincronizado con valor inicial
const porcentaje = `${slider.value}%`;
slider.style.background = `linear-gradient(to right, white ${porcentaje}, transparent ${porcentaje})`;

slider.addEventListener('input', () => {
  const value = slider.value;
  const porcentaje = `${value}%`;
  slider.style.background = `linear-gradient(to right, white ${porcentaje}, transparent ${porcentaje})`;
  audio.volume = value / 100;
});
