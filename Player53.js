// ==========================================================
// 🎧 R53 · Motor de Audio (expuesto como window.R53Player)
// ==========================================================
window.R53Player = (function(){
  'use strict';

  const JSON_URL  = 'https://radio-tekileros.vercel.app/Pelusos.json';
  const COVER_DEF = 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';

  let audio = document.getElementById('audio');
  if (!audio){
    audio = document.createElement('audio');
    audio.id = 'audio';
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    document.body.appendChild(audio);
  } else {
    audio.crossOrigin = 'anonymous';
  }

  const estado = { lista: [], actual: 0, sonando: false, listo: false };
  const modo   = { shuffle: false, repeat: false };
  let scrubbing = false;
  let playId = 0;

  /* ---- Volumen & Web Audio ---- */
  let vol = 1, volPrev = 1, boostOK = false;
  let ctx = null, gainNodo = null, conectado = false;

  const fmt = s => (!isFinite(s) ? '0:00'
    : Math.floor(Math.max(0,s)/60) + ':' + String(Math.round(s%60)).padStart(2,'0'));
  const emitir = (t,d) => document.dispatchEvent(new CustomEvent('r53:'+t, { detail:d }));

  /* ---- Arco de progreso ---- */
  const C = { cx:200, cy:200, r:160, a0:195, a1:-15, span:210 };
  const pt = a => { const r = a*Math.PI/180; return [C.cx + C.r*Math.cos(r), C.cy - C.r*Math.sin(r)]; };

  function progreso(p){
    p = Math.min(1, Math.max(0, p || 0));
    const ang = C.a0 - C.span * p;
    const [x0,y0] = pt(C.a0), [x1,y1] = pt(ang);
    const large = (C.a0 - ang) > 180 ? 1 : 0;
    const path = document.getElementById('r53Prog');
    const dot  = document.getElementById('r53Handle');
    if (path) path.setAttribute('d', `M ${x0} ${y0} A ${C.r} ${C.r} 0 ${large} 1 ${x1} ${y1}`);
    if (dot){ dot.setAttribute('cx', x1); dot.setAttribute('cy', y1); }
  }

  function scrub(p){
    scrubbing = true;
    progreso(p);
    const cur = document.getElementById('r53Cur');
    if (cur && isFinite(audio.duration)) cur.textContent = fmt(p * audio.duration);
  }

  function seek(p){
    scrubbing = false;
    progreso(p);
    if (isFinite(audio.duration)) audio.currentTime = p * audio.duration;
  }

  /* ---- Portada con fallback ---- */
  function aplicarCover(url){
    const playerEl = document.getElementById('r53');
    if (!playerEl) return;
    const poner = u => playerEl.style.setProperty('--r53-cover', `url("${u}")`);
    if (!url){ poner(COVER_DEF); return; }
    const img = new Image();
    img.onload  = () => poner(url);
    img.onerror = () => poner(COVER_DEF);
    img.src = url;
  }

  /* ---- Mapeo JSON ---- */
  function cargarLista(data){
    const pistas = [];
    Object.values(data || {}).forEach(sec => {
      if (!Array.isArray(sec)) return;
      sec.forEach(t => pistas.push({
        id:t.id, titulo:t.nombre, artista:t.artista, album:t.album,
        cover:t.portada || t.caratula,
        src:t.enlace, dur:t.duracion,
        genero:t.genero, emotion:t.emotion, seccion:t.seccion, country:t.country
      }));
    });
    return pistas;
  }

  /* ---- Web Audio (boost 2x) ---- */
  async function probarCORS(url){
    try{
      const res = await fetch(url, {
        method:'GET', mode:'cors', cache:'no-store',
        headers:{ 'Range':'bytes=0-0' }
      });
      return !!res.headers.get('access-control-allow-origin');
    }catch(e){ return false; }
  }

  function conectarWebAudio(){
    if (conectado) return true;
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = ctx || new AC();
      const src = ctx.createMediaElementSource(audio);
      gainNodo = ctx.createGain();
      src.connect(gainNodo);
      gainNodo.connect(ctx.destination);
      conectado = true;
    }catch(e){ console.warn('R53: Web Audio no disponible', e); }
    return conectado;
  }

  function aplicarVolumen(){
    const max = boostOK ? 2 : 1;
    const v = Math.min(max, Math.max(0, vol));
    if (conectado || (v > 1 && conectarWebAudio())){
      if (ctx.state === 'suspended') ctx.resume();
      audio.volume = 1;
      gainNodo.gain.value = v;
    } else {
      audio.volume = v;
    }
    emitir('volumen', { vol: v, boost: boostOK });
  }

  function setVolumen(v){ vol = v; aplicarVolumen(); }
  function toggleMute(){
    if (vol > 0){ volPrev = vol; vol = 0; } else vol = volPrev || 1;
    aplicarVolumen();
    return vol;
  }

  /* ==========================================================
     🎛️ MEDIA SESSION (controles en pantalla de bloqueo)
     ========================================================== */
  function actualizarMediaSession(t){
    if (!('mediaSession' in navigator)) return;
    try{
      navigator.mediaSession.metadata = new MediaMetadata({
        title:  t.titulo  || 'Sin título',
        artist: t.artista || '',
        album:  t.album   || '',
        artwork: t.cover ? [{ src: t.cover, sizes: '512x512', type: 'image/jpeg' }] : []
      });
    }catch(e){}
  }

  function configurarMediaSession(){
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play',          () => reproducir());
    navigator.mediaSession.setActionHandler('pause',         () => pausar());
    navigator.mediaSession.setActionHandler('previoustrack', () => anterior());
    navigator.mediaSession.setActionHandler('nexttrack',     () => siguiente());
    navigator.mediaSession.setActionHandler('seekto', d => {
      if (d.seekTime !== undefined && isFinite(audio.duration)) audio.currentTime = d.seekTime;
    });
  }

  function actualizarPlaybackState(sonando){
    if (!('mediaSession' in navigator)) return;
    try{ navigator.mediaSession.playbackState = sonando ? 'playing' : 'paused'; }catch(e){}
  }

  /* ---- Init: caché primero, red después, refresh en background ---- */
  async function init(){
    const estaOnline = navigator.onLine;
    let datosCargados = false;

    // 1. Caché primero (instantáneo)
    if ('caches' in window){
      try{
        const cacheNames = await caches.keys();
        for (const name of cacheNames){
          if (name.startsWith('r53-cache')){
            const cache = await caches.open(name);
            const cached = await cache.match(JSON_URL);
            if (cached){
              estado.lista = cargarLista(await cached.json());
              estado.listo = true;
              datosCargados = true;
              cargarPista(0, false);
              emitir('listo', { lista: estado.lista, actual: estado.actual, sonando: estado.sonando, online: estaOnline });
              console.log('R53: JSON cargado desde caché');
              break;
            }
          }
        }
      }catch(e){}
    }

    // 2. Si no hay caché, red
    if (!datosCargados && estaOnline){
      console.log('R53: Sin caché, descargando JSON de red...');
      try{
        const res = await fetch(JSON_URL);
        if (res.ok){
          estado.lista = cargarLista(await res.json());
          estado.listo = true;
          datosCargados = true;
          cargarPista(0, false);
          emitir('listo', { lista: estado.lista, actual: estado.actual, sonando: estado.sonando, online: estaOnline });
          console.log('R53: JSON descargado de red');
        }
      }catch(e){
        console.error('R53: error descargando JSON', e);
      }
    }

    // 3. Refresh silencioso en background
    if (datosCargados && estaOnline){
      fetch(JSON_URL)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.pelusos){
            const nuevosIds = data.pelusos.map(t => t.id).join(',');
            const actualesIds = estado.lista.map(t => t.id).join(',');
            if (nuevosIds !== actualesIds){
              console.log('R53: JSON actualizado en background');
              estado.lista = cargarLista(data);
              emitir('listo', { lista: estado.lista, actual: estado.actual, sonando: estado.sonando, online: estaOnline });
            }
          }
        }).catch(()=>{});
    }

    // 4. Prueba CORS para boost 2x
    if (estado.lista.length && estaOnline){
      for (const pista of estado.lista){
        try{
          if (await probarCORS(pista.src)){
            boostOK = true;
            console.log('R53: CORS detectado, boost 2x disponible');
            break;
          }
        }catch(e){}
      }
    }

    // 5. Configurar Media Session (una sola vez)
    configurarMediaSession();

    aplicarVolumen();
  }

  /* ---- Control de reproducción ---- */
  function cargarPista(i, autoplay = true){
    if (!estado.lista.length) return;
    playId++;
    estado.actual = (i + estado.lista.length) % estado.lista.length;
    const t = estado.lista[estado.actual];

    audio.pause();
    audio.src = t.src;
    audio.load();
    aplicarCover(t.cover);

    const tot = document.getElementById('r53Tot');
    if (tot && t.dur) tot.textContent = t.dur;
    const cur = document.getElementById('r53Cur');
    if (cur) cur.textContent = '0:00';
    progreso(0);

    emitir('cambio', { pista:t, index:estado.actual, lista:estado.lista });

    // 🎛️ Actualiza Media Session con los datos del nuevo track
    actualizarMediaSession(t);

    if (autoplay) reproducir();
  }

  function reproducir(){
    if (!audio.src) return;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    const currentPlayId = playId;
    const playPromise = audio.play();
    if (playPromise !== undefined){
      playPromise.then(() => {
        if (currentPlayId === playId){
          estado.sonando = true;
          emitir('estado', { sonando:true });
          actualizarPlaybackState(true);   // 🎛️
        }
      }).catch(err => {
        if (err.name !== 'AbortError') console.warn('R53: play bloqueado', err);
      });
    }
  }

  function pausar(){
    playId++;
    audio.pause();
    estado.sonando = false;
    emitir('estado', { sonando:false });
    actualizarPlaybackState(false);   // 🎛️
  }

  const toggle = () => estado.sonando ? pausar() : reproducir();

  function siguiente(){
    if (modo.shuffle && estado.lista.length > 1){
      let i;
      do { i = Math.floor(Math.random() * estado.lista.length); } while (i === estado.actual);
      cargarPista(i);
    } else {
      cargarPista(estado.actual + 1);
    }
  }

  const anterior = () => cargarPista(estado.actual - 1);

  function toggleShuffle(){
    modo.shuffle = !modo.shuffle;
    emitir('modo', { ...modo });
    if (modo.shuffle) siguiente();
    return modo.shuffle;
  }

  function toggleRepeat(){
    modo.repeat = !modo.repeat;
    emitir('modo', { ...modo });
    return modo.repeat;
  }

  /* ---- Eventos del audio ---- */
  audio.addEventListener('timeupdate', ()=>{
    if (scrubbing) return;
    const d = audio.duration || 0;
    progreso(d ? audio.currentTime / d : 0);
    const cur = document.getElementById('r53Cur');
    if (cur) cur.textContent = fmt(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', ()=>{
    const tot = document.getElementById('r53Tot');
    if (tot && isFinite(audio.duration)) tot.textContent = fmt(audio.duration);
  });

  audio.addEventListener('ended', () => modo.repeat ? (audio.currentTime = 0, reproducir()) : siguiente());

  /* 🛡️ Reintentos: si la red titubea, reintenta la MISMA pista antes de saltar */
  let reintentos = 0;
  audio.addEventListener('playing', () => { reintentos = 0; });
  audio.addEventListener('error', () => {
    aplicarCover(COVER_DEF);
    reintentos++;
    if (reintentos <= 2){
      console.warn(`R53: reintento ${reintentos} de la pista actual`);
      setTimeout(() => { audio.load(); reproducir(); }, 1200);
    } else {
      reintentos = 0;
      if (estado.lista.length > 1) setTimeout(siguiente, 800);
    }
  });

  /* ---- Desbloqueo con gesto ---- */
  function desbloquear(e){
    document.removeEventListener('pointerdown', desbloquear);
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (e.target.closest('button') || e.target.closest('.r53-arc') || e.target.closest('.r53-vol') || e.target.closest('.r53-tracklist')) return;
    if (!estado.sonando && audio.src) reproducir();
  }
  document.addEventListener('pointerdown', desbloquear);

  /* ---- Conexión ---- */
  window.addEventListener('online',  () => emitir('conexion', { online: true }));
  window.addEventListener('offline', () => emitir('conexion', { online: false }));

  init();

  /* ---- API pública ---- */
  return {
    get estado(){ return estado; },
    get modo(){ return modo; },
    reproducir, pausar, toggle, siguiente, anterior, cargarPista,
    progreso, scrub, seek, toggleShuffle, toggleRepeat,
    setVolumen, toggleMute, boostDisponible: () => boostOK,
    coverDefault: COVER_DEF
  };
})();
