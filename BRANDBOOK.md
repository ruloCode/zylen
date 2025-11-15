# Zylen Brandbook

## 📖 Visión de Marca

**Zylen** es una aplicación gamificada de seguimiento de hábitos que ayuda a los usuarios a construir mejores hábitos ganando XP y subiendo de nivel en áreas de vida. Combina elementos de RPG con un diseño moderno y cálido.

---

## 🎨 Paleta de Colores Principal

### Dorado Cálido (Gold) - Color Primario
**Uso:** Recompensas, XP, puntos, logros, elementos destacados

- **Gold 50** `#FFF8E1` - HSL(48, 100%, 94%)
- **Gold 100** `#FFF3CC` - HSL(48, 100%, 90%)
- **Gold 500** `#FFC857` - HSL(45, 100%, 68%) - **PRINCIPAL**
- **Gold 600** `#FFB74D` - HSL(36, 100%, 64%)
- **Gold 800** `#F4B400` - HSL(45, 100%, 48%)

**Gradiente dorado:**
```css
linear-gradient(135deg, #FFC857 0%, #FFB74D 50%, #FFA726 100%)
```

---

### Teal (Verde Azulado) - Color Secundario
**Uso:** Acciones primarias, progreso, botones interactivos

- **Teal 50** `#E0F7F5` - HSL(174, 75%, 94%)
- **Teal 100** `#B2EBE6` - HSL(174, 69%, 81%)
- **Teal 400** `#2AB7A9` - HSL(174, 62%, 44%) - **PRINCIPAL**
- **Teal 500** `#26A69A` - HSL(174, 55%, 41%)
- **Teal 600** `#00897B` - HSL(174, 100%, 27%)

**Gradiente teal:**
```css
linear-gradient(135deg, #26A69A 0%, #2AB7A9 50%, #4DD1C6 100%)
```

---

### Pergamino (Parchment) - Color de Fondo
**Uso:** Fondos de tarjetas, superficies elevadas, contenedores

- **Parchment 50** `#FFFDFB` - HSL(40, 100%, 99%)
- **Parchment 100** `#FBF5E8` - HSL(40, 67%, 95%)
- **Parchment 200** `#F7EEDB` - HSL(40, 59%, 91%) - **PRINCIPAL**
- **Parchment 300** `#F0E4C8` - HSL(40, 48%, 86%)

---

### Azul Marino (Navy) - Color Oscuro
**Uso:** Fondos oscuros, modo oscuro, texto en fondos claros

- **Navy 500** `#2D3E50` - HSL(210, 30%, 25%)
- **Navy 600** `#263849` - HSL(210, 28%, 21%)
- **Navy 700** `#1F2937` - HSL(210, 30%, 18%)

---

### Carbón (Charcoal) - Color Neutro Oscuro
**Uso:** Texto principal, elementos de contraste

- **Charcoal 500** `#1A1D1F` - HSL(210, 10%, 11%)
- **Charcoal 600** `#131517` - HSL(210, 12%, 7%)

---

## 🎯 Colores Semánticos

### Verde Jade - Éxito
**Uso:** Confirmaciones, hábitos completados, logros

- **Success** `#42B381` - HSL(156, 48%, 44%)

**Efecto glow:**
```css
box-shadow: 0 0 20px rgba(66, 179, 129, 0.4);
```

---

### Rosa Rojo - Peligro/Advertencia
**Uso:** Errores, eliminación, alertas

- **Danger** `#E87481` - HSL(350, 81%, 71%)

---

### Ámbar - Advertencia
**Uso:** Avisos, precauciones

- **Warning** `#FFC107` - HSL(45, 100%, 51%)

---

## 🌈 Gradientes de Marca

### Gradiente Hero (Fondo Principal)
```css
background: linear-gradient(180deg, #FFF8E1 0%, #E0F7F5 100%);
```

### Gradiente Dorado (Golden Hour)
```css
background: linear-gradient(135deg, #FFC857 0%, #FFB74D 50%, #FFA726 100%);
```

### Gradiente Cálido Teal
```css
background: linear-gradient(135deg, #26A69A 0%, #80DED6 100%);
```

### Gradiente Amanecer (Sunrise)
```css
background: linear-gradient(135deg, #FFA726 0%, #FFC857 50%, #E0F7F5 100%);
```

---

## ✨ Efectos Visuales

### Efecto Glass Card (Glassmorfismo)
```css
background: rgba(255, 253, 251, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(247, 238, 219, 0.3);
border-radius: 1rem;
```

### Glow Dorado (Para XP y Recompensas)
```css
box-shadow:
  0 0 20px rgba(255, 200, 87, 0.4),
  0 4px 12px rgba(255, 200, 87, 0.2);
```

### Glow Teal (Para Acciones)
```css
box-shadow:
  0 0 20px rgba(42, 183, 169, 0.4),
  0 4px 12px rgba(42, 183, 169, 0.2);
```

### Sombra Isométrica (Profundidad 3D)
```css
box-shadow:
  4px 4px 0 rgba(255, 200, 87, 0.3),
  8px 8px 0 rgba(255, 200, 87, 0.15);
```

---

## 🔤 Tipografía

### Fuentes Principales

**Familia de Fuentes para Cuerpo:**
```
'Nunito', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif
```

**Familia de Fuentes para Títulos:**
```
'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif
```

### Escala Tipográfica

- **Texto pequeño:** 0.875rem (14px)
- **Texto base:** 1rem (16px)
- **Texto grande:** 1.125rem (18px)
- **Título H3:** 1.5rem (24px)
- **Título H2:** 1.875rem (30px)
- **Título H1:** 2.25rem (36px)

### Pesos de Fuente

- **Normal:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700
- **Extrabold:** 800

---

## 📐 Espaciado y Bordes

### Radio de Bordes
- **Pequeño:** 0.5rem (8px)
- **Mediano:** 0.75rem (12px)
- **Grande:** 1rem (16px)
- **Extra Grande:** 1.5rem (24px)

### Espaciado
- **xs:** 0.25rem (4px)
- **sm:** 0.5rem (8px)
- **md:** 1rem (16px)
- **lg:** 1.5rem (24px)
- **xl:** 2rem (32px)
- **2xl:** 3rem (48px)

---

## 🎪 Uso de Colores por Contexto

### Dashboard y Navegación
- Fondo: Gradiente hero (`gold-50` → `teal-50`)
- Tarjetas: Parchment con efecto glass
- Iconos activos: Teal 500
- Iconos inactivos: Charcoal 500 con opacidad

### Puntos y XP
- Color principal: Gold 500
- Efecto glow: Dorado
- Barras de progreso: Gradiente dorado

### Hábitos y Rachas
- Hábito completado: Success con glow verde
- En progreso: Teal 400
- Pendiente: Steel/gris neutro

### Botones
- **Primario:** Teal 500 con hover a Teal 600
- **Secundario:** Gold 500 con hover a Gold 600
- **Peligro:** Danger con hover más oscuro

### Tienda (Shop)
- Fondo de items: Parchment 100
- Precio: Gold 500 con icono de moneda
- Botón comprar: Teal 500

---

## 🎨 Prompt para IA/Diseño

**Para usar con herramientas de IA (ej. ChatGPT, Claude, Midjourney):**

```
Estilo de marca para Zylen:
- Paleta: Dorado cálido (#FFC857), teal vibrante (#26A69A), pergamino suave (#F7EEDB)
- Estética: RPG moderno, gamificación, cálido pero profesional
- Efectos: Glassmorfismo, glows sutiles dorados y teal, sombras isométricas
- Tipografía: Nunito (cuerpo), Space Grotesk (títulos), peso semibold
- Mood: Aventura, progreso, logros, fantasía ligera, optimista
- Elementos visuales: Barras de XP, insignias, monedas, niveles, streaks
```

---

## 📱 Consideraciones de Accesibilidad

- Contraste mínimo texto/fondo: 4.5:1 para texto normal
- Contraste mínimo para elementos grandes: 3:1
- Evitar usar solo color para transmitir información
- Incluir iconos junto a colores semánticos
- Mantener texto legible sobre gradientes

---

## 🔗 Recursos Adicionales

- Archivo de diseño: `src/index.css`
- Tokens de diseño: `src/constants/design-tokens.ts`
- Configuración Tailwind: `tailwind.config.js`

---

**Versión:** 1.0
**Última actualización:** Noviembre 2025
**Proyecto:** Zylen - Gamified Habit Tracker
