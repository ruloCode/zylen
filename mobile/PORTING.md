# Zylen — Guía de porteo Web → React Native (Expo SDK 57)

Contrato de convenciones para portar páginas de `../src` (web, React 18 + Vite +
Tailwind) a `./src` (Expo + NativeWind v4). **Léelo entero antes de portar una
pantalla.** El objetivo es paridad funcional 1:1 con la web.

## Estructura

- `app/` — rutas expo-router. **Ya generadas**, cada una re-exporta desde
  `@/screens/<Nombre>`. NO tocar `app/` salvo indicación.
- `src/screens/<Nombre>.tsx` — LA pantalla a escribir (equivalente de
  `../src/pages/<Nombre>.tsx`). Exporta `export function <Nombre>()`.
- `src/features/<dominio>/…` — componentes de feature (misma estructura que web).
- `src/components/…` — UI compartida (ui/, atoms/, layout/, branding/, effects/).
- `src/store`, `src/services`, `src/types`, `src/constants`, `src/utils`,
  `src/hooks` — **ya copiados y parcheados**; impórtalos igual que en web
  (`@/store`, `@/constants`, …). No los dupliques.

## Reglas de traducción JSX

| Web | Native |
|---|---|
| `div`, `section`, `header`, `nav`, `main` | `View` (o `ScrollView` si scrollea) |
| `p`, `span`, `h1..h6`, `label`, texto suelto | `Text` (SIEMPRE; texto fuera de `<Text>` crashea) |
| `button` | `Pressable` (contenido de texto dentro de `<Text>`) |
| `img` | `Image` de `expo-image` |
| `input` | `TextInput` (`onChangeText`, `value`, `placeholderTextColor`) |
| `textarea` | `TextInput multiline` |
| `select` | selector propio (Modal + opciones) o el `Select` de `@/components/atoms` |
| `a` / `navigate(...)` | `useRouter()` de expo-router |
| `onClick` | `onPress` |
| `window.confirm(...)` | `Alert.alert(título, msg, [botones])` |
| CSS `linear-gradient`/`radial-gradient` | `LinearGradient` de `expo-linear-gradient` |
| `svg` inline | `react-native-svg` |
| `iframe` | `WebView` de `react-native-webview` |

## Estilos (NativeWind v4)

- `className` funciona con las MISMAS clases Tailwind del web: colores del tema
  (`bg-background`, `text-foreground`, `text-teal-400`, `bg-charcoal-800`,
  `text-gold-400`, `border-border`, …) resuelven vía variables aplicadas por
  `ThemeProvider`. Copia las clases tal cual siempre que existan en RN.
- **No existen en native**: `backdrop-blur`, `box-shadow` complejos, `hover:`,
  `animate-*` de keyframes CSS, `clip-path`, `fixed` (usa `absolute`),
  `env(safe-area-inset-*)` (usa `useSafeAreaInsets()`), `grid` (usa
  `flex-row flex-wrap`), `space-y-*`/`space-x-*` (usa `gap-*`), `truncate`
  (usa `numberOfLines={1}` en Text).
- Receta `glass-card` (web: blur + borde translúcido): usa el componente
  `GlassCard` de `@/components/ui` o `className="rounded-2xl border border-white/10 bg-glass"`
  — donde `bg-glass` ≈ `bg-[hsl(var(--glass-bg)/0.65)]`.
- Sombras/glow: usa `shadowColor/shadowOpacity/shadowRadius/elevation` en
  `style` cuando el glow sea parte de la identidad (FAB, CTA); si es sutil,
  omítelo.
- Headers: la web usa Bebas Neue en mayúsculas → `className="font-display uppercase"`.
  El cuerpo usa la fuente del sistema (no cargar Roboto).
- Animaciones: usa `Animated` de react-native o `react-native-reanimated` para
  las que aporten (XP float, pulse). Las decorativas pueden omitirse.

## Plataforma

- **Storage**: NUNCA `localStorage`. Usa `kv` de `@/lib/kvStorage` (API sync:
  `kv.getItem/setItem/removeItem`) o `StorageService` de `@/services/storage`.
- **Env**: NUNCA `import.meta.env`. Usa `ENV` de `@/lib/env`.
- **Toasts**: `import toast from '@/lib/toast'` — misma API que react-hot-toast
  (`toast.success/error/info`, `toast(msg)`). El host ya está montado.
- **Navegación**: `const router = useRouter()` + `router.push(ROUTES.SHOP)` /
  `router.replace(...)` / `router.back()`. Los valores de `ROUTES`
  (`@/constants`) coinciden 1:1 con las rutas de expo-router.
- **Imágenes de public/**: la web referencia `/gems/x.png`, `/avatars/y.png`…
  → `import { img } from '@/assets/registry'` y
  `<Image source={img('/gems/x.png')} />`. Rutas remotas (http) van como
  `{ uri }`. Los vídeos de avatar (`.mov/.webm`) NO se portan: usa el PNG
  estático (en `getHeroVideoSources` devuelve `undefined`).
- **Iconos**: `lucide-react-native` (mismos nombres que `lucide-react`).
  Prop `color` en vez de `className` de color; `size` numérico.
- **Safe areas**: `useSafeAreaInsets()`. Las pantallas de tab dejan espacio
  inferior para la barra: `contentContainerStyle={{ paddingBottom: 120 }}`.
- **i18n**: `useLocale()` idéntico a la web (`t`, `changeLanguage`, …).
- **Markdown (chat)**: `react-native-markdown-display` en lugar de
  react-markdown (sin highlight.js).
- **Document/window**: no existen. `document.visibilitychange` →
  `AppState.addEventListener('change', ...)`.

## Verificación

Tras portar, `pnpm typecheck` (en `mobile/`) debe pasar sin errores nuevos en
tus archivos. Mantén los textos EXACTOS de i18n (`t('...')`) — no inventes keys.
Si la pantalla web usa un componente de feature aún no portado, pórtalo también
(en su misma ruta bajo `src/features/...`).
