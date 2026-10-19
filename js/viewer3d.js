// Runario — cartas en 3D: inclinación con brillo en el álbum y visor 3D a pantalla completa.
// Las imágenes oficiales se muestran tal cual; el brillo es una capa encima, no altera la imagen.
(function (root) {
  'use strict';
  const A = root.RBArt;
  const reduced = () => document.documentElement.classList.contains('no-anim');

  // Inclinación al pasar el ratón por encima (delegada).
  function attachTilt(container, selector) {
    if (!matchMedia('(hover: hover)').matches) return;
    let el = null;
    const reset = (e) => { if (!e) return; e.classList.remove('tilting'); e.style.removeProperty('--rx'); e.style.removeProperty('--ry'); };
    container.addEventListener('pointermove', (ev) => {
      if (reduced() || ev.pointerType !== 'mouse') return;
      const t = ev.target.closest(selector);
      if (t !== el) { reset(el); el = t; }
      if (!el || el.closest('.is-flipping')) return;
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width; const y = (ev.clientY - r.top) / r.height;
      el.classList.add('tilting');
      el.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * 18}deg`);
      el.style.setProperty('--mx', `${x * 100}%`);
      el.style.setProperty('--my', `${y * 100}%`);
    });
    container.addEventListener('pointerleave', () => { reset(el); el = null; });
  }

  // cards: [{ img, name, landscape, holo, back }] (dos cartas = díptico)
  function openViewer(opts) {
    const prevFocus = document.activeElement;
    const cards = opts.cards;
    const v = document.createElement('div');
    v.className = 'v3d';
    v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', `Vista 3D: ${opts.title}`);
    const cardHTML = (c) => `<div class="v3d-card ${c.landscape ? 'land' : ''} ${c.holo ? 'holo' : ''}">
        <div class="v3d-face front"><img src="${c.img}" alt="${c.name.replace(/"/g, '&quot;')}" draggable="false"><i class="v3d-holo"></i><i class="v3d-glare"></i></div>
        ${[-2, -1, 0, 1, 2].map((z) => `<i class="v3d-edge" style="transform:translateZ(${z * 0.7}px)"></i>`).join('')}
        <div class="v3d-face back">${c.back || A.cardBack()}</div></div>`;
    v.innerHTML = `<div class="v3d-bg"></div>
      <header class="v3d-head"><div><div class="eyebrow">${opts.subtitle || 'Vista 3D'}</div><h2>${opts.title}</h2></div>
        <button class="iconbtn lg" data-x aria-label="Cerrar vista 3D">${A.glyph('close')}</button></header>
      <div class="v3d-stage"><div class="v3d-rig ${cards.length > 1 ? 'pair' : ''}">${cards.map(cardHTML).join('')}</div><div class="v3d-floor"></div></div>
      <footer class="v3d-foot">
        <button class="btn glass" data-act="flip">${A.glyph('flip')} Dar la vuelta</button>
        <button class="btn glass" data-act="auto" aria-pressed="false">${A.glyph('orbit')} Girar sola</button>
        <button class="btn glass" data-act="holo" aria-pressed="${cards.some((c) => c.holo)}">${A.glyph('holo')} Brillo foil</button>
        <button class="btn glass" data-act="reset">${A.glyph('astrolabe')} Centrar</button>
        <span class="v3d-hint">Arrastra para girar · rueda para acercar · F da la vuelta</span>
      </footer>`;
    document.body.appendChild(v);
    requestAnimationFrame(() => v.classList.add('open'));
    const rig = v.querySelector('.v3d-rig');
    const stage = v.querySelector('.v3d-stage');
    let rx = -6, ry = -18, vy = 0, z = 1, hx = 0, hy = 0, thx = 0, thy = 0, drag = null, auto = false, flipTo = null, alive = true;
    if (reduced()) ry = 0;

    const frame = () => {
      if (!alive) return;
      if (!drag) {
        if (flipTo !== null) { ry += (flipTo - ry) * (reduced() ? 1 : 0.12); if (Math.abs(flipTo - ry) < 0.3) { ry = flipTo; flipTo = null; } }
        else { ry += vy; vy *= 0.94; if (auto) ry += 0.4; }
        hx += (thx - hx) * 0.08; hy += (thy - hy) * 0.08;
      }
      const ty = ry + hy; const tx = Math.max(-40, Math.min(40, rx + hx));
      rig.style.transform = `scale(${z}) rotateX(${tx}deg) rotateY(${ty}deg)`;
      const rad = (ty * Math.PI) / 180;
      v.style.setProperty('--gx', `${50 - Math.sin(rad) * 70}%`);
      v.style.setProperty('--gy', `${40 - tx * 1.6}%`);
      v.style.setProperty('--hp', `${(ty * 1.6) % 400}%`);
      v.style.setProperty('--shadow-x', `${Math.sin(rad) * 30}px`);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, t: performance.now() }; try { stage.setPointerCapture(e.pointerId); } catch { /* puntero no capturable */ } vy = 0; flipTo = null; stage.classList.add('grabbing'); });
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      if (!drag) { thy = ((e.clientX - r.left) / r.width - 0.5) * 20; thx = (0.5 - (e.clientY - r.top) / r.height) * 14; return; }
      const dx = e.clientX - drag.x; const dy = e.clientY - drag.y; const dt = Math.max(1, performance.now() - drag.t);
      ry += dx * 0.45; rx = Math.max(-40, Math.min(40, rx - dy * 0.3)); vy = (dx * 0.45) / dt * 16;
      drag = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    const end = () => { drag = null; stage.classList.remove('grabbing'); };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    stage.addEventListener('pointerleave', () => { thx = 0; thy = 0; });
    stage.addEventListener('wheel', (e) => { e.preventDefault(); z = Math.max(0.7, Math.min(1.7, z - e.deltaY * 0.0012)); }, { passive: false });

    const act = (a) => {
      if (a === 'flip') flipTo = Math.round((ry + 180) / 180) * 180;
      if (a === 'auto') { auto = !auto; v.querySelector('[data-act="auto"]').setAttribute('aria-pressed', auto); }
      if (a === 'holo') { const b = v.querySelector('[data-act="holo"]'); const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); v.querySelectorAll('.v3d-card').forEach((c) => c.classList.toggle('holo', on)); }
      if (a === 'reset') { flipTo = Math.round(ry / 360) * 360; rx = 0; z = 1; vy = 0; }
    };
    v.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.act)));
    const close = () => {
      alive = false; v.classList.remove('open'); document.removeEventListener('keydown', onKey, true);
      setTimeout(() => v.remove(), reduced() ? 0 : 260);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      if (opts.onClose) opts.onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === 'ArrowLeft') vy -= 3; else if (e.key === 'ArrowRight') vy += 3;
      else if (e.key.toLowerCase() === 'f' && !e.ctrlKey) act('flip');
      else if (e.key === 'Tab') { const f = [...v.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    };
    document.addEventListener('keydown', onKey, true);
    v.querySelector('[data-x]').addEventListener('click', close);
    v.querySelector('[data-x]').focus();
    return { close };
  }

  root.RB3D = { attachTilt, openViewer };
})(window);
