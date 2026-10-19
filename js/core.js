// Núcleo puro de Relicario: sin DOM. Se usa en el navegador (window.RBCore) y en los tests de Node.
(function (root) {
  'use strict';

  const OBJECTIVES = {
    base: { label: 'Colección base', counts: 'Una copia de cada carta numerada de la colección (sin variantes de arte, overnumbers ni signature).' },
    foil: { label: 'Foil', counts: 'Una copia foil de cada versión foil que exista realmente.' },
    alt: { label: 'Artes alternativas', counts: 'Una copia de cada arte alternativo publicado en la colección.' },
    over: { label: 'Overnumbers y Signature', counts: 'Una copia de cada overnumber, signature y carta especial fuera de numeración.' },
    promo: { label: 'Promos', counts: 'Una copia de cada promo publicada en este grupo.' },
    master: { label: 'Master personalizado', counts: 'Una copia de cada versión de los tipos que elijas.' },
    champion: { label: 'Campeón favorito', counts: 'Una copia de cada versión publicada de ese campeón, en todas las colecciones.' },
    product: { label: 'Producto especial', counts: 'Una copia de cada carta incluida en el producto.' },
  };

  const KIND_LABEL = {
    base: 'Base', alt: 'Arte alternativo', overnumber: 'Overnumber', signature: 'Signature',
    special: 'Especial', promo: 'Promo', token: 'Token', rune: 'Runa',
  };

  const LANGS = { EN: 'Inglés', ES: 'Español', FR: 'Francés', DE: 'Alemán', IT: 'Italiano', PT: 'Portugués', ZH: 'Chino', OT: 'Otro' };
  const FINISHES = ['Normal', 'Foil', 'Metal'];
  const CONDITIONS = ['NM', 'EX', 'GD', 'PL', 'PO'];
  const PAGE_SIZES = [4, 9, 12];

  // ---------- Catálogo ----------
  function indexCatalog(cat) {
    if (cat._byId) return cat;
    Object.defineProperty(cat, '_byId', { value: new Map(cat.prints.map((p) => [p.id, p])) });
    Object.defineProperty(cat, '_col', { value: new Map(cat.collections.map((c) => [c.id, c])) });
    return cat;
  }
  const printOf = (cat, id) => indexCatalog(cat)._byId.get(id);
  const collectionOf = (cat, id) => indexCatalog(cat)._col.get(id);

  function objectivesFor(cat, setId) {
    const col = collectionOf(cat, setId);
    if (!col) return [];
    if (col.kind === 'promo') return ['promo', 'master'];
    if (col.kind === 'product' && !col.provisional) return ['product'];
    if (col.provisional) return ['base'];
    return ['base', 'foil', 'alt', 'over', 'master'];
  }

  function champions(cat) {
    const m = new Map();
    for (const p of cat.prints) {
      if (p.supertype !== 'Champion' && p.type !== 'Legend') continue;
      for (const t of p.tags) m.set(t, (m.get(t) || 0) + 1);
    }
    return [...m.entries()].filter(([, n]) => n >= 2).map(([name]) => name).sort((a, b) => a.localeCompare(b, 'es'));
  }

  // Devuelve la checklist que define los huecos del álbum. Una entrada = un hueco.
  function resolveChecklist(cat, album) {
    const o = album.objective;
    const meta = { label: OBJECTIVES[o]?.label || o, counts: OBJECTIVES[o]?.counts || '' };
    if (o === 'master') {
      const inc = album.include || { base: true, alt: true, overnumber: true, signature: true, special: true, promo: true, token: true, rune: true };
      const entries = cat.prints.filter((p) => p.set === album.set && inc[p.kind]).map((p) => p.id);
      const present = new Set(cat.prints.filter((p) => p.set === album.set).map((p) => p.kind));
      const kinds = Object.keys(inc).filter((k) => inc[k] && present.has(k)).map((k) => KIND_LABEL[k].toLowerCase());
      return { ...meta, entries, status: 'validado', version: cat.meta.version, source: cat.meta.source,
        counts: `Una copia de cada versión de tipo: ${kinds.join(', ') || 'ninguno'}.`, custom: true };
    }
    if (o === 'champion') {
      const ch = album.champion;
      const entries = ch ? cat.prints.filter((p) => p.tags.includes(ch) && p.kind !== 'token' && p.kind !== 'rune').map((p) => p.id) : [];
      return { ...meta, entries, status: ch ? 'validado' : 'provisional', version: cat.meta.version, source: cat.meta.source,
        counts: `Una copia de cada versión publicada con la etiqueta «${ch || '—'}», en todas las colecciones.`, custom: true };
    }
    const cl = cat.checklists.find((c) => c.set === album.set && c.objective === o);
    if (!cl) return { ...meta, entries: [], status: 'provisional', reason: 'Sin checklist publicada para este objetivo.', version: null, source: null };
    return { ...meta, entries: cl.entries.slice(), status: cl.status, reason: cl.reason, version: cl.version, source: cl.source, pending: cl.pending, id: cl.id };
  }

  // Orden manual: se respeta lo conocido y se añade al final lo nuevo; lo que ya no está en la checklist desaparece.
  function orderedEntries(entries, order) {
    if (!order || !order.length) return entries.slice();
    const set = new Set(entries);
    const seen = new Set();
    const out = [];
    for (const id of order) if (set.has(id) && !seen.has(id)) { out.push(id); seen.add(id); }
    for (const id of entries) if (!seen.has(id)) out.push(id);
    return out;
  }

  // páginas = techo(total / huecos por página); la última solo tiene los huecos necesarios.
  function paginate(total, pageSize) {
    if (!PAGE_SIZES.includes(pageSize)) throw new Error(`Tamaño de página no permitido: ${pageSize}`);
    const pages = Math.ceil(total / pageSize);
    const sizes = [];
    for (let i = 0; i < pages; i++) sizes.push(i < pages - 1 ? pageSize : total - pageSize * (pages - 1));
    return { pages, sizes, lastSize: sizes.length ? sizes[sizes.length - 1] : 0 };
  }

  function pageSlice(list, pageSize, pageIndex) {
    return list.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  }

  // ---------- Inventario ----------
  function emptyState() {
    return { v: 1, lots: [], wish: {}, albums: [], products: [], settings: { animate: 'auto', ghostArt: true, spread: true }, badges: {} };
  }

  function qty(state, printId, lang) {
    let n = 0;
    for (const l of state.lots) if (l.printId === printId && (!lang || lang === 'any' || l.lang === lang)) n += l.qty;
    return n;
  }
  function tradeQty(state, printId) {
    let n = 0;
    for (const l of state.lots) if (l.printId === printId) n += Math.min(l.trade || 0, l.qty);
    return n;
  }
  function ownedSet(state, lang) {
    const s = new Set();
    for (const l of state.lots) if (l.qty > 0 && (!lang || lang === 'any' || l.lang === lang)) s.add(l.printId);
    return s;
  }

  // Progreso: huecos llenos / huecos totales. Las repetidas no suman (cada hueco cuenta una vez).
  function progress(cat, state, album) {
    const cl = resolveChecklist(cat, album);
    const owned = ownedSet(state, album.lang);
    let filled = 0;
    for (const id of cl.entries) if (owned.has(id)) filled++;
    const total = cl.entries.length;
    return { total, filled, missing: total - filled, pct: total ? Math.floor((filled / total) * 1000) / 10 : 0,
      complete: total > 0 && filled === total, status: cl.status, checklist: cl };
  }

  function makeLot(printId, o = {}) {
    return { id: o.id || 'l' + Math.random().toString(36).slice(2, 10), printId, lang: o.lang || 'EN', finish: o.finish || 'Normal',
      condition: o.condition || 'NM', qty: o.qty ?? 1, trade: o.trade || 0, location: o.location || '', notes: o.notes || '' };
  }

  // Suma (o resta) en el lote que coincide con idioma/acabado; nunca crea huecos nuevos.
  function addQty(state, printId, delta, o = {}) {
    const lang = o.lang || 'EN'; const finish = o.finish || 'Normal';
    let lot = state.lots.find((l) => l.printId === printId && l.lang === lang && l.finish === finish);
    if (delta < 0 && !lot) lot = [...state.lots].reverse().find((l) => l.printId === printId && l.qty > 0);
    if (!lot) { if (delta <= 0) return state; lot = makeLot(printId, { lang, finish, qty: 0 }); state.lots.push(lot); }
    lot.qty = Math.max(0, lot.qty + delta);
    lot.trade = Math.min(lot.trade || 0, lot.qty);
    state.lots = state.lots.filter((l) => l.qty > 0 || l.location || l.notes);
    return state;
  }

  // ---------- Logros ----------
  const MAIN_SETS = (cat) => cat.collections.filter((c) => c.kind === 'main' && !c.provisional).map((c) => c.id);

  function basePct(cat, state, setId) {
    const cl = cat.checklists.find((c) => c.set === setId && c.objective === 'base');
    if (!cl || !cl.entries.length) return null;
    const owned = ownedSet(state);
    return cl.entries.filter((id) => owned.has(id)).length / cl.entries.length;
  }

  function hasFullPage(cat, state) {
    for (const a of state.albums) {
      const cl = resolveChecklist(cat, a);
      if (!cl.entries.length) continue;
      const list = orderedEntries(cl.entries, a.order);
      const owned = ownedSet(state, a.lang);
      const { pages } = paginate(list.length, a.pageSize);
      for (let i = 0; i < pages; i++) if (pageSlice(list, a.pageSize, i).every((id) => owned.has(id))) return true;
    }
    return false;
  }

  function computeAchievements(cat, state) {
    indexCatalog(cat);
    const owned = ownedSet(state);
    const distinct = owned.size;
    const ownedPrints = [...owned].map((id) => printOf(cat, id)).filter(Boolean);
    const bestBase = Math.max(0, ...MAIN_SETS(cat).map((s) => basePct(cat, state, s) || 0));
    const bestSet = MAIN_SETS(cat).map((s) => [s, basePct(cat, state, s) || 0]).sort((a, b) => b[1] - a[1])[0];
    const bestName = bestSet ? collectionOf(cat, bestSet[0]).name : '—';
    const pairs = cat.meta.diptychs || [];
    const provisional = (id) => { const c = collectionOf(cat, id); return !c || c.provisional; };
    const champAlbum = state.albums.find((a) => a.objective === 'champion' && a.champion);
    const champCustom = state.albums.find((a) => a.objective === 'champion' && a.champion && a.customized);

    const L = [];
    const add = (id, group, title, cond, cur, target, extra = {}) =>
      L.push({ id, group, title, cond, current: Math.min(cur, target), target, done: !extra.locked && cur >= target, ...extra });

    add('first-card', 'oficial', 'Primera carta', 'Registra una carta del catálogo.', distinct, 1, { icon: 'spark' });
    add('first-page', 'personal', 'Primera página organizada', 'Llena todos los huecos de una página de cualquier álbum.', hasFullPage(cat, state) ? 1 : 0, 1, { icon: 'page' });
    for (const n of [25, 100, 250]) add(`distinct-${n}`, 'oficial', `${n} cartas distintas`, `Ten ${n} versiones distintas registradas. Las repetidas no cuentan.`, distinct, n, { icon: 'stack' });
    for (const p of [25, 50, 75, 100]) add(`base-${p}`, 'oficial', `Colección base al ${p} %`, `Llega al ${p} % de la checklist base de una colección. Mejor actual: ${bestName}.`, Math.floor(bestBase * 100), p, { icon: p === 100 ? 'crown' : 'ring', unit: '%' });
    add('first-promo', 'oficial', 'Primera promo', 'Registra una carta de un grupo de promos.', ownedPrints.some((p) => p.kind === 'promo') ? 1 : 0, 1, { icon: 'star' });
    add('first-over', 'oficial', 'Primer Overnumber', 'Registra un overnumber o signature (numeración por encima del total).', ownedPrints.some((p) => p.kind === 'overnumber' || p.kind === 'signature') ? 1 : 0, 1, { icon: 'hash' });
    add('vendetta-diptych', 'oficial', 'Díptico de Vendetta reunido', 'Ten las dos mitades de un díptico de Vendetta.',
      pairs.some(([a, b]) => owned.has(a) && owned.has(b)) ? 1 : 0, 1,
      { icon: 'diptych', locked: !pairs.length, lockReason: pairs.length ? null : 'Catálogo provisional: la fuente aún no identifica los pares de dípticos.' });
    for (const [sid, name] of [['ARC', 'Arcane'], ['SGD', 'Secret Garden']]) {
      const pct = provisional(sid) ? 0 : (basePct(cat, state, sid) || 0) * 100;
      add(`complete-${sid}`, 'oficial', `Colección ${name} completada`, `Completa la checklist base de ${name}.`, Math.floor(pct), 100,
        { icon: 'crown', unit: '%', locked: provisional(sid), lockReason: provisional(sid) ? 'Catálogo provisional: sin checklist validada.' : null });
    }
    add('champion-album', 'personal', 'Colección de campeón personalizada', 'Crea un álbum de campeón favorito y personaliza su nombre, portada o colores.',
      (champAlbum ? 1 : 0) + (champCustom ? 1 : 0), 2, { icon: 'shield' });
    return L;
  }

  // ---------- CSV ----------
  const CSV_COLS = ['id_impresion', 'coleccion', 'numero', 'nombre', 'idioma', 'acabado', 'estado', 'cantidad', 'intercambio', 'ubicacion', 'notas', 'deseo'];

  function csvCell(v) {
    const s = v == null ? '' : String(v);
    return /[;",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCSV(cat, state) {
    indexCatalog(cat);
    const rows = [CSV_COLS.join(';')];
    const wishOnly = Object.keys(state.wish).filter((id) => state.wish[id] && !state.lots.some((l) => l.printId === id));
    for (const l of state.lots) {
      const p = printOf(cat, l.printId) || {};
      rows.push([l.printId, p.set, p.no, p.name, l.lang, l.finish, l.condition, l.qty, l.trade || 0, l.location, l.notes, state.wish[l.printId] ? 'si' : ''].map(csvCell).join(';'));
    }
    for (const id of wishOnly) {
      const p = printOf(cat, id) || {};
      rows.push([id, p.set, p.no, p.name, 'EN', 'Normal', 'NM', 0, 0, '', '', 'si'].map(csvCell).join(';'));
    }
    return '﻿' + rows.join('\r\n') + '\r\n';
  }

  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const firstLine = text.split(/\r?\n/, 1)[0] || '';
    const delim = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = []; let cell = ''; let q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  }

  // Valida antes de tocar el inventario. Devuelve filas aceptadas, errores y avisos con número de línea.
  function validateImport(cat, text) {
    indexCatalog(cat);
    const rows = parseCSV(text);
    const errors = []; const warnings = []; const ok = [];
    if (!rows.length) return { ok, errors: [{ line: 1, msg: 'El archivo está vacío.' }], warnings };
    const head = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name) => head.indexOf(name);
    if (col('id_impresion') < 0 && (col('coleccion') < 0 || col('numero') < 0)) {
      errors.push({ line: 1, msg: 'Falta la columna id_impresion (o coleccion + numero).' });
      return { ok, errors, warnings };
    }
    const get = (r, n) => (col(n) >= 0 ? (r[col(n)] || '').trim() : '');
    rows.slice(1).forEach((r, i) => {
      const line = i + 2;
      let id = get(r, 'id_impresion');
      let p = id && printOf(cat, id);
      if (!p && !id) {
        const set = get(r, 'coleccion').toUpperCase(); const no = get(r, 'numero');
        p = cat.prints.find((x) => x.set === set && (x.no === no || x.no === no.padStart(3, '0')));
      }
      if (!p) { errors.push({ line, msg: `Carta no encontrada en el catálogo: «${id || get(r, 'coleccion') + ' ' + get(r, 'numero')}».` }); return; }
      const qRaw = get(r, 'cantidad') || '0';
      if (!/^\d+$/.test(qRaw)) { errors.push({ line, msg: `Cantidad no válida: «${qRaw}». Debe ser un entero ≥ 0.` }); return; }
      const qn = parseInt(qRaw, 10);
      const tRaw = get(r, 'intercambio') || '0';
      if (!/^\d+$/.test(tRaw)) { errors.push({ line, msg: `Intercambio no válido: «${tRaw}».` }); return; }
      let tn = parseInt(tRaw, 10);
      if (tn > qn) { warnings.push({ line, msg: `Intercambio (${tn}) mayor que cantidad (${qn}); se ajusta a ${qn}.` }); tn = qn; }
      let lang = (get(r, 'idioma') || 'EN').toUpperCase();
      if (!LANGS[lang]) { warnings.push({ line, msg: `Idioma desconocido «${lang}»; se guarda como Otro.` }); lang = 'OT'; }
      let finish = get(r, 'acabado') || (p.finish || 'Normal');
      finish = FINISHES.find((f) => f.toLowerCase() === finish.toLowerCase()) || null;
      if (!finish) { warnings.push({ line, msg: 'Acabado desconocido; se guarda como Normal.' }); finish = p.finish || 'Normal'; }
      if (finish === 'Metal' && p.finish !== 'Metal') { warnings.push({ line, msg: 'Esta versión no existe en Metal según el catálogo; se guarda como Normal.' }); finish = 'Normal'; }
      if (p.finish === 'Metal' && finish !== 'Metal') finish = 'Metal';
      const condition = CONDITIONS.includes(get(r, 'estado').toUpperCase()) ? get(r, 'estado').toUpperCase() : 'NM';
      const wish = /^(si|sí|yes|1|x|true)$/i.test(get(r, 'deseo'));
      ok.push({ line, printId: p.id, lang, finish, condition, qty: qn, trade: tn, location: get(r, 'ubicacion'), notes: get(r, 'notas'), wish });
    });
    return { ok, errors, warnings };
  }

  // mode 'sumar': añade a lo existente · 'reemplazar': sustituye todo el inventario por el CSV.
  function applyImport(state, rows, mode) {
    if (mode === 'reemplazar') { state.lots = []; state.wish = {}; }
    for (const r of rows) {
      if (r.wish) state.wish[r.printId] = true;
      if (!r.qty && !r.location && !r.notes) continue;
      const lot = state.lots.find((l) => l.printId === r.printId && l.lang === r.lang && l.finish === r.finish && l.condition === r.condition);
      if (lot) { lot.qty += r.qty; lot.trade = Math.min(lot.qty, (lot.trade || 0) + r.trade); if (r.location) lot.location = r.location; if (r.notes) lot.notes = r.notes; }
      else state.lots.push(makeLot(r.printId, r));
    }
    return state;
  }

  const api = { OBJECTIVES, KIND_LABEL, LANGS, FINISHES, CONDITIONS, PAGE_SIZES, indexCatalog, printOf, collectionOf, objectivesFor, champions,
    resolveChecklist, orderedEntries, paginate, pageSlice, emptyState, qty, tradeQty, ownedSet, progress, makeLot, addQty,
    computeAchievements, toCSV, parseCSV, validateImport, applyImport, CSV_COLS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RBCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
