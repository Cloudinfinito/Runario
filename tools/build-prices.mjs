// Genera data/prices.js con el precio medio de mercado de TCGplayer (vía tcgcsv, actualizado a diario)
// y el cambio USD→EUR del BCE (vía frankfurter.app). Uso: node tools/build-prices.mjs
// «Market price» de TCGplayer = media de ventas recientes. Es orientativo; no es Cardmarket.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GROUPS = [24344, 24439, 24519, 24560, 24698, 24819, 24861, 24797, 24343, 24528, 24552, 24502, 24901, 24832];
const ctx = { window: {} };
vm.runInNewContext(readFileSync(resolve(root, 'data/catalog.js'), 'utf8'), ctx);
vm.runInNewContext(readFileSync(resolve(root, 'data/assets.js'), 'utf8'), ctx);
const cat = ctx.window.RB_CATALOG; const assets = ctx.window.RB_ASSETS;

const byProduct = new Map();
for (const gid of GROUPS) {
  const r = await fetch(`https://tcgcsv.com/tcgplayer/89/${gid}/prices`, { headers: { 'user-agent': 'Runario/1.0' } });
  if (!r.ok) { console.warn(`grupo ${gid}: HTTP ${r.status}`); continue; }
  for (const x of (await r.json()).results || []) {
    const e = byProduct.get(x.productId) || {};
    const key = /foil/i.test(x.subTypeName) ? 'f' : 'n';
    e[key] = { m: x.marketPrice, l: x.lowPrice, mid: x.midPrice };
    byProduct.set(x.productId, e);
  }
}
let usdEur = null; let fxDate = null;
try { const fx = await (await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR')).json(); usdEur = fx.rates.EUR; fxDate = fx.date; } catch { console.warn('Sin cambio USD→EUR: los precios se mostrarán solo en dólares.'); }

const round = (v) => (v == null ? null : Math.round(v * 100) / 100);
const pack = (e) => [round(e.n && (e.n.m ?? e.n.mid)), round(e.f && (e.f.m ?? e.f.mid)), round(e.n ? e.n.l : e.f && e.f.l)];
const prints = {}; let n = 0;
for (const p of cat.prints) {
  const e = p.tcg && byProduct.get(p.tcg); if (!e) continue;
  const v = pack(e); if (v[0] == null && v[1] == null) continue;
  prints[p.id] = v; n++;
}
const products = {};
for (const p of assets.products) { const id = Number(p.id.replace('tcg-', '')); const e = byProduct.get(id); if (e) products[p.id] = pack(e); }

const out = { fetchedAt: new Date().toISOString().slice(0, 10), source: 'TCGplayer (precio de mercado) vía tcgcsv.com', fx: { usdEur, date: fxDate, source: 'BCE vía frankfurter.app' }, prints, products };
writeFileSync(resolve(root, 'data/prices.js'), `// Generado por tools/build-prices.mjs — no editar a mano.\nwindow.RB_PRICES = ${JSON.stringify(out)};\n`);
console.log(`precios: ${n} cartas · ${Object.keys(products).length} productos · USD→EUR ${usdEur} (${fxDate})`);
