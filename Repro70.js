'use strict';

document.addEventListener('DOMContentLoaded', function() {
    // 1. Referencias al DOM (con validación para evitar errores si algo tarda en cargar)
    const playButton = document.getElementById('playButton');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumePercentage = document.getElementById('volumePercentage');
    const volumeIcon = document.getElementById('volumeIcon');
    const sonicTitle = document.getElementById('sonic_title');
    const sonicArt = document.getElementById('sonic_art');
    const sonicDj = document.getElementById('sonic_dj');
    const playerContainer = document.querySelector('.player-container');

    // 2. Configuración del Audio (Nuevo Servidor)
    const audio = new Audio();
    audio.src = "https://technoplayerserver.net/8214/stream";
    audio.volume = 0.7;
    audio.crossOrigin = "anonymous";
    audio.preload = "none"; // Optimiza la carga inicial

    let isPlaying = false;
    let previousVolume = 0.7; // Declarado al inicio para evitar problemas de alcance (scope)

    // 3. Función para actualizar el icono de volumen
    function updateVolumeIcon(volume) {
        if (!volumeIcon) return;
        volumeIcon.classList.remove('fa-volume-up', 'fa-volume-down', 'fa-volume-off', 'fa-volume-mute');
        
        if (volume >= 0.7) volumeIcon.classList.add('fa-volume-up');
        else if (volume >= 0.3) volumeIcon.classList.add('fa-volume-down');
        else if (volume > 0) volumeIcon.classList.add('fa-volume-off');
        else volumeIcon.classList.add('fa-volume-mute');
    }

    // Inicializar estado del volumen
    updateVolumeIcon(audio.volume);
    if (volumePercentage) volumePercentage.textContent = Math.round(audio.volume * 100) + '%';
    if (volumeSlider) volumeSlider.style.setProperty('--volume-percent', Math.round(audio.volume * 100) + '%');

    // 4. Control de Reproducción (Play/Pause)
    if (playButton) {
        playButton.addEventListener('click', function() {
            if (isPlaying) {
                audio.pause();
                playButton.innerHTML = "▶";
                if (playerContainer) playerContainer.classList.remove('playing');
            } else {
                // El .play() devuelve una promesa. La manejamos para evitar errores silenciosos del navegador
                audio.play().then(() => {
                    playButton.innerHTML = "⏸";
                    if (playerContainer) playerContainer.classList.add('playing');
                }).catch(error => {
                    console.error("Error al reproducir el audio:", error);
                    if (sonicTitle) sonicTitle.textContent = "Error: Verifica tu conexión";
                });
            }
            isPlaying = !isPlaying;
        });
    }

    // 5. Manejo de errores de la transmisión
    audio.addEventListener('error', function(e) {
        console.error("Error en la transmisión de audio:", e);
        if (sonicTitle) sonicTitle.textContent = "Transmisión no disponible";
        if (playButton) playButton.innerHTML = "▶";
        if (playerContainer) playerContainer.classList.remove('playing');
        isPlaying = false;
    });

    // 6. Control de Volumen (Slider)
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            const volume = parseFloat(this.value);
            audio.volume = volume;
            updateVolumeIcon(volume);
            if (volumePercentage) volumePercentage.textContent = Math.round(volume * 100) + '%';
            this.style.setProperty('--volume-percent', Math.round(volume * 100) + '%');
        });
    }

    // 7. Control de Silenciar/Restaurar (Click en el icono)
    if (volumeIcon) {
        volumeIcon.addEventListener('click', function() {
            if (audio.volume > 0) {
                previousVolume = audio.volume;
                audio.volume = 0;
                if (volumeSlider) volumeSlider.value = 0;
                updateVolumeIcon(0);
                if (volumePercentage) volumePercentage.textContent = '0%';
                if (volumeSlider) volumeSlider.style.setProperty('--volume-percent', '0%');
            } else {
                audio.volume = previousVolume;
                if (volumeSlider) volumeSlider.value = previousVolume;
                updateVolumeIcon(previousVolume);
                if (volumePercentage) volumePercentage.textContent = Math.round(previousVolume * 100) + '%';
                if (volumeSlider) volumeSlider.style.setProperty('--volume-percent', Math.round(previousVolume * 100) + '%');
            }
        });
    }

    // 8. Lógica del Widget Antyserv (DJ y Arte)
    let usingAutoDj = false;
    let currentSong = '';
    let currentArtUrl = '';
    let currentDj = 'AutoDj';

    function formatDjText() {
        if (!sonicDj) return;
        const textContent = sonicDj.textContent.trim();
        
        // Limpiar posibles iconos inyectados por el widget
        if (sonicDj.querySelector('i')) {
            sonicDj.innerHTML = textContent;
        }

        const currentText = sonicDj.textContent.trim();
        if (currentText === '' || currentText === '--' || currentText.toLowerCase() === 'no dj') {
            sonicDj.textContent = 'AutoDj';
            usingAutoDj = true;
        } else if (currentText !== 'AutoDj') {
            usingAutoDj = false;
            currentDj = currentText;
        } else if (usingAutoDj) {
            sonicDj.textContent = 'AutoDj';
        }

        if (sonicDj.textContent.trim() === '') {
            sonicDj.textContent = 'AutoDj';
            usingAutoDj = true;
        }
    }

    function monitorUpdates() {
        if (sonicTitle && sonicTitle.textContent.trim() !== currentSong) {
            currentSong = sonicTitle.textContent.trim();
            currentArtUrl = ''; // Permitir actualización de arte al cambiar canción
        }

        if (sonicArt) {
            const artStyle = window.getComputedStyle(sonicArt);
            const artUrl = artStyle.backgroundImage;
            
            if (currentArtUrl === '' && artUrl !== 'url("https://i.postimg.cc/9QjRNwKt/disco-rojo.png")' && artUrl !== 'none') {
                currentArtUrl = artUrl;
            } else if (currentArtUrl !== '' && artUrl !== currentArtUrl) {
                sonicArt.style.backgroundImage = currentArtUrl;
            }
        }

        if (sonicDj) {
            const djText = sonicDj.textContent.trim();
            const isNoDj = djText === '' || djText === '--' || djText.toLowerCase() === 'no dj';
            
            if (isNoDj) {
                sonicDj.textContent = 'AutoDj';
                currentDj = 'AutoDj';
            } else if (djText !== currentDj && djText !== 'AutoDj') {
                currentDj = djText;
            } else if (djText !== currentDj) {
                sonicDj.textContent = currentDj;
            }
        }
    }

    // Ejecutar lógica del DJ y monitoreo
    formatDjText();
    setTimeout(formatDjText, 5000);
    setTimeout(monitorUpdates, 2000);
    setInterval(monitorUpdates, 2000);

    // 9. Reloj y Fecha
    function updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', { hour12: false });
        const dateString = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const timeEl = document.getElementById('current-time');
        const dateEl = document.getElementById('current-date');
        
        if (timeEl) timeEl.textContent = timeString;
        if (dateEl) dateEl.textContent = dateString;
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // 10. Historial
    const historyButton = document.getElementById('historyButton');
    const historyContainer = document.getElementById('historyContainer');
    const closeHistory = document.getElementById('closeHistory');

    if (historyButton && historyContainer && closeHistory) {
        historyButton.addEventListener('click', function() {
            historyContainer.classList.add('active');
            if (playerContainer) playerContainer.classList.add('blur-background');
            
            const historyContent = document.getElementById('sonic_history');
            if (historyContent && historyContent.children.length === 0) {
                historyContent.innerHTML = '<div class="loading-history">Cargando historial...</div>';
            }
        });

        closeHistory.addEventListener('click', function() {
            historyContainer.classList.remove('active');
            if (playerContainer) playerContainer.classList.remove('blur-background');
        });

        window.addEventListener('click', function(event) {
            if (event.target === historyContainer) {
                historyContainer.classList.remove('active');
                if (playerContainer) playerContainer.classList.remove('blur-background');
            }
        });

        historyContainer.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
});