document.addEventListener('DOMContentLoaded', () => {
  let modo = localStorage.getItem('modoRepro') || 'streaming';
  let isPlaying = false;
  let currentTrack = 0;
  let playlist = [];
  let aleatorioActivo = false;
  let radioMetaIntervalId = null;

  const audio = document.getElementById('player');
  const btnPlay = document.getElementById('btnPlay');     // toggle panel
  const btnPause = document.getElementById('btnPause');   // Pause/Play
  const btnShuffle = document.querySelector('.sur');
  const btnFwd = document.querySelector('.este');
  const btnRwd = document.querySelector('.oeste');
  const btnPlus = document.getElementById('btn-plus');
  const metaItems = document.querySelectorAll('.meta-item span');
  const activador = document.getElementById('activador');
  const switchPanel = document.getElementById('switch');
  const contenedorMetadatos = document.querySelector('.contenedor-metadatos');

  // 🔓 Desbloqueo ceremonial
  ['click', 'touchstart', 'keydown'].forEach(evento => {
    window.addEventListener(evento, () => {
      if (audio.muted) audio.muted = false;
      audio.play().catch(() => {});
    }, { once: true });
  });

  // 🎼 Cargar JSON local
  fetch('Repro4.json')
    .then(res => res.json())
    .then(data => {
      playlist = data.hits || [];
      if (modo === 'streaming') {
        activarStreaming();
      } else {
        cargarTrack(currentTrack);
      }
    })
    .catch(() => {
      playlist = [];
    });

  // ▶️ Botón Play → toggle panel
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (switchPanel) switchPanel.classList.toggle('visible');
    });
  }

  // ⏯ Botón Pause → Pause/Play
  if (btnPause) {
    btnPause.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(() => { isPlaying = true; }).catch(() => {});
      } else {
        audio.pause();
        isPlaying = false;
      }
    });
  }

  // 🔀 Shuffle inmediato
  if (btnShuffle) {
    btnShuffle.addEventListener('click', () => {
      aleatorioActivo = !aleatorioActivo;
      const icono = btnShuffle.querySelector('i');
      if (icono) icono.style.color = aleatorioActivo ? '#3688ff' : '';

      if (aleatorioActivo && modo === 'local' && playlist.length > 1) {
        let siguiente;
        do {
          siguiente = Math.floor(Math.random() * playlist.length);
        } while (siguiente === currentTrack);
        currentTrack = siguiente;
        cargarTrack(currentTrack);
      }
    });
  }

  // ⏭ Avanzar
  if (btnFwd) btnFwd.addEventListener('click', avanzarTrack);

  // ⏮ Retroceder
  if (btnRwd) {
    btnRwd.addEventListener('click', () => {
      if (modo === 'local' && playlist.length) {
        currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
        cargarTrack(currentTrack);
      }
    });
  }

  // 🎧 Cargar track local
  function cargarTrack(index) {
    const track = playlist[index];
    if (!track || !track.enlace) return;

    detenerMetaRadio();

    audio.src = track.enlace;
    audio.load();

    // Metadatos: Título, Artista, Duración
    if (metaItems.length >= 3) {
      metaItems[0].textContent = track.nombre || 'Track';
      metaItems[1].textContent = track.artista || 'Autor';
      metaItems[2].textContent = track.duracion || '00:00';
    }

    audio.play().then(() => { isPlaying = true; }).catch(() => {});
  }

  // 🔴 Activar modo streaming (servidor de pruebas)
  function activarStreaming() {
    audio.src = 'https://laradiossl.online:12000/stream';
    audio.load();

    iniciarActualizacionRadio(); // metadatos vivos

    audio.play().then(() => { isPlaying = true; }).catch(() => {});
  }

  // 🧹 Detener actualización de radio
  function detenerMetaRadio() {
    if (radioMetaIntervalId !== null) {
      clearInterval(radioMetaIntervalId);
      radioMetaIntervalId = null;
    }
  }

  // 📻 Actualizar Radio (currentsong) con limpieza y separación robusta
  function iniciarActualizacionRadio() {
    detenerMetaRadio();

    const radioUrl = "https://laradiossl.online:12000/stats?json=1&sid=1";
    // Usa proxy si hay CORS. Para desactivar proxy: const proxyUrl = radioUrl;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;
    const emisoraNombre = "";

    const parsearTitulo = (texto) => {
      if (!texto) return { artist: "Desconocido", title: "Transmisión" };

      // Limpieza: remover tags conocidos y espacios
      let cleaned = texto
        .replace(/AUTODJ/gi, '')
        .replace(/OFFLINE/gi, '')
        .replace(/\|\s*$/g, '')
        .trim();

      // Separadores posibles: " - ", " – ", " — "
      const parts = cleaned.split(/\s[-–—]\s/);
      if (parts.length >= 2) {
        const artist = parts[0].trim();
        const title = parts.slice(1).join(' - ').trim();
        return { artist, title };
      }
      return { artist: "Desconocido", title: cleaned || "Transmisión" };
    };

    const actualizarUnaVez = () => {
      fetch(proxyUrl, { cache: 'no-cache' })
        .then(res => res.text())
        .then(raw => {
          const { artist, title } = parsearTitulo(raw);

          // Metadatos: Título, Artista, Nombre de la emisora
          if (metaItems.length >= 3) {
            metaItems[0].textContent = title || "Track";
            metaItems[1].textContent = artist || "Autor";
            metaItems[2].textContent = emisoraNombre;
          }
        })
        .catch(() => {
          if (metaItems.length >= 3) {
            metaItems[0].textContent = "Error";
            metaItems[1].textContent = "Radio";
            metaItems[2].textContent = emisoraNombre;
          }
        });
    };

    actualizarUnaVez();
    radioMetaIntervalId = setInterval(actualizarUnaVez, 12000);
  }

  // ⏭ Avanzar track (centralizado)
  function avanzarTrack() {
    if (modo !== 'local' || !playlist.length) return;

    let siguiente;
    if (aleatorioActivo) {
      do {
        siguiente = Math.floor(Math.random() * playlist.length);
      } while (siguiente === currentTrack && playlist.length > 1);
    } else {
      siguiente = (currentTrack + 1) % playlist.length;
    }

    currentTrack = siguiente;
    cargarTrack(currentTrack);
  }

  // 🔁 Cambio de modo
  if (btnPlus) {
    btnPlus.addEventListener('click', () => {
      modo = modo === 'local' ? 'streaming' : 'local';
      localStorage.setItem('modoRepro', modo);

      if (modo === 'streaming') {
        activarStreaming();
      } else {
        cargarTrack(currentTrack);
      }

      if (contenedorMetadatos) {
        contenedorMetadatos.classList.add('mutando');
        setTimeout(() => contenedorMetadatos.classList.remove('mutando'), 600);
      }
    });
  }

  // 🧭 Switch Canvas (zona invisible)
  if (activador && switchPanel) {
    activador.addEventListener('click', () => {
      switchPanel.classList.toggle('visible');
    });
  }
});