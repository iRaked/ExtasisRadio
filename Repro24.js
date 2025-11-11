document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("player");
  const playPauseBtn = document.getElementById("btn-playpause");
  const playPauseIcon = playPauseBtn?.querySelector("i");
  const rewindBtn = document.getElementById("btn-rwd");
  const forwardBtn = document.getElementById("btn-fwd");
  const musicBtn = document.getElementById("btn-music");
  const marquee = document.querySelector(".marquesina-content");
  const statusIndicator = document.getElementById("status-indicator");

  // Estados
  let modoActual = "radio"; // radio | local
  let isPlaying = false;
  let gestureDetected = false;

  // Local
  let trackData = [];
  let currentTrack = null;

  // Radio
  let radioIntervalId = null;
  let contadorIntervalId = null;
  let lastSongtitle = "";

  // ========= Utilidades visuales =========

  function updatePlayIcon() {
    if (!playPauseIcon) return;
    playPauseIcon.classList.toggle("fa-play", !isPlaying);
    playPauseIcon.classList.toggle("fa-pause", isPlaying);
  }

  function toggleBars(active) {
    document.querySelectorAll(".eq-bars").forEach(eq => {
      eq.classList.toggle("eq-active", active);
    });
    document.querySelectorAll(".cinta").forEach(cinta => {
      cinta.classList.toggle("cinta-activa", active);
    });
  }

  function animateMarquee() {
    const container = document.querySelector(".marquesina");
    if (!container || !marquee) return;

    const contentWidth = marquee.scrollWidth;
    const containerWidth = container.clientWidth;

    if (contentWidth <= containerWidth) {
      marquee.style.transform = "translateX(0)";
      return;
    }

    let offset = containerWidth;
    function scroll() {
      offset -= 0.5;
      if (offset < -contentWidth) offset = containerWidth;
      marquee.style.transform = `translateX(${offset}px)`;
      requestAnimationFrame(scroll);
    }
    scroll();
  }

  function setMarqueeText(text) {
    if (!marquee) return;
    marquee.textContent = text || "";
    animateMarquee();
  }

  function actualizarEstadoOnlineOffline() {
    if (!statusIndicator) return;
    statusIndicator.className = "";
    statusIndicator.style.backgroundColor = "transparent";
    if (modoActual === "radio") {
      statusIndicator.textContent = "ONLINE";
      statusIndicator.style.color = "#00FF00";
    } else {
      statusIndicator.textContent = "OFFLINE";
      statusIndicator.style.color = "#0096FF";
    }
  }

  // ========= Modo Local: pistas y metadatos =========

  function cargarTracksDesdeJSON() {
    fetch("https://radio-tekileros.vercel.app/Repro24.json")
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data.hits)) {
          setMarqueeText("Error: JSON inválido");
          return;
        }
        trackData = data.hits.map(item => ({
          url: item.enlace,
          name: item.nombre,
          artist: item.artista,
          section: item.seccion
        }));
        currentTrack = 0;

        // Muestra metadatos incluso si aún no se puede reproducir
        const first = trackData[0];
        if (first) setMarqueeText(`${first.name} — ${first.artist} [${first.section}]`);

        if (gestureDetected) activarReproduccion(0);
      })
      .catch(() => setMarqueeText("Error al cargar Repro24.json"));
  }

  function activarReproduccion(index) {
    if (index < 0 || index >= trackData.length) return;
    currentTrack = index;
    const track = trackData[index];

    audio.src = track.url;
    audio.load();
    setMarqueeText(`${track.name} — ${track.artist} [${track.section}]`);

    if (gestureDetected) {
      audio.play().then(() => {
        isPlaying = true;
        toggleBars(true);
        updatePlayIcon();
      }).catch(() => {
        isPlaying = false;
        updatePlayIcon();
      });
    } else {
      isPlaying = false;
      updatePlayIcon();
    }
  }

  function nextTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;
    const nextIndex = (currentTrack + 1) % trackData.length;
    activarReproduccion(nextIndex);
  }

  function prevTrack() {
    if (modoActual !== "local" || trackData.length === 0) return;
    const prevIndex = (currentTrack - 1 + trackData.length) % trackData.length;
    activarReproduccion(prevIndex);
  }

  // ========= Modo Radio: metadatos robustos (JSONP y control) =========

  function detenerActualizacionRadio() {
    if (radioIntervalId !== null) clearInterval(radioIntervalId);
    radioIntervalId = null;
  }

  function detenerContadorRadioescuchas() {
    if (contadorIntervalId !== null) clearInterval(contadorIntervalId);
    contadorIntervalId = null;
  }

  function iniciarActualizacionRadio() {
    detenerActualizacionRadio();

    const radioUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";

    function actualizarDesdeServidor() {
      if (modoActual !== "radio") { detenerActualizacionRadio(); return; }

      // Prefiere JSONP si hay jQuery (fiable contra CORS en este servidor)
      if (typeof $ !== "undefined" && typeof $.ajax !== "undefined") {
        $.ajax({
          dataType: "jsonp",
          url: radioUrl,
          timeout: 10000,
          success: function (data) {
            const raw = (data && typeof data.songtitle === "string") ? data.songtitle : "";
            const cleanedTitle = raw
              .trim()
              .replace(/SANTI MIX DJ/gi, "")
              .replace(/\|\s*$/g, "")
              .replace(/\s{2,}/g, " ")
              .trim();

            if (!cleanedTitle || cleanedTitle.toLowerCase().includes("offline") || cleanedTitle === lastSongtitle) return;
            lastSongtitle = cleanedTitle;

            const parts = cleanedTitle.split(/ - | – /);
            const artist = parts.length >= 2 ? parts[0].trim() : "Radio";
            const title = parts.length >= 2 ? parts.slice(1).join(" - ").trim() : cleanedTitle;

            setMarqueeText(`${title} — ${artist} [Radio]`);
          },
          error: function () {
            setMarqueeText("Error Conexión Radio");
          }
        });
      } else {
        // Fallback con fetch (puede fallar por CORS). Mantiene UX mínima.
        fetch(radioUrl)
          .then(res => res.json())
          .then(data => {
            const raw = (data && typeof data.songtitle === "string") ? data.songtitle : "";
            const cleanedTitle = raw
              .trim()
              .replace(/AUTO DJ/gi, "")
              .replace(/\|\s*$/g, "")
              .replace(/\s{2,}/g, " ")
              .trim();

            if (!cleanedTitle || cleanedTitle.toLowerCase().includes("offline") || cleanedTitle === lastSongtitle) return;
            lastSongtitle = cleanedTitle;

            const parts = cleanedTitle.split(/ - | – /);
            const artist = parts.length >= 2 ? parts[0].trim() : "Radio";
            const title = parts.length >= 2 ? parts.slice(1).join(" - ").trim() : cleanedTitle;

            setMarqueeText(`${title} — ${artist} [Radio]`);
          })
          .catch(() => setMarqueeText("Radio (CORS sin jQuery)"));
      }
    }

    actualizarDesdeServidor();
    radioIntervalId = setInterval(actualizarDesdeServidor, 12000);
  }

  function iniciarContadorRadioescuchas() {
    detenerContadorRadioescuchas();
    const contadorEl = document.getElementById("contadorRadio");
    if (!contadorEl) return;

    const contadorUrl = "https://technoplayerserver.net:8018/stats?json=1&sid=1";
    function actualizarContador() {
      if (modoActual !== "radio") { detenerContadorRadioescuchas(); return; }

      if (typeof $ !== "undefined" && typeof $.ajax !== "undefined") {
        $.ajax({
          dataType: "jsonp",
          url: contadorUrl,
          timeout: 8000,
          success: function (data) {
            contadorEl.textContent = data.currentlisteners || "0";
          },
          error: function () {
            contadorEl.textContent = "0";
          }
        });
      } else {
        fetch(contadorUrl)
          .then(res => res.json())
          .then(data => {
            contadorEl.textContent = data.currentlisteners || "0";
          })
          .catch(() => {
            contadorEl.textContent = "0";
          });
      }
    }

    actualizarContador();
    contadorIntervalId = setInterval(actualizarContador, 15000);
  }

  // ========= Alternancia de modos =========

  function activarModoRadio() {
    modoActual = "radio";
    lastSongtitle = "";

    audio.pause();
    audio.src = "https://technoplayerserver.net:8018/stream?icy=http";
    audio.load();

    if (gestureDetected) {
      audio.play().then(() => {
        isPlaying = true;
        toggleBars(true);
        updatePlayIcon();
      }).catch(() => {
        isPlaying = false;
        updatePlayIcon();
      });
    } else {
      isPlaying = false;
      updatePlayIcon();
    }

    iniciarActualizacionRadio();
    iniciarContadorRadioescuchas();
    actualizarEstadoOnlineOffline();
  }

  function activarModoLocal() {
    modoActual = "local";
    lastSongtitle = "";
    detenerActualizacionRadio();
    detenerContadorRadioescuchas();

    audio.pause();
    cargarTracksDesdeJSON();
    isPlaying = false;
    updatePlayIcon();
    actualizarEstadoOnlineOffline();
  }

  // ========= Listeners =========

  // Desbloqueo tras primer gesto
  document.addEventListener("click", () => {
    if (!gestureDetected) {
      gestureDetected = true;
      audio.muted = false;
      if (modoActual === "radio") {
        activarModoRadio();
      } else if (modoActual === "local") {
        if (trackData.length > 0) activarReproduccion(currentTrack ?? 0);
        else cargarTracksDesdeJSON();
      }
    }
  }, { once: true });

  // Play/Pause
  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().then(() => {
        isPlaying = true;
        toggleBars(true);
        updatePlayIcon();
      }).catch(() => {});
    } else {
      audio.pause();
      isPlaying = false;
      toggleBars(false);
      updatePlayIcon();
    }
  });

  // Next / Prev (solo local)
  forwardBtn.addEventListener("click", nextTrack);
  rewindBtn.addEventListener("click", prevTrack);

  // Botón música: puente de modos
  musicBtn.addEventListener("click", () => {
    if (modoActual === "radio") {
      activarModoLocal();
      musicBtn.classList.add("active");
    } else {
      activarModoRadio();
      musicBtn.classList.remove("active");
    }
  });

  // Estado inicial
  activarModoRadio();
  toggleBars(false);
  updatePlayIcon();
});
