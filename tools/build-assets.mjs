// Genera data/assets.js: recursos oficiales de Riot (Riftbound y League of Legends) enlazados desde sus CDN.
// Uso: node tools/build-assets.mjs   (lee los volcados de data/raw/)
// Runario no copia ni modifica estas imágenes: guarda solo sus URL y las muestra tal cual.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const raw = (f) => { let t = readFileSync(resolve(root, 'data/raw', f), 'utf8'); if (t.charCodeAt(0) === 0xfeff) t = t.slice(1); return JSON.parse(t); };
const DD = readFileSync(resolve(root, 'data/raw/ddragon-version.txt'), 'utf8').trim();
const CD = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/';
const WIKI = 'https://wiki.leagueoflegends.com/en-us/images/';
const wthumb = (f, w) => `${WIKI}thumb/${f}/${w}px-${f}`;
const RB = (p, q = '') => `https://cmsassets.rgpub.io/sanity/images/dsfx7636/${p}?accountingTag=RB${q}`;
const TCG = (id, size = 'in_1000x1000') => `https://tcgplayer-cdn.tcgplayer.com/product/${id}_${size}.jpg`;
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

// ---------- Campeones (Data Dragon) ----------
const champs = Object.values(raw('ddragon-champions.json').data).map((c) => ({ id: c.id, name: c.name, title: c.title, key: norm(c.name) }));

// ---------- Emotes (Community Dragon) ----------
const asArray = (x) => (Array.isArray(x) ? x : x.value || []);
const emotesAll = asArray(raw('cdragon-emotes.json')).filter((e) => e.inventoryIcon && e.name);
const emoteUrl = (e) => CD + e.inventoryIcon.replace('/lol-game-data/assets/', '').toLowerCase();
const isEsports = (e) => /esports|worlds20|msi20|competitor|_lpl|_lck|_lec|_lcs/i.test(e.inventoryIcon) || /\b(Gold|GG)\b.*20\d\d|20\d\d/.test(e.name);
const pool = emotesAll.filter((e) => !isEsports(e) && /\/(Champions|Flairs|Events)\//i.test(e.inventoryIcon));
const picked = new Map();
for (const c of champs) { // un emote por campeón cuando existe
  const e = pool.find((x) => x.inventoryIcon.toLowerCase().includes(`/champions/${c.id.toLowerCase()}/`));
  if (e && picked.size < 140) picked.set(e.id, { id: e.id, name: e.name, url: emoteUrl(e), champ: c.id });
}
for (const e of pool.filter((x) => /poro|heart|thumb|cheer|gg|love|happy|cry|laugh|wow|clap/i.test(x.name + x.inventoryIcon)).slice(0, 60)) {
  if (!picked.has(e.id)) picked.set(e.id, { id: e.id, name: e.name, url: emoteUrl(e), champ: null });
}
const emotes = [...picked.values()];

// ---------- Productos sellados reales (TCGplayer vía tcgcsv) ----------
const GROUPS = { 24344: 'OGN', 24439: 'OGS', 24519: 'SFD', 24560: 'UNL', 24698: 'VEN', 24819: 'RAD', 24861: 'T1', 24797: 'SGN', 24502: 'WRB', 24901: 'GRF', 24832: 'LGC' };
const TYPE_ES = [
  [/Sleeved Booster Pack Art Bundle/i, 'Lote de 3 sobres con funda', 'pack'],
  [/Sleeved Booster Pack/i, 'Sobre con funda', 'pack'],
  [/Booster Display Case/i, 'Caja de cajas de sobres', 'case'],
  [/Booster Display/i, 'Caja de sobres (24)', 'display'],
  [/Booster Pack/i, 'Sobre de mejora', 'pack'],
  [/Champion Deck \((.+)\) Display/i, 'Expositor de mazos de campeón ($1)', 'display'],
  [/Champion Deck \((.+)\)/i, 'Mazo de campeón ($1)', 'deck'],
  [/Showdown Decks: (.+) Display/i, 'Expositor Showdown ($1)', 'display'],
  [/Showdown Decks: (.+)/i, 'Mazos Showdown ($1)', 'deck'],
  [/Pre-Rift Event Kit/i, 'Kit de evento Pre-Rift', 'kit'],
  [/Pre-Rift Kit/i, 'Kit Pre-Rift', 'kit'],
  [/Vault Bundle Case/i, 'Caja de Vault Bundles', 'case'],
  [/Vault Bundle/i, 'Vault Bundle', 'bundle'],
  [/Nexus Night Promo Pack/i, 'Sobre promocional Nexus Night', 'pack'],
  [/Proving Grounds Box Set Case/i, 'Caja de Proving Grounds', 'case'],
  [/Proving Grounds Box Set/i, 'Caja Proving Grounds', 'box'],
  [/Bulk Runes Case/i, 'Caja de runas', 'case'],
  [/Bulk Runes/i, 'Lote de runas', 'bundle'],
  [/Signature Edition Bundle/i, 'Bundle Signature Edition', 'bundle'],
  [/Player Bundle/i, 'Bundle de jugador', 'bundle'],
  [/Secret Garden Box/i, 'Caja Secret Garden', 'box'],
  [/Worlds Bundle/i, 'Bundle Worlds 2025', 'bundle'],
  [/Gift of the Rift/i, 'Gift of the Rift Bundle', 'bundle'],
];
const products = [];
for (const f of readdirSync(resolve(root, 'data/raw/tcgcsv'))) {
  const gid = Number(f.replace('.json', '')); const set = GROUPS[gid]; if (!set) continue;
  for (const p of raw(`tcgcsv/${f}`).results) {
    if ((p.extendedData || []).some((d) => d.name === 'Number')) continue;
    if (/^Buff$/i.test(p.name)) continue;
    const m = TYPE_ES.find(([re]) => re.test(p.name));
    const label = m ? p.name.replace(/.*/, () => { const mm = p.name.match(m[0]); return m[1].replace('$1', mm && mm[1] ? mm[1] : ''); }) : p.name;
    products.push({ id: `tcg-${p.productId}`, set, name: label, original: p.name, kind: m ? m[2] : 'other', img: TCG(p.productId), thumb: TCG(p.productId, '400w'), source: 'TCGplayer (tcgcsv)' });
  }
}
// Fotos oficiales de Riot cuando existen.
const OFFICIAL = {
  'Sobre de mejora|OGN': RB('news_live/2d2bf39bb3b1c65497866b93f17c12e72c509efe-844x844.png', '&fm=webp&w=700'),
  'Caja de sobres (24)|OGN': RB('news_live/7a74b12bab6461ad720ab47e98b908a38213580c-844x844.png', '&fm=webp&w=700'),
  'Caja Proving Grounds|OGS': RB('news_live/da48b48ebce3dfbbd8d706c145c24eccc4fb9c31-844x844.png', '&fm=webp&w=700'),
};
for (const p of products) { const o = OFFICIAL[`${p.name}|${p.set}`]; if (o) { p.img = o; p.thumb = o; p.source = 'Riot Games (playriftbound.com)'; } }
const kindOrder = { pack: 0, display: 1, deck: 2, box: 3, bundle: 4, kit: 5, case: 6, other: 7 };
products.sort((a, b) => a.set.localeCompare(b.set) || kindOrder[a.kind] - kindOrder[b.kind] || a.name.localeCompare(b.name));

// ---------- Identidad de cada colección ----------
const packOf = (set) => (products.find((p) => p.set === set && p.kind === 'pack') || products.find((p) => p.set === set) || {}).thumb || null;
const sets = {
  OGN: { art: wthumb('Riftbound_Origins_Promo_01.jpg', 1600), artSource: 'Arte promocional de Origins (Riot Games)' },
  SFD: { art: RB('news_live/0c1193017065450e14c227e203a305fcacb9469a-1920x1080.jpg', '&fm=webp&w=1600'), artSource: 'Arte de lanzamiento de Spiritforged (Riot Games)', logoInArt: true },
  UNL: { art: wthumb('Riftbound_Unleashed_Promo_01.jpg', 1600), artSource: 'Arte promocional de Unleashed (Riot Games)' },
  VEN: { art: wthumb('Riftbound_Vendetta_Promo_01.jpg', 1600), artSource: 'Arte promocional de Vendetta (Riot Games)' },
  RAD: { art: RB('news_live/0d895d9d1ec8446fd14649933ff8d7efe1972cc4-1920x1080.jpg', '&fm=webp&w=1600'), artSource: 'Arte de lanzamiento de Radiance (Riot Games)', logoInArt: true },
  OGS: { art: RB('news_live/da48b48ebce3dfbbd8d706c145c24eccc4fb9c31-844x844.png', '&fm=webp&w=900'), artSource: 'Caja Proving Grounds (Riot Games)' },
  PR: { art: wthumb('Riftbound_Organized_Play_logo_ver.jpg', 1200), artSource: 'Juego organizado de Riftbound (Riot Games)' },
  OPP: { art: wthumb('Riftbound_Organized_Play_logo_ver.jpg', 1200), artSource: 'Juego organizado de Riftbound (Riot Games)' },
  JDG: { art: wthumb('Riftbound_Organized_Play_logo_ver.jpg', 1200), artSource: 'Juego organizado de Riftbound (Riot Games)' },
  T1: { art: TCG(716008), artSource: 'T1 Worlds Champion Signature Edition Bundle' },
  SGD: { art: TCG(710238), artSource: 'Secret Garden Box' },
  ARC: { art: null, artSource: null },
};
for (const [k, v] of Object.entries(sets)) v.pack = packOf(k === 'SGD' ? 'SGN' : k) || (k === 'PR' || k === 'OPP' || k === 'JDG' ? packOf('OGN') : null);

// ---------- Iconos oficiales de Riftbound (wiki de League of Legends) ----------
const icons = {
  domain: Object.fromEntries(['fury', 'calm', 'mind', 'body', 'chaos', 'order'].map((d) => [d, `${WIKI}RB_${d}_rune_icon.png`])),
  domainFlat: Object.fromEntries(['fury', 'calm', 'mind', 'body', 'chaos', 'order'].map((d) => [d, `${WIKI}RB_${d}_icon.svg`])),
  rarity: Object.fromEntries(['common', 'uncommon', 'rare', 'epic', 'showcase'].map((r) => [r, wthumb(`RB_${r}_icon.png`, 64)])),
  type: Object.fromEntries(['unit', 'spell', 'gear', 'legend', 'battlefield', 'rune', 'champion'].map((t) => [t, wthumb(`RB_${t}_icon.png`, 64)])),
  might: `${WIKI}RB_might_icon.svg`, exhaust: `${WIKI}RB_exhaust_icon.svg`, wild: `${WIKI}RB_wild_rune_icon.svg`,
};

const assets = {
  meta: { builtAt: new Date().toISOString().slice(0, 10), ddragon: DD,
    disclaimer: 'Runario no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de nadie implicado oficialmente en la producción o gestión de sus propiedades. Riot Games y todas sus propiedades asociadas son marcas comerciales o registradas de Riot Games, Inc.',
    sources: ['playriftbound.com (Riot Games)', 'Data Dragon (Riot Games)', 'Community Dragon', 'League of Legends Wiki', 'TCGplayer vía tcgcsv'] },
  logo: RB('news/23d41c7809a48a013f3d8a7204b81fb4d8bdb164-10000x4389.png', '&fm=webp&w=900'),
  lolLogo: wthumb('League_of_Legends_logo.png', 800),
  ranked: Object.fromEntries(['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'grandmaster', 'challenger']
    .map((t) => [t, `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${t}.png`])),
  dd: { square: `https://ddragon.leagueoflegends.com/cdn/${DD}/img/champion/`, splash: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/', loading: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/' },
  champions: champs.map(({ id, name, title }) => ({ id, name, title })),
  emotes, products, sets, icons,
};
writeFileSync(resolve(root, 'data/assets.js'), `// Generado por tools/build-assets.mjs — no editar a mano.\nwindow.RB_ASSETS = ${JSON.stringify(assets)};\n`);
console.log(`campeones ${champs.length} · emotes ${emotes.length} · productos ${products.length}`);
console.log(Object.entries(sets).map(([k, v]) => `${k}: arte ${v.art ? 'sí' : 'no'} · sobre ${v.pack ? 'sí' : 'no'}`).join('\n'));
