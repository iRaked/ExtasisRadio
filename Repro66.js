// ===============================
// 🎧 ESTADO GLOBAL — REPRO66
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // Audio, tornamesa y botonera
  const player = document.getElementById("player");
  const discGroup = document.querySelector(".disc-group");
  const vinylEl = document.querySelector(".layer-vinyl");
  const coverEl = document.querySelector(".layer-cover");
  const needleEl = document.querySelector(".layer-needle");
  const playBtn = document.getElementById("btn-play");
  const playIcon = playBtn ? playBtn.querySelector("i") : null;
  const forwardBtn = document.getElementById("btn-fwd");
  const rewindBtn = document.getElementById("btn-rwd");
  const shuffleBtn = document.getElementById("btn-shuffle");
  const repeatBtn = document.getElementById("btn-rep");

  const volumeSlider = document.getElementById("volume-slider");
  const volumeIcon = document.getElementById("volume-icon");
  const timeBar = document.getElementById("time-bar");

  // UI de pista, carátula e historial
  const trackTitleEl = document.getElementById("track-title");
  const trackArtistEl = document.getElementById("track-artist");
  const trackAlbumEl = document.getElementById("track-album");
  const coverImg = document.querySelector(".layer-cover img") || document.querySelector(".cover-art");
  const historyListEl = document.getElementById("history-list");
  const favFilterBtn = document.getElementById("btn-fav-filter");

  // Interruptor unificado (Radio / Local)
  const statusSwitch = document.getElementById("status-indicator");
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");

  // Notas musicales
  const notesContainer = document.getElementById("music-notes-container");
  const noteSymbols = ["♪", "♫", "♩", "♬"];
  let notesIntervalId = null;

  // Estado de reproducción, historial y favoritos persistentes
  let currentMode = "Radio"; // "Radio" | "Música"
  let isRadioMode = true;
  let isSwitchingMode = false;
  let currentPlaylist = [];
  let currentTrackIndex = 0;
  let activeHistoryKey = "";
  let repeatMode = null; // null | "track" | "playlist"
  let isShuffleMode = false;
  let onlyFavoritesFilter = false;
  let contadorIntervalId = null;
  let radioMetaIntervalId = null;
  let lastRadioTitle = "";
  let playbackHistory = [];
  let hasStartedPlayback = false;
  let manualPaused = false;
  let needleAnimTimeoutId = null;

  const favoriteTrackKeys = new Set();

  const RADIO_STREAM_URL = "https://technoplayerserver.net:8042/stream?icy=http";
  const RADIO_FALLBACK_COVER = "https://santi-graphics.vercel.app/assets/covers/Cover1.png";
  const LOCAL_PLAYLIST_URL = "https://radio-tekileros.vercel.app/Spotifly.json";
  const FAVORITES_STORAGE_KEY = "repro66_favorites_v1";
  const RADIO_POLL_MS = 4000;
  const LISTENERS_POLL_MS = 12000;

  // ===============================
  // 💿 GIRO DE DISCO Y PORTADA
  // ===============================
  function syncTurntableSpinState() {
    const initialRadioSpin =
      currentMode === "Radio" &&
      !hasStartedPlayback &&
      !manualPaused &&
      (!player || player.paused);
    const isActivelyPlaying =
      Boolean(player) && !player.paused && !player.ended && !manualPaused;
    const shouldSpin = !manualPaused && (initialRadioSpin || isActivelyPlaying);

    const playStateValue = shouldSpin ? "running" : "paused";

    if (discGroup) {
      discGroup.classList.toggle("paused", !shouldSpin);
      discGroup.style.animationPlayState = playStateValue;
    }
    if (vinylEl) {
      vinylEl.style.animationPlayState = playStateValue;
    }
    if (coverEl) {
      coverEl.style.animationPlayState = playStateValue;
    }
  }

  // ===============================
  // 🪡 AGUJA FX ENTRE TRACKS
  // ===============================
  function triggerNeedleTrackChange() {
    if (!needleEl) return;
    if (needleAnimTimeoutId !== null) {
      clearTimeout(needleAnimTimeoutId);
      needleAnimTimeoutId = null;
    }
    needleEl.classList.remove("lifted");
    void needleEl.offsetWidth;
    needleEl.classList.add("lifted");

    needleAnimTimeoutId = setTimeout(() => {
      needleEl.classList.remove("lifted");
      needleAnimTimeoutId = null;
    }, 520);
  }

  // ===============================
  // 💾 PERSISTENCIA DE FAVORITOS
  // ===============================
  function loadFavoritesFromStorage() {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((key) => {
          if (typeof key === "string" && key.trim()) {
            favoriteTrackKeys.add(key);
          }
        });
      }
    } catch (_err) {
      // Ignorar si localStorage no está disponible
    }
  }

  function saveFavoritesToStorage() {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favoriteTrackKeys]));
    } catch (_err) {
      // Ignorar si localStorage no está disponible
    }
  }

  function syncFavFilterButtonUI() {
    if (!favFilterBtn) return;
    favFilterBtn.classList.toggle("active", onlyFavoritesFilter);
    favFilterBtn.setAttribute("aria-pressed", String(onlyFavoritesFilter));
    favFilterBtn.setAttribute(
      "aria-label",
      onlyFavoritesFilter ? "Mostrar todo el historial" : "Mostrar solo favoritos"
    );
    favFilterBtn.setAttribute(
      "title",
      onlyFavoritesFilter ? "Mostrando favoritos" : "Solo favoritos"
    );
  }

  if (favFilterBtn) {
    favFilterBtn.addEventListener("click", () => {
      onlyFavoritesFilter = !onlyFavoritesFilter;
      syncFavFilterButtonUI();
      renderHistoryList();
    });
  }

  loadFavoritesFromStorage();
  syncFavFilterButtonUI();

  // ===============================
  // 🔌 AUTOPLAY Y GESTO HUMANO
  // ===============================
  syncTurntableSpinState();

  if (player && player.autoplay) {
    player.play()
      .then(() => {
        hasStartedPlayback = true;
        manualPaused = false;
        syncTurntableSpinState();
      })
      .catch(() => {
        syncTurntableSpinState();
      });
  }

  document.body.addEventListener(
    "click",
    () => {
      if (!player) return;
      player.muted = false;
      if (player.paused && currentMode === "Radio" && !manualPaused) {
        player.play()
          .then(() => {
            hasStartedPlayback = true;
            syncTurntableSpinState();
          })
          .catch(() => {});
      }
      syncTurntableSpinState();
    },
    { once: true }
  );

  // ===============================
  // 📜 HISTORIAL EN #history-list
  // ===============================
  function getCurrentClockLabel() {
    const now = new Date();
    return now.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function formatDurationLabel(rawValue) {
    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
        return trimmed;
      }
    }
    const seconds = Number(rawValue);
    if (isNaN(seconds) || !isFinite(seconds) || seconds <= 0) {
      return "--:--";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function getTrackKey(title, artist) {
    return `${String(title || "").trim()}::${String(artist || "").trim()}`;
  }

  function clearHistoryList() {
    playbackHistory = [];
    activeHistoryKey = "";
    if (historyListEl) {
      historyListEl.innerHTML = "";
    }
  }

  function renderHistoryList() {
    if (!historyListEl) return;
    historyListEl.innerHTML = "";

    const isAudioPlaying = Boolean(player) && !player.paused && !player.ended && !manualPaused;
    const itemsToRender = onlyFavoritesFilter
      ? playbackHistory.filter((entry) => favoriteTrackKeys.has(entry.key))
      : playbackHistory;

    itemsToRender.forEach((entry, idx) => {
      const displayNumber = itemsToRender.length - idx;
      const isNowPlaying =
        entry.key === activeHistoryKey &&
        (currentMode === "Música" || (currentMode === "Radio" && (isAudioPlaying || !hasStartedPlayback)));
      const isFav = favoriteTrackKeys.has(entry.key);

      const li = document.createElement("li");
      li.className = `history-item${isNowPlaying ? " playing" : ""}`;

      const numSpan = document.createElement("span");
      numSpan.className = `track-num${isNowPlaying ? " active" : ""}`;
      if (isNowPlaying) {
        numSpan.innerHTML = '<i class="fas fa-volume-up" aria-hidden="true"></i>';
        numSpan.setAttribute("aria-label", "Reproduciendo ahora");
      } else {
        numSpan.textContent = String(displayNumber);
      }

      const detailsDiv = document.createElement("div");
      detailsDiv.className = "track-details";

      const titleSpan = document.createElement("span");
      titleSpan.className = "track-title";
      titleSpan.textContent = entry.title;

      const artistSpan = document.createElement("span");
      artistSpan.className = "track-artist";
      artistSpan.textContent = entry.artist;

      detailsDiv.appendChild(titleSpan);
      detailsDiv.appendChild(artistSpan);

      const timeSpan = document.createElement("span");
      timeSpan.className = "track-time";
      timeSpan.textContent = entry.metaLabel;

      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = `fav-btn${isFav ? " active" : ""}`;
      favBtn.setAttribute("aria-label", isFav ? "Quitar de favoritos" : "Marcar como favorito");
      favBtn.innerHTML = '<i class="fas fa-heart"></i>';

      favBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (favoriteTrackKeys.has(entry.key)) {
          favoriteTrackKeys.delete(entry.key);
        } else {
          favoriteTrackKeys.add(entry.key);
        }
        saveFavoritesToStorage();
        renderHistoryList();
      });

      li.addEventListener("click", () => {
        if (currentMode === "Música") {
          if (typeof entry.playlistIndex === "number" && currentPlaylist[entry.playlistIndex]) {
            currentTrackIndex = entry.playlistIndex;
            playCurrentTrack();
          }
        } else if (currentMode === "Radio") {
          activeHistoryKey = entry.key;
          if (trackTitleEl) trackTitleEl.textContent = entry.title;
          if (trackArtistEl) trackArtistEl.textContent = entry.artist;
          obtenerCaratulaDesdeiTunes(entry.artist, entry.title);
          renderHistoryList();
        }
      });

      li.appendChild(numSpan);
      li.appendChild(detailsDiv);
      li.appendChild(timeSpan);
      li.appendChild(favBtn);

      historyListEl.appendChild(li);
    });
  }

  function recordRadioTrackInHistory(title, artist) {
    if (currentMode !== "Radio") return;
    const cleanTitle = String(title || "Sin título").trim();
    const cleanArtist = String(artist || "Radio Mexico").trim();
    const key = getTrackKey(cleanTitle, cleanArtist);
    const horaLabel = getCurrentClockLabel();
    activeHistoryKey = key;

    const existingIndex = playbackHistory.findIndex((item) => item.key === key);
    if (existingIndex !== -1) {
      playbackHistory[existingIndex].metaLabel = horaLabel;
      renderHistoryList();
      return;
    }

    playbackHistory.unshift({
      key,
      title: cleanTitle,
      artist: cleanArtist,
      metaLabel: horaLabel,
    });

    renderHistoryList();
  }

  function recordLocalTrackInHistory(title, artist, rawDuration, playlistIndex) {
    if (currentMode !== "Música") return;
    const cleanTitle = String(title || "Sin título").trim();
    const cleanArtist = String(artist || "Desconocido").trim();
    const key = getTrackKey(cleanTitle, cleanArtist);
    activeHistoryKey = key;

    const hasExplicitDuration = rawDuration !== undefined && rawDuration !== null && String(rawDuration).trim() !== "";
    const durationLabel = hasExplicitDuration
      ? formatDurationLabel(rawDuration)
      : formatDurationLabel(player && isFinite(player.duration) ? player.duration : NaN);

    const existingIndex = playbackHistory.findIndex((item) => item.key === key);
    if (existingIndex !== -1) {
      if (typeof playlistIndex === "number") {
        playbackHistory[existingIndex].playlistIndex = playlistIndex;
      }
      if (durationLabel !== "--:--") {
        playbackHistory[existingIndex].metaLabel = durationLabel;
      }
      renderHistoryList();
      return;
    }

    playbackHistory.unshift({
      key,
      title: cleanTitle,
      artist: cleanArtist,
      metaLabel: durationLabel,
      playlistIndex,
    });

    renderHistoryList();
  }

  function updateLatestLocalDuration() {
    if (currentMode !== "Música" || playbackHistory.length === 0 || !player) return;
    if (isFinite(player.duration) && player.duration > 0) {
      const currentEntry =
        playbackHistory.find((item) => item.key === activeHistoryKey) || playbackHistory[0];
      currentEntry.metaLabel = formatDurationLabel(player.duration);
      renderHistoryList();
    }
  }

  // ===============================
  // 🏷️ ESTADO DE MODO E INTERRUPTOR
  // ===============================
  function syncModeSwitchUI() {
    isRadioMode = currentMode === "Radio";
    if (statusSwitch) {
      statusSwitch.classList.toggle("radio-mode", isRadioMode);
      statusSwitch.classList.toggle("local-mode", !isRadioMode);
      statusSwitch.classList.toggle("off", !isRadioMode);
      statusSwitch.setAttribute("aria-checked", String(isRadioMode));
    }
    if (statusDot) {
      statusDot.classList.toggle("off", !isRadioMode);
    }
    if (statusText) {
      statusText.textContent = isRadioMode ? "RADIO" : "LOCAL";
    }
  }

  function updateModeUI(mode) {
    currentMode = mode;
    syncModeSwitchUI();
    syncTurntableSpinState();

    const listenersBadge = document.getElementById("listeners-badge");
    if (listenersBadge) {
      listenersBadge.style.display = mode === "Radio" ? "inline-flex" : "none";
    }

    if (timeBar) {
      timeBar.style.display = mode === "Radio" ? "none" : "block";
      if (mode === "Radio") timeBar.value = 0;
    }
  }

  function updatePlayIcon(isPlaying) {
    if (!playIcon) return;
    playIcon.classList.toggle("fa-play", !isPlaying);
    playIcon.classList.toggle("fa-pause", isPlaying);
  }

  function setSourceAndPlay(src) {
    if (!player) return;
    manualPaused = false;
    player.pause();
    player.src = src;
    player.load();
    syncTurntableSpinState();
    player.play()
      .then(() => {
        hasStartedPlayback = true;
        updatePlayIcon(true);
        syncTurntableSpinState();
        renderHistoryList();
      })
      .catch((err) => {
        console.warn("Error al reproducir:", err);
        updatePlayIcon(false);
        syncTurntableSpinState();
        renderHistoryList();
      });
  }

  // ===============================
  // 🎼 NOTAS MUSICALES
  // ===============================
  function createNote() {
    if (!player || player.paused || !notesContainer) return;

    const note = document.createElement("div");
    note.className = "note";
    note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
    note.style.fontSize = `${18 + Math.random() * 14}px`;

    notesContainer.appendChild(note);
    setTimeout(() => note.remove(), 3000);
  }

  function startNotesFlow() {
    if (!notesIntervalId) {
      notesIntervalId = setInterval(createNote, 400);
    }
  }

  function stopNotesFlow() {
    if (notesIntervalId !== null) {
      clearInterval(notesIntervalId);
      notesIntervalId = null;
    }
  }

  // ===============================
  // 📻 MODO RADIO (PROXY + JSONP)
  // ===============================
  function stopListenersCounter() {
    if (contadorIntervalId !== null) {
      clearInterval(contadorIntervalId);
      contadorIntervalId = null;
    }
  }

  function stopRadioIntervals() {
    if (radioMetaIntervalId !== null) {
      clearInterval(radioMetaIntervalId);
      radioMetaIntervalId = null;
    }
    stopListenersCounter();
  }

  function obtenerCaratulaDesdeiTunes(artist, title) {
    if (!window.$ || !$.ajax) {
      if (coverImg) coverImg.src = RADIO_FALLBACK_COVER;
      return;
    }

    const cleanArtist = artist.toLowerCase().replace(/ &.*$| feat.*$| ft\.?.*$/i, "").trim();
    const cleanTitle = title.toLowerCase().replace(/ &| ft\.?.*$/i, "").replace(/\s*\(.*\)\s*$/g, "").trim();
    const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
    const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

    $.ajax({
      dataType: "jsonp",
      url,
      success(data) {
        let cover = RADIO_FALLBACK_COVER;
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          const art100 = data.results[0].artworkUrl100;
          if (art100) cover = art100.replace("100x100", "400x400");
        }
        if (coverImg) coverImg.src = cover;
      },
      error() {
        if (coverImg) coverImg.src = RADIO_FALLBACK_COVER;
      },
      timeout: 5000,
    });
  }

  function parseRadioSongString(rawSong, fallbackArtistName) {
    const cleaned = String(rawSong || "")
      .trim()
      .replace(/AUTODJ|SANTI MIX DJ/gi, "")
      .replace(/\|\s*$/g, "")
      .trim();

    if (!cleaned || cleaned.toLowerCase().includes("offline")) {
      return null;
    }

    const parts = cleaned.split(/ - | – /);
    let artist = fallbackArtistName || "Radio Mexico";
    let title = cleaned;

    if (parts.length >= 2) {
      artist = parts[0].replace(/^\d+\s*[-._]\s*/, "").trim() || artist;
      title = parts.slice(1).join(" - ").replace(/\s*\([^)]*\)\s*$/g, "").trim() || cleaned;
    } else {
      title = cleaned.replace(/\s*\([^)]*\)\s*$/g, "").trim() || cleaned;
    }

    return { cleaned, artist, title };
  }

  function extractStatsPayload(rawText) {
    const trimmed = String(rawText || "").trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && typeof parsed.contents === "string") {
        return JSON.parse(parsed.contents);
      }
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (_err) {
      // No es JSON directo
    }
    return null;
  }

  async function fetchTextFast(targetUrl, timeoutMs = 2500) {
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
    ];

    const attempts = proxies.map(async (proxyUrl) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(proxyUrl, { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const clean = text.trim();
        if (!clean || /^<!doctype html|^<html/i.test(clean)) {
          throw new Error("Respuesta no válida");
        }
        return clean;
      } finally {
        clearTimeout(timer);
      }
    });

    return await Promise.any(attempts);
  }

  function fetchStatsViaJsonp(statsUrl) {
    return new Promise((resolve, reject) => {
      if (!window.$ || !$.ajax) {
        reject(new Error("jQuery JSONP no disponible"));
        return;
      }
      $.ajax({
        dataType: "jsonp",
        url: statsUrl,
        timeout: 3500,
        success(data) {
          if (data && typeof data === "object") {
            resolve(data);
          } else {
            reject(new Error("JSONP vacío"));
          }
        },
        error() {
          reject(new Error("Error JSONP /stats"));
        },
      });
    });
  }

  function startRadioMetadata() {
    const radioUrl = "https://technoplayerserver.net:8042/currentsong?sid=1";
    const statsUrl = "https://technoplayerserver.net:8042/stats?json=1&sid=1";

    function applyListenersCount(value) {
      if (value === undefined || value === null) return;
      const textVal = String(value);
      const targets = document.querySelectorAll("#listeners-count, #header-listeners-count");
      targets.forEach((el) => {
        el.textContent = textVal;
      });
    }

    function applyParsedSong(parsed) {
      if (!parsed || parsed.cleaned === lastRadioTitle) return;
      const hadPreviousTrack = Boolean(lastRadioTitle);
      lastRadioTitle = parsed.cleaned;
      if (hadPreviousTrack) {
        triggerNeedleTrackChange();
      }
      if (trackArtistEl) trackArtistEl.textContent = parsed.artist;
      if (trackTitleEl) trackTitleEl.textContent = parsed.title;
      recordRadioTrackInHistory(parsed.title, parsed.artist);
      obtenerCaratulaDesdeiTunes(parsed.artist, parsed.title);
    }

    function applyStatsObject(statsData) {
      let stationName = "Radio Mexico";
      if (!statsData || typeof statsData !== "object") return false;
      if (statsData.servertitle) {
        stationName = String(statsData.servertitle).trim();
      }
      if (statsData.currentlisteners !== undefined) {
        applyListenersCount(statsData.currentlisteners);
      }
      if (typeof statsData.songtitle === "string" && statsData.songtitle.trim()) {
        applyParsedSong(parseRadioSongString(statsData.songtitle, stationName));
        return true;
      }
      return false;
    }

    async function updateMetadata() {
      if (currentMode !== "Radio") return;

      try {
        const rawStats = await fetchTextFast(statsUrl, 2500);
        const statsData = extractStatsPayload(rawStats);
        if (applyStatsObject(statsData)) return;
      } catch (_statsProxyErr) {
        // Continúa a JSONP directo o /currentsong
      }

      try {
        const jsonpData = await fetchStatsViaJsonp(statsUrl);
        if (applyStatsObject(jsonpData)) return;
      } catch (_jsonpErr) {
        // Continúa a /currentsong vía proxy
      }

      try {
        const rawSong = await fetchTextFast(radioUrl, 2500);
        applyParsedSong(parseRadioSongString(rawSong, "Radio Mexico"));
      } catch (err) {
        console.warn("No se pudo actualizar metadatos de radio:", err.message || err);
      }
    }

    async function updateListeners() {
      if (currentMode !== "Radio") return;
      try {
        const rawStats = await fetchTextFast(statsUrl, 2500);
        const statsData = extractStatsPayload(rawStats);
        if (statsData && statsData.currentlisteners !== undefined) {
          applyListenersCount(statsData.currentlisteners);
          return;
        }
      } catch (_err) {
        // Respaldo JSONP
      }

      try {
        const jsonpData = await fetchStatsViaJsonp(statsUrl);
        if (jsonpData && jsonpData.currentlisteners !== undefined) {
          applyListenersCount(jsonpData.currentlisteners);
        }
      } catch (_jsonpErr) {
        // Silencioso en contador
      }
    }

    updateMetadata();
    updateListeners();

    radioMetaIntervalId = setInterval(updateMetadata, RADIO_POLL_MS);
    contadorIntervalId = setInterval(updateListeners, LISTENERS_POLL_MS);
  }

  function startRadio() {
    stopRadioIntervals();
    lastRadioTitle = "";
    manualPaused = false;
    clearHistoryList();

    if (trackTitleEl) trackTitleEl.textContent = "RADIO MEXICO";
    if (trackArtistEl) trackArtistEl.textContent = "AUTO DJ";
    if (trackAlbumEl) trackAlbumEl.textContent = "MIX 1";
    if (coverImg) coverImg.src = RADIO_FALLBACK_COVER;

    updateModeUI("Radio");
    triggerNeedleTrackChange();
    setSourceAndPlay(RADIO_STREAM_URL);
    startRadioMetadata();
  }

  // ===============================
  // 🎵 MODO MÚSICA LOCAL (JSON)
  // ===============================
  function flattenMusicData(data) {
    let allTracks = [];
    Object.values(data).forEach((value) => {
      if (Array.isArray(value)) {
        allTracks = allTracks.concat(value);
      } else if (typeof value === "object" && value !== null) {
        Object.values(value).forEach((subValue) => {
          if (Array.isArray(subValue)) {
            allTracks = allTracks.concat(subValue);
          }
        });
      }
    });
    return allTracks;
  }

  function playCurrentTrack() {
    const track = currentPlaylist[currentTrackIndex];
    if (!track || !player) return;

    const audioSrc =
      track.enlace ||
      track.dropbox_url ||
      Object.values(track).find(
        (val) => typeof val === "string" && /\.(mp3|m4a)(\?|$)/i.test(val)
      );

    if (!audioSrc) {
      playNextTrack();
      return;
    }

    const title = track.nombre || track.name || "Sin título";
    const artist = track.artista || "Desconocido";
    const album = track.album || track.seccion || "Casino Digital";
    const coverSrc = track.caratula || RADIO_FALLBACK_COVER;
    const rawDuration = track.duracion ?? track.duration;

    if (coverImg) coverImg.src = `${coverSrc}?t=${Date.now()}`;
    if (trackTitleEl) trackTitleEl.textContent = title;
    if (trackArtistEl) trackArtistEl.textContent = artist;
    if (trackAlbumEl) trackAlbumEl.textContent = album;

    triggerNeedleTrackChange();
    recordLocalTrackInHistory(title, artist, rawDuration, currentTrackIndex);
    setSourceAndPlay(audioSrc);
  }

  function playNextTrack() {
    if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;
    if (repeatMode === "playlist") {
      currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
    } else {
      currentTrackIndex++;
      if (currentTrackIndex >= currentPlaylist.length) {
        manualPaused = true;
        updatePlayIcon(false);
        syncTurntableSpinState();
        renderHistoryList();
        return;
      }
    }
    playCurrentTrack();
  }

  function playPrevTrack() {
    if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;
    if (currentTrackIndex > 0) {
      currentTrackIndex--;
      playCurrentTrack();
    }
  }

  function playRandomTrack() {
    if (!Array.isArray(currentPlaylist) || currentPlaylist.length === 0) return;
    currentTrackIndex = Math.floor(Math.random() * currentPlaylist.length);
    playCurrentTrack();
  }

  async function startMusicLocal() {
    stopRadioIntervals();
    lastRadioTitle = "";
    manualPaused = false;
    clearHistoryList();
    updateModeUI("Música");

    try {
      const res = await fetch(LOCAL_PLAYLIST_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const tracks = Array.isArray(data) ? data : flattenMusicData(data);

      if (!Array.isArray(tracks) || tracks.length === 0) {
        console.warn("No se encontraron pistas en la playlist local.");
        return;
      }

      currentPlaylist = tracks;
      currentTrackIndex = 0;
      playCurrentTrack();
    } catch (err) {
      console.error("Error al cargar playlist local:", err);
    }
  }

  // ===============================
  // 🔀 CAMBIO DE MODO (Radio <-> Local)
  // ===============================
  async function togglePlaybackMode() {
    if (isSwitchingMode) return;
    isSwitchingMode = true;

    try {
      if (currentMode === "Radio") {
        await startMusicLocal();
      } else {
        startRadio();
      }
    } finally {
      isSwitchingMode = false;
    }
  }

  if (statusSwitch) {
    statusSwitch.addEventListener("click", togglePlaybackMode);
  }

  // ===============================
  // ▶️ BOTONERA
  // ===============================
  if (playBtn && player) {
    playBtn.addEventListener("click", () => {
      if (!player.src || player.src === "#") {
        if (currentMode === "Radio") {
          startRadio();
        } else if (currentPlaylist.length > 0) {
          playCurrentTrack();
        } else {
          startMusicLocal();
        }
        return;
      }
      if (player.paused || player.ended || manualPaused) {
        manualPaused = false;
        syncTurntableSpinState();
        player.play()
          .then(() => {
            hasStartedPlayback = true;
            updatePlayIcon(true);
            syncTurntableSpinState();
            renderHistoryList();
          })
          .catch((err) => {
            console.warn("Error al reproducir:", err);
            syncTurntableSpinState();
            renderHistoryList();
          });
      } else {
        manualPaused = true;
        player.pause();
        updatePlayIcon(false);
        syncTurntableSpinState();
        renderHistoryList();
      }
    });
  }

  if (forwardBtn && player) {
    forwardBtn.addEventListener("click", (event) => {
      if (currentMode !== "Música" || currentPlaylist.length === 0) return;
      if (event.detail === 2 && !player.paused && isFinite(player.duration)) {
        player.currentTime = Math.min(player.duration, player.currentTime + 10);
      } else {
        playNextTrack();
      }
    });
  }

  if (rewindBtn && player) {
    rewindBtn.addEventListener("click", (event) => {
      if (currentMode !== "Música" || currentPlaylist.length === 0) return;
      if (event.detail === 2 && !player.paused && isFinite(player.duration)) {
        player.currentTime = Math.max(0, player.currentTime - 10);
      } else {
        playPrevTrack();
      }
    });
  }

  if (repeatBtn) {
    let repeatHoldTimer = null;

    function setRepeat(mode) {
      repeatMode = mode;
      repeatBtn.classList.remove("repeat-track", "repeat-playlist", "active");
      if (mode === "track") {
        repeatBtn.classList.add("repeat-track", "active");
      } else if (mode === "playlist") {
        repeatBtn.classList.add("repeat-playlist", "active");
      }
    }

    repeatBtn.addEventListener("click", (event) => {
      if (currentMode !== "Música" || currentPlaylist.length === 0) return;
      setRepeat(event.detail === 2 ? "playlist" : "track");
    });

    repeatBtn.addEventListener("mousedown", () => {
      repeatHoldTimer = setTimeout(() => setRepeat(null), 2000);
    });
    repeatBtn.addEventListener("mouseup", () => clearTimeout(repeatHoldTimer));
    repeatBtn.addEventListener("mouseleave", () => clearTimeout(repeatHoldTimer));
  }

  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      if (currentMode !== "Música" || currentPlaylist.length === 0) return;
      isShuffleMode = !isShuffleMode;
      shuffleBtn.classList.toggle("shuffle-active", isShuffleMode);
      shuffleBtn.classList.toggle("active", isShuffleMode);
      if (isShuffleMode) playRandomTrack();
    });
  }

  if (player) {
    player.addEventListener("loadedmetadata", updateLatestLocalDuration);

    player.addEventListener("play", () => {
      hasStartedPlayback = true;
      manualPaused = false;
      updatePlayIcon(true);
      syncTurntableSpinState();
      startNotesFlow();
      renderHistoryList();
    });

    player.addEventListener("pause", () => {
      manualPaused = true;
      updatePlayIcon(false);
      syncTurntableSpinState();
      stopNotesFlow();
      renderHistoryList();
    });

    player.addEventListener("ended", () => {
      manualPaused = true;
      stopNotesFlow();
      if (currentMode !== "Música") {
        updatePlayIcon(false);
        syncTurntableSpinState();
        renderHistoryList();
        return;
      }
      if (repeatMode === "track") {
        playCurrentTrack();
        return;
      }
      if (isShuffleMode) {
        playRandomTrack();
        return;
      }
      playNextTrack();
      syncTurntableSpinState();
    });

    player.addEventListener("timeupdate", () => {
      if (currentMode !== "Música" || !timeBar) return;
      if (!player.duration || !isFinite(player.duration) || isNaN(player.currentTime)) return;
      timeBar.value = (player.currentTime / player.duration) * 100;
    });
  }

  // ===============================
  // 🔊 VOLUMEN Y PROGRESO
  // ===============================
  let isMuted = false;
  let lastVolume = parseFloat(volumeSlider?.value) || 0.7;

  function applyVolume(value) {
    if (!player) return;
    const val = Math.max(0, Math.min(1, parseFloat(value) || 0));
    player.volume = val;
    if (volumeSlider) volumeSlider.value = val;

    if (volumeIcon) {
      if (val === 0 || isMuted) {
        volumeIcon.className = "fas fa-volume-mute";
      } else if (val < 0.5) {
        volumeIcon.className = "fas fa-volume-down";
      } else {
        volumeIcon.className = "fas fa-volume-up";
      }
    }
  }

  applyVolume(lastVolume);

  if (volumeIcon) {
    volumeIcon.addEventListener("click", () => {
      if (!isMuted) {
        lastVolume = parseFloat(volumeSlider?.value) || player?.volume || 0.7;
        applyVolume(0);
        isMuted = true;
      } else {
        applyVolume(lastVolume);
        isMuted = false;
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      isMuted = false;
      applyVolume(parseFloat(volumeSlider.value));
    });
  }

  if (timeBar && player) {
    timeBar.addEventListener("input", () => {
      if (currentMode !== "Música") return;
      if (!player.duration || !isFinite(player.duration)) return;
      const newTime = (parseFloat(timeBar.value) / 100) * player.duration;
      if (!isNaN(newTime) && newTime >= 0 && newTime <= player.duration) {
        player.currentTime = newTime;
      }
    });
  }

  // ===============================
  // 🚀 INICIO: Modo Radio por defecto
  // ===============================
  startRadio();
});