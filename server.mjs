// Runario — servidor: archivos estáticos + cuentas de coleccionista + colección por usuario.
// Uso: node server.mjs [puerto]. Los datos se guardan en ./storage (excluido del servidor estático).
import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const root = dirname(fileURLToPath(import.meta.url));
const STORE = join(root, 'storage');
const port = Number(process.argv[2]) || Number(process.env.PORT) || 5180;
const MAX_BODY = 4 * 1024 * 1024;
const SESSION_DAYS = 30;
// En un alojamiento con HTTPS (Render o SECURE_COOKIE=1) la cookie de sesión solo viaja cifrada.
const SECURE = process.env.RENDER || process.env.SECURE_COOKIE ? '; Secure' : '';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.csv': 'text/csv', '.md': 'text/plain; charset=utf-8' };
const PRIVATE = ['storage', 'tools', 'tests', 'server.mjs', '.claude'];

await mkdir(join(STORE, 'collections'), { recursive: true });
const readJSON = (f, def) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return def; } };
const users = readJSON(join(STORE, 'users.json'), { byName: {} });
const sessions = readJSON(join(STORE, 'sessions.json'), {});

async function atomicWrite(file, data) {
  const tmp = `${file}.${randomBytes(4).toString('hex')}.tmp`;
  await writeFile(tmp, JSON.stringify(data));
  await rename(tmp, file);
}
let saveQ = Promise.resolve();
const persist = () => (saveQ = saveQ.then(() => Promise.all([atomicWrite(join(STORE, 'users.json'), users), atomicWrite(join(STORE, 'sessions.json'), sessions)])));

const sha = (s) => createHash('sha256').update(s).digest('hex');
async function hashPassword(pw, salt = randomBytes(16).toString('hex')) {
  const key = await scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return { salt, hash: key.toString('hex') };
}
async function checkPassword(pw, u) {
  const { hash } = await hashPassword(pw, u.salt);
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(u.hash, 'hex'));
}

// Límite simple de intentos de acceso por IP.
const attempts = new Map();
function limited(ip) {
  const now = Date.now(); const a = attempts.get(ip) || { n: 0, t: now };
  if (now - a.t > 10 * 60 * 1000) { a.n = 0; a.t = now; }
  a.n++; attempts.set(ip, a);
  return a.n > 20;
}

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}
function currentUser(req) {
  const tok = cookies(req).rn_session; if (!tok) return null;
  const s = sessions[sha(tok)]; if (!s) return null;
  if (Date.now() - s.created > SESSION_DAYS * 864e5) { delete sessions[sha(tok)]; return null; }
  const u = Object.values(users.byName).find((x) => x.id === s.uid);
  return u || null;
}
function publicUser(u) {
  return { id: u.id, username: u.username, displayName: u.displayName, createdAt: u.createdAt, profile: u.profile };
}
function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}
async function body(req) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > MAX_BODY) throw Object.assign(new Error('Demasiado grande'), { code: 413 }); chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw Object.assign(new Error('JSON no válido'), { code: 400 }); }
}
function startSession(res, u) {
  const tok = randomBytes(32).toString('hex');
  sessions[sha(tok)] = { uid: u.id, created: Date.now() };
  persist();
  return { 'set-cookie': `rn_session=${tok}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${SECURE}` };
}
const collFile = (u) => join(STORE, 'collections', `${u.id}.json`);
async function loadColl(u) { try { return JSON.parse(await readFile(collFile(u), 'utf8')); } catch { return { rev: 0, updatedAt: null, state: null }; } }
function validState(s) {
  return s && typeof s === 'object' && Array.isArray(s.lots) && Array.isArray(s.albums) && Array.isArray(s.products || []) && typeof (s.wish || {}) === 'object';
}
// Lo que ve un visitante: sin notas privadas, ubicaciones ni productos.
function publicState(s) {
  if (!s) return { lots: [], wish: {}, albums: [], badges: {}, profile: {} };
  return { lots: s.lots.map((l) => ({ printId: l.printId, lang: l.lang, finish: l.finish, qty: l.qty, trade: l.trade || 0 })),
    wish: s.wish || {}, albums: s.albums, badges: s.badges || {}, profile: s.profile || {}, decks: (s.decks || []).filter((d) => d.visibility === 'publico') };
}
const USER_RE = /^[a-z0-9_]{3,20}$/;
const userById = (id) => Object.values(users.byName).find((x) => x.id === id);

// ---------- EloShowdown: proxy de solo lectura con caché (la API no admite CORS) ----------
// Datos comunitarios (no oficiales). Se consultan bajo demanda y no se guardan en disco.
const ESD = 'https://eloshowdown.com/api/v1';
const ESD_KEY = process.env.ESD_API_KEY || '';
const esdCache = new Map();
const esdHits = new Map();
const ESD_ALLOWED = [/^\/search$/, /^\/meta$/, /^\/seasons\/current$/, /^\/players\/\d{1,9}(\/(stats|rank|form|dna|elo-history|achievements|top-opponents))?$/, /^\/players\/\d{1,9}\/h2h\/\d{1,9}$/];
async function esd(sub, search, ip) {
  if (!ESD_ALLOWED.some((r) => r.test(sub))) return { status: 404, body: { error: 'Ruta no permitida' } };
  const qs = new URLSearchParams(search); const clean = new URLSearchParams();
  for (const k of ['q', 'season', 'limit']) if (qs.has(k)) clean.set(k, qs.get(k).slice(0, 60));
  const key = `${sub}${clean.toString() ? '?' + clean : ''}`;
  const ttl = sub === '/search' ? 3600e3 : 6 * 3600e3;
  const hit = esdCache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit;
  const h = esdHits.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - h.t > 3600e3) { h.n = 0; h.t = Date.now(); }
  if (++h.n > 300) return hit || { status: 429, body: { error: 'Demasiadas consultas a EloShowdown. Prueba más tarde.' } };
  esdHits.set(ip, h);
  try {
    const r = await fetch(ESD + key, { headers: { 'user-agent': 'Runario/1.0 (proyecto de fans local)', ...(ESD_KEY ? { authorization: `Bearer ${ESD_KEY}` } : {}) }, signal: AbortSignal.timeout(10000) });
    let b; try { b = JSON.parse(await r.text()); } catch { b = { error: 'Respuesta no válida' }; }
    const out = { t: Date.now(), status: r.status, body: b };
    if (r.ok) { esdCache.set(key, out); if (esdCache.size > 3000) esdCache.delete(esdCache.keys().next().value); }
    else if (hit) return hit;
    return out;
  } catch { return hit || { status: 502, body: { error: 'EloShowdown no responde ahora mismo.' } }; }
}

// ---------- Equipos ----------
const teamsDb = readJSON(join(STORE, 'teams.json'), { teams: {} });
const saveTeams = () => (saveQ = saveQ.then(() => atomicWrite(join(STORE, 'teams.json'), teamsDb)));
const code8 = () => Array.from(randomBytes(8), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
const memberOf = (t, uid) => t.members.find((x) => x.uid === uid);
const canManage = (t, uid) => ['lider', 'oficial'].includes((memberOf(t, uid) || {}).role);
const cleanText = (s, n) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
function teamSummary(t, uid) {
  return { id: t.id, name: t.name, tag: t.tag, description: t.description, champ: t.champ, color: t.color, createdAt: t.createdAt, members: t.members.length, role: (memberOf(t, uid) || {}).role || null };
}
// Mazos visibles para el equipo o públicos: viven en la colección de cada miembro.
const sharedDecks = (s, levels) => ((s && s.decks) || []).filter((d) => levels.includes(d.visibility));
async function teamDetail(t, uid) {
  const members = []; const trades = []; const wishes = []; const decks = []; const union = new Set();
  for (const mb of t.members) {
    const usr = userById(mb.uid); if (!usr) continue;
    const s = (await loadColl(usr)).state || { lots: [], wish: {} };
    const owned = new Set(s.lots.filter((l) => l.qty > 0).map((l) => l.printId));
    owned.forEach((id) => union.add(id));
    members.push({ uid: mb.uid, username: usr.username, displayName: usr.displayName, role: mb.role, joinedAt: mb.joinedAt,
      champ: (s.profile || {}).champ || 'Jinx', esdId: (s.profile || {}).esdId || null, distinct: owned.size, copies: s.lots.reduce((n, l) => n + l.qty, 0) });
    for (const l of s.lots) if (l.trade > 0) trades.push({ uid: mb.uid, printId: l.printId, qty: l.trade, lang: l.lang, finish: l.finish });
    for (const [id, v] of Object.entries(s.wish || {})) if (v) wishes.push({ uid: mb.uid, printId: id });
    for (const d of sharedDecks(s, ['equipo', 'publico'])) decks.push({ ...d, author: { uid: mb.uid, username: usr.username, displayName: usr.displayName } });
  }
  members.sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'));
  const me = memberOf(t, uid);
  return { ...teamSummary(t, uid), code: canManage(t, uid) ? t.code : null, members, trades, wishes, decks, unionDistinct: union.size, posts: t.posts.slice(-120), youAre: me ? me.role : null };
}
let guidesCache = { t: 0, list: [] };
async function publicGuides() {
  if (Date.now() - guidesCache.t < 60e3) return guidesCache.list;
  const list = [];
  for (const usr of Object.values(users.byName)) {
    const s = (await loadColl(usr)).state;
    for (const d of sharedDecks(s, ['publico'])) list.push({ ...d, author: { uid: usr.id, username: usr.username, displayName: usr.displayName } });
  }
  list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  guidesCache = { t: Date.now(), list };
  return list;
}

// ---------- Precios: se renuevan cada 24 h ejecutando tools/build-prices.mjs ----------
async function refreshPrices() {
  try {
    const { statSync } = await import('node:fs');
    const f = join(root, 'data', 'prices.js');
    if (existsSync(f) && Date.now() - statSync(f).mtimeMs < 23 * 3600e3) return;
    const { spawn } = await import('node:child_process');
    spawn(process.execPath, [join(root, 'tools', 'build-prices.mjs')], { cwd: root, stdio: 'ignore' }).on('exit', (c) => console.log(c === 0 ? 'Precios actualizados' : 'No se pudieron actualizar los precios'));
  } catch { /* sin conexión: se mantienen los anteriores */ }
}
refreshPrices(); setInterval(refreshPrices, 6 * 3600e3).unref();

// ---------- Eventos y torneos (no oficiales, creados por la comunidad) ----------
const eventsDb = readJSON(join(STORE, 'events.json'), { events: {} });
const saveEvents = () => (saveQ = saveQ.then(() => atomicWrite(join(STORE, 'events.json'), eventsDb)));
const FORMATS = ['Construido', 'Sellado', 'Multijugador', 'Casual', 'Otro'];
const isOwner = (ev, u) => u && ev.owner === u.id;
const canSeeEvent = (ev, u) => ev.visibility === 'publico' || isOwner(ev, u) || (u && ev.teamId && teamsDb.teams[ev.teamId] && memberOf(teamsDb.teams[ev.teamId], u.id));
// Clasificación suiza del evento: 3 puntos por victoria, 1 por empate; desempate por % de victorias de rivales (mínimo 33 %).
function standings(ev) {
  const rec = new Map(ev.players.map((p) => [p.id, { id: p.id, name: p.name, pts: 0, w: 0, l: 0, d: 0, opps: [], byes: 0, dropped: !!p.dropped }]));
  for (const r of ev.rounds) for (const m of r.pairings) {
    const A = rec.get(m.a); const B = m.b ? rec.get(m.b) : null;
    if (!A) continue;
    if (!B) { A.pts += 3; A.w++; A.byes++; continue; }
    A.opps.push(m.b); B.opps.push(m.a);
    if (m.result === 'a') { A.pts += 3; A.w++; B.l++; } else if (m.result === 'b') { B.pts += 3; B.w++; A.l++; } else if (m.result === 'draw') { A.pts++; B.pts++; A.d++; B.d++; }
  }
  const mwp = (x) => { const g = x.w + x.l + x.d - x.byes; return g > 0 ? Math.max(1 / 3, (x.pts - x.byes * 3) / (3 * g)) : 1 / 3; };
  const list = [...rec.values()].map((x) => ({ ...x, omw: x.opps.length ? x.opps.reduce((s, o) => s + mwp(rec.get(o)), 0) / x.opps.length : 0 }));
  list.sort((a, b) => b.pts - a.pts || b.omw - a.omw || a.name.localeCompare(b.name));
  return list.map(({ opps, ...x }) => ({ ...x, omw: Math.round(x.omw * 1000) / 10 }));
}
function pairNext(ev) {
  const table = standings(ev).filter((s) => !s.dropped);
  const met = new Set(); for (const r of ev.rounds) for (const m of r.pairings) if (m.b) { met.add(`${m.a}|${m.b}`); met.add(`${m.b}|${m.a}`); }
  const pool = ev.rounds.length ? table.map((s) => s.id) : table.map((s) => s.id).sort(() => Math.random() - 0.5);
  const pairings = []; let bye = null;
  if (pool.length % 2) { const cand = [...pool].reverse().find((id) => !table.find((s) => s.id === id).byes) || pool[pool.length - 1]; bye = cand; pool.splice(pool.indexOf(cand), 1); }
  while (pool.length) {
    const a = pool.shift(); let j = pool.findIndex((b) => !met.has(`${a}|${b}`)); if (j < 0) j = 0;
    const b = pool.splice(j, 1)[0]; pairings.push({ table: pairings.length + 1, a, b, result: null });
  }
  if (bye) pairings.push({ table: pairings.length + 1, a: bye, b: null, result: 'bye' });
  return { n: ev.rounds.length + 1, pairings };
}
function eventView(ev, u, full) {
  const me = u ? ev.players.find((p) => p.uid === u.id) : null;
  const owner = userById(ev.owner);
  const base = { id: ev.id, name: ev.name, date: ev.date, venue: ev.venue, city: ev.city, format: ev.format, kind: ev.kind, maxPlayers: ev.maxPlayers, fee: ev.fee, visibility: ev.visibility, teamId: ev.teamId,
    status: ev.status, players: ev.players.filter((p) => !p.dropped).length, interested: ev.interested.length, owner: owner ? { uid: owner.id, displayName: owner.displayName, username: owner.username } : null,
    you: { going: !!me, interested: !!(u && ev.interested.includes(u.id)), owner: isOwner(ev, u) }, rounds: ev.rounds.length, createdAt: ev.createdAt };
  if (!full) return base;
  return { ...base, description: ev.description, playerList: ev.players.map((p) => ({ id: p.id, name: p.name, uid: p.uid, dropped: !!p.dropped, guest: !p.uid })), roundList: ev.rounds, standings: standings(ev) };
}

async function api(req, res, path, search = '') {
  const ip = req.socket.remoteAddress;
  const u = currentUser(req);
  const m = req.method;

  if (path === '/api/me' && m === 'GET') return u ? send(res, 200, { user: publicUser(u) }) : send(res, 401, { error: 'Sin sesión' });

  if (path === '/api/register' && m === 'POST') {
    if (limited(ip)) return send(res, 429, { error: 'Demasiados intentos. Espera unos minutos.' });
    const b = await body(req);
    const username = String(b.username || '').trim().toLowerCase();
    const displayName = String(b.displayName || username).trim().slice(0, 40);
    const password = String(b.password || '');
    if (!USER_RE.test(username)) return send(res, 400, { error: 'El usuario debe tener 3–20 caracteres: letras minúsculas, números o _.' });
    if (password.length < 8) return send(res, 400, { error: 'La contraseña necesita al menos 8 caracteres.' });
    if (users.byName[username]) return send(res, 409, { error: 'Ese nombre de coleccionista ya existe.' });
    const { salt, hash } = await hashPassword(password);
    const nu = { id: 'u' + randomBytes(8).toString('hex'), username, displayName: displayName || username, salt, hash, createdAt: new Date().toISOString().slice(0, 10),
      profile: { avatar: 'estrella', bio: '', favorite: '', public: false } };
    users.byName[username] = nu;
    if (validState(b.state)) await atomicWrite(collFile(nu), { rev: 1, updatedAt: new Date().toISOString(), state: b.state });
    return send(res, 201, { user: publicUser(nu) }, startSession(res, nu));
  }

  if (path === '/api/login' && m === 'POST') {
    if (limited(ip)) return send(res, 429, { error: 'Demasiados intentos. Espera unos minutos.' });
    const b = await body(req);
    const cand = users.byName[String(b.username || '').trim().toLowerCase()];
    if (!cand || !(await checkPassword(String(b.password || ''), cand))) return send(res, 401, { error: 'Usuario o contraseña incorrectos.' });
    return send(res, 200, { user: publicUser(cand) }, startSession(res, cand));
  }

  if (path === '/api/logout' && m === 'POST') {
    const tok = cookies(req).rn_session; if (tok) { delete sessions[sha(tok)]; persist(); }
    return send(res, 200, { ok: true }, { 'set-cookie': `rn_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${SECURE}` });
  }

  const pub = /^\/api\/u\/([a-z0-9_]{3,20})$/.exec(path);
  if (pub && m === 'GET') {
    const owner = users.byName[pub[1]];
    if (!owner || (!owner.profile.public && (!u || u.id !== owner.id))) return send(res, 404, { error: 'Esta colección no es pública o no existe.' });
    const c = await loadColl(owner);
    return send(res, 200, { user: publicUser(owner), state: publicState(c.state), updatedAt: c.updatedAt });
  }

  if (path.startsWith('/api/esd/') && m === 'GET') {
    const r = await esd(path.slice(8), search, ip);
    return send(res, r.status, r.body, { 'cache-control': 'private, max-age=300' });
  }
  if (path === '/api/guides' && m === 'GET') return send(res, 200, (await publicGuides()).map(({ cards, runes, guide, ...rest }) => ({ ...rest, summary: (guide || {}).summary || '' })));
  const gm = /^\/api\/guides\/(u[0-9a-f]{16})\/([a-z0-9]{4,20})$/.exec(path);
  if (gm && m === 'GET') {
    const d = (await publicGuides()).find((x) => x.author.uid === gm[1] && x.id === gm[2]);
    if (d) return send(res, 200, d);
    if (u) { // también se puede abrir una guía de equipo si compartes equipo con su autor
      const shared = Object.values(teamsDb.teams).some((t) => memberOf(t, u.id) && memberOf(t, gm[1]));
      const author = userById(gm[1]);
      if (shared && author) { const s = (await loadColl(author)).state; const dd = sharedDecks(s, ['equipo', 'publico']).find((x) => x.id === gm[2]); if (dd) return send(res, 200, { ...dd, author: { uid: author.id, username: author.username, displayName: author.displayName } }); }
    }
    return send(res, 404, { error: 'Guía no encontrada o privada.' });
  }

  // ----- Eventos (lectura pública; crear e inscribirse requieren cuenta) -----
  if (path === '/api/events' && m === 'GET') {
    const now = Date.now() - 12 * 3600e3;
    const list = Object.values(eventsDb.events).filter((ev) => canSeeEvent(ev, u)).map((ev) => eventView(ev, u, false));
    const scope = new URLSearchParams(search).get('scope');
    const out = scope === 'mine' ? list.filter((e) => e.you.going || e.you.interested || e.you.owner) : scope === 'past' ? list.filter((e) => Date.parse(e.date) < now || e.status === 'finalizado') : list.filter((e) => Date.parse(e.date) >= now && e.status !== 'finalizado');
    out.sort((a, b) => (scope === 'past' ? Date.parse(b.date) - Date.parse(a.date) : Date.parse(a.date) - Date.parse(b.date)));
    return send(res, 200, out);
  }
  const evm = /^\/api\/events\/(e[0-9a-f]{12})(?:\/(join|leave|interest|rounds|result|players|drop|finish))?$/.exec(path);
  if (evm && m === 'GET' && !evm[2]) {
    const ev = eventsDb.events[evm[1]];
    if (!ev || !canSeeEvent(ev, u)) return send(res, 404, { error: 'Evento no encontrado.' });
    return send(res, 200, eventView(ev, u, true));
  }

  if (!u) return send(res, 401, { error: 'Inicia sesión' });

  if (path === '/api/events' && m === 'POST') {
    const b = await body(req);
    const name = cleanText(b.name, 80); const date = Date.parse(b.date);
    if (name.length < 3) return send(res, 400, { error: 'El nombre necesita al menos 3 caracteres.' });
    if (!Number.isFinite(date)) return send(res, 400, { error: 'Indica fecha y hora.' });
    if (Object.values(eventsDb.events).filter((e) => e.owner === u.id && e.status !== 'finalizado').length >= 20) return send(res, 400, { error: 'Tienes demasiados eventos abiertos.' });
    const vis = b.visibility === 'equipo' && b.teamId && teamsDb.teams[b.teamId] && memberOf(teamsDb.teams[b.teamId], u.id) ? 'equipo' : 'publico';
    const ev = { id: 'e' + randomBytes(6).toString('hex'), owner: u.id, name, date: new Date(date).toISOString(), venue: cleanText(b.venue, 80), city: cleanText(b.city, 60),
      format: FORMATS.includes(b.format) ? b.format : 'Construido', kind: b.kind === 'quedada' ? 'quedada' : 'torneo', maxPlayers: Math.max(2, Math.min(256, parseInt(b.maxPlayers, 10) || 16)),
      fee: cleanText(b.fee, 40), description: cleanText(b.description, 2000), visibility: vis, teamId: vis === 'equipo' ? b.teamId : null, status: 'inscripcion',
      players: [], interested: [], rounds: [], createdAt: new Date().toISOString() };
    if (b.join) ev.players.push({ id: 'p' + randomBytes(4).toString('hex'), uid: u.id, name: u.displayName });
    eventsDb.events[ev.id] = ev; saveEvents();
    return send(res, 201, eventView(ev, u, true));
  }
  if (evm) {
    const ev = eventsDb.events[evm[1]];
    if (!ev || !canSeeEvent(ev, u)) return send(res, 404, { error: 'Evento no encontrado.' });
    const sub = evm[2];
    const done = () => { saveEvents(); return send(res, 200, eventView(ev, u, true)); };
    const ownerOnly = () => { if (isOwner(ev, u)) return false; send(res, 403, { error: 'Solo quien organiza el evento puede hacerlo.' }); return true; };
    if (!sub && m === 'PATCH') {
      if (ownerOnly()) return;
      const b = await body(req);
      if (b.name) ev.name = cleanText(b.name, 80); if (b.date && Number.isFinite(Date.parse(b.date))) ev.date = new Date(Date.parse(b.date)).toISOString();
      for (const k of ['venue', 'city', 'fee']) if (typeof b[k] === 'string') ev[k] = cleanText(b[k], 80);
      if (typeof b.description === 'string') ev.description = cleanText(b.description, 2000);
      if (FORMATS.includes(b.format)) ev.format = b.format; if (b.maxPlayers) ev.maxPlayers = Math.max(2, Math.min(256, parseInt(b.maxPlayers, 10) || ev.maxPlayers));
      return done();
    }
    if (!sub && m === 'DELETE') { if (ownerOnly()) return; delete eventsDb.events[ev.id]; saveEvents(); return send(res, 200, { ok: true }); }
    if (sub === 'interest' && m === 'POST') { ev.interested = ev.interested.includes(u.id) ? ev.interested.filter((x) => x !== u.id) : [...ev.interested, u.id]; return done(); }
    if (sub === 'join' && m === 'POST') {
      if (ev.status !== 'inscripcion') return send(res, 400, { error: 'Las inscripciones están cerradas.' });
      if (ev.players.filter((p) => !p.dropped).length >= ev.maxPlayers) return send(res, 400, { error: 'El evento está completo.' });
      if (!ev.players.find((p) => p.uid === u.id)) ev.players.push({ id: 'p' + randomBytes(4).toString('hex'), uid: u.id, name: u.displayName });
      ev.interested = ev.interested.filter((x) => x !== u.id);
      return done();
    }
    if (sub === 'leave' && m === 'POST') {
      const p = ev.players.find((x) => x.uid === u.id); if (!p) return done();
      if (ev.rounds.length) p.dropped = true; else ev.players = ev.players.filter((x) => x !== p);
      return done();
    }
    if (sub === 'players' && m === 'POST') { // jugador sin cuenta añadido por la organización
      if (ownerOnly()) return;
      const b = await body(req); const name = cleanText(b.name, 40);
      if (name.length < 2) return send(res, 400, { error: 'Escribe el nombre del jugador.' });
      if (ev.players.filter((p) => !p.dropped).length >= ev.maxPlayers) return send(res, 400, { error: 'El evento está completo.' });
      ev.players.push({ id: 'p' + randomBytes(4).toString('hex'), uid: null, name }); return done();
    }
    if (sub === 'drop' && m === 'POST') {
      if (ownerOnly()) return;
      const b = await body(req); const p = ev.players.find((x) => x.id === b.playerId); if (!p) return send(res, 400, { error: 'Jugador no válido.' });
      if (ev.rounds.length) p.dropped = !p.dropped; else ev.players = ev.players.filter((x) => x !== p);
      return done();
    }
    if (sub === 'rounds' && m === 'POST') {
      if (ownerOnly()) return;
      if (ev.kind !== 'torneo') return send(res, 400, { error: 'Las quedadas no tienen rondas.' });
      const last = ev.rounds[ev.rounds.length - 1];
      if (last && last.pairings.some((x) => x.result === null)) return send(res, 400, { error: 'Faltan resultados de la ronda actual.' });
      if (ev.players.filter((p) => !p.dropped).length < 2) return send(res, 400, { error: 'Hacen falta al menos 2 jugadores.' });
      ev.status = 'en_curso'; ev.rounds.push(pairNext(ev)); return done();
    }
    if (sub === 'result' && m === 'POST') {
      const b = await body(req); const r = ev.rounds.find((x) => x.n === Number(b.round)); const mt = r && r.pairings.find((x) => x.table === Number(b.table));
      if (!mt || !mt.b) return send(res, 400, { error: 'Mesa no válida.' });
      const myP = ev.players.find((p) => p.uid === u.id);
      if (!isOwner(ev, u) && !(myP && [mt.a, mt.b].includes(myP.id))) return send(res, 403, { error: 'Solo la organización o los jugadores de la mesa.' });
      if (r.n !== ev.rounds.length && !isOwner(ev, u)) return send(res, 400, { error: 'Esa ronda ya está cerrada.' });
      mt.result = ['a', 'b', 'draw'].includes(b.result) ? b.result : null; return done();
    }
    if (sub === 'finish' && m === 'POST') { if (ownerOnly()) return; ev.status = ev.status === 'finalizado' ? 'en_curso' : 'finalizado'; return done(); }
  }

  // ----- Equipos -----
  if (path === '/api/teams' && m === 'GET') return send(res, 200, Object.values(teamsDb.teams).filter((t) => memberOf(t, u.id)).map((t) => teamSummary(t, u.id)));
  if (path === '/api/teams' && m === 'POST') {
    const b = await body(req);
    const name = cleanText(b.name, 40); const tag = cleanText(b.tag, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (name.length < 3) return send(res, 400, { error: 'El nombre del equipo necesita al menos 3 caracteres.' });
    if (tag.length < 2) return send(res, 400, { error: 'La etiqueta necesita 2–5 letras o números.' });
    if (Object.values(teamsDb.teams).filter((t) => memberOf(t, u.id)).length >= 5) return send(res, 400, { error: 'Puedes estar en 5 equipos como máximo.' });
    const t = { id: 't' + randomBytes(6).toString('hex'), name, tag, description: cleanText(b.description, 400), champ: cleanText(b.champ, 30) || 'Jinx', color: /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : '#d9b46a',
      code: code8(), createdAt: new Date().toISOString().slice(0, 10), members: [{ uid: u.id, role: 'lider', joinedAt: new Date().toISOString().slice(0, 10) }], posts: [] };
    teamsDb.teams[t.id] = t; saveTeams();
    return send(res, 201, await teamDetail(t, u.id));
  }
  if (path === '/api/teams/join' && m === 'POST') {
    if (limited(ip)) return send(res, 429, { error: 'Demasiados intentos. Espera unos minutos.' });
    const b = await body(req);
    const t = Object.values(teamsDb.teams).find((x) => x.code === cleanText(b.code, 12).toUpperCase());
    if (!t) return send(res, 404, { error: 'Código de invitación no válido.' });
    if (!memberOf(t, u.id)) {
      if (t.members.length >= 50) return send(res, 400, { error: 'El equipo está completo (50 miembros).' });
      t.members.push({ uid: u.id, role: 'miembro', joinedAt: new Date().toISOString().slice(0, 10) });
      t.posts.push({ id: code8(), uid: 'system', text: `${u.displayName} se ha unido al equipo.`, at: new Date().toISOString() });
      saveTeams();
    }
    return send(res, 200, await teamDetail(t, u.id));
  }
  const tm = /^\/api\/teams\/(t[0-9a-f]{12})(?:\/(leave|posts|members|code))?(?:\/([A-Za-z0-9]+))?$/.exec(path);
  if (tm) {
    const t = teamsDb.teams[tm[1]];
    if (!t || !memberOf(t, u.id)) return send(res, 404, { error: 'Equipo no encontrado.' });
    const [, , sub, arg] = tm;
    if (!sub && m === 'GET') return send(res, 200, await teamDetail(t, u.id));
    if (!sub && m === 'PATCH') {
      if (!canManage(t, u.id)) return send(res, 403, { error: 'Solo líder u oficiales.' });
      const b = await body(req);
      if (b.name) t.name = cleanText(b.name, 40); if (typeof b.description === 'string') t.description = cleanText(b.description, 400);
      if (b.champ) t.champ = cleanText(b.champ, 30); if (/^#[0-9a-f]{6}$/i.test(b.color || '')) t.color = b.color;
      saveTeams(); return send(res, 200, await teamDetail(t, u.id));
    }
    if (!sub && m === 'DELETE') {
      if (memberOf(t, u.id).role !== 'lider') return send(res, 403, { error: 'Solo el líder puede disolver el equipo.' });
      delete teamsDb.teams[t.id]; saveTeams(); return send(res, 200, { ok: true });
    }
    if (sub === 'code' && m === 'POST') { if (!canManage(t, u.id)) return send(res, 403, { error: 'Solo líder u oficiales.' }); t.code = code8(); saveTeams(); return send(res, 200, await teamDetail(t, u.id)); }
    if (sub === 'leave' && m === 'POST') {
      const me = memberOf(t, u.id);
      t.members = t.members.filter((x) => x.uid !== u.id);
      if (!t.members.length) delete teamsDb.teams[t.id];
      else if (me.role === 'lider') { (t.members.find((x) => x.role === 'oficial') || t.members[0]).role = 'lider'; }
      saveTeams(); return send(res, 200, { ok: true });
    }
    if (sub === 'posts' && m === 'POST') {
      const b = await body(req); const text = cleanText(b.text, 1000);
      if (!text && !b.deckId) return send(res, 400, { error: 'El mensaje está vacío.' });
      t.posts.push({ id: code8(), uid: u.id, text, deckId: b.deckId ? cleanText(b.deckId, 20) : null, at: new Date().toISOString() });
      if (t.posts.length > 300) t.posts = t.posts.slice(-300);
      saveTeams(); return send(res, 201, await teamDetail(t, u.id));
    }
    if (sub === 'posts' && arg && m === 'DELETE') {
      const p = t.posts.find((x) => x.id === arg);
      if (!p || (p.uid !== u.id && !canManage(t, u.id))) return send(res, 403, { error: 'No puedes borrar este mensaje.' });
      t.posts = t.posts.filter((x) => x.id !== arg); saveTeams(); return send(res, 200, await teamDetail(t, u.id));
    }
    if (sub === 'members' && arg && m === 'PATCH') {
      if (memberOf(t, u.id).role !== 'lider') return send(res, 403, { error: 'Solo el líder cambia rangos.' });
      const b = await body(req); const target = memberOf(t, arg);
      if (!target || arg === u.id) return send(res, 400, { error: 'Miembro no válido.' });
      if (b.role === 'lider') { memberOf(t, u.id).role = 'oficial'; target.role = 'lider'; }
      else if (['oficial', 'miembro'].includes(b.role)) target.role = b.role;
      saveTeams(); return send(res, 200, await teamDetail(t, u.id));
    }
    if (sub === 'members' && arg && m === 'DELETE') {
      const target = memberOf(t, arg);
      if (!target || !canManage(t, u.id) || target.role === 'lider' || (target.role === 'oficial' && memberOf(t, u.id).role !== 'lider')) return send(res, 403, { error: 'No puedes expulsar a este miembro.' });
      t.members = t.members.filter((x) => x.uid !== arg); saveTeams(); return send(res, 200, await teamDetail(t, u.id));
    }
  }

  if (path === '/api/collection' && m === 'GET') return send(res, 200, await loadColl(u));
  if (path === '/api/collection' && m === 'PUT') {
    const b = await body(req);
    if (!validState(b.state)) return send(res, 400, { error: 'Colección no válida.' });
    const cur = await loadColl(u);
    if (!b.force && Number(b.rev) !== cur.rev) return send(res, 409, cur);
    const next = { rev: cur.rev + 1, updatedAt: new Date().toISOString(), state: b.state };
    await atomicWrite(collFile(u), next);
    return send(res, 200, { rev: next.rev, updatedAt: next.updatedAt });
  }
  if (path === '/api/profile' && m === 'PATCH') {
    const b = await body(req);
    if (typeof b.displayName === 'string' && b.displayName.trim()) u.displayName = b.displayName.trim().slice(0, 40);
    if (b.profile && typeof b.profile === 'object') {
      const p = b.profile;
      if (typeof p.avatar === 'string') u.profile.avatar = p.avatar.slice(0, 20);
      if (typeof p.bio === 'string') u.profile.bio = p.bio.slice(0, 280);
      if (typeof p.favorite === 'string') u.profile.favorite = p.favorite.slice(0, 40);
      if (typeof p.public === 'boolean') u.profile.public = p.public;
    }
    persist();
    return send(res, 200, { user: publicUser(u) });
  }
  if (path === '/api/password' && m === 'POST') {
    const b = await body(req);
    if (!(await checkPassword(String(b.current || ''), u))) return send(res, 401, { error: 'La contraseña actual no coincide.' });
    if (String(b.next || '').length < 8) return send(res, 400, { error: 'La nueva contraseña necesita al menos 8 caracteres.' });
    Object.assign(u, await hashPassword(String(b.next)));
    for (const [k, s] of Object.entries(sessions)) if (s.uid === u.id) delete sessions[k];
    return send(res, 200, { ok: true }, startSession(res, u));
  }
  return send(res, 404, { error: 'No encontrado' });
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = decodeURIComponent(url.pathname);
  try {
    if (path.startsWith('/api/')) return await api(req, res, path, url.search);
    const rel = path === '/' ? 'index.html' : path.slice(1);
    if (PRIVATE.some((p) => rel === p || rel.startsWith(p + '/'))) { res.writeHead(404).end('No encontrado'); return; }
    const file = normalize(join(root, rel));
    if (!file.startsWith(root + sep) || !existsSync(file)) { res.writeHead(404).end('No encontrado'); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }).end(data);
  } catch (e) {
    if (res.headersSent) { console.error(e); return; }
    send(res, e.code && Number.isInteger(e.code) ? e.code : 500, { error: e.code ? e.message : 'Error del servidor' });
    if (!e.code) console.error(e);
  }
}).listen(port, () => console.log(`Runario en http://localhost:${port}`));
