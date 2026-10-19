// node tests/run.mjs — ejecuta las comprobaciones de entrega contra el catálogo generado.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../data/catalog.js', import.meta.url), 'utf8'), ctx);
const cat = ctx.window.RB_CATALOG;
const C = require('../js/core.js');
const { runSelfTests } = require('../js/selftest.js');

const results = runSelfTests(cat, C);
for (const r of results) console.log(`${r.pass ? 'OK  ' : 'FALLO'} ${r.name}\n      ${r.detail}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} comprobaciones superadas`);
process.exit(failed ? 1 : 0);
