# DOFUS Branding & Design System

> Guía completa del sistema de diseño de DOFUS extraída del sitio oficial (dofus.com)
> Actualizado: Noviembre 2025

---

## 📋 Índice

1. [Paleta de Colores](#paleta-de-colores)
2. [Tipografía](#tipografía)
3. [Espaciado y Layout](#espaciado-y-layout)
4. [Componentes UI](#componentes-ui)
5. [Efectos Visuales](#efectos-visuales)
6. [Iconografía y Assets](#iconografía-y-assets)
7. [Patrones de Diseño](#patrones-de-diseño)

---

## 🎨 Paleta de Colores

### Colores Principales

#### Fondos Oscuros (Dark Fantasy Theme)
```css
--bg-primary: rgb(11, 25, 29);        /* Fondo principal del body - Azul oscuro profundo */
--bg-secondary: rgb(23, 20, 18);      /* Fondos de secciones - Marrón oscuro */
--bg-secondary-transparent: rgba(23, 20, 18, 0.85); /* Fondo con transparencia */
--bg-tertiary: rgb(46, 42, 39);       /* Fondos de elementos */
--bg-dark: rgb(14, 12, 11);           /* Fondo más oscuro */
--bg-darker: rgb(22, 20, 19);         /* Variante oscura adicional */
--bg-card: rgb(71, 65, 61);           /* Fondos de tarjetas */
```

#### Colores de Acento y CTA (Call to Action)

##### Verde Ankama (Primary CTA)
```css
--green-primary: rgb(137, 184, 32);   /* Verde principal - Botones primarios */
--green-secondary: rgb(151, 168, 0);  /* Verde secundario - "JUGAR", "Descargar" */
```

##### Naranja/Dorado (Secondary CTA)
```css
--orange-primary: rgb(242, 156, 6);   /* Naranja/Dorado - Botones secundarios */
```

##### Rojo (Alert/Danger)
```css
--red-primary: rgb(217, 83, 79);      /* Rojo para alertas */
```

#### Colores de Texto

```css
--text-primary: rgb(255, 255, 255);   /* Texto principal - Blanco */
--text-secondary: rgb(222, 222, 222); /* Texto secundario */
--text-tertiary: rgb(131, 131, 131);  /* Texto terciario - Gris claro */
--text-dark: rgb(51, 51, 51);         /* Texto oscuro */
--text-body: rgb(51, 51, 51);         /* Color de texto del body */
--text-medium: rgb(111, 111, 111);    /* Gris medio */
--text-accent: rgb(91, 54, 14);       /* Marrón para acentos */
--text-warm: rgb(54, 39, 18);         /* Marrón cálido */
```

#### Colores Neutros

```css
--neutral-white: rgb(255, 255, 255);
--neutral-light: rgb(248, 248, 246);
--neutral-gray: rgb(128, 128, 128);
--neutral-dark-gray: rgb(111, 111, 111);
--neutral-black: rgb(0, 0, 0);
```

#### Overlays y Transparencias

```css
--overlay-dark: rgba(0, 0, 0, 0.85);
--overlay-medium: rgba(0, 0, 0, 0.8);
--overlay-light: rgba(0, 0, 0, 0.3);
```

### Uso de Colores por Contexto

#### Navegación y Header
- Fondo: Transparente con overlay oscuro `rgba(0, 0, 0, 0)`
- Altura: `92px`
- Padding: `12px`
- Posición: `fixed`

#### Botones

**Botón Primario (Verde - "Descargar", "Aceptar")**
```css
background-color: rgb(151, 168, 0);
color: rgb(255, 255, 255);
padding: 12px 34px;
font-size: 23px;
border-radius: 0px;  /* Sin bordes redondeados */
```

**Botón Secundario (Naranja - "Personalizar", "Rechazar")**
```css
background-color: rgb(242, 156, 6);
color: rgb(255, 255, 255);
padding: 12px 34px;
font-size: 23px;
border-radius: 0px;
```

**Botón Terciario/Ghost**
```css
background-color: rgba(0, 0, 0, 0.3);
color: rgba(0, 0, 0, 0);
padding: 1px 6px;
border-radius: 0px;
```

---

## ✍️ Tipografía

### Familias de Fuentes

```css
--font-primary: 'Roboto', sans-serif;           /* Fuente principal para texto */
--font-display: 'bebas_neueregular', sans-serif; /* Títulos y displays */
--font-accent: 'rowdies-regular';               /* Acentos especiales */
--font-lexend: 'lexend';                        /* Alternativa moderna */
--font-fallback: 'arial', sans-serif;           /* Fallback */
```

### Escala Tipográfica

#### Tamaño Base
```css
html {
  font-size: 10px;  /* Base de 10px para cálculos fáciles con rem */
}

body {
  font-family: 'Roboto', sans-serif;
  font-size: 16px;  /* 1.6rem */
  color: rgb(51, 51, 51);
}
```

#### Títulos (Headings)

**H1 - Títulos Principales**
```css
font-size: 48px;
font-weight: 400;
color: rgb(255, 255, 255);
text-transform: uppercase;
letter-spacing: normal;
line-height: 1.2;
font-family: 'bebas_neueregular', sans-serif;
```

**H2 - Subtítulos de Sección**
```css
font-size: 32px;
font-weight: 400;
color: rgb(255, 255, 255);
text-transform: uppercase;
font-family: 'bebas_neueregular', sans-serif;
```

**H3 - Títulos de Categoría**
```css
font-size: 16px;
font-weight: 700;
font-family: 'Roboto', sans-serif;
color: rgb(91, 54, 14);
line-height: 17.6px;
text-transform: none;
letter-spacing: normal;
```

#### Texto de Navegación y Enlaces

**Enlaces de Navegación Principal**
```css
font-size: 19px;
font-weight: 700;
color: rgb(255, 255, 255);
text-decoration: none;
text-transform: uppercase;
font-family: 'Roboto', sans-serif;
```

**Enlaces Footer**
```css
font-size: 19px;
font-weight: 400;
color: rgb(222, 222, 222);
text-transform: uppercase;
text-decoration: none;
```

#### Botones

**Botones CTA Grandes**
```css
font-size: 23px;
font-weight: 400;
font-family: 'Roboto', sans-serif;
text-transform: uppercase;
```

---

## 📐 Espaciado y Layout

### Sistema de Espaciado

Basado en múltiplos de 4px (sistema de 4-point grid):

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;   /* Usado en padding de header */
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-9: 34px;   /* Usado en padding de botones */
--space-12: 48px;
--space-16: 64px;
```

### Contenedores y Breakpoints

```css
/* Container principal */
.container {
  max-width: 1200px;
  padding: 0;
  margin: 0 auto;
}

/* Body */
body {
  margin: 0;
  padding: 0;
}
```

### Layout de Grid (Clases)

El grid de clases usa un sistema flexible que se adapta al contenido:
- Display: Grid o Flexbox según la sección
- Gap: Variable según el contexto
- Columnas: Adaptativas según viewport

---

## 🧩 Componentes UI

### Header/Navegación

```css
header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 92px;
  padding: 12px;
  background-color: transparent; /* Con overlay en scroll */
  z-index: 1000;
}
```

### Tarjetas de Clase (Class Cards)

**Características principales:**
- Imágenes: JPG optimizadas (ejemplo: `avatar/1.jpg`)
- Hover states: Efectos sutiles de transición
- Sin border-radius aparente en las imágenes de clase
- Layout: Grid responsivo

### Botones

**Estados y Variantes:**

1. **Primary (Verde)**
   ```css
   .btn-primary {
     background: rgb(151, 168, 0);
     color: white;
     padding: 12px 34px;
     border: none;
     border-radius: 0;
     font-size: 23px;
     text-transform: uppercase;
     transition: all 0.2s ease-in-out;
   }
   ```

2. **Secondary (Naranja)**
   ```css
   .btn-secondary {
     background: rgb(242, 156, 6);
     color: white;
     padding: 12px 34px;
     border: none;
     border-radius: 0;
     font-size: 23px;
     text-transform: uppercase;
     transition: all 0.2s ease-in-out;
   }
   ```

### Filtros y Categorías

**Estructura:**
- Iconos circulares con imágenes PNG
- Texto debajo del icono
- Layout horizontal con scroll
- Sin fondo visible en estado normal
- Probablemente estado activo con fondo

---

## ✨ Efectos Visuales

### Sombras (Shadows)

**Box Shadows**
```css
--shadow-subtle: rgba(0, 0, 0, 0.5) 0px 0px 3px 0px;
--shadow-medium: rgb(0, 0, 0) 0px 0px 4px 0px;
--shadow-strong: rgb(0, 0, 0) 0px 0px 5px 0px;
```

**Text Shadows**
```css
--text-shadow-light: rgb(51, 51, 51) 0px 1px 1px;
--text-shadow-dark: rgb(0, 0, 0) 0px 1px 1px;
```

### Border Radius

```css
--radius-none: 0px;      /* Botones, la mayoría de elementos */
--radius-small: 4px;
--radius-medium: 5px;
--radius-large: 6px;
--radius-xl: 10px;
--radius-circle: 50%;    /* Iconos circulares */
--radius-top: 6px 6px 0px 0px;
--radius-bottom: 0px 0px 4px 4px;
--radius-left: 6px 0px 0px 6px;
```

**Nota importante:** DOFUS favorece bordes cuadrados (0px) para botones y elementos principales, creando una estética más geométrica y de videojuego.

### Transiciones

```css
/* Transiciones principales */
--transition-fast: all 0.2s ease-in-out;
--transition-medium: all 0.25s ease-in-out;
--transition-delayed: all 0.2s ease-in-out 0.2s;

/* Transiciones específicas */
--transition-opacity: opacity 0.2s ease-in-out;
--transition-height: max-height 0.25s ease-in-out;
```

### Animaciones

- No se detectaron animaciones complejas en el análisis
- Énfasis en transiciones sutiles y suaves
- Hover states con cambios de opacidad y color

---

## 🖼️ Iconografía y Assets

### Sistema de Iconos

**Formato:** SVG (escalables, optimizados)

**Ubicación:** `https://static.ankama.com/g/modules/`

**Ejemplos de iconos:**
- Logo Ankama: `ankama/logo/logo-inline-white.svg`
- Flechas dropdown: `masterpage/block/header/assets-v3/svg/arrow-down.svg`
- Iconos externos: `masterpage/block/header/assets-v3/svg/external.svg`
- Logo DOFUS: `ankama/logo/dofus/logo.webp`
- Iconos de idioma: `svg/lang.svg`
- Iconos de cuenta: `svg/account.svg`

**Tamaños comunes:**
- Iconos pequeños: 10x10px, 12x7px
- Iconos medios: 20x12px, 25x34px
- Iconos grandes: 29x34px, 36x34px
- Logo Ankama: 167x56px
- Logo DOFUS: 100x91px

### Imágenes de Clases

**Formato:** JPG optimizado
**Ubicación:** `https://static.ankama.com/dofus/ng/modules/mmorpg/encyclopedia/unity/breeds/assets/avatar/{id}.jpg`

**Filtros de categoría:**
**Formato:** PNG con transparencia
**Ubicación:** `https://static.ankama.com/dofus/ng/modules/mmorpg/encyclopedia/unity/breeds/assets/filters/{id}.png`

**IDs de filtros:**
- 0: TODO
- 1: CURAS
- 2: DAÑOS
- 3: MEJORA
- 4: INVOCACIÓN
- 5: TRABA
- 6: POSICIONAMIENTO
- 7: PROTECCIÓN
- 8: TANQUE

---

## 🎯 Patrones de Diseño

### Principios de Diseño DOFUS

1. **Dark Fantasy Aesthetic**
   - Fondos oscuros predominantes
   - Acentos con colores vibrantes (verde, naranja)
   - Tipografía en mayúsculas para títulos

2. **Geometría Definida**
   - Bordes cuadrados (border-radius: 0) en elementos principales
   - Líneas limpias y definidas
   - Sombras sutiles pero presentes

3. **Jerarquía Visual Clara**
   - Tamaños de fuente muy diferenciados
   - Contraste alto entre fondos y textos
   - CTAs destacados con colores brillantes

4. **Minimalismo Funcional**
   - Sin gradientes complejos
   - Efectos visuales sutiles
   - Transiciones rápidas (0.2s)

### Jerarquía de Colores por Importancia

**Nivel 1 - Acción Primaria:**
- Verde `rgb(151, 168, 0)` - Descargar, Jugar, Aceptar

**Nivel 2 - Acción Secundaria:**
- Naranja `rgb(242, 156, 6)` - Personalizar, Opciones

**Nivel 3 - Información:**
- Blanco `rgb(255, 255, 255)` - Texto principal
- Gris claro `rgb(222, 222, 222)` - Texto secundario

**Nivel 4 - Contexto:**
- Marrón `rgb(91, 54, 14)` - Acentos especiales
- Gris medio `rgb(131, 131, 131)` - Texto terciario

### Layout Patterns

#### Header Fijo
```
[Logo Ankama] [Logo DOFUS] [Nav Items] [Language] [Account] [CTA: JUGAR]
```

#### Estructura de Página
```
Header (Fixed)
  ↓
Hero/Title Section
  ↓
Filters/Categories (Horizontal Scroll)
  ↓
Content Grid (Clases/Items)
  ↓
Footer (Múltiples columnas)
```

#### Footer Estructura
```
[Columna 1: El Juego]  [Columna 2: Información]  [Columna 3: Mi Cuenta]  [Columna 4: Soporte]
```

---

## 💡 Recomendaciones de Implementación

### Para Zylen

Si quieres aplicar el estilo DOFUS a Zylen, considera:

1. **Paleta de Colores:**
   - Adoptar el verde `rgb(151, 168, 0)` para acciones de logro/XP
   - Usar fondos oscuros `rgb(11, 25, 29)` para el theme principal
   - Mantener el naranja `rgb(242, 156, 6)` para acciones de indulgencias

2. **Tipografía:**
   - Usar fuentes display (como Bebas Neue) para títulos en mayúsculas
   - Roboto para cuerpo de texto
   - Tamaños grandes para CTAs (23px+)

3. **Componentes:**
   - Botones cuadrados (border-radius: 0)
   - Sombras sutiles en tarjetas
   - Transiciones rápidas (0.2s)

4. **Layout:**
   - Header fijo con altura definida (92px)
   - Grids responsivos para contenido
   - Espaciado consistente basado en 4px

5. **Efectos:**
   - Evitar gradientes complejos
   - Usar overlays oscuros con transparencia
   - Text shadows para legibilidad sobre fondos oscuros

---

## 📚 Referencias

- **Sitio analizado:** https://www.dofus.com/es/mmorpg/enciclopedia/clases
- **CDN de Assets:** https://static.ankama.com/
- **Fecha de análisis:** Noviembre 2025
- **Navegador:** Chrome DevTools MCP

---

## 🔗 Assets Clave

### CDN Structure
```
static.ankama.com/
├── g/modules/
│   ├── ankama/logo/
│   │   ├── logo-inline-white.svg
│   │   ├── dofus/logo.webp
│   │   ├── dofus-retro/icon.svg
│   │   ├── dofus-touch/icon.svg
│   │   ├── wakfu/icon.svg
│   │   └── waven/icon.svg
│   └── masterpage/block/header/assets-v3/svg/
│       ├── arrow-down.svg
│       ├── external.svg
│       ├── lang.svg
│       └── account.svg
└── dofus/ng/modules/mmorpg/encyclopedia/unity/breeds/assets/
    ├── avatar/
    │   └── {1-20}.jpg
    └── filters/
        └── {0-8}.png
```

---

**Fin del documento de Branding DOFUS**

_Este documento fue generado mediante análisis automatizado del sitio oficial de DOFUS usando Chrome DevTools. Todos los valores son aproximados y extraídos directamente del código de producción._
