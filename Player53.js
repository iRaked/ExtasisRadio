// ===============================
// 🎧 INICIALIZACIÓN GLOBAL Y ESTADOS CRÍTICOS
// ===============================
/* ============ R53 · Motor de reproducción ============ */
window.R53Player = (function(){
  'use strict';

  const JSON_URL  = 'https://radio-tekileros.vercel.app/PielAPiel.json';
  const COVER_DEF = 'https://santi-graphics.vercel.app/assets/covers/Cover1.png';

  let audio = document.getElementById('audio');
  if (!audio){
    audio = document.createElement('audio');
    audio.id = 'audio'; audio.preload = 'metadata';
    document.body.appendChild(audio);
  }

  const estado = { lista: [], actual: 0, sonando: false, listo: false };
  const modo   = { shuffle: false, repeat: false };
  let scrubbing = false;

  /* ---- Volumen: 0..1 nativo, hasta 2 con boost Web Audio ---- */
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
    const poner = u => document.getElementById('r53').style.setProperty('--r53-cover', `url("${u}")`);
    if (!url){ poner(COVER_DEF); return; }
    const img = new Image();
    img.onload  = () => poner(url);
    img.onerror = () => poner(COVER_DEF);
    img.src = url;
  }

  /* ---- JSON ---- */
  function cargarLista(data){
    const pistas = [];
    Object.values(data || {}).forEach(sec => {
      if (!Array.isArray(sec)) return;
      sec.forEach(t => pistas.push({
        id:t.id, titulo:t.nombre, artista:t.artista, album:t.album,
        cover:t.caratula, src:t.enlace, dur:t.duracion,
        genero:t.genero, emotion:t.emotion, seccion:t.seccion, country:t.country
      }));
    });
    return pistas;
  }

  /* ---- Web Audio (boost 2x) ---- */
  async function probarCORS(url){
    try{
      const res = await fetch(url, { method:'HEAD', mode:'cors' });
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
      src.connect(gainNodo); gainNodo.connect(ctx.destination);
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
      gainNodo.gain.value = v;   // 0..2 → aquí vive el doble de volumen
    } else {
      audio.volume = v;          // 0..1 nativo
    }
    emitir('volumen', { vol: v, boost: boostOK });
  }
  function setVolumen(v){ vol = v; aplicarVolumen(); }
  function toggleMute(){
    if (vol > 0){ volPrev = vol; vol = 0; } else { vol = volPrev || 1; }
    aplicarVolumen();
    return vol;
  }

  /* ---- Init ---- */
  async function init(){
    try{
      const res = await fetch(JSON_URL);
      estado.lista = cargarLista(await res.json());
    }catch(e){
      console.warn('R53: no se pudo leer el JSON', e);
      aplicarCover(COVER_DEF);
    }
    estado.listo = true;
    if (estado.lista.length){
      boostOK = await probarCORS(estado.lista[0].src); // ¿2x disponible?
      if (boostOK) audio.crossOrigin = 'anonymous';    // antes de asignar src
      cargarPista(0, false);
    }
    aplicarVolumen();
    emitir('listo', { lista: estado.lista, actual: estado.actual, sonando: estado.sonando });
  }

  /* ---- Carga / control ---- */
  function cargarPista(i, autoplay = true){
    if (!estado.lista.length) return;
    estado.actual = (i + estado.lista.length) % estado.lista.length;
    const t = estado.lista[estado.actual];
    audio.src = t.src;
    aplicarCover(t.cover);
    emitir('cambio', { pista:t, index:estado.actual, lista:estado.lista });
    if (autoplay) reproducir();
  }
  function reproducir(){
    if (!audio.src) return;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    audio.play().then(()=>{
      estado.sonando = true; emitir('estado', { sonando:true });
    }).catch(err => console.warn('R53: esperando gesto del usuario', err));
  }
  function pausar(){
    audio.pause();
    estado.sonando = false; emitir('estado', { sonando:false });
  }
  const toggle = () => estado.sonando ? pausar() : reproducir();

  function siguiente(){
    if (modo.shuffle && estado.lista.length > 1){
      let i; do { i = Math.floor(Math.random() * estado.lista.length); } while (i === estado.actual);
      cargarPista(i);
    } else cargarPista(estado.actual + 1);
  }
  const anterior = () => cargarPista(estado.actual - 1);
  function toggleShuffle(){
    modo.shuffle = !modo.shuffle;
    emitir('modo', { ...modo });
    if (modo.shuffle) siguiente(); // 🔀 inmediato
    return modo.shuffle;
  }
  function toggleRepeat(){
    modo.repeat = !modo.repeat;
    emitir('modo', { ...modo });
    return modo.repeat;
  }

  /* ---- 🔓 Desbloqueo con 1 clic ---- */
  function desbloquear(e){
    document.removeEventListener('pointerdown', desbloquear);
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (e.target.closest('button') || e.target.closest('.r53-arc') || e.target.closest('.r53-vol')) return;
    if (!estado.sonando) reproducir();
  }
  document.addEventListener('pointerdown', desbloquear);

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
  audio.addEventListener('ended', ()=>{
    if (modo.repeat){ audio.currentTime = 0; reproducir(); }
    else siguiente();
  });
  audio.addEventListener('error', ()=> aplicarCover(COVER_DEF));

  init();

  return { get estado(){ return estado; }, get modo(){ return modo; },
           reproducir, pausar, toggle, siguiente, anterior, cargarPista,
           progreso, scrub, seek, toggleShuffle, toggleRepeat,
           setVolumen, toggleMute, boostDisponible: () => boostOK,
           coverDefault: COVER_DEF };
})();