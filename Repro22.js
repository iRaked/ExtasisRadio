// 🎥 Control ritual del prisma 3D con animación automática, detención y rotación manual
const cube = document.querySelector('.cube');

let isDragging = false;
let previousX, previousY;
let rotateX = -30;
let rotateY = -45;

// 🖱️ Activar arrastre y pausar animación
document.querySelector('.scene').addEventListener('mousedown', (e) => {
  isDragging = true;
  previousX = e.clientX;
  previousY = e.clientY;
  cube.classList.add('paused');
  cube.style.animation = 'none';
});

// 🖱️ Detener arrastre y alinear
document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    rotateX = -30;
    rotateY = -45;
    cube.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    cube.style.animation = '';
    if (!cube.classList.contains('paused')) {
      cube.style.animation = 'spin 10s infinite linear';
    }
  }
});

// 🖱️ Rotar mientras se arrastra
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const deltaX = e.clientX - previousX;
  const deltaY = e.clientY - previousY;

  rotateY += deltaX * 0.5;
  rotateX -= deltaY * 0.5;

  cube.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  previousX = e.clientX;
  previousY = e.clientY;
});

// 🖱️ Alternar animación con clic
cube.addEventListener('click', function () {
  this.classList.toggle('paused');
  if (this.classList.contains('paused')) {
    this.style.animation = 'none';
  } else {
    this.style.animation = 'spin 10s infinite linear';
  }
});

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 02 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 REPRODUCTOR MODULAR
let playlist = [];
let currentIndex = 0;

const audio = document.getElementById('audio-player');

// 🎶 Cargar pista
function loadTrack(index) {
  const song = playlist[index];
  if (!song) return;

  const artistElem = document.querySelector('.artist');
  const trackElem = document.querySelector('.track');
  const albumElem = document.querySelector('.album');

  if (artistElem) artistElem.textContent = song.artist;
  if (trackElem) trackElem.textContent = song.title;
  if (albumElem) albumElem.textContent = song.album || 'Álbum desconocido';

  activarScrollSiNecesario();

  audio.src = song.dropbox_url || '';
  document.querySelector('.cover').style.backgroundImage = song.cover ? `url('${song.cover}')` : '';
  document.querySelector('.main-cover').style.backgroundImage = song.cover ? `url('${song.cover}')` : '';

  audio.load();
}

// 📦 Cargar playlist desde JSON
fetch('Repro22.json')
  .then(res => res.json())
  .then(data => {
    playlist = data;
    console.log(`🎶 Playlist cargada: ${playlist.length} pistas`);
    loadTrack(currentIndex);
  })
  .catch(err => console.error('❌ Error al cargar playlist:', err));

// 🎞️ Activación condicional de metadatos animados
function activarScrollSiNecesario() {
  const scrolling = document.querySelector('.scrolling');
  const meta = document.querySelector('.meta');

  if (scrolling && meta) {
    const necesitaScroll = meta.scrollWidth > scrolling.clientWidth;
    meta.classList.remove('animated');
    void meta.offsetWidth;
    meta.classList.toggle('animated', necesitaScroll);
  }
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 04 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ BOTONES DE CONTROL
const playBtn = document.getElementById('play-btn');
const playIcon = playBtn.querySelector('i');
const forwardBtn = document.querySelector('.btn-fwd');
const forwardIcon = forwardBtn.querySelector('i');
const rewindBtn = document.querySelector('.btn-rwd');
const rewindIcon = rewindBtn.querySelector('i');

playBtn.addEventListener('click', () => {
  if (audio.src) {
    if (audio.paused) {
      audio.play().then(() => {
        playIcon.classList.remove('fa-play');
        playIcon.classList.add('fa-pause');
        playBtn.setAttribute('aria-label', 'Pausar música');
      }).catch(err => console.error('Error al reproducir audio:', err));
    } else {
      audio.pause();
      playIcon.classList.remove('fa-pause');
      playIcon.classList.add('fa-play');
      playBtn.setAttribute('aria-label', 'Reproducir música');
    }
  } else {
    console.warn("⚠️ No hay pista cargada.");
  }
});

forwardBtn.addEventListener('click', () => {
  if (currentIndex + 1 < playlist.length) {
    currentIndex++;
    loadTrack(currentIndex);
    audio.play().catch(err => console.error('Error al reproducir siguiente pista:', err));
  }
  forwardIcon.classList.add('animate-spin');
  setTimeout(() => forwardIcon.classList.remove('animate-spin'), 600);
});

rewindBtn.addEventListener('click', () => {
  if (currentIndex - 1 >= 0) {
    currentIndex--;
    loadTrack(currentIndex);
    audio.play().catch(err => console.error('Error al reproducir pista anterior:', err));
  }
  rewindIcon.classList.add('animate-spin');
  setTimeout(() => rewindIcon.classList.remove('animate-spin'), 600);
});

audio.addEventListener('pause', () => {
  playIcon.classList.remove('fa-pause');
  playIcon.classList.add('fa-play');
  playBtn.setAttribute('aria-label', 'Reproducir música');
});

audio.addEventListener('play', () => {
  playIcon.classList.remove('fa-play');
  playIcon.classList.add('fa-pause');
  playBtn.setAttribute('aria-label', 'Pausar música');
});

audio.addEventListener('ended', () => {
  if (currentIndex + 1 < playlist.length) {
    currentIndex++;
    loadTrack(currentIndex);
    audio.play().catch(err => console.error('Error al reproducir siguiente pista:', err));
  } else {
    console.log('🎵 Fin de la playlist.');
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    playBtn.setAttribute('aria-label', 'Reproducir música');
  }
});