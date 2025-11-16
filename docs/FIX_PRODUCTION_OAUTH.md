# 🔧 Arreglar OAuth Redirect en Producción (2 minutos)

## ❌ Problema Actual

Después del login con Google en producción, te redirige a:
```
http://localhost:3000/#access_token=...
```

En vez de:
```
https://zylen-beta.vercel.app/#access_token=...
```

---

## 🎯 Causa del Problema

La configuración de **Supabase Dashboard** tiene hardcoded `localhost:3000` como Site URL, lo cual sobrescribe el redirect dinámico del código.

**TU CÓDIGO ESTÁ CORRECTO** ✅ - Solo falta configuración.

---

## ✅ Solución (2 minutos)

### PASO 1: Configurar Site URL en Supabase

1. **Abre este link directo:**
   ```
   https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/url-configuration
   ```

2. **Actualiza "Site URL":**
   - Cambia de: `http://localhost:3000` o `http://localhost:5174`
   - A: `https://zylen-beta.vercel.app`

3. **Actualiza "Redirect URLs":**

   Asegúrate de tener AMBAS URLs (una por línea):
   ```
   http://localhost:5174/auth/callback
   https://zylen-beta.vercel.app/auth/callback
   ```

   **IMPORTANTE:**
   - Sin espacios al inicio o final
   - Sin barra diagonal `/` al final de las URLs
   - HTTPS para producción, HTTP para localhost
   - Exactamente como están escritas arriba

4. **Click en "Save"**

5. **Espera 1-2 minutos** para que los cambios se propaguen

---

### PASO 2: Verificar Google Cloud Console

1. **Abre este link directo:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Selecciona el proyecto:** `zylen-478320`

3. **Busca tu OAuth Client ID** y ábrelo

4. **Verifica "Authorized JavaScript origins":**

   Debe incluir:
   ```
   http://localhost:5174
   https://dpjtatyrikecynptytgn.supabase.co
   https://zylen-beta.vercel.app
   ```

5. **Si falta la URL de producción:**
   - Click en "+ ADD URI"
   - Pega: `https://zylen-beta.vercel.app`
   - Click en "SAVE"

6. **Verifica "Authorized redirect URIs":**

   Debe incluir:
   ```
   https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback
   ```

7. **Si todo está correcto**, no hagas cambios

8. **Espera 2-3 minutos** si hiciste cambios

---

### PASO 3: Verificar Variables de Entorno en Vercel

1. **Abre tu proyecto en Vercel:**
   ```
   https://vercel.com/dashboard
   ```

2. **Ve a:** Settings → Environment Variables

3. **Verifica que existan:**

   ```
   VITE_SUPABASE_URL = https://dpjtatyrikecynptytgn.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Si faltan o están incorrectas:**
   - Agrégalas o edítalas
   - Aplica a: Production, Preview, Development (todos)
   - Click "Save"

---

### PASO 4: Redesplegar en Vercel

1. **Opción A: Desde el Dashboard**
   - Ve a: Deployments → Latest deployment
   - Click en los tres puntos `...` → Redeploy
   - Click "Redeploy"

2. **Opción B: Desde Git**
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

3. **Espera 1-2 minutos** a que termine el deploy

---

### PASO 5: Probar en Producción

1. **Abre tu app en producción:**
   ```
   https://zylen-beta.vercel.app/login
   ```

2. **Click en "Continue with Google"**

3. **Flujo esperado:**
   - ✅ Redirige a Google (pantalla de selección de cuenta)
   - ✅ Seleccionas tu cuenta de Google
   - ✅ Aceptas los permisos
   - ✅ Redirige de vuelta a Supabase
   - ✅ Supabase procesa el OAuth
   - ✅ **Redirige a `https://zylen-beta.vercel.app/auth/callback`** ← ESTO ES LO IMPORTANTE
   - ✅ La app procesa los tokens
   - ✅ Te redirige al Dashboard o Onboarding

4. **Verifica la URL en la barra de direcciones:**
   - Debe ser: `https://zylen-beta.vercel.app/` o `https://zylen-beta.vercel.app/onboarding`
   - NO debe ser: `http://localhost:3000/...`

---

## 🔍 Verificación de Configuración

### Checklist de Supabase Dashboard:

- [ ] Navegado a: Auth > URL Configuration
- [ ] Site URL configurada: `https://zylen-beta.vercel.app`
- [ ] Redirect URLs incluye: `http://localhost:5174/auth/callback`
- [ ] Redirect URLs incluye: `https://zylen-beta.vercel.app/auth/callback`
- [ ] Click en "Save"
- [ ] Esperado 1-2 minutos

### Checklist de Google Cloud Console:

- [ ] Proyecto: `zylen-478320` seleccionado
- [ ] OAuth Client ID encontrado
- [ ] Authorized JavaScript origins incluye: `http://localhost:5174`
- [ ] Authorized JavaScript origins incluye: `https://dpjtatyrikecynptytgn.supabase.co`
- [ ] Authorized JavaScript origins incluye: `https://zylen-beta.vercel.app`
- [ ] Authorized redirect URIs incluye: `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback`
- [ ] Click en "SAVE" (si hiciste cambios)
- [ ] Esperado 2-3 minutos

### Checklist de Vercel:

- [ ] Variables de entorno configuradas
- [ ] `VITE_SUPABASE_URL` correcta
- [ ] `VITE_SUPABASE_ANON_KEY` correcta
- [ ] Aplicadas a Production
- [ ] Redespliegue completado

### Checklist de Testing:

- [ ] App abierta en: `https://zylen-beta.vercel.app/login`
- [ ] Click en "Continue with Google"
- [ ] Google muestra pantalla de login (no error 400)
- [ ] Después de autenticar, redirige a `https://zylen-beta.vercel.app/auth/callback`
- [ ] Luego redirige a Dashboard u Onboarding
- [ ] URL final es `https://zylen-beta.vercel.app/...` (NO localhost)

---

## 🆘 Si Aún No Funciona

### Error: Sigue redirigiendo a localhost

**Causa:** Cache del navegador o Supabase no actualizó la configuración

**Solución:**
1. Limpia la cache del navegador (Ctrl+Shift+Delete)
2. Abre en ventana privada/incognito
3. Espera 5 minutos y vuelve a intentar
4. Verifica que guardaste los cambios en Supabase Dashboard

### Error: "redirect_uri_mismatch"

**Causa:** La URL no está exactamente como debe ser en Google Cloud Console

**Solución:**
1. Ve de nuevo a Google Cloud Console
2. Verifica que las URLs sean **EXACTAMENTE:**
   - `http://localhost:5174`
   - `https://zylen-beta.vercel.app`
   - `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback`
3. Busca espacios en blanco, barras diagonales extras, o diferencias en mayúsculas/minúsculas
4. Guarda de nuevo
5. Espera 5 minutos y vuelve a intentar

### Error: Variables de entorno no funcionan

**Causa:** Vercel no las aplicó correctamente

**Solución:**
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Verifica que estén aplicadas a "Production"
3. Borra las variables y vuélvelas a crear
4. Redeploy manual desde el dashboard

---

## 📊 Cómo Funciona (Para Entender)

**Entender el flujo te ayudará a diagnosticar problemas:**

```
1. Usuario en https://zylen-beta.vercel.app/login
   ↓
2. Click "Continue with Google"
   ↓
3. AuthContext.tsx ejecuta:
   supabase.auth.signInWithOAuth({
     provider: 'google',
     redirectTo: `${window.location.origin}/auth/callback`
                  ↑ Esto es dinámico!
                  = "https://zylen-beta.vercel.app/auth/callback"
   })
   ↓
4. Supabase redirige a Google con:
   redirect_uri=https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback
   ↓
5. Google verifica que este redirect_uri esté autorizado
   ↓
6. Usuario selecciona cuenta y acepta permisos
   ↓
7. Google redirige a Supabase con un código:
   https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback?code=ABC123...
   ↓
8. Supabase intercambia el código por tokens
   ↓
9. Supabase busca a dónde redirigir:
   - Primero intenta usar el "redirectTo" del paso 3
   - Si no está permitido, usa "Site URL" del dashboard
   ↓ AQUÍ ESTÁ EL PROBLEMA
   ↓ Si "Site URL" = localhost:3000, redirige a localhost ❌
   ↓ Si "Site URL" = https://zylen-beta.vercel.app, redirige correcto ✅
   ↓
10. Supabase redirige a:
    https://zylen-beta.vercel.app/auth/callback#access_token=XYZ...
    ↓
11. AuthCallback.tsx procesa los tokens
    ↓
12. AuthContext actualiza el estado de usuario
    ↓
13. App redirige al Dashboard u Onboarding
```

**El paso crítico es el #9:** Supabase debe tener `https://zylen-beta.vercel.app` como Site URL.

---

## 🔗 Links Directos

**Supabase Dashboard:**
- URL Configuration: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/url-configuration
- Auth Providers: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/providers
- Users: https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/users

**Google Cloud Console:**
- Credentials: https://console.cloud.google.com/apis/credentials
- OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent

**Tu App:**
- Producción: https://zylen-beta.vercel.app
- Login Producción: https://zylen-beta.vercel.app/login
- Desarrollo: http://localhost:5174
- Login Desarrollo: http://localhost:5174/login

**Vercel:**
- Dashboard: https://vercel.com/dashboard

---

## ✨ Notas Importantes

1. **Tu código ya es dinámico** ✅
   - Usa `window.location.origin` para detectar automáticamente la URL
   - NO está hardcoded a localhost
   - NO necesitas cambiar código

2. **Múltiples ambientes:**
   - Puedes tener múltiples redirect URLs en Supabase
   - Localhost para desarrollo
   - Vercel para producción
   - Funcionan al mismo tiempo sin conflicto

3. **Variables de entorno:**
   - Deben estar en Vercel para producción
   - Deben estar en `.env.local` para desarrollo local
   - NUNCA comitees `.env.local` a Git

4. **Cache:**
   - Si haces cambios, siempre prueba en ventana incognito
   - La cache del navegador puede guardar redirects viejos

---

**Tiempo estimado para arreglar:** 2 minutos

**Dificultad:** Muy fácil (solo configuración en dashboards)

**Tu código está perfecto** ✅ - Solo falta configuración

---

Last Updated: 2025-11-15
Project: Zylen
Issue: OAuth redirect to localhost in production
Production URL: https://zylen-beta.vercel.app
