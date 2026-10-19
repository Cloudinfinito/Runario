// Genera data/catalog.js a partir de un volcado de la API de Riftcodex.
// Uso: node tools/build-catalog.mjs data/raw/riftcodex-cards-2026-10-09.json 2026-10-09
// No inventa cartas: todo lo que no existe en la fuente se marca como catálogo provisional.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawPath = resolve(root, process.argv[2] || 'data/raw/riftcodex-cards-2026-10-09.json');
const fetchedAt = process.argv[3] || '2026-10-09';
const version = `rc-${fetchedAt}`;

let txt = readFileSync(rawPath, 'utf8');
if (txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1);
// La fuente conserva registros antiguos con el mismo código e imagen: procesamos primero el más reciente.
const raw = JSON.parse(txt).sort((a, b) => String(b.metadata?.updated_on).localeCompare(String(a.metadata?.updated_on)));

const COLLECTIONS = [
  { id: 'OGN', name: 'Origins', code: 'OGN', theme: 'origins', kind: 'main', released: '2025-10-31' },
  { id: 'SFD', name: 'Spiritforged', code: 'SFD', theme: 'spiritforged', kind: 'main', released: '2026-02-13' },
  { id: 'UNL', name: 'Unleashed', code: 'UNL', theme: 'unleashed', kind: 'main', released: '2026-05-08' },
  { id: 'VEN', name: 'Vendetta', code: 'VEN', theme: 'vendetta', kind: 'main', released: '2026-07-31' },
  { id: 'OGS', name: 'Origins: Proving Grounds', code: 'OGS', theme: 'origins', kind: 'product', released: '2025-10-31' },
  { id: 'PR', name: 'Promos de producto', code: 'PR', theme: 'promo', kind: 'promo', released: '2025-10-31' },
  { id: 'OPP', name: 'Promos de juego organizado', code: 'OPP', theme: 'promo', kind: 'promo', released: '2025-10-31' },
  { id: 'JDG', name: 'Promos de juez', code: 'JDG', theme: 'promo', kind: 'promo', released: '2025-12-01' },
  // Desde TCGplayer (tcgcsv): Radiance en temporada de avances, T1 y Secret Garden publicados.
  { id: 'RAD', name: 'Radiance', code: 'RAD', theme: 'radiance', kind: 'main', released: '2026-10-23', preview: true, source: 'tcg' },
  { id: 'T1', name: 'T1 · Campeones del Mundial 2025', code: 'T1', theme: 't1', kind: 'product', released: '2026-08-01', source: 'tcg' },
  { id: 'SGD', name: 'Secret Garden', code: 'SGN', theme: 'secretgarden', kind: 'promo', released: '2025-07-30', source: 'tcg' },
  // Sin checklist en ninguna fuente → provisional, cero cartas.
  { id: 'ARC', name: 'Arcane', code: 'Por confirmar', theme: 'arcane', kind: 'main', provisional: true },
];
const TCG_GROUPS = { RAD: 24819, T1: 24861, SGD: 24797 };
const PROMO_SETS = new Set(['PR', 'OPP', 'JDG']);

const pad = (n) => String(n).padStart(3, '0');
const baseName = (n) => n.replace(/\s*\((Alternate Art|Signature|Overnumbered|Metal)\)\s*$/i, '').trim();

const seen = new Map();
const prints = [];
const warnings = [];

for (const c of raw) {
  const set = c.set?.set_id;
  if (!set) continue;
  const rid = c.riftbound_id;
  const m = /^([a-z0-9]+)-(t|r|sp)?(\d+)([a-z*]?)(?:-(\d+))?$/i.exec(rid);
  if (!m) { warnings.push(`ID no reconocido, omitido: ${rid}`); continue; }
  const [, , prefix, numStr, suffix, denStr] = m;
  const num = parseInt(numStr, 10);
  const den = denStr ? parseInt(denStr, 10) : null;
  const md = c.metadata || {};
  const isMetal = /\(Metal\)/i.test(c.name);

  let id = rid + (isMetal ? '-metal' : '');
  const fingerprint = c.media?.image_url || c.name;
  if (seen.has(id)) {
    if (seen.get(id) === fingerprint) continue; // mismo código y misma imagen: registro antiguo o duplicado
    id = `${id}-v2`;
    warnings.push(`ID repetido con contenido distinto: ${rid} → ${id}`);
  }
  seen.set(id, fingerprint);

  let kind; let verify = 'fuente';
  const notes = [];
  if (prefix === 't') kind = 'token';
  else if (prefix === 'r') kind = 'rune';
  else if (prefix === 'sp') kind = 'special';
  else if (PROMO_SETS.has(set)) kind = 'promo';
  else if (suffix === '*' || md.signature) kind = 'signature';
  else if (suffix && /[ab]/i.test(suffix)) {
    kind = 'alt';
    if (!md.alternate_art) { verify = 'pendiente'; notes.push('El sufijo del código indica variante, pero la fuente no la marca como arte alternativo.'); }
  } else if ((den && num > den) || md.overnumbered) kind = 'overnumber';
  else kind = 'base';

  const faces = c.name.includes('//') ? c.name.split('//').map((s) => s.trim()) : null;
  if (faces) notes.push('Token de doble cara: la fuente solo publica la imagen de una cara.');

  prints.push({
    id, rid, set, num, den,
    no: prefix ? `${prefix.toUpperCase()}${pad(num)}` : `${pad(num)}${suffix || ''}`,
    name: c.name,
    card: baseName(c.name),
    kind,
    finish: isMetal ? 'Metal' : null,
    rarity: c.classification?.rarity || null,
    energy: c.attributes?.energy ?? null, power: c.attributes?.power ?? null, might: c.attributes?.might ?? null,
    tcg: c.tcgplayer_id ? Number(c.tcgplayer_id) : null,
    type: c.classification?.type || null,
    supertype: c.classification?.supertype || null,
    domains: c.classification?.domain || [],
    tags: c.tags || [],
    img: c.media?.image_url || null,
    artist: c.media?.artist || null,
    orient: c.orientation === 'landscape' ? 'landscape' : 'portrait',
    faces,
    verify,
    notes,
  });
}

// ---------- Colecciones que solo publica TCGplayer (vía tcgcsv) ----------
const ext = (p, k) => ((p.extendedData || []).find((d) => d.name === k) || {}).value || null;
const strip = (s) => String(s || '').replace(/<[^>]+>/g, '');
for (const [set, gid] of Object.entries(TCG_GROUPS)) {
  let t = readFileSync(resolve(root, `data/raw/tcgcsv/${gid}.json`), 'utf8'); if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  for (const p of JSON.parse(t).results) {
    const numRaw = ext(p, 'Number'); if (!numRaw) continue; // producto sellado
    const m = /^(?:(T1[AS])\s+)?(R|SP)?(\d+)([a-z*]?)(?:\/(\d+))?$/i.exec(numRaw.trim());
    if (!m) { warnings.push(`Número no reconocido (${set}): ${numRaw}`); continue; }
    const [, line, pre, numStr, suffix, denStr] = m;
    const num = parseInt(numStr, 10); const den = denStr ? parseInt(denStr, 10) : null;
    const serial = /Serial Numbered/i.test(p.name);
    const clean = p.name.replace(/\s*\((T1 Worlds Champion [^)]*|Serial Numbered)\)/gi, '').trim();
    let id = `${set.toLowerCase()}-${line ? line.toLowerCase() + '-' : ''}${pre ? pre.toLowerCase() : ''}${String(num).padStart(pre ? 2 : 3, '0')}${suffix || ''}${den ? '-' + den : ''}${serial ? '-serial' : ''}`;
    if (seen.has(id)) continue;
    seen.set(id, p.productId);
    let kind;
    if (set !== 'RAD') kind = line === 'T1S' ? 'signature' : 'promo';
    else if (/^R$/i.test(pre || '')) kind = 'rune';
    else if (/^SP$/i.test(pre || '')) kind = 'special';
    else if (suffix === '*' || /Signature/i.test(p.name)) kind = 'signature';
    else if (suffix) kind = 'alt';
    else if (num > den) kind = 'overnumber';
    else kind = 'base';
    const edition = line === 'T1A' ? 'Player Bundle' : line === 'T1S' ? (serial ? 'Signature Edition · numerada' : 'Signature Edition') : null;
    const champ = clean.split(/,| - /)[0].trim();
    prints.push({
      id, rid: numRaw, set, num, den, no: `${line ? line + ' ' : ''}${pre ? pre.toUpperCase() : ''}${String(num).padStart(pre ? 2 : 3, '0')}${suffix || ''}`,
      name: edition ? `${clean} (${edition})` : clean, card: clean, kind, finish: null,
      rarity: ext(p, 'Rarity'), type: ext(p, 'Card Type'), supertype: null,
      energy: ext(p, 'Energy Cost') != null ? Number(ext(p, 'Energy Cost')) : null, power: ext(p, 'Power Cost') != null ? Number(ext(p, 'Power Cost')) : null, might: ext(p, 'Might') != null ? Number(ext(p, 'Might')) : null,
      domains: (ext(p, 'Domain') || '').split(/[;,]/).map((s) => s.trim()).filter(Boolean), tags: champ && /^[A-Z]/.test(champ) ? [champ] : [],
      img: `https://tcgplayer-cdn.tcgplayer.com/product/${p.productId}_in_1000x1000.jpg`, artist: null, tcg: p.productId,
      orient: /Battlefield/i.test(ext(p, 'Card Type') || '') ? 'landscape' : 'portrait', faces: null,
      text: strip(ext(p, 'Description')).slice(0, 400) || null,
      verify: 'fuente', source: 'tcg', notes: set === 'RAD' ? ['Carta revelada en la temporada de avances; datos según TCGplayer.'] : [],
    });
  }
}

const kindOrder = { base: 0, rune: 1, token: 2, alt: 3, overnumber: 4, signature: 5, special: 6, promo: 7 };
prints.sort((a, b) => a.set.localeCompare(b.set) || kindOrder[a.kind] - kindOrder[b.kind] || a.num - b.num || a.id.localeCompare(b.id));

// Checklists versionadas: una entrada = un objetivo coleccionable = un hueco.
const checklists = [];
const add = (set, objective, label, filter, extra = {}) => {
  const entries = prints.filter((p) => p.set === set && filter(p)).map((p) => p.id);
  if (!entries.length && !extra.provisional) return;
  const pend = entries.filter((id) => prints.find((p) => p.id === id).verify !== 'fuente').length;
  checklists.push({
    id: `${set}:${objective}@${version}`, set, objective, label, version,
    status: extra.provisional ? 'provisional' : extra.preview ? 'avance' : pend ? 'validado-con-avisos' : 'validado',
    pending: pend,
    source: extra.provisional ? null : COLLECTIONS.find((x) => x.id === set).source === 'tcg' ? `TCGplayer vía tcgcsv · ${fetchedAt}` : `Riftcodex API · ${fetchedAt}`,
    reason: extra.reason || null,
    entries,
  });
};

for (const col of COLLECTIONS) {
  const s = col.id;
  if (col.provisional) {
    for (const [o, l] of [['base', 'Colección base']]) add(s, o, l, () => false, { provisional: true, reason: 'Colección anunciada sin checklist publicada en la fuente.' });
    continue;
  }
  if (col.kind === 'promo') { add(s, 'promo', 'Promos', () => true); continue; }
  if (col.kind === 'product') { add(s, 'product', 'Producto completo', () => true); continue; }
  const den = (prints.find((p) => p.set === s && p.kind === 'base') || {}).den;
  const pv = (what) => (col.preview ? { preview: true, reason: `Temporada de avances: solo cartas ya reveladas${what}. El total no es definitivo hasta el lanzamiento (${col.released}).` } : {});
  add(s, 'base', 'Colección base', (p) => p.kind === 'base', col.preview ? { preview: true, reason: `Temporada de avances: ${prints.filter((p) => p.set === s && p.kind === 'base').length} de ${den} cartas base reveladas. El total no es definitivo hasta el lanzamiento (${col.released}).` } : {});
  add(s, 'alt', 'Artes alternativas', (p) => p.kind === 'alt', pv(''));
  add(s, 'over', 'Overnumbers y Signature', (p) => p.kind === 'overnumber' || p.kind === 'signature' || p.kind === 'special', pv(''));
  add(s, 'foil', 'Foil', () => false, { provisional: true, reason: 'La fuente no publica qué acabados foil existen por carta. No se generan combinaciones supuestas.' });
}

for (const col of COLLECTIONS) {
  const base = checklists.find((c) => c.set === col.id && (c.objective === 'base' || c.objective === 'promo' || c.objective === 'product'));
  col.status = col.provisional ? 'provisional' : col.preview ? 'avance' : 'validado';
  col.printCount = prints.filter((p) => p.set === col.id).length;
  col.baseCount = base ? base.entries.length : 0;
}

const catalog = {
  meta: {
    version,
    fetchedAt,
    source: 'Riftcodex API (comunitaria, no oficial) y TCGplayer vía tcgcsv para Radiance, T1 y Secret Garden',
    sourceUrl: 'https://api.riftcodex.com',
    images: 'Imágenes oficiales de Riot Games (y escaneos de TCGplayer en Radiance, T1 y Secret Garden), mostradas sin modificar.',
    languages: ['EN'],
    languageNote: 'La fuente publica la checklist en inglés. Otros idiomas: catálogo provisional.',
    diptychs: [],
    diptychNote: 'La fuente no identifica qué cartas de Vendetta forman dípticos. Sin pares validados.',
    warnings,
  },
  collections: COLLECTIONS,
  prints,
  checklists,
};

const out = `// Generado por tools/build-catalog.mjs — no editar a mano.\nwindow.RB_CATALOG = ${JSON.stringify(catalog)};\n`;
writeFileSync(resolve(root, 'data/catalog.js'), out);
console.log(`prints: ${prints.length}`);
for (const c of checklists) console.log(`${c.id.padEnd(28)} ${String(c.entries.length).padStart(4)}  ${c.status}${c.pending ? ` (${c.pending} pendientes)` : ''}`);
if (warnings.length) console.log('avisos:\n  ' + warnings.join('\n  '));
