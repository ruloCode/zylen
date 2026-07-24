# Notificaciones — arquitectura y operación

Dos sistemas independientes que comparten la capa base
(`src/services/notifications.service.ts`: canales Android, permisos, `show()`):

## 1. Coach de hábitos (local, sin servidor)

`src/services/coachReminders.service.ts`

- Notificaciones **programadas en el dispositivo** (suenan con la app cerrada;
  sobreviven reboots — expo-notifications trae `RECEIVE_BOOT_COMPLETED`).
- Una notificación por franja (`timeOfDay` → hora en `REMINDER_HOURS`) y por
  día, para los próximos 3 días. Destaca UN hábito (rota por día) y menciona
  cuántos más esperan.
- El mensaje lleva el **porqué**: una línea de `habitCatalog.<slug>.science` /
  `shortTerm` / `tips` (rotada por día), con las plantillas del Mentor en
  `coach.notifications.*` (i18n es/en). Hábitos fuera del catálogo usan las
  variantes genéricas.
- Se re-sincroniza (cancelar + reprogramar, identificadores `coach-*`) en:
  arranque, cambio de hábitos (debounce 800 ms), foreground y reset diario —
  ver `providers/AuthGate.tsx`.
- Preferencia: toggle "Coach de hábitos" en Perfil (`ReminderSettings`),
  kv `zylen_coach_reminders_enabled`.

## 2. Push remota: aliados y Arena (FCM directo, sin Expo Push Service)

Cadena completa:

```
RPC / app web / mobile
  → INSERT/UPDATE en friendships | arena_invites
  → trigger (fn_push_on_*)                      [migración 20260724120000]
  → fn_notify_push → pg_net POST                [URL+secreto desde Vault]
  → Edge Function send-push                     [--no-verify-jwt + x-push-secret]
  → FCM HTTP v1 (JWT del service account)
  → dispositivo (token de push_tokens; locale es/en por fila)
```

Eventos: `friend_request` (→ /social), `friend_accept` (→ /social),
`arena_invite` (→ /arena?invite=<id>, que auto-acepta vía
`respond_arena_invite`). El tap se enruta en AuthGate
(`useLastNotificationResponse` → `router.push(data.url)`).

- Cliente: `src/services/push.service.ts` registra el token **nativo** FCM
  (`getDevicePushTokenAsync`) vía RPC `register_push_token` (multi-device,
  re-asigna tokens que cambian de cuenta, guarda `locale`). Toggle "Aliados y
  Arena" en Perfil (kv `zylen_push_enabled`) registra/da de baja.
- Invitar a la arena: botón en `GuardianProfileSheet` (solo aliados) → RPC
  `invite_to_arena` (valida alianza, throttle 10 min, única pendiente por par).
- Elegimos FCM directo (y no Expo Push Service) porque la clave FCM V1 solo
  puede subirse a EAS de forma interactiva; así todo queda automatizable. Si
  algún día hay app iOS, habrá que sumar APNs a send-push (o migrar a Expo
  Push subiendo la clave con `eas credentials`).

### Piezas desplegadas (proyecto live jtyvfkksoncduqmryssw)

| Pieza | Dónde | Notas |
|---|---|---|
| Migración `20260724120000_push_notifications.sql` | aplicada con `supabase db push` | push_tokens, arena_invites, RPCs, triggers, pg_net |
| Edge Function `send-push` | `supabase functions deploy send-push --project-ref jtyvfkksoncduqmryssw --no-verify-jwt` | plantillas es/en dentro de la función |
| Secrets de la función | `supabase secrets set --project-ref …` | `FCM_SERVICE_ACCOUNT` (JSON del SA, mismo `mobile/service-account.json`), `PUSH_TRIGGER_SECRET` |
| Vault (Postgres) | secretos `push_fn_url`, `push_trigger_secret` | los leen los triggers; si faltan, los triggers no hacen nada (entornos sin push) |
| Firebase | proyecto GCP `zylen-478320` (+Firebase, app Android `com.rulocode.zylen`) | `mobile/google-services.json` **committeado** (no es secreto) + `android.googleServicesFile` en app.json |

Rotar el secreto: generar uno nuevo → `supabase secrets set PUSH_TRIGGER_SECRET=…`
y actualizar `push_trigger_secret` en Vault (mismo valor).

### Builds

- **EAS / Play (push a `release`)**: `mobile/android/` está gitignorado, así
  que EAS hace prebuild desde app.json → FCM y `POST_NOTIFICATIONS` entran
  solos. Nada que hacer.
- **Build local**: el `android/` local es viejo (sin google-services). Antes
  del próximo `expo run:android`, regenerarlo:
  `npx expo prebuild -p android --clean`.

### Debug

- Respuestas de los envíos disparados por triggers:
  `select status_code, content from net._http_response order by id desc limit 5;`
- Logs de la función: dashboard → Functions → send-push.
- Prueba manual del pipeline (sin tocar la DB):
  `curl -X POST https://jtyvfkksoncduqmryssw.supabase.co/functions/v1/send-push -H "x-push-secret: $SECRET" -H "Content-Type: application/json" -d '{"type":"test","payload":{"title":"Ping","body":"pong"},"tokens":[{"token":"<token-real>","locale":"es"}]}'`
- Tokens registrados de un usuario: `select * from push_tokens where user_id = '<uuid>';`
- Los tokens inválidos (app desinstalada, token rotado) se borran solos cuando
  FCM devuelve UNREGISTERED.

### QA

Usuarios de prueba: `qa.claude@zylen.test` (qa_claude) y
`qa.claude2@zylen.test` (qa_claude2, creado para probar alianzas). E2E mínimo
en dispositivo: instalar build interna → login → Perfil: activar
notificaciones → verificar fila en push_tokens → desde la otra cuenta enviar
solicitud de aliado → debe sonar "⚔️ Nueva solicitud de alianza"; aceptar →
al otro le llega "🤝 ¡Alianza forjada!"; desde el perfil del aliado "Invitar a
la Arena" → al otro "🏟️ Te retan en la Arena" y el tap abre /arena.
