# Runario · Archivo de coleccionistas de Riftbound

Álbumes con huecos exactos, paso de página 3D, cartas en 3D, taller de encuadernación, vitrina de medallas y cuentas personales.

## Arrancar

```
node server.mjs
```

Abre http://localhost:5180. Sin dependencias ni compilación (Node 18+).

- **Cuentas:** cada coleccionista crea su usuario. Contraseñas con scrypt + sal, sesión por cookie HttpOnly. Los datos viven en `storage/` (se crea solo; no lo sirve el servidor estático).
- **Invitado:** también se puede usar sin cuenta (solo en ese navegador) y traspasar la colección al registrarse.
- **Vitrina pública:** opcional desde Perfil → `#/u/<usuario>`. No expone notas, ubicaciones ni productos.

## Mazos, partidas y equipos

- **Mazos y guías** (`#/mazos`): asistente paso a paso, constructor con las reglas de la [guía oficial de construcción](https://playriftbound.com/es-es/news/rules-and-releases/deckbuilding-primer), curva de energía, cartas que faltan según tu colección y guías por secciones. Visibilidad: privado, mis equipos o guía pública.
- **Partidas** (`#/partidas`): estadísticas de torneo de [EloShowdown](https://eloshowdown.com/api) (comunitario) a través de `/api/esd/*`, un proxy con caché y lista blanca de rutas. Opcional: `ESD_API_KEY` en el entorno para el límite de 1000 peticiones/hora.
- **Equipos** (`#/equipos`): requiere cuenta. Invitación por código, roles, muro, intercambios cruzados, colección conjunta y mazos compartidos. Se guardan en `storage/teams.json`.
- **Eventos** (`#/eventos`): torneos y quedadas no oficiales de la comunidad, con «Voy» y «Me interesa», exportación a calendario (.ics) y, para torneos, rondas suizas, resultados y clasificación del evento. Se guardan en `storage/events.json`. Los eventos oficiales se enlazan al localizador de Riftbound.
- **Precios** (`data/prices.js`): precio medio de mercado de TCGplayer vía tcgcsv y cambio USD→EUR del BCE vía frankfurter.app. `node tools/build-prices.mjs` los regenera; el servidor lo hace solo cada 24 h.
- Política de Riot para Riftbound: Runario no crea clasificaciones entre jugadores ni porcentajes de victoria por mazo.

## Comprobaciones

```
node tests/run.mjs
```

Las mismas comprobaciones aparecen en la app, en **Validación**. Con el servidor en marcha, `node tests/social-smoke.mjs` prueba equipos, guías y el proxy de EloShowdown. `tests/fixtures/test-account.json` guarda una cuenta de prueba local (no real) para probar el servidor de desarrollo.

## Catálogo

- `data/raw/` — volcado de la API comunitaria Riftcodex (no oficial) del 2026-10-09.
- `tools/build-catalog.mjs` — genera `data/catalog.js` con checklists versionadas, procedencia y estado de verificación.
- Lo que la fuente no publica (foil por carta, idiomas, pares de dípticos, Radiance/Arcane/Secret Garden/T1) queda como **catálogo provisional** con 0 huecos.

## Estructura

| Archivo | Contenido |
|---|---|
| `server.mjs` | Servidor estático + API de cuentas, colección y perfil público |
| `js/core.js` | Lógica pura: checklists, paginación, progreso, inventario, logros, CSV |
| `js/selftest.js` | Comprobaciones de entrega (Node y navegador) |
| `js/art.js` | Arte propio: glifos, emblemas, medallas, avatares, reverso, logotipo |
| `js/flip.js` | Paso de página 3D con curvatura (arrastrable) |
| `js/viewer3d.js` | Inclinación de cartas y visor 3D |
| `js/app.js` | Interfaz completa |
| `css/app.css` | Estilos (escritorio primero, luego tablet y móvil) |

## Subirlo a GitHub y probarlo online

- `.gitignore` excluye `storage/` (cuentas y datos de usuarios) y `tests/fixtures/` (credenciales de prueba).
- **Solo con GitHub Pages** funciona el modo invitado (álbumes, colección, mazos privados, precios). Cuentas, equipos, eventos, guías públicas y Partidas necesitan `server.mjs` en marcha.
- **Versión completa en Render** (Web Service gratuito): conectar el repositorio, *Build command* vacío, *Start command* `npm start`. Opcional: `ESD_API_KEY`. En el plan gratuito el disco no persiste: las cuentas se pierden al reiniciar o redesplegar; para conservarlas hace falta un disco persistente montado en `storage/`.

## Publicarlo en internet

Hoy funciona en local. Para que otras personas creen cuentas desde fuera hace falta alojar `server.mjs` en un servidor con HTTPS (y añadir `Secure` a la cookie de sesión).
