// Runario — arte propio: glifos, emblemas de colección, medallas, avatares y reverso genérico.
// Todo dibujado para Runario; no reproduce logotipos ni iconografía oficial.
(function (root) {
  'use strict';
  let uid = 0;
  const id = (p) => `${p}${++uid}`;

  // ---------- Glifos (32×32). .b = cuerpo tenue, .l = trazo, .g = gema de acento ----------
  const STAR5 = 'M16 3l3.6 8.2 8.9.8-6.8 5.9 2 8.7L16 22l-7.7 4.6 2-8.7-6.8-5.9 8.9-.8z';
  const G = {
    library: '<path class="b" d="M5 7h6v20H5zM12 4h6v23h-6zM20.5 9.2l4.6-1.3 4.2 17.6-4.6 1.3z"/><path class="l" d="M5 7h6v20H5zM12 4h6v23h-6zM20.5 9.2l4.6-1.3 4.2 17.6-4.6 1.3zM5 11h6M5 23h6M12 8h6M12 23h6M3 27.5h26"/><circle class="g" cx="15" cy="15.5" r="1.8"/>',
    ledger: '<path class="b" d="M3 8.5c4-1.5 8.5-1.2 13 1.2 4.5-2.4 9-2.7 13-1.2V26c-4-1.5-8.5-1.2-13 1.2C11.5 24.8 7 24.5 3 26z"/><path class="l" d="M3 8.5c4-1.5 8.5-1.2 13 1.2 4.5-2.4 9-2.7 13-1.2V26c-4-1.5-8.5-1.2-13 1.2C11.5 24.8 7 24.5 3 26zM16 9.7v17.5M6.5 13.5c2.5-.6 4.8-.4 6.5.4M6.5 17.5c2.5-.6 4.8-.4 6.5.4M6.5 21.5c2.5-.6 4.8-.4 6.5.4M19 17.9c1.7-.8 4-1 6.5-.4"/><path class="g" d="M28.5 2.5c-4.2 1.2-7.3 4.4-8.8 9.3l1.7.5c2-3.6 4.5-6.6 7.1-9.8z"/>',
    showcase: '<path class="b" d="M6 29V13a10 10 0 0120 0v16z"/><path class="l" d="M6 29V13a10 10 0 0120 0v16zM4 29h24M9 24h14"/><circle class="l" cx="16" cy="14.5" r="4.4"/><path class="l" d="M13.4 18.2L12 22.5M18.6 18.2l1.4 4.3"/><path class="g" d="M16 11.6l.9 1.9 2.1.3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.4 2.1-.3z"/>',
    pack: '<path class="b" d="M8.5 4h15l-1.2 2.2 1.2 2.2v15.2l-1.2 2.2 1.2 2.2h-15l1.2-2.2-1.2-2.2V8.4l1.2-2.2z"/><path class="l" d="M8.5 4h15l-1.2 2.2 1.2 2.2v15.2l-1.2 2.2 1.2 2.2h-15l1.2-2.2-1.2-2.2V8.4l1.2-2.2zM8.5 8.4h15M8.5 23.6h15"/><circle class="g" cx="16" cy="16" r="3.8"/><path d="M14.4 16h3.2M16 14.4v3.2" stroke="#2b1c06" stroke-width="1.4" stroke-linecap="round"/>',
    crown: '<path class="b" d="M8 5l3.5 3L16 3l4.5 5L24 5l-1.5 8h-13z"/><path class="l" d="M8 5l3.5 3L16 3l4.5 5L24 5l-1.5 8h-13zM16 13v15M16 21h4.5M16 25.5h3.2"/><circle class="g" cx="16" cy="9" r="1.7"/>',
    seal: '<circle class="b" cx="16" cy="14" r="10"/><circle class="l" cx="16" cy="14" r="10" stroke-dasharray="2.2 1.7"/><circle class="l" cx="16" cy="14" r="6.4"/><path class="l" d="M12.9 14.2l2.2 2.2 4.3-4.7M10.5 22.4L8.5 30l3.8-1.7 2.4 2.7 1.1-6.4M21.5 22.4l2 7.6-3.8-1.7-2.4 2.7-1.1-6.4"/>',
    astrolabe: '<circle class="b" cx="16" cy="16" r="11"/><circle class="l" cx="16" cy="16" r="11"/><ellipse class="l" cx="16" cy="16" rx="11" ry="4.4" transform="rotate(-30 16 16)"/><path class="l" d="M16 2.5v3.5M16 26v3.5M2.5 16H6M26 16h3.5"/><circle class="g" cx="16" cy="16" r="2.5"/>',
    hourglass: '<path class="b" d="M10 5h12c0 5-3 7.5-6 11 3 3.5 6 6 6 11H10c0-5 3-7.5 6-11-3-3.5-6-6-6-11z"/><path class="l" d="M8 4.5h16M8 27.5h16M10 5c0 5 3 7.5 6 11-3 3.5-6 6-6 11M22 5c0 5-3 7.5-6 11 3 3.5 6 6 6 11"/><path class="g" d="M12.4 26.4c.6-2.5 2-3.9 3.6-5.1 1.6 1.2 3 2.6 3.6 5.1z"/>',
    profile: '<circle class="b" cx="16" cy="17" r="12"/><circle class="l" cx="16" cy="17" r="12"/><circle class="l" cx="16" cy="14" r="4.3"/><path class="l" d="M8.4 25.6c1.8-3.4 4.5-5 7.6-5s5.8 1.6 7.6 5"/><path class="g" d="M16 1.5l1.6 2.6L16 6.6l-1.6-2.5z"/>',
    add: '<path class="l" d="M16 4.5v23M4.5 16h23"/><path class="g" d="M16 11l5 5-5 5-5-5z"/>',
    search: '<circle class="b" cx="13.5" cy="13.5" r="8.5"/><circle class="l" cx="13.5" cy="13.5" r="8.5"/><path class="l" d="M19.8 19.8l7.4 7.4M9.4 11.6a4.6 4.6 0 013.6-3.1"/><circle class="g" cx="27.4" cy="27.4" r="1.8"/>',
    next: '<path class="l" d="M12 5.5L22.5 16 12 26.5"/><path class="l" d="M6.5 10.5L12 16l-5.5 5.5" opacity=".45"/><path class="g" d="M25.5 13.6l2.4 2.4-2.4 2.4-2.4-2.4z"/>',
    prev: '<path class="l" d="M20 5.5L9.5 16 20 26.5"/><path class="l" d="M25.5 10.5L20 16l5.5 5.5" opacity=".45"/><path class="g" d="M6.5 13.6L8.9 16l-2.4 2.4L4.1 16z"/>',
    close: '<path class="l" d="M8 8l16 16M24 8L8 24"/><path class="g" d="M16 13.4l2.6 2.6-2.6 2.6-2.6-2.6z"/>',
    missing: '<rect class="b" x="7" y="4" width="18" height="24" rx="2.4"/><rect class="l" x="7" y="4" width="18" height="24" rx="2.4" stroke-dasharray="3 2.4"/><path class="g" d="M16 10.5l1.7 3.4 3.7.5-2.7 2.6.7 3.7-3.4-1.8-3.4 1.8.7-3.7-2.7-2.6 3.7-.5z"/>',
    workshop: '<path class="b" d="M6 4h16a4 4 0 014 4v20H10a4 4 0 01-4-4z"/><path class="l" d="M6 4h16a4 4 0 014 4v20H10a4 4 0 01-4-4zM6 24a4 4 0 014-4h16"/><path class="g" d="M13 3h5.2v13l-2.6-2.1-2.6 2.1z"/>',
    card3d: '<path class="b" d="M11.5 6l10.5 2.6-2 17.4-10.5-2.6z"/><path class="l" d="M11.5 6l10.5 2.6-2 17.4-10.5-2.6z"/><path class="l" d="M3.5 18.5C2 14 9 10 16 10s15 2.5 13.5 7" opacity=".6"/><path class="g" d="M28.6 15.3l1.9 2.6-3 .9z"/>',
    wish: `<path class="b" d="${STAR5}"/><path class="l" d="${STAR5}"/><path class="g" d="M16 10l1.8 4 4.2.4-3.2 2.8 1 4.1L16 19l-3.8 2.3 1-4.1-3.2-2.8 4.2-.4z"/>`,
    trade: '<path class="l" d="M6.5 11.5h17l-4-4M25.5 20.5h-17l4 4"/><circle class="g" cx="6" cy="11.5" r="2.3"/><circle class="g" cx="26" cy="20.5" r="2.3"/>',
    pin: '<path class="b" d="M16 29s-9-8.5-9-15a9 9 0 0118 0c0 6.5-9 15-9 15z"/><path class="l" d="M16 29s-9-8.5-9-15a9 9 0 0118 0c0 6.5-9 15-9 15z"/><circle class="g" cx="16" cy="14" r="3.2"/>',
    letter: '<rect class="b" x="4" y="8" width="24" height="17" rx="2"/><rect class="l" x="4" y="8" width="24" height="17" rx="2"/><path class="l" d="M4.6 9.2L16 18l11.4-8.8"/><circle class="g" cx="16" cy="18.4" r="2.7"/>',
    export: '<path class="b" d="M7 4.5h13l5 5V28H7z"/><path class="l" d="M7 4.5h13l5 5V28H7zM20 4.5v5h5M16 23.5V14M12 18l4-4 4 4"/>',
    import: '<path class="b" d="M7 4.5h13l5 5V28H7z"/><path class="l" d="M7 4.5h13l5 5V28H7zM20 4.5v5h5M16 13v9.5M12 18.5l4 4 4-4"/>',
    lock: '<rect class="b" x="7" y="14" width="18" height="14" rx="2.6"/><rect class="l" x="7" y="14" width="18" height="14" rx="2.6"/><path class="l" d="M11 14v-4a5 5 0 0110 0v4M16 22.4v2.4"/><circle class="g" cx="16" cy="20.6" r="2.1"/>',
    share: '<circle class="g" cx="7" cy="16" r="2.7"/><circle class="g" cx="24.5" cy="7" r="2.7"/><circle class="g" cx="24.5" cy="25" r="2.7"/><path class="l" d="M9.4 14.7l12.7-6.4M9.4 17.3l12.7 6.4"/>',
    door: '<path class="b" d="M6 4h12v24H6z"/><path class="l" d="M6 4h12v24H6zM18 16h10M24 12l4 4-4 4"/><circle class="g" cx="14.4" cy="16" r="1.5"/>',
    sync: '<path class="l" d="M26 13A10.5 10.5 0 007 10M6 19a10.5 10.5 0 0019 3M7 5v5h5M25 27v-5h-5"/><circle class="g" cx="16" cy="16" r="2.7"/>',
    flip: '<rect class="b" x="10" y="4" width="12" height="18" rx="2"/><rect class="l" x="10" y="4" width="12" height="18" rx="2"/><path class="l" d="M4 19.5c1.5 5.5 6.5 8 12 8s10.5-2.5 12-8M24 23.5l4-4 1.6 5.2"/>',
    holo: '<path class="g" d="M14 3c1.1 6.4 4.3 9.6 10.7 10.7C18.3 14.8 15.1 18 14 24.4 12.9 18 9.7 14.8 3.3 13.7 9.7 12.6 12.9 9.4 14 3z"/><path class="g" d="M25 19.5c.6 2.8 1.7 3.9 4.5 4.5-2.8.6-3.9 1.7-4.5 4.5-.6-2.8-1.7-3.9-4.5-4.5 2.8-.6 3.9-1.7 4.5-4.5z" opacity=".65"/>',
    orbit: '<ellipse class="l" cx="16" cy="16" rx="12.5" ry="5.2"/><path class="g" d="M13 10.5v11l9-5.5z"/>',
    minus: '<path class="l" d="M7 16h18"/>',
    plus: '<path class="l" d="M16 7v18M7 16h18"/>',
    urn: '<path class="b" d="M9 9h14l-1.5 18h-11z"/><path class="l" d="M9 9h14l-1.5 18h-11zM6 9h20M13 5h6M13.5 13.5v9M18.5 13.5v9"/>',
    check: '<path class="l" d="M6 16.5l6.5 6.5L26 9"/>',
    pages: '<rect class="b" x="4" y="6" width="11" height="20" rx="1.5"/><rect class="b" x="17" y="6" width="11" height="20" rx="1.5"/><path class="l" d="M4 6h11v20H4zM17 6h11v20H17zM7 10h5v6H7zM20 10h5v6h-5z"/><circle class="g" cx="16" cy="28" r="1.4"/>',
    pocket: '<rect class="b" x="7" y="4" width="18" height="24" rx="2"/><path class="l" d="M7 4h18v24H7zM7 11h18"/><path class="g" d="M10 7.5h12v1.4H10z"/>',
    key: '<circle class="b" cx="11" cy="16" r="6"/><circle class="l" cx="11" cy="16" r="6"/><path class="l" d="M17 16h12M24 16v4M28 16v3"/><circle class="g" cx="11" cy="16" r="2"/>',
  };
  function glyph(name, cls = '') {
    return `<svg class="gl ${cls}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${G[name] || ''}</svg>`;
  }

  // ---------- Emblemas de colección (64×64, sólidos para poder estamparlos en foil) ----------
  const ring = 'M32 3a29 29 0 100 58 29 29 0 000-58zm0 3.6a25.4 25.4 0 110 50.8 25.4 25.4 0 010-50.8z';
  const dagger = '<path d="M30.4 5h3.2l1.6 29h-6.4zM23 34h18v3.4H23zM30 37.4h4V50h-4zM28.6 50h6.8L32 56z"/>';
  const E = {
    origins: `<path fill-rule="evenodd" d="${ring}"/><path d="M32 11l3.9 14.2L49 29l-13.1 3.8L32 47l-3.9-14.2L15 29l13.1-3.8z"/><path d="M32 19.5l2 6.6 6.4 2.9-6.4 2.9-2 6.6-2-6.6-6.4-2.9 6.4-2.9z" transform="rotate(45 32 29)"/><path d="M13 46.5c5.8-3.7 12.2-5.6 19-5.6s13.2 1.9 19 5.6l-1.6 2.4c-5.3-3.3-11.1-5-17.4-5s-12.1 1.7-17.4 5z"/>`,
    spiritforged: '<path d="M32 4c2.2 6.4 9.5 9.3 9.5 17.4a9.5 9.5 0 01-19 0c0-4.2 2.1-6.6 4.3-8.6 0 3.2 1.5 5.4 3.7 5.4-1.1-5.3 0-10.6 1.5-14.2z"/><path d="M8 34h38c0 4.2 3.2 6.3 9 6.3v4.5H38.5l-2.3 4.4h4.3V56H23.5v-6.8h4.3l-2.3-4.4H17.4C11.6 44.8 8 41.5 8 34z"/>',
    unleashed: '<path d="M12 6c8.5 10.5 12.6 23.4 12.6 42l-5.3-2.1C19.6 31.6 17.4 19 12 6z"/><path d="M25.4 4c7.4 11.6 10.6 25.3 9.5 44.2l-5.3-2.1c1-16.8-1-29.4-4.2-42.1z"/><path d="M38.6 6c6.4 11.6 8.5 24.3 6.4 42.2l-5.3-2.1c2.1-15.8 1-28.5-1.1-40.1z"/><path d="M50 28c4.6 6.4 6.6 13.9 5.4 23.2-3.2-5.3-6.4-8.4-9.6-9.4z"/>',
    vendetta: `<g transform="rotate(-36 32 32)">${dagger}</g><g transform="rotate(36 32 32)">${dagger}</g><circle cx="32" cy="32" r="3.4"/>`,
    radiance: '<path d="M5 11l10.5-4.3 4.3 9.6-10.5 4.3z"/><path d="M14.5 19.2l6.3-3.1 27 37.9H22.6z" opacity=".72"/><path d="M48 6l2.6 6.8 6.8 2.6-6.8 2.6L48 24.8l-2.6-6.8-6.8-2.6 6.8-2.6z"/><path d="M51 29v15.5a4.4 4.4 0 11-2.2-3.8V33.2l8.6-2.2v-3.4z"/>',
    arcane: '<path fill-rule="evenodd" d="M32 3l25 14.5v29L32 61 7 46.5v-29zm0 4.6L11 19.8v24.4L32 56.4l21-12.2V19.8z"/><path d="M24 18c4.3 6.4 7.4 10.6 7.4 15a7.4 7.4 0 01-14.8 0c0-4.4 3.1-8.6 7.4-15z"/><g transform="translate(41 33)"><circle r="6.4"/><g><rect x="-1.7" y="-10" width="3.4" height="4.6"/><rect x="-1.7" y="5.4" width="3.4" height="4.6"/><rect x="-10" y="-1.7" width="4.6" height="3.4"/><rect x="5.4" y="-1.7" width="4.6" height="3.4"/></g><g transform="rotate(45)"><rect x="-1.7" y="-10" width="3.4" height="4.6"/><rect x="-1.7" y="5.4" width="3.4" height="4.6"/><rect x="-10" y="-1.7" width="4.6" height="3.4"/><rect x="5.4" y="-1.7" width="4.6" height="3.4"/></g></g>',
    secretgarden: '<path d="M32 8c7.4 0 13 5.6 13 12.4S39.4 33 32 33s-13-5.8-13-12.6S24.6 8 32 8z"/><path d="M31 33h2.2v25H31z"/><path d="M33.2 45.5c6.4-6.4 12.8-6.4 17-4.2-4.2 5.3-10.6 7.4-17 4.2zM31 51.5c-6.4-6.4-12.8-6.4-17-4.2 4.2 5.3 10.6 7.4 17 4.2z"/>',
    t1: '<path fill-rule="evenodd" d="M32 3l23 7.4v17.8C55 44 45.6 55.6 32 61.5 18.4 55.6 9 44 9 28.2V10.4zm0 5.2L14 14v14.2c0 12.6 7.4 22 18 27.9 10.6-5.9 18-15.3 18-27.9V14z"/><path d="M20.5 19h23v5.6h-8.7V46h-5.6V24.6h-8.7z"/>',
    promo: '<path d="M32 4l4.4 6.6 7.8-1.6 1.6 7.8 6.6 4.4-4.4 6.6 4.4 6.6-6.6 4.4-1.6 7.8-7.8-1.6L32 50.6l-4.4-6.6-7.8 1.6-1.6-7.8-6.6-4.4 4.4-6.6-4.4-6.6 6.6-4.4 1.6-7.8 7.8 1.6z"/><path d="M22 46l-5 14 6-2.4 3.6 5 4-14.4zM42 46l5 14-6-2.4-3.6 5-4-14.4z"/>',
    neutral: '<path d="M32 3l23 29-23 29L9 32z" fill-rule="evenodd"/>',
  };
  const EMBLEM_CUT = { neutral: '<path d="M26 18v28M26 18h9a7 7 0 010 14h-9M33 32l9 14" stroke="#000" stroke-width="4.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' };
  function emblem(name, attrs = '') {
    return `<svg viewBox="0 0 64 64" ${attrs} aria-hidden="true"><g fill="currentColor">${E[name] || E.neutral}</g>${name === 'neutral' ? '<path d="M26 18v28M26 18h9a7 7 0 010 14h-9M33 32l9 14" stroke="var(--emb-cut,#14100a)" stroke-width="4.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ''}</svg>`;
  }
  // Para máscaras CSS (estampado foil): emblema sólido negro como data URI.
  function emblemMask(name) {
    let body = E[name] || E.neutral;
    if (name === 'neutral') body = `<mask id="m"><rect width="64" height="64" fill="#fff"/>${EMBLEM_CUT.neutral.replace('#000', '#000')}</mask><g mask="url(#m)">${E.neutral}</g>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="#000">${body}</g></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  // ---------- Foil ----------
  const FOILS = {
    oro: ['#7a5518', '#f7e3a1', '#b9862f', '#fff4c8', '#8f6520'],
    plata: ['#7f8894', '#f5f8fb', '#a3acb8', '#ffffff', '#8a939f'],
    cobre: ['#6e3418', '#f2b37c', '#a3552a', '#ffd6ad', '#7a3d1d'],
    rosa: ['#a8686e', '#ffe3df', '#c98a8f', '#fff2ef', '#b0727a'],
    rojo: ['#7a0012', '#ff5466', '#b3001b', '#ff98a3', '#86001a'],
    holo: ['#ff9ad5', '#9be7ff', '#b9ffb0', '#fff6a0', '#c8a2ff'],
  };
  const foilCSS = (f) => `linear-gradient(115deg, ${FOILS[f].map((c, i) => `${c} ${i * 25}%`).join(', ')})`;

  // ---------- Medallas ----------
  const TIER = { bronce: ['#5b3416', '#e3a66b', '#8a5126'], plata: ['#5d6570', '#f2f5f8', '#9aa3ad'], oro: ['#6b4a12', '#ffe8a3', '#c08c2c'], gema: ['#3b1a5c', '#e7c6ff', '#8b55c7'] };
  const MEDAL_SYM = {
    spark: '<path d="M50 30v10M50 60v10M30 50h10M60 50h10M36 36l6 6M58 58l6 6M36 64l6-6M58 42l6-6"/>',
    page: '<rect x="37" y="35" width="26" height="31" rx="2"/><path d="M41 40h8v9h-8zM51 40h8v9h-8zM41 52h8v9h-8zM51 52h8v9h-8z"/>',
    star: '<path d="M50 33l5 10.4 11.4 1.2-8.6 7.6 2.5 11.2L50 57.6l-10.3 5.8 2.5-11.2-8.6-7.6L45 43.4z"/>',
    hash: '<path d="M38 44h24M38 56h24M46 34l-4 32M58 34l-4 32"/>',
    diptych: '<rect x="33" y="36" width="15" height="28" rx="2"/><rect x="52" y="36" width="15" height="28" rx="2"/>',
    crown: '<path d="M34 42l8 7 8-13 8 13 8-7-3 20H37z"/>',
    rose: '<circle cx="50" cy="44" r="9"/><path d="M50 53v14M50 60c5-5 10-5 13-3-3 4-8 6-13 3z"/>',
    hex: '<path d="M50 32l15 8.7v17.6L50 67l-15-8.7V40.7z"/><circle cx="50" cy="50" r="5"/>',
    shield: '<path d="M50 32l14 4.5v11c0 9.5-5.7 16.5-14 20.5-8.3-4-14-11-14-20.5v-11z"/>',
  };
  function medal(b) {
    const tier = b.locked ? null : b.tier || 'bronce';
    const g = id('md');
    const [c0, c1, c2] = tier ? TIER[tier] : ['#2c2a28', '#5a5650', '#3a3734'];
    const sym = b.text ? `<text x="50" y="${b.text.length > 3 ? 56 : 58}" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="700" font-size="${b.text.length > 3 ? 17 : 22}" fill="${b.done ? '#2a1a05' : 'currentColor'}" stroke="none">${b.text}</text>`
      : `<g fill="none" stroke="${b.done ? '#2a1a05' : 'currentColor'}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${MEDAL_SYM[b.icon] || MEDAL_SYM.star}</g>`;
    const laurel = (side) => `<g transform="${side < 0 ? 'translate(100 0) scale(-1 1)' : ''}" fill="url(#${g})" opacity="${b.done ? 1 : .55}">${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${17 + i * 1.4}" cy="${70 - i * 10}" rx="3.2" ry="7" transform="rotate(${-30 + i * 9} ${17 + i * 1.4} ${70 - i * 10})"/>`).join('')}</g>`;
    return `<svg viewBox="0 0 100 100" class="medal ${b.done ? 'is-done' : ''} ${b.locked ? 'is-locked' : ''}" aria-hidden="true">
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".45" stop-color="${c2}"/><stop offset=".7" stop-color="${c1}"/><stop offset="1" stop-color="${c0}"/></linearGradient>
      <radialGradient id="${g}r" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${c1}"/><stop offset=".6" stop-color="${c2}"/><stop offset="1" stop-color="${c0}"/></radialGradient></defs>
      ${laurel(1)}${laurel(-1)}
      ${b.done ? `<path d="M38 78l-6 18 9-4 5 6 4-18zM62 78l6 18-9-4-5 6-4-18z" fill="${b.ribbon || '#8e1f2e'}"/>` : ''}
      <circle cx="50" cy="50" r="27" fill="${b.done ? `url(#${g}r)` : 'var(--medal-off, #1d1b19)'}" stroke="url(#${g})" stroke-width="3"/>
      <circle cx="50" cy="50" r="22" fill="none" stroke="${b.done ? c0 : c2}" stroke-opacity=".5" stroke-width="1" stroke-dasharray="${b.done ? '0' : '2 3'}"/>
      ${b.locked ? `<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="41" y="48" width="18" height="14" rx="2.5"/><path d="M44 48v-4a6 6 0 0112 0v4"/></g>` : sym}
    </svg>`;
  }

  // ---------- Avatares ----------
  const AVATARS = [
    { id: 'estrella', name: 'Estrella naciente', emblem: 'origins', bg: ['#22417f', '#0b1631'], fg: '#ecc76a' },
    { id: 'forja', name: 'Forjadora', emblem: 'spiritforged', bg: ['#8a4826', '#2a1b14'], fg: '#ffcf9e' },
    { id: 'garra', name: 'Bestia', emblem: 'unleashed', bg: ['#2f6b35', '#0e2a1c'], fg: '#d4ef7a' },
    { id: 'duelo', name: 'Duelista', emblem: 'vendetta', bg: ['#8a1a30', '#170c12'], fg: '#f0cb85' },
    { id: 'foco', name: 'Estrella del escenario', emblem: 'radiance', bg: ['#b53379', '#251046'], fg: '#ffe08a' },
    { id: 'engranaje', name: 'Inventora', emblem: 'arcane', bg: ['#1c5a55', '#0d2422'], fg: '#ffd27a' },
    { id: 'rosa', name: 'Jardinera', emblem: 'secretgarden', bg: ['#9dbb8e', '#4e6d5b'], fg: '#fff1ee' },
    { id: 'escudo', name: 'Capitán', emblem: 't1', bg: ['#26262a', '#050506'], fg: '#ff3b55' },
    { id: 'roseta', name: 'Coleccionista', emblem: 'promo', bg: ['#4c5180', '#1d1f33'], fg: '#e2e5ff' },
    { id: 'runa', name: 'Archivera', emblem: 'neutral', bg: ['#5a4129', '#21170f'], fg: '#f0d29a' },
    { id: 'aurora', name: 'Aurora', emblem: 'origins', bg: ['#4b2a7a', '#130b26'], fg: '#a8f0ff' },
    { id: 'brasa', name: 'Brasa', emblem: 'spiritforged', bg: ['#2b2b30', '#0c0c0e'], fg: '#ff9a4d' },
  ];
  function avatar(avId, size = 44) {
    const a = AVATARS.find((x) => x.id === avId) || AVATARS[0];
    const g = id('av');
    return `<svg class="avatar" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="${g}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${a.bg[0]}"/><stop offset="1" stop-color="${a.bg[1]}"/></radialGradient></defs>
      <circle cx="32" cy="32" r="31" fill="url(#${g})"/><circle cx="32" cy="32" r="29" fill="none" stroke="${a.fg}" stroke-opacity=".55" stroke-width="1"/>
      <g transform="translate(14 14) scale(.5625)" fill="${a.fg}" style="--emb-cut:${a.bg[1]}">${E[a.emblem]}${a.emblem === 'neutral' ? `<path d="M26 18v28M26 18h9a7 7 0 010 14h-9M33 32l9 14" stroke="${a.bg[1]}" stroke-width="4.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ''}</g></svg>`;
  }

  // ---------- Logotipo y reverso ----------
  function logo(size = 34) {
    const g = id('lg');
    return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e3a1"/><stop offset=".5" stop-color="#b9862f"/><stop offset="1" stop-color="#fff0c0"/></linearGradient></defs>
      <path d="M20 1.5L37 20 20 38.5 3 20z" fill="url(#${g})"/><path d="M20 5L33.6 20 20 35 6.4 20z" fill="#16120c"/>
      <path d="M16 12v16M16 12h5a4.5 4.5 0 010 9h-5M20 21l5.5 7" fill="none" stroke="url(#${g})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  // Reverso de Riftbound reproducido según las cartas impresas: azul (mazo principal), negro (Leyendas y
  // Campos de batalla) y blanco (Runas), con marco dorado, rombos, arcos y el logotipo oficial de League of Legends.
  function cardBack(variant = 'main') {
    const V = {
      main: { bg: ['#16305a', '#0b1a33'], line: '#d6ae62', logo: 'gold' },
      legend: { bg: ['#1a1a1c', '#060607'], line: '#d6ae62', logo: 'gold' },
      rune: { bg: ['#f7f6f1', '#e4e2da'], line: '#1f3f73', logo: 'navy' },
    }[variant] || {};
    const g = id('rb');
    const logo = (root.RB_ASSETS && root.RB_ASSETS.lolLogo) || '';
    const spark = (x, y, s) => `<path d="M${x} ${y - s}L${x + s * .28} ${y - s * .28}L${x + s} ${y}L${x + s * .28} ${y + s * .28}L${x} ${y + s}L${x - s * .28} ${y + s * .28}L${x - s} ${y}L${x - s * .28} ${y - s * .28}Z" fill="${V.line}"/>`;
    const arc = (r, a0, a1) => { const p = (a) => [372 + r * Math.cos((a * Math.PI) / 180), 519 + r * Math.sin((a * Math.PI) / 180)]; const [x0, y0] = p(a0); const [x1, y1] = p(a1); return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${V.line}" stroke-width="3.2"/>`; };
    const corner = '<path d="M60 112V76a16 16 0 0116-16h36" fill="none" stroke-width="2.4"/>';
    return `<svg viewBox="0 0 744 1039" class="cardback cardback-${variant}" aria-hidden="true"><defs>
      <radialGradient id="${g}" cx=".5" cy=".42" r=".8"><stop offset="0" stop-color="${V.bg[0]}"/><stop offset="1" stop-color="${V.bg[1]}"/></radialGradient>
      <filter id="${g}n"><feColorMatrix type="matrix" values="0 0 0 0 .12  0 0 0 0 .25  0 0 0 0 .45  0 0 0 1 0"/></filter></defs>
      <rect width="744" height="1039" rx="36" fill="url(#${g})"/>
      <rect x="34" y="34" width="676" height="971" rx="24" fill="none" stroke="${V.line}" stroke-width="4"/>
      <rect x="50" y="50" width="644" height="939" rx="14" fill="none" stroke="${V.line}" stroke-opacity=".45" stroke-width="1.5"/>
      <g stroke="${V.line}">${corner}<g transform="translate(744 0) scale(-1 1)">${corner}</g><g transform="translate(0 1039) scale(1 -1)">${corner}</g><g transform="translate(744 1039) scale(-1 -1)">${corner}</g></g>
      ${arc(282, 118, 242)}${arc(282, -62, 62)}${arc(258, 132, 228)}${arc(258, -48, 48)}
      <path d="M372 286L605 519 372 752 139 519Z" fill="none" stroke="${V.line}" stroke-width="3.2"/>
      <path d="M372 318L573 519 372 720 171 519Z" fill="none" stroke="${V.line}" stroke-opacity=".5" stroke-width="1.5"/>
      <path d="M108 519L176 444H568L636 519 568 594H176Z" fill="${V.bg[0]}" stroke="${V.line}" stroke-width="3.2"/>
      ${spark(372, 168, 30)}${spark(372, 871, 30)}${spark(372, 286, 12)}${spark(372, 752, 12)}
      <image href="${logo}" x="168" y="446" width="408" height="146" preserveAspectRatio="xMidYMid meet" ${V.logo === 'navy' ? `filter="url(#${g}n)"` : ''}/></svg>`;
  }
  const backVariant = (p) => (p && /Legend|Battlefield/i.test(p.type || '') ? 'legend' : p && /Rune/i.test(p.type || '') ? 'rune' : 'main');

  // Medallas con los emblemas de clasificatoria de League of Legends.
  const RANK_ES = { iron: 'Hierro', bronze: 'Bronce', silver: 'Plata', gold: 'Oro', platinum: 'Platino', emerald: 'Esmeralda', diamond: 'Diamante', master: 'Maestro', grandmaster: 'Gran Maestro', challenger: 'Aspirante' };
  function rankMedal(tier, o = {}) {
    const A2 = root.RB_ASSETS; const src = A2 ? A2.ranked[tier] : '';
    return `<span class="rk ${o.done ? 'is-done' : ''} ${o.locked ? 'is-locked' : ''} ${o.cls || ''}" title="${RANK_ES[tier] || ''}"><img src="${src}" alt="" loading="lazy" decoding="async">${o.label ? `<b>${o.label}</b>` : ''}${o.icon ? `<img class="rk-ico" src="${o.icon}" alt="">` : ''}</span>`;
  }
  function champIcon(champId, size = 44, cls = '') {
    const A2 = root.RB_ASSETS;
    return `<img class="champ-ico ${cls}" src="${A2 ? A2.dd.square : ''}${champId || 'Jinx'}.png" width="${size}" height="${size}" alt="" loading="lazy">`;
  }

  // Reverso propio anterior (se conserva para la contraportada del álbum).
  function cardBackRunario() {
    const g = id('cb');
    const dots = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return `<circle cx="${372 + Math.cos(a) * 205}" cy="${520 + Math.sin(a) * 205}" r="${i % 3 ? 4 : 8}"/>`; }).join('');
    return `<svg viewBox="0 0 744 1039" class="cardback" aria-hidden="true"><defs>
      <radialGradient id="${g}" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#2a3a68"/><stop offset=".6" stop-color="#121a33"/><stop offset="1" stop-color="#070a14"/></radialGradient>
      <linearGradient id="${g}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e3a1"/><stop offset=".5" stop-color="#a87828"/><stop offset="1" stop-color="#fff0c0"/></linearGradient>
      <pattern id="${g}p" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 18h36M18 0v36" stroke="#ffffff" stroke-opacity=".035" stroke-width="2"/></pattern></defs>
      <rect width="744" height="1039" rx="34" fill="url(#${g})"/><rect width="744" height="1039" rx="34" fill="url(#${g}p)"/>
      <rect x="26" y="26" width="692" height="987" rx="22" fill="none" stroke="url(#${g}f)" stroke-width="5"/>
      <rect x="44" y="44" width="656" height="951" rx="14" fill="none" stroke="url(#${g}f)" stroke-opacity=".5" stroke-width="2"/>
      <g fill="url(#${g}f)" opacity=".75">${dots}</g>
      <circle cx="372" cy="520" r="170" fill="none" stroke="url(#${g}f)" stroke-width="3"/>
      <path d="M372 365l140 155-140 155-140-155z" fill="url(#${g}f)"/><path d="M372 392l116 128-116 128-116-128z" fill="#0d1326"/>
      <path d="M342 455v130M342 455h42a37 37 0 010 74h-42M380 529l45 56" fill="none" stroke="url(#${g}f)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="372" y="905" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="700" font-size="56" letter-spacing="18" fill="url(#${g}f)">RUNARIO</text></svg>`;
  }

  root.RBArt = { glyph, emblem, emblemMask, FOILS, foilCSS, medal, AVATARS, avatar, logo, cardBack, cardBackRunario, backVariant, rankMedal, RANK_ES, champIcon, EMBLEMS: Object.keys(E) };
})(window);
