document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const videoElement = document.querySelector("video");
  const modeLabel = document.getElementById("mode-label");
  const playlistLabel = document.getElementById("playlist-label");
  const playlistItems = document.querySelectorAll(".playlist-item");
  const restoreBtn = document.getElementById("restore-default");
  const colorOptions = document.querySelectorAll(".color-option");
  const bgOptions = document.querySelectorAll(".bg-option");

  //=====================================
  // 🎧 Activadores y paneles con cabecera modular
  //=====================================
  const togglePairs = [
    { triggerId: "background-trigger", panelId: "background-switch", headerClass: "background-switch-header" },
    { triggerId: "paint-trigger", panelId: "color-switch", headerClass: "color-switch-header" },
    { triggerId: "playlist-trigger", panelId: "playlist-switch", headerClass: "playlist-switch-header" }
  ];

  togglePairs.forEach(({ triggerId, panelId, headerClass }) => {
    const trigger = document.getElementById(triggerId);
    const panel = document.getElementById(panelId);
    const header = document.querySelector(`.${headerClass}`);

    if (trigger && panel && header) {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isVisible = panel.classList.contains("visible");
        if (isVisible) {
          panel.classList.remove("visible", "drop-in");
          header.classList.remove("visible");
        } else {
          togglePairs.forEach(({ panelId, headerClass }) => {
            const otherPanel = document.getElementById(panelId);
            const otherHeader = document.querySelector(`.${headerClass}`);
            if (otherPanel && otherHeader && otherPanel !== panel) {
              otherPanel.classList.remove("visible", "drop-in");
              otherHeader.classList.remove("visible");
            }
          });
          panel.classList.remove("drop-in");
          void panel.offsetWidth;
          panel.classList.add("visible", "drop-in");
          header.classList.add("visible");
        }
      });
    }
  });

  // 🛑 Cierre de switches por ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      togglePairs.forEach(({ panelId, headerClass }) => {
        const panel = document.getElementById(panelId);
        const header = document.querySelector(`.${headerClass}`);
        if (panel && header) {
          panel.classList.remove("visible", "drop-in");
          header.classList.remove("visible");
        }
      });
    }
  });

  // 🛑 Cierre de switches por clic fuera
  document.addEventListener("click", (e) => {
    togglePairs.forEach(({ triggerId, panelId, headerClass }) => {
      const trigger = document.getElementById(triggerId);
      const panel = document.getElementById(panelId);
      const header = document.querySelector(`.${headerClass}`);
      if (panel && header && panel.classList.contains("visible")) {
        const clickedInside = panel.contains(e.target) || trigger.contains(e.target);
        if (!clickedInside) {
          panel.classList.remove("visible", "drop-in");
          header.classList.remove("visible");
        }
      }
    });
  });

  // 🎨 Aplicar fondo (sin persistencia)
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

  // 🎨 Aplicar color base o degradado (sin persistencia)
  function applyGradient(type) {
    const gradients = {
      gold: "linear-gradient(45deg, #fbe8a6, #f6d365, #d4af37)",
      unicorn: "linear-gradient(45deg, #ffb6f9, #b2f7ef, #f9f871, #d0a2ff)",
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