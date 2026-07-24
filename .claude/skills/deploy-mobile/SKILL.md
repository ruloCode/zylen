---
name: deploy-mobile
description: Publicar la app mobile de Zylen (Expo) a Google Play. Usar cuando el usuario pida "deploy mobile", "publica a Play", "saca release para testers", "sube la app", o pregunte por el estado de un build/submit de EAS. Cubre el flujo push→release, monitoreo, verificación en la pista interna y troubleshooting de credenciales.
---

# Deploy de Zylen Mobile a Google Play

Pipeline CI/CD ya configurado (jul-2026, probado E2E): push a la rama `release`
→ EAS Workflow compila el AAB en la nube → submit automático a la **pista
interna** de Play. Guía humana completa: `mobile/docs/PLAY_STORE.md` §7.

## Flujo estándar (lo único necesario en el día a día)

```bash
git checkout release && git merge main --ff-only && git push origin release && git checkout main
```

Eso dispara el workflow `mobile/.eas/workflows/build-and-submit.yml`
("Release Android (Play pista interna)"). Nada más que hacer: versionCode se
auto-incrementa en remoto (`appVersionSource: remote` en `mobile/eas.json`),
el AAB se firma con el keystore guardado en EAS y el submit usa la service
account. La promoción a prueba cerrada/producción es SIEMPRE un clic manual
en Play Console (deliberado: producción pasa revisión de Google).

- La versión semántica visible (ej. 1.2.0) sale de `version` en
  `mobile/app.json` — subirla a mano cuando el release lo amerite.
- Si el push a `release` no dispara nada, revisa que el commit sea nuevo:
  un push sin commits nuevos (rama ya al día) no dispara el workflow.

## Monitorear el build (~15-25 min total)

```bash
cd mobile
# estado del build (IN_QUEUE → IN_PROGRESS → FINISHED):
npx eas-cli build:list --platform android --limit 1 --non-interactive --json
```

Campos útiles del JSON: `status`, `appVersion`, `appBuildVersion`
(=versionCode). Vista web con los dos jobs (build + submit):
expo.dev → proyecto zylen → Workflows.

El job de submit corre DESPUÉS del build y tarda varios minutos más. No hay
comando CLI para listar submissions en esta versión de eas-cli; verificar
contra la API de Play (siguiente sección) o en expo.dev.

## Verificar que el AAB llegó a la pista interna

Consulta directa a la Google Play Developer API con la service account
(`mobile/service-account.json`, gitignorado). Patrón: JWT RS256 firmado con
openssl → token OAuth → `POST .../applications/com.rulocode.zylen/edits` →
`GET .../edits/{id}/tracks/internal` → `DELETE` del edit (borrador, no
publica nada). Éxito = el release listado incluye el versionCode del build
recién terminado con `"status": "completed"`.

Verificación humana: Play Console → Versiones → Pruebas → Prueba interna
(release nuevo "Disponible para testers"). En el teléfono de un tester el
update llega solo (auto-update de Play, puede tardar horas) o al instante
desde la ficha de la app en Play Store → Actualizar.

## Configuración de la que depende (ya hecha; verificar solo si algo falla)

| Pieza | Dónde | Síntoma si se rompe |
|---|---|---|
| GitHub↔EAS vinculado, **Base directory = `mobile`** | expo.dev → zylen → Settings → GitHub | push a release no dispara nada / "Workflows Unconfigured" |
| Keystore en EAS = upload key local | `npx eas-cli credentials --platform android` → production → Keystore | Play rechaza el AAB por firma distinta |
| Service account `zylen-play-publisher@zylen-478320.iam.gserviceaccount.com` | misma ruta CLI → Google Service Account; invitada en Play Console → Usuarios y permisos con "Publicar en pistas de prueba" | submit falla con 403 PERMISSION_DENIED |
| Env vars del build | `npx eas-cli env:list production` / `env:push production --path .env` | app compila pero falla en runtime (Supabase, etc.) |

El SHA1 correcto del upload key (`mobile/credentials/zylen-upload.jks`,
alias y contraseña en `mobile/credentials.json`):
`5C:FB:0A:21:25:C8:7A:FE:04:A5:08:D1:95:71:4F:D7:F4:4C:62:93`.
Si EAS muestra otro → importar el .jks local, NUNCA dejar que EAS genere uno.

## Si el workflow falla

```bash
# estado de los runs (FAILURE/SUCCESS) y de cada job (build vs submit):
npx eas-cli workflow:runs --json
npx eas-cli workflow:view <run-id> --json
```

Si el build pasó pero el submit falló, NO hace falta recompilar — relanzar
solo el submit reutilizando el AAB ya compilado:

```bash
npx eas-cli submit --platform android --id <build-id> --non-interactive
```

Caso real (jul-2026, primer release del pipeline): el submit automático
falló de forma transitoria (permisos de la service account recién invitada
aún propagándose en Google); el mismo submit relanzado a mano minutos
después funcionó sin tocar nada.

## Alternativas al pipeline

```bash
# release manual sin pasar por GitHub (mismo build+submit cloud):
cd mobile && npx eas-cli build --platform android --profile production --auto-submit

# build local (APK/AAB firmado con gradle, sin EAS; ver script):
mobile/scripts/build-release.sh
```

## Fuera de alcance

El deploy web es aparte: `vercel --prod` manual desde la raíz (NO se
despliega con git push). No mezclar los dos flujos.
