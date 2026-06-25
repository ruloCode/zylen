# Zylen — Prompts del Avatar de Identidad (5 tiers)

Sistema de "héroe que evoluciona": el mismo personaje (la cara del usuario) va
mejorando su equipo a medida que sube de nivel — de aventurero humilde (tier 0)
a héroe legendario (tier 4). El cambio visual refuerza el cambio de identidad real.

---

## Cómo generarlas en la web

- **Modelo recomendado:** `gpt-image-1` (ChatGPT / OpenAI "crear imagen") en **modo edición**,
  o **Nano Banana Pro** en Higgsfield (image-to-image). Evita **Soul 2.0**: clona la
  referencia e ignora el atuendo/escena nuevos.
- **Adjunta SIEMPRE la imagen de referencia** para conservar la cara:
  `public/avatars/avatar-explorer-3.png`.
- **Mantén FIJO entre los 5 tiers:** estilo de render, cara/identidad, escena de selva,
  encuadre/pose, paleta. **Cambia SOLO** el `tier`, el `outfit` (equipo) y el `aura`.
- **Formato:** vertical `9:16` (o `1024x1536`).
- **Fondo:** la escena de selva queda bien para el Dashboard. Para los recortes con
  **fondo transparente** (que necesita el componente del avatar), genera la escena y luego
  pide aparte: *"remove the background, keep only the character, transparent PNG"*.
- **Nombres de archivo final:** `tier-0.png … tier-4.png` en `public/avatars/tiers/`.
- **Consistencia:** si el modelo lo permite, fija la misma `seed` en los 5; o usa la imagen
  del tier anterior como referencia adicional al generar el siguiente.

### Escalado de equipo por tier (resumen)

| Tier | Nombre | Equipo añadido sobre la base | Aura |
|------|--------|------------------------------|------|
| 0 | Iniciado | atuendo base + bastón de madera simple | ninguna |
| 1 | Aprendiz | hombrera y muñequeras de cuero, hebilla de bronce, bastón tallado | tenue ámbar |
| 2 | Adepto | peto ligero teal, capa corta, colgante de cristal más brillante | teal suave |
| 3 | Veterano | armadura de placas grabada (bronce/esmeralda), capa fluida, runas brillantes | teal-dorada fuerte |
| 4 | Legendario | armadura legendaria esmeralda/oro con costuras de energía, fragmentos rúnicos flotantes | azul-eléctrica + teal intensa |

---

## Style lock (común a TODOS los tiers)

```json
{
  "identity_lock": {
    "source": "attached reference photo (public/avatars/avatar-explorer-3.png)",
    "preserve": [
      "face shape and proportions",
      "dark skin tone",
      "short curly black hair style/length/color",
      "short groomed beard shape",
      "eyebrow shape and thickness",
      "eye shape and color",
      "round blue-tinted glasses (frame style and color)",
      "warm friendly approachable expression",
      "any distinguishing features (moles, dimples)"
    ],
    "note": "The final face MUST clearly resemble the person in the photo, just cuter and stylized. IGNORE the clothing in the reference photo."
  },
  "style": {
    "type": "3D Pixar-style chibi mascot",
    "proportions": "big head, small body, short limbs (NOT realistic adult proportions)",
    "rendering": "octane render, smooth subsurface skin shading, soft studio lighting, high detail, polished premium mobile-game character",
    "finish": "clean, glossy, premium app mascot look"
  },
  "scene_FIXED": {
    "environment": "misty magical jungle clearing",
    "elements": [
      "soft cascading waterfall in the background",
      "lush tropical ferns and hanging vines",
      "faceted low-poly grey rocks",
      "a warm glowing lantern resting on a rock to the side",
      "a floating glowing teal rune symbol etched on stone",
      "small glowing fireflies / light particles floating in the air"
    ],
    "lighting": "teal and gold cinematic lighting, warm volumetric god-rays breaking through the canopy, gentle rim light on the character",
    "depth": "atmospheric depth-of-field, softly blurred background"
  },
  "color_palette": {
    "primary": "teal / emerald greens",
    "accent": "warm gold and amber",
    "highlights": "glowing electric blue (crystal + rune)"
  },
  "composition": {
    "aspect_ratio": "9:16",
    "subject_position": "centered, occupying most of the frame",
    "background_role": "immersive but secondary to the character"
  },
  "negative": [
    "no UI elements",
    "no text or labels",
    "no buttons or app interface",
    "no watermark or logo",
    "no extra people",
    "do not change the person's core facial identity",
    "no realistic human proportions (must stay chibi)"
  ]
}
```

---

## Tier 0 — Iniciado (PRIMER PROMPT)

```json
{
  "task": "Transform the person in the attached reference photo into a stylized 3D Pixar-style chibi mascot. Preserve their real facial identity, but IGNORE their clothing and dress them in the FIXED outfit below. This is TIER 0 of a hero's evolution: a humble beginner adventurer.",
  "tier": { "index": 0, "name": "Iniciado", "vibe": "humble, hopeful, just starting the journey" },
  "identity_lock": {
    "source": "attached reference photo",
    "preserve": ["face shape and proportions", "dark skin tone", "short curly black hair", "short groomed beard", "eyebrow shape", "eye color", "round blue-tinted glasses", "warm friendly expression"],
    "note": "Face MUST clearly resemble the person, just cuter and stylized."
  },
  "style": {
    "type": "3D Pixar-style chibi mascot",
    "proportions": "big head, small body, short limbs",
    "rendering": "octane render, smooth subsurface skin shading, soft studio lighting, high detail, polished mobile-game character quality",
    "finish": "clean, glossy, premium app mascot look"
  },
  "pose": {
    "body": "standing confidently with arms crossed on a faceted low-poly grey stone rock",
    "expression": "friendly subtle smile, warm and approachable",
    "framing": "full body visible, character centered, vertical 9:16 portrait"
  },
  "outfit_FIXED": {
    "top": "clean fitted white t-shirt",
    "necklace": "blue crystal pendant with a faint inner light, on a thin black cord",
    "wrists": "layered black and dark-blue beaded bracelets plus a black digital watch",
    "waist": "tribal patterned fabric sash tied at the front, with hanging wooden beads and small feather charms, plus a small brown leather belt pouch",
    "bottom": "distressed dark-red and navy explorer shorts with frayed edges",
    "footwear": "blue fabric-strapped gladiator sandals",
    "gear": "a simple plain WOODEN walking staff",
    "theme": "humble novice adventurer / habit-quest hero"
  },
  "aura": "none (no magical glow yet — keep it grounded and humble)",
  "scene_FIXED": {
    "environment": "misty magical jungle clearing",
    "elements": ["soft cascading waterfall in the background", "lush tropical ferns and hanging vines", "faceted low-poly grey rocks", "a warm glowing lantern resting on a rock to the side", "a floating glowing teal rune symbol etched on stone", "small glowing fireflies / light particles floating in the air"],
    "lighting": "teal and gold cinematic lighting, warm volumetric god-rays breaking through the canopy, gentle rim light on the character",
    "depth": "atmospheric depth-of-field, softly blurred background"
  },
  "color_palette": { "primary": "teal / emerald greens", "accent": "warm gold and amber", "highlights": "glowing electric blue (crystal + rune)" },
  "composition": { "aspect_ratio": "9:16", "subject_position": "centered, occupying most of the frame", "background_role": "immersive but secondary to the character" },
  "negative": ["no UI elements", "no text or labels", "no buttons or app interface", "no watermark or logo", "no extra people", "do not change the person's core facial identity", "no realistic human proportions (must stay chibi)", "no armor yet (this is the humble starting tier)"]
}
```

---

## Tier 1 — Aprendiz

```json
{
  "task": "Same chibi character and same jungle scene as Tier 0. This is TIER 1: the adventurer has earned their first real gear. Keep the face/identity, scene, pose and palette IDENTICAL to Tier 0; only upgrade the equipment and add a faint aura.",
  "tier": { "index": 1, "name": "Aprendiz", "vibe": "growing, gaining confidence" },
  "outfit_FIXED": {
    "base": "same white t-shirt, sash with wooden beads/feathers, explorer shorts, gladiator sandals as Tier 0",
    "added_gear": "a worn brown leather shoulder pad (pauldron) on one shoulder, leather bracers on the forearms, a bronze buckle on the sash, a sturdier hand-carved wooden staff with a small bronze cap",
    "necklace": "blue crystal pendant glowing a little brighter"
  },
  "aura": "faint warm amber glow at the feet/base only",
  "pose": "standing with arms crossed on a faceted low-poly grey rock, full body, centered, 9:16",
  "keep_identical": ["face/identity from reference", "misty magical jungle scene", "teal-gold lighting", "chibi proportions", "palette"],
  "negative": ["no text", "no UI", "no watermark", "no extra people", "do not change facial identity", "keep chibi proportions"]
}
```

---

## Tier 2 — Adepto

```json
{
  "task": "Same chibi character and same jungle scene. TIER 2: the hero now wears light armor and a cape. Keep face/identity, scene, pose, palette identical; upgrade gear and strengthen the magical glow.",
  "tier": { "index": 2, "name": "Adepto", "vibe": "capable, attuned to magic" },
  "outfit_FIXED": {
    "base": "the Tier 1 outfit underneath",
    "added_gear": "a light teal-green leather-and-cloth chest piece over the t-shirt, a short traveler's cape with a simple emerald clasp, reinforced bracers, a wooden staff topped with a small glowing blue crystal",
    "necklace": "blue crystal pendant clearly glowing with inner light"
  },
  "aura": "soft teal aura around the character, a few floating teal rune motes near the staff",
  "pose": "arms crossed on a faceted low-poly grey rock, full body, centered, 9:16",
  "keep_identical": ["face/identity from reference", "misty magical jungle scene", "teal-gold lighting", "chibi proportions", "palette"],
  "negative": ["no text", "no UI", "no watermark", "no extra people", "do not change facial identity", "keep chibi proportions"]
}
```

---

## Tier 3 — Veterano

```json
{
  "task": "Same chibi character and same jungle scene. TIER 3: a seasoned hero in engraved plate armor. Keep face/identity, scene, pose, palette identical; upgrade to ornate armor and a stronger aura.",
  "tier": { "index": 3, "name": "Veterano", "vibe": "battle-tested, radiant discipline" },
  "outfit_FIXED": {
    "added_gear": "ornate engraved plate armor in bronze and emerald tones (chest plate and shoulder guards), a flowing patterned cloak, glowing engraved runes along the armor edges, a polished staff with a bright crystal head",
    "necklace": "crystal pendant integrated into the armor, glowing strongly"
  },
  "aura": "strong teal-and-gold aura, denser glowing fireflies around the character, slightly stronger god-rays",
  "pose": "arms crossed on a faceted low-poly grey rock, full body, centered, 9:16, heroic stance",
  "keep_identical": ["face/identity from reference", "misty magical jungle scene", "chibi proportions", "palette"],
  "negative": ["no text", "no UI", "no watermark", "no extra people", "do not change facial identity", "keep chibi proportions"]
}
```

---

## Tier 4 — Legendario

```json
{
  "task": "Same chibi character and same jungle scene. TIER 4 (final): a legendary hero. Keep face/identity, scene, pose IDENTICAL; render full legendary armor and an epic aura. This is the aspirational end-state of the evolution.",
  "tier": { "index": 4, "name": "Legendario", "vibe": "epic, awe-inspiring, master of their identity" },
  "outfit_FIXED": {
    "added_gear": "full legendary armor with emerald-and-gold filigree and glowing energy seams, a majestic flowing cloak, an ornate staff crowned with a radiant electric-blue crystal, small floating runic shards orbiting the character",
    "necklace": "the blue crystal now radiates intense light, woven into the chestplate"
  },
  "aura": "intense electric-blue and teal aura, radiant volumetric god-rays at their peak, swirling magical light particles, a subtle halo of light behind the head",
  "pose": "arms crossed on a faceted low-poly glowing rune-rock, full body, centered, 9:16, triumphant heroic stance",
  "keep_identical": ["face/identity from reference", "misty magical jungle scene", "chibi proportions"],
  "negative": ["no text", "no UI", "no watermark", "no extra people", "do not change facial identity", "keep chibi proportions", "keep it tasteful — epic but not cluttered"]
}
```
