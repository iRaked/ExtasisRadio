//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎧 AUDIO PRINCIPAL
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/* ============ R53 · Estética + render ============ */
(function(){
  'use strict';
  const $ = s => document.querySelector(s);
  const playerEl = document.getElementById('r53');
  const listaEl  = document.getElementById('r53Tracklist');
  const svg      = document.getElementById('r53Arc');
  const P = () => window.R53Player;

  /* ---- Abanico de metadatos ---- */
  function pintarAbanico(pistas, actual){
    listaEl.innerHTML = '';
    pistas.forEach((p,i)=>{
      const off = i - actual;
      if (Math.abs(off) > 3) return;
      const li = document.createElement('li');
      li.className = 'r53-track' + (off === 0 ? ' is-current' : '');
      li.style.setProperty('--fan', (off * 24) + 'deg');
      li.style.setProperty('--op', off === 0 ? 1 : Math.abs(off) === 1 ? .42 : Math.abs(off) === 2 ? .2 : .1);
      li.innerHTML = `<span class="t-num">${String(i+1).padStart(2,'0')}</span>
                      <span class="t-title">${p.titulo  || ''}</span>
                      <span class="t-artist">${p.artista || ''}</span>`;
      listaEl.appendChild(li);
    });
  }

  function sincronizarIcono(sonando){
    playerEl.classList.toggle('is-paused', !sonando);
    $('#r53PlayIcon').className = sonando ? 'fa-solid fa-pause' : 'fa-solid fa-play';
  }

  function sincronizarModo(modo){
    $('#r53Shuffle').classList.toggle('active', !!modo.shuffle);
    $('#r53Repeat').classList.toggle('active',  !!modo.repeat);
  }

  /* ---- 📱 Auto-escalado ---- */
  const W = 400, H = 860;
  function escalar(){
    const s = Math.min(1, (window.innerWidth - 12) / W, (window.innerHeight - 12) / H);
    playerEl.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', escalar);
  window.addEventListener('orientationchange', escalar);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', escalar);
  escalar();

  /* ---- Scrubbing manual del semicírculo ---- */
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
  const soltar = e=>{
    if (!arrastre) return;
    arrastre = false;
    svg.classList.remove('scrubbing');
    if (P()) P().seek(anguloAProgreso(e));
  };
  svg.addEventListener('pointerup', soltar);
  svg.addEventListener('pointercancel', soltar);

  /* ---- Eventos del motor ---- */
  document.addEventListener('r53:listo',  e=>{
    pintarAbanico(e.detail.lista, e.detail.actual);
    sincronizarIcono(e.detail.sonando);
  });
  document.addEventListener('r53:cambio', e=>{
    pintarAbanico(e.detail.lista, e.detail.index);
    if (e.detail.pista.dur) $('#r53Tot').textContent = e.detail.pista.dur;
  });
  document.addEventListener('r53:estado', e=> sincronizarIcono(e.detail.sonando));
  document.addEventListener('r53:modo',   e=> sincronizarModo(e.detail));

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

  /* ---- Botón de descarga (opcional, solo si existe) ---- */
  const cacheBtn = $('#r53CacheAll');
  if (cacheBtn){
    cacheBtn.addEventListener('click', async ()=>{
      if (!navigator.onLine){ alert('Necesitas conexión para descargar la playlist'); return; }
      if (!P()) return;
      const pistas = P().estado.lista;
      if (!confirm(`Se descargarán ${pistas.length} tracks para uso offline.\n¿Continuar?`)) return;

      cacheBtn.classList.add('busy');
      let ok = 0;
      for (let i = 0; i < pistas.length; i++){
        try{
          const a = await fetch(pistas[i].src);
          const c = await fetch(pistas[i].cover);
          if (a.ok && c.ok) ok++;
        }catch(err){ console.warn(`R53: falló ${pistas[i].titulo}`); }
      }
      cacheBtn.classList.remove('busy');
      alert(`✅ ${ok}/${pistas.length} tracks descargados para offline.`);
    });
  }

  /* ---- Botones ---- */
  $('#r53Play').addEventListener('click',    () => P() && P().toggle());
  $('#r53Next').addEventListener('click',    () => P() && P().siguiente());
  $('#r53Prev').addEventListener('click',    () => P() && P().anterior());
  $('#r53Shuffle').addEventListener('click', e=>{
    const on = !!(P() && P().toggleShuffle());
    e.currentTarget.classList.toggle('active', on);
  });
  $('#r53Repeat').addEventListener('click', e=>{
    const on = !!(P() && P().toggleRepeat());
    e.currentTarget.classList.toggle('active', on);
  });
  const heartBtn = $('#r53Heart');
  if (heartBtn) heartBtn.addEventListener('click', e => e.currentTarget.classList.toggle('active'));
})();