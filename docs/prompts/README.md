# Prompts pendientes de generación — Zylen

Esta carpeta contiene **solo prompts que todavía NO se han ejecutado**. Cada
archivo `.json` es un lote autocontenido: abre el objeto, copia el `prompt` de
cada item en tu generador de imágenes (gpt-image-1 en modo edición o Nano
Banana Pro image-to-image) y guarda el resultado en el `file` indicado.

## Reglas comunes

- **Estilo compartido:** lee siempre `00-style-base.json` primero. Todos los
  prompts asumen ese estilo (chibi 3D Pixar, dark-fantasy, paleta teal/oro).
- **Consistencia:** adjunta las imágenes de referencia que indica cada item
  para conservar cara/estilo/escena.
- **Fondo transparente:** cuando el `file` va a `public/` para un componente
  (avatares, insignias, gemas, iconos), pide PNG con fondo transparente.

## Estado de los lotes

| Archivo | Qué genera | Items | Estado |
|---|---|---|---|
| `00-style-base.json` | Referencia de estilo (no genera nada) | — | — |
| `01-avatar-tiers.json` | Evolución del avatar héroe por nivel | 4 (tier 1-4) | ⏳ pendiente |
| `02-selectable-avatars.json` | Avatares seleccionables nuevos | 4 (×2 archivos c/u) | ⏳ pendiente |
| `03-achievement-badges.json` | Medallones de logros | 16 | ✅ hecho (public/achievements/) |
| `04-life-area-gems.json` | Gemas/tótems de áreas de vida | 6 | ✅ hecho (public/life-areas/) |
| `05-habit-catalog-illustrations.json` | Ilustración por hábito del catálogo | 20 | ✅ hecho (public/catalog/) |
| `06-scenes-marketing.json` | Escenas de apoyo y OG image | 3 | ⏳ pendiente |
| `07-focus-gems.json` | Etapas de crecimiento de gemas (Enfoque/Pomodoro) + gema rota + escena | 26 | ✅ hecho (public/gems/) — stage-4 copiada de life-areas |
| `08-focus-vault-scene.json` | Plataforma isométrica 5×5 de la Bóveda (escena vacía, sprites en runtime) | 1 | ✅ hecho (public/gems/vault-platform.jpg) — recalibrar anclas si se regenera |

`tier-0.png` (avatar) ya existe — es la base. El resto está por generar.

## Cómo marcar como hecho

Cuando ejecutes un lote, cambia su `status` en el JSON a `"done"` y en la tabla
de arriba, para que quede claro qué falta.
