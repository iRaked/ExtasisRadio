//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/* ============ R53 · Render, Cola Navegable y Controles ============ */
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(function(){
  'use strict';
  const $ = s => document.querySelector(s);
  const playerEl = document.getElementById('r53');
  const listaEl  = document.getElementById('r53Tracklist');
  const svg      = document.getElementById('r53Arc');
  const P = () => window.R53Player;

  /* ---- Constantes de diseño ---- */
  const W = 400, H = 860;
  const GRADOS = 24;
  const RADIO  = 4;

  /* ---- Estado de navegación de la cola ---- */
  let cursor = 0;
  let offsetVisual = 0;
  let suprimirClick = false;
  let navegandoHasta = 0;

  /* ---- Indicador visual "DESLIZA" ---- */
  const hintEl = document.createElement('div');
  hintEl.className = 'r53-swipe-hint';
  hintEl.innerHTML = '<i class="fa-solid fa-angles-left"></i><span>DESLIZA</span><i class="fa-solid fa-angles-right"></i>';
  if (playerEl) playerEl.appendChild(hintEl);
  let hintOculto = false;

  function marcarNavegacion(){
    navegandoHasta = Date.now() + 2500;
    if (!hintOculto){ hintOculto = true; hintEl.classList.add('hidden'); }
  }

  /* Zona de la cola: amplia, por ENCIMA del corazón/timer/arco */
  const ZONA_COLA_MIN = 180;   // ⬆️ sube con margen (antes 280)
  const ZONA_COLA_MAX = 430;   // ⬆️ tope seguro: corazón está en 448, arco en 440
  const ZONA_COLA_X_MIN = 15;  // ↔️ casi todo el ancho (antes 50)
  const ZONA_COLA_X_MAX = 385; // ↔️ casi todo el ancho (antes 350)

  function enZonaCola(clientX, clientY){
    if (!playerEl) return false;
    const r = playerEl.getBoundingClientRect();
    const escala = Math.min(1, (window.innerWidth - 12) / W, (window.innerHeight - 12) / H);
    const yRel = (clientY - r.top) / escala;
    const xRel = (clientX - r.left) / escala;
    return yRel >= ZONA_COLA_MIN && yRel <= ZONA_COLA_MAX &&
           xRel >= ZONA_COLA_X_MIN && xRel <= ZONA_COLA_X_MAX;
  }

  /* Diferencia circular (wrap 0 ↔ N-1) */
  function offCircular(i, centro, N){
    let off = (i - centro) % N;
    if (off >  N/2) off -= N;
    if (off < -N/2) off += N;
    return off;
  }

  /* ---- Render del abanico alrededor del cursor ---- */
  function pintarAbanico(){
    const motor = P();
    if (!motor || !listaEl) return;
    const pistas = motor.estado.lista;
    const actual = motor.estado.actual;
    const N = pistas.length;
    if (!N) return;

    listaEl.innerHTML = '';
    pistas.forEach((p,i)=>{
      const off = offCircular(i, cursor, N);
      if (Math.abs(off) > RADIO) return;

      const angulo = off * GRADOS + offsetVisual;
      const li = document.createElement('li');
      li.className = 'r53-track' + (i === actual ? ' is-current' : '');
      li.dataset.index = i;
      li.style.setProperty('--fan', angulo + 'deg');

      const dist = Math.abs(angulo) / GRADOS;
      li.style.setProperty('--op', dist < .5 ? 1 : dist < 1.5 ? .42 : dist < 2.5 ? .2 : .1);

      li.innerHTML = `<span class="t-num">${String(i+1).padStart(2,'0')}</span>
                      <span class="t-title">${p.titulo  || ''}</span>
                      <span class="t-artist">${p.artista || ''}</span>`;
      listaEl.appendChild(li);
    });
  }

  function sincronizarIcono(sonando){
    playerEl.classList.toggle('is-paused', !sonando);
    const ico = $('#r53PlayIcon');
    if (ico) ico.className = sonando ? 'fa-solid fa-pause' : 'fa-solid fa-play';
  }
  function sincronizarModo(modo){
    $('#r53Shuffle')?.classList.toggle('active', !!modo.shuffle);
    $('#r53Repeat')?.classList.toggle('active',  !!modo.repeat);
  }

  /* ---- 📱 Auto-escalado ---- */
  function escalar(){
    const s = Math.min(1, (window.innerWidth - 12) / W, (window.innerHeight - 12) / H);
    playerEl.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', escalar);
  window.addEventListener('orientationchange', escalar);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', escalar);
  escalar();

  /* ---- Cursor nativo en la zona de la cola ---- */
  playerEl.addEventListener('mousemove', e => {
    if (dragActivoGlobal) return;
    if (enZonaCola(e.clientX, e.clientY) && !e.target.closest('button, .r53-arc, .r53-vol, .r53-meta, .r53-transport')){
      playerEl.style.cursor = 'grab';
    } else {
      playerEl.style.cursor = '';
    }
  });

  /* ---- Scrubbing del arco ---- */
  const A0 = 195, SPAN = 210, GAP = A0 + (360 - SPAN) / 2;
  function anguloAProgreso(ev){
    const r  = svg.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    let t = Math.atan2(cy - ev.clientY, ev.clientX - cx) * 180 / Math.PI;
    if (t < -15) t += 360;
    if (t > A0)  t = (t > GAP) ? -15 : A0;
    return Math.min(1, Math.max(0, (A0 - t) / SPAN));
  }
  let arrastre = false;
  svg.addEventListener('pointerdown', e=>{
    if (!e.target.closest('.arc-hit, .arc-handle') || !P()) return;
    e.preventDefault();
    arrastre = true;
    svg.classList.add('scrubbing');
    svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
    P().scrub(anguloAProgreso(e));
  });
  svg.addEventListener('pointermove', e=>{ if (arrastre && P()) P().scrub(anguloAProgreso(e)); });
  const soltarArco = e=>{
    if (!arrastre) return;
    arrastre = false;
    svg.classList.remove('scrubbing');
    if (P()) P().seek(anguloAProgreso(e));
  };
  svg.addEventListener('pointerup', soltarArco);
  svg.addEventListener('pointercancel', soltarArco);

  /* ---- Eventos del motor ---- */
  document.addEventListener('r53:listo', e=>{
    if (Date.now() > navegandoHasta) cursor = e.detail.actual;
    offsetVisual = 0;
    pintarAbanico();
    sincronizarIcono(e.detail.sonando);
  });
  document.addEventListener('r53:cambio', e=>{
    if (Date.now() > navegandoHasta) cursor = e.detail.index;
    offsetVisual = 0;
    pintarAbanico();
    if (e.detail.pista.dur) $('#r53Tot').textContent = e.detail.pista.dur;
  });
  document.addEventListener('r53:estado', e=> sincronizarIcono(e.detail.sonando));
  document.addEventListener('r53:modo',   e=> sincronizarModo(e.detail));

  /* ==========================================================
     🎯 NAVEGACIÓN DE LA COLA
     - Wheel: en todo el player.
     - Drag/touch: SOLO en la zona de la cola.
     - Click: en los tracks.
     ========================================================== */
  const N = () => (P() ? P().estado.lista.length : 0);

  /* --- 1. Rueda del ratón: 1 notch = 1 track --- */
  playerEl.addEventListener('wheel', e => {
    e.preventDefault();
    const total = N();
    if (!total) return;
    const paso = e.deltaY > 0 ? 1 : -1;
    cursor = (cursor + paso + total) % total;
    offsetVisual = 0;
    marcarNavegacion();
    pintarAbanico();
  }, { passive: false });

  /* --- 2. Arrastre con ratón: SOLO en zona de la cola --- */
  let dragActivo = false, dragX = 0, cursorBase = 0, recorrido = 0, dragIniciado = false;
  let dragActivoGlobal = false; // bandera para el cursor nativo

  playerEl.addEventListener('mousedown', e => {
    if (e.target.closest('button, .r53-arc, .r53-vol, .r53-meta, .r53-transport')) return;
    if (!enZonaCola(e.clientX, e.clientY)) return;   // ⬅️ ahora SÍ permite drag sobre tracks

    dragActivo = true;
    dragActivoGlobal = true;
    dragIniciado = false;
    dragX = e.clientX;
    cursorBase = cursor;
    recorrido = 0;
    playerEl.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!dragActivo) return;
    const dx = e.clientX - dragX;
    recorrido = Math.abs(dx);

    if (!dragIniciado && recorrido > 6){
      dragIniciado = true;
      e.preventDefault();
    }

    if (dragIniciado){
      offsetVisual = Math.max(-GRADOS*2, Math.min(GRADOS*2, dx * 0.15));
      marcarNavegacion();
      pintarAbanico();
    }
  });

  window.addEventListener('mouseup', () => {
    if (!dragActivo) return;
    dragActivo = false;
    dragActivoGlobal = false;
    playerEl.style.cursor = '';

    if (dragIniciado){
      const delta = Math.round(-offsetVisual / GRADOS);
      const total = N();
      if (total) cursor = (cursorBase + delta + total) % total;
      offsetVisual = 0;
      marcarNavegacion();
      pintarAbanico();
    }
    dragIniciado = false;
  });

  /* --- 3. Gestos táctiles: SOLO en zona de la cola --- */
  let touchX = 0, touchBase = 0, touchRecorrido = 0, touchActivo = false;

  playerEl.addEventListener('touchstart', e => {
    if (!e.touches.length) return;
    if (e.target.closest('button, .r53-arc, .r53-vol, .r53-meta, .r53-transport')) return;
    const t = e.touches[0];
    if (!enZonaCola(t.clientX, t.clientY)) return;   // ⬅️ permite gesto sobre tracks

    touchActivo = true;
    touchX = t.clientX;
    touchBase = cursor;
    touchRecorrido = 0;
  }, { passive: true });

  playerEl.addEventListener('touchmove', e => {
    if (!touchActivo || !e.touches.length) return;
    const dx = e.touches[0].clientX - touchX;
    touchRecorrido = Math.abs(dx);
    offsetVisual = Math.max(-GRADOS*2, Math.min(GRADOS*2, dx * 0.2));
    marcarNavegacion();
    pintarAbanico();
  }, { passive: true });

  const finTouch = () => {
    if (!touchActivo) return;
    touchActivo = false;
    if (touchRecorrido > 6) suprimirClick = true;
    const delta = Math.round(-offsetVisual / GRADOS);
    const total = N();
    if (total) cursor = (touchBase + delta + total) % total;
    offsetVisual = 0;
    marcarNavegacion();
    pintarAbanico();
  };
  playerEl.addEventListener('touchend', finTouch);
  playerEl.addEventListener('touchcancel', finTouch);

  /* --- 4. Click en un track: lo reproduce --- */
  if (listaEl){
    listaEl.addEventListener('click', e => {
      if (suprimirClick){ suprimirClick = false; return; }
      const li = e.target.closest('li');
      if (!li || !P()) return;
      const idx = parseInt(li.dataset.index, 10);
      if (!isNaN(idx)){
        cursor = idx;
        P().cargarPista(idx, true);
      }
    });
  }

  /* ---- Volumen ---- */
  const volWrap  = $('#r53Vol');
  const volTrack = $('#r53VolTrack');
  const volFill  = $('#r53VolFill');
  const volThumb = $('#r53VolThumb');
  const volVal   = $('#r53VolVal');
  const volBoost = $('#r53VolBoost');
  const volIco   = $('#r53MuteIcon');

  function pintarVolumen(d){
    const max = d.boost ? 2 : 1;
    const p = Math.min(1, d.vol / max);
    if (volFill)  volFill.style.width  = (p * 100) + '%';
    if (volThumb) volThumb.style.left  = (p * 100) + '%';
    if (volVal)   volVal.textContent   = Math.round(d.vol * 100);
    if (volBoost) volBoost.style.display = d.boost ? 'block' : 'none';
    if (volWrap)  volWrap.classList.toggle('hot', d.vol > 1);
    if (volIco){
      volIco.className = d.vol === 0 ? 'fa-solid fa-volume-xmark'
                       : d.vol < .5 ? 'fa-solid fa-volume-low'
                       : 'fa-solid fa-volume-high';
    }
  }
  function volDesdeEvento(e){
    const r = volTrack.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  }
  let volArrastre = false;
  function aplicarVolUI(e){
    const max = P() && P().boostDisponible() ? 2 : 1;
    if (P()) P().setVolumen(volDesdeEvento(e) * max);
  }
  if (volTrack){
    volTrack.addEventListener('pointerdown', e=>{
      e.preventDefault();
      volArrastre = true;
      volTrack.setPointerCapture && volTrack.setPointerCapture(e.pointerId);
      aplicarVolUI(e);
    });
    volTrack.addEventListener('pointermove', e=>{ if (volArrastre) aplicarVolUI(e); });
    ['pointerup','pointercancel'].forEach(ev => volTrack.addEventListener(ev, ()=> volArrastre = false));
  }
  document.addEventListener('r53:volumen', e=> pintarVolumen(e.detail));
  const muteBtn = $('#r53Mute');
  if (muteBtn) muteBtn.addEventListener('click', () => P() && P().toggleMute());

  /* ---- Indicador de conexión ---- */
  function actualizarIndicadorConexion(online){
    if (!playerEl) return;
    playerEl.classList.toggle('offline', !online);
    let badge = document.getElementById('r53OfflineBadge');
    if (!badge){
      badge = document.createElement('div');
      badge.id = 'r53OfflineBadge';
      badge.className = 'r53-offline-badge';
      playerEl.appendChild(badge);
    }
    badge.textContent = online ? '🟢 Online' : '🔴 Offline';
    badge.style.display = online ? 'none' : 'block';
  }
  document.addEventListener('r53:conexion', e => actualizarIndicadorConexion(e.detail.online));
  document.addEventListener('r53:listo', e => {
    if (e.detail.online !== undefined) actualizarIndicadorConexion(e.detail.online);
  });
  actualizarIndicadorConexion(navigator.onLine);

  /* ---- Botones de transporte ---- */
  $('#r53Play')?.addEventListener('click',     () => P() && P().toggle());
  $('#r53Next')?.addEventListener('click',     () => P() && P().siguiente());
  $('#r53Prev')?.addEventListener('click',     () => P() && P().anterior());
  $('#r53Shuffle')?.addEventListener('click', e=>{
    const on = !!(P() && P().toggleShuffle());
    e.currentTarget.classList.toggle('active', on);
  });
  $('#r53Repeat')?.addEventListener('click', e=>{
    const on = !!(P() && P().toggleRepeat());
    e.currentTarget.classList.toggle('active', on);
  });
  const heartBtn = $('#r53Heart');
  if (heartBtn) heartBtn.addEventListener('click', e => e.currentTarget.classList.toggle('active'));
})();