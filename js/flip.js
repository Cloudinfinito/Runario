// Runario — paso de página 3D. La hoja se divide en dos segmentos para simular la curvatura del papel.
// Solo existe la geometría «hacia delante»: pasar hacia atrás es la misma animación reproducida al revés.
(function (root) {
  'use strict';
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // o = { pageEl | (leftEl, rightEl), front, back, base | (baseLeft, baseRight), single, rigid, frontClass, backClass, start }
  function Flip(binder, o) {
    const target = o.single ? o.pageEl : o.rightEl;
    if (o.single) o.pageEl.innerHTML = o.base;
    else { o.leftEl.innerHTML = o.baseLeft; o.rightEl.innerHTML = o.baseRight; }
    const br = binder.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const W = r.width; const H = r.height; const h = W / 2;
    const place = (el, rect) => Object.assign(el.style, { left: `${rect.left - br.left}px`, top: `${rect.top - br.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });

    const face = (html, side, cls, off) =>
      `<div class="face ${side} ${cls || 'paper'}"><div class="face-in" style="width:${W}px;left:${off}px">${html}</div><i class="shade"></i><i class="gloss"></i></div>`;
    const leaf = document.createElement('div');
    leaf.className = `leaf3d${o.single ? ' single' : ''}${o.rigid ? ' rigid' : ''}`;
    place(leaf, r);
    leaf.innerHTML = `<div class="seg s1">${face(o.front, 'front', o.frontClass, 0)}${face(o.back, 'back', o.backClass, -h)}
      <div class="seg s2">${face(o.front, 'front', o.frontClass, -h)}${face(o.back, 'back', o.backClass, 0)}</div></div>`;
    const castR = document.createElement('i'); castR.className = 'cast cast-r'; place(castR, r);
    binder.append(castR, leaf);
    let castL = null;
    if (!o.single) { castL = document.createElement('i'); castL.className = 'cast cast-l'; place(castL, o.leftEl.getBoundingClientRect()); binder.insertBefore(castL, leaf); }
    binder.classList.add('is-flipping');

    const s1 = leaf.querySelector('.s1'); const s2 = leaf.querySelector('.s2');
    const fShade = leaf.querySelectorAll('.front > .shade'); const bShade = leaf.querySelectorAll('.back > .shade');
    const gloss = leaf.querySelectorAll('.s2 > .front > .gloss, .s1 > .front > .gloss');
    let cur = 0;

    function set(p) {
      cur = Math.max(0, Math.min(1, p));
      const bend = o.rigid ? 0 : -Math.sin(cur * Math.PI) * 28;
      s1.style.transform = `rotateY(${-180 * cur}deg)`;
      s2.style.transform = `rotateY(${bend}deg)`;
      fShade.forEach((e) => { e.style.opacity = (cur * 0.75).toFixed(3); });
      bShade.forEach((e) => { e.style.opacity = ((1 - cur) * 0.75).toFixed(3); });
      gloss.forEach((e) => { e.style.opacity = (Math.sin(cur * Math.PI) * 0.9).toFixed(3); });
      castR.style.opacity = cur > 0 ? ((1 - cur) * 0.7).toFixed(3) : 0;
      if (castL) castL.style.opacity = (Math.sin(cur * Math.PI) * 0.55).toFixed(3);
      if (o.single) leaf.style.opacity = cur > 0.55 ? Math.max(0, (1 - cur) / 0.45).toFixed(3) : 1;
    }
    function animateTo(p1, ms = 820) {
      return new Promise((done) => {
        const p0 = cur; const d = Math.abs(p1 - p0) * ms; const t0 = performance.now();
        if (d < 1) { set(p1); done(); return; }
        let finished = false;
        const finish = () => { if (finished) return; finished = true; set(p1); done(); };
        // Si el navegador congela requestAnimationFrame (pestaña oculta), se completa igualmente.
        const guard = setTimeout(finish, d + 400);
        const step = (t) => { if (finished) return; const k = Math.min(1, (t - t0) / d); set(p0 + (p1 - p0) * ease(k)); if (k < 1) requestAnimationFrame(step); else { clearTimeout(guard); finish(); } };
        requestAnimationFrame(step);
      });
    }
    function destroy() { leaf.remove(); castR.remove(); if (castL) castL.remove(); binder.classList.remove('is-flipping'); }
    set(o.start ?? 0);
    return { set, animateTo, destroy, get p() { return cur; }, width: W };
  }

  root.RBFlip = { Flip };
})(window);
