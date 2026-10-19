// node tests/social-smoke.mjs [baseUrl] — prueba de humo de equipos, guías y proxy de EloShowdown contra un servidor en marcha.
// Usa las cuentas de prueba locales de tests/fixtures/test-account.json.
import { readFileSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:5180';
let raw = readFileSync(new URL('./fixtures/test-account.json', import.meta.url), 'utf8');
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
const fx = JSON.parse(raw);
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALLO'} ${name}${detail ? ' · ' + detail : ''}`); };

function client() {
  let cookie = '';
  return async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    let data = null; try { data = await r.json(); } catch { /* sin cuerpo */ }
    return { status: r.status, data };
  };
}
async function session(acc) {
  const c = client();
  let r = await c('POST', '/api/login', { username: acc.username, password: acc.password });
  if (r.status !== 200) r = await c('POST', '/api/register', { username: acc.username, displayName: acc.displayName, password: acc.password });
  return { c, user: r.data && r.data.user, status: r.status };
}

const A = await session(fx); const B = await session(fx.second);
check('Sesión A', !!A.user, A.user && A.user.username); check('Sesión B', !!B.user, B.user && B.user.username);

// A guarda un mazo público y B uno de equipo en su colección.
const deck = (id, vis) => ({ id, name: `Mazo ${id}`, legend: null, champion: null, cards: { 'ogn-001-298': 3 }, runes: {}, battlefields: [], visibility: vis, guide: { summary: 'Prueba', plan: '', mulligan: '', matchups: [], tips: '', video: '' }, updatedAt: '2026-10-19' });
for (const [s, d] of [[A, deck('dpruebaa1', 'publico')], [B, deck('dpruebab1', 'equipo')]]) {
  const cur = await s.c('GET', '/api/collection');
  const st = cur.data.state || { lots: [], wish: {}, albums: [], products: [] };
  st.decks = [d]; st.lots = st.lots && st.lots.length ? st.lots : [{ id: 'l1', printId: 'ogn-002-298', lang: 'EN', finish: 'Normal', condition: 'NM', qty: 2, trade: 1, location: 'secreta', notes: 'privada' }];
  st.wish = { 'ogn-003-298': true };
  const put = await s.c('PUT', '/api/collection', { rev: cur.data.rev, state: st, force: true });
  check(`Guardar colección ${s.user.username}`, put.status === 200);
}

const created = await A.c('POST', '/api/teams', { name: 'Equipo de pruebas', tag: 'TEST', description: 'Creado por la prueba', champ: 'Ahri' });
check('Crear equipo', created.status === 201 && created.data.code, created.data && created.data.code ? 'con código de invitación' : JSON.stringify(created.data));
const tid = created.data.id;
const bad = await B.c('POST', '/api/teams/join', { code: 'NOEXISTE' });
check('Código falso rechazado', bad.status === 404);
const joined = await B.c('POST', '/api/teams/join', { code: created.data.code });
check('Unirse con código', joined.status === 200 && joined.data.members.length === 2);
check('Miembro no ve el código', joined.data.code === null);
const posted = await B.c('POST', `/api/teams/${tid}/posts`, { text: '¿Quedamos el sábado?', deckId: 'dpruebab1' });
check('Publicar en el muro', posted.status === 201 && posted.data.posts.some((p) => p.text.includes('sábado')));
const detail = await A.c('GET', `/api/teams/${tid}`);
check('Mazos compartidos visibles', detail.data.decks.some((d) => d.id === 'dpruebab1') && detail.data.decks.some((d) => d.id === 'dpruebaa1'));
check('Intercambios y deseos del equipo', detail.data.trades.length >= 1 && detail.data.wishes.length >= 1);
check('Sin notas ni ubicaciones en el equipo', !JSON.stringify(detail.data).includes('privada') && !JSON.stringify(detail.data).includes('secreta'));
const kick = await B.c('DELETE', `/api/teams/${tid}/members/${A.user.id}`);
check('Un miembro no puede expulsar al líder', kick.status === 403);
const outsider = client();
check('Equipo invisible sin sesión', (await outsider('GET', `/api/teams/${tid}`)).status === 401);

const guides = await outsider('GET', '/api/guides');
check('Guía pública listada', guides.status === 200 && guides.data.some((g) => g.id === 'dpruebaa1') && !guides.data.some((g) => g.id === 'dpruebab1'));
check('Guía de equipo oculta al público', (await outsider('GET', `/api/guides/${B.user.id}/dpruebab1`)).status === 404);
check('Guía de equipo visible para compañeros', (await A.c('GET', `/api/guides/${B.user.id}/dpruebab1`)).status === 200);

const esdMeta = await outsider('GET', '/api/esd/meta');
check('Proxy EloShowdown', esdMeta.status === 200 && !!esdMeta.data.current_season_slug, esdMeta.data && esdMeta.data.current_season_slug);
check('Proxy bloquea rutas no permitidas', (await outsider('GET', '/api/esd/leaderboard')).status === 404);

// ----- Eventos y torneo suizo -----
const when = new Date(Date.now() + 3 * 864e5).toISOString();
const ev = await A.c('POST', '/api/events', { kind: 'torneo', name: 'Torneo de prueba', date: when, format: 'Construido', maxPlayers: 8, venue: 'Tienda de pruebas', city: 'Valencia', join: true });
check('Crear torneo', ev.status === 201 && ev.data.players === 1);
const eid = ev.data.id;
check('Torneo visible sin sesión', (await outsider('GET', '/api/events')).data.some((e) => e.id === eid));
check('Crear evento exige cuenta', (await outsider('POST', '/api/events', { name: 'x', date: when })).status === 401);
const bj = await B.c('POST', `/api/events/${eid}/join`);
check('Inscribirse', bj.status === 200 && bj.data.you.going && bj.data.players === 2);
await A.c('POST', `/api/events/${eid}/players`, { name: 'Jugador sin cuenta' });
check('B no puede emparejar', (await B.c('POST', `/api/events/${eid}/rounds`)).status === 403);
const r1 = await A.c('POST', `/api/events/${eid}/rounds`);
const tables = r1.data.roundList[0].pairings;
check('Ronda 1 con descanso para 3 jugadores', r1.status === 200 && tables.length === 2 && tables.some((t) => t.b === null));
check('No se puede emparejar sin resultados', (await A.c('POST', `/api/events/${eid}/rounds`)).status === 400);
const real = tables.find((t) => t.b);
const bPid = r1.data.playerList.find((p) => p.uid === B.user.id).id;
const reporter = [real.a, real.b].includes(bPid) ? B : A;
const rr = await reporter.c('POST', `/api/events/${eid}/result`, { round: 1, table: real.table, result: 'a' });
check('Informar resultado', rr.status === 200 && rr.data.standings[0].pts === 3);
const r2 = await A.c('POST', `/api/events/${eid}/rounds`);
check('Ronda 2 emparejada', r2.status === 200 && r2.data.roundList.length === 2);
const st = r2.data.standings;
check('Clasificación con puntos y desempate', st.length === 3 && st.every((s) => typeof s.omw === 'number'));
check('B no puede borrar el evento', (await B.c('DELETE', `/api/events/${eid}`)).status === 403);
check('Borrar evento (organizador)', (await A.c('DELETE', `/api/events/${eid}`)).status === 200);

await A.c('DELETE', `/api/teams/${tid}`);
console.log(`\n${results.filter(Boolean).length}/${results.length} comprobaciones superadas`);
process.exitCode = results.every(Boolean) ? 0 : 1;
