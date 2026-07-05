---
name: arena-game
description: Modificar, balancear, agregar features o redesplegar el juego 3D de la arena de Everlight ("Templo del Desorden", Higgsfield). Usar SIEMPRE que el usuario pida cambios al juego de la arena, al combate, hechizos, HUD del juego, modelos 3D de héroes/enemigos, dificultad, o a la integración app↔juego (recompensas, nivel, gemas, avatar).
---

# Arena Game — Everlight: Templo del Desorden

Juego 3D co-op roguelite desplegado en Higgsfield, embebido en la app en `/arena`.

## Datos fijos (no inventar nunca)

- **Fuente**: `/Users/rulocode/dev/side/everlight-game/` (FUERA de este repo; no es git).
- **URL jugable**: https://noble-shore-296.higgsfield.gg/
- **game_id**: `07e775e7-7a01-470d-b0ce-db577d2d8437` — pásalo SIEMPRE a `deploy_game` para
  actualizar in-place. Omitirlo crea OTRO juego con otra URL (error grave). Si un deploy
  de update falla, reintenta CON el game_id; jamás sin él.
- Historial de versiones y media_ids: `everlight-game/DEPLOY.md` (actualízalo tras cada deploy).
- Antes de tocar assets generados o crear contenido de juego nuevo, el MCP exige
  `get_game_creation_instructions` (y sus bundle files para lo que uses).

## Arquitectura

**Servidor** — `server.js`: `GameServer extends DurableObject` (imports solo de
`'cloudflare:workers'`). Tick 20 Hz, snapshots 10 Hz, salas = shards `/ws/<room>`,
3 asientos (4º+ = espectador), estado en memoria (se resetea; clientes rejoinean con
`playerId` de sessionStorage). Todo el combate/balance es server-side y vive en las
constantes de arriba del archivo: `HERO`, `MINION`, `BOSS`, `WEAPONS`, `GEMS` (gear),
gemas de bosque (`GEM_TIERS`, `resolveGemBuffs`), `SHIELD`, `waveSpawns()`, `scale()`
(escalado por tier). Cambios de balance = editar esas constantes.

**Cliente** — `public/index.html` (escena Three.js r165 vendorizado en
`assets/vendor/`, netcode, entity views, cámara con zoom) + módulos ES:
`assets/input.js` (Pointer Events: joystick/hechizos/teclado/gamepad/pinch),
`assets/hud.js` (card, misión, boss bar, cluster, modales, overlays),
`assets/minimap.js`, `assets/tutorial.js`, `assets/vfx.js` (pools por hechizo),
`assets/strings.js` (TODO texto visible — jamás literales en código).

**Snapshot player array** (¡los índices importan!): `[0]id [1]name [2]x [3]z [4]dir
[5]hp [6]maxHp [7]level [8]xp [9]state [10]anim [11]reviveP [12]novaCd [13]healCd
[14]shieldCd(-1=bloqueado) [15]shieldT [16]jumpT [17]skin('m'|'f')`. Si agregas un
campo: push al final en `snapshot()` (server) y léelo en `interpolated()` + `hud.syncMe`
(cliente). El snapshot también trae `tier`, `phase`, `wave`, `minions`, `boss`, `ev`.

**Controles**: WASD/joystick mover · Espacio/⤴ salto (atacar en el aire = golpe de
área; en el aire esquiva melee y slam del jefe) · J/⚔ golpe · K/❂ nova · L/✚ sanadora ·
H/🛡 escudo (se desbloquea con 10+ gemas) · rueda/pinch zoom. Gamepad: A=salto,
X=ataque, RB=nova, LB=sanadora, Y=escudo.

## Contrato app ↔ juego

**Query params del iframe** (los arma `src/pages/Arena.tsx`): `room` (el-<uid8>),
`name`, `origin` (para postMessage), `avatar` (URL absoluta), `rxp`/`rpts` (recompensa
mostrada), `tier`, `weapon` (id de bastón), `gems` (CSV mixto: ids de gear equipado
`wrath,haste` + gemas de bosque `health:8,career:5` — el server separa por `:`),
`level` (nivel real del usuario), `skin` (`f` si el avatar es Dani, `m` si Rulo).

**postMessage** (el juego → `window.top`, porque el engine lo envuelve en su propio
iframe): `{source:'everlight-game', event:'victory', tier, room}` al vencer y
`{event:'armory'}` desde la derrota. La app (Arena.tsx) valida `event.origin`, otorga
recompensas escaladas con cap diario y persiste el tier vía RPC `complete_arena_tier`.

**Regla de espejos**: el catálogo de gear existe en TRES sitios que deben ir en sync:
`src/constants/arenaGear.ts` (app), `WEAPONS`/`GEMS` en `server.js` (juego) y los costos
en la función SQL `arena_item_cost` (migración `20260702120000_arena_progression.sql`).

## Flujo de cambio (síguelo en orden)

1. Edita la fuente en `everlight-game/` (y `zylen-web` si toca la integración).
2. **Chequeo local**: `cd everlight-game/public && python3 -m http.server 8571` →
   Playwright a `http://localhost:8571/index.html?dev=1&room=x`. Los errores de WS en
   local son ESPERADOS (el DurableObject solo existe desplegado); lo que se valida es
   que no haya errores JS de módulos y que el HUD renderice.
3. **Empaqueta** (layout obligatorio en la RAÍZ del zip):
   `rm -rf stage everlight-templo.zip && mkdir stage && cp server.js stage/ &&
   cp public/index.html stage/ && cp -r public/assets stage/ && mkdir stage/design &&
   cp design/*.{csv,md} stage/design/ ; cd stage && zip -qr ../everlight-templo.zip . -x "*.DS_Store"`
   (nunca incluyas `viewer.html`, `work/`, `tools/`).
4. **Deploy**: `media_upload` (filename .zip) → `curl -X PUT --data-binary @zip <upload_url>`
   → `media_confirm(type:'file')` → `deploy_game` con `game_id` + `source_game` (la URL
   permanente del confirm) + thumbnail/favicon existentes (jobs `27d5f776…` / `83d31acd…`).
   Un fallo "Something went wrong" suele ser transitorio: espera ~20 s y reintenta con game_id.
5. **Verifica en la URL publicada** (no confíes en el deploy): Playwright con `?dev=1`
   expone `window.__state` (snapshot vivo) dentro del iframe del engine —
   `document.querySelector('iframe').contentWindow`. Simula teclas con
   `w.dispatchEvent(new w.KeyboardEvent('keydown',{code:'KeyW'}))`, arranca solo con
   `#startFloat`, y valida números contra las fórmulas (p. ej. hp de imp =
   `round(24×(1+0.35(t−1)))`). Netcode: 2 pestañas = 2 jugadores. OJO: el navegador
   Playwright es visible en el Mac del usuario — si los números salen raros puede haber
   input humano simultáneo; repite el test aislado antes de diagnosticar bug.
6. Actualiza el historial en `DEPLOY.md`. Si tocaste `zylen-web`: `pnpm run build`,
   commit SOLO de tus archivos (suele haber WIP ajeno en el árbol) y push a `main`
   (Vercel NO auto-deploya: prod real se sube con `vercel --prod`, ver memoria).

## Assets nuevos (modelos, texturas, audio)

- STYLE FORMULA del juego (insertar byte-idéntica en todo prompt de asset generado):
  «stylized 3D animated-film render with soft painterly shading and gentle rim light;
  rounded chibi proportions, chunky simplified forms, clean silhouettes; environment in
  deep violet and indigo ruined stone with charcoal shadows and cyan-blue mist, hero in
  warm bronze and teal tones with a glowing teal-white light staff contrasting the
  surroundings, enemies and hazards marked with saturated magenta-purple glow; dark
  mystical night atmosphere lit by neon arcane runes, moody but hopeful; high contrast
  between game elements and backgrounds, clean readable silhouettes, consistent
  three-quarter isometric view across all assets»
- **Personaje riggeado**: concept con `gpt_image_2` (figura única, cuerpo completo,
  A-pose con extremidades separadas, fondo blanco puro, SIN props en las manos — el
  bastón es procedural en el cliente) → verifica la imagen con Read → `generate_3d`
  `image_to_3d` con `should_texture + enable_rigging + enable_animation +
  animation_action_id:0 + pose_mode:'a-pose' + target_polycount:20000 +
  rigging_height_meters:1.2` → clips extra con `3d_rigging` sobre el GLB resultante
  (ids usados: 0=Idle, 16=RunFast, 125=Charged_Spell_Cast; catálogo en
  `animation_actions`) → merge local:
  `python3 tools/glb_merge_anims.py base.glb run.glb:Run atk.glb:Attack out.glb` →
  `python3 tools/glb_inspect.py out.glb` (espera: skins≥1, 3 clips, OPAQUE, sin warning
  de root scale — el merge arregla el bug Meshy 1.1765).
- **Texturas tileables**: `nano_banana_2` con template de tile + seam fix determinístico
  `python3 tools/pipeline.py in.png -o out --ref in.png --trim 0` (ratio objetivo ≤1.3).
- Los `.glb` NO se suben con media_upload (extensión bloqueada); van dentro del zip.

## Pitfalls que ya nos mordieron (no re-aprender)

- **Rigs Meshy**: nodo `Armature` a escala 0.01 → NUNCA midas el tamaño con bbox del
  objeto; mide la altura por posiciones world de los huesos (ya implementado en
  `makeHeroView`). El bastón se ancla al hueso `RightHand` cancelando su world scale.
- **Facing**: los modelos descansan mirando a +z y `dir = atan2(mx, mz)` →
  `rotation.y = dir` (SIN sumar π; eso hizo correr al héroe de espaldas).
- **Input táctil**: solo Pointer Events con `pointercancel` manejado (touch events sin
  touchcancel congelaban el joystick en iframes móviles → "corre a un solo lado").
- **Doble iframe**: el engine envuelve el juego; desde el juego, la app es `window.top`.
  En QA, el contenido real está en `iframe.contentWindow`.
- **Skins**: cliente carga `hero.glb` (m) y `hero_f.glb` (f, Dani) con fallback f→m;
  cada jugador ve el modelo de los demás vía snapshot idx17.
- Playwright MCP a veces deja el perfil bloqueado: `pkill -f mcp-chrome-a1d8ab0` +
  borrar `SingletonLock`.
- El panel de sala vive tras el chip 👥 del header (no restaurar paneles fijos);
  el enlace compartible es canónico: `origin+path?room=` sin params de debug.
