// Runario — interfaz. La lógica de huecos, progreso y logros vive en core.js; el arte en art.js.
(() => {
  'use strict';
  const C = window.RBCore;
  const A = window.RBArt;
  const CAT = C.indexCatalog(window.RB_CATALOG);
  const gl = A.glyph;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const P = (id) => C.printOf(CAT, id);
  const COL = (id) => C.collectionOf(CAT, id);
  const fmtPct = (n) => `${(Number.isInteger(n) ? n : n.toFixed(1)).toString().replace('.', ',')} %`;
  const today = () => new Date().toISOString().slice(0, 10);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Encuadernación ----------
  const PRESETS = {
    origins: { label: 'Origins', note: 'Azul profundo y oro', material: 'cuero', color: '#15295a', foil: 'oro', emblem: 'origins', paper: 'marfil', sleeves: 'cristal', ribbon: '#c9a043', amb: '#2a4a9a', window: 'carta' },
    spiritforged: { label: 'Spiritforged', note: 'Cobre, metal y forja', material: 'metal', color: '#6b3a22', foil: 'cobre', emblem: 'spiritforged', paper: 'pizarra', sleeves: 'mate', ribbon: '#e08a4a', amb: '#8a4a25', window: 'carta' },
    unleashed: { label: 'Unleashed', note: 'Selva y monstruos', material: 'escamas', color: '#1d4a2a', foil: 'oro', emblem: 'unleashed', paper: 'pergamino', sleeves: 'cristal', ribbon: '#9cc43c', amb: '#2f6b35', window: 'carta' },
    vendetta: { label: 'Vendetta', note: 'Rivalidades y dípticos', material: 'cuero', color: '#5c0f1e', foil: 'oro', emblem: 'vendetta', paper: 'noche', sleeves: 'cristal', ribbon: '#e6c27a', amb: '#7a1a2c', window: 'carta' },
    radiance: { label: 'Radiance', note: 'Escenarios y música', material: 'terciopelo', color: '#45186b', foil: 'holo', emblem: 'radiance', paper: 'noche', sleeves: 'cristal', ribbon: '#ff6fb5', amb: '#6f2a8a', window: 'emblema' },
    arcane: { label: 'Arcane', note: 'Piltover contra Zaun', material: 'metal', color: '#1b4945', foil: 'cobre', emblem: 'arcane', paper: 'marfil', sleeves: 'mate', ribbon: '#d43aa0', amb: '#1c5a55', window: 'emblema' },
    secretgarden: { label: 'Secret Garden', note: 'Vegetación y tonos suaves', material: 'lino', color: '#7f9e7a', foil: 'rosa', emblem: 'secretgarden', paper: 'marfil', sleeves: 'mate', ribbon: '#f2b8c0', amb: '#5f8a64', window: 'emblema' },
    t1: { label: 'T1', note: 'Negro, rojo y jugadores', material: 'lacado', color: '#0e0e10', foil: 'rojo', emblem: 't1', paper: 'noche', sleeves: 'cristal', ribbon: '#e2012d', amb: '#6a0b18', window: 'emblema' },
    promo: { label: 'Promos', note: 'Plata y terciopelo', material: 'terciopelo', color: '#363a5e', foil: 'plata', emblem: 'promo', paper: 'pizarra', sleeves: 'cristal', ribbon: '#c8cdf0', amb: '#3b3f63', window: 'carta' },
    neutral: { label: 'Archivo', note: 'Cuero de biblioteca', material: 'cuero', color: '#4a3322', foil: 'oro', emblem: 'neutral', paper: 'marfil', sleeves: 'cristal', ribbon: '#8e1f2e', amb: '#5a4129', window: 'carta' },
  };
  const MATERIALS = { cuero: 'Cuero', terciopelo: 'Terciopelo', metal: 'Metal cepillado', lino: 'Lino', escamas: 'Escamas', lacado: 'Lacado' };
  const FOIL_NAMES = { oro: 'Oro', plata: 'Plata', cobre: 'Cobre', rosa: 'Oro rosa', rojo: 'Rubí', holo: 'Holográfico' };
  const PAPERS = { marfil: ['Marfil', '#f3ead8'], pergamino: ['Pergamino', '#eadab4'], noche: ['Noche', '#17181f'], pizarra: ['Pizarra', '#2b2f35'] };
  const SLEEVES = { cristal: 'Funda cristal', mate: 'Funda mate', ninguna: 'Sin funda' };
  const COLORS = ['#15295a', '#0b1631', '#5c0f1e', '#2a0d14', '#6b3a22', '#1d4a2a', '#45186b', '#1b4945', '#7f9e7a', '#0e0e10', '#363a5e', '#4a3322', '#8a6a44', '#2b2f35', '#c9b48a', '#f0e6d2'];
  const RIBBONS = ['#8e1f2e', '#c9a043', '#e08a4a', '#9cc43c', '#e6c27a', '#ff6fb5', '#d43aa0', '#f2b8c0', '#e2012d', '#3d7ad1', '#f4ecdc', '#1b1b1b'];
  const EMBLEM_NAMES = { origins: 'Estrella', spiritforged: 'Yunque', unleashed: 'Garras', vendetta: 'Dagas', radiance: 'Foco', arcane: 'Engranaje', secretgarden: 'Rosa', t1: 'Escudo', promo: 'Roseta', neutral: 'Runa' };
  for (const k of ['origins', 'spiritforged', 'unleashed', 'vendetta', 'radiance', 'promo', 't1', 'secretgarden']) { PRESETS[k].window = 'arte'; PRESETS[k].pageArt = true; }
  PRESETS.arcane.pageArt = false; PRESETS.neutral.pageArt = false;
  const design = (a) => {
    const d = { ...(PRESETS[a.theme] || PRESETS.neutral), ...(a.design || {}) };
    if (d.window === 'arte' && !albumArt(a, { ...d, window: 'arte' })) d.window = 'carta';
    return d;
  };
  const vars = (d) => `--mat:${d.color};--foil:${A.foilCSS(d.foil)};--emb:${A.emblemMask(d.emblem)};--ribbon:${d.ribbon};--amb:${d.amb}`;
  const isHolo = (p) => ['alt', 'overnumber', 'signature', 'special'].includes(p.kind) || ['Showcase', 'Epic'].includes(p.rarity) || p.finish === 'Metal';

  // ---------- Recursos oficiales (Riot Games) ----------
  const AS = window.RB_ASSETS;
  const setInfo = (setId) => (AS.sets[setId] || {});
  const EMOTES = AS.emotes;
  const emoteById = (id) => EMOTES.find((e) => String(e.id) === String(id)) || EMOTES[0];
  const randEmote = () => EMOTES[Math.floor(Math.random() * EMOTES.length)];
  const emoteImg = (e, cls = '') => (e ? `<img class="${cls}" src="${esc(e.url)}" alt="" loading="lazy" decoding="async">` : '');
  const splash = (champ) => `${AS.dd.splash}${champ}_0.jpg`;
  const champById = (id) => AS.champions.find((c) => c.id === id);
  const champForTag = (tag) => { const n = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, ''); return AS.champions.find((c) => n(c.name) === n(tag || '')); };
  const DOMAIN_ES = { fury: 'Furia', calm: 'Calma', mind: 'Mente', body: 'Cuerpo', chaos: 'Caos', order: 'Orden' };
  const domainIcon = (d, cls = '') => { const k = String(d || '').toLowerCase(); return AS.icons.domain[k] ? `<img class="${cls}" src="${AS.icons.domain[k]}" alt="${esc(DOMAIN_ES[k] || d)}" title="${esc(DOMAIN_ES[k] || d)}" loading="lazy">` : ''; };
  const rarityIcon = (r) => { const k = String(r || '').toLowerCase(); return AS.icons.rarity[k] ? `<img class="rar" src="${AS.icons.rarity[k]}" alt="${esc(r)}" title="${esc(r)}" loading="lazy">` : ''; };
  const rbIcon = (k, cls = 'rbi') => `<img class="${cls}" src="${AS.icons.type[k] || AS.icons.rarity[k]}" alt="" loading="lazy">`;
  const RANKS = [['iron', 0], ['bronze', 25], ['silver', 75], ['gold', 150], ['platinum', 300], ['emerald', 500], ['diamond', 750], ['master', 1000], ['grandmaster', 1200], ['challenger', 1400]];
  const collectorRank = (distinct) => { let r = RANKS[0]; for (const x of RANKS) if (distinct >= x[1]) r = x; const i = RANKS.indexOf(r); return { tier: r[0], name: A.RANK_ES[r[0]], next: RANKS[i + 1] || null }; };
  const albumArt = (a, d) => (d.window === 'campeon' && d.artChamp ? splash(d.artChamp) : a.objective === 'champion' ? (champForTag(a.champion) ? splash(champForTag(a.champion).id) : null) : setInfo(a.set).art);
  // ---------- Precios (TCGplayer, precio medio de mercado) ----------
  const PR = window.RB_PRICES || { prints: {}, products: {}, fx: {} };
  const currency = () => (state.settings.currency === 'USD' || !PR.fx.usdEur ? 'USD' : 'EUR');
  const priceUSD = (p, finish) => { const v = p && PR.prints[p.id]; if (!v) return null; return finish === 'Foil' || finish === 'Metal' ? (v[1] ?? v[0]) : (v[0] ?? v[1]); };
  const money = (usd, compact) => { if (usd == null) return '—'; const eur = currency() === 'EUR'; const v = eur ? usd * PR.fx.usdEur : usd;
    return v.toLocaleString('es-ES', { style: 'currency', currency: eur ? 'EUR' : 'USD', maximumFractionDigits: compact && v >= 100 ? 0 : 2 }); };
  const lotsValue = (st, pred = () => true) => st.lots.reduce((n, l) => (pred(l.printId) ? n + l.qty * (priceUSD(P(l.printId), l.finish) || 0) : n), 0);
  const priceNote = () => `Precio medio de mercado de TCGplayer (${PR.fetchedAt || '—'})${currency() === 'EUR' ? ` convertido a euros con el cambio del BCE (${PR.fx.date})` : ''}. Orientativo.`;
  const defaultProfile = () => ({ champ: 'Jinx', banner: 'Jinx', emote: EMOTES[0] && EMOTES[0].id, showcase: [] });

  // ---------- Sesión y persistencia ----------
  const GUEST_KEY = 'runario.guest'; const MODE_KEY = 'runario.mode';
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }, del: (k) => { try { localStorage.removeItem(k); } catch { /* */ } } };
  const S = { user: null, mode: null, rev: 0, sync: 'guest', server: true, timer: null, pushing: false, again: false };
  let state = C.emptyState();
  let viewing = null; // colección pública que se está visitando (solo lectura)
  const undoStack = [];
  const ui = { pos: {}, manage: { q: '', set: '', kind: '', status: '', rarity: '', page: 0, sel: new Set(), album: '' }, drawer: null, showMissing: false, openAnim: null, justAdded: null, celebrate: null, flipping: false };

  function newAlbum(o) {
    const col = COL(o.set);
    const name = o.name || (o.objective === 'champion' ? o.champion : `${col ? col.name : o.set}${o.objective !== 'base' ? ` · ${C.OBJECTIVES[o.objective].label}` : ''}`);
    return { id: 'a' + Math.random().toString(36).slice(2, 9), name, set: o.set || null, objective: o.objective, champion: o.champion || null, include: o.include || null,
      lang: o.lang || 'any', pageSize: o.pageSize || 9, theme: o.theme || (col ? col.theme : 'neutral'), design: null, cover: null, featured: [], order: [], pairs: [], customized: false, createdAt: today() };
  }
  function seedState() {
    const s = C.emptyState();
    s.albums.push(newAlbum({ set: 'OGN', objective: 'base', pageSize: 9 }), newAlbum({ set: 'OGS', objective: 'product', pageSize: 12, name: 'Proving Grounds' }), newAlbum({ set: 'VEN', objective: 'base', pageSize: 9 }));
    return s;
  }
  function normalize(s) {
    const e = C.emptyState();
    const n = { ...e, ...s, settings: { ...e.settings, ...(s && s.settings) } };
    n.albums.forEach((a) => { a.featured = a.featured || []; a.order = a.order || []; a.pairs = a.pairs || []; if (!PRESETS[a.theme]) a.theme = 'neutral'; });
    n.badges = n.badges || {};
    n.decks = n.decks || [];
    return n;
  }
  async function api(method, path, body) {
    const r = await fetch(path, { method, credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    let data = {}; try { data = await r.json(); } catch { /* sin cuerpo */ }
    return { ok: r.ok, status: r.status, data };
  }
  async function loadRemote() {
    const r = await api('GET', '/api/collection');
    if (r.ok) {
      S.rev = r.data.rev;
      state = r.data.state ? normalize(r.data.state) : seedState();
      if (!r.data.state) await pushNow();
    } else {
      const c = ls.get(`runario.cache.${S.user.username}`);
      state = c ? normalize(JSON.parse(c)) : seedState();
    }
    S.mode = 'user'; S.sync = 'ok';
  }
  function startGuest() {
    S.mode = 'guest'; S.sync = 'guest';
    const g = ls.get(GUEST_KEY);
    try { state = g ? normalize(JSON.parse(g)) : seedState(); } catch { state = seedState(); }
    ls.set(MODE_KEY, 'guest');
  }
  function save() {
    if (S.mode === 'guest') ls.set(GUEST_KEY, JSON.stringify(state));
    else if (S.mode === 'user') { ls.set(`runario.cache.${S.user.username}`, JSON.stringify(state)); S.sync = 'saving'; renderSync(); clearTimeout(S.timer); S.timer = setTimeout(pushNow, 700); }
  }
  async function pushNow(force) {
    if (S.mode !== 'user') return;
    if (S.pushing) { S.again = true; return; }
    S.pushing = true;
    try {
      const r = await api('PUT', '/api/collection', { rev: S.rev, state, force: !!force });
      if (r.ok) { S.rev = r.data.rev; S.sync = 'ok'; }
      else if (r.status === 409) { S.sync = 'conflict'; openConflict(r.data); }
      else if (r.status === 401) { S.sync = 'offline'; toast('Tu sesión ha caducado. Vuelve a entrar para guardar en tu cuenta.'); }
      else S.sync = 'offline';
    } catch { S.sync = 'offline'; }
    S.pushing = false; renderSync();
    if (S.again) { S.again = false; pushNow(); }
  }
  addEventListener('online', () => { if (S.mode === 'user' && S.sync === 'offline') pushNow(); });

  const RO = () => route().name === 'u';
  const cur = () => (RO() && viewing ? viewing.state : state);
  const ownerName = () => (RO() && viewing ? viewing.user.displayName : S.user ? S.user.displayName : 'Invitado');

  function commit(label, fn, opts = {}) {
    if (RO()) return;
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > 80) undoStack.shift();
    fn(state);
    checkBadges();
    save();
    if (!opts.noRender) render();
    if (ui.drawer) renderDrawer();
    if (!opts.quiet) toast(label, { undo: true });
  }
  function undo() {
    if (!undoStack.length || RO()) return;
    state = JSON.parse(undoStack.pop());
    save(); render(); if (ui.drawer) renderDrawer();
    toast('Cambio deshecho');
  }

  // ---------- Utilidades ----------
  const thumb = (p, w) => (p.img ? `${p.img}${p.img.includes('?') ? '&' : '?'}w=${w}&auto=format` : '');
  function imgTag(p, w, cls = '', alt = '') {
    if (!p || !p.img) return '';
    return `<img loading="lazy" decoding="async" draggable="false" class="${cls}" src="${esc(thumb(p, w))}" data-full="${esc(p.img)}" onerror="if(this.src!==this.dataset.full){this.src=this.dataset.full}" alt="${esc(alt)}">`;
  }
  function toast(msg, o = {}) {
    const el = document.createElement('div');
    el.className = `toast${o.badge ? ' badge' : ''}`;
    el.innerHTML = o.badge ? `${badgeMedal({ ...o.badge, done: true }, 'md')}<div><small>Logro desbloqueado</small><b>${esc(msg)}</b></div>` : `${o.emote ? emoteImg(o.emote, 't-emote') : ''}<span>${esc(msg)}</span>${o.undo ? '<button type="button">Deshacer</button>' : ''}`;
    if (o.undo) el.querySelector('button').onclick = () => { undo(); el.remove(); };
    $('#toasts').appendChild(el);
    while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
    setTimeout(() => el.remove(), o.badge ? 5200 : 3800);
  }
  function animOn() {
    const a = state.settings.animate;
    if (a === 'off') return false;
    if (a === 'auto' && matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  }
  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const langLabel = (l) => (l === 'any' ? 'Cualquier idioma' : C.LANGS[l] || l);
  function statusChip(status, pending) {
    if (status === 'validado') return `<span class="chip ok">${gl('seal', 'sm')} Checklist validada</span>`;
    if (status === 'validado-con-avisos') return `<span class="chip warn">${gl('seal', 'sm')} Validada · ${pending} por revisar</span>`;
    if (status === 'avance') return `<span class="chip warn">${gl('holo', 'sm')} Catálogo en avance</span>`;
    return `<span class="chip warn">${gl('lock', 'sm')} Catálogo provisional</span>`;
  }
  function pagesText(pg, size) {
    if (pg.pages <= 1) return `Una página de ${pg.lastSize}`;
    const full = pg.lastSize === size ? pg.pages : pg.pages - 1;
    return `${full} página${full === 1 ? '' : 's'} completa${full === 1 ? '' : 's'} de ${size}${pg.lastSize !== size ? ` y una última de ${pg.lastSize}` : ''}`;
  }
  function modal(html, cls = '') {
    const m = $('#modal');
    m.className = cls;
    m.innerHTML = html;
    if (!m.open) m.showModal();
    return m;
  }

  // ---------- Portadas ----------
  function coverAlbumCard(a, st = cur()) {
    if (a.cover) return P(a.cover);
    if (a.featured[0]) return P(a.featured[0]);
    const entries = C.resolveChecklist(CAT, a).entries;
    const owned = C.ownedSet(st, a.lang);
    return P(entries.find((id) => owned.has(id)) || entries[0]);
  }
  function frameSVG(d) {
    const g = 'fr' + Math.random().toString(36).slice(2, 8);
    const corner = '<path d="M16 46V28a12 12 0 0112-12h18" fill="none" stroke-width="1.6"/><path d="M30 24l6 6-6 6-6-6z" stroke="none"/><path d="M48 16c-3 3-3 7 0 10M16 48c3-3 7-3 10 0" fill="none" stroke-width="1"/>';
    return `<svg class="frame" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">${A.FOILS[d.foil].map((c, i) => `<stop offset="${i / 4}" stop-color="${c}"/>`).join('')}</linearGradient></defs>
      <g stroke="url(#${g})" fill="url(#${g})"><rect x="14" y="14" width="272" height="372" rx="7" fill="none" stroke-width="1.8"/><rect x="21" y="21" width="258" height="358" rx="5" fill="none" stroke-width=".7" opacity=".6"/>
      ${corner}<g transform="translate(300 0) scale(-1 1)">${corner}</g><g transform="translate(0 400) scale(1 -1)">${corner}</g><g transform="translate(300 400) scale(-1 -1)">${corner}</g></g></svg>`;
  }
  function coverHTML(a, o = {}) {
    const d = o.design || design(a);
    const st = o.state || cur();
    const pr = C.progress(CAT, st, a);
    const cp = d.window === 'carta' ? coverAlbumCard(a, st) : null;
    const art = (d.window === 'arte' || d.window === 'campeon') ? albumArt(a, d) : null;
    const col = COL(a.set);
    const sub = a.objective === 'champion' ? 'Campeón favorito' : `${col ? col.code : ''} · ${pr.checklist.label}`;
    const pack = a.objective !== 'champion' ? setInfo(a.set).pack : null;
    const mode = art ? (d.window === 'campeon' ? 'champ-mode' : 'art-mode') : '';
    return `<div class="cover-face ${cp ? 'has-window' : ''} ${mode}" data-mat="${d.material}" style="${esc(vars(d))}">
      <div class="mat"></div>${art ? `<img class="cv-art" src="${esc(art)}" alt="" loading="lazy"><i class="cv-shade"></i>` : ''}<i class="spine-shade"></i>${frameSVG(d)}
      ${art || cp ? `<img class="cv-rblogo" src="${esc(AS.logo)}" alt="Riftbound" loading="lazy">` : '<div class="cv-emblem"></div>'}
      ${cp ? `<div class="cv-window ${cp.orient === 'landscape' ? 'land' : ''}">${imgTag(cp, 400)}</div>` : ''}
      ${art && pack ? `<img class="cv-setpack" src="${esc(pack)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <div class="cv-text"><div class="cv-title">${esc(a.name)}</div><div class="cv-rule"></div><div class="cv-sub">${esc(sub)}</div></div>
      ${pr.status === 'provisional' ? '<span class="provisional-stamp">Provisional</span>' : pr.status === 'avance' ? '<span class="provisional-stamp">En avance</span>' : ''}
      ${pr.complete ? '<span class="complete-seal">Com&shy;ple&shy;to</span>' : ''}
      <i class="ribbon"></i></div>`;
  }
  function bookHTML(a, cls = '', o = {}) {
    const d = o.design || design(a);
    return `<div class="book3d ${cls}" style="${esc(vars(d))}">${coverHTML(a, o)}<i class="spine"></i><i class="edge"></i><i class="back"></i><i class="floor"></i></div>`;
  }
  function miniCover(d, withEmblem = true) {
    return `<div class="mini-cover"><div class="cover-face" data-mat="${d.material}" style="${esc(vars(d))}"><div class="mat"></div><i class="spine-shade"></i>${withEmblem ? '<div class="cv-emblem" style="top:18%;width:34cqw"></div>' : ''}</div></div>`;
  }

  // ---------- Logros ----------
  const BADGE_META = {
    'first-card': { tier: 'iron', icon: 'unit' }, 'first-page': { tier: 'bronze', icon: 'rune' },
    'distinct-25': { tier: 'bronze', label: '25' }, 'distinct-100': { tier: 'silver', label: '100' }, 'distinct-250': { tier: 'gold', label: '250' },
    'base-25': { tier: 'silver', label: '25 %' }, 'base-50': { tier: 'gold', label: '50 %' }, 'base-75': { tier: 'platinum', label: '75 %' }, 'base-100': { tier: 'diamond', icon: 'legend' },
    'first-promo': { tier: 'emerald', icon: 'showcase' }, 'first-over': { tier: 'platinum', icon: 'epic' }, 'vendetta-diptych': { tier: 'master', icon: 'battlefield' },
    'complete-ARC': { tier: 'grandmaster', icon: 'gear' }, 'complete-SGD': { tier: 'challenger', icon: 'spell' }, 'champion-album': { tier: 'emerald', icon: 'champion' },
  };
  const badgeMedal = (b, cls = '') => { const m = BADGE_META[b.id] || { tier: 'iron' }; return A.rankMedal(m.tier, { done: b.done, locked: b.locked, label: m.label, icon: m.icon ? (AS.icons.type[m.icon] || AS.icons.rarity[m.icon]) : null, cls }); };
  const badgeView = (b) => ({ ...b, ...(BADGE_META[b.id] || {}) });
  function checkBadges() {
    for (const b of C.computeAchievements(CAT, state)) {
      if (b.done && !state.badges[b.id]) { state.badges[b.id] = today(); toast(b.title, { badge: badgeView(b) }); }
    }
  }

  // ---------- Router y estructura ----------
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || 'library', parts };
  }
  const NAV = [['library', '#/', 'Biblioteca'], ['ledger', '#/gestionar', 'Gestionar'], ['showcase', '#/vitrina', 'Vitrina'], ['pack', '#/productos', 'Productos'], null,
    ['decks', '#/mazos', 'Mazos y guías'], ['events', '#/eventos', 'Eventos'], ['matches', '#/partidas', 'Partidas'], ['teams', '#/equipos', 'Equipos'], null,
    ['profile', '#/perfil', 'Perfil'], ['crown', '#/planes', 'Planes'], ['seal', '#/validacion', 'Validación']];
  const NAV_KEY = { library: '#/', album: '#/', gestionar: '#/gestionar', vitrina: '#/vitrina', productos: '#/productos', perfil: '#/perfil', planes: '#/planes', validacion: '#/validacion', mas: '#/mas', u: '', mazos: '#/mazos', mazo: '#/mazos', guia: '#/mazos', partidas: '#/partidas', equipos: '#/equipos', eventos: '#/eventos' };
  const CRUMB = { library: 'Biblioteca', album: 'Biblioteca · Álbum', gestionar: 'Gestionar', vitrina: 'Vitrina', productos: 'Productos', perfil: 'Perfil', planes: 'Planes', validacion: 'Validación', mas: 'Más', u: 'Colección pública', mazos: 'Mazos y guías', mazo: 'Mazos · Constructor', guia: 'Guía de mazo', partidas: 'Partidas', equipos: 'Equipos', eventos: 'Eventos' };

  const NAV_ICON = { library: 'legend', ledger: 'gear', showcase: 'showcase', pack: 'epic', crown: 'rare', seal: 'rune', decks: 'spell', matches: 'battlefield', teams: 'champion', events: 'battlefield' };
  const NAV_DOM = { library: 'order', showcase: 'body', pack: 'chaos', decks: 'fury', matches: 'calm', teams: 'mind' };
  const navIcon = (k) => (k === 'profile' ? A.champIcon((state.profile || defaultProfile()).champ, 26, 'rbi') : NAV_DOM[k] ? `<img class="dom-ico" src="${AS.icons.domain[NAV_DOM[k]]}" alt="" loading="lazy">` : rbIcon(NAV_ICON[k] || 'unit'));
  const ROUTE_SEC = { library: 'order', album: 'order', gestionar: 'rb', vitrina: 'body', productos: 'chaos', mazos: 'fury', mazo: 'fury', guia: 'fury', partidas: 'calm', equipos: 'mind', perfil: 'rb', u: 'rb', planes: 'rb', validacion: 'rb', mas: 'rb', entrar: 'rb', eventos: 'rb' };
  function renderShell() {
    const key = NAV_KEY[route().name] ?? '#/';
    const u = S.user;
    $('#sidebar').innerHTML = `<a class="brand" href="#/" aria-label="Runario, ir a la biblioteca">${A.logo(40)}<div><b class="foil-text">Runario</b><small>Archivo de la Grieta</small></div></a>
      <nav class="nav" aria-label="Principal">${NAV.map((n) => (n ? `<a href="${n[1]}" data-c="${NAV_DOM[n[0]] || 'rb'}" ${n[1] === key ? 'aria-current="page"' : ''}>${navIcon(n[0])}<span>${n[2]}</span></a>` : '<i class="sep"></i>')).join('')}</nav>
      <div class="side-foot"><div class="syncline ${S.sync}" id="syncline"></div>
        <a class="usercard" href="#/perfil">${A.champIcon((state.profile || defaultProfile()).champ, 42)}<div><b>${esc(u ? u.displayName : 'Invitado')}</b><span>${u ? '@' + esc(u.username) : 'Crea tu cuenta'}</span></div></a>
        <p class="disclaimer">Proyecto de fans. No está respaldado por Riot Games. Riftbound y League of Legends son marcas de Riot Games, Inc.</p></div>`;
    $('#tabbar').innerHTML = [['library', '#/', 'Biblioteca'], ['decks', '#/mazos', 'Mazos'], ['teams', '#/equipos', 'Equipos'], ['profile', '#/perfil', 'Perfil'], ['crown', '#/mas', 'Más']]
      .map((n) => `<a href="${n[1]}" ${n[1] === key || (n[1] === '#/mas' && ['#/planes', '#/validacion', '#/productos', '#/gestionar', '#/vitrina', '#/partidas', '#/eventos'].includes(key)) ? 'aria-current="page"' : ''}>${navIcon(n[0])}${n[2]}</a>`).join('');
    $('#topbar').innerHTML = `<span class="crumb">${RO() && viewing ? `Colección de <b>${esc(viewing.user.displayName)}</b>` : `<b>${CRUMB[route().name] || ''}</b>`}</span><span class="spacer"></span>
      ${RO() ? '' : `<button class="iconbtn" id="undoBtn" title="Deshacer (Ctrl+Z)" aria-label="Deshacer" ${undoStack.length ? '' : 'disabled'}>${gl('hourglass')}</button>`}
      <button class="iconbtn" id="settingsBtn" title="Ajustes" aria-label="Ajustes">${gl('astrolabe')}</button>`;
    if ($('#undoBtn')) $('#undoBtn').onclick = undo;
    $('#settingsBtn').onclick = openSettings;
    renderSync();
  }
  function renderSync() {
    const el = $('#syncline'); if (!el) return;
    const t = { ok: 'Guardado en tu cuenta', saving: 'Guardando…', offline: 'Sin conexión · se guardará al volver', conflict: 'Conflicto de versiones', guest: 'Modo invitado · solo este navegador' }[S.sync] || '';
    el.className = `syncline ${S.sync}`; el.innerHTML = `<i></i><span>${t}</span>`;
  }
  function applyChrome() {
    const root = document.documentElement;
    root.classList.toggle('no-anim', !animOn());
    if (state.settings.mode && state.settings.mode !== 'system') root.dataset.mode = state.settings.mode;
    else if (matchMedia('(prefers-color-scheme: light)').matches) root.dataset.mode = 'light'; else delete root.dataset.mode;
    root.dataset.site = state.settings.site || 'origins';
  }

  function render() {
    applyChrome();
    const r = route();
    const authed = S.mode || r.name === 'u';
    $('#app').hidden = !authed || r.name === 'entrar';
    $('#tabbar').hidden = $('#app').hidden;
    $('#authRoot').hidden = !$('#app').hidden;
    if ($('#app').hidden) { viewAuth($('#authRoot')); return; }
    document.body.dataset.sec = ROUTE_SEC[r.name] || 'rb';
    document.body.classList.toggle('album-mode', r.name === 'album' || (r.name === 'u' && r.parts[2] === 'album'));
    renderShell();
    const fn = { library: viewLibrary, album: viewAlbum, gestionar: viewManage, vitrina: viewBadges, productos: viewProducts, perfil: viewProfile, planes: viewPlans, validacion: viewValidation, mas: viewMore, u: viewPublic, mazos: viewDecks, mazo: viewDeckEditor, guia: viewGuide, partidas: viewMatches, equipos: viewTeams, eventos: viewEvents }[r.name] || viewLibrary;
    fn($('#view'), r);
  }

  // ---------- Acceso ----------
  function viewAuth(root) {
    const showcase = CAT.prints.filter((p) => p.set === 'OGN' && p.kind === 'overnumber').slice(0, 3);
    const hasGuest = !!ls.get(GUEST_KEY);
    let mode = root.dataset.mode || 'register';
    const draw = () => {
      root.innerHTML = `<div class="auth">
        <section class="auth-hero"><div class="brandline">${A.logo(58)}<b class="foil-text">Runario</b></div>
          <div class="eyebrow">Archivo de coleccionistas de Riftbound</div>
          <h1>Tu colección, encuadernada a tu medida.</h1>
          <p>Álbumes con el hueco exacto de cada carta, páginas que se pasan como las de verdad, cartas en 3D y una vitrina para tus logros. Cada coleccionista tiene su propio archivo.</p>
          <div class="floaters" aria-hidden="true">${showcase.map((p) => `<div class="floater">${imgTag(p, 400)}</div>`).join('')}</div></section>
        <section class="auth-panel">
          <div class="seg" role="tablist"><button type="button" data-m="register" aria-pressed="${mode === 'register'}">Crear cuenta</button><button type="button" data-m="login" aria-pressed="${mode === 'login'}">Entrar</button></div>
          ${!S.server ? '<div class="notice">El servidor de cuentas no está activo. Arranca Runario con <b>node server.mjs</b> o explora en modo invitado.</div>' : ''}
          <form id="authForm" autocomplete="on">
            <h2>${mode === 'register' ? 'Abre tu archivo' : 'Bienvenido de nuevo'}</h2>
            <label class="field"><span>Nombre de coleccionista</span><input type="text" name="username" required minlength="3" maxlength="20" pattern="[a-z0-9_]{3,20}" autocomplete="username" placeholder="p. ej. guardian_rift" autocapitalize="none" spellcheck="false"></label>
            ${mode === 'register' ? '<label class="field"><span>Nombre visible</span><input type="text" name="displayName" maxlength="40" placeholder="Cómo te verán otros coleccionistas"></label>' : ''}
            <label class="field"><span>Contraseña</span><input type="password" name="password" required minlength="8" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}"></label>
            ${mode === 'register' && hasGuest ? '<label class="row small"><input type="checkbox" name="bring" checked> Traer a mi cuenta la colección que hice como invitado</label>' : ''}
            <p class="auth-err" id="authErr" role="alert"></p>
            <button class="btn gold" ${S.server ? '' : 'disabled'}>${gl('key')} ${mode === 'register' ? 'Crear mi cuenta' : 'Entrar'}</button>
            ${mode === 'register' ? '<p class="tiny faint">Usuario en minúsculas, números o _. Contraseña de 8 caracteres o más. Se guarda cifrada.</p>' : ''}
          </form>
          <div class="or">o</div>
          <button class="btn" id="guestBtn">${gl('library')} Explorar como invitado</button>
          <p class="tiny faint">Como invitado tu colección vive solo en este navegador. Puedes pasarla a una cuenta cuando quieras.</p>
        </section></div>`;
      $$('[data-m]', root).forEach((b) => b.onclick = () => { mode = b.dataset.m; root.dataset.mode = mode; draw(); });
      $('#guestBtn', root).onclick = () => { startGuest(); location.hash = '#/'; render(); };
      $('#authForm', root).onsubmit = async (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const body = { username: String(f.get('username') || '').trim().toLowerCase(), password: f.get('password') };
        if (mode === 'register') {
          body.displayName = f.get('displayName');
          if (f.get('bring')) { try { body.state = normalize(JSON.parse(ls.get(GUEST_KEY))); } catch { /* sin datos */ } }
        }
        $('#authErr').textContent = '';
        try {
          const r = await api('POST', mode === 'register' ? '/api/register' : '/api/login', body);
          if (!r.ok) { $('#authErr').textContent = r.data.error || 'No se pudo completar.'; return; }
          S.user = r.data.user; ls.del(MODE_KEY);
          await loadRemote();
          location.hash = '#/'; render();
          toast(mode === 'register' ? `Archivo creado. Bienvenido, ${S.user.displayName}.` : `Hola de nuevo, ${S.user.displayName}.`);
        } catch { $('#authErr').textContent = 'No hay conexión con el servidor.'; }
      };
    };
    draw();
  }
  async function logout() {
    try { await api('POST', '/api/logout'); } catch { /* sin conexión */ }
    S.user = null; S.mode = null; S.sync = 'guest'; ls.del(MODE_KEY); state = C.emptyState(); undoStack.length = 0;
    location.hash = '#/entrar'; render();
  }
  function openConflict(server) {
    const m = modal(`<form method="dialog"><div class="modal-head"><h2 id="modalTitle">Tu colección cambió en otro dispositivo</h2></div>
      <div class="modal-body"><p>La versión guardada en tu cuenta es más reciente (${esc((server.updatedAt || '').slice(0, 16).replace('T', ' '))}). Elige cuál conservar.</p></div>
      <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn" id="cfServer">Cargar la de mi cuenta</button><button type="button" class="btn gold" id="cfLocal">Mantener la de aquí</button></div></form>`, 'narrow');
    $('#cfServer', m).onclick = () => { state = normalize(server.state); S.rev = server.rev; S.sync = 'ok'; m.close(); render(); };
    $('#cfLocal', m).onclick = () => { m.close(); pushNow(true); };
  }

  // ---------- Biblioteca ----------
  function viewLibrary(view) {
    const st = cur();
    const owned = C.ownedSet(st);
    const copies = st.lots.reduce((n, l) => n + l.qty, 0);
    const badges = C.computeAchievements(CAT, st).filter((b) => b.done).length;
    const last = st.albums.find((a) => a.id === st.settings.lastAlbum) || st.albums[0];
    const lp = last && C.progress(CAT, st, last);
    const lastArt = last && albumArt(last, design(last));
    const prof = st.profile || defaultProfile();
    const mainSets = CAT.collections.filter((c) => !c.provisional);
    const setTile = (c) => {
      const info = setInfo(c.id); const cl = CAT.checklists.find((x) => x.set === c.id && ['base', 'promo', 'product'].includes(x.objective));
      const pr = cl ? C.progress(CAT, st, { set: c.id, objective: cl.objective, lang: 'any', order: [] }) : null;
      return `<button type="button" class="set-tile ${info.art ? '' : 'no-art'}" data-set="${c.id}" aria-label="${esc(c.name)}">
        ${info.art ? `<img class="art" src="${esc(info.art)}" alt="" loading="lazy">` : ''}
        ${c.preview ? '<span class="chip gold tag">En avance</span>' : ''}
        ${info.pack ? `<img class="pack" src="${esc(info.pack)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <span class="info"><b>${esc(c.name)}</b><span>${esc(c.code)} · ${pr ? `${pr.filled}/${pr.total}` : '—'}</span>${pr ? `<span class="bar"><i style="width:${pr.pct}%"></i></span>` : ''}</span></button>`;
    };
    view.innerHTML = `<div class="page">
      ${last ? `<section class="hero ${lastArt ? 'has-art' : ''}" style="--hero-amb:${design(last).amb}">${lastArt ? `<i class="hero-art" style="background-image:url('${esc(lastArt)}')"></i>` : ''}
        <a class="stage3d" href="#/album/${last.id}" aria-label="Abrir ${esc(last.name)}">${bookHTML(last, 'big')}</a>
        <span class="scribble hero-scribble">${lp.missing ? `¡te faltan ${lp.missing}!` : '¡álbum completo!'}<svg viewBox="0 0 70 40" aria-hidden="true"><path d="M64 8C46 2 22 6 6 22M6 22l3-11M6 22l11-1"/></svg></span>
        <div><div class="eyebrow">${emoteImg(emoteById(prof.emote), 'emote-hello')}Bienvenido a la Grieta, ${esc(ownerName())}</div><h1>Continúa con ${esc(last.name)}</h1>
          <p class="muted">${lp.filled} de ${lp.total} huecos llenos · ${fmtPct(lp.pct)}. ${lp.missing ? `Te faltan ${lp.missing} carta${lp.missing === 1 ? '' : 's'}.` : 'Álbum completo.'}</p>
          <div class="stats"><div class="stat"><b>${owned.size}</b><span>Cartas distintas</span></div><div class="stat"><b>${copies}</b><span>Copias</span></div><div class="stat"><b>${st.albums.length}</b><span>Álbumes</span></div><div class="stat"><b>${badges}</b><span>Logros</span></div><div class="stat wide" title="${esc(priceNote())}"><b>${money(lotsValue(st), true)}</b><span>Valor de tu colección</span></div></div>
          <div class="row"><a class="btn gold" href="#/album/${last.id}">${gl('pages')} Abrir álbum</a><button class="btn" id="newAlbum">${gl('add')} Nuevo álbum</button></div></div></section>` : ''}
      ${(() => { const seen = new Set(); const recent = st.lots.slice().reverse().filter((l) => l.qty > 0 && !seen.has(l.printId) && seen.add(l.printId)).slice(0, 10).map((l) => P(l.printId)).filter(Boolean);
        return recent.length ? `<div class="section-title"><h2>Recién llegadas</h2><span class="muted small">Lo último que has metido en la carpeta.</span></div>
        <div class="recent-rail" id="recentRail">${recent.map((p) => `<button type="button" class="recent-card" data-card="${esc(p.id)}" aria-label="${esc(p.name)}">${imgTag(p, 300)}${priceUSD(p) != null ? `<span class="ptag">${money(priceUSD(p), true)}</span>` : ''}</button>`).join('')}</div>` : ''; })()}
      <div class="section-title"><h2>Colecciones de Riftbound</h2><span class="muted small">Pincha una y te abro su álbum (o te lo creo).</span></div>
      <div class="set-rail">${mainSets.map(setTile).join('')}</div>
      <div class="section-title"><h2>Tu estantería</h2><span class="muted small">Un hueco por carta, ni uno más. Las repetidas se apilan, no ocupan sitio.</span></div>
      <div class="shelf">${st.albums.map((a) => {
        const pr = C.progress(CAT, st, a); const col = COL(a.set);
        return `<a class="shelf-item" href="#/album/${a.id}">${bookHTML(a)}<div class="shelf-meta"><h3>${esc(a.name)}</h3>
          <div class="sub">${esc(a.objective === 'champion' ? 'Todas las colecciones' : col.code)} · ${esc(pr.checklist.label)} · ${esc(a.lang === 'any' ? 'Todo idioma' : a.lang)}</div>
          <div class="prog"><span>${pr.filled}/${pr.total}</span><div class="bar"><i style="width:${pr.pct}%"></i></div><span>${fmtPct(pr.pct)}</span></div></div></a>`;
      }).join('')}
        <div class="shelf-item"><button class="shelf-new" id="newAlbum2"><span>${gl('add')}Nuevo álbum</span></button></div></div>
      <p class="faint tiny">Catálogo ${esc(CAT.meta.version)} · ${esc(CAT.meta.source)}. ${esc(CAT.meta.images)}</p></div>`;
    $$('#newAlbum, #newAlbum2', view).forEach((b) => b.onclick = openNewAlbum);
    if ($('#recentRail', view)) { bindCards($('#recentRail', view), null); window.RB3D.attachTilt($('#recentRail', view), '.recent-card'); }
    $$('.set-tile', view).forEach((b) => b.onclick = () => {
      const setId = b.dataset.set;
      const existing = st.albums.find((a) => a.set === setId && ['base', 'promo', 'product'].includes(a.objective));
      if (existing) { location.hash = `#/album/${existing.id}`; return; }
      if (RO()) return;
      const obj = C.objectivesFor(CAT, setId)[0];
      const a = newAlbum({ set: setId, objective: obj, pageSize: 9 });
      commit(`Álbum «${a.name}» creado`, (s) => s.albums.push(a), { noRender: true });
      location.hash = `#/album/${a.id}`;
    });
  }

  // ---------- Nuevo álbum ----------
  function openNewAlbum() {
    const champs = C.champions(CAT);
    const f = { set: 'OGN', objective: 'base', champion: champs[0], include: { base: true, alt: true, overnumber: true, signature: true, special: true, promo: true, token: true, rune: true }, lang: 'any', pageSize: 9 };
    const draw = () => {
      const objs = f.objective === 'champion' ? null : C.objectivesFor(CAT, f.set);
      if (objs && !objs.includes(f.objective)) f.objective = objs[0];
      const cl = C.resolveChecklist(CAT, f);
      const n = cl.entries.length;
      const pg = n ? C.paginate(n, f.pageSize) : { pages: 0, lastSize: 0 };
      const m = modal(`<form method="dialog">
        <div class="modal-head"><h2 id="modalTitle">Nuevo álbum</h2><button class="iconbtn" value="cancel" aria-label="Cerrar">${gl('close')}</button></div>
        <div class="modal-body">
          <div class="seg"><button type="button" data-mode="set" aria-pressed="${f.objective !== 'champion'}">${gl('library', 'sm')} Por colección</button><button type="button" data-mode="champion" aria-pressed="${f.objective === 'champion'}">${gl('profile', 'sm')} Campeón favorito</button></div>
          ${f.objective === 'champion' ? `<label class="field"><span>Campeón</span><select id="champ">${champs.map((c) => `<option ${c === f.champion ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>`
          : `<div><h3>Colección</h3><div class="pick-grid" style="margin-top:10px">${CAT.collections.map((c) => `<button type="button" class="pick" data-set="${c.id}" aria-pressed="${f.set === c.id}">${miniCover(PRESETS[c.theme] || PRESETS.neutral)}<b>${esc(c.name)}</b><span class="tiny muted">${esc(c.code)} · ${c.provisional ? 'Catálogo provisional' : `${c.baseCount} cartas`}</span></button>`).join('')}</div></div>
            <div><h3>Objetivo</h3><div class="pick-grid" style="margin-top:10px">${objs.map((o) => { const c2 = C.resolveChecklist(CAT, { ...f, objective: o }); return `<label class="pick"><input type="radio" name="obj" value="${o}" ${f.objective === o ? 'checked' : ''}><b>${C.OBJECTIVES[o].label}</b><span class="tiny muted">${c2.status === 'provisional' ? 'Provisional · 0 huecos' : `${c2.entries.length} huecos`}</span></label>`; }).join('')}</div></div>
            ${f.objective === 'master' ? `<div><h3>Qué incluye el Master</h3><div class="row" style="margin-top:10px">${Object.keys(f.include).filter((k) => CAT.prints.some((p) => p.set === f.set && p.kind === k)).map((k) => `<label class="chip"><input type="checkbox" data-inc="${k}" ${f.include[k] ? 'checked' : ''}> ${C.KIND_LABEL[k]}</label>`).join('')}</div></div>` : ''}`}
          <div class="row" style="align-items:flex-end;gap:18px">
            <label class="field" style="flex:1;min-width:200px"><span>Idioma que cuenta</span><select id="lang"><option value="any">Cualquier idioma</option>${Object.entries(C.LANGS).map(([k, v]) => `<option value="${k}" ${f.lang === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            <div class="field"><span>Huecos por página</span><div class="seg">${C.PAGE_SIZES.map((s) => `<button type="button" data-size="${s}" aria-pressed="${f.pageSize === s}">${s}</button>`).join('')}</div></div></div>
          ${f.lang !== 'any' && !CAT.meta.languages.includes(f.lang) ? `<div class="notice">La checklist publicada está en inglés. Se usan los mismos huecos; que exista impresión en ${langLabel(f.lang).toLowerCase()} no está verificado.</div>` : ''}
          <div class="calc">${cl.status === 'provisional' ? `<b>Catálogo provisional</b><p class="small muted">${esc(cl.reason || 'Sin checklist validada.')} No se crean huecos inventados.</p>`
            : `<b>${n} huecos · ${pg.pages} página${pg.pages === 1 ? '' : 's'}</b><p class="small muted">${pagesText(pg, f.pageSize)}. Cuenta para completar: ${esc(cl.counts)}</p>`}</div>
        </div>
        <div class="modal-foot"><span class="spacer"></span><button class="btn" value="cancel">Cancelar</button><button class="btn gold" type="button" id="createAlbum">${gl('add')} Crear álbum</button></div></form>`);
      $$('[data-set]', m).forEach((b) => b.onclick = () => { f.set = b.dataset.set; draw(); });
      $$('[data-mode]', m).forEach((b) => b.onclick = () => { f.objective = b.dataset.mode === 'champion' ? 'champion' : C.objectivesFor(CAT, f.set)[0]; draw(); });
      $$('input[name="obj"]', m).forEach((r) => r.onchange = () => { f.objective = r.value; draw(); });
      $$('[data-inc]', m).forEach((c) => c.onchange = () => { f.include[c.dataset.inc] = c.checked; draw(); });
      $$('[data-size]', m).forEach((b) => b.onclick = () => { f.pageSize = +b.dataset.size; draw(); });
      $('#lang', m).onchange = (e) => { f.lang = e.target.value; draw(); };
      if ($('#champ', m)) $('#champ', m).onchange = (e) => { f.champion = e.target.value; draw(); };
      $('#createAlbum', m).onclick = () => {
        const champ = f.objective === 'champion';
        const a = newAlbum({ ...f, include: f.objective === 'master' ? { ...f.include } : null, champion: champ ? f.champion : null, set: champ ? null : f.set, theme: champ ? 'neutral' : undefined });
        m.close();
        commit(`Álbum «${a.name}» creado`, (s) => s.albums.push(a), { noRender: true });
        location.hash = `#/album/${a.id}`;
      };
    };
    draw();
  }

  // ---------- Álbum ----------
  const isSpread = () => state.settings.spread !== false && innerWidth >= 1000;
  function albumModel(a) {
    const cl = C.resolveChecklist(CAT, a);
    const list = C.orderedEntries(cl.entries, a.order);
    const pg = C.paginate(list.length, a.pageSize);
    const items = ['inner', ...Array.from({ length: pg.pages }, (_, i) => i)];
    if (isSpread() && items.length % 2) items.push('end');
    return { cl, list, pg, items };
  }
  function pairOf(a, id) {
    for (const pr of [...(CAT.meta.diptychs || []), ...((a && a.pairs) || [])]) { if (pr[0] === id) return pr[1]; if (pr[1] === id) return pr[0]; }
    return null;
  }
  function pocketHTML(a, id, idx, owned) {
    const st = cur(); const p = P(id);
    const q = C.qty(st, id, a.lang);
    const has = q > 0;
    const tr = C.tradeQty(st, id);
    const label = `${p.set} ${p.no}, ${p.name}. ${has ? `Tienes ${q}` : 'Falta'}`;
    return `<div class="pocket ${has ? 'owned' : 'missing'} ${p.orient === 'landscape' ? 'land' : ''} ${st.settings.ghostArt === false ? 'noart' : ''} ${a.featured.includes(id) ? 'featured' : ''} ${isHolo(p) ? 'holo' : ''} ${ui.justAdded === id ? 'just-added' : ''}"
      role="button" tabindex="0" data-card="${esc(id)}" data-idx="${idx}" aria-label="${esc(label)}">
      <div class="card">${imgTag(p, 360)}</div><i class="sleeve"></i>
      <span class="num">${esc(a.objective === 'champion' ? `${p.set} ${p.no}` : p.no)}</span><span class="nm">${esc(p.name)}</span>
      ${has ? '' : `<span class="doms">${p.domains.slice(0, 2).map((d) => domainIcon(d)).join('')}</span>${rarityIcon(p.rarity)}`}
      <span class="marks">${st.wish[id] && !has ? `<i title="En tu lista de deseos">${gl('wish')}</i>` : ''}${tr ? `<i title="Disponible para intercambio">${gl('trade')}</i>` : ''}${pairOf(a, id) ? `<i title="Díptico">${gl('pages')}</i>` : ''}</span>
      ${q > 1 ? `<span class="qty">×${q}</span>` : ''}
      ${priceUSD(p) != null && cur().settings.prices !== false ? `<span class="ptag" title="${esc(priceNote())}">${money(priceUSD(p), true)}</span>` : ''}
      ${RO() ? '' : `<button type="button" class="quick" data-quick="${esc(id)}" aria-label="Añadir una copia de ${esc(p.name)}" title="Añadir una copia">${gl('add')}</button>`}</div>`;
  }
  function stickersHTML(a, item) {
    return (a.stickers || []).filter((s) => String(s.item) === String(item)).map((s) => {
      const e = emoteById(s.e);
      return `<span class="sticker" data-sticker="${esc(s.id)}" style="--x:${s.x}%;--y:${s.y}%;--r:${s.r || 0}deg;--s:${s.s || 17}%">${emoteImg(e)}</span>`;
    }).join('');
  }
  function pageInner(a, m, item) {
    const d = design(a);
    const art = albumArt(a, { ...d, window: d.window === 'campeon' ? 'campeon' : 'arte' });
    if (item === 'end' || item === undefined) return `<div class="pg-in"><div class="back-endpaper"><div style="width:44%;margin:0 auto 14px">${A.cardBack('main')}</div>Contraportada<br><span class="tiny">${m.list.length} huecos en total</span></div></div>`;
    if (item === 'inner') {
      const pr = C.progress(CAT, cur(), a);
      const feats = a.featured.map(P).filter(Boolean);
      const prof = (RO() && viewing ? viewing.state.profile : state.profile) || defaultProfile();
      return `<div class="pg-in inner-cover" data-page="inner">${art ? `<div class="inner-banner"><img class="art" src="${esc(art)}" alt="" loading="lazy"><img class="rb" src="${esc(AS.logo)}" alt="Riftbound" loading="lazy"></div>` : '<i class="endpaper"></i>'}
        <div class="exlibris">${A.champIcon(prof.champ, 46)}<div><small>Ex libris</small><b>${esc(ownerName())}</b></div></div>
        <h2>${esc(a.name)}</h2>
        <dl><dt>Objetivo</dt><dd>${esc(m.cl.label)}</dd><dt>Cuenta</dt><dd>${esc(m.cl.counts)}</dd><dt>Idioma</dt><dd>${esc(langLabel(a.lang))}</dd>
          <dt>Huecos</dt><dd>${m.list.length} en ${m.pg.pages} página${m.pg.pages === 1 ? '' : 's'} de ${a.pageSize}${m.pg.pages > 1 && m.pg.lastSize !== a.pageSize ? ` (última: ${m.pg.lastSize})` : ''}</dd>
          <dt>Progreso</dt><dd>${pr.filled} de ${pr.total} · ${fmtPct(pr.pct)}</dd><dt>Checklist</dt><dd>${m.cl.version ? `${esc(m.cl.version)} · ${esc(m.cl.source || '')}` : '—'}</dd></dl>
        ${m.cl.status === 'provisional' ? `<div class="provisional-box"><b>Catálogo provisional</b><br>${esc(m.cl.reason || 'Sin checklist validada.')} No se muestran cartas ni totales inventados.</div>` : ''}
        ${feats.length ? `<div class="feat-row">${feats.map((p) => `<button type="button" data-card="${esc(p.id)}" aria-label="${esc(p.name)}">${imgTag(p, 300)}</button>`).join('')}</div>`
          : `<p class="tiny" style="margin-top:auto;opacity:.6">Destaca hasta 4 cartas desde su ficha para exhibirlas aquí.</p>`}${stickersHTML(a, 'inner')}</div>`;
    }
    const start = item * a.pageSize;
    const ids = C.pageSlice(m.list, a.pageSize, item);
    const owned = C.ownedSet(cur(), a.lang);
    const filled = ids.filter((id) => owned.has(id)).length;
    return `<div class="pg-in" aria-label="Página ${item + 1}" data-page="${item}">${d.pageArt && art ? `<img class="pg-art" src="${esc(art)}" alt="" loading="lazy">` : ''}
      <div class="pg-head"><span class="folio"><small>Página</small>${item + 1}</span><img class="pg-logo" src="${esc(AS.logo)}" alt="" loading="lazy"><span class="range">Huecos ${start + 1}–${start + ids.length} · ${filled}/${ids.length}</span></div>
      <div class="pockets s${a.pageSize}">${ids.map((id, i) => pocketHTML(a, id, start + i, owned)).join('')}</div>${stickersHTML(a, item)}</div>`;
  }

  function viewAlbum(view, r, ro = false) {
    const st = cur();
    const albumId = ro ? r.parts[3] : r.parts[1];
    const a = st.albums.find((x) => x.id === albumId);
    const base = ro ? `#/u/${viewing.user.username}` : '#/';
    if (!a) { view.innerHTML = `<div class="page empty"><h2>Álbum no encontrado</h2><p><a href="${base}">Volver</a></p></div>`; return; }
    if (!ro && r.parts[2] === 'gestionar') { ui.manage.album = a.id; return viewManage(view); }
    if (!ro && st.settings.lastAlbum !== a.id) { state.settings.lastAlbum = a.id; save(); }
    const d = design(a);
    const m = albumModel(a);
    const pr = C.progress(CAT, st, a);
    const spread = isSpread(); const step = spread ? 2 : 1;
    let pos = Math.min(ui.pos[a.id] || 0, m.items.length - 1);
    if (spread) pos -= pos % 2;
    ui.pos[a.id] = pos;
    const shown = spread ? [m.items[pos], m.items[pos + 1]] : [m.items[pos]];
    const nums = shown.filter((x) => typeof x === 'number').map((x) => x + 1);
    const posLabel = nums.length ? `Página${nums.length > 1 ? 's' : ''} ${nums.join('–')} de ${m.pg.pages}` : shown[0] === 'inner' ? 'Portada interior' : 'Contraportada';
    const owned = C.ownedSet(st, a.lang);
    const missing = m.list.map((id, i) => [id, i]).filter(([id]) => !owned.has(id));
    const col = COL(a.set);
    const C2 = 2 * Math.PI * 64;
    const fid = 'rg' + a.id;

    view.innerHTML = `<div class="page" style="${esc(vars(d))}">
      <div class="album">
        <div class="album-head">
          <a class="iconbtn" href="${base}" aria-label="Volver">${gl('prev')}</a>
          <div><div class="eyebrow">${esc(a.objective === 'champion' ? 'Campeón favorito · todas las colecciones' : `${col.code} · ${col.name}`)}</div><h1>${esc(a.name)}</h1></div>
          <div class="tools">
            <button type="button" class="miniprog" id="miniprog" title="Ver progreso y detalles"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="60" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="18"/><circle cx="75" cy="75" r="60" fill="none" stroke="url(#${fid})" stroke-width="18" stroke-linecap="round" stroke-dasharray="${(2 * Math.PI * 60 * pr.pct) / 100} 400"/></svg>${pr.filled}/${pr.total} <small>${fmtPct(pr.pct)}</small></button>
            ${ro ? '' : `<div class="seg"><button type="button" aria-pressed="true">${gl('pages', 'sm')} Mi álbum</button><button type="button" id="toManage" aria-pressed="false">${gl('ledger', 'sm')} Gestionar</button></div>`}
            <div class="seg" aria-label="Huecos por página">${C.PAGE_SIZES.map((s) => `<button type="button" data-size="${s}" aria-pressed="${a.pageSize === s}" title="${s} huecos por página">${s}</button>`).join('')}</div>
            ${ro ? '' : `<button class="btn" id="stickBtn" aria-pressed="${!!ui.stickers}">${emoteImg(EMOTES[3], 't-emote').replace('t-emote', 't-emote" style="width:26px;height:26px')} Pegatinas</button>`}
            <button class="btn" id="fsBtn" title="Pantalla completa">${gl('pages')} Pantalla completa</button>
            ${ro ? '' : `<button class="btn gold" id="workshop">${gl('workshop')} Taller</button>`}
          </div>
        </div>
        <section class="desk ${ui.stickers ? 'sticker-mode' : ''}" id="desk" aria-label="Álbum abierto">
          ${albumArt(a, d) ? `<i class="desk-art" style="background-image:url('${esc(albumArt(a, d))}')"></i>` : ''}
          <button class="iconbtn fs-exit" id="fsExit" aria-label="Salir de pantalla completa">${gl('close')}</button>
          ${ui.stickers && !ro ? `<div class="emote-tray" role="toolbar" aria-label="Pegatinas"><b>Toca un emote para pegarlo · arrástralo para moverlo</b>${EMOTES.map((e) => `<button type="button" data-emote="${e.id}" title="${esc(e.name)}">${emoteImg(e)}</button>`).join('')}</div>
            <div class="row" style="margin:-6px 0 14px" id="stickTools" hidden><span class="small muted">Pegatina seleccionada:</span><button class="btn sm" data-st="rot-">Girar ↺</button><button class="btn sm" data-st="rot+">Girar ↻</button><button class="btn sm" data-st="big">Más grande</button><button class="btn sm" data-st="small">Más pequeña</button><button class="btn sm danger" data-st="del">Quitar</button></div>` : ''}
          ${ui.showMissing ? `<div class="panel" style="margin-bottom:22px"><div class="row"><h3>${gl('missing')} Te faltan ${missing.length}</h3><span class="spacer"></span><button class="btn sm ghost" id="missClose">Ocultar</button></div>
            ${missing.length ? `<div class="missing-list">${missing.slice(0, 500).map(([id, i]) => `<button type="button" data-jump="${i}"><span class="n">${i + 1}</span><span><b class="small">${esc(P(id).name)}</b><br><span class="tiny muted">${esc(`${P(id).set} ${P(id).no}`)} · pág. ${Math.floor(i / a.pageSize) + 1}${st.wish[id] ? ' · deseada' : ''}</span></span></button>`).join('')}</div>` : '<p class="muted">No te falta nada.</p>'}</div>` : ''}
          <div class="bookwrap ${spread ? '' : 'one'}" data-size="${a.pageSize}">
            <button class="page-turn prev" data-turn="-1" aria-label="Página anterior" ${pos === 0 ? 'disabled' : ''}>${gl('prev')}</button>
            <div class="binder ${spread ? '' : 'single'}" id="binder" data-paper="${d.paper}" data-sleeves="${d.sleeves}">
              ${spread ? `<div class="pg left" id="pgL">${pageInner(a, m, shown[0])}</div><div class="pg right" id="pgR">${pageInner(a, m, shown[1])}</div>` : `<div class="pg" id="pgS">${pageInner(a, m, shown[0])}</div>`}
              ${pos + step < m.items.length ? '<i class="corner-hint" aria-hidden="true"></i>' : ''}
            </div>
            <button class="page-turn next" data-turn="1" aria-label="Página siguiente" ${pos + step >= m.items.length ? 'disabled' : ''}>${gl('next')}</button>
          </div>
          <div class="desk-foot"><button class="iconbtn" data-turn="-1" aria-label="Página anterior" ${pos === 0 ? 'disabled' : ''}>${gl('prev')}</button>
            <span class="pos" aria-live="polite">${posLabel}</span>
            <button class="iconbtn" data-turn="1" aria-label="Página siguiente" ${pos + step >= m.items.length ? 'disabled' : ''}>${gl('next')}</button></div>
          <div class="pagemap" aria-label="Mapa de páginas">${m.items.map((it, i) => {
            if (it === 'end') return '';
            if (it === 'inner') return `<button type="button" class="cover ${i === pos ? 'cur' : ''}" data-goto="${i}" title="Portada interior"></button>`;
            const ids = C.pageSlice(m.list, a.pageSize, it); const f = ids.filter((x) => owned.has(x)).length / ids.length;
            return `<button type="button" class="${f === 1 ? 'full' : ''} ${shown.includes(it) ? 'cur' : ''}" style="--f:${Math.round(f * 100)}%" data-goto="${i}" title="Página ${it + 1}: ${Math.round(f * 100)} %"></button>`;
          }).join('')}</div>
          <p class="faint tiny desk-hint" style="text-align:center;margin-top:12px">Arrastra la página o usa ← → · Pasa el ratón por encima de una carta para inclinarla</p>
        </section>
        <aside class="side">
          <div class="panel">
            <div class="ring"><svg viewBox="0 0 150 150"><defs><linearGradient id="${fid}" x1="0" y1="0" x2="1" y2="1">${A.FOILS[d.foil].map((c, i) => `<stop offset="${i / 4}" stop-color="${c}"/>`).join('')}</linearGradient></defs>
              <circle cx="75" cy="75" r="64" fill="none" stroke="currentColor" stroke-opacity=".1" stroke-width="10"/>
              <circle cx="75" cy="75" r="64" fill="none" stroke="url(#${fid})" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(C2 * pr.pct) / 100} ${C2}"/></svg>
              <div class="pct"><div><b>${fmtPct(pr.pct)}</b><span>${pr.complete ? 'COMPLETO' : 'COMPLETADO'}</span></div></div></div>
            <div class="counts"><div><b>${pr.filled}</b><span>Tienes</span></div><div><b>${pr.missing}</b><span>Faltan</span></div><div><b>${pr.total}</b><span>Huecos</span></div></div>
            <div class="album-value"><div><span>Valor de tus cartas</span><b>${money(m.list.reduce((n, id) => n + (owned.has(id) ? (priceUSD(P(id)) || 0) : 0), 0))}</b></div><div><span>Completar costaría</span><b>${money(missing.reduce((n, [id]) => n + (priceUSD(P(id)) || 0), 0))}</b></div></div>
            <div class="row" style="justify-content:center;margin-top:14px">${statusChip(pr.status, m.cl.pending)}</div>
            <p class="small muted" style="margin-top:12px;text-align:center">Cuenta: ${esc(m.cl.counts)}${a.lang !== 'any' ? ` Solo copias en ${esc(langLabel(a.lang).toLowerCase())}.` : ''}</p>
          </div>
          <div class="panel actions" style="padding:10px">
            <button type="button" id="missBtn">${gl('missing')}<span>Ver faltantes<small>${missing.length} cartas, con su página</small></span></button>
            ${ro ? '' : `<button type="button" id="workshop2">${gl('workshop')}<span>Taller de encuadernación<small>Material, foil, papel, fundas y orden</small></span></button>
            <a href="#/album/${a.id}/gestionar">${gl('ledger')}<span>Registrar en lote<small>Vista de gestión de este álbum</small></span></a>`}
            <button type="button" id="cover3d">${gl('card3d')}<span>Portada en 3D<small>${esc(MATERIALS[d.material])} · ${esc(FOIL_NAMES[d.foil])}</small></span></button>
          </div>
        </aside>
      </div></div>`;

    const binder = $('#binder', view);
    const go = (dir) => turn(a, dir);
    $$('[data-turn]', view).forEach((b) => b.onclick = () => go(+b.dataset.turn));
    $$('[data-goto]', view).forEach((b) => b.onclick = () => { ui.pos[a.id] = +b.dataset.goto; render(); });
    $$('[data-size]', view).forEach((b) => b.onclick = () => {
      const size = +b.dataset.size; if (size === a.pageSize) return;
      const firstPage = shown.find((x) => typeof x === 'number');
      const firstIdx = firstPage !== undefined ? firstPage * a.pageSize : -1;
      const apply = (alb) => { alb.pageSize = size; };
      if (ro) { apply(a); } else commit(`Distribución: ${size} huecos por página`, (s) => apply(s.albums.find((x) => x.id === a.id)), { noRender: true });
      ui.pos[a.id] = firstIdx >= 0 ? Math.floor(firstIdx / size) + 1 : 0; render();
    });
    if ($('#workshop', view)) $('#workshop', view).onclick = $('#workshop2', view).onclick = () => openWorkshop(a.id);
    if ($('#toManage', view)) $('#toManage', view).onclick = () => { location.hash = `#/album/${a.id}/gestionar`; };
    $('#missBtn', view).onclick = () => { ui.showMissing = !ui.showMissing; render(); };
    if ($('#missClose', view)) $('#missClose', view).onclick = () => { ui.showMissing = false; render(); };
    $$('[data-jump]', view).forEach((b) => b.onclick = () => jumpTo(a, +b.dataset.jump));
    $('#cover3d', view).onclick = () => openCover3D(a);
    $('#miniprog', view).onclick = () => $('.side', view).scrollIntoView({ behavior: animOn() ? 'smooth' : 'auto', block: 'start' });
    // Pantalla completa del escritorio del álbum.
    const desk = $('#desk', view);
    $('#fsBtn', view).onclick = () => { document.body.classList.add('fs-album'); const el = document.documentElement; if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); render(); };
    $('#fsExit', view).onclick = () => { document.body.classList.remove('fs-album'); if (document.fullscreenElement) document.exitFullscreen(); render(); };
    // Pegatinas: emotes de League of Legends que se pegan y mueven en las páginas.
    if ($('#stickBtn', view)) $('#stickBtn', view).onclick = () => { ui.stickers = !ui.stickers; ui.selSticker = null; render(); };
    if (ui.stickers && !ro) bindStickers(view, a, shown);
    bindCards(view, a);
    window.RB3D.attachTilt(binder, '.pocket.owned');
    bindDrag(binder, a);
    view._albumGo = go;

    if (ui.celebrate !== null) { const el = $(`.pocket[data-idx="${ui.celebrate}"]`, view); if (el) el.closest('.pg').classList.add('page-complete'); ui.celebrate = null; }
    ui.justAdded = null;
    if (ui.openAnim === a.id) { ui.openAnim = null; if (animOn() && pos === 0) openingAnimation(a, m); }
  }

  function bindStickers(view, a, shown) {
    const pages = () => $$('.pg-in[data-page]', view);
    const tools = $('#stickTools', view);
    const select = (id) => { ui.selSticker = id; $$('.sticker', view).forEach((s) => s.classList.toggle('sel', s.dataset.sticker === id)); if (tools) tools.hidden = !id; };
    if (ui.selSticker) select(ui.selSticker);
    const save = (label, fn) => commit(label, (s) => { const x = s.albums.find((y) => y.id === a.id); x.stickers = x.stickers || []; fn(x); x.customized = true; }, { quiet: true });
    $$('[data-emote]', view).forEach((b) => b.onclick = () => {
      const target = shown.find((it) => typeof it === 'number') ?? shown[0];
      const sid = 's' + Math.random().toString(36).slice(2, 8);
      ui.selSticker = sid;
      save('Pegatina añadida', (x) => x.stickers.push({ id: sid, e: b.dataset.emote, item: target, x: 30 + Math.random() * 40, y: 30 + Math.random() * 40, r: Math.round(Math.random() * 30 - 15), s: 17 }));
    });
    $$('[data-st]', view).forEach((b) => b.onclick = () => {
      const id = ui.selSticker; if (!id) return;
      const k = b.dataset.st;
      if (k === 'del') ui.selSticker = null;
      save(k === 'del' ? 'Pegatina quitada' : 'Pegatina ajustada', (x) => {
        const st = x.stickers.find((s) => s.id === id); if (!st) return;
        if (k === 'del') x.stickers = x.stickers.filter((s) => s.id !== id);
        if (k === 'rot-') st.r = (st.r || 0) - 15; if (k === 'rot+') st.r = (st.r || 0) + 15;
        if (k === 'big') st.s = Math.min(40, (st.s || 17) + 3); if (k === 'small') st.s = Math.max(8, (st.s || 17) - 3);
      });
    });
    pages().forEach((pg) => {
      pg.querySelectorAll('.sticker').forEach((el) => {
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault(); e.stopPropagation(); select(el.dataset.sticker);
          try { el.setPointerCapture(e.pointerId); } catch { /* */ }
          const r = pg.getBoundingClientRect();
          const move = (ev) => { el.style.setProperty('--x', `${Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100))}%`); el.style.setProperty('--y', `${Math.max(0, Math.min(100, ((ev.clientY - r.top) / r.height) * 100))}%`); };
          const up = (ev) => {
            el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up);
            const x = Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100)); const y = Math.max(0, Math.min(100, ((ev.clientY - r.top) / r.height) * 100));
            save('Pegatina movida', (alb) => { const st = alb.stickers.find((s) => s.id === el.dataset.sticker); if (st) { st.x = +x.toFixed(1); st.y = +y.toFixed(1); } });
          };
          el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
        });
      });
    });
  }
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) document.body.classList.remove('fs-album'); if (route().name === 'album' || route().name === 'u') setTimeout(render, 80); });

  function openingAnimation(a, m) {
    const binder = $('#binder'); if (!binder) return;
    ui.flipping = true;
    const spread = isSpread();
    const coverFace = `<div style="position:absolute;inset:0">${coverHTML(a)}</div>`;
    const inner = pageInner(a, m, 'inner');
    binder.classList.add('opening');
    const fl = spread
      ? window.RBFlip.Flip(binder, { leftEl: $('#pgL'), rightEl: $('#pgR'), front: coverFace, back: inner, baseLeft: inner, baseRight: pageInner(a, m, m.items[1]), rigid: true, frontClass: 'cover-leaf' })
      : window.RBFlip.Flip(binder, { single: true, pageEl: $('#pgS'), front: coverFace, back: '', base: inner, rigid: true, frontClass: 'cover-leaf' });
    $('#pgL') && ($('#pgL').style.visibility = 'hidden');
    setTimeout(() => {
      if ($('#pgL')) $('#pgL').style.visibility = '';
      fl.animateTo(1, 1150).then(() => { fl.destroy(); binder.classList.remove('opening'); ui.flipping = false; bindCards(binder.parentElement, a); });
    }, 260);
  }

  async function turn(a, dir, flStart) {
    if (ui.flipping) return;
    const m = albumModel(a);
    const spread = isSpread(); const step = spread ? 2 : 1;
    const pos = ui.pos[a.id] || 0;
    const np = pos + dir * step;
    if (np < 0 || np >= m.items.length) { if (flStart) { flStart.animateTo(dir > 0 ? 0 : 1, 400).then(() => { flStart.destroy(); render(); }); } return; }
    if (!animOn() && !flStart) { ui.pos[a.id] = np; render(); return; }
    ui.flipping = true;
    const fl = flStart || makeFlip(a, m, dir);
    await fl.animateTo(dir > 0 ? 1 : 0, 820);
    ui.pos[a.id] = np; fl.destroy(); ui.flipping = false; render();
  }
  function makeFlip(a, m, dir) {
    const binder = $('#binder');
    const spread = isSpread(); const step = spread ? 2 : 1;
    const pos = ui.pos[a.id] || 0; const np = pos + dir * step;
    const it = (i) => pageInner(a, m, m.items[i]);
    if (spread) {
      return dir > 0
        ? window.RBFlip.Flip(binder, { leftEl: $('#pgL'), rightEl: $('#pgR'), front: it(pos + 1), back: it(np), baseLeft: it(pos), baseRight: it(np + 1) })
        : window.RBFlip.Flip(binder, { leftEl: $('#pgL'), rightEl: $('#pgR'), front: it(np + 1), back: it(pos), baseLeft: it(np), baseRight: it(pos + 1), start: 1 });
    }
    return dir > 0
      ? window.RBFlip.Flip(binder, { single: true, pageEl: $('#pgS'), front: it(pos), back: '', base: it(np) })
      : window.RBFlip.Flip(binder, { single: true, pageEl: $('#pgS'), front: it(np), back: '', base: it(pos), start: 1 });
  }
  // Arrastrar la página con el ratón o el dedo.
  function bindDrag(binder, a) {
    let st = null;
    binder.addEventListener('pointerdown', (e) => {
      if (ui.flipping || ui.stickers || e.button > 0 || e.target.closest('.quick')) return;
      st = { x: e.clientX, y: e.clientY, id: e.pointerId, fl: null, dir: 0, t: performance.now(), lastX: e.clientX };
    });
    binder.addEventListener('pointermove', (e) => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x; const dy = e.clientY - st.y;
      if (!st.fl) {
        if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        const dir = dx < 0 ? 1 : -1;
        const m = albumModel(a); const step = isSpread() ? 2 : 1; const np = (ui.pos[a.id] || 0) + dir * step;
        if (np < 0 || np >= m.items.length) { st = null; return; }
        if (!animOn()) { if (Math.abs(dx) > 60) { st = null; binder._dragged = true; turn(a, dir); } return; }
        try { binder.setPointerCapture(e.pointerId); } catch { /* puntero no capturable */ }
        st.dir = dir; st.fl = makeFlip(a, m, dir); ui.flipping = true; binder._dragged = true;
      }
      const W = st.fl.width * 1.5;
      st.fl.set(st.dir > 0 ? -dx / W : 1 - dx / W);
      st.v = (e.clientX - st.lastX) / Math.max(1, performance.now() - st.t); st.lastX = e.clientX; st.t = performance.now();
    });
    const end = async () => {
      if (!st) return;
      const s = st; st = null;
      setTimeout(() => { binder._dragged = false; }, 60);
      if (!s.fl) return;
      const p = s.fl.p; const fast = Math.abs(s.v || 0) > 0.5;
      const complete = s.dir > 0 ? (p > 0.32 || (fast && s.v < 0)) : (p < 0.68 || (fast && s.v > 0));
      if (complete) { ui.flipping = false; await turn(a, s.dir, s.fl); }
      else { await s.fl.animateTo(s.dir > 0 ? 0 : 1, 420); s.fl.destroy(); ui.flipping = false; render(); }
    };
    binder.addEventListener('pointerup', end); binder.addEventListener('pointercancel', end);
  }
  function jumpTo(a, idx) {
    const page = Math.floor(idx / a.pageSize);
    ui.pos[a.id] = page + 1; ui.showMissing = false; render();
    const el = $(`.pocket[data-idx="${idx}"]`);
    if (el) { el.scrollIntoView({ block: 'center', behavior: animOn() ? 'smooth' : 'auto' }); el.classList.add('flash'); el.focus({ preventScroll: true }); }
  }
  function bindCards(root, a) {
    $$('[data-card]', root).forEach((el) => {
      if (el._bound) return; el._bound = true;
      const open = () => openCard(el.dataset.card, a ? a.id : null);
      el.addEventListener('click', (e) => { if (e.target.closest('[data-quick]') || ($('#binder') && $('#binder')._dragged)) return; open(); });
      el.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); open(); } });
    });
    $$('[data-quick]', root).forEach((b) => {
      if (b._bound) return; b._bound = true;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = P(b.dataset.quick);
        const lang = a && a.lang !== 'any' ? a.lang : 'EN';
        ui.justAdded = p.id;
        if (a) {
          const m = albumModel(a); const idx = m.list.indexOf(p.id); const page = Math.floor(idx / a.pageSize);
          const ids = C.pageSlice(m.list, a.pageSize, page); const owned = C.ownedSet(state, a.lang);
          if (!owned.has(p.id) && ids.every((x) => x === p.id || owned.has(x))) { ui.celebrate = idx; setTimeout(() => toast(`¡Página ${page + 1} completa!`, { emote: randEmote() }), 300); }
        }
        commit(`+1 ${p.name}`, (s) => C.addQty(s, p.id, 1, { lang, finish: p.finish || 'Normal' }));
      });
    });
  }
  function openCover3D(a) {
    const d = design(a);
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;inset:0';
    const back = `<div style="position:absolute;inset:0;container-type:inline-size">${coverHTML({ ...a, name: '', cover: null }, { design: { ...d, window: 'emblema' } })}</div>`;
    window.RB3D.openViewer({ title: a.name, subtitle: 'Portada · vista 3D', cards: [{ img: '', name: a.name, landscape: false, holo: d.foil === 'holo', back }] });
    const face = $('.v3d .v3d-face.front');
    face.innerHTML = `<div style="position:absolute;inset:0">${coverHTML(a)}</div><i class="v3d-glare"></i>`;
    face.style.borderRadius = '3px 12px 12px 3px';
  }

  // ---------- Ficha de carta ----------
  function openCard(id, albumId) {
    ui.drawer = { id, albumId, face: 0, pair: false };
    renderDrawer();
    $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false');
    $('#scrim').hidden = false;
    setTimeout(() => $('#drawerClose') && $('#drawerClose').focus(), 40);
  }
  function closeCard() {
    if (!ui.drawer) return;
    const id = ui.drawer.id; ui.drawer = null;
    $('#drawer').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true');
    $('#scrim').hidden = true;
    const back = $(`[data-card="${CSS.escape(id)}"]`); if (back) back.focus({ preventScroll: true });
  }
  function view3D(p, a) {
    const partner = pairOf(a, p.id);
    const ownsFoil = state.lots.some((l) => l.printId === p.id && l.finish !== 'Normal');
    const backFor = (c) => (c.faces ? `<div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:12%;background:#0d1326;color:#f6eedf;font-family:var(--display);font-size:1.3rem">${esc(c.faces[1])}<br><span style="font-family:var(--font);font-size:.8rem;opacity:.7">La fuente no publica la imagen de esta cara. El token cuenta como un solo hueco.</span></div>` : null);
    const card = (c) => ({ img: c.img, name: c.name, landscape: c.orient === 'landscape', holo: isHolo(c) || ownsFoil, back: backFor(c) || A.cardBack(A.backVariant(c)) });
    window.RB3D.openViewer({ title: p.name, subtitle: `${p.set} ${p.no} · ${C.KIND_LABEL[p.kind]}${partner ? ' · díptico' : ''}`, cards: partner && ui.drawer && ui.drawer.pair ? [card(p), card(P(partner))] : [card(p)] });
  }
  function renderDrawer() {
    const d = ui.drawer; if (!d) return;
    const st = cur(); const ro = RO();
    const p = P(d.id);
    const a = st.albums.find((x) => x.id === d.albumId);
    const col = COL(p.set);
    const lots = st.lots.filter((l) => l.printId === p.id);
    const total = C.qty(st, p.id);
    const finishes = p.finish === 'Metal' ? ['Metal'] : ['Normal', 'Foil'];
    const partner = pairOf(a, p.id);
    let where = '';
    if (a) { const m = albumModel(a); const idx = m.list.indexOf(p.id); if (idx >= 0) where = `Hueco ${idx + 1} · página ${Math.floor(idx / a.pageSize) + 1} de «${a.name}»`; }
    let art;
    if (d.pair && partner) art = `<div class="pairrow">${imgTag(p, 500, '', p.name)}${imgTag(P(partner), 500, '', P(partner).name)}</div>`;
    else if (p.faces && d.face === 1) art = `<div class="face-missing"><div><b>${esc(p.faces[1])}</b><br>La fuente no publica la imagen de esta cara.<br>El token cuenta como un solo hueco.</div></div>`;
    else art = `<div class="tiltcard ${p.orient === 'landscape' ? 'land' : ''}"><img src="${esc(p.img)}" alt="${esc(p.name)}"></div>`;
    const defLang = a && a.lang !== 'any' ? a.lang : 'EN';

    $('#drawer').innerHTML = `
      <div class="drawer-head"><div style="flex:1;min-width:0"><div class="eyebrow">${esc(p.set)} ${esc(p.no)}${p.den ? ` / ${p.den}` : ''} · ${esc(C.KIND_LABEL[p.kind])}</div><h2>${esc(p.name)}</h2></div><button class="iconbtn" id="drawerClose" aria-label="Cerrar">${gl('close')}</button></div>
      <div class="drawer-body">
        <div class="showcard" id="showcard" title="Ver en 3D">${art}<button class="btn glass sm open3d" id="open3d">${gl('card3d')} Ver en 3D</button></div>
        ${p.faces || partner ? `<div class="row" style="justify-content:center">${p.faces ? `<div class="seg">${p.faces.map((f, i) => `<button type="button" data-face="${i}" aria-pressed="${d.face === i}">${esc(f)}</button>`).join('')}</div>` : ''}
          ${partner ? `<button class="btn sm" id="pairBtn">${gl('pages', 'sm')} ${d.pair ? 'Ver carta sola' : 'Ver díptico completo'}</button>` : ''}</div>` : ''}
        <div class="own">
          <div class="total"><span>${ro ? 'Tiene' : 'Tienes'}</span><b>${total}</b></div>
          ${ro ? `<span class="muted small">${C.tradeQty(st, p.id) ? `${C.tradeQty(st, p.id)} para intercambio` : ''}</span>` : `<div class="stepper"><button type="button" id="minus1" aria-label="Quitar una copia" ${total ? '' : 'disabled'}>${gl('minus')}</button><output>${total}</output><button type="button" id="plus1" aria-label="Añadir una copia">${gl('plus')}</button></div>`}
          <span class="spacer"></span>
          ${ro ? (st.wish[p.id] ? `<span class="chip gold">${gl('wish', 'sm')} La busca</span>` : '') : `<button type="button" class="wishbtn" id="wishBtn" aria-pressed="${!!st.wish[p.id]}">${gl('wish')} ${st.wish[p.id] ? 'Deseada' : 'Desear'}</button>`}
        </div>
        ${where ? `<p class="small muted">${esc(where)}</p>` : ''}
        <dl class="facts">
          <dt>Colección</dt><dd>${esc(col ? col.name : p.set)}</dd>
          <dt>Versión</dt><dd>${esc(C.KIND_LABEL[p.kind])}${p.finish ? ` · ${esc(p.finish)}` : ''}</dd>
          <dt>Tipo</dt><dd>${esc([p.type, p.supertype].filter(Boolean).join(' · '))}${p.domains.length ? ` · ${esc(p.domains.join(', '))}` : ''}</dd>
          <dt>Rareza</dt><dd>${esc(p.rarity || '—')}</dd>
          ${p.artist ? `<dt>Ilustración</dt><dd>${esc(p.artist)}</dd>` : ''}
          <dt>Verificación</dt><dd>${p.verify === 'fuente' ? '<span class="chip ok">Según fuente</span>' : '<span class="chip warn">Pendiente de revisar</span>'} <span class="tiny muted">${esc(CAT.meta.version)}</span></dd>
        </dl>
        ${PR.prints[p.id] ? `<div class="price-box"><div><span>Normal</span><b>${money(PR.prints[p.id][0])}</b></div><div><span>Foil</span><b>${money(PR.prints[p.id][1])}</b></div><div><span>Desde</span><b>${money(PR.prints[p.id][2])}</b></div>${total ? `<div><span>Tus copias</span><b>${money(lotsValue(st, (x) => x === p.id))}</b></div>` : ''}<p class="tiny faint">${esc(priceNote())}</p></div>` : '<p class="tiny faint">Sin precio de mercado para esta versión.</p>'}
        ${p.notes.length ? `<div class="notice">${p.notes.map(esc).join('<br>')}</div>` : ''}
        ${a && !ro ? `<div class="row"><button class="btn sm" id="setCover">${gl('workshop', 'sm')} ${a.cover === p.id ? 'Portada del álbum ✓' : 'Usar en la portada'}</button>
          <button class="btn sm" id="setFeat" ${!a.featured.includes(p.id) && a.featured.length >= 4 ? 'disabled title="Máximo 4 destacadas"' : ''}>${gl('showcase', 'sm')} ${a.featured.includes(p.id) ? 'Destacada ✓' : 'Destacar'}</button></div>` : ''}
        ${ro ? '' : `<div>
          <div class="row" style="margin-bottom:10px"><h3>Ejemplares y lotes</h3><span class="spacer"></span><button class="btn sm" id="addLot">${gl('add', 'sm')} Lote</button></div>
          <p class="tiny faint" style="margin-bottom:10px">Edición ${esc(col ? col.name : p.set)}. Idioma y acabado los declaras tú; Runario no certifica autenticidad ni valida acabados que la fuente no publica.</p>
          <div style="display:flex;flex-direction:column;gap:12px">${lots.length ? lots.map((l) => `<div class="lot" data-lot="${l.id}">
            <label class="field"><span>Idioma</span><select data-f="lang">${Object.entries(C.LANGS).map(([k, v]) => `<option value="${k}" ${l.lang === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            <label class="field"><span>Acabado</span><select data-f="finish">${finishes.map((f) => `<option ${l.finish === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
            <label class="field"><span>Estado</span><select data-f="condition">${C.CONDITIONS.map((c) => `<option ${l.condition === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
            <div class="field"><span>Cantidad</span><div class="stepper"><button type="button" data-step="qty" data-d="-1" aria-label="Menos">${gl('minus')}</button><output>${l.qty}</output><button type="button" data-step="qty" data-d="1" aria-label="Más">${gl('plus')}</button></div></div>
            <div class="field"><span>${gl('trade', 'sm')} Intercambio</span><div class="stepper"><button type="button" data-step="trade" data-d="-1" aria-label="Menos">${gl('minus')}</button><output>${l.trade || 0}</output><button type="button" data-step="trade" data-d="1" aria-label="Más" ${l.trade >= l.qty ? 'disabled' : ''}>${gl('plus')}</button></div></div>
            <div class="field" style="justify-content:flex-end"><button type="button" class="btn sm danger" data-del>${gl('urn', 'sm')} Quitar</button></div>
            <label class="field full"><span>${gl('pin', 'sm')} Ubicación</span><input type="text" data-f="location" value="${esc(l.location)}" placeholder="Carpeta, caja, fila…"></label>
            <label class="field full"><span>${gl('letter', 'sm')} Notas privadas</span><textarea data-f="notes" placeholder="Solo las ves tú">${esc(l.notes)}</textarea></label>
          </div>`).join('') : '<p class="muted small">Sin ejemplares registrados.</p>'}</div></div>`}
      </div>`;
    const dr = $('#drawer');
    $('#drawerClose', dr).onclick = closeCard;
    $('#open3d', dr).onclick = (e) => { e.stopPropagation(); view3D(p, a); };
    $('#showcard', dr).onclick = () => view3D(p, a);
    window.RB3D.attachTilt($('#showcard', dr), '.tiltcard');
    $$('[data-face]', dr).forEach((b) => b.onclick = () => { ui.drawer.face = +b.dataset.face; renderDrawer(); });
    if ($('#pairBtn', dr)) $('#pairBtn', dr).onclick = () => { ui.drawer.pair = !ui.drawer.pair; renderDrawer(); };
    if (ro) return;
    $('#plus1', dr).onclick = () => { ui.justAdded = p.id; commit(`+1 ${p.name}`, (s) => C.addQty(s, p.id, 1, { lang: defLang, finish: p.finish || 'Normal' })); };
    $('#minus1', dr).onclick = () => total && commit(`−1 ${p.name}`, (s) => C.addQty(s, p.id, -1, { lang: defLang, finish: p.finish || 'Normal' }));
    $('#wishBtn', dr).onclick = () => commit(state.wish[p.id] ? 'Quitada de deseos' : 'Añadida a deseos', (s) => { if (s.wish[p.id]) delete s.wish[p.id]; else s.wish[p.id] = true; });
    if ($('#setCover', dr)) $('#setCover', dr).onclick = () => commit('Portada actualizada', (s) => { const x = s.albums.find((y) => y.id === a.id); x.cover = x.cover === p.id ? null : p.id; x.customized = true; });
    if ($('#setFeat', dr)) $('#setFeat', dr).onclick = () => commit('Destacadas actualizadas', (s) => { const x = s.albums.find((y) => y.id === a.id); x.featured = x.featured.includes(p.id) ? x.featured.filter((y) => y !== p.id) : [...x.featured, p.id].slice(0, 4); x.customized = true; });
    $('#addLot', dr).onclick = () => commit('Lote añadido', (s) => s.lots.push(C.makeLot(p.id, { lang: defLang, finish: p.finish || 'Normal', qty: 1 })));
    $$('[data-lot]', dr).forEach((row) => {
      const lid = row.dataset.lot;
      const upd = (fn) => commit('Lote editado', (s) => { const l = s.lots.find((x) => x.id === lid); if (l) fn(l); }, { quiet: true });
      $$('select[data-f]', row).forEach((sel) => sel.onchange = () => upd((l) => { l[sel.dataset.f] = sel.value; }));
      $$('input[data-f], textarea[data-f]', row).forEach((inp) => inp.onchange = () => upd((l) => { l[inp.dataset.f] = inp.value.trim(); }));
      $$('[data-step]', row).forEach((b) => b.onclick = () => commit(b.dataset.step === 'qty' ? 'Cantidad cambiada' : 'Intercambio cambiado', (s) => {
        const l = s.lots.find((x) => x.id === lid); const dd = +b.dataset.d;
        if (b.dataset.step === 'qty') { l.qty = Math.max(0, l.qty + dd); l.trade = Math.min(l.trade || 0, l.qty); } else l.trade = Math.max(0, Math.min(l.qty, (l.trade || 0) + dd));
      }));
      $('[data-del]', row).onclick = () => commit('Lote eliminado', (s) => { s.lots = s.lots.filter((x) => x.id !== lid); });
    });
  }

  // ---------- Taller de encuadernación ----------
  function openWorkshop(albumId) {
    const a0 = state.albums.find((x) => x.id === albumId);
    const f = JSON.parse(JSON.stringify(a0));
    f.design = design(a0);
    const m0 = albumModel(a0);
    let order = C.orderedEntries(m0.cl.entries, f.order);
    let tab = 'cover';
    const optBtn = (key, val, label, inner) => `<button type="button" class="opt" data-k="${key}" data-v="${val}" aria-pressed="${f.design[key] === val}">${inner}<span>${esc(label)}</span></button>`;
    const preview = () => { $('#wsPreview').innerHTML = bookHTML(f, '', { design: f.design }); };
    const tabBody = () => {
      const D = f.design;
      if (tab === 'cover') return `
        <label class="field"><span>Título del álbum</span><input type="text" id="wsName" value="${esc(f.name)}" maxlength="60"></label>
        <div><h3>Plantilla de colección</h3><p class="small muted" style="margin:4px 0 10px">Aplica un conjunto completo; luego puedes cambiar cada detalle.</p>
          <div class="pick-grid">${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="pick" data-preset="${k}" aria-pressed="${f.theme === k && !f.design._custom}">${miniCover(p)}<b>${esc(p.label)}</b><span class="tiny muted">${esc(p.note)}</span></button>`).join('')}</div></div>
        <div><h3>Material</h3><div class="opt-grid" style="margin-top:10px">${Object.entries(MATERIALS).map(([k, v]) => optBtn('material', k, v, `<span class="sw"><span class="cover-face" data-mat="${k}" style="${esc(`--mat:${D.color}`)}"><span class="mat"></span></span></span>`)).join('')}</div></div>
        <div><h3>Color de la cubierta</h3><div class="swatches" style="margin-top:10px">${COLORS.map((c) => `<button type="button" data-color="${c}" style="background:${c}" aria-label="Color ${c}" aria-pressed="${D.color === c}"></button>`).join('')}<input type="color" id="wsColor" value="${D.color}" aria-label="Color personalizado"></div></div>
        <div><h3>Estampado</h3><div class="opt-grid" style="margin-top:10px">${Object.entries(FOIL_NAMES).map(([k, v]) => optBtn('foil', k, v, `<span class="sw" style="background:${A.foilCSS(k)}"></span>`)).join('')}</div></div>
        <div><h3>Emblema</h3><div class="opt-grid" style="margin-top:10px">${A.EMBLEMS.map((k) => optBtn('emblem', k, EMBLEM_NAMES[k], `<span class="emb-sw" style="${esc(`--emb:${A.emblemMask(k)};--foil:${A.foilCSS(D.foil)}`)}"></span>`)).join('')}</div></div>
        <div class="row" style="gap:28px;align-items:flex-start">
          <div class="field"><span>Composición</span><div class="seg"><button type="button" data-k="window" data-v="carta" aria-pressed="${D.window === 'carta'}">Carta en ventana</button><button type="button" data-k="window" data-v="emblema" aria-pressed="${D.window === 'emblema'}">Solo emblema</button></div></div>
          <div class="field"><span>Cinta marcapáginas</span><div class="swatches">${RIBBONS.map((c) => `<button type="button" data-ribbon="${c}" style="background:${c}" aria-label="Cinta ${c}" aria-pressed="${D.ribbon === c}"></button>`).join('')}</div></div></div>
        <p class="small muted">La carta de la ventana: ${f.cover ? `<b>${esc(P(f.cover).name)}</b> <button type="button" class="btn sm ghost" id="rmCover">Automática</button>` : 'automática (la primera que tengas). Elige otra desde su ficha con «Usar en la portada».'}</p>`;
      if (tab === 'inside') return `
        <div><h3>Papel de las páginas</h3><div class="opt-grid" style="margin-top:10px">${Object.entries(PAPERS).map(([k, [v, c]]) => optBtn('paper', k, v, `<span class="sw" style="background:${c}"></span>`)).join('')}</div></div>
        <div><h3>Fundas</h3><div class="opt-grid" style="margin-top:10px">${Object.entries(SLEEVES).map(([k, v]) => optBtn('sleeves', k, v, `<span class="sw" style="background:${k === 'cristal' ? 'linear-gradient(125deg,rgb(255 255 255 / .5),rgb(255 255 255 / .05) 40%,transparent 60%,rgb(255 255 255 / .2)), #6b7b8f' : k === 'mate' ? 'linear-gradient(#9aa4b0,#7d8794)' : '#55504a'}"></span>`)).join('')}</div></div>
        <div><h3>Cartas destacadas</h3><p class="small muted" style="margin:4px 0 10px">Aparecen en la portada interior. Se eligen desde la ficha de cada carta (máximo 4).</p>
          <div class="row">${f.featured.length ? f.featured.map((id) => `<span class="chip">${esc(P(id).name)} <button type="button" class="iconcheck" data-rmfeat="${esc(id)}" aria-label="Quitar">${gl('close', 'sm')}</button></span>`).join('') : '<span class="muted small">Ninguna todavía.</span>'}</div></div>`;
      if (tab === 'order') return `<div class="row"><p class="small muted" style="flex:1">Arrastra o usa las flechas. Reordenar no cambia cartas, cantidades ni el número de huecos (${order.length}).</p><button type="button" class="btn sm" id="resetOrder">Orden de checklist</button></div>
        <ol class="order-list" id="orderList">${order.map((id, i) => `<li draggable="true" data-id="${esc(id)}"><span class="grip" aria-hidden="true">⋮⋮</span><span class="tiny faint" style="min-width:2.4em">${i + 1}</span>${imgTag(P(id), 80)}<span class="t">${esc(P(id).no)} · ${esc(P(id).name)}</span>
          <button type="button" class="mini" data-mv="-1" aria-label="Subir">${gl('prev', 'sm')}</button><button type="button" class="mini" data-mv="1" aria-label="Bajar">${gl('next', 'sm')}</button></li>`).join('')}</ol>`;
      return `<p class="small muted">Une dos huecos para verlos juntos en la ficha y en 3D. ${esc(CAT.meta.diptychNote)} Los pares personales no cuentan para el logro oficial.</p>
        <div class="row"><select id="pA" style="flex:1;min-width:180px">${order.map((id) => `<option value="${esc(id)}">${esc(`${P(id).no} · ${P(id).name}`)}</option>`).join('')}</select>
          <select id="pB" style="flex:1;min-width:180px">${order.map((id, i) => `<option value="${esc(id)}" ${i === 1 ? 'selected' : ''}>${esc(`${P(id).no} · ${P(id).name}`)}</option>`).join('')}</select><button type="button" class="btn sm" id="pAdd">Unir</button></div>
        <div class="row">${(f.pairs || []).map(([x, y], i) => `<span class="chip">${esc(P(x)?.name)} + ${esc(P(y)?.name)} <button type="button" class="iconcheck" data-rmpair="${i}" aria-label="Separar">${gl('close', 'sm')}</button></span>`).join('')}</div>`;
    };
    const keep = () => { const n = $('#wsName'); if (n) f.name = n.value; };
    const drawTab = () => {
      $('#wsTab').innerHTML = tabBody();
      $$('.tabs button', $('#modal')).forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab));
      const w = $('#wsTab');
      $$('[data-preset]', w).forEach((b) => b.onclick = () => { keep(); f.theme = b.dataset.preset; f.design = { ...PRESETS[f.theme] }; preview(); drawTab(); });
      $$('[data-k]', w).forEach((b) => b.onclick = () => { keep(); f.design[b.dataset.k] = b.dataset.v; f.design._custom = true; preview(); drawTab(); });
      $$('[data-color]', w).forEach((b) => b.onclick = () => { keep(); f.design.color = b.dataset.color; f.design._custom = true; preview(); drawTab(); });
      $$('[data-ribbon]', w).forEach((b) => b.onclick = () => { keep(); f.design.ribbon = b.dataset.ribbon; f.design._custom = true; preview(); drawTab(); });
      if ($('#wsColor', w)) $('#wsColor', w).oninput = (e) => { f.design.color = e.target.value; f.design._custom = true; preview(); };
      if ($('#wsName', w)) $('#wsName', w).oninput = () => { keep(); preview(); };
      if ($('#rmCover', w)) $('#rmCover', w).onclick = () => { f.cover = null; preview(); drawTab(); };
      $$('[data-rmfeat]', w).forEach((b) => b.onclick = () => { f.featured = f.featured.filter((x) => x !== b.dataset.rmfeat); drawTab(); });
      if ($('#resetOrder', w)) $('#resetOrder', w).onclick = () => { order = m0.cl.entries.slice(); drawTab(); };
      if ($('#pAdd', w)) $('#pAdd', w).onclick = () => { const x = $('#pA').value; const y = $('#pB').value; if (x !== y) { f.pairs = (f.pairs || []).filter((pp) => !pp.includes(x) && !pp.includes(y)); f.pairs.push([x, y]); } drawTab(); };
      $$('[data-rmpair]', w).forEach((b) => b.onclick = () => { f.pairs.splice(+b.dataset.rmpair, 1); drawTab(); });
      const list = $('#orderList', w);
      if (list) {
        $$('[data-mv]', list).forEach((b) => b.onclick = () => {
          const li = b.closest('li'); const i = order.indexOf(li.dataset.id); const j = i + +b.dataset.mv;
          if (j < 0 || j >= order.length) return;
          [order[i], order[j]] = [order[j], order[i]]; const s = list.scrollTop; drawTab(); $('#orderList').scrollTop = s;
          const nb = $(`#orderList li[data-id="${CSS.escape(order[j])}"] [data-mv="${b.dataset.mv}"]`); if (nb) nb.focus();
        });
        let dragId = null;
        $$('li', list).forEach((li) => {
          li.addEventListener('dragstart', () => { dragId = li.dataset.id; li.classList.add('dragging'); });
          li.addEventListener('dragend', () => li.classList.remove('dragging'));
          li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('over'); });
          li.addEventListener('dragleave', () => li.classList.remove('over'));
          li.addEventListener('drop', (e) => { e.preventDefault(); li.classList.remove('over'); if (!dragId || dragId === li.dataset.id) return; order.splice(order.indexOf(dragId), 1); order.splice(order.indexOf(li.dataset.id), 0, dragId); const s = list.scrollTop; drawTab(); $('#orderList').scrollTop = s; });
        });
      }
    };
    const m = modal(`<form method="dialog">
      <div class="modal-head">${gl('workshop', 'lg')}<h2 id="modalTitle">Taller de encuadernación</h2><button class="iconbtn" value="cancel" aria-label="Cerrar">${gl('close')}</button></div>
      <div class="modal-body"><div class="workshop"><div class="preview" id="wsPreview"></div><div>
        <div class="tabs" role="tablist">${[['cover', 'Cubierta', 'workshop'], ['inside', 'Interior', 'pocket'], ['order', 'Orden', 'pages'], ['pairs', 'Dípticos', 'pages']].map(([k, l, g]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}">${gl(g, 'sm')} ${l}</button>`).join('')}</div>
        <div id="wsTab" style="display:flex;flex-direction:column;gap:22px"></div></div></div></div>
      <div class="modal-foot"><button type="button" class="btn danger" id="delAlbum">${gl('urn', 'sm')} Eliminar álbum</button><span class="spacer"></span><button class="btn" value="cancel">Cancelar</button><button type="button" class="btn gold" id="saveWs">${gl('check')} Guardar encuadernación</button></div></form>`);
    $$('.tabs button', m).forEach((b) => b.onclick = () => { keep(); tab = b.dataset.tab; drawTab(); });
    preview(); drawTab();
    $('#saveWs', m).onclick = () => {
      keep();
      const isDefault = order.every((id, i) => id === m0.cl.entries[i]);
      const { _custom, ...des } = f.design;
      const presetSame = Object.keys(PRESETS[f.theme]).every((k) => ['label', 'note'].includes(k) || PRESETS[f.theme][k] === des[k]);
      m.close();
      commit('Encuadernación guardada', (s) => {
        const x = s.albums.find((y) => y.id === albumId);
        Object.assign(x, { name: f.name.trim() || x.name, theme: f.theme, design: presetSame ? null : des, cover: f.cover, featured: f.featured, pairs: f.pairs || [], order: isDefault ? [] : order.slice(), customized: true });
      });
    };
    $('#delAlbum', m).onclick = () => {
      m.close();
      commit(`Álbum «${a0.name}» eliminado (tus cartas se conservan)`, (s) => { s.albums = s.albums.filter((y) => y.id !== albumId); }, { noRender: true });
      location.hash = '#/';
    };
  }

  // ---------- Gestionar ----------
  function manageRows() {
    const g = ui.manage; const st = state;
    const album = g.album && st.albums.find((a) => a.id === g.album);
    const pool = album ? C.orderedEntries(C.resolveChecklist(CAT, album).entries, album.order).map(P) : CAT.prints;
    const owned = C.ownedSet(st);
    const q = g.q.trim().toLowerCase();
    return pool.filter((p) => {
      if (g.set && p.set !== g.set) return false;
      if (g.kind && p.kind !== g.kind) return false;
      if (g.rarity && p.rarity !== g.rarity) return false;
      if (g.status === 'owned' && !owned.has(p.id)) return false;
      if (g.status === 'missing' && owned.has(p.id)) return false;
      if (g.status === 'wish' && !st.wish[p.id]) return false;
      if (g.status === 'trade' && !C.tradeQty(st, p.id)) return false;
      if (g.status === 'dupes' && C.qty(st, p.id) < 2) return false;
      if (q && !`${p.name} ${p.set} ${p.no} ${p.set}-${p.no} ${p.tags.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }
  const PER_PAGE = 60;
  function viewManage(view) {
    const g = ui.manage;
    const album = g.album && state.albums.find((a) => a.id === g.album);
    if (g.album && !album) g.album = '';
    const rows = manageRows();
    const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    g.page = Math.min(g.page, pages - 1);
    const pageRows = rows.slice(g.page * PER_PAGE, (g.page + 1) * PER_PAGE);
    const rarities = [...new Set(CAT.prints.map((p) => p.rarity).filter(Boolean))];
    const sel = g.sel;
    const stepper = (p, k, v) => `<div class="stepper"><button type="button" data-row="${esc(p.id)}" data-k="${k}" data-d="-1" aria-label="Menos" ${v ? '' : 'disabled'}>${gl('minus')}</button><output>${v}</output><button type="button" data-row="${esc(p.id)}" data-k="${k}" data-d="1" aria-label="Más">${gl('plus')}</button></div>`;
    const wishBtn = (p) => `<button type="button" class="iconcheck" data-wish="${esc(p.id)}" aria-pressed="${!!state.wish[p.id]}" aria-label="Deseo" title="Lista de deseos">${gl('wish')}</button>`;
    const locOf = (id) => [...new Set(state.lots.filter((l) => l.printId === id && l.location).map((l) => l.location))].join(', ');
    view.innerHTML = `<div class="page">
      <div class="pagehead"><div><div class="eyebrow">Mesa de registro</div><h1>Gestionar</h1><p class="muted">Para cuando vuelves de la tienda con un taco de cartas. Lo que apuntes aquí aparece al momento en tus álbumes.</p></div><span class="spacer"></span>
        ${album ? `<div class="seg"><button type="button" id="toAlbum" aria-pressed="false">${gl('pages', 'sm')} Mi álbum</button><button type="button" aria-pressed="true">${gl('ledger', 'sm')} Gestionar</button></div>` : ''}
        <button class="btn" id="exportCsv">${gl('export')} Exportar CSV</button>
        <label class="btn" for="importCsv">${gl('import')} Importar CSV</label><input type="file" id="importCsv" accept=".csv,text/csv" class="sr"></div>
      ${album ? `<div class="notice info" style="margin-bottom:16px"><span>Filtrando por el álbum <b>${esc(album.name)}</b> · ${esc(C.resolveChecklist(CAT, album).label)}</span><span class="spacer"></span><button class="btn sm" id="clearAlbum">Ver todo el catálogo</button></div>` : ''}
      <div class="mtools">
        <label class="field"><span>${gl('search', 'sm')} Buscar</span><input type="search" id="mq" value="${esc(g.q)}" placeholder="Nombre, código (OGN 012) o campeón"></label>
        <label class="field"><span>Colección</span><select id="mset"><option value="">Todas</option>${CAT.collections.filter((c) => !c.provisional).map((c) => `<option value="${c.id}" ${g.set === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
        <label class="field"><span>Versión</span><select id="mkind"><option value="">Todas</option>${Object.entries(C.KIND_LABEL).map(([k, v]) => `<option value="${k}" ${g.kind === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Rareza</span><select id="mrar"><option value="">Todas</option>${rarities.map((r) => `<option ${g.rarity === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
        <label class="field"><span>Estado</span><select id="mstat">${[['', 'Todas'], ['owned', 'Poseídas'], ['missing', 'Faltantes'], ['dupes', 'Repetidas'], ['wish', 'Deseadas'], ['trade', 'Para intercambio']].map(([k, v]) => `<option value="${k}" ${g.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      </div>
      ${sel.size ? `<div class="batchbar" role="region" aria-label="Edición por lotes"><b>${sel.size} seleccionadas</b><span class="spacer"></span>
        <button class="btn sm" data-b="plus">+1</button><button class="btn sm" data-b="minus">−1</button><button class="btn sm" data-b="set">Fijar cantidad…</button>
        <button class="btn sm" data-b="wish">Desear</button><button class="btn sm" data-b="unwish">Quitar deseo</button><button class="btn sm" data-b="trade">Repetidas a intercambio</button>
        <button class="btn sm" data-b="loc">Ubicación…</button><button class="btn sm" data-b="clear">Deseleccionar</button></div>` : ''}
      <div class="row" style="margin-bottom:10px"><span class="small muted">${rows.length} resultados</span><span class="spacer"></span><button class="btn sm ghost" id="selPage">Seleccionar página</button><button class="btn sm ghost" id="selAll">Seleccionar los ${rows.length}</button></div>
      <div class="tablewrap"><table class="inv"><thead><tr><th><span class="sr">Seleccionar</span></th><th></th><th>Código</th><th>Nombre</th><th>Versión</th><th>Rareza</th><th>Precio</th><th>Tienes</th><th>Intercambio</th><th>Deseo</th><th>Ubicación</th></tr></thead>
        <tbody>${pageRows.map((p) => `<tr class="${sel.has(p.id) ? 'sel' : ''}"><td><input type="checkbox" data-sel="${esc(p.id)}" ${sel.has(p.id) ? 'checked' : ''} aria-label="Seleccionar ${esc(p.name)}"></td>
          <td>${imgTag(p, 120, `thumb${p.orient === 'landscape' ? ' land' : ''}`).replace('<img', `<img data-open="${esc(p.id)}"`)}</td>
          <td class="code">${esc(p.set)} ${esc(p.no)}</td><td><span class="nm" data-open="${esc(p.id)}" role="button" tabindex="0">${esc(p.name)}</span>${p.verify !== 'fuente' ? ' <span class="chip warn">Revisar</span>' : ''}</td>
          <td>${esc(C.KIND_LABEL[p.kind])}${p.finish ? ` · ${esc(p.finish)}` : ''}</td><td>${esc(p.rarity || '')}</td><td class="code">${money(priceUSD(p))}</td>
          <td>${stepper(p, 'qty', C.qty(state, p.id))}</td><td>${stepper(p, 'trade', C.tradeQty(state, p.id))}</td><td>${wishBtn(p)}</td><td class="small muted">${esc(locOf(p.id))}</td></tr>`).join('')}</tbody></table></div>
      <div class="mcards">${pageRows.map((p) => `<div class="mcard ${sel.has(p.id) ? 'sel' : ''}"><input type="checkbox" data-sel="${esc(p.id)}" ${sel.has(p.id) ? 'checked' : ''} aria-label="Seleccionar ${esc(p.name)}">
          ${imgTag(p, 120).replace('<img', `<img data-open="${esc(p.id)}"`)}<div><b class="small" data-open="${esc(p.id)}">${esc(p.name)}</b><div class="tiny muted">${esc(p.set)} ${esc(p.no)} · ${esc(C.KIND_LABEL[p.kind])} · ${esc(p.rarity || '')}</div></div>
          <div class="ctrl">${stepper(p, 'qty', C.qty(state, p.id))}<span class="tiny muted">interc.</span>${stepper(p, 'trade', C.tradeQty(state, p.id))}${wishBtn(p)}</div></div>`).join('')}</div>
      ${rows.length ? '' : '<div class="empty">Nada coincide con los filtros.</div>'}
      <div class="pagination"><button class="btn sm" id="pPrev" ${g.page === 0 ? 'disabled' : ''}>${gl('prev', 'sm')} Anterior</button><span class="small">${g.page + 1} / ${pages}</span><button class="btn sm" id="pNext" ${g.page >= pages - 1 ? 'disabled' : ''}>Siguiente ${gl('next', 'sm')}</button></div></div>`;

    const rerender = () => { g.page = 0; render(); };
    const mq = $('#mq', view);
    mq.oninput = () => { g.q = mq.value; clearTimeout(mq._t); mq._t = setTimeout(() => { const p = mq.selectionStart; rerender(); const n = $('#mq'); n.focus(); n.setSelectionRange(p, p); }, 180); };
    $('#mset', view).onchange = (e) => { g.set = e.target.value; rerender(); };
    $('#mkind', view).onchange = (e) => { g.kind = e.target.value; rerender(); };
    $('#mrar', view).onchange = (e) => { g.rarity = e.target.value; rerender(); };
    $('#mstat', view).onchange = (e) => { g.status = e.target.value; rerender(); };
    if ($('#clearAlbum', view)) $('#clearAlbum', view).onclick = () => { g.album = ''; location.hash = '#/gestionar'; };
    if ($('#toAlbum', view)) $('#toAlbum', view).onclick = () => { location.hash = `#/album/${album.id}`; };
    $('#pPrev', view).onclick = () => { g.page--; render(); scrollTo(0, 0); };
    $('#pNext', view).onclick = () => { g.page++; render(); scrollTo(0, 0); };
    $('#selPage', view).onclick = () => { pageRows.forEach((p) => sel.add(p.id)); render(); };
    $('#selAll', view).onclick = () => { rows.forEach((p) => sel.add(p.id)); render(); };
    $$('[data-sel]', view).forEach((c) => c.onchange = () => { if (c.checked) sel.add(c.dataset.sel); else sel.delete(c.dataset.sel); render(); });
    $$('[data-open]', view).forEach((el) => { el.style.cursor = 'pointer'; el.onclick = () => openCard(el.dataset.open, album ? album.id : null); el.onkeydown = (e) => { if (e.key === 'Enter') openCard(el.dataset.open, album ? album.id : null); }; });
    $$('[data-wish]', view).forEach((b) => b.onclick = () => commit('Deseos actualizados', (s) => { const id = b.dataset.wish; if (s.wish[id]) delete s.wish[id]; else s.wish[id] = true; }, { quiet: true }));
    $$('[data-row]', view).forEach((b) => b.onclick = () => {
      const id = b.dataset.row; const d = +b.dataset.d; const p = P(id);
      if (b.dataset.k === 'qty') commit(`${d > 0 ? '+1' : '−1'} ${p.name}`, (s) => C.addQty(s, id, d, { lang: 'EN', finish: p.finish || 'Normal' }), { quiet: true });
      else commit('Intercambio cambiado', (s) => {
        const lots = s.lots.filter((l) => l.printId === id);
        if (d > 0) { const l = lots.find((x) => (x.trade || 0) < x.qty); if (l) l.trade = (l.trade || 0) + 1; } else { const l = lots.find((x) => x.trade > 0); if (l) l.trade--; }
      }, { quiet: true });
    });
    $$('[data-b]', view).forEach((b) => b.onclick = () => batch(b.dataset.b));
    $('#exportCsv', view).onclick = () => { download(`runario-inventario-${today()}.csv`, C.toCSV(CAT, state), 'text/csv;charset=utf-8'); toast('CSV exportado'); };
    $('#importCsv', view).onchange = (e) => { const file = e.target.files[0]; if (!file) return; file.text().then(openImport); e.target.value = ''; };
  }
  function batch(kind) {
    const ids = [...ui.manage.sel]; const n = ids.length;
    if (kind === 'clear') { ui.manage.sel.clear(); render(); return; }
    if (kind === 'plus') return commit(`+1 a ${n} cartas`, (s) => ids.forEach((id) => C.addQty(s, id, 1, { finish: P(id).finish || 'Normal' })));
    if (kind === 'minus') return commit(`−1 a ${n} cartas`, (s) => ids.forEach((id) => C.addQty(s, id, -1, { finish: P(id).finish || 'Normal' })));
    if (kind === 'wish') return commit(`${n} cartas deseadas`, (s) => ids.forEach((id) => { s.wish[id] = true; }));
    if (kind === 'unwish') return commit(`Deseo quitado a ${n} cartas`, (s) => ids.forEach((id) => { delete s.wish[id]; }));
    if (kind === 'trade') return commit('Repetidas marcadas para intercambio', (s) => ids.forEach((id) => { let spare = C.qty(s, id) - 1; for (const l of s.lots.filter((x) => x.printId === id)) { const t = Math.max(0, Math.min(l.qty, spare)); l.trade = t; spare -= t; } }));
    const m = modal(`<form method="dialog"><div class="modal-head"><h2 id="modalTitle">${kind === 'set' ? 'Fijar cantidad' : 'Ubicación'} · ${n} cartas</h2></div>
      <div class="modal-body">${kind === 'set' ? '<label class="field"><span>Cantidad total por carta</span><input type="number" min="0" step="1" id="bv" value="1"></label><p class="small muted">Ajusta el lote principal (inglés, normal) hasta esa cantidad total.</p>' : '<label class="field"><span>Ubicación para todos sus lotes</span><input type="text" id="bv" placeholder="Carpeta azul, fila 3…"></label>'}</div>
      <div class="modal-foot"><span class="spacer"></span><button class="btn" value="cancel">Cancelar</button><button class="btn gold" type="button" id="bok">Aplicar</button></div></form>`, 'narrow');
    $('#bv', m).focus();
    $('#bok', m).onclick = () => {
      const v = $('#bv', m).value; m.close();
      if (kind === 'set') { const t = Math.max(0, parseInt(v, 10) || 0); commit(`Cantidad ${t} en ${n} cartas`, (s) => ids.forEach((id) => C.addQty(s, id, t - C.qty(s, id), { finish: P(id).finish || 'Normal' }))); }
      else commit(`Ubicación en ${n} cartas`, (s) => ids.forEach((id) => s.lots.filter((l) => l.printId === id).forEach((l) => { l.location = v.trim(); })));
    };
  }
  function openImport(text) {
    const v = C.validateImport(CAT, text); let mode = 'sumar';
    const draw = () => {
      const m = modal(`<form method="dialog"><div class="modal-head">${gl('import', 'lg')}<h2 id="modalTitle">Importar CSV</h2><button class="iconbtn" value="cancel" aria-label="Cerrar">${gl('close')}</button></div>
        <div class="modal-body"><div class="row"><span class="chip ok">${v.ok.length} filas válidas</span><span class="chip ${v.errors.length ? 'bad' : ''}">${v.errors.length} errores</span><span class="chip ${v.warnings.length ? 'warn' : ''}">${v.warnings.length} avisos</span></div>
          ${v.errors.length ? `<div><h3>Errores (no se importarán)</h3><table class="simple"><tr><th>Línea</th><th>Problema</th></tr>${v.errors.slice(0, 50).map((e) => `<tr><td class="n">${e.line}</td><td>${esc(e.msg)}</td></tr>`).join('')}</table></div>` : ''}
          ${v.warnings.length ? `<div><h3>Avisos (se importan con ajuste)</h3><table class="simple"><tr><th>Línea</th><th>Ajuste</th></tr>${v.warnings.slice(0, 50).map((e) => `<tr><td class="n">${e.line}</td><td>${esc(e.msg)}</td></tr>`).join('')}</table></div>` : ''}
          <div class="seg"><button type="button" data-mode="sumar" aria-pressed="${mode === 'sumar'}">Sumar al inventario</button><button type="button" data-mode="reemplazar" aria-pressed="${mode === 'reemplazar'}">Reemplazar inventario</button></div>
          <p class="small muted">Columnas: ${C.CSV_COLS.join(', ')}. Separador «;» o «,». Puedes deshacer la importación.</p></div>
        <div class="modal-foot"><span class="spacer"></span><button class="btn" value="cancel">Cancelar</button><button class="btn gold" type="button" id="doImport" ${v.ok.length ? '' : 'disabled'}>Importar ${v.ok.length} filas</button></div></form>`);
      $$('[data-mode]', m).forEach((b) => b.onclick = () => { mode = b.dataset.mode; draw(); });
      $('#doImport', m).onclick = () => { m.close(); commit(`Importadas ${v.ok.length} filas (${mode})`, (s) => C.applyImport(s, v.ok, mode)); };
    };
    draw();
  }

  // ---------- Vitrina ----------
  function medalsHTML(list, st) {
    return `<div class="medal-grid">${list.map((b0) => { const b = badgeView(b0); return `<div class="medal-card">${badgeMedal(b)}<span class="tier">${A.RANK_ES[(BADGE_META[b.id] || {}).tier] || ''}</span><h3>${esc(b.title)}</h3><p>${esc(b.cond)}</p>
      ${b.locked ? `<span class="chip warn">${esc(b.lockReason)}</span>` : `<div class="bar"><i style="width:${(b.current / b.target) * 100}%"></i></div><div class="pv">${b.done ? `Conseguido${st.badges[b.id] ? ` el ${st.badges[b.id]}` : ''}` : `${b.current}${b.unit || ''} / ${b.target}${b.unit || ''}`}</div>`}</div>`; }).join('')}</div>`;
  }
  function viewBadges(view) {
    const list = C.computeAchievements(CAT, state);
    const done = list.filter((b) => b.done).length;
    view.innerHTML = `<div class="page">
      <div class="pagehead"><div><div class="eyebrow">${done} de ${list.length} ganadas</div><h1>Vitrina</h1><p class="muted">Se ganan coleccionando y nada más: ni pagando, ni viendo anuncios, ni amontonando repetidas. Y no certifican que tus cartas sean auténticas, eso ya lo sabes tú.</p></div></div>
      <section class="cabinet"><h2>Checklist oficial</h2><p class="muted small">Se calculan sobre las checklists validadas del catálogo.</p>${medalsHTML(list.filter((b) => b.group === 'oficial'), state)}</section>
      <section class="cabinet"><h2>Objetivos personales</h2><p class="muted small">Dependen de tus álbumes y de cómo los personalizas.</p>${medalsHTML(list.filter((b) => b.group === 'personal'), state)}</section></div>`;
  }

  // ---------- Productos ----------
  // Catálogo real de productos sellados (fotos de Riot o TCGplayer). El sellado nunca suma cartas hasta abrirlo.
  const PROD_SETS = [['OGN', 'Origins'], ['OGS', 'Proving Grounds'], ['SFD', 'Spiritforged'], ['UNL', 'Unleashed'], ['VEN', 'Vendetta'], ['RAD', 'Radiance'], ['T1', 'T1'], ['SGN', 'Secret Garden'], ['WRB', 'Worlds 2025'], ['GRF', 'Gift of the Rift'], ['LGC', 'Legacy']];
  const prodById = (id) => AS.products.find((p) => p.id === id);
  const prodArt = (setCode) => (setInfo(setCode === 'SGN' ? 'SGD' : setCode).art || (AS.products.find((p) => p.set === setCode) || {}).thumb || '');
  function viewProducts(view) {
    ui.prodSet = ui.prodSet || 'OGN';
    const list = AS.products.filter((p) => p.set === ui.prodSet);
    const sealed = state.products.filter((p) => p.status === 'sellado');
    const opened = state.products.filter((p) => p.status === 'abierto');
    const groups = {};
    for (const p of sealed) (groups[p.productId || p.name] = groups[p.productId || p.name] || []).push(p);
    const ownedCount = (pid) => sealed.filter((p) => p.productId === pid).length;
    view.innerHTML = `<div class="page">
      <div class="pagehead"><div><div class="eyebrow">Sin abrir</div><h1>Productos</h1><p class="muted">Sobres, cajas y mazos tal cual salen de la tienda. Lo sellado se queda aparte: sus cartas solo entran en tu colección cuando lo abres y apuntas lo que te ha tocado.</p></div></div>
      <div class="section-title"><h2>Tu estantería de sellado</h2><span class="muted small">${sealed.length} sin abrir · ${opened.length} abiertos</span></div>
      ${sealed.length ? `<div class="sealed-shelf">${Object.values(groups).map((g) => { const p0 = g[0]; const pr = prodById(p0.productId) || {}; return `<div class="sealed-item"><div class="pimg">${pr.thumb ? `<img src="${esc(pr.thumb)}" alt="" loading="lazy">` : packArt(p0.set, false)}</div>
          <div style="display:flex;flex-direction:column;gap:6px;min-width:0"><b>${esc(p0.name)}</b><span class="small muted">${esc(p0.setName || p0.set)} · ×${g.length} sin abrir</span>
          <div class="row" style="margin-top:auto"><button class="btn sm gold" data-open-prod="${g[0].id}">Abrir uno</button><button class="btn sm ghost" data-del-prod="${g[g.length - 1].id}">Quitar uno</button></div></div></div>`; }).join('')}</div>`
        : `<div class="empty panel" style="margin-bottom:34px">${emoteImg(EMOTES.find((e) => /poro/i.test(e.name)) || EMOTES[0], 'empty-emote')}<p>Tu estantería de sellado está vacía. Añade productos desde el catálogo de abajo.</p></div>`}
      <div class="section-title"><h2>Catálogo de productos</h2><span class="muted small">Fotos oficiales de Riot Games cuando existen; el resto, fotos de producto de TCGplayer.</span></div>
      <div class="set-tabs" role="tablist">${PROD_SETS.filter(([k]) => AS.products.some((p) => p.set === k)).map(([k, n]) => `<button type="button" role="tab" data-pset="${k}" aria-pressed="${ui.prodSet === k}"><img src="${esc(prodArt(k))}" alt="" loading="lazy"><span>${esc(n)}</span></button>`).join('')}</div>
      <div class="prod-cat">${list.map((p) => `<article class="pcard"><div class="pimg"><img src="${esc(p.thumb)}" alt="${esc(p.original)}" loading="lazy" onerror="this.closest('.pcard').remove()"></div>
        <div class="pinfo"><h3>${esc(p.name)}</h3><span class="small muted">${esc(p.original)}</span>${PR.products[p.id] && PR.products[p.id][0] != null ? `<span class="pprice" title="${esc(priceNote())}">${money(PR.products[p.id][0])}</span>` : ''}${ownedCount(p.id) ? `<span class="owned">Tienes ${ownedCount(p.id)} sin abrir</span>` : ''}
          <div class="row" style="margin-top:auto"><button class="btn sm gold" data-add-prod="${p.id}">${gl('pack', 'sm')} Añadir sellado</button><button class="btn sm ghost" data-zoom="${p.id}">Ver</button></div>
          <span class="src">Imagen: ${esc(p.source)}</span></div></article>`).join('')}</div>
      ${opened.length ? `<div class="section-title"><h2>Aperturas</h2></div><div class="sealed-shelf">${opened.map((p) => { const pr = prodById(p.productId) || {}; return `<div class="sealed-item"><div class="pimg">${pr.thumb ? `<img src="${esc(pr.thumb)}" alt="" loading="lazy">` : packArt(p.set, true)}</div><div><b>${esc(p.name)}</b><div class="small muted">Abierto el ${esc(p.openedAt)} · ${p.contents.reduce((n, c) => n + c.qty, 0)} cartas añadidas</div><button class="btn sm ghost danger" data-del-prod="${p.id}" style="margin-top:8px">Borrar registro</button></div></div>`; }).join('')}</div>` : ''}
    </div>`;
    $$('[data-pset]', view).forEach((b) => b.onclick = () => { ui.prodSet = b.dataset.pset; render(); });
    $$('[data-add-prod]', view).forEach((b) => b.onclick = () => {
      const p = prodById(b.dataset.addProd);
      const setName = (PROD_SETS.find(([k]) => k === p.set) || [])[1] || p.set;
      const setId = p.set === 'SGN' ? 'SGD' : ['WRB', 'GRF', 'LGC'].includes(p.set) ? null : p.set;
      commit(`${p.name} añadido a tu sellado`, (s) => s.products.push({ id: 'p' + Math.random().toString(36).slice(2, 9), productId: p.id, name: p.name, set: setId, setName, type: p.kind, status: 'sellado', createdAt: today(), contents: [] }));
    });
    $$('[data-zoom]', view).forEach((b) => b.onclick = () => {
      const p = prodById(b.dataset.zoom);
      modal(`<form method="dialog"><div class="modal-head"><h2 id="modalTitle">${esc(p.name)}</h2><button class="iconbtn" value="cancel" aria-label="Cerrar">${gl('close')}</button></div>
        <div class="modal-body" style="align-items:center"><img src="${esc(p.img)}" alt="${esc(p.original)}" style="max-height:70vh;border-radius:12px;background:#fff"><p class="small muted">${esc(p.original)} · Imagen: ${esc(p.source)}</p></div></form>`, 'narrow');
    });
    $$('[data-del-prod]', view).forEach((b) => b.onclick = () => commit('Registro de producto eliminado (el inventario no cambia)', (s) => { s.products = s.products.filter((p) => p.id !== b.dataset.delProd); }));
    $$('[data-open-prod]', view).forEach((b) => b.onclick = () => openProduct(b.dataset.openProd));
  }
  function packArt(setId, open) { const d = PRESETS[(COL(setId) || {}).theme] || PRESETS.neutral; return `<div class="packart ${open ? 'open' : ''}" style="${esc(vars(d))}"><i class="body"></i><i class="emb"></i></div>`; }
  function openProduct(pid) {
    const prod = state.products.find((p) => p.id === pid);
    const contents = new Map(); let q = ''; let lang = 'EN';
    const pool = prod.set ? CAT.prints.filter((p) => p.set === prod.set) : CAT.prints;
    const draw = () => {
      const res = q.length >= 2 ? pool.filter((p) => `${p.name} ${p.no}`.toLowerCase().includes(q.toLowerCase())).slice(0, 30) : [];
      const pr = prodById(prod.productId) || {};
      const m = modal(`<form method="dialog"><div class="modal-head">${pr.thumb ? `<img src="${esc(pr.thumb)}" alt="" style="width:46px;height:46px;object-fit:contain;background:#fff;border-radius:8px">` : ''}<h2 id="modalTitle">Apertura: ${esc(prod.name)}</h2><button class="iconbtn" value="cancel" aria-label="Cerrar">${gl('close')}</button></div>
        <div class="modal-body"><p class="small muted">Añade las cartas que salieron. Nada se suma al inventario hasta que pulses «Confirmar contenido».</p>
          <div class="row"><label class="field" style="flex:2"><span>Buscar ${prod.set ? `en ${esc(COL(prod.set).name)}` : 'en el catálogo'}</span><input type="search" id="oq" value="${esc(q)}" placeholder="Nombre o número"></label>
            <label class="field" style="flex:1"><span>Idioma</span><select id="olang">${Object.entries(C.LANGS).map(([k, v]) => `<option value="${k}" ${lang === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
          <div class="open-search">${res.map((p) => `<button type="button" data-add="${esc(p.id)}">${imgTag(p, 80)}<span class="small"><b>${esc(p.no)}</b> ${esc(p.name)}</span></button>`).join('')}</div>
          <div><h3>Contenido (${[...contents.values()].reduce((x, y) => x + y, 0)} cartas)</h3><table class="simple">${[...contents.entries()].map(([id, n]) => `<tr><td>${esc(P(id).no)}</td><td>${esc(P(id).name)}</td><td class="n">×${n}</td><td><button type="button" class="btn sm ghost" data-rm="${esc(id)}">Quitar</button></td></tr>`).join('') || '<tr><td class="muted">Vacío</td></tr>'}</table></div></div>
        <div class="modal-foot"><span class="spacer"></span><button class="btn" value="cancel">Cancelar</button><button class="btn gold" type="button" id="confirmOpen" ${contents.size ? '' : 'disabled'}>Confirmar contenido</button></div></form>`);
      const oq = $('#oq', m);
      oq.oninput = () => { q = oq.value; draw(); const n = $('#oq'); n.focus(); n.setSelectionRange(q.length, q.length); };
      $('#olang', m).onchange = (e) => { lang = e.target.value; };
      $$('[data-add]', m).forEach((b) => b.onclick = () => { contents.set(b.dataset.add, (contents.get(b.dataset.add) || 0) + 1); draw(); });
      $$('[data-rm]', m).forEach((b) => b.onclick = () => { contents.delete(b.dataset.rm); draw(); });
      $('#confirmOpen', m).onclick = () => {
        m.close();
        commit(`Contenido de «${prod.name}» añadido`, (s) => {
          const pr2 = s.products.find((x) => x.id === pid);
          for (const [id, n] of contents) C.addQty(s, id, n, { lang, finish: P(id).finish || 'Normal' });
          Object.assign(pr2, { status: 'abierto', openedAt: today(), contents: [...contents].map(([printId, qty]) => ({ printId, qty, lang })) });
        });
        toast('¡Sobre abierto!', { emote: randEmote() });
      };
    };
    draw();
  }

  // ---------- Perfil ----------
  // Perfil visual (campeón, fondo, emote, escaparate) guardado con la colección; nombre, bio y privacidad en la cuenta.
  function profileHero(st, user, ro) {
    const prof = { ...defaultProfile(), ...(st.profile || {}) };
    const owned = C.ownedSet(st);
    const copies = st.lots.reduce((n, l) => n + l.qty, 0);
    const ach = C.computeAchievements(CAT, st);
    const rank = collectorRank(owned.size);
    const completed = st.albums.filter((a) => C.progress(CAT, st, a).complete).length;
    const name = user ? user.displayName : 'Invitado';
    const fav = user && user.profile.favorite;
    return `<section class="pf">
      <div class="pf-banner" style="background-image:url('${esc(splash(prof.banner))}')"></div>
      ${ro ? '' : `<div class="pf-actions"><button class="btn glass" id="pfEdit">${gl('workshop', 'sm')} Personalizar perfil</button></div>`}
      <div class="pf-main">
        <div class="pf-avatar">${A.champIcon(prof.champ, 156)}${A.rankMedal(rank.tier, { done: true })}</div>
        <div class="pf-name"><div class="eyebrow">${user ? `Invocador desde ${esc(user.createdAt)}` : 'Modo invitado'}</div><h1>${esc(name)}</h1>
          <div class="handle">${user ? `@${esc(user.username)}` : 'Sin cuenta'}${fav ? ` · Campeón favorito: ${esc(fav)}` : ''}</div>
          <div class="rank">${A.rankMedal(rank.tier, { done: true })}Rango de coleccionista: ${esc(rank.name)}${rank.next ? ` · ${rank.next[1] - owned.size} cartas distintas para ${esc(A.RANK_ES[rank.next[0]])}` : ''}</div>
          ${user && user.profile.bio ? `<p style="margin-top:12px;max-width:60ch;color:rgb(246 238 223 / .8)">${esc(user.profile.bio)}</p>` : ''}</div>
        ${emoteImg(emoteById(prof.emote), 'pf-emote')}
      </div>
      <div class="pf-stats"><div><b>${owned.size}</b><span>Cartas distintas</span></div><div><b>${copies}</b><span>Copias</span></div><div><b>${st.albums.length}</b><span>Álbumes</span></div><div><b>${completed}</b><span>Completados</span></div><div><b>${ach.filter((b) => b.done).length}</b><span>Medallas</span></div></div></section>`;
  }
  function profileBody(st, ro) {
    const prof = { ...defaultProfile(), ...(st.profile || {}) };
    const owned = C.ownedSet(st);
    const dom = {}; let domTotal = 0;
    for (const id of owned) { const p = P(id); if (!p) continue; for (const d of p.domains) { const k = d.toLowerCase(); if (DOMAIN_ES[k]) { dom[k] = (dom[k] || 0) + 1; domTotal++; } } }
    const maxDom = Math.max(1, ...Object.values(dom));
    const sets = CAT.collections.filter((c) => !c.provisional);
    const ach = C.computeAchievements(CAT, st).filter((b) => b.done);
    const show = (prof.showcase || []).slice(0, 5);
    return `<div class="pf-grid">
        <div class="panel"><div class="row"><h3>Escaparate</h3><span class="spacer"></span>${ro ? '' : '<button class="btn sm" id="pfShow">Elegir cartas</button>'}</div>
          <p class="small muted">Las cinco cartas de las que más presumes. Pasa el ratón para verlas en relieve; tócalas para el visor 3D.</p>
          <div class="showcase-cards" id="showcase">${[0, 1, 2, 3, 4].map((i) => { const p = show[i] && P(show[i]); return p ? `<button type="button" class="slotc filled" data-v3="${esc(p.id)}" aria-label="${esc(p.name)}">${imgTag(p, 400)}</button>` : `<button type="button" class="slotc" ${ro ? 'disabled' : 'data-pick="1"'}>${ro ? '' : 'Elegir carta'}</button>`; }).join('')}</div></div>
        <div class="panel"><h3>Afinidad de dominio</h3><p class="small muted">Cartas distintas de cada dominio en tu colección.</p>
          <div class="domain-bars">${Object.keys(DOMAIN_ES).map((k) => `<div class="d">${domainIcon(k)}<span>${DOMAIN_ES[k]}</span><div class="bar"><i style="width:${((dom[k] || 0) / maxDom) * 100}%"></i></div><span>${dom[k] || 0}</span></div>`).join('')}</div></div></div>
      <div class="pf-grid">
        <div class="panel"><h3>Colecciones</h3><div class="set-progress">${sets.map((c) => { const cl = CAT.checklists.find((x) => x.set === c.id && ['base', 'promo', 'product'].includes(x.objective)); if (!cl) return ''; const pr = C.progress(CAT, st, { set: c.id, objective: cl.objective, lang: 'any', order: [] }); const art = setInfo(c.id).art;
            return `<div class="sp"><div class="thumb">${art ? `<img src="${esc(art)}" alt="" loading="lazy">` : ''}</div><div><b>${esc(c.name)}</b><div class="bar"><i style="width:${pr.pct}%"></i></div></div><span class="small"><b style="font-size:1rem">${fmtPct(pr.pct)}</b>${pr.filled}/${pr.total}</span></div>`; }).join('')}</div></div>
        <div class="panel"><h3>Medallas</h3>${ach.length ? `<div class="row" style="margin-top:12px;gap:4px">${ach.map((b) => `<span title="${esc(b.title)}">${badgeMedal(b, 'md')}</span>`).join('')}</div>` : `<div class="empty">${emoteImg(randEmote(), 'empty-emote')}Aún sin medallas. ¡A por la primera carta!</div>`}</div></div>`;
  }
  function bindProfileBody(view, st, ro) {
    window.RB3D.attachTilt($('#showcase', view), '.slotc.filled');
    $$('[data-v3]', view).forEach((b) => b.onclick = () => { const p = P(b.dataset.v3); window.RB3D.openViewer({ title: p.name, subtitle: 'Escaparate', cards: [{ img: p.img, name: p.name, landscape: p.orient === 'landscape', holo: true, back: A.cardBack(A.backVariant(p)) }] }); });
    if (ro) return;
    $$('#pfShow, [data-pick]', view).forEach((b) => b.onclick = () => openProfileEditor('showcase'));
    if ($('#pfEdit', view)) $('#pfEdit', view).onclick = () => openProfileEditor('champ');
  }
  function openProfileEditor(tab0) {
    const f = { ...defaultProfile(), ...(state.profile || {}) };
    f.showcase = [...(f.showcase || [])];
    let tab = tab0; let q = '';
    const draw = () => {
      const champs = AS.champions.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()));
      const owned = [...C.ownedSet(state)].map(P).filter(Boolean);
      const body = tab === 'emote' ? `<div class="pick-scroll emotes">${EMOTES.map((e) => `<button type="button" data-pe="${e.id}" aria-pressed="${String(f.emote) === String(e.id)}">${emoteImg(e)}${esc(e.name.slice(0, 16))}</button>`).join('')}</div>`
        : tab === 'showcase' ? (owned.length ? `<p class="small muted">Elige hasta 5 cartas que tengas (${f.showcase.length}/5).</p><div class="pick-scroll cards">${owned.map((p) => `<button type="button" data-ps="${esc(p.id)}" aria-pressed="${f.showcase.includes(p.id)}">${imgTag(p, 200)}${esc(p.name.slice(0, 18))}</button>`).join('')}</div>` : `<div class="empty">${emoteImg(randEmote(), 'empty-emote')}Registra cartas para poder exhibirlas.</div>`)
        : `<label class="field"><span>Buscar campeón</span><input type="search" id="pq" value="${esc(q)}" placeholder="Jinx, Ahri, Viktor…"></label>
           <div class="pick-scroll">${champs.map((c) => `<button type="button" data-pc="${c.id}" aria-pressed="${(tab === 'champ' ? f.champ : f.banner) === c.id}"><img src="${AS.dd.square}${c.id}.png" alt="" loading="lazy">${esc(c.name)}</button>`).join('')}</div>`;
      const m = modal(`<form method="dialog"><div class="modal-head"><h2 id="modalTitle">Personalizar perfil</h2><button class="iconbtn" value="cancel" aria-label="Cerrar">${gl('close')}</button></div>
        <div class="modal-body"><div class="pf" style="margin:0"><div class="pf-banner" style="height:180px;background-image:url('${esc(splash(f.banner))}')"></div><div class="pf-main" style="margin-top:-70px;padding-bottom:20px"><div class="pf-avatar" style="width:96px;height:96px">${A.champIcon(f.champ, 96)}</div>${emoteImg(emoteById(f.emote), 'pf-emote')}</div></div>
          <div class="tabs" role="tablist">${[['champ', 'Icono de campeón'], ['banner', 'Fondo (ilustración)'], ['emote', 'Emote de firma'], ['showcase', 'Escaparate']].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>${body}</div>
        <div class="modal-foot"><span class="tiny faint">Ilustraciones, iconos y emotes de League of Legends (Riot Games).</span><span class="spacer"></span><button class="btn" value="cancel">Cancelar</button><button type="button" class="btn gold" id="pfSaveV">${gl('check')} Guardar perfil</button></div></form>`);
      $$('[data-tab]', m).forEach((b) => b.onclick = () => { tab = b.dataset.tab; q = ''; draw(); });
      if ($('#pq', m)) $('#pq', m).oninput = (e) => { q = e.target.value; draw(); const n = $('#pq'); n.focus(); n.setSelectionRange(q.length, q.length); };
      $$('[data-pc]', m).forEach((b) => b.onclick = () => { if (tab === 'champ') f.champ = b.dataset.pc; else f.banner = b.dataset.pc; draw(); });
      $$('[data-pe]', m).forEach((b) => b.onclick = () => { f.emote = b.dataset.pe; draw(); });
      $$('[data-ps]', m).forEach((b) => b.onclick = () => { const id = b.dataset.ps; f.showcase = f.showcase.includes(id) ? f.showcase.filter((x) => x !== id) : [...f.showcase, id].slice(0, 5); draw(); });
      $('#pfSaveV', m).onclick = () => { m.close(); commit('Perfil actualizado', (s) => { s.profile = { ...f }; }); };
    };
    draw();
  }
  function viewProfile(view) {
    const u = S.user;
    view.innerHTML = `<div class="page">${profileHero(state, u, false)}${profileBody(state, false)}
      ${u ? `<div class="pf-grid">
        <div class="panel" style="display:flex;flex-direction:column;gap:16px"><h3>Tu ficha de invocador</h3>
          <label class="field"><span>Nombre visible</span><input type="text" id="pfName" value="${esc(u.displayName)}" maxlength="40"></label>
          <label class="field"><span>Presentación</span><textarea id="pfBio" maxlength="280" placeholder="Qué coleccionas, qué buscas…">${esc(u.profile.bio)}</textarea></label>
          <label class="field"><span>Campeón favorito</span><select id="pfFav"><option value="">—</option>${C.champions(CAT).map((c) => `<option ${u.profile.favorite === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
          <div class="row"><span class="spacer"></span><button class="btn gold" id="pfSave">${gl('check')} Guardar ficha</button></div></div>
        <div style="display:flex;flex-direction:column;gap:22px">
          <div class="panel"><h3>${gl('share')} Vitrina pública</h3><p class="small muted" style="margin:6px 0 14px">Con el enlace, cualquiera verá tu perfil, álbumes, medallas, deseos y cartas para intercambio. Nunca notas privadas, ubicaciones ni productos.</p>
            <label class="row"><input type="checkbox" id="pfPublic" ${u.profile.public ? 'checked' : ''}> Mostrar mi colección públicamente</label>
            ${u.profile.public ? `<div class="row" style="margin-top:12px"><input type="text" readonly value="${esc(`${location.origin}/#/u/${u.username}`)}" id="pfUrl" style="flex:1"><button class="btn sm" id="pfCopy">Copiar</button><a class="btn sm" href="#/u/${esc(u.username)}">Ver</a></div>` : ''}</div>
          <div class="panel"><h3>Ambiente de la página</h3><p class="small muted" style="margin:4px 0 14px">Color de fondo y acento de toda la aplicación.</p>${siteThemeHTML()}</div>
          <div class="panel" style="display:flex;flex-direction:column;gap:12px"><h3>${gl('lock')} Seguridad</h3>
            <label class="field"><span>Contraseña actual</span><input type="password" id="pwCur" autocomplete="current-password"></label>
            <label class="field"><span>Nueva contraseña</span><input type="password" id="pwNew" minlength="8" autocomplete="new-password"></label>
            <div class="row"><button class="btn" id="pwSave">Cambiar contraseña</button><span class="spacer"></span><button class="btn danger" id="logout">${gl('door')} Cerrar sesión</button></div></div></div></div>`
      : `<div class="pf-grid"><div class="panel"><h3>Crea tu cuenta de invocador</h3><p class="muted" style="margin:8px 0 16px">Con una cuenta tu colección se guarda en el servidor, la abres desde cualquier dispositivo y puedes publicar tu perfil. Tu colección de invitado viene contigo.</p><a class="btn gold" href="#/entrar" id="goRegister">${gl('key')} Crear cuenta o entrar</a></div>
          <div class="panel"><h3>Ambiente de la página</h3>${siteThemeHTML()}</div></div>`}</div>`;
    bindProfileBody(view, state, false);
    bindSiteTheme(view);
    if (!u) { $('#goRegister', view).onclick = () => { $('#authRoot').dataset.mode = 'register'; }; return; }
    const patch = async (body, msg) => {
      const r = await api('PATCH', '/api/profile', body).catch(() => ({ ok: false, data: {} }));
      if (r.ok) { S.user = r.data.user; toast(msg); render(); } else toast(r.data.error || 'No se pudo guardar.');
    };
    $('#pfSave', view).onclick = () => patch({ displayName: $('#pfName').value, profile: { bio: $('#pfBio').value, favorite: $('#pfFav').value } }, 'Ficha guardada');
    $('#pfPublic', view).onchange = (e) => patch({ profile: { public: e.target.checked } }, e.target.checked ? 'Tu perfil ya es público' : 'Tu colección vuelve a ser privada');
    if ($('#pfCopy', view)) $('#pfCopy', view).onclick = () => { navigator.clipboard?.writeText($('#pfUrl').value).then(() => toast('Enlace copiado')); };
    $('#pwSave', view).onclick = async () => {
      const r = await api('POST', '/api/password', { current: $('#pwCur').value, next: $('#pwNew').value }).catch(() => ({ ok: false, data: {} }));
      toast(r.ok ? 'Contraseña cambiada. Las demás sesiones se han cerrado.' : r.data.error || 'No se pudo cambiar.');
      if (r.ok) { $('#pwCur').value = ''; $('#pwNew').value = ''; }
    };
    $('#logout', view).onclick = logout;
  }
  function siteThemeHTML() {
    const cur0 = state.settings.site || 'origins';
    return `<div class="opt-grid">${Object.entries(PRESETS).filter(([k]) => k !== 'promo').map(([k, p]) => `<button type="button" class="opt" data-site="${k}" aria-pressed="${cur0 === k}"><span class="sw" style="background:radial-gradient(circle at 30% 30%, ${p.amb}, #0c0a08 80%)"></span><span>${esc(p.label)}</span></button>`).join('')}</div>`;
  }
  function bindSiteTheme(view) {
    $$('[data-site]', view).forEach((b) => b.onclick = () => { state.settings.site = b.dataset.site; save(); render(); });
  }

  // ---------- Colección pública ----------
  async function viewPublic(view, r) {
    const name = r.parts[1];
    if (!viewing || viewing.user.username !== name) {
      view.innerHTML = `<div class="page empty">${emoteImg(randEmote(), 'empty-emote')}Abriendo la colección…</div>`;
      try {
        const res = await api('GET', `/api/u/${encodeURIComponent(name)}`);
        if (!res.ok) { viewing = null; view.innerHTML = `<div class="page empty">${emoteImg(randEmote(), 'empty-emote')}<h2>${esc(res.data.error || 'Colección no disponible')}</h2><p><a href="#/">Volver</a></p></div>`; return; }
        viewing = { user: res.data.user, state: normalize(res.data.state), updatedAt: res.data.updatedAt };
      } catch { view.innerHTML = '<div class="page empty"><h2>No hay conexión con el servidor.</h2></div>'; return; }
      renderShell();
    }
    if (r.parts[2] === 'album') return viewAlbum(view, r, true);
    const st = viewing.state; const u = viewing.user;
    const trades = st.lots.filter((l) => l.trade > 0);
    const wishes = Object.keys(st.wish).filter((k) => st.wish[k]);
    view.innerHTML = `<div class="page">${profileHero(st, u, true)}${profileBody(st, true)}
      <div class="section-title"><h2>Estantería</h2></div>
      <div class="shelf">${st.albums.map((a) => { const pr = C.progress(CAT, st, a); return `<a class="shelf-item" href="#/u/${esc(u.username)}/album/${a.id}">${bookHTML(a)}<div class="shelf-meta"><h3>${esc(a.name)}</h3><div class="sub">${esc(pr.checklist.label)}</div><div class="prog"><span>${pr.filled}/${pr.total}</span><div class="bar"><i style="width:${pr.pct}%"></i></div><span>${fmtPct(pr.pct)}</span></div></div></a>`; }).join('')}</div>
      <div class="features"><div class="panel"><h3>${gl('trade')} Para intercambio (${trades.length})</h3><div class="open-search" style="margin-top:12px">${trades.map((l) => `<button type="button" data-open="${esc(l.printId)}">${imgTag(P(l.printId), 80)}<span class="small"><b>×${l.trade}</b> ${esc(P(l.printId).name)} <span class="faint">${esc(l.lang)} · ${esc(l.finish)}</span></span></button>`).join('') || '<p class="muted small">Nada por ahora.</p>'}</div></div>
        <div class="panel"><h3>${gl('wish')} Busca (${wishes.length})</h3><div class="open-search" style="margin-top:12px">${wishes.map((id) => `<button type="button" data-open="${esc(id)}">${imgTag(P(id), 80)}<span class="small">${esc(P(id).name)}</span></button>`).join('') || '<p class="muted small">Nada por ahora.</p>'}</div></div></div></div>`;
    bindProfileBody(view, st, true);
    $$('[data-open]', view).forEach((b) => b.onclick = () => openCard(b.dataset.open, null));
  }

  // ================= Mazos y guías =================
  // Reglas según la guía oficial de construcción de Riot: 1 Leyenda (2 dominios), 1 Campeón elegido, mínimo 40 cartas
  // en el mazo principal (el campeón cuenta), máximo 3 copias por nombre, solo cartas de los dominios de la Leyenda,
  // 3 Campos de batalla y un mazo de 12 runas. La comprobación es orientativa.
  const DECK_RULES_URL = 'https://playriftbound.com/es-es/news/rules-and-releases/deckbuilding-primer';
  const isType = (p, t) => new RegExp(t, 'i').test(p.type || '');
  const champNames = C.champions(CAT);
  const legendChamp = (p) => (p ? p.tags.find((t) => champNames.includes(t)) || p.card.split(/ - |,/)[0].trim() : null);
  const LEGENDS = (() => { const seen = new Map(); for (const p of CAT.prints) if (isType(p, 'Legend') && !p.finish && !seen.has(p.card) && ['base', 'promo'].includes(p.kind)) seen.set(p.card, p); return [...seen.values()]; })();
  const POOL = (() => { const seen = new Map(); for (const p of CAT.prints) { if (p.finish) continue; const cur = seen.get(p.card); if (!cur || (cur.kind !== 'base' && p.kind === 'base')) seen.set(p.card, p); } return [...seen.values()]; })();
  const domainsOk = (p, doms) => !p.domains.length || p.domains.every((d) => doms.includes(d) || /colorless/i.test(d));
  const blankDeck = () => ({ id: 'd' + Math.random().toString(36).slice(2, 10), name: 'Mazo sin nombre', legend: null, champion: null, cards: {}, runes: {}, battlefields: [], visibility: 'privado',
    guide: { summary: '', plan: '', mulligan: '', matchups: [], tips: '', video: '' }, createdAt: today(), updatedAt: today() });
  const deckById = (id) => (state.decks || []).find((d) => d.id === id);
  const sumQ = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const ownedByName = (st, name) => st.lots.filter((l) => { const p = P(l.printId); return p && p.card === name; }).reduce((n, l) => n + l.qty, 0);

  function deckCheck(d) {
    const L = P(d.legend); const ch = P(d.champion);
    const doms = L ? L.domains : [];
    const mainTotal = (ch ? 1 : 0) + sumQ(d.cards);
    const byName = {}; if (ch) byName[ch.card] = 1;
    for (const [id, q] of Object.entries(d.cards)) { const p = P(id); if (p) byName[p.card] = (byName[p.card] || 0) + q; }
    const over = Object.entries(byName).filter(([, q]) => q > 3).map(([n]) => n);
    const offDomain = Object.keys(d.cards).map(P).filter((p) => p && !domainsOk(p, doms)).map((p) => p.card);
    const sigs = Object.entries(d.cards).filter(([id]) => P(id) && P(id).supertype === 'Signature');
    const wrongSig = sigs.map(([id]) => P(id)).filter((p) => L && !p.tags.includes(legendChamp(L))).map((p) => p.card);
    const runes = sumQ(d.runes);
    const R = [
      { ok: !!L, text: L ? `Leyenda: ${L.card} (${doms.map((x) => DOMAIN_ES[x.toLowerCase()] || x).join(' + ')})` : 'Elige una Leyenda: define los dos dominios del mazo.' },
      { ok: !!ch, text: ch ? `Campeón elegido: ${ch.card}` : 'Elige el Campeón: una de las versiones de la unidad de campeón de tu Leyenda.' },
      { ok: mainTotal >= 40, text: `Mazo principal: ${mainTotal}/40 cartas (el campeón cuenta)${mainTotal > 40 ? ' · más de 40 está permitido pero diluye tus mejores cartas' : ''}` },
      { ok: !over.length, text: over.length ? `Más de 3 copias: ${over.join(', ')}` : 'Máximo 3 copias por carta' },
      { ok: !offDomain.length, text: offDomain.length ? `Fuera de los dominios de la Leyenda: ${[...new Set(offDomain)].join(', ')}` : 'Todas las cartas son de los dominios de la Leyenda' },
      { ok: !wrongSig.length && sigs.reduce((n, [, q]) => n + q, 0) <= 3, text: wrongSig.length ? `Cartas Signature de otro campeón: ${wrongSig.join(', ')}` : `Cartas Signature: ${sigs.reduce((n, [, q]) => n + q, 0)} (recomendado hasta 3, de tu campeón)` },
      { ok: d.battlefields.length === 3, text: `Campos de batalla: ${d.battlefields.length}/3` },
      { ok: runes === 12, text: `Mazo de runas: ${runes}/12 (empieza con 6-6 entre tus dos dominios)` },
    ];
    return { rules: R, valid: R.every((r) => r.ok), mainTotal, doms, L, ch };
  }
  function deckMissing(d, st) {
    const need = {}; const add = (id, q) => { const p = P(id); if (p) need[p.card] = { p, q: (need[p.card] ? need[p.card].q : 0) + q }; };
    if (d.legend) add(d.legend, 1); if (d.champion) add(d.champion, 1);
    for (const [id, q] of Object.entries(d.cards)) add(id, q);
    for (const id of d.battlefields) add(id, 1);
    for (const [id, q] of Object.entries(d.runes)) add(id, q);
    const rows = Object.values(need).map(({ p, q }) => ({ p, q, have: Math.min(q, ownedByName(st, p.card)) }));
    const total = rows.reduce((n, r) => n + r.q, 0); const have = rows.reduce((n, r) => n + r.have, 0);
    return { rows, total, have, missing: rows.filter((r) => r.have < r.q) };
  }
  function curveSVG(d) {
    const b = Array(8).fill(0);
    const push = (p, q) => { if (p && p.energy != null) b[Math.min(7, p.energy)] += q; };
    if (d.champion) push(P(d.champion), 1);
    for (const [id, q] of Object.entries(d.cards)) push(P(id), q);
    const max = Math.max(1, ...b);
    return `<svg class="curve" viewBox="0 0 320 130" role="img" aria-label="Curva de energía: ${b.map((v, i) => `${i === 7 ? '7+' : i}: ${v}`).join(', ')}">${b.map((v, i) => { const h = (v / max) * 92; return `<g><rect x="${8 + i * 39}" y="${104 - h}" width="30" height="${h}" rx="4" class="bar-r"/><text x="${23 + i * 39}" y="${98 - h}" text-anchor="middle" class="v">${v || ''}</text><text x="${23 + i * 39}" y="122" text-anchor="middle" class="k">${i === 7 ? '7+' : i}</text></g>`; }).join('')}</svg>`;
  }
  const deckText = (d) => {
    const line = (q, p) => `${q} ${p.card} (${p.set} ${p.no})`;
    const out = [`# ${d.name}`, `Leyenda: ${P(d.legend) ? line(1, P(d.legend)) : '—'}`, `Campeón: ${P(d.champion) ? line(1, P(d.champion)) : '—'}`, '', 'Mazo principal:'];
    for (const [id, q] of Object.entries(d.cards)) if (P(id)) out.push(line(q, P(id)));
    out.push('', 'Campos de batalla:'); for (const id of d.battlefields) if (P(id)) out.push(line(1, P(id)));
    out.push('', 'Runas:'); for (const [id, q] of Object.entries(d.runes)) if (P(id)) out.push(line(q, P(id)));
    return out.join('\n');
  };
  const TYPE_ORDER = [['Unit', 'Unidades'], ['Spell', 'Hechizos'], ['Gear', 'Equipo']];
  function deckListHTML(d, opts = {}) {
    const groups = TYPE_ORDER.map(([t, label]) => [label, Object.entries(d.cards).map(([id, q]) => [P(id), q]).filter(([p]) => p && isType(p, t)).sort((a, b) => (a[0].energy ?? 99) - (b[0].energy ?? 99))]);
    const other = Object.entries(d.cards).map(([id, q]) => [P(id), q]).filter(([p]) => p && !TYPE_ORDER.some(([t]) => isType(p, t)));
    if (other.length) groups.push(['Otras', other]);
    const row = (p, q, kind) => `<li class="dl-row" data-card="${esc(p.id)}"><span class="dl-q">${q}</span>${p.energy != null ? `<span class="dl-e">${p.energy}</span>` : ''}<span class="dl-n">${esc(p.card)}</span>${p.domains.slice(0, 2).map((x) => domainIcon(x)).join('')}
      ${opts.edit ? `<span class="dl-step"><button type="button" data-dq="${esc(p.id)}" data-k="${kind}" data-d="-1" aria-label="Quitar una">−</button><button type="button" data-dq="${esc(p.id)}" data-k="${kind}" data-d="1" aria-label="Añadir una">+</button></span>` : ''}<span class="dl-hover">${imgTag(p, 300)}</span></li>`;
    return `<div class="decklist">
      ${groups.filter(([, items]) => items.length).map(([label, items]) => `<h4>${label} <span>${items.reduce((n, [, q]) => n + q, 0)}</span></h4><ul>${items.map(([p, q]) => row(p, q, 'cards')).join('')}</ul>`).join('')}
      <h4>Campos de batalla <span>${d.battlefields.length}</span></h4><ul>${d.battlefields.map(P).filter(Boolean).map((p) => row(p, 1, 'bf')).join('') || '<li class="muted small">—</li>'}</ul>
      <h4>Runas <span>${sumQ(d.runes)}</span></h4><ul>${Object.entries(d.runes).map(([id, q]) => [P(id), q]).filter(([p]) => p).map(([p, q]) => row(p, q, 'runes')).join('') || '<li class="muted small">—</li>'}</ul></div>`;
  }
  function deckHeroArt(d) { const L = P(d.legend); const c = L && champForTag(legendChamp(L)); return c ? splash(c.id) : (L ? L.img : ''); }

  function viewDecks(view, r) {
    const sub = r.parts[1];
    if (sub === 'nuevo') return viewDeckWizard(view);
    if (sub === 'aprender') return viewDeckLearn(view);
    ui.deckTab = ui.deckTab || 'mios';
    const mine = state.decks || [];
    view.innerHTML = `<div class="page">
      <div class="pagehead"><div><div class="eyebrow">Taller de mazos</div><h1>Mazos y guías</h1><p class="muted">Monta tu lista, mira cuántas cartas te faltan de verdad y, cuando la tengas fina, escribe la guía para que tu equipo deje de preguntarte por WhatsApp.</p></div><span class="spacer"></span>
        <a class="btn" href="#/mazos/aprender">${rbIcon('legend', 'rbi')} Cómo construir un mazo</a><a class="btn gold" href="#/mazos/nuevo">${gl('add')} Nuevo mazo</a></div>
      <div class="seg" style="margin-bottom:22px"><button type="button" data-dt="mios" aria-pressed="${ui.deckTab === 'mios'}">Mis mazos (${mine.length})</button><button type="button" data-dt="comunidad" aria-pressed="${ui.deckTab === 'comunidad'}">Guías de la comunidad</button></div>
      <div id="deckGrid" class="deck-grid">${ui.deckTab === 'mios' ? (mine.length ? mine.map((d) => deckCard(d, `#/mazo/${d.id}`, state)).join('') : `<div class="empty panel">${emoteImg(randEmote(), 'empty-emote')}<p>Aún no tienes mazos.</p><div class="row" style="justify-content:center;margin-top:12px"><a class="btn gold" href="#/mazos/nuevo">Crear con el asistente</a><a class="btn" href="#/mazos/aprender">Aprender primero</a></div></div>`) : `<div class="empty">${emoteImg(randEmote(), 'empty-emote')}Cargando guías…</div>`}</div></div>`;
    $$('[data-dt]', view).forEach((b) => b.onclick = () => { ui.deckTab = b.dataset.dt; render(); });
    if (ui.deckTab === 'comunidad') {
      api('GET', '/api/guides').then((res) => {
        const g = $('#deckGrid', view); if (!g) return;
        if (!res.ok) { g.innerHTML = `<div class="empty">${emoteImg(randEmote(), 'empty-emote')}No se pudieron cargar las guías${S.server ? '' : ' (el servidor no está activo)'}.</div>`; return; }
        g.innerHTML = res.data.length ? res.data.map((d) => deckCard(d, `#/guia/${d.author.uid}/${d.id}`, state, d.author)).join('') : `<div class="empty panel">${emoteImg(randEmote(), 'empty-emote')}<p>Todavía no hay guías públicas. ¡Publica la primera desde uno de tus mazos!</p></div>`;
      }).catch(() => { const g = $('#deckGrid', view); if (g) g.innerHTML = '<div class="empty">Sin conexión con el servidor.</div>'; });
    }
  }
  function deckCard(d, href, st, author) {
    const L = P(d.legend); const chk = deckCheck(d); const miss = deckMissing(d, st);
    return `<a class="deck-card" href="${href}"><div class="dc-art" style="background-image:url('${esc(deckHeroArt(d))}')"></div>
      ${L ? `<div class="dc-legend">${imgTag(L, 240)}</div>` : ''}
      <div class="dc-info"><div class="row" style="gap:6px">${(chk.doms || []).map((x) => domainIcon(x)).join('')}${d.visibility === 'publico' ? '<span class="chip gold">Guía pública</span>' : d.visibility === 'equipo' ? '<span class="chip">Equipo</span>' : ''}${chk.valid ? '<span class="chip ok">Legal</span>' : '<span class="chip warn">Incompleto</span>'}</div>
        <h3>${esc(d.name)}</h3><span class="small muted">${author ? `por ${esc(author.displayName)} · ` : ''}${L ? esc(L.card) : 'Sin Leyenda'} · ${chk.mainTotal} cartas</span>
        ${(d.guide || {}).summary ? `<p class="small">${esc(d.guide.summary.slice(0, 120))}${d.guide.summary.length > 120 ? '…' : ''}</p>` : ''}
        <div class="dc-own"><div class="bar"><i style="width:${miss.total ? (miss.have / miss.total) * 100 : 0}%"></i></div><span class="tiny">Tienes ${miss.have}/${miss.total} cartas</span></div></div></a>`;
  }

  // Asistente: aprende construyendo (Leyenda → Campeón → Campos → Runas → Mazo principal).
  function viewDeckWizard(view) {
    const w = ui.wizard = ui.wizard || { step: 0, d: blankDeck(), q: '' };
    const d = w.d; const L = P(d.legend);
    const STEPS = [
      ['Leyenda', 'Tu Leyenda es la carta que empieza en juego. Fija los dos dominios de los que podrás usar cartas y define el estilo del mazo. Elige la que más te guste: el resto del mazo girará a su alrededor.'],
      ['Campeón elegido', 'Cada Leyenda tiene una unidad de campeón con dos versiones. La que elijas empieza siempre disponible y cuenta como la primera carta del mazo principal (y dentro del límite de 3 copias).'],
      ['Campos de batalla', 'Elige 3 Campos de batalla. Son la zona por la que se lucha: busca efectos que premien tu plan (atacar mucho, controlar, acumular recursos…).'],
      ['Runas', 'El mazo de runas tiene 12 cartas y produce los recursos. Empieza con 6 y 6 entre tus dos dominios; si un dominio tiene costes de poder más altos, prueba 8 y 4.'],
      ['Mazo principal', 'Completa al menos 40 cartas con hasta 3 copias de cada una. A continuación pasarás al constructor completo, con curva de energía y comprobación de reglas.'],
    ];
    const pick = (p, extra = '') => `<button type="button" class="wcard ${extra}" data-wp="${esc(p.id)}">${imgTag(p, 300, '', p.card)}<span>${esc(p.card)}</span></button>`;
    let body = '';
    if (w.step === 0) { const q = w.q.toLowerCase(); body = `<label class="field" style="max-width:420px;margin-bottom:14px"><span>Buscar Leyenda</span><input type="search" id="wq" value="${esc(w.q)}" placeholder="Jinx, Ahri, Viktor…"></label><div class="wgrid">${LEGENDS.filter((p) => !q || p.card.toLowerCase().includes(q)).map((p) => pick(p, d.legend === p.id ? 'sel' : '')).join('')}</div>`; }
    if (w.step === 1) { const c = legendChamp(L); const opts = CAT.prints.filter((p) => isType(p, 'Unit') && p.supertype === 'Champion' && p.tags.includes(c) && ['base', 'promo'].includes(p.kind)); const uniq = [...new Map(opts.map((p) => [p.card, p])).values()]; body = uniq.length ? `<div class="wgrid">${uniq.map((p) => pick(p, d.champion === p.id ? 'sel' : '')).join('')}</div>` : `<div class="notice">No encuentro unidades de campeón de ${esc(c)} en el catálogo. Puedes seguir y elegirlo más tarde.</div>`; }
    if (w.step === 2) body = `<p class="small muted" style="margin-bottom:12px">${d.battlefields.length}/3 elegidos</p><div class="wgrid land">${POOL.filter((p) => isType(p, 'Battlefield')).map((p) => pick(p, d.battlefields.includes(p.id) ? 'sel' : '')).join('')}</div>`;
    if (w.step === 3) { const runes = POOL.filter((p) => isType(p, 'Rune') && L && p.domains.some((x) => L.domains.includes(x))); body = `<p class="small muted" style="margin-bottom:12px">${sumQ(d.runes)}/12 runas</p><div class="rune-pick">${runes.map((p) => `<div class="rp">${imgTag(p, 240)}<b>${esc(p.card)}</b><div class="stepper"><button type="button" data-wr="${esc(p.id)}" data-d="-1">${gl('minus')}</button><output>${d.runes[p.id] || 0}</output><button type="button" data-wr="${esc(p.id)}" data-d="1">${gl('plus')}</button></div></div>`).join('')}</div><button class="btn sm" id="wSplit" style="margin-top:12px">Repartir 6 y 6 automáticamente</button>`; }
    if (w.step === 4) body = `<div class="notice info">${STEPS[4][1]}</div>`;
    view.innerHTML = `<div class="page">
      <div class="pagehead"><div><div class="eyebrow">Asistente de mazos · paso ${w.step + 1} de 5</div><h1>${STEPS[w.step][0]}</h1><p class="muted" style="max-width:70ch">${STEPS[w.step][1]}</p></div><span class="spacer"></span><a class="btn ghost" href="${DECK_RULES_URL}" target="_blank" rel="noopener">Reglas oficiales ↗</a></div>
      <ol class="wsteps">${STEPS.map(([n], i) => `<li class="${i === w.step ? 'cur' : i < w.step ? 'done' : ''}">${i + 1}. ${n}</li>`).join('')}</ol>
      ${L && w.step > 0 ? `<div class="wsel">${imgTag(L, 160)}<div><b>${esc(L.card)}</b><div class="row" style="gap:6px">${L.domains.map((x) => domainIcon(x)).join('')}<span class="small muted">${L.domains.map((x) => DOMAIN_ES[x.toLowerCase()] || x).join(' + ')}</span></div></div></div>` : ''}
      ${body}
      <div class="row" style="margin-top:24px"><button class="btn" id="wBack" ${w.step === 0 ? 'disabled' : ''}>${gl('prev', 'sm')} Atrás</button><span class="spacer"></span>
        <button class="btn ghost" id="wCancel">Cancelar</button><button class="btn gold" id="wNext" ${w.step === 0 && !d.legend ? 'disabled' : ''}>${w.step === 4 ? 'Abrir el constructor' : 'Siguiente'} ${gl('next', 'sm')}</button></div></div>`;
    if ($('#wq', view)) $('#wq', view).oninput = (e) => { w.q = e.target.value; render(); const n = $('#wq'); n.focus(); n.setSelectionRange(w.q.length, w.q.length); };
    $$('[data-wp]', view).forEach((b) => b.onclick = () => {
      const id = b.dataset.wp;
      if (w.step === 0) { d.legend = id; d.champion = null; d.runes = {}; d.name = `${P(id).card.split(/ - |,/)[0]} · ${P(id).domains.map((x) => DOMAIN_ES[x.toLowerCase()] || x).join('/')}`; }
      if (w.step === 1) d.champion = id;
      if (w.step === 2) d.battlefields = d.battlefields.includes(id) ? d.battlefields.filter((x) => x !== id) : [...d.battlefields, id].slice(-3);
      render();
    });
    $$('[data-wr]', view).forEach((b) => b.onclick = () => { const id = b.dataset.wr; const v = Math.max(0, (d.runes[id] || 0) + +b.dataset.d); if (v) d.runes[id] = v; else delete d.runes[id]; render(); });
    if ($('#wSplit', view)) $('#wSplit', view).onclick = () => { d.runes = {}; for (const dom of L.domains) { const r = POOL.find((p) => isType(p, 'Rune') && p.domains.includes(dom)); if (r) d.runes[r.id] = 6; } render(); };
    $('#wBack', view).onclick = () => { w.step--; render(); };
    $('#wCancel', view).onclick = () => { ui.wizard = null; location.hash = '#/mazos'; };
    $('#wNext', view).onclick = () => {
      if (w.step < 4) { w.step++; render(); return; }
      const nd = { ...d, updatedAt: today() }; ui.wizard = null;
      commit('Mazo creado', (s) => { s.decks = s.decks || []; s.decks.push(nd); }, { noRender: true });
      location.hash = `#/mazo/${nd.id}`;
    };
  }

  function viewDeckLearn(view) {
    const S2 = [
      ['1. Empieza por una idea', 'Elige una Leyenda y pregúntate cómo quieres ganar: ¿presionando pronto, controlando la partida o acumulando ventaja para el final? Esa respuesta decide casi todas las demás cartas.'],
      ['2. Respeta los dominios', 'Solo puedes usar cartas de los dos dominios de tu Leyenda (más las incoloras). Aprovecha cómo se combinan: cada pareja de dominios tiene su propia personalidad.'],
      ['3. Cuida la curva de energía', 'Reparte los costes para tener algo útil que hacer cada turno. Un exceso de cartas caras te deja sin jugar al principio; demasiadas baratas se quedan cortas al final. El constructor te dibuja la curva.'],
      ['4. Equilibra tipos de carta', 'Las unidades conquistan Campos de batalla; los hechizos responden y rematan; el equipo da valor continuado. Un mazo sin suficientes unidades rara vez sostiene la presión.'],
      ['5. Juega 3 copias de lo importante', 'Las piezas clave de tu plan deberían estar a 3 copias para verlas a menudo. Las cartas muy situacionales, a 1 o 2. Mantenerse en 40 cartas maximiza la consistencia.'],
      ['6. Ajusta las runas', 'Empieza con 6 y 6. Si casi todos tus costes de poder son de un dominio, inclina el reparto (por ejemplo 8 y 4).'],
      ['7. Prueba, anota y escribe la guía', 'Juega partidas, apunta qué cartas sobran y qué te falta. Cuando lo tengas claro, escribe una guía: plan de juego, mulligan y cómo afrontar cada rival. Así ayudas a tu equipo.'],
    ];
    view.innerHTML = `<div class="page learn">
      <div class="pagehead"><div><div class="eyebrow">Tu primer mazo</div><h1>Cómo construir un mazo de Riftbound</h1><p class="muted" style="max-width:70ch">Siete ideas para pasar de «me mola esta Leyenda» a un mazo con plan. Las reglas al milímetro, en la <a href="${DECK_RULES_URL}" target="_blank" rel="noopener">guía oficial de construcción de Riot</a>.</p></div></div>
      <div class="learn-grid">${S2.map(([t, x], i) => `<article class="panel learn-step"><span class="learn-n">${emoteImg(EMOTES[(i * 7) % EMOTES.length], 'learn-emote')}</span><h3>${t}</h3><p>${x}</p></article>`).join('')}</div>
      <div class="panel rules-box"><h3>Reglas de construcción</h3><ul>
        <li>1 Leyenda, que fija tus dos dominios.</li><li>1 Campeón elegido (versión de la unidad de campeón de tu Leyenda), que cuenta como primera carta del mazo principal.</li>
        <li>Mazo principal de 40 cartas como mínimo, con un máximo de 3 copias por carta.</li><li>Solo cartas de los dominios de tu Leyenda.</li>
        <li>3 Campos de batalla.</li><li>Mazo de 12 runas de tus dominios.</li></ul>
        <div class="row" style="margin-top:16px"><a class="btn gold" href="#/mazos/nuevo">${gl('add')} Construir con el asistente</a></div></div></div>`;
  }

  function viewDeckEditor(view, r) {
    const d = deckById(r.parts[1]);
    if (!d) { view.innerHTML = `<div class="page empty">${emoteImg(randEmote(), 'empty-emote')}<h2>Mazo no encontrado</h2><a href="#/mazos">Volver</a></div>`; return; }
    if (r.parts[2] === 'ver') return renderGuide(view, d, { mine: true });
    const chk = deckCheck(d); const miss = deckMissing(d, state);
    const f = ui.deckFilter = ui.deckFilter || { q: '', type: '', energy: '' };
    ui.deckPane = ui.deckPane || 'lista';
    const doms = chk.doms;
    const pool = POOL.filter((p) => !isType(p, 'Legend') && !isType(p, 'Rune') && (isType(p, 'Battlefield') || (doms.length && domainsOk(p, doms))))
      .filter((p) => (!f.q || `${p.card} ${p.tags.join(' ')}`.toLowerCase().includes(f.q.toLowerCase())) && (!f.type || isType(p, f.type)) && (f.energy === '' || (f.energy === '7' ? p.energy >= 7 : p.energy === +f.energy)))
      .sort((a, b) => (a.energy ?? 99) - (b.energy ?? 99) || a.card.localeCompare(b.card)).slice(0, 160);
    const inDeck = (p) => (isType(p, 'Battlefield') ? (d.battlefields.includes(p.id) ? 1 : 0) : (d.cards[p.id] || 0));
    const g = d.guide || (d.guide = blankDeck().guide);
    view.innerHTML = `<div class="page builder">
      <section class="deck-hero" style="background-image:url('${esc(deckHeroArt(d))}')"><div class="dh-in">
        <a class="iconbtn" href="#/mazos" aria-label="Volver">${gl('prev')}</a>
        ${chk.L ? imgTag(chk.L, 200, 'dh-legend') : ''}${chk.ch ? imgTag(chk.ch, 200, 'dh-legend') : ''}
        <div style="flex:1;min-width:240px"><div class="eyebrow">${doms.map((x) => domainIcon(x)).join('')} ${doms.map((x) => DOMAIN_ES[x.toLowerCase()] || x).join(' + ')}</div>
          <input class="dh-name" id="dName" value="${esc(d.name)}" maxlength="60" aria-label="Nombre del mazo">
          <div class="row" style="margin-top:8px">${chk.valid ? '<span class="chip ok">Mazo legal</span>' : '<span class="chip warn">Incompleto</span>'}<span class="chip">${chk.mainTotal} cartas</span><span class="chip">Tienes ${miss.have}/${miss.total}</span></div></div>
        <div class="row"><label class="field"><span>Visibilidad</span><select id="dVis"><option value="privado" ${d.visibility === 'privado' ? 'selected' : ''}>Privado</option><option value="equipo" ${d.visibility === 'equipo' ? 'selected' : ''}>Mis equipos</option><option value="publico" ${d.visibility === 'publico' ? 'selected' : ''}>Guía pública</option></select></label>
          <a class="btn glass" href="#/mazo/${d.id}/ver">Ver como guía</a></div></div></section>
      <div class="seg" style="margin:18px 0"><button type="button" data-pane="lista" aria-pressed="${ui.deckPane === 'lista'}">Lista de cartas</button><button type="button" data-pane="guia" aria-pressed="${ui.deckPane === 'guia'}">Guía</button><button type="button" data-pane="herr" aria-pressed="${ui.deckPane === 'herr'}">Exportar y opciones</button></div>
      ${ui.deckPane === 'lista' ? `<div class="builder-grid">
        <section class="panel bpool"><div class="row" style="gap:10px;align-items:flex-end">
          <label class="field" style="flex:2;min-width:160px"><span>Buscar</span><input type="search" id="bq" value="${esc(f.q)}" placeholder="Nombre o etiqueta"></label>
          <label class="field" style="flex:1;min-width:110px"><span>Tipo</span><select id="bt"><option value="">Todos</option>${[['Unit', 'Unidad'], ['Spell', 'Hechizo'], ['Gear', 'Equipo'], ['Battlefield', 'Campo de batalla']].map(([k, v]) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="field" style="flex:1;min-width:90px"><span>Energía</span><select id="be"><option value="">Todas</option>${[0, 1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${String(f.energy) === String(n) ? 'selected' : ''}>${n === 7 ? '7+' : n}</option>`).join('')}</select></label></div>
          ${doms.length ? '' : '<div class="notice" style="margin-top:12px">Elige primero una Leyenda (asistente o «Exportar y opciones») para filtrar por dominios.</div>'}
          <div class="pool-grid">${pool.map((p) => `<div class="pool-card ${inDeck(p) ? 'in' : ''}" data-card="${esc(p.id)}">${imgTag(p, 260)}${inDeck(p) ? `<span class="qty">×${inDeck(p)}</span>` : ''}<button type="button" class="quick" data-padd="${esc(p.id)}" aria-label="Añadir ${esc(p.card)}">${gl('add')}</button></div>`).join('')}</div></section>
        <aside class="bside"><div class="panel"><h3>Lista</h3>${deckListHTML(d, { edit: true })}</div>
          <div class="panel"><h3>Curva de energía</h3>${curveSVG(d)}</div>
          <div class="panel"><h3>Reglas</h3><ul class="rules">${chk.rules.map((x) => `<li class="${x.ok ? 'ok' : 'bad'}"><span>${x.ok ? '✓' : '!'}</span>${esc(x.text)}</li>`).join('')}</ul><p class="tiny faint">Comprobación orientativa basada en la <a href="${DECK_RULES_URL}" target="_blank" rel="noopener">guía oficial</a>.</p></div>
          <div class="panel"><h3>Tu colección</h3><p class="small muted">Tienes ${miss.have} de ${miss.total} cartas (cualquier versión con el mismo nombre cuenta).</p>
            ${miss.missing.length ? `<ul class="miss">${miss.missing.map((x) => `<li><span>${x.q - x.have}×</span>${esc(x.p.card)}</li>`).join('')}</ul><button class="btn sm" id="dWish">${gl('wish', 'sm')} Añadir las que faltan a deseos</button>` : '<p class="chip ok">¡Puedes montarlo con tu colección!</p>'}</div></aside></div>`
      : ui.deckPane === 'guia' ? `<div class="guide-edit">
        <label class="field"><span>Resumen (aparece en la tarjeta de la guía)</span><textarea id="gSum" maxlength="400" placeholder="En dos frases: qué hace el mazo y por qué funciona.">${esc(g.summary)}</textarea></label>
        <label class="field"><span>Plan de juego</span><textarea id="gPlan" rows="7" maxlength="4000" placeholder="Cómo se gana: primeros turnos, mitad de partida y cierre.">${esc(g.plan)}</textarea></label>
        <label class="field"><span>Mulligan</span><textarea id="gMull" rows="4" maxlength="2000" placeholder="Qué buscar en la mano inicial y qué devolver.">${esc(g.mulligan)}</textarea></label>
        <div class="panel"><div class="row"><h3>Enfrentamientos</h3><span class="spacer"></span><button class="btn sm" id="gAddM">${gl('add', 'sm')} Añadir rival</button></div><p class="small muted">Tu valoración personal; Runario no calcula porcentajes de victoria.</p>
          ${(g.matchups || []).map((mu, i) => `<div class="mu-edit"><select data-mu="${i}" data-f="legend"><option value="">Leyenda rival…</option>${LEGENDS.map((p) => `<option value="${esc(p.id)}" ${mu.legend === p.id ? 'selected' : ''}>${esc(p.card)}</option>`).join('')}</select>
            <select data-mu="${i}" data-f="rating">${[['favorable', 'Favorable'], ['igualado', 'Igualado'], ['dificil', 'Difícil']].map(([k, v]) => `<option value="${k}" ${mu.rating === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
            <textarea data-mu="${i}" data-f="notes" rows="2" maxlength="1200" placeholder="Claves del enfrentamiento">${esc(mu.notes || '')}</textarea><button class="btn sm danger" data-mudel="${i}">Quitar</button></div>`).join('') || '<p class="muted small">Sin enfrentamientos.</p>'}</div>
        <label class="field"><span>Consejos y cartas clave</span><textarea id="gTips" rows="5" maxlength="3000">${esc(g.tips)}</textarea></label>
        <label class="field"><span>Vídeo (YouTube, opcional)</span><input type="text" id="gVid" value="${esc(g.video)}" placeholder="https://www.youtube.com/watch?v=…"></label>
        <div class="row"><span class="spacer"></span><button class="btn gold" id="gSave">${gl('check')} Guardar guía</button></div></div>`
      : `<div class="pf-grid"><div class="panel"><h3>Exportar lista</h3><textarea readonly rows="16" id="dTxt" style="font-family:ui-monospace,monospace;font-size:.8rem">${esc(deckText(d))}</textarea><div class="row" style="margin-top:10px"><button class="btn sm" id="dCopy">Copiar</button></div></div>
        <div class="panel" style="display:flex;flex-direction:column;gap:14px"><h3>Leyenda y campeón</h3>
          <label class="field"><span>Leyenda</span><select id="dLeg"><option value="">—</option>${LEGENDS.map((p) => `<option value="${esc(p.id)}" ${d.legend === p.id ? 'selected' : ''}>${esc(p.card)}</option>`).join('')}</select></label>
          <label class="field"><span>Campeón elegido</span><select id="dCh"><option value="">—</option>${CAT.prints.filter((p) => isType(p, 'Unit') && p.supertype === 'Champion' && chk.L && p.tags.includes(legendChamp(chk.L)) && !p.finish).map((p) => `<option value="${esc(p.id)}" ${d.champion === p.id ? 'selected' : ''}>${esc(p.card)} (${esc(p.set)} ${esc(p.no)})</option>`).join('')}</select></label>
          <button class="btn" id="dWiz">Ajustar runas y campos con el asistente</button>
          <button class="btn" id="dDup">Duplicar mazo</button><button class="btn danger" id="dDel">${gl('urn', 'sm')} Eliminar mazo</button></div></div>`}
    </div>`;
    const saveDeck = (label, fn, quiet = true) => commit(label, (s) => { const x = (s.decks || []).find((y) => y.id === d.id); if (x) { fn(x); x.updatedAt = today(); } }, { quiet });
    $('#dName', view).onchange = (e) => saveDeck('Nombre cambiado', (x) => { x.name = e.target.value.trim() || x.name; });
    $('#dVis', view).onchange = (e) => saveDeck(e.target.value === 'publico' ? 'Guía publicada para la comunidad' : e.target.value === 'equipo' ? 'Compartido con tus equipos' : 'Mazo privado', (x) => { x.visibility = e.target.value; }, false);
    $$('[data-pane]', view).forEach((b) => b.onclick = () => { ui.deckPane = b.dataset.pane; render(); });
    bindCards(view, null);
    if (ui.deckPane === 'lista') {
      const bq = $('#bq', view); bq.oninput = () => { f.q = bq.value; clearTimeout(bq._t); bq._t = setTimeout(() => { render(); const n = $('#bq'); n.focus(); n.setSelectionRange(f.q.length, f.q.length); }, 200); };
      $('#bt', view).onchange = (e) => { f.type = e.target.value; render(); };
      $('#be', view).onchange = (e) => { f.energy = e.target.value; render(); };
      const addCard = (id, delta, kind) => saveDeck(delta > 0 ? 'Carta añadida' : 'Carta quitada', (x) => {
        const p = P(id);
        if (kind === 'bf' || isType(p, 'Battlefield')) { x.battlefields = delta > 0 ? (x.battlefields.includes(id) ? x.battlefields : [...x.battlefields, id]) : x.battlefields.filter((y) => y !== id); return; }
        const box = kind === 'runes' ? x.runes : x.cards; const v = Math.max(0, (box[id] || 0) + delta); if (v) box[id] = v; else delete box[id];
      });
      $$('[data-padd]', view).forEach((b) => b.onclick = (e) => { e.stopPropagation(); addCard(b.dataset.padd, 1); });
      $$('[data-dq]', view).forEach((b) => b.onclick = (e) => { e.stopPropagation(); addCard(b.dataset.dq, +b.dataset.d, b.dataset.k); });
      if ($('#dWish', view)) $('#dWish', view).onclick = () => commit(`${miss.missing.length} cartas añadidas a deseos`, (s) => { for (const x of miss.missing) s.wish[x.p.id] = true; });
    }
    if (ui.deckPane === 'guia') {
      const read = (x) => { x.guide = x.guide || blankDeck().guide; x.guide.summary = $('#gSum').value; x.guide.plan = $('#gPlan').value; x.guide.mulligan = $('#gMull').value; x.guide.tips = $('#gTips').value; x.guide.video = $('#gVid').value.trim();
        $$('[data-mu]').forEach((el) => { const mu = x.guide.matchups[+el.dataset.mu]; if (mu) mu[el.dataset.f] = el.value; }); };
      $('#gSave', view).onclick = () => saveDeck('Guía guardada', read, false);
      $('#gAddM', view).onclick = () => saveDeck('Rival añadido', (x) => { read(x); x.guide.matchups.push({ legend: '', rating: 'igualado', notes: '' }); });
      $$('[data-mudel]', view).forEach((b) => b.onclick = () => saveDeck('Rival quitado', (x) => { read(x); x.guide.matchups.splice(+b.dataset.mudel, 1); }));
    }
    if (ui.deckPane === 'herr') {
      $('#dCopy', view).onclick = () => navigator.clipboard?.writeText($('#dTxt').value).then(() => toast('Lista copiada'));
      $('#dLeg', view).onchange = (e) => saveDeck('Leyenda cambiada', (x) => { x.legend = e.target.value || null; x.champion = null; });
      $('#dCh', view).onchange = (e) => saveDeck('Campeón cambiado', (x) => { x.champion = e.target.value || null; });
      $('#dWiz', view).onclick = () => { ui.wizard = { step: 2, d: JSON.parse(JSON.stringify(d)), q: '', editing: d.id }; location.hash = '#/mazos/nuevo'; };
      $('#dDup', view).onclick = () => { const c = { ...JSON.parse(JSON.stringify(d)), id: blankDeck().id, name: `${d.name} (copia)`, visibility: 'privado' }; commit('Mazo duplicado', (s) => s.decks.push(c), { noRender: true }); location.hash = `#/mazo/${c.id}`; };
      $('#dDel', view).onclick = () => { if (!confirm('¿Eliminar este mazo? Puedes deshacerlo con Ctrl+Z.')) return; commit('Mazo eliminado', (s) => { s.decks = s.decks.filter((x) => x.id !== d.id); }, { noRender: true }); location.hash = '#/mazos'; };
    }
  }

  // Vista de guía estilo editorial (propia o de otra persona).
  function youtubeId(u) { const m = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(u || ''); return m ? m[1] : null; }
  const para = (t) => esc(t || '').split(/\n{2,}/).map((x) => `<p>${x.replace(/\n/g, '<br>')}</p>`).join('');
  function renderGuide(view, d, o = {}) {
    const chk = deckCheck(d); const miss = deckMissing(d, state); const g = d.guide || {};
    const sections = [['resumen', 'Resumen', g.summary], ['lista', 'Lista', true], ['plan', 'Plan de juego', g.plan], ['mulligan', 'Mulligan', g.mulligan], ['matchups', 'Enfrentamientos', (g.matchups || []).length], ['consejos', 'Consejos', g.tips], ['video', 'Vídeo', youtubeId(g.video)]].filter((s) => s[2]);
    const yt = youtubeId(g.video);
    view.innerHTML = `<div class="page guide">
      <section class="guide-hero" style="background-image:url('${esc(deckHeroArt(d))}')"><div class="gh-in">
        <a class="iconbtn" href="${o.mine ? `#/mazo/${d.id}` : '#/mazos'}" aria-label="Volver">${gl('prev')}</a>
        <div class="gh-cards">${chk.L ? imgTag(chk.L, 300) : ''}${chk.ch ? imgTag(chk.ch, 300) : ''}</div>
        <div><div class="eyebrow">${chk.doms.map((x) => domainIcon(x)).join('')} Guía de mazo · ${chk.doms.map((x) => DOMAIN_ES[x.toLowerCase()] || x).join(' + ')}</div><h1>${esc(d.name)}</h1>
          <p class="gh-meta">${d.author ? `por <b>${esc(d.author.displayName)}</b> · ` : o.mine ? 'Tu mazo · ' : ''}actualizada ${esc(d.updatedAt || '')} · ${chk.mainTotal} cartas ${chk.valid ? '· mazo legal' : '· incompleto'}</p>
          <div class="row" style="margin-top:14px">${o.mine ? `<a class="btn gold" href="#/mazo/${d.id}">${gl('workshop', 'sm')} Editar</a>` : `<button class="btn gold" id="gImport">${gl('add', 'sm')} Copiar a mis mazos</button>`}<button class="btn glass" id="gCopy">Copiar lista</button></div></div></div></section>
      <div class="guide-body"><nav class="guide-toc" aria-label="Secciones">${sections.map(([k, l]) => `<a href="#g-${k}" data-toc="${k}">${l}</a>`).join('')}
          <div class="panel" style="margin-top:16px;padding:14px"><b class="small">Con tu colección</b><div class="bar" style="margin:8px 0"><i style="width:${miss.total ? (miss.have / miss.total) * 100 : 0}%"></i></div><span class="tiny">Tienes ${miss.have}/${miss.total} cartas</span>${miss.missing.length ? '<button class="btn sm" id="gWish" style="margin-top:8px">Añadir faltantes a deseos</button>' : ''}</div></nav>
        <article class="guide-main">
          ${g.summary ? `<section id="g-resumen"><h2>Resumen</h2>${para(g.summary)}</section>` : ''}
          <section id="g-lista"><h2>Lista</h2><div class="guide-list">${deckListHTML(d)}<div><h4>Curva de energía</h4>${curveSVG(d)}</div></div></section>
          ${g.plan ? `<section id="g-plan"><h2>Plan de juego</h2>${para(g.plan)}</section>` : ''}
          ${g.mulligan ? `<section id="g-mulligan"><h2>Mulligan</h2>${para(g.mulligan)}</section>` : ''}
          ${(g.matchups || []).length ? `<section id="g-matchups"><h2>Enfrentamientos</h2><p class="small muted">Valoración del autor, no estadística.</p><div class="mu-list">${g.matchups.map((mu) => { const p = P(mu.legend); return `<div class="mu ${esc(mu.rating)}">${p ? imgTag(p, 160) : ''}<div><b>${p ? esc(p.card) : 'Rival'}</b><span class="mu-r">${{ favorable: 'Favorable', igualado: 'Igualado', dificil: 'Difícil' }[mu.rating] || ''}</span>${para(mu.notes)}</div></div>`; }).join('')}</div></section>` : ''}
          ${g.tips ? `<section id="g-consejos"><h2>Consejos</h2>${para(g.tips)}</section>` : ''}
          ${yt ? `<section id="g-video"><h2>Vídeo</h2><div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="Vídeo de la guía" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div></section>` : ''}
        </article></div></div>`;
    bindCards(view, null);
    $('#gCopy', view).onclick = () => navigator.clipboard?.writeText(deckText(d)).then(() => toast('Lista copiada'));
    if ($('#gWish', view)) $('#gWish', view).onclick = () => commit('Faltantes añadidas a deseos', (s) => { for (const x of miss.missing) s.wish[x.p.id] = true; });
    if ($('#gImport', view)) $('#gImport', view).onclick = () => { const { author, ...rest } = d; const c = { ...JSON.parse(JSON.stringify(rest)), id: blankDeck().id, name: `${d.name} (de ${author ? author.displayName : 'la comunidad'})`, visibility: 'privado', updatedAt: today() }; commit('Mazo copiado a tus mazos', (s) => { s.decks = s.decks || []; s.decks.push(c); }, { noRender: true }); location.hash = `#/mazo/${c.id}`; };
    $$('[data-toc]', view).forEach((a) => a.onclick = (e) => { e.preventDefault(); const t = $(`#g-${a.dataset.toc}`, view); if (t) t.scrollIntoView({ behavior: animOn() ? 'smooth' : 'auto', block: 'start' }); });
  }
  async function viewGuide(view, r) {
    view.innerHTML = `<div class="page empty">${emoteImg(randEmote(), 'empty-emote')}Abriendo la guía…</div>`;
    try {
      const res = await api('GET', `/api/guides/${encodeURIComponent(r.parts[1])}/${encodeURIComponent(r.parts[2])}`);
      if (!res.ok) { view.innerHTML = `<div class="page empty">${emoteImg(randEmote(), 'empty-emote')}<h2>${esc(res.data.error || 'Guía no disponible')}</h2><a href="#/mazos">Volver</a></div>`; return; }
      renderGuide(view, res.data, {});
    } catch { view.innerHTML = '<div class="page empty"><h2>Sin conexión con el servidor.</h2></div>'; }
  }

  // ================= Partidas (EloShowdown) =================
  const ESD_SITE = 'https://eloshowdown.com';
  const esdGet = (p) => api('GET', `/api/esd${p}`).then((r) => (r.ok ? r.data : Promise.reject(r.data && r.data.error ? new Error(r.data.error) : new Error('Sin datos'))));
  const TIER_ES = { iron: 'Hierro', bronze: 'Bronce', silver: 'Plata', gold: 'Oro', platinum: 'Platino', emerald: 'Esmeralda', diamond: 'Diamante', master: 'Maestro', grandmaster: 'Gran Maestro', challenger: 'Aspirante' };
  const esdTier = (t) => (AS.ranked[String(t || '').toLowerCase()] ? String(t).toLowerCase() : null);
  function eloSVG(points) {
    if (!points.length) return '<p class="muted small">Sin partidas esta temporada.</p>';
    const vals = points.map((p) => p.elo_after); const min = Math.min(...vals, points[0].elo_before) - 15; const max = Math.max(...vals, points[0].elo_before) + 15;
    const W = 760; const H = 220; const x = (i) => 30 + (i / Math.max(1, points.length - 1)) * (W - 50); const y = (v) => 10 + (1 - (v - min) / (max - min)) * (H - 40);
    const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.elo_after).toFixed(1)}`).join('');
    const ticks = [min + 15, (min + max) / 2, max - 15].map((v) => Math.round(v));
    return `<svg class="elo" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de ELO: de ${points[0].elo_before} a ${vals[vals.length - 1]} en ${points.length} partidas">
      ${ticks.map((t) => `<g><line x1="30" x2="${W - 20}" y1="${y(t)}" y2="${y(t)}" class="grid"/><text x="2" y="${y(t) + 4}" class="k">${t}</text></g>`).join('')}
      <path d="${path} L${x(points.length - 1)} ${H - 30} L30 ${H - 30}Z" class="area"/><path d="${path}" class="line"/>
      ${points.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.elo_after).toFixed(1)}" r="3.5" class="pt ${p.result}"><title>${esc(p.date.slice(0, 10))} · ${p.result === 'win' ? 'Victoria' : p.result === 'loss' ? 'Derrota' : 'Empate'} contra ${esc(p.opponent_name || '')} · ${p.elo_change > 0 ? '+' : ''}${p.elo_change} → ${p.elo_after}</title></circle>`).join('')}</svg>`;
  }
  function radarSVG(dims) {
    const keys = [['dominance', 'Dominio'], ['consistency', 'Constancia'], ['composure', 'Temple'], ['sweep_power', 'Barridas'], ['event_mastery', 'Eventos'], ['clutch_closer', 'Remate']];
    const cx = 150; const cy = 140; const R = 100;
    const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / keys.length; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
    const poly = keys.map(([k], i) => pt(i, Math.max(0, Math.min(100, dims[k] || 0)) / 100).map((n) => n.toFixed(1)).join(',')).join(' ');
    return `<svg class="radar" viewBox="0 0 300 290" role="img" aria-label="ADN de juego: ${keys.map(([k, l]) => `${l} ${Math.round(dims[k] || 0)}`).join(', ')}">
      ${[0.25, 0.5, 0.75, 1].map((s) => `<polygon points="${keys.map((_, i) => pt(i, s).join(',')).join(' ')}" class="grid"/>`).join('')}
      <polygon points="${poly}" class="area"/>${keys.map(([k, l], i) => { const [tx, ty] = pt(i, 1.24); return `<text x="${tx}" y="${ty}" text-anchor="middle" class="k">${l} <tspan class="v">${Math.round(dims[k] || 0)}</tspan></text>`; }).join('')}</svg>`;
  }
  function viewMatches(view, r) {
    const prof = { ...defaultProfile(), ...(state.profile || {}) };
    const otherId = r.parts[1] && /^\d+$/.test(r.parts[1]) ? r.parts[1] : null;
    const pid = otherId || prof.esdId;
    const head = `<div class="pagehead"><div><div class="eyebrow">Lo que pasa en la mesa</div><h1>${otherId ? 'Ficha de jugador' : 'Mis partidas'}</h1><p class="muted" style="max-width:72ch">Tus torneos oficiales, según <a href="${ESD_SITE}/riftbound" target="_blank" rel="noopener">EloShowdown</a>, un proyecto comunitario que lee los resultados públicos de la plataforma oficial de Riftbound. Se consultan en directo y no se guardan en Runario.</p></div><span class="spacer"></span>${pid && !otherId ? '<button class="btn" id="mUnlink">Cambiar jugador</button>' : ''}</div>`;
    if (!pid) {
      view.innerHTML = `<div class="page">${head}<div class="panel link-esd"><h3>Vincula tu jugador</h3><p class="small muted">Busca el nombre con el que juegas torneos. Cualquiera puede vincular un perfil público, así que la vinculación no está verificada.</p>
        <div class="row" style="margin-top:12px"><input type="search" id="esq" placeholder="Tu nombre de jugador (mín. 3 letras)" style="flex:1;max-width:460px"><button class="btn gold" id="esgo">${gl('search', 'sm')} Buscar</button></div><div id="esres" class="esd-results"></div></div>
        <p class="tiny faint" style="margin-top:16px">Powered by eloshowdown.com · No afiliado a Riot Games ni UVS Games.</p></div>`;
      const go = async () => {
        const q = $('#esq').value.trim(); const out = $('#esres');
        if (q.length < 3) { out.innerHTML = '<p class="small muted">Escribe al menos 3 letras.</p>'; return; }
        out.innerHTML = '<p class="small muted">Buscando…</p>';
        try { const list = await esdGet(`/search?q=${encodeURIComponent(q)}`); out.innerHTML = list.length ? list.slice(0, 20).map((p) => `<button type="button" data-esd="${p.id}"><b>${esc(p.display_name)}</b><span class="small muted">${esc(p.primary_community || '')} · ${esc(p.country || '')}</span></button>`).join('') : '<p class="small muted">Sin resultados.</p>';
          $$('[data-esd]', out).forEach((b) => b.onclick = () => commit('Jugador vinculado', (s) => { s.profile = { ...defaultProfile(), ...(s.profile || {}), esdId: b.dataset.esd }; }));
        } catch (e) { out.innerHTML = `<p class="small" style="color:var(--bad)">${esc(e.message)}</p>`; }
      };
      $('#esgo', view).onclick = go; $('#esq', view).onkeydown = (e) => { if (e.key === 'Enter') go(); };
      return;
    }
    view.innerHTML = `<div class="page">${head}<div id="esdBody"><div class="empty">${emoteImg(randEmote(), 'empty-emote')}Consultando EloShowdown…</div></div></div>`;
    if ($('#mUnlink', view)) $('#mUnlink', view).onclick = () => commit('Jugador desvinculado', (s) => { if (s.profile) delete s.profile.esdId; });
    Promise.all([esdGet(`/players/${pid}`), esdGet(`/players/${pid}/stats`), esdGet(`/players/${pid}/rank`).catch(() => null), esdGet(`/players/${pid}/form`).catch(() => null), esdGet(`/players/${pid}/dna`).catch(() => null),
      esdGet(`/players/${pid}/elo-history`).catch(() => ({ points: [] })), esdGet(`/players/${pid}/achievements`).catch(() => []), esdGet(`/players/${pid}/top-opponents`).catch(() => [])])
      .then(([pl, stats, rank, form, dna, hist, achs, opps]) => {
        const box = $('#esdBody'); if (!box) return;
        const season = (stats.seasons || [])[0] || {};
        const tier = esdTier(rank && rank.tier);
        box.innerHTML = `<section class="esd-hero">${tier ? A.rankMedal(tier, { done: true, cls: 'lg' }) : ''}
            <div><div class="eyebrow">${esc(pl.primary_community || '')} · ${esc(pl.country || '')}</div><h2>${esc(pl.display_name)}</h2>
              <p class="muted">${rank ? `${esc(TIER_ES[tier] || rank.tier || '')} en su comunidad · ${esc(rank.season_name || season.season_name || '')}` : esc(season.season_name || '')}</p>
              <a class="small" href="${ESD_SITE}/riftbound/player/${pl.id}/${esc((rank && rank.season_slug) || season.season_slug || "")}/" target="_blank" rel="noopener">Ver en EloShowdown ↗</a></div>
            <div class="esd-big"><div><b>${season.current_elo ?? '—'}</b><span>ELO actual</span></div><div><b>${season.peak_elo ?? '—'}</b><span>Pico</span></div><div><b>${season.wins ?? 0}-${season.losses ?? 0}-${season.draws ?? 0}</b><span>V-D-E temporada</span></div><div><b>${season.tournaments ?? 0}</b><span>Torneos</span></div><div><b>${pl.lifetime_total_matches ?? 0}</b><span>Partidas totales</span></div></div></section>
          <div class="pf-grid">
            <div class="panel"><h3>Evolución de ELO · ${esc(season.season_name || '')}</h3>${eloSVG(hist.points || [])}</div>
            <div class="panel"><h3>ADN de juego</h3>${dna && dna.dimensions ? radarSVG(dna.dimensions) : '<p class="muted small">Sin datos.</p>'}</div></div>
          <div class="pf-grid">
            <div class="panel"><h3>Forma reciente</h3>${form ? `<div class="form-row">${form.last_n.map((x) => `<span class="fr ${x}">${x === 'W' ? 'V' : x === 'L' ? 'D' : 'E'}</span>`).join('')}</div>
              <p class="small muted" style="margin-top:10px">Racha actual: ${form.current_streak ? `${form.current_streak.length} ${form.current_streak.type === 'win' ? 'victorias' : form.current_streak.type === 'loss' ? 'derrotas' : 'empates'}` : '—'} · mejor racha: ${form.longest_win_streak} · ELO en este tramo: ${form.elo_change_last_n > 0 ? '+' : ''}${form.elo_change_last_n}</p>` : '<p class="muted small">Sin datos.</p>'}
              <h3 style="margin-top:20px">Temporadas</h3><table class="simple"><tr><th>Temporada</th><th>V-D-E</th><th>ELO</th><th>Pico</th></tr>${(stats.seasons || []).map((s) => `<tr><td>${esc(s.season_name)}</td><td class="n">${s.wins}-${s.losses}-${s.draws}</td><td class="n">${s.current_elo}</td><td class="n">${s.peak_elo}</td></tr>`).join('')}</table></div>
            <div class="panel"><h3>Rivales frecuentes</h3><table class="simple"><tr><th>Rival</th><th>Partidas</th><th>V-D-E</th></tr>${opps.slice(0, 10).map((o) => `<tr><td><a href="#/partidas/${o.opponent_id}">${esc(o.opponent_name)}</a> <span class="tiny faint">${esc(o.opponent_community || '')}</span></td><td class="n">${o.total_matches}</td><td class="n">${o.wins}-${o.losses}-${o.draws}</td></tr>`).join('') || '<tr><td class="muted">—</td></tr>'}</table>
              ${achs.length ? `<h3 style="margin-top:20px">Logros de torneo</h3><div class="esd-achs">${achs.slice(0, 18).map((a) => `<span class="esd-ach ${esc(a.rarity)}" title="${esc(a.name)} · ${esc(a.season_name || '')}"><img src="${ESD_SITE}/static/${esc(a.icon)}" alt="" loading="lazy" onerror="this.remove()">${esc(a.name)}</span>`).join('')}</div>` : ''}</div></div>
          <p class="tiny faint">Powered by eloshowdown.com · Datos comunitarios, actualizados a diario, no afiliados a Riot Games ni UVS Games. Runario no crea clasificaciones ni porcentajes de victoria por mazo, conforme a la política de Riot para Riftbound.</p>`;
      }).catch((e) => { const box = $('#esdBody'); if (box) box.innerHTML = `<div class="empty">${emoteImg(randEmote(), 'empty-emote')}<p>No se pudo consultar EloShowdown: ${esc(e.message)}</p></div>`; });
  }

  // ================= Equipos =================
  const ROLE_ES = { lider: 'Líder', oficial: 'Oficial', miembro: 'Miembro' };
  function viewTeams(view, r) {
    if (r.parts[1]) return viewTeam(view, r.parts[1]);
    if (!S.user) {
      view.innerHTML = `<div class="page"><div class="pagehead"><div><div class="eyebrow">Tu gente</div><h1>Equipos</h1></div></div><div class="empty panel">${emoteImg(randEmote(), 'empty-emote')}<p>Los equipos necesitan una cuenta: así tus compañeros ven tu colección, tus mazos y tu ficha de partidas.</p><a class="btn gold" href="#/entrar" style="margin-top:12px">Crear cuenta o entrar</a></div></div>`;
      return;
    }
    view.innerHTML = `<div class="page"><div class="pagehead"><div><div class="eyebrow">Tu gente</div><h1>Equipos</h1><p class="muted" style="max-width:70ch">Monta un equipo con tus amigos o con los de tu tienda: os veis las colecciones, os cruzáis los cambios y compartís mazos sin pasaros capturas.</p></div></div>
      <div class="pf-grid"><div id="teamList" class="team-list"><div class="empty">Cargando…</div></div>
        <div style="display:flex;flex-direction:column;gap:20px">
          <form class="panel" id="tJoin" style="display:flex;flex-direction:column;gap:12px"><h3>Unirme con un código</h3><input type="text" id="tCode" maxlength="12" placeholder="Código de invitación" autocapitalize="characters" style="text-transform:uppercase"><button class="btn gold">Unirme</button></form>
          <form class="panel" id="tNew" style="display:flex;flex-direction:column;gap:12px"><h3>Crear equipo</h3>
            <label class="field"><span>Nombre</span><input type="text" id="tName" maxlength="40" required></label>
            <label class="field"><span>Etiqueta (2–5)</span><input type="text" id="tTag" maxlength="5" required style="text-transform:uppercase"></label>
            <label class="field"><span>Descripción</span><textarea id="tDesc" maxlength="400" rows="3"></textarea></label>
            <label class="field"><span>Campeón del estandarte</span><select id="tChamp">${AS.champions.map((c) => `<option value="${c.id}" ${c.id === 'Jinx' ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
            <button class="btn gold">${gl('add', 'sm')} Crear</button></form></div></div></div>`;
    api('GET', '/api/teams').then((res) => {
      const el = $('#teamList'); if (!el) return;
      el.innerHTML = res.ok && res.data.length ? res.data.map((t) => `<a class="team-card" href="#/equipos/${t.id}" style="--tc:${esc(t.color)}"><div class="tc-art" style="background-image:url('${esc(splash(t.champ))}')"></div><div class="tc-in"><span class="tc-tag">[${esc(t.tag)}]</span><h3>${esc(t.name)}</h3><span class="small">${t.members} miembros · ${esc(ROLE_ES[t.role] || '')}</span></div></a>`).join('')
        : `<div class="empty panel">${emoteImg(randEmote(), 'empty-emote')}<p>Aún no estás en ningún equipo.</p></div>`;
    });
    $('#tJoin', view).onsubmit = async (e) => { e.preventDefault(); const res = await api('POST', '/api/teams/join', { code: $('#tCode').value }); if (res.ok) { toast(`Te has unido a ${res.data.name}`, { emote: randEmote() }); location.hash = `#/equipos/${res.data.id}`; } else toast(res.data.error || 'No se pudo unir.'); };
    $('#tNew', view).onsubmit = async (e) => { e.preventDefault(); const res = await api('POST', '/api/teams', { name: $('#tName').value, tag: $('#tTag').value, description: $('#tDesc').value, champ: $('#tChamp').value }); if (res.ok) { toast('Equipo creado', { emote: randEmote() }); location.hash = `#/equipos/${res.data.id}`; } else toast(res.data.error || 'No se pudo crear.'); };
  }
  async function viewTeam(view, id) {
    if (!ui.team || ui.team.id !== id) view.innerHTML = `<div class="page empty">${emoteImg(randEmote(), 'empty-emote')}Abriendo el equipo…</div>`;
    const res = await api('GET', `/api/teams/${id}`).catch(() => ({ ok: false, data: {} }));
    if (!res.ok) { view.innerHTML = `<div class="page empty"><h2>${esc(res.data.error || 'Equipo no disponible')}</h2><a href="#/equipos">Volver</a></div>`; return; }
    const t = ui.team = res.data;
    ui.teamTab = ui.teamTab || 'muro';
    const me = S.user.id; const manage = ['lider', 'oficial'].includes(t.youAre);
    const member = (uid) => t.members.find((m) => m.uid === uid);
    const myWish = new Set(Object.keys(state.wish).filter((k) => state.wish[k]));
    const myTrade = state.lots.filter((l) => l.trade > 0);
    const forMe = t.trades.filter((x) => x.uid !== me && (myWish.has(x.printId) || [...myWish].some((w) => P(w) && P(x.printId) && P(w).card === P(x.printId).card)));
    const fromMe = myTrade.flatMap((l) => t.wishes.filter((w) => w.uid !== me && P(w.printId) && P(l.printId) && P(w.printId).card === P(l.printId).card).map((w) => ({ ...w, mine: l })));
    const tabs = [['muro', 'Muro'], ['miembros', `Miembros (${t.members.length})`], ['intercambios', `Intercambios${forMe.length + fromMe.length ? ` (${forMe.length + fromMe.length})` : ''}`], ['coleccion', 'Colección'], ['mazos', `Mazos y guías (${t.decks.length})`], ...(manage || t.youAre ? [['ajustes', 'Ajustes']] : [])];
    const tradeRow = (x, who, extra = '') => { const p = P(x.printId); if (!p) return ''; return `<div class="trade-row" data-card="${esc(p.id)}">${imgTag(p, 120)}<div><b>${esc(p.card)}</b><span class="small muted">${esc(p.set)} ${esc(p.no)}${x.lang ? ` · ${esc(x.lang)} · ${esc(x.finish)}` : ''}${x.qty ? ` · ×${x.qty}` : ''}</span><span class="small">${who}</span>${extra}</div></div>`; };
    let body = '';
    if (ui.teamTab === 'muro') body = `<form class="panel post-form" id="tPost"><textarea id="tTxt" rows="3" maxlength="1000" placeholder="Escribe al equipo: quedadas, torneos, intercambios…"></textarea>
        <div class="row"><select id="tDeck"><option value="">Adjuntar un mazo (opcional)</option>${(state.decks || []).filter((d) => d.visibility !== 'privado').map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select><span class="spacer"></span><button class="btn gold">Publicar</button></div>
        ${(state.decks || []).some((d) => d.visibility === 'privado') ? '<p class="tiny faint">Solo se pueden adjuntar mazos compartidos con tus equipos o públicos.</p>' : ''}</form>
      <div class="feed">${t.posts.slice().reverse().map((p) => { const m = member(p.uid); const d = p.deckId && t.decks.find((x) => x.id === p.deckId);
        return p.uid === 'system' ? `<div class="post sys">${esc(p.text)} <span class="tiny faint">${esc(p.at.slice(0, 10))}</span></div>` : `<div class="post">${A.champIcon(m ? m.champ : 'Jinx', 40)}<div class="post-b"><div class="row" style="gap:8px"><b>${esc(m ? m.displayName : 'Antiguo miembro')}</b><span class="tiny faint">${esc(p.at.slice(0, 16).replace('T', ' '))}</span><span class="spacer"></span>${p.uid === me || manage ? `<button class="btn sm ghost" data-delpost="${p.id}">Borrar</button>` : ''}</div>${para(p.text)}
          ${d ? `<a class="post-deck" href="#/guia/${d.author.uid}/${d.id}">${P(d.legend) ? imgTag(P(d.legend), 120) : ''}<span><b>${esc(d.name)}</b><span class="small muted">Mazo de ${esc(d.author.displayName)}</span></span></a>` : ''}</div></div>`; }).join('') || `<div class="empty">${emoteImg(randEmote(), 'empty-emote')}Nadie ha escrito todavía.</div>`}</div>`;
    if (ui.teamTab === 'miembros') body = `<p class="small muted" style="margin-bottom:14px">Orden alfabético. La ficha de partidas viene de EloShowdown si el miembro ha vinculado su jugador; Runario no ordena ni clasifica a los miembros.</p><div class="member-grid">${t.members.map((m) => `<div class="member" data-esdm="${esc(m.esdId || '')}">${A.champIcon(m.champ, 64)}<div><b>${esc(m.displayName)}</b><span class="small muted">@${esc(m.username)} · ${esc(ROLE_ES[m.role])}</span><span class="small">${m.distinct} carta${m.distinct === 1 ? '' : 's'} distinta${m.distinct === 1 ? '' : 's'} · ${m.copies} copia${m.copies === 1 ? '' : 's'}</span>
        <div class="m-esd small muted">${m.esdId ? 'Cargando partidas…' : 'Sin jugador vinculado'}</div></div>
        ${t.youAre === 'lider' && m.uid !== me ? `<div class="m-act"><select data-role="${m.uid}"><option value="miembro" ${m.role === 'miembro' ? 'selected' : ''}>Miembro</option><option value="oficial" ${m.role === 'oficial' ? 'selected' : ''}>Oficial</option><option value="lider">Pasar liderazgo</option></select><button class="btn sm danger" data-kick="${m.uid}">Expulsar</button></div>` : manage && m.role === 'miembro' && m.uid !== me ? `<div class="m-act"><button class="btn sm danger" data-kick="${m.uid}">Expulsar</button></div>` : ''}</div>`).join('')}</div>`;
    if (ui.teamTab === 'intercambios') body = `<div class="pf-grid"><div class="panel"><h3>Te pueden dar (${forMe.length})</h3><p class="small muted">Cartas que un compañero tiene para intercambiar y están en tu lista de deseos.</p><div class="trade-list">${forMe.map((x) => tradeRow(x, `Tiene: ${esc(member(x.uid) ? member(x.uid).displayName : '')}`)).join('') || '<p class="muted small">Nada por ahora. Marca cartas como deseadas en tu colección.</p>'}</div></div>
        <div class="panel"><h3>Puedes darles (${fromMe.length})</h3><p class="small muted">Cartas que tienes para intercambio y algún compañero busca.</p><div class="trade-list">${fromMe.map((x) => tradeRow({ ...x.mine }, `La busca: ${esc(member(x.uid) ? member(x.uid).displayName : '')}`)).join('') || '<p class="muted small">Nada por ahora. Marca tus repetidas para intercambio.</p>'}</div></div></div>
      <div class="panel" style="margin-top:20px"><h3>Todas las cartas para intercambio del equipo (${t.trades.length})</h3><div class="trade-list wide">${t.trades.map((x) => tradeRow(x, esc(member(x.uid) ? member(x.uid).displayName : ''))).join('') || '<p class="muted small">Nadie ha marcado cartas para intercambio.</p>'}</div></div>`;
    if (ui.teamTab === 'coleccion') body = `<div class="panel"><h3>Colección conjunta</h3><p class="muted">Entre todos tenéis <b>${t.unionDistinct}</b> versiones distintas de cartas.</p>
      <div class="member-grid" style="margin-top:16px">${t.members.map((m) => `<div class="member">${A.champIcon(m.champ, 48)}<div><b>${esc(m.displayName)}</b><div class="bar" style="margin:6px 0"><i style="width:${t.unionDistinct ? (m.distinct / t.unionDistinct) * 100 : 0}%"></i></div><span class="small muted">${m.distinct} distintas · ${m.copies} copias</span></div></div>`).join('')}</div></div>`;
    if (ui.teamTab === 'mazos') body = `<p class="small muted" style="margin-bottom:14px">Mazos que los miembros comparten con sus equipos o publican como guía. Para compartir uno tuyo, cambia su visibilidad a «Mis equipos» en el constructor.</p><div class="deck-grid">${t.decks.map((d) => deckCard(d, `#/guia/${d.author.uid}/${d.id}`, state, d.author)).join('') || `<div class="empty panel">${emoteImg(randEmote(), 'empty-emote')}<p>Aún no hay mazos compartidos.</p></div>`}</div>`;
    if (ui.teamTab === 'ajustes') body = `<div class="pf-grid">${manage ? `<form class="panel" id="tEdit" style="display:flex;flex-direction:column;gap:12px"><h3>Editar equipo</h3>
        <label class="field"><span>Nombre</span><input type="text" id="eName" value="${esc(t.name)}" maxlength="40"></label>
        <label class="field"><span>Descripción</span><textarea id="eDesc" maxlength="400" rows="3">${esc(t.description)}</textarea></label>
        <label class="field"><span>Campeón del estandarte</span><select id="eChamp">${AS.champions.map((c) => `<option value="${c.id}" ${c.id === t.champ ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
        <label class="field"><span>Color</span><input type="color" id="eColor" value="${esc(t.color)}"></label><button class="btn gold">Guardar</button></form>` : ''}
        <div style="display:flex;flex-direction:column;gap:20px">${t.code ? `<div class="panel"><h3>Invitación</h3><p class="small muted">Comparte este código con quien quieras invitar.</p><div class="invite-code">${esc(t.code)}</div><div class="row"><button class="btn sm" id="tCopyCode">Copiar</button><button class="btn sm" id="tNewCode">Generar otro</button></div></div>` : ''}
          <div class="panel"><h3>Salir</h3><div class="row"><button class="btn danger" id="tLeave">Abandonar el equipo</button>${t.youAre === 'lider' ? '<button class="btn danger" id="tDelete">Disolver equipo</button>' : ''}</div></div></div></div>`;
    view.innerHTML = `<div class="page">
      <section class="team-hero" style="background-image:url('${esc(splash(t.champ))}');--tc:${esc(t.color)}"><div class="th-in"><a class="iconbtn" href="#/equipos" aria-label="Volver">${gl('prev')}</a>
        <div><span class="tc-tag">[${esc(t.tag)}]</span><h1>${esc(t.name)}</h1>${t.description ? `<p>${esc(t.description)}</p>` : ''}<div class="row" style="margin-top:10px"><span class="chip">${t.members.length} miembros</span><span class="chip">${t.unionDistinct} carta${t.unionDistinct === 1 ? '' : 's'} distinta${t.unionDistinct === 1 ? '' : 's'} entre todos</span><span class="chip">${t.decks.length} mazos</span><span class="chip gold">${esc(ROLE_ES[t.youAre] || '')}</span></div></div>
        <div class="th-avatars">${t.members.slice(0, 8).map((m) => A.champIcon(m.champ, 44)).join('')}</div></div></section>
      <div class="tabs" role="tablist" style="margin:20px 0">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tt="${k}" aria-selected="${ui.teamTab === k}">${l}</button>`).join('')}</div>
      ${body}</div>`;
    $$('[data-tt]', view).forEach((b) => b.onclick = () => { ui.teamTab = b.dataset.tt; viewTeam(view, id); });
    bindCards(view, null);
    const act = async (method, path, body2, msg) => { const r2 = await api(method, path, body2); if (r2.ok) { if (msg) toast(msg); return true; } toast(r2.data.error || 'No se pudo completar.'); return false; };
    if ($('#tPost', view)) $('#tPost', view).onsubmit = async (e) => { e.preventDefault(); if (await act('POST', `/api/teams/${id}/posts`, { text: $('#tTxt').value, deckId: $('#tDeck').value || null }, 'Publicado')) viewTeam(view, id); };
    $$('[data-delpost]', view).forEach((b) => b.onclick = async () => { if (await act('DELETE', `/api/teams/${id}/posts/${b.dataset.delpost}`, null, 'Mensaje borrado')) viewTeam(view, id); });
    $$('[data-role]', view).forEach((s) => s.onchange = async () => { if (s.value === 'lider' && !confirm('¿Pasar el liderazgo? Pasarás a ser oficial.')) { viewTeam(view, id); return; } if (await act('PATCH', `/api/teams/${id}/members/${s.dataset.role}`, { role: s.value }, 'Rango actualizado')) viewTeam(view, id); });
    $$('[data-kick]', view).forEach((b) => b.onclick = async () => { if (!confirm('¿Expulsar a este miembro?')) return; if (await act('DELETE', `/api/teams/${id}/members/${b.dataset.kick}`, null, 'Miembro expulsado')) viewTeam(view, id); });
    $$('[data-esdm]', view).forEach((el) => { const pid = el.dataset.esdm; if (!pid) return; Promise.all([esdGet(`/players/${pid}/stats`), esdGet(`/players/${pid}/rank`).catch(() => null)]).then(([st2, rk]) => { const s = (st2.seasons || [])[0]; const tier = esdTier(rk && rk.tier); const box = $('.m-esd', el); if (box) box.innerHTML = `${tier ? A.rankMedal(tier, { done: true, cls: 'sm' }) : ''}<a href="#/partidas/${pid}">${s ? `${s.current_elo} ELO · ${s.wins}-${s.losses}-${s.draws}` : 'Sin partidas esta temporada'}</a>`; }).catch(() => { const box = $('.m-esd', el); if (box) box.textContent = 'EloShowdown no disponible'; }); });
    if ($('#tEdit', view)) $('#tEdit', view).onsubmit = async (e) => { e.preventDefault(); if (await act('PATCH', `/api/teams/${id}`, { name: $('#eName').value, description: $('#eDesc').value, champ: $('#eChamp').value, color: $('#eColor').value }, 'Equipo actualizado')) viewTeam(view, id); };
    if ($('#tCopyCode', view)) $('#tCopyCode', view).onclick = () => navigator.clipboard?.writeText(t.code).then(() => toast('Código copiado'));
    if ($('#tNewCode', view)) $('#tNewCode', view).onclick = async () => { if (await act('POST', `/api/teams/${id}/code`, null, 'Nuevo código generado: el anterior deja de funcionar')) viewTeam(view, id); };
    if ($('#tLeave', view)) $('#tLeave', view).onclick = async () => { if (!confirm('¿Abandonar el equipo?')) return; if (await act('POST', `/api/teams/${id}/leave`, null, 'Has salido del equipo')) { ui.team = null; location.hash = '#/equipos'; } };
    if ($('#tDelete', view)) $('#tDelete', view).onclick = async () => { if (!confirm('¿Disolver el equipo para todos? No se puede deshacer.')) return; if (await act('DELETE', `/api/teams/${id}`, null, 'Equipo disuelto')) { ui.team = null; location.hash = '#/equipos'; } };
  }

  // ================= Eventos y torneos =================
  // Eventos creados por la comunidad (no oficiales). Los oficiales están en el localizador de Riftbound.
  const OFFICIAL_EVENTS = 'https://playriftbound.com/es-es/events/';
  const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const STATUS_ES = { inscripcion: 'Inscripción abierta', en_curso: 'En curso', finalizado: 'Finalizado' };
  const fmtDate = (iso) => new Date(iso).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const dateBlock = (iso) => { const d = new Date(iso); return `<div class="cal"><span class="cal-m">${MONTHS[d.getMonth()]}</span><b>${d.getDate()}</b><span class="cal-h">${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</span></div>`; };
  function icsFor(ev) {
    const d = new Date(ev.date); const e = new Date(d.getTime() + 4 * 3600e3);
    const f = (x) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const t = (s) => String(s || '').replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Runario//Eventos//ES', 'BEGIN:VEVENT', `UID:${ev.id}@runario`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(d)}`, `DTEND:${f(e)}`,
      `SUMMARY:${t(ev.name)}`, `LOCATION:${t([ev.venue, ev.city].filter(Boolean).join(', '))}`, `DESCRIPTION:${t(`${ev.format} · ${ev.kind === 'torneo' ? 'Torneo' : 'Quedada'} (no oficial)\n${ev.description || ''}`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  }
  function eventCard(ev) {
    return `<a class="ev-card ${ev.you.going ? 'going' : ''}" href="#/eventos/${ev.id}">${dateBlock(ev.date)}
      <div class="ev-info"><div class="row" style="gap:6px"><span class="chip">${ev.kind === 'torneo' ? 'Torneo' : 'Quedada'}</span><span class="chip">${esc(ev.format)}</span>${ev.visibility === 'equipo' ? '<span class="chip">Equipo</span>' : ''}${ev.status !== 'inscripcion' ? `<span class="chip warn">${STATUS_ES[ev.status]}</span>` : ''}</div>
        <h3>${esc(ev.name)}</h3><span class="ev-where">${esc([ev.venue, ev.city].filter(Boolean).join(' · ') || 'Lugar por confirmar')}</span>
        <span class="small muted">${ev.players}/${ev.maxPlayers} inscritos · ${ev.interested} interesados${ev.owner ? ` · organiza ${esc(ev.owner.displayName)}` : ''}</span></div>
      <div class="ev-flags">${ev.you.owner ? '<span class="stamp">Organizas</span>' : ev.you.going ? '<span class="stamp ok">Vas</span>' : ev.you.interested ? '<span class="stamp">Te interesa</span>' : ''}</div></a>`;
  }
  function viewEvents(view, r) {
    if (r.parts[1] === 'nuevo') return viewEventNew(view);
    if (r.parts[1]) return viewEvent(view, r.parts[1]);
    ui.evScope = ui.evScope || 'upcoming';
    view.innerHTML = `<div class="page">
      <div class="pagehead"><div><div class="eyebrow">Fuera de casa</div><h1>Eventos</h1><p>Torneos y quedadas que monta la gente. Apúntate, guárdalos para pensártelo o organiza el tuyo: Runario empareja las rondas y lleva la clasificación.</p></div><span class="spacer"></span>
        <a class="btn" href="${OFFICIAL_EVENTS}" target="_blank" rel="noopener">Eventos oficiales ↗</a>${S.user ? `<a class="btn gold" href="#/eventos/nuevo">${gl('add')} Crear evento</a>` : ''}</div>
      <div class="seg" style="margin-bottom:22px">${[['upcoming', 'Próximos'], ['mine', 'Mis eventos'], ['past', 'Pasados']].map(([k, l]) => `<button type="button" data-evs="${k}" aria-pressed="${ui.evScope === k}">${l}</button>`).join('')}</div>
      <div class="ev-list" id="evList"><div class="empty">${emoteImg(randEmote(), 'empty-emote')}Cargando eventos…</div></div>
      <p class="tiny faint" style="margin-top:20px">Los eventos de Runario no son oficiales. Para torneos oficiales (Nexus Nights, Pre-Rift, Regionales) usa el <a href="${OFFICIAL_EVENTS}" target="_blank" rel="noopener">localizador de Riftbound</a>.</p></div>`;
    $$('[data-evs]', view).forEach((b) => b.onclick = () => { ui.evScope = b.dataset.evs; render(); });
    api('GET', `/api/events?scope=${ui.evScope}`).then((res) => {
      const el = $('#evList'); if (!el) return;
      if (!res.ok) { el.innerHTML = `<div class="empty">${emoteImg(randEmote(), 'empty-emote')}No se pudieron cargar los eventos${S.server ? '' : ' (el servidor no está activo)'}.</div>`; return; }
      el.innerHTML = res.data.length ? res.data.map(eventCard).join('') : `<div class="empty">${emoteImg(randEmote(), 'empty-emote')}<p>${ui.evScope === 'mine' ? 'No te has apuntado a nada todavía.' : ui.evScope === 'past' ? 'Aún no hay eventos pasados.' : 'No hay eventos próximos.'}</p>${S.user ? '<a class="btn gold" href="#/eventos/nuevo" style="margin-top:10px">Organiza el primero</a>' : '<a class="btn" href="#/entrar" style="margin-top:10px">Entra para crear eventos</a>'}</div>`;
    }).catch(() => { const el = $('#evList'); if (el) el.innerHTML = '<div class="empty">Sin conexión con el servidor.</div>'; });
  }
  async function viewEventNew(view) {
    if (!S.user) { location.hash = '#/entrar'; return; }
    const teams = await api('GET', '/api/teams').then((r) => (r.ok ? r.data : [])).catch(() => []);
    const d = new Date(Date.now() + 7 * 864e5); d.setHours(17, 0, 0, 0);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    view.innerHTML = `<div class="page"><div class="pagehead"><div><div class="eyebrow">Organiza</div><h1>Nuevo evento</h1><p>Un torneo con rondas suizas o una quedada para echar unas partidas y cambiar cartas.</p></div></div>
      <form class="panel ev-form" id="evForm">
        <div class="seg"><button type="button" data-kind="torneo" aria-pressed="true">Torneo</button><button type="button" data-kind="quedada" aria-pressed="false">Quedada</button></div>
        <label class="field"><span>Nombre</span><input type="text" id="fName" maxlength="80" required placeholder="Torneo de los sábados"></label>
        <div class="row" style="gap:16px;align-items:flex-end"><label class="field" style="flex:1;min-width:200px"><span>Fecha y hora</span><input type="datetime-local" id="fDate" value="${local}" required></label>
          <label class="field" style="flex:1;min-width:160px"><span>Formato</span><select id="fFormat">${['Construido', 'Sellado', 'Multijugador', 'Casual', 'Otro'].map((f) => `<option>${f}</option>`).join('')}</select></label>
          <label class="field" style="width:140px"><span>Plazas</span><input type="number" id="fMax" min="2" max="256" value="16"></label></div>
        <div class="row" style="gap:16px"><label class="field" style="flex:1;min-width:200px"><span>Lugar o tienda</span><input type="text" id="fVenue" maxlength="80" placeholder="Nombre de la tienda"></label>
          <label class="field" style="flex:1;min-width:160px"><span>Ciudad</span><input type="text" id="fCity" maxlength="60"></label>
          <label class="field" style="width:180px"><span>Inscripción</span><input type="text" id="fFee" maxlength="40" placeholder="Gratis / 5 €"></label></div>
        <label class="field"><span>Descripción</span><textarea id="fDesc" rows="5" maxlength="2000" placeholder="Premios, número de rondas, normas de la casa…"></textarea></label>
        <div class="row" style="gap:16px"><label class="field" style="min-width:220px"><span>Quién lo ve</span><select id="fVis"><option value="publico">Toda la comunidad</option>${teams.map((t) => `<option value="team:${t.id}">Solo el equipo [${esc(t.tag)}] ${esc(t.name)}</option>`).join('')}</select></label>
          <label class="row" style="margin-top:22px"><input type="checkbox" id="fJoin" checked> Apuntarme como jugador</label></div>
        <div class="row"><span class="spacer"></span><a class="btn ghost" href="#/eventos">Cancelar</a><button class="btn gold">${gl('add', 'sm')} Publicar evento</button></div></form></div>`;
    let kind = 'torneo';
    $$('[data-kind]', view).forEach((b) => b.onclick = () => { kind = b.dataset.kind; $$('[data-kind]', view).forEach((x) => x.setAttribute('aria-pressed', x === b)); });
    $('#evForm', view).onsubmit = async (e) => {
      e.preventDefault();
      const vis = $('#fVis').value;
      const res = await api('POST', '/api/events', { kind, name: $('#fName').value, date: new Date($('#fDate').value).toISOString(), format: $('#fFormat').value, maxPlayers: $('#fMax').value, venue: $('#fVenue').value, city: $('#fCity').value, fee: $('#fFee').value, description: $('#fDesc').value,
        visibility: vis.startsWith('team:') ? 'equipo' : 'publico', teamId: vis.startsWith('team:') ? vis.slice(5) : null, join: $('#fJoin').checked });
      if (res.ok) { toast('Evento publicado', { emote: randEmote() }); location.hash = `#/eventos/${res.data.id}`; } else toast(res.data.error || 'No se pudo crear.');
    };
  }
  async function viewEvent(view, id) {
    const res = await api('GET', `/api/events/${id}`).catch(() => ({ ok: false, data: {} }));
    if (!res.ok) { view.innerHTML = `<div class="page"><div class="empty">${emoteImg(randEmote(), 'empty-emote')}<h2>${esc(res.data.error || 'Evento no disponible')}</h2><a href="#/eventos">Volver</a></div></div>`; return; }
    const ev = res.data; const own = ev.you.owner;
    const name = (pid) => (ev.playerList.find((p) => p.id === pid) || {}).name || '—';
    const myPid = S.user ? (ev.playerList.find((p) => p.uid === S.user.id) || {}).id : null;
    ui.evTab = ui.evTab && (ui.evTab !== 'rondas' || ev.roundList.length) ? ui.evTab : (ev.roundList.length ? 'rondas' : 'info');
    const lastRound = ev.roundList[ev.roundList.length - 1];
    const roundDone = lastRound && lastRound.pairings.every((m) => m.result !== null);
    const suggested = Math.max(1, Math.ceil(Math.log2(Math.max(2, ev.players))));
    let body = '';
    if (ui.evTab === 'info') body = `<div class="pf-grid"><div class="panel">${ev.description ? para(ev.description) : '<p class="muted">Sin descripción.</p>'}
        <dl class="facts" style="margin-top:14px"><dt>Cuándo</dt><dd>${esc(fmtDate(ev.date))}</dd><dt>Dónde</dt><dd>${esc([ev.venue, ev.city].filter(Boolean).join(', ') || 'Por confirmar')}</dd><dt>Formato</dt><dd>${esc(ev.format)} · ${ev.kind === 'torneo' ? 'torneo (rondas suizas)' : 'quedada'}</dd><dt>Inscripción</dt><dd>${esc(ev.fee || '—')}</dd><dt>Organiza</dt><dd>${esc(ev.owner ? ev.owner.displayName : '—')}</dd></dl></div>
      <div class="panel"><h3>Jugadores (${ev.players}/${ev.maxPlayers})</h3><ol class="ev-players">${ev.playerList.map((p) => `<li class="${p.dropped ? 'dropped' : ''}"><span>${esc(p.name)}</span>${p.guest ? '<span class="chip">Sin cuenta</span>' : ''}${p.dropped ? '<span class="chip warn">Retirado</span>' : ''}${own ? `<button class="btn sm ghost" data-drop="${p.id}">${p.dropped ? 'Reincorporar' : ev.roundList.length ? 'Retirar' : 'Quitar'}</button>` : ''}</li>`).join('') || '<li class="muted">Nadie todavía.</li>'}</ol>
        ${own && ev.status === 'inscripcion' ? '<form class="row" id="addP" style="margin-top:12px"><input type="text" id="addPN" maxlength="40" placeholder="Añadir jugador sin cuenta" style="flex:1"><button class="btn sm">Añadir</button></form>' : ''}</div></div>`;
    if (ui.evTab === 'rondas') body = `${ev.roundList.slice().reverse().map((r) => `<div class="panel round"><div class="row"><h3>Ronda ${r.n}</h3><span class="spacer"></span><span class="small muted">${r.pairings.filter((m) => m.result !== null).length}/${r.pairings.length} resultados</span></div>
        <div class="pairings">${r.pairings.map((m) => { const canEdit = (own || (myPid && [m.a, m.b].includes(myPid))) && m.b && (r.n === ev.roundList.length || own) && ev.status !== 'finalizado';
          return `<div class="pairing ${m.result ? 'has' : ''}"><span class="tbl">Mesa ${m.table}</span><span class="pl ${m.result === 'a' ? 'win' : ''}">${esc(name(m.a))}</span><span class="vs">${m.b ? 'vs' : ''}</span><span class="pl ${m.result === 'b' ? 'win' : ''}">${m.b ? esc(name(m.b)) : '<i>Descanso (gana)</i>'}</span>
          ${m.b ? (canEdit ? `<select data-res="${r.n}:${m.table}"><option value="">Resultado…</option><option value="a" ${m.result === 'a' ? 'selected' : ''}>Gana ${esc(name(m.a))}</option><option value="b" ${m.result === 'b' ? 'selected' : ''}>Gana ${esc(name(m.b))}</option><option value="draw" ${m.result === 'draw' ? 'selected' : ''}>Empate</option></select>` : `<span class="res">${m.result === 'draw' ? 'Empate' : m.result ? 'Terminada' : 'En juego'}</span>`) : ''}</div>`; }).join('')}</div></div>`).join('') || '<div class="empty">Aún no ha empezado.</div>'}`;
    if (ui.evTab === 'clasificacion') body = `<div class="panel"><h3>Clasificación del evento</h3><p class="small muted">3 puntos por victoria y 1 por empate; desempate por porcentaje de victorias de los rivales. Es la clasificación de este evento no oficial, no un ranking de jugadores.</p>
        <table class="simple" style="margin-top:12px"><tr><th>#</th><th>Jugador</th><th>Puntos</th><th>V-D-E</th><th>% rivales</th></tr>${ev.standings.map((s, i) => `<tr class="${s.dropped ? 'faint' : ''}"><td class="n">${i + 1}</td><td>${esc(s.name)}${s.dropped ? ' <span class="chip warn">Retirado</span>' : ''}</td><td class="n">${s.pts}</td><td class="n">${s.w}-${s.l}-${s.d}</td><td class="n">${s.omw.toFixed(1)}</td></tr>`).join('')}</table></div>`;
    view.innerHTML = `<div class="page">
      <section class="ev-hero">${dateBlock(ev.date)}<div style="flex:1;min-width:260px"><div class="row" style="gap:6px"><span class="chip">${ev.kind === 'torneo' ? 'Torneo' : 'Quedada'}</span><span class="chip">${esc(ev.format)}</span><span class="chip ${ev.status === 'inscripcion' ? 'ok' : 'warn'}">${STATUS_ES[ev.status]}</span><span class="chip">No oficial</span></div>
        <h1>${esc(ev.name)}</h1><p class="ev-where">${esc(fmtDate(ev.date))} · ${esc([ev.venue, ev.city].filter(Boolean).join(', ') || 'lugar por confirmar')}</p></div>
        <div class="ev-actions">${S.user ? (ev.you.going ? `<button class="btn" id="evLeave">Ya no voy</button>` : ev.status === 'inscripcion' ? `<button class="btn gold" id="evJoin">${gl('check', 'sm')} Me apunto</button>` : '') : '<a class="btn gold" href="#/entrar">Entra para apuntarte</a>'}
          ${S.user && !ev.you.going ? `<button class="btn" id="evInt" aria-pressed="${ev.you.interested}">${gl('wish', 'sm')} ${ev.you.interested ? 'Te interesa' : 'Me interesa'}</button>` : ''}
          <button class="btn" id="evIcs">Añadir a mi calendario</button></div></section>
      ${own ? `<div class="panel org"><h3>Organización</h3><div class="row">
          ${ev.kind === 'torneo' && ev.status !== 'finalizado' ? `<button class="btn gold" id="evRound" ${lastRound && !roundDone ? 'disabled title="Faltan resultados"' : ''}>${ev.roundList.length ? `Emparejar ronda ${ev.roundList.length + 1}` : 'Cerrar inscripción y empezar'}</button><span class="small muted">Rondas sugeridas para ${ev.players} jugadores: ${suggested}</span>` : ''}
          <span class="spacer"></span><button class="btn" id="evFinish">${ev.status === 'finalizado' ? 'Reabrir' : 'Finalizar evento'}</button><button class="btn danger" id="evDel">Eliminar</button></div></div>` : ''}
      <div class="tabs" role="tablist" style="margin:18px 0">${[['info', 'Información'], ...(ev.kind === 'torneo' ? [['rondas', `Rondas (${ev.roundList.length})`], ['clasificacion', 'Clasificación']] : [])].map(([k, l]) => `<button type="button" role="tab" data-evt="${k}" aria-selected="${ui.evTab === k}">${l}</button>`).join('')}</div>
      ${body}</div>`;
    const act = async (method, path, b, msg) => { const r2 = await api(method, path, b); if (r2.ok) { if (msg) toast(msg); viewEvent(view, id); return true; } toast(r2.data.error || 'No se pudo completar.'); return false; };
    $$('[data-evt]', view).forEach((b) => b.onclick = () => { ui.evTab = b.dataset.evt; viewEvent(view, id); });
    if ($('#evJoin', view)) $('#evJoin', view).onclick = () => act('POST', `/api/events/${id}/join`, null, '¡Apuntado!');
    if ($('#evLeave', view)) $('#evLeave', view).onclick = () => act('POST', `/api/events/${id}/leave`, null, 'Te has borrado del evento');
    if ($('#evInt', view)) $('#evInt', view).onclick = () => act('POST', `/api/events/${id}/interest`, null);
    $('#evIcs', view).onclick = () => download(`${ev.name.replace(/[^\wáéíóúñ ]+/gi, '').trim() || 'evento'}.ics`, icsFor(ev), 'text/calendar;charset=utf-8');
    if ($('#evRound', view)) $('#evRound', view).onclick = () => { ui.evTab = 'rondas'; act('POST', `/api/events/${id}/rounds`, null, 'Ronda emparejada'); };
    if ($('#evFinish', view)) $('#evFinish', view).onclick = () => act('POST', `/api/events/${id}/finish`, null, ev.status === 'finalizado' ? 'Evento reabierto' : 'Evento finalizado');
    if ($('#evDel', view)) $('#evDel', view).onclick = async () => { if (!confirm('¿Eliminar el evento para todos?')) return; const r2 = await api('DELETE', `/api/events/${id}`); if (r2.ok) { toast('Evento eliminado'); location.hash = '#/eventos'; } };
    if ($('#addP', view)) $('#addP', view).onsubmit = (e) => { e.preventDefault(); act('POST', `/api/events/${id}/players`, { name: $('#addPN').value }, 'Jugador añadido'); };
    $$('[data-drop]', view).forEach((b) => b.onclick = () => act('POST', `/api/events/${id}/drop`, { playerId: b.dataset.drop }));
    $$('[data-res]', view).forEach((s) => s.onchange = () => { const [round, table] = s.dataset.res.split(':'); act('POST', `/api/events/${id}/result`, { round, table, result: s.value }, 'Resultado guardado'); });
  }

  // ---------- Planes, validación y más ----------
  function viewPlans(view) {
    const li = (g, t) => `<li>${gl(g)}<span>${t}</span></li>`;
    view.innerHTML = `<div class="page"><div class="pagehead"><div><div class="eyebrow">Gratis mientras sea prototipo</div><h1>Planes</h1></div></div>
      <div class="plans">
        <div class="panel plan current"><span class="chip gold">Tu plan · implementado</span><h2>Archivo</h2><div class="price">Gratis</div><ul>${li('ledger', 'Inventario completo con lotes, idioma, acabado y ubicación')}${li('library', 'Álbumes con huecos exactos y encuadernación')}${li('missing', 'Progreso y faltantes')}${li('showcase', 'Vitrina de medallas')}${li('export', 'Exportación e importación CSV')}${li('share', 'Cuenta personal y vitrina pública')}</ul></div>
        <div class="panel plan"><span class="chip future">Futuro · sin cobro activo</span><h2>Archivo Plus</h2><div class="price">Por definir</div><ul>${li('workshop', 'Encuadernaciones y páginas avanzadas')}${li('hourglass', 'Historial de cambios y evolución')}${li('sync', 'Atajos de productividad y registro masivo')}</ul><button class="btn" disabled>Próximamente</button></div>
        <div class="panel plan"><span class="chip future">Futuro</span><h2>Tiendas</h2><div class="price">Por definir</div><ul>${li('share', 'Vitrina pública con código QR')}${li('pack', 'Reservas de cartas por clientes')}${li('profile', 'Cuentas de empleados y permisos')}</ul><button class="btn" disabled>Próximamente</button></div></div>
      <div class="notice info" style="margin-bottom:30px">Runario usa recursos de Riot Games bajo su política para proyectos de fans, que exige que el proyecto sea gratuito. Activar Plus o Tiendas con cobro requeriría una licencia de Riot.</div>
      <div class="section-title"><h2>Páginas editoriales</h2><span class="small muted">La publicidad solo aparecería aquí, siempre identificada.</span></div>
      <div class="features"><article class="panel"><span class="chip">Editorial · ejemplo</span><h3 style="margin-top:10px">Cómo organizar una colección base por páginas</h3><p class="small muted" style="margin-top:8px">Las páginas de 9 huecos reflejan los álbumes físicos más comunes; las de 12 aprovechan pantallas grandes. Cambiar la distribución nunca altera tus cartas.</p></article>
        <div class="adslot"><b>Publicidad</b>Espacio reservado e identificado · desactivado en el prototipo</div></div></div>`;
  }
  function viewValidation(view) {
    const results = window.RBSelfTest.runSelfTests(CAT, C);
    const passed = results.filter((r) => r.pass).length;
    view.innerHTML = `<div class="page"><div class="pagehead"><div><div class="eyebrow">Sin trampa ni cartón</div><h1>Validación</h1><p class="muted">Estas comprobaciones se ejecutan ahora mismo sobre el catálogo que tienes cargado.</p></div><span class="spacer"></span><span class="chip ${passed === results.length ? 'ok' : 'bad'}">${passed}/${results.length} superadas</span></div>
      <div class="vlist" style="margin-bottom:34px">${results.map((r) => `<div class="vitem ${r.pass ? 'pass' : 'fail'}"><span class="ic">${r.pass ? '✓' : '✗'}</span><div><b>${esc(r.name)}</b><div class="small muted">${esc(r.detail)}</div></div></div>`).join('')}</div>
      <div class="section-title"><h2>Procedencia del catálogo</h2><span class="small muted">${esc(CAT.meta.source)} · ${esc(CAT.meta.sourceUrl)} · descargado ${esc(CAT.meta.fetchedAt)}</span></div>
      <div class="tablewrap" style="margin-bottom:30px"><table class="simple"><tr><th>Checklist</th><th>Colección</th><th>Objetivo</th><th>Huecos</th><th>Estado</th><th>Fuente</th></tr>
        ${CAT.checklists.map((c) => `<tr><td class="tiny">${esc(c.id)}</td><td>${esc(COL(c.set).name)}</td><td>${esc(c.label)}</td><td class="n">${c.entries.length}</td><td>${statusChip(c.status, c.pending)}</td><td class="small muted">${esc(c.source || c.reason || '')}</td></tr>`).join('')}</table></div>
      <div class="notice info" style="margin-bottom:30px"><div>${esc(CAT.meta.languageNote)} ${esc(CAT.meta.diptychNote)} Foil: la fuente no publica acabados por carta, así que ese objetivo queda provisional.</div></div>
      <div class="section-title"><h2>Estado de funciones</h2></div>
      <div class="features"><div class="panel"><span class="chip ok">Implementado</span><ul>
        <li>Cuentas personales (servidor Node, contraseñas con scrypt, sesión por cookie) y modo invitado con traspaso a cuenta</li>
        <li>Vitrina pública opcional por enlace, sin notas, ubicaciones ni productos</li>
        <li>Estantería 3D, apertura del álbum y paso de página con curvatura, arrastrable con ratón o dedo</li>
        <li>Visor 3D de cartas: giro libre, reverso, brillo foil, zoom; dípticos juntos; tokens de doble cara</li>
        <li>Taller de encuadernación: material, color, estampado foil, emblema, composición, cinta, papel y fundas</li>
        <li>Huecos exactos desde checklist versionada; páginas de 4, 9 o 12; última página sin huecos ficticios</li>
        <li>Inventario por lotes, deseos, intercambio separado, edición por lotes, CSV validado, deshacer</li>
        <li>Productos sellados con apertura confirmada; vitrina de medallas oficial y personal</li>
        <li>Recursos oficiales de Riot: arte de cada colección, logotipo de Riftbound, iconos de dominio, rareza y tipo, reverso con el logotipo de League of Legends, emblemas de clasificatoria como medallas, iconos e ilustraciones de campeones y emotes como pegatinas</li><li>Radiance (cartas reveladas, en avance), T1 y Secret Garden desde TCGplayer; 75 productos sellados reales con foto</li></ul></div>
        <div class="panel"><span class="chip future">Futuro</span><ul>
        <li>Checklists de Radiance, Arcane, Secret Garden y T1, foil por carta e idiomas distintos del inglés</li>
        <li>Pares oficiales de dípticos de Vendetta y segunda cara de tokens</li>
        <li>Recuperación de contraseña por correo y despliegue en un servidor público</li>
        <li>Plan Plus y plan Tiendas; publicidad identificada en páginas editoriales</li></ul></div></div></div>`;
  }
  function viewMore(view) {
    view.innerHTML = `<div class="page"><div class="pagehead"><h1>Más</h1></div><div class="panel actions">
      <a href="#/eventos">${rbIcon('battlefield')}<span>Eventos<small>Torneos y quedadas de la comunidad</small></span></a>
      <a href="#/partidas">${rbIcon('battlefield')}<span>Partidas<small>Tus estadísticas de torneo (EloShowdown)</small></span></a>
      <a href="#/gestionar">${rbIcon('gear')}<span>Gestionar<small>Registro rápido e importación CSV</small></span></a>
      <a href="#/vitrina">${rbIcon('showcase')}<span>Vitrina<small>Medallas de coleccionista</small></span></a>
      <a href="#/productos">${gl('pack')}<span>Productos<small>Producto sellado y aperturas</small></span></a>
      <a href="#/planes">${gl('crown')}<span>Planes<small>Archivo, Plus y Tiendas</small></span></a>
      <a href="#/validacion">${gl('seal')}<span>Validación<small>Comprobaciones y procedencia</small></span></a>
      <button type="button" id="moreSettings">${gl('astrolabe')}<span>Ajustes<small>Animación, apariencia y copias</small></span></button></div></div>`;
    $('#moreSettings', view).onclick = openSettings;
  }

  // ---------- Ajustes ----------
  function openSettings() {
    const s = state.settings;
    const m = modal(`<form method="dialog"><div class="modal-head">${gl('astrolabe', 'lg')}<h2 id="modalTitle">Ajustes</h2><button class="iconbtn" value="cancel" aria-label="Cerrar">${gl('close')}</button></div>
      <div class="modal-body">
        <div class="field"><span>Animaciones (apertura, paso de página, 3D)</span><div class="seg">${[['auto', 'Según el sistema'], ['on', 'Activadas'], ['off', 'Desactivadas']].map(([k, v]) => `<button type="button" data-anim="${k}" aria-pressed="${s.animate === k}">${v}</button>`).join('')}</div></div>
        <div class="field"><span>Apariencia</span><div class="seg">${[['system', 'Sistema'], ['dark', 'Noche'], ['light', 'Pergamino']].map(([k, v]) => `<button type="button" data-mode="${k}" aria-pressed="${(s.mode || 'system') === k}">${v}</button>`).join('')}</div></div>
        <div class="field"><span>Precios</span><div class="seg">${[['EUR', 'Euros'], ['USD', 'Dólares']].map(([k, v]) => `<button type="button" data-cur="${k}" aria-pressed="${currency() === k}">${v}</button>`).join('')}</div></div>
        <label class="row"><input type="checkbox" id="showPrices" ${s.prices !== false ? 'checked' : ''}> Mostrar el precio en los huecos del álbum</label>
        <label class="row"><input type="checkbox" id="ghost" ${s.ghostArt !== false ? 'checked' : ''}> Mostrar el arte atenuado en los huecos vacíos</label>
        <label class="row"><input type="checkbox" id="spread" ${s.spread !== false ? 'checked' : ''}> Doble página en pantallas anchas</label>
        ${RO() ? '' : `<div class="row"><button type="button" class="btn" id="backup">${gl('export')} Copia de seguridad (JSON)</button><label class="btn" for="restore">${gl('import')} Restaurar copia</label><input type="file" id="restore" accept=".json,application/json" class="sr">
          <button type="button" class="btn danger" id="reset">${gl('urn', 'sm')} Vaciar colección</button></div>`}
        <p class="small muted">${S.mode === 'user' ? `Tu colección se guarda en tu cuenta (@${esc(S.user.username)}).` : 'Modo invitado: la colección vive solo en este navegador.'}</p></div></form>`, 'narrow');
    const set = (fn) => { fn(state.settings); save(); render(); openSettings(); };
    $$('[data-anim]', m).forEach((b) => b.onclick = () => set((x) => { x.animate = b.dataset.anim; }));
    $$('[data-mode]', m).forEach((b) => b.onclick = () => set((x) => { x.mode = b.dataset.mode; }));
    $('#ghost', m).onchange = (e) => set((x) => { x.ghostArt = e.target.checked; });
    $('#showPrices', m).onchange = (e) => set((x) => { x.prices = e.target.checked; });
    $$('[data-cur]', m).forEach((b) => b.onclick = () => set((x) => { x.currency = b.dataset.cur; }));
    $('#spread', m).onchange = (e) => set((x) => { x.spread = e.target.checked; });
    if (RO()) return;
    $('#backup', m).onclick = () => download(`runario-copia-${today()}.json`, JSON.stringify(state, null, 1), 'application/json');
    $('#restore', m).onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      file.text().then((t) => { try { const s2 = JSON.parse(t); if (!Array.isArray(s2.lots) || !Array.isArray(s2.albums)) throw new Error(); m.close(); commit('Copia restaurada', (s) => Object.assign(s, normalize(s2))); } catch { toast('El archivo no es una copia válida'); } });
    };
    $('#reset', m).onclick = () => {
      if (!confirm('¿Vaciar inventario, álbumes y productos? Podrás deshacerlo mientras no recargues la página.')) return;
      m.close(); commit('Colección vaciada', (s) => { const settings = s.settings; Object.assign(s, C.emptyState(), { settings }); });
    };
  }

  // ---------- Eventos globales ----------
  $('#scrim').onclick = closeCard;
  $('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) $('#modal').close(); });
  addEventListener('hashchange', () => {
    closeCard(); if ($('#modal').open) $('#modal').close();
    ui.showMissing = false;
    const r = route();
    if (!location.hash.includes('gestionar')) ui.manage.album = '';
    if (r.name !== 'album' && !(r.name === 'u' && r.parts[2] === 'album')) { document.body.classList.remove('fs-album'); ui.stickers = false; }
    if (r.name === 'album' && !r.parts[2]) ui.openAnim = r.parts[1];
    if (r.name === 'u' && r.parts[2] === 'album') ui.openAnim = r.parts[3];
    if (r.name !== 'u') viewing = null;
    if (!S.mode && r.name !== 'u' && r.name !== 'entrar') { location.hash = '#/entrar'; return; }
    render(); scrollTo(0, 0); $('#view').focus({ preventScroll: true });
  });
  let lastSpread = isSpread();
  addEventListener('resize', () => { if (isSpread() !== lastSpread) { lastSpread = isSpread(); if (['album', 'u'].includes(route().name)) render(); } });
  addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); undo(); return; }
    if (e.key === 'Escape' && ui.drawer && !$('#modal').open && !$('.v3d')) { closeCard(); return; }
    if (typing || ui.drawer || $('#modal').open || $('.v3d')) return;
    const go = $('#view')._albumGo;
    if (go && (route().name === 'album' || (route().name === 'u' && route().parts[2] === 'album'))) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    }
  });

  async function boot() {
    if (!ls.get(GUEST_KEY) && ls.get('relicario.v1')) ls.set(GUEST_KEY, ls.get('relicario.v1'));
    try {
      const r = await api('GET', '/api/me');
      if (r.ok) { S.user = r.data.user; await loadRemote(); }
      else if (r.status !== 401) S.server = false;
    } catch { S.server = false; }
    if (!S.user && ls.get(MODE_KEY) === 'guest') startGuest();
    const r = route();
    if (r.name === 'album' && !r.parts[2]) ui.openAnim = r.parts[1];
    if (!S.mode && r.name !== 'u') { if (r.name !== 'entrar') { history.replaceState(null, '', '#/entrar'); } }
    if (S.mode) checkBadges();
    render();
  }
  boot();
})();
