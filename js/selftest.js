// Comprobaciones de entrega. Se ejecutan en Node (tests/run.mjs) y en la vista «Validación».
(function (root) {
  'use strict';

  function runSelfTests(cat, C) {
    const R = [];
    const t = (name, fn) => {
      try { const detail = fn(); R.push({ name, pass: true, detail: detail || '' }); }
      catch (e) { R.push({ name, pass: false, detail: e.message }); }
    };
    const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg}: esperado ${b}, obtenido ${a}`); };
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const album = (o) => ({ id: 'test', name: 't', lang: 'any', pageSize: 9, order: [], ...o });

    t('El total de huecos coincide exactamente con cada checklist', () => {
      const lines = [];
      for (const cl of cat.checklists) {
        const col = C.collectionOf(cat, cl.set);
        const objective = cl.objective;
        const p = C.progress(cat, C.emptyState(), album({ set: cl.set, objective }));
        eq(p.total, cl.entries.length, `${cl.id}`);
        eq(new Set(cl.entries).size, cl.entries.length, `${cl.id} sin huecos duplicados`);
        for (const id of cl.entries) if (!C.printOf(cat, id)) throw new Error(`${cl.id} contiene ${id}, que no está en el catálogo`);
        if (objective === 'base' && !col.provisional && cl.status !== 'avance') {
          const den = C.printOf(cat, cl.entries[0]).den;
          eq(cl.entries.length, den, `${cl.set} base frente a la numeración impresa /${den}`);
          lines.push(`${cl.set} ${cl.entries.length}/${den}`);
        }
      }
      return 'Base: ' + lines.join(' · ');
    });

    t('Las repetidas no inflan el porcentaje', () => {
      const a = album({ set: 'OGS', objective: 'product' });
      const ids = C.resolveChecklist(cat, a).entries;
      const s = C.emptyState();
      C.addQty(s, ids[0], 1); C.addQty(s, ids[1], 1);
      const before = C.progress(cat, s, a);
      C.addQty(s, ids[0], 7); C.addQty(s, ids[0], 2, { lang: 'FR', finish: 'Foil' });
      const after = C.progress(cat, s, a);
      eq(after.filled, before.filled, 'Huecos llenos');
      eq(after.pct, before.pct, 'Porcentaje');
      eq(C.qty(s, ids[0]), 10, 'Cantidad acumulada');
      eq(after.total, ids.length, 'Total de huecos');
      return `2/${ids.length} = ${after.pct} % con 10 copias de la primera carta`;
    });

    t('La última página no añade cartas inexistentes', () => {
      const cases = [[6, 9, 1, [6]], [24, 12, 2, [12, 12]], [298, 9, 34, null]];
      for (const [n, size, pages, sizes] of cases) {
        const p = C.paginate(n, size);
        eq(p.pages, pages, `${n} cartas / ${size}`);
        if (sizes) eq(p.sizes.join(','), sizes.join(','), `${n}/${size} tamaños`);
        eq(p.sizes.reduce((a, b) => a + b, 0), n, `${n}/${size} suma de huecos`);
      }
      const p298 = C.paginate(298, 9);
      eq(p298.sizes.filter((x) => x === 9).length, 33, '298/9 páginas completas');
      eq(p298.lastSize, 1, '298/9 última página');
      const a = album({ set: 'OGN', objective: 'base', pageSize: 9 });
      const list = C.orderedEntries(C.resolveChecklist(cat, a).entries, []);
      eq(C.pageSlice(list, 9, 33).length, 1, 'Origins: huecos reales en la página 34');
      return '6→1×6 · 24→2×12 · 298→33×9 + 1×1';
    });

    t('Cambiar la distribución conserva cartas y cantidades', () => {
      const a = album({ set: 'OGN', objective: 'base', pageSize: 9 });
      const ids = C.resolveChecklist(cat, a).entries;
      const s = C.emptyState();
      ids.slice(0, 40).forEach((id, i) => C.addQty(s, id, 1 + (i % 3)));
      const snap = JSON.stringify(s.lots);
      const p9 = C.progress(cat, s, a);
      for (const size of [4, 12, 9]) {
        a.pageSize = size;
        const p = C.progress(cat, s, a);
        eq(p.filled, p9.filled, `Llenos con ${size}`);
        const list = C.orderedEntries(ids, a.order);
        const pg = C.paginate(list.length, size);
        let seen = 0; for (let i = 0; i < pg.pages; i++) seen += C.pageSlice(list, size, i).length;
        eq(seen, ids.length, `Huecos repartidos con ${size}`);
      }
      a.order = ids.slice().reverse();
      eq(C.progress(cat, s, a).filled, p9.filled, 'Llenos con orden manual');
      eq(JSON.stringify(s.lots), snap, 'Inventario intacto');
      return `${p9.filled} huecos llenos y ${s.lots.reduce((n, l) => n + l.qty, 0)} copias iguales con 4, 9 y 12`;
    });

    t('Móvil y escritorio muestran el mismo inventario', () => {
      // La vista solo cambia la presentación (columnas/página doble); el cálculo no recibe el ancho de pantalla.
      const a = album({ set: 'OGS', objective: 'product' });
      const s = C.emptyState();
      C.resolveChecklist(cat, a).entries.slice(0, 5).forEach((id) => C.addQty(s, id, 2));
      const desktop = C.progress(cat, clone(s), { ...a, pageSize: 12 });
      const mobile = C.progress(cat, clone(s), { ...a, pageSize: 12 });
      eq(JSON.stringify(desktop), JSON.stringify(mobile), 'Progreso');
      return 'Mismo estado y mismo cálculo; la vista solo cambia columnas';
    });

    t('Una colección pequeña y una grande tienen tamaños distintos', () => {
      const small = C.progress(cat, C.emptyState(), album({ set: 'OGS', objective: 'product' })).total;
      const big = C.progress(cat, C.emptyState(), album({ set: 'OGN', objective: 'base' })).total;
      if (small === big) throw new Error('Mismo tamaño');
      return `Proving Grounds ${small} huecos · Origins ${big} huecos`;
    });

    t('Las colecciones provisionales no inventan cartas', () => {
      for (const col of cat.collections.filter((c) => c.provisional)) {
        eq(C.progress(cat, C.emptyState(), album({ set: col.id, objective: 'base' })).total, 0, col.name);
      }
      for (const cl of cat.checklists.filter((c) => c.objective === 'foil')) eq(cl.entries.length, 0, `${cl.set} foil`);
      const prev = cat.checklists.filter((c) => c.status === 'avance');
      for (const cl of prev) {
        for (const id of cl.entries) if (!C.printOf(cat, id)) throw new Error(`${cl.id}: ${id} no existe en la fuente`);
        const den = C.printOf(cat, cl.entries[0]).den;
        if (cl.objective === 'base' && cl.entries.length > den) throw new Error(`${cl.id} supera la numeración impresa`);
      }
      return `Arcane y Foil: 0 huecos · En avance: ${prev.map((c) => `${c.set} ${c.objective} ${c.entries.length}`).join(', ')} (solo cartas reveladas)`;
    });

    t('Los tokens de doble cara ocupan un solo hueco', () => {
      const tok = cat.prints.filter((p) => p.faces);
      for (const p of tok) eq(cat.prints.filter((x) => x.id === p.id).length, 1, p.name);
      return tok.map((p) => p.name).join(', ') || 'Sin tokens de doble cara en el catálogo';
    });

    t('CSV: exportar e importar conserva el inventario y rechaza filas inválidas', () => {
      const s = C.emptyState();
      const ids = cat.checklists.find((c) => c.id.startsWith('OGN:base')).entries;
      C.addQty(s, ids[0], 3); C.addQty(s, ids[1], 1, { lang: 'ES', finish: 'Foil' });
      s.lots[0].trade = 2; s.lots[0].location = 'Carpeta 1; fila "A"'; s.wish[ids[5]] = true;
      const csv = C.toCSV(cat, s);
      const v = C.validateImport(cat, csv);
      eq(v.errors.length, 0, 'Errores');
      const s2 = C.applyImport(C.emptyState(), v.ok, 'reemplazar');
      eq(C.qty(s2, ids[0]), 3, 'Cantidad'); eq(C.tradeQty(s2, ids[0]), 2, 'Intercambio');
      eq(s2.lots.find((l) => l.printId === ids[0]).location, 'Carpeta 1; fila "A"', 'Ubicación con caracteres especiales');
      eq(!!s2.wish[ids[5]], true, 'Deseo');
      const bad = C.validateImport(cat, 'id_impresion;cantidad\nno-existe;1\n' + ids[0] + ';dos\n' + ids[0] + ';1\n');
      eq(bad.errors.length, 2, 'Filas inválidas detectadas'); eq(bad.ok.length, 1, 'Filas válidas');
      return 'Ida y vuelta correcta; 2 filas inválidas rechazadas con su línea';
    });

    return R;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { runSelfTests };
  root.RBSelfTest = { runSelfTests };
})(typeof window !== 'undefined' ? window : globalThis);
