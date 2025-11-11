document.addEventListener('DOMContentLoaded', () => {
  let modo = localStorage.getItem('modoRepro') || 'streaming';
  let isPlaying = false;
  let currentTrack = 0;
  let playlist = [];
  let aleatorioActivo = false;
  let radioMetaIntervalId = null;
  let radioHistory = [];
  let lastRadioTitle = "";

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
  fetch('https://radio-tekileros.vercel.app/Repro4.json')
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
    detenerMetaRadio();
    audio.pause();
    audio.src = "";

    const track = playlist[index];
    if (!track || !track.enlace) return;

    audio.src = track.enlace;
    audio.load();

    // Reset visual inmediato
    if (metaItems.length >= 3) {
      metaItems[0].textContent = track.nombre || 'Track';
      metaItems[1].textContent = track.artista || 'Autor';
      metaItems[2].textContent = track.duracion || '00:00';
    }

    audio.play().then(() => { isPlaying = true; }).catch(() => {});
  }

  // 🔴 Activar modo streaming
  function activarStreaming() {
    detenerMetaRadio();
    audio.pause();
    audio.src = "";

    // Reset visual inmediato
    if (metaItems.length >= 3) {
      metaItems[0].textContent = "Conectando...";
      metaItems[1].textContent = "Esperando datos...";
      metaItems[2].textContent = "Streaming";
    }

    audio.src = 'https://laradiossl.online:12000/stream';
    audio.load();

    iniciarActualizacionRadio();

    audio.play().then(() => { isPlaying = true; }).catch(() => {});
  }

  // 🧹 Detener actualización de radio
  function detenerMetaRadio() {
    if (radioMetaIntervalId !== null) {
      clearInterval(radioMetaIntervalId);
      radioMetaIntervalId = null;
    }
  }

  // 📻 Actualizar Radio (solo texto, sin carátulas)
  function iniciarActualizacionRadio() {
    detenerMetaRadio();

    const radioUrl = "https://laradiossl.online:12000/currentsong?sid=1";
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

    async function actualizarDesdeServidor() {
      try {
        const response = await fetch(proxyUrl, { cache: "no-cache" });
        const rawTitle = await response.text();
        const cleanedTitle = rawTitle.trim()
          .replace(/AUTODJ/gi, "")
          .replace(/OFFLINE/gi, "")
          .replace(/\|\s*$/g, "")
          .trim();

        if (!cleanedTitle || cleanedTitle === lastRadioTitle) return;
        lastRadioTitle = cleanedTitle;

        const parts = cleanedTitle.split(/ - | – | — /);
        let artist = "Radio";
        let title = cleanedTitle;
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }

        // Historial con hora
        const currentTime = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        const newEntry = { artist, title, time: currentTime };
        if (radioHistory.length === 0 || radioHistory[0].title !== title) {
          radioHistory.unshift(newEntry);
          if (radioHistory.length > 20) radioHistory.pop();
        }

        // Actualización visual
        if (metaItems.length >= 3) {
          metaItems[0].textContent = title;
          metaItems[1].textContent = artist;
          metaItems[2].textContent = "Streaming";
        }

      } catch (err) {
        console.error("❌ Error en actualización Radio:", err);
        if (metaItems.length >= 3) {
          metaItems[0].textContent = "Error";
          metaItems[1].textContent = "Radio";
          metaItems[2].textContent = "Streaming";
        }
      }
    }

    actualizarDesdeServidor();
    radioMetaIntervalId = setInterval(actualizarDesdeServidor, 12000);
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
