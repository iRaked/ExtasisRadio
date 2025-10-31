document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const videoElement = document.querySelector("video");
  const modeLabel = document.getElementById("mode-label");
  const playlistLabel = document.getElementById("playlist-label");
  const playlistItems = document.querySelectorAll(".playlist-item");
  const restoreBtn = document.getElementById("restore-default");
  const colorOptions = document.querySelectorAll(".color-option");
  const bgOptions = document.querySelectorAll(".bg-option");

  let currentMode = "Radio";
  let isStreaming = false; // Modo local por defecto

  // 🔁 Switchs laterales
  const toggleMap = {
    "menu-trigger": "menu-switch",
    "paint-trigger": "color-switch",
    "playlist-trigger": "playlist-switch",
    "background-trigger": "background-switch"
  };

  Object.entries(toggleMap).forEach(([triggerId, targetId]) => {
    const trigger = document.getElementById(triggerId);
    const target = document.getElementById(targetId);
    if (trigger && target) {
      trigger.addEventListener("click", () => {
        target.classList.toggle("visible");
      });
    }
  });

  // 🎨 Aplicar fondo (sin guardar)
  function applyBackground(bgPath) {
    root.style.setProperty("--background-image", `url('${bgPath}')`);
    if (videoElement) videoElement.style.display = "none";
    document.body.classList.remove("video-active");
  }

  bgOptions.forEach(option => {
    option.addEventListener("click", () => {
      const bgPath = option.dataset.bg;
      if (bgPath) applyBackground(bgPath);
    });
  });

  // Fondo por defecto: video activo
  if (videoElement) videoElement.style.display = "block";
  document.body.classList.add("video-active");

  // 🎨 Aplicar color base o degradado (sin guardar)
  function applyGradient(type) {
    const gradients = {
      gold: "linear-gradient(45deg, #fbe8a6, #f6d365, #d4af37)",
      unicorn: "linear-gradient(45deg, #ffb6f9, #ffb6f9, #b2f7ef, #f9f871, #d0a2ff, #d0a2ff)",
      turquoise: "linear-gradient(45deg, #00c9a7, #00e6e6, #00ffff, #00bfff)"
    };
    const gradient = gradients[type] || "#3688ff50";
    root.style.setProperty("--base-color", gradient);
  }

  colorOptions.forEach(option => {
    option.addEventListener("click", () => {
      const solidColor = option.dataset.color;
      if (solidColor) {
        root.style.setProperty("--base-color", solidColor);
      } else {
        const gradientClass = [...option.classList].find(cls =>
          ["gold", "unicorn", "turquoise"].includes(cls)
        );
        if (gradientClass) applyGradient(gradientClass);
      }
    });
  });

  restoreBtn.addEventListener("click", () => {
    const defaultColor = "#3688ff50";
    root.style.setProperty("--base-color", defaultColor);
    root.style.setProperty("--background-image", "none");
    if (videoElement) videoElement.style.display = "block";
    document.body.classList.add("video-active");
  });

  // 🎧 Estado visual
  function updateModeAndPlaylist(mode, playlistName = null) {
    currentMode = mode;
    modeLabel.textContent = `Modo: ${mode}`;
    if (mode === "Radio") {
      playlistLabel.textContent = "";
      playlistLabel.style.display = "none";
    } else {
      playlistLabel.style.display = "inline";
      playlistLabel.textContent = `Playlist: ${playlistName || "Todas las playlists"}`;
    }
  }

  // 📂 Activar playlist individual
  function normalizeKey(str) {
    return str
      .replace(/[^\w\s]/gi, "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");
  }

  function activatePlaylist(playlistName, fullData) {
    const normalizedTarget = normalizeKey(playlistName);
    const keyMap = Object.keys(fullData).reduce((acc, key) => {
      acc[normalizeKey(key)] = key;
      return acc;
    }, {});
    const realKey = keyMap[normalizedTarget];
    const tracks = fullData[realKey];

    if (Array.isArray(tracks) && tracks.length > 0) {
      updateModeAndPlaylist("Música", playlistName);

      // 🔗 Sincronizar con Player30.js
      if (typeof window.activarPlaylistPlayer30 === "function") {
        window.activarPlaylistPlayer30(tracks, playlistName);
      }
    } else {
      console.warn("Playlist vacía o no encontrada:", realKey);
    }
  }

  function loadAndActivatePlaylist(name) {
    fetch("Repro30.json")
      .then(res => res.json())
      .then(data => activatePlaylist(name, data))
      .catch(err => console.error("Error al cargar JSON:", err));
  }

  playlistItems.forEach(item => {
    item.addEventListener("click", () => {
      const name = item.textContent.trim();
      loadAndActivatePlaylist(name);
    });
  });

  // 🎧 Activar todas las playlists
  const allBtn = document.createElement("div");
  allBtn.className = "playlist-item";
  allBtn.textContent = "🎧 Todas las playlists";
  allBtn.addEventListener("click", () => {
    updateModeAndPlaylist("Música", "Todas las playlists");
  });
  document.querySelector(".playlist-list")?.appendChild(allBtn);
});
