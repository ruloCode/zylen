# Zylen — Guía de primera publicación en Google Play

Estado: cuenta de desarrollador verificada ✅ · AAB firmado con `credentials/zylen-upload.jks` ✅ · Arena oculta por feature flag ✅

## 0. Archivos que vas a necesitar (ya generados)

| Archivo | Uso |
|---|---|
| `android/app/build/outputs/bundle/release/app-release.aab` | El bundle que se sube a Play (firmado con tu upload key) |
| `android/app/build/outputs/apk/release/app-release.apk` | APK de prueba para instalar en tu teléfono antes de subir |
| `store/play-icon-512.png` | Icono de la ficha (512×512, sin alpha) |
| `store/feature-graphic-1024x500.png` | Gráfico destacado de la ficha |
| Capturas de pantalla | **Pendiente**: tómalas tú desde el APK (ver §3) |

Regenerar builds: `./scripts/build-release.sh aab` (tienda) o `apk` (prueba).
⚠️ Si corres `expo prebuild --clean`, el script te avisará: hay que re-aplicar el bloque
`signingConfigs.release` en `android/app/build.gradle` (el prebuild lo borra).
⚠️ Cada subida nueva a Play necesita `versionCode` mayor: súbelo en `app.json`
(`android.versionCode`) y corre prebuild antes de compilar.

## 1. Crear la app en Play Console

1. [play.google.com/console](https://play.google.com/console) → **Crear app**.
2. Nombre: `Zylen`, idioma predeterminado: **Español (España o Latinoamérica, tu público)**, tipo **Aplicación**, **Gratis**.
3. Acepta las declaraciones de políticas.

## 2. Configuración inicial obligatoria (panel "Configura tu app")

Play no deja publicar hasta completar TODO esto:

1. **Política de privacidad** — obligatoria porque la app tiene cuentas y recoge datos.
   Publica una página (p. ej. `https://zylen-beta.vercel.app/privacy`) que diga:
   qué datos se recogen (email, nombre, avatar, progreso de hábitos), dónde se guardan
   (Supabase), que no se venden a terceros, y cómo pedir el borrado (email de contacto).
2. **Acceso a la app** — la app requiere login: crea unas **credenciales de prueba**
   para el equipo de revisión de Google (usa un usuario de prueba, NUNCA el tuyo).
   Ya existe el usuario QA `qa.claude@zylen.test` — dale esa cuenta o crea una nueva.
3. **Anuncios** — declara **No contiene anuncios**.
4. **Clasificación de contenido** — cuestionario: categoría "Utilidad/Productividad",
   sin violencia real, sin apuestas, **sí tiene interacción entre usuarios** (comunidad
   Aliados: perfiles, misiones compartidas) → marca "Los usuarios pueden interactuar".
5. **Público objetivo** — 13+ (tiene cuentas y funciones sociales; no marques niños).
6. **Seguridad de los datos** (Data safety) — declara:
   - **Recoge**: Información personal (nombre, email), Fotos (solo si el usuario sube avatar), Actividad en la app (hábitos, progreso, XP).
   - **Cifrado en tránsito**: Sí (Supabase = HTTPS).
   - **Se puede solicitar el borrado**: Sí (la app tiene DangerZone de borrado de cuenta en Perfil → ajustes).
   - **No se comparten datos con terceros**.

## 3. Ficha de la tienda (Store listing)

- **Nombre** (máx. 30): `Zylen: Hábitos y enfoque`
- **Descripción corta** (máx. 80):
  `Convierte tus hábitos en una aventura: rachas, enfoque, aliados y recompensas.`
- **Descripción larga** (borrador, edítala a tu gusto):

  > Zylen convierte tu rutina en una aventura. Cada hábito que completas te da Luz (XP)
  > y Esencia para subir de nivel y hacer crecer tus reinos: salud, mente, finanzas y más.
  >
  > 🔥 **Rachas y rituales** — construye constancia día a día con tu tira semanal.
  > 💎 **Enfoque del día** — sesiones Pomodoro que forjan gemas únicas para tu bóveda.
  > 🛡️ **Aliados** — conecta con otros Guardianes, comparte misiones y mantened viva la llama.
  > 🧠 **Coach personal** — un compañero de IA que te ayuda a reflexionar y planificar.
  > 📊 **Progreso real** — analíticas de cada hábito, mood tracker y logros.
  > 🎁 **Recompensas** — canjea tu Esencia por indulgencias que tú defines.
  >
  > Pequeños hábitos, grandes transformaciones. ✨

- **Icono**: `store/play-icon-512.png`.
- **Gráfico destacado**: `store/feature-graphic-1024x500.png`.
- **Capturas** (mín. 2, recomendado 4-8, formato 9:16): instala el APK de prueba y captura
  desde tu teléfono (volumen bajo + power). Pantallas que mejor venden: Dashboard (héroe),
  Rituales con racha, Enfoque con gema, Aliados, Perfil. Consejo: usa el usuario QA con
  datos poblados, tema por defecto, idioma español.
  - Sube las capturas tal cual (1080×2400 típico); Play las acepta sin marco.

## 4. Primera subida — pista de PRUEBA INTERNA (recomendado)

No publiques directo a producción: usa **Internal testing** (revisión casi inmediata,
hasta 100 testers).

1. Play Console → **Pruebas → Prueba interna → Crear versión**.
2. La primera vez te preguntará por la firma: acepta **Play App Signing** (Google
   custodia la clave de firma final; tu `zylen-upload.jks` queda como *upload key*).
3. Sube `app-release.aab` → nombre de versión `1.1.0 (2)` → **Guardar y publicar**.
4. En **Testers**: crea una lista con tu email (y los de amigos) → copia el
   **enlace de participación** y ábrelo en el teléfono → instala desde Play.
5. Itera aquí hasta estar contento.

## 5. Prueba cerrada (OBLIGATORIA en cuentas personales) y producción

Las cuentas de desarrollador personales creadas después de nov-2023 deben correr una
**prueba cerrada con ≥12 testers opt-in durante ≥14 días** antes de poder solicitar
acceso a producción.

1. **Pruebas → Prueba cerrada → Crear pista** (o usa la pista "Alpha") → **Crear versión**
   → promociona el build de la prueba interna (o sube el AAB).
2. **Consigue 12+ testers**: amigos/familia/comunidad (Discord, X, grupos de dev).
   Añade sus emails a una lista de testers (o usa un Grupo de Google) → comparte el
   enlace de participación → cada uno debe **aceptar el opt-in e instalar la app**.
3. Mantén la prueba activa **14 días seguidos** con los 12 opt-in sostenidos. Durante
   esos días puedes subir builds nuevos a la misma pista (sube `versionCode` cada vez)
   — el contador no se reinicia.
4. Pasados los 14 días: **Producción → Solicitar acceso** (Apply for production access)
   → responde el cuestionario sobre tu prueba (quiénes fueron los testers, qué feedback
   recibiste, qué cambiaste). Sé concreto: Google revisa las respuestas.
5. Con el acceso concedido: **Producción → Crear versión** → promociona el build →
   revisa países → **enviar a revisión** (horas a ~7 días la primera vez).

## 6. Pendientes técnicos ANTES de producción pública

- [ ] **Google OAuth en el APK**: registrar `zylen://auth/callback` en Supabase →
      Authentication → URL Configuration → Redirect URLs. Sin esto, "Continuar con
      Google" no vuelve a la app en producción. (Email/contraseña funciona ya.)
- [ ] **API key de OpenAI embebida**: `EXPO_PUBLIC_OPENAI_API_KEY` viaja dentro del
      APK y cualquiera puede extraerla. Antes de producción abierta, muévela a un
      proxy (Edge Function de Supabase) y deja el cliente sin secreto.
- [ ] **Capturas de pantalla** de la ficha (§3).
- [ ] **Política de privacidad** publicada y enlazada (§2.1).
- [ ] Arena: reactivar cuando esté lista con `FEATURES.enableArena = true`
      (`src/constants/config.ts`) + subir `versionCode`.

## 7. Alternativa: builds en la nube con EAS

Si prefieres no compilar en local (requiere una sola vez `npx eas-cli login`):

```bash
npx eas-cli build --platform android --profile production   # AAB en la nube
npx eas-cli submit --platform android                       # sube el AAB a Play Console
```

`eas.json` ya está configurado (`credentialsSource: local` usa tu mismo keystore).
Para `eas submit` necesitarás además una **service account** de Google Cloud con acceso
a la API de Play Console (Play Console → Configuración → Acceso a API).
