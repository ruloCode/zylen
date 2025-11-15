# 🔧 Solución: Google OAuth redirect_uri_mismatch

## ❌ Error Actual

```
Error 400: redirect_uri_mismatch

You can't sign in because this app sent an invalid request.
```

## 🎯 Causa del Error

Google está rechazando la autenticación porque la URL de callback de Supabase **NO está autorizada** en tu configuración de Google Cloud Console.

**URL que Google está recibiendo:**
```
https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback
```

Esta URL debe estar explícitamente autorizada en tu OAuth Client de Google.

---

## ✅ Solución (5 minutos)

### PASO 1: Ir a Google Cloud Console

1. **Abre este link directo:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Selecciona el proyecto:** `zylen-478320`

3. **Busca tu OAuth Client ID:**
   - Deberías ver algo como: `XXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com`
   - Click en el nombre para editarlo

### PASO 2: Agregar Redirect URI (CRÍTICO)

1. **Busca la sección "Authorized redirect URIs"**

2. **Click en "+ ADD URI"**

3. **Pega EXACTAMENTE esta URL:**
   ```
   https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback
   ```

   ⚠️ **IMPORTANTE:**
   - Sin espacios al inicio o final
   - Sin barra diagonal `/` al final
   - HTTPS, no HTTP
   - Exactamente como está escrita arriba

4. **También agrega el origen JavaScript** (si no está):
   - Busca "Authorized JavaScript origins"
   - Click "+ ADD URI"
   - Agrega: `http://localhost:5174`
   - Agrega: `https://dpjtatyrikecynptytgn.supabase.co`

5. **Click en "SAVE"** (botón azul abajo)

6. **Espera 2-3 minutos** para que los cambios se propaguen

### PASO 3: Configurar Supabase Dashboard

1. **Abre este link:**
   ```
   https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/providers
   ```

2. **Busca "Google" en la lista de providers**

3. **Habilítalo** (toggle ON si no está habilitado)

4. **Ingresa las credenciales:**
   - **Client ID:**
     ```
     YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
     ```
   - **Client Secret:**
     ```
     YOUR_GOOGLE_CLIENT_SECRET
     ```

5. **Click "Save"**

6. **Verifica la configuración de URLs:**
   - Ve a: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/url-configuration
   - **Site URL** debe ser: `http://localhost:5174` (para desarrollo)
   - **Redirect URLs** debe incluir: `http://localhost:5174/auth/callback`

### PASO 4: Probar la Autenticación

1. **Asegúrate de que el servidor esté corriendo:**
   ```bash
   pnpm run dev
   ```

2. **Abre tu app:**
   ```
   http://localhost:5174/login
   ```

3. **Click en "Continue with Google"**

4. **Flujo esperado:**
   - ✅ Redirige a Google (pantalla de selección de cuenta)
   - ✅ Seleccionas tu cuenta de Google
   - ✅ Aceptas los permisos
   - ✅ Redirige de vuelta a Supabase
   - ✅ Supabase procesa el OAuth
   - ✅ Redirige a `http://localhost:5174/auth/callback`
   - ✅ La app procesa los tokens
   - ✅ Te redirige al Dashboard (`/`)

5. **Verifica en Supabase que el usuario fue creado:**
   - Ve a: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/users
   - Deberías ver tu usuario en la lista
   - Ve a: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/editor
   - Abre la tabla `profiles`
   - Deberías ver tu perfil creado automáticamente

---

## 🔍 Verificación de Configuración

### Checklist de Google Cloud Console:

- [ ] Proyecto: `zylen-478320` seleccionado
- [ ] OAuth Client ID: `495604530384-cqu78l1jrckhkv274jvmkek20tf0fhq8...` encontrado
- [ ] Authorized JavaScript origins incluye: `http://localhost:5174`
- [ ] Authorized JavaScript origins incluye: `https://dpjtatyrikecynptytgn.supabase.co`
- [ ] Authorized redirect URIs incluye: `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback`
- [ ] Click en "SAVE"
- [ ] Esperado 2-3 minutos

### Checklist de Supabase Dashboard:

- [ ] Navegado a: Auth > Providers
- [ ] Provider "Google" está habilitado (toggle ON)
- [ ] Client ID ingresado correctamente
- [ ] Client Secret ingresado correctamente
- [ ] Click en "Save"
- [ ] Site URL configurada: `http://localhost:5174`
- [ ] Redirect URL incluye: `http://localhost:5174/auth/callback`

### Checklist de Testing:

- [ ] Servidor corriendo en `http://localhost:5174`
- [ ] Página de login se carga
- [ ] Botón "Continue with Google" visible
- [ ] Click en botón inicia flujo de OAuth
- [ ] Google muestra pantalla de login (no error 400)
- [ ] Después de autenticar, redirige correctamente
- [ ] Usuario aparece en Supabase > Auth > Users
- [ ] Perfil aparece en Supabase > Table Editor > profiles

---

## 🆘 Si Aún No Funciona

### Error: "redirect_uri_mismatch" persiste

**Causa:** La URL no está exactamente como debe ser

**Solución:**
1. Ve de nuevo a Google Cloud Console
2. Verifica que la URL sea **EXACTAMENTE:**
   ```
   https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback
   ```
3. Busca espacios en blanco, barras diagonales extras, o diferencias en mayúsculas/minúsculas
4. Borra la URL y vuélvela a pegar desde este documento
5. Guarda de nuevo
6. Espera 5 minutos y vuelve a intentar

### Error: "OAuth provider not enabled"

**Causa:** El provider no está habilitado en Supabase

**Solución:**
1. Ve a: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/providers
2. Asegúrate de que el toggle de "Google" esté en ON (verde)
3. Verifica que las credenciales estén guardadas
4. Click en "Save" de nuevo

### Error: "Invalid client credentials"

**Causa:** Client ID o Secret incorrectos

**Solución:**
1. Verifica en Google Cloud Console:
   - Client ID: `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
   - Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`
2. Cópialos exactamente como están
3. Pégalos en Supabase Dashboard
4. Guarda

### Error: "App not verified" (pantalla amarilla de Google)

**Causa:** Tu app está en modo desarrollo y no está verificada por Google

**Solución (Durante desarrollo):**
1. Cuando veas la pantalla amarilla "This app isn't verified"
2. Click en "Advanced" (abajo)
3. Click en "Go to Zylen (unsafe)"
4. Esto es normal durante desarrollo
5. Para producción, necesitarás verificar tu app con Google

---

## 📊 Cómo Funciona el Flujo OAuth

**Entender el flujo te ayudará a diagnosticar problemas:**

```
1. Usuario click "Continue with Google"
   ↓
2. App llama a supabase.auth.signInWithOAuth({ provider: 'google' })
   ↓
3. Supabase redirige a Google con:
   redirect_uri=https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback
   ↓
4. Google verifica que este redirect_uri esté autorizado
   ↓ (SI NO ESTÁ AUTORIZADO → Error 400: redirect_uri_mismatch)
   ↓
5. Usuario selecciona cuenta y acepta permisos
   ↓
6. Google redirige a Supabase con un código:
   https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback?code=ABC123...
   ↓
7. Supabase intercambia el código por tokens (access_token, refresh_token)
   ↓
8. Supabase redirige a tu app:
   http://localhost:5174/auth/callback#access_token=XYZ...
   ↓
9. Tu página AuthCallback.tsx procesa los tokens
   ↓
10. AuthContext actualiza el estado de usuario
   ↓
11. App redirige al Dashboard (/)
```

**El paso crítico es el #4:** Google DEBE tener `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback` en su lista de redirect URIs autorizadas.

---

## 🔗 Links Directos

**Google Cloud Console:**
- Credentials: https://console.cloud.google.com/apis/credentials
- OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent

**Supabase Dashboard:**
- Auth Providers: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/providers
- URL Configuration: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/url-configuration
- Users: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/users
- Profiles Table: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/editor

**Tu App:**
- Login: http://localhost:5174/login
- Dashboard: http://localhost:5174/

---

## ✨ Próximos Pasos Después de Arreglar OAuth

Una vez que Google OAuth funcione:

1. **Configura GitHub OAuth** (similar proceso):
   - Ve a: https://github.com/settings/developers
   - Crea OAuth App
   - Callback URL: `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback`
   - Configura en Supabase Dashboard

2. **Continúa con FASE 4:**
   - Reescribir servicios para usar Supabase
   - Migrar de localStorage a PostgreSQL
   - Mantener la misma API

---

**Tiempo estimado para arreglar:** 5-10 minutos

**Dificultad:** Fácil (solo configuración, no código)

**Tu código está correcto** ✅ - Solo falta configuración de dashboards

---

Last Updated: 2025-11-15
Project: Zylen
Issue: Google OAuth redirect_uri_mismatch
