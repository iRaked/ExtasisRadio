document.addEventListener('DOMContentLoaded', () => {
  fetch("Repro19.json")
    .then(res => res.json())
    .then(data => {
      const playlistHits = data.hits;
      if (!Array.isArray(playlistHits)) {
        console.warn("⚠️ El JSON no contiene un array válido en 'hits'");
        return;
      }

      // 🎯 Elementos del DOM
      const audio = document.getElementById("itunes-audio");
      const cover = document.getElementById("cover");
      const trackMeta = document.getElementById("track-meta");
      const trackTimeDisplay = document.getElementById("time");
      const queue = document.getElementById("queue");

      const playBtn = document.getElementById("btn-toggle");
      const playIcon = playBtn?.querySelector("i");

      const volumeControl = document.getElementById("volume-control");
      const speedControl = document.getElementById("speed-control");
      const loopToggle = document.getElementById("loop-toggle");
      const muteToggle = document.getElementById("mute-toggle");

      const progressBar = document.getElementById("progress-bar");
      const progressContainer = document.querySelector(".progress-container");

      let currentIndex = -1;
      const localPlaylist = [...playlistHits];

      // 🔁 Actualiza metadatos y prepara audio
      function updatePlayer(track) {
        cover.src = track.caratula;
        trackMeta.textContent = `${track.artista} - ${track.nombre}`;
        trackTimeDisplay.textContent = "0:00";

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
            progressBar.style.width = "0%";
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

      // 📊 Actualiza barra de progreso y tiempo
      audio.addEventListener("timeupdate", () => {
        if (audio.duration && progressBar) {
          const percent = (audio.currentTime / audio.duration) * 100;
          progressBar.style.width = `${percent}%`;
        }

        const currentTime = Math.floor(audio.currentTime);
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        trackTimeDisplay.textContent = formattedTime;
      });

      // ⏩ Salto en barra de progreso
      progressContainer.addEventListener("click", (e) => {
        if (!isFinite(audio.duration)) return;
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = clickX / rect.width;
        audio.currentTime = percent * audio.duration;
        progressBar.style.width = `${percent * 100}%`;
      });

      // 🔊 Controles extendidos
      volumeControl.addEventListener("input", () => {
        audio.volume = parseFloat(volumeControl.value);
      });

      speedControl.addEventListener("change", () => {
        audio.playbackRate = parseFloat(speedControl.value);
      });

      loopToggle.addEventListener("click", () => {
        audio.loop = !audio.loop;
        loopToggle.textContent = `Loop: ${audio.loop ? "On" : "Off"}`;
        loopToggle.classList.toggle("active", audio.loop);
      });

      muteToggle.addEventListener("click", () => {
        audio.muted = !audio.muted;
        muteToggle.textContent = audio.muted ? "Unmute" : "Mute";
        muteToggle.classList.toggle("active", audio.muted);
      });

      // 🧱 Inicializa
      buildQueue();
      playTrack(0);
    })
    .catch(err => {
      console.error("⚠️ Error al cargar JSON:", err.message);
    });
});