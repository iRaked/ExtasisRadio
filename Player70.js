'use strict';

/**
 * Player70.js — Constructor dinámico del reproductor.
 */

(function () {
    if (document.querySelector('.player-container')) {
        console.log('Player70: estructura estática detectada. Sin intervención.');
        return;
    }

    const playerHTML = `
    <div class="player-container player-dynamic">
        <div class="music-notes-container">
            ${['♪','♫','♩','♬','♪','♫','♩','♬'].map(n => `<div class="music-note">${n}</div>`).join('')}
        </div>
        <div class="sparkles-container">
            ${Array(11).fill('<div class="sparkle"></div>').join('')}
        </div>

        <div class="listeners-container">
            <span><i class="fas fa-headphones"></i></span>
            <div id='sonic_listeners' class="listeners-count">--</div>
        </div>
        <div class="dj-wrapper">
            <i class="fas fa-headset dj-icon"></i>
            <div id="sonic_dj" class="dj-container">AutoDj</div>
        </div>
        <div id='sonic_art' class="song-art"></div>

        <div class="radio-logo">
            <div class="pulse-effect-container">
                <div class="pulse-ring pulse-ring-1"></div>
                <div class="pulse-ring pulse-ring-2"></div>
                <div class="pulse-ring pulse-ring-3"></div>
            </div>
            <img src="https://i.postimg.cc/9QjRNwKt/disco-rojo.png" alt="Radio Logo">
            <div class="player-controls">
                <button class="play-button" id="playButton">▶</button>
            </div>
        </div>

        <div class="player-title animated-title">
            <div class="neon-title">
                <span class="neon-word first-word">
                    ${[0,0.1,0.2,0.3,0.4].map(d => `<span class="neon-letter" style="--delay: ${d}s;"></span>`).join('')}
                    <span class="neon-word second-word">
                        ${[0.5,0.6,0.7,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4].map(d => `<span class="neon-letter" style="--delay: ${d}s;"></span>`).join('')}
                    </span>
                </span>
            </div>
            <div class="audio-waves">
                ${[
                    {d:0.1,h:15},{d:0.2,h:35},{d:0.3,h:25},{d:0.4,h:40},{d:0.5,h:20},
                    {d:0.6,h:30},{d:0.7,h:35},{d:0.8,h:45},{d:0.9,h:30},{d:1.0,h:25},
                    {d:0.1,h:15},{d:0.2,h:35},{d:0.3,h:25},{d:0.4,h:40},{d:0.5,h:20},
                    {d:0.6,h:30},{d:0.7,h:35},{d:0.8,h:45},{d:0.9,h:30},{d:1.0,h:25},
                    {d:0.4,h:40},{d:0.5,h:20}
                ].map(w => `<div class="wave-bar" style="--delay: ${w.d}s; --height: ${w.h}px;"></div>`).join('')}
            </div>
            <div class="glow-effect"></div>
        </div>

        <div class="volume-control">
            <i id="volumeIcon" class="fas fa-volume-down"></i>
            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="1" step="0.1" value="0.7">
            <span id="volumePercentage" class="volume-percentage">70%</span>
        </div>

        <div class="now-playing" id="nowPlaying">
            <div id='sonic_title'>En vivo...</div>
        </div>

        <div class="datetime-container">
            <i class="fas fa-clock"></i>
            <span id="current-time">00:00:00</span>
            <span class="date-separator">|</span>
            <i class="fas fa-calendar-alt"></i>
            <span id="current-date">00/00/0000</span>
        </div>

        <div><span class="bydev">Creado por Dj Irving</span></div>

        <div class="history-button-container">
            <button id="historyButton" class="history-button">
                <i class="fas fa-history"></i> Historial
            </button>
        </div>
    </div>

    <div id="historyContainer" class="history-container">
        <div class="history-header">
            <h3>Historial de Reproducción</h3>
            <button id="closeHistory" class="close-history">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div id='sonic_history' class="history-content"></div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', playerHTML);
    console.log('Player70: estructura dinámica inyectada con clase .player-dynamic');
})();