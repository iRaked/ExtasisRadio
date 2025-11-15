// Repro35.js
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("player");
  const playButton = document.querySelector(".control-button.play-pause");
  const iconPlay = playButton.querySelector(".icon-play");
  const iconPause = playButton.querySelector(".icon-pause");
  const coverArt = document.querySelector(".cover-art");
  const trackTitle = document.querySelector(".track-title");
  const trackArtist = document.querySelector(".track-artist");
  const trackAlbum = document.querySelector(".track-album");

  let playlist = [];
  let currentIndex = 0;
  let unlocked = false;

  // Estado inicial recomendado por políticas de autoplay
  audio.autoplay = true;
  audio.muted = true;
  audio.preload = "auto";

  // Cargar JSON
  fetch("https://radio-tekileros.vercel.app/Repro35.json")
    .then(res => res.json())
    .then(data => {
      playlist = data.hits || [];
      if (playlist.length > 0) {
        loadTrack(currentIndex);
        // Intentar reproducir silenciado para iniciar el pipeline
        safePlay({ keepMuted: true });
      }
    })
    .catch(err => console.error("Error cargando JSON:", err));

  // Cargar un track por índice con fallback a iTunes
  async function loadTrack(index) {
    const track = playlist[index];
    if (!track) return;

    audio.src = track.enlace;

    // Buscar carátula en iTunes si no está definida en el JSON
    let coverUrl = track.caratula;
    if (!coverUrl || coverUrl === "") {
      coverUrl = await fetchCoverFromiTunes(track.artista, track.nombre);
    }

    coverArt.src = coverUrl;
    trackTitle.textContent = track.nombre;
    trackArtist.textContent = track.artista;
    trackAlbum.textContent = track.seccion || "Álbum desconocido";

    // En cada cambio de pista, si ya está desbloqueado, reproducir
    if (unlocked) safePlay({ keepMuted: false });
  }

  // Reproducción continua
  audio.addEventListener("ended", () => {
    currentIndex = (currentIndex + 1) % playlist.length;
    loadTrack(currentIndex);
  });

  // Alternar play/pause
  playButton.addEventListener("click", () => {
    if (!unlocked) return; // hasta que se desbloquee con gesto humano global
    if (audio.paused) {
      safePlay({ keepMuted: false }).then(() => setIcons(true));
    } else {
      audio.pause();
      setIcons(false);
    }
  });

  // Desbloqueo global por primer gesto humano (desktop y móviles)
  const unlockEvents = ["pointerdown", "touchstart", "mousedown", "keydown"];
  unlockEvents.forEach(evt => {
    document.addEventListener(evt, onFirstHumanGesture, { passive: true });
  });

  async function onFirstHumanGesture() {
    if (unlocked) return;
    unlocked = true;

    audio.muted = false;

    try {
      await audio.play();
      setIcons(true);
    } catch (err) {
      try {
        audio.muted = true;
        await audio.play();
        audio.muted = false;
        setIcons(true);
      } catch (err2) {
        console.warn("Desbloqueo de audio falló, esperando nuevo gesto…", err2);
        unlocked = false;
        return;
      }
    }

    // Una vez desbloqueado, remover listeners
    unlockEvents.forEach(evt => {
      document.removeEventListener(evt, onFirstHumanGesture);
    });
  }

  // Utilidad para reproducir con estrategias seguras
  function safePlay({ keepMuted = false } = {}) {
    audio.muted = keepMuted;
    const p = audio.play();
    if (p && typeof p.then === "function") {
      return p.catch(err => {
        console.warn("play() rechazado:", err);
        return Promise.resolve();
      });
    }
    return Promise.resolve();
  }

  // Iconos según estado
  function setIcons(isPlaying) {
    iconPlay.style.display = isPlaying ? "none" : "block";
    iconPause.style.display = isPlaying ? "block" : "none";
  }

  // Refrescar iconos ante eventos de audio
  audio.addEventListener("play", () => setIcons(true));
  audio.addEventListener("pause", () => setIcons(false));
});

// Función para buscar carátula en iTunes
async function fetchCoverFromiTunes(artist, track) {
  const query = encodeURIComponent(`${artist} ${track}`);
  const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].artworkUrl100.replace("100x100bb", "300x300bb");
    } else {
      console.warn("No se encontró carátula en iTunes para:", artist, track);
      return "assets/cover-default.jpg"; // fallback
    }
  } catch (err) {
    console.error("Error buscando carátula en iTunes:", err);
    return "assets/cover-default.jpg"; // fallback
  }
}

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
