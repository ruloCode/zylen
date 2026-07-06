# Zylen Mobile (React Native / Expo)

Port nativo de la app web Zylen/Everlight (../src) para publicar en App Store
y Google Play. Paridad funcional 1:1: mismos servicios Supabase, mismo store
Zustand, mismos 6 temas, i18n es/en, y la Arena (juego co-op de Higgsfield)
embebida en WebView con el mismo puente postMessage.

## Stack

- **Expo SDK 57** (React Native 0.86, React 19) + **expo-router** (tabs + stack)
- **NativeWind v4** — las mismas clases Tailwind y tokens de tema de la web
  (6 temas runtime vía `vars()`, ver `src/theme/`)
- **Supabase** — mismo proyecto/esquema; sesión en AsyncStorage, OAuth PKCE
  con deep link `zylen://auth/callback`
- **Zustand** — slices copiados de la web (15 slices)
- **i18next** — traducciones empaquetadas (`src/i18n/locales`), español por defecto

## Desarrollo

```bash
cd mobile
pnpm install
pnpm start          # Expo Dev Server (usa Expo Go o dev client)
pnpm typecheck      # tsc --noEmit
```

Variables de entorno en `mobile/.env` (prefijo `EXPO_PUBLIC_`, espejo del
`.env.local` de la web). **No lo comitees.**

## Builds

### APK local (Android)

Requiere JDK 17 y Android SDK (`ANDROID_HOME`).

```bash
npx expo prebuild --platform android   # genera android/ desde app.json
cd android && ./gradlew assembleRelease
# APK en android/app/build/outputs/apk/release/app-release.apk
```

### Tiendas (EAS)

```bash
npm i -g eas-cli && eas login
eas build --platform android --profile production   # .aab para Play Store
eas build --platform ios --profile production        # .ipa para App Store
eas submit -p android / -p ios
```

Identificadores: `com.rulocode.zylen` (iOS y Android), scheme `zylen`.

### Checklist antes de publicar

1. **Iconos/splash**: ya usan el logo de Zylen, pero upscaled desde el
   512px de la web (`icon.png` debería ser un 1024×1024 nativo) y el
   background/monochrome del adaptive icon siguen siendo del template.
2. **Supabase Auth**: añade `zylen://auth/callback` (y la URL `exp://…` del
   dev client si pruebas OAuth en desarrollo) en Dashboard → Auth → URL
   Configuration → Redirect URLs.
3. **OpenAI key**: `EXPO_PUBLIC_OPENAI_API_KEY` queda embebida en el bundle
   (igual que en la web con VITE_). Para producción, proxy vía Edge Function.
4. **Privacidad**: Play Console exige Data Safety form; App Store exige
   Privacy Nutrition Labels (cuenta, hábitos, estado de ánimo → datos de salud).

## Decisiones de porteo

- **Arena**: WebView a `GAME_CONFIG.url` con los mismos parámetros que la web.
  El juego postea con `window.top.postMessage(payload, ?origin=)`; dentro del
  WebView el juego ES el top frame, así que se pasa su propio origin y un
  script inyectado reenvía los eventos (`victory`/`armory`) por el bridge de
  react-native-webview (ver `src/screens/Arena.tsx`).
- **Hero del Home**: en la web es PNG + video idle-loop/3D opcional (mejora
  progresiva; hoy no se distribuye ningún GLB). En native renderiza el PNG
  del avatar con la misma API de componente (`src/components/hero/`).
- **localStorage** → espejo síncrono de AsyncStorage (`src/lib/kvStorage.ts`),
  hidratado al arranque antes de montar la app.
- **Temas**: mismas variables HSL de `../src/index.css` aplicadas por
  `ThemeProvider` (NativeWind `vars()`); `tailwind.config.js` replica el de la web.
- **Notificaciones de recordatorio**: expo-notifications (local, al abrir /
  volver a primer plano), mismo servicio que la web.
- **Convenciones de porteo**: ver `PORTING.md`.

## Estructura

```
mobile/
├── app/               # rutas expo-router (thin re-exports de src/screens)
│   ├── (tabs)/        # Home, Rutinas, Ranking, Progreso, Perfil + tab bar HUD
│   └── …              # arena, focus, chat, shop, social, mood, realms,
│                      # root-habit, onboarding, welcome, login, auth/callback
├── src/
│   ├── screens/       # pantallas (equivalente de ../src/pages)
│   ├── components/    # ui/, atoms/, layout/, hero/, effects/, branding/
│   ├── features/      # módulos por dominio (igual que la web)
│   ├── store/         # Zustand (copiado de la web)
│   ├── services/      # Supabase + servicios (copiados/adaptados)
│   ├── theme/         # themeVars + ThemeProvider (6 temas)
│   ├── i18n/locales/  # es/en empaquetados
│   ├── lib/           # kvStorage, supabase, env, toast
│   └── assets/        # registry.ts (mapa require() de imágenes de public/)
└── assets/images/     # imágenes copiadas de ../public
```

## Notas de build (aprendidas a golpes)

- `mobile/.npmrc` fija `node-linker=hoisted`: el bundler que lanza Gradle no
  resuelve deps transitivas con el node_modules aislado de pnpm. No lo quites.
- Si cambias el layout de node_modules: `npx expo prebuild --platform android --clean`.
- Gradle necesita memoria: `org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g`
  (ya en `~/.gradle/gradle.properties`).
- NUNCA crees `mobile/src/app/` — expo-router lo tomaría como raíz de rutas en
  lugar de `mobile/app/` (los providers viven en `src/providers/`).
- APK local: `dist/zylen-1.0.0.apk` (universal, firma debug — instalable con
  `adb install`, pero para Play Store usa `eas build` que genera el .aab firmado).
