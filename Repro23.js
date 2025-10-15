document.addEventListener('DOMContentLoaded', () => {
  fetch("Repro23.json")
    .then(res => res.json())
    .then(data => {
      const playlistHits = data.hits;
      if (!Array.isArray(playlistHits)) {
        console.warn("⚠️ El JSON no contiene un array válido en 'hits'");
        return;
      }

      // 🎯 Elementos del DOM reales
      const audio = document.getElementById("audio-player");
      const cover = document.querySelector(".caratula-img");
      const queue = document.getElementById("queue");
      const playBtn = document.getElementById("btn-toggle");
      const playIcon = playBtn?.querySelector("i");

      let currentIndex = -1;
      const localPlaylist = [...playlistHits];

      // 🔁 Actualiza carátula y audio
function updatePlayer(track) {
  console.log("🔁 updatePlayer ejecutado con:", track);

  const defaultCover = "assets/covers/Vinyl-Disc-FX.png";
  const coverPath = track.caratula?.trim();

  // Asignar ruta tentativa
  cover.src = coverPath && coverPath.length > 5 ? coverPath : defaultCover;

  // Si no hay carátula definida, aplicar clase
  if (!coverPath || coverPath.length <= 5) {
    cover.classList.add("default-disc");
  } else {
    cover.classList.remove("default-disc");
  }

  // Si la imagen falla al cargar, usar fallback
  cover.onerror = () => {
    console.warn("⚠️ Carátula no válida, usando imagen por defecto");
    cover.src = defaultCover;
    cover.classList.add("default-disc");
  };

  audio.src = track.enlace;
  audio.load();
  audio.play().then(() => {
    updatePlayIcon(true);
  }).catch(err => {
    console.warn("⚠️ Error al reproducir:", err.name);
  });
}

      // ▶️ Reproduce pista por índice
      function playTrack(index) {
        if (index < 0 || index >= localPlaylist.length) return;
        currentIndex = index;
        updatePlayer(localPlaylist[index]);
        highlightQueueItem(index);

        audio.onended = () => {
          const nextIndex = currentIndex + 1;
          if (nextIndex < localPlaylist.length) {
            playTrack(nextIndex);
          } else {
            currentIndex = -1;
            updatePlayIcon(false);
          }
        };
      }

      // ✨ Marca pista activa
      function highlightQueueItem(index) {
        const items = queue.querySelectorAll("li");
        items.forEach((li, i) => {
          li.classList.toggle("active", i === index);
        });
      }

      // 📜 Construye la cola visual
      function buildQueue() {
        queue.innerHTML = "";
        localPlaylist.forEach((track, index) => {
          const li = document.createElement("li");
          li.textContent = `${track.artista} — ${track.nombre}`;
          li.addEventListener("click", () => playTrack(index));
          queue.appendChild(li);
        });
      }

      // 🎛️ Botón Play/Pause
      function updatePlayIcon(isPlaying) {
        if (!playIcon) return;
        playIcon.classList.toggle("fa-play", !isPlaying);
        playIcon.classList.toggle("fa-pause", isPlaying);
      }

      playBtn.addEventListener("click", () => {
        if (audio.src === "" || currentIndex === -1) {
          playTrack(0);
          return;
        }

        if (audio.paused) {
          audio.play().then(() => updatePlayIcon(true));
        } else {
          audio.pause();
          updatePlayIcon(false);
        }
      });

      // 🧱 Inicializa
      buildQueue();
      playTrack(0);
    })
    .catch(err => {
      console.error("⚠️ Error al cargar JSON:", err.message);
    });
});