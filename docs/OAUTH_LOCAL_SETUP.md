# 🛠️ Configuración OAuth para Desarrollo Local

## 🎯 Objetivo

Configurar OAuth para que funcione correctamente tanto en desarrollo local (`http://localhost:5173`) como en producción (`https://zylen-beta.vercel.app`), sin tener que cambiar configuraciones cada vez que cambias de entorno.

---

## ⚠️ Problema Común

Cuando haces login desde `http://localhost:5173`, te redirige a `https://zylen-beta.vercel.app` en lugar de quedarse en local.

**Causa:** El "Site URL" en Supabase está configurado en producción y sobrescribe el redirect automático.

---

## ✅ Solución Completa (5 minutos)

### 1️⃣ Configurar Supabase (2 minutos)

#### Ir a la configuración de URLs:
```
https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/url-configuration
```

#### Configurar URLs:

**Site URL:** (elige una opción)

- **Opción A - Para desarrollo activo:**
  ```
  http://localhost:5173
  ```
  Usa esta cuando estés desarrollando localmente. Cuando despliegues a producción, cámbiala temporalmente a producción.

- **Opción B - Para producción:**
  ```
  https://zylen-beta.vercel.app
  ```
  Usa esta cuando la app esté en producción. El código sobrescribe esto con `window.location.origin`.

**Redirect URLs:** (agregar AMBAS líneas, una por una)
```
http://localhost:5173/auth/callback
https://zylen-beta.vercel.app/auth/callback
```

✅ Click en **"Save"**

---

### 2️⃣ Configurar Google Cloud Console (2 minutos)

#### Ir a las credenciales:
```
https://console.cloud.google.com/apis/credentials
```

#### Seleccionar proyecto:
- Proyecto: `zylen-478320`

#### Editar OAuth Client ID:
1. Click en tu OAuth Client ID
2. Buscar **"Authorized JavaScript origins"**
3. Click en **"+ ADD URI"**
4. Agregar AMBAS URLs (si no están ya):
   ```
   http://localhost:5173
   https://zylen-beta.vercel.app
   ```

5. Buscar **"Authorized redirect URIs"** (debería estar ya configurado):
   ```
   https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback
   ```

✅ Click en **"SAVE"**

---

### 3️⃣ Verificar Variables de Entorno (30 segundos)

Tu archivo `.env.local` debe tener:

```env
VITE_SUPABASE_URL=https://dpjtatyrikecynptytgn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nota:** No necesitas cambiar nada aquí. Apuntan al mismo proyecto de Supabase tanto en local como en producción.

---

## 🧪 Probar

### En Local:
1. Ejecutar: `pnpm run dev`
2. Abrir: `http://localhost:5173/login`
3. Click en "Continue with Google"
4. ✅ Debe redirigir a: `http://localhost:5173/auth/callback`

### En Producción:
1. Abrir: `https://zylen-beta.vercel.app/login`
2. Click en "Continue with Google"
3. ✅ Debe redirigir a: `https://zylen-beta.vercel.app/auth/callback`

---

## 🔧 Cómo Funciona el Código

El código en `AuthContext.tsx` (línea 61) usa:
```typescript
redirectTo: `${window.location.origin}/auth/callback`
```

Esto significa:
- En local: `http://localhost:5173/auth/callback`
- En prod: `https://zylen-beta.vercel.app/auth/callback`

El redirect es **automático** según desde dónde se ejecuta la app.

---

## 📋 Checklist Rápido

- [ ] Supabase Redirect URLs incluye `http://localhost:5173/auth/callback`
- [ ] Supabase Redirect URLs incluye `https://zylen-beta.vercel.app/auth/callback`
- [ ] Google Cloud origins incluye `http://localhost:5173`
- [ ] Google Cloud origins incluye `https://zylen-beta.vercel.app`
- [ ] `.env.local` tiene las variables de Supabase correctas
- [ ] El puerto del dev server es 5173 (configurado en `vite.config.ts`)

---

## 💡 Tips

### Cambiar entre Local y Producción

Si principalmente desarrollas en local:
- Deja el "Site URL" en Supabase como `http://localhost:5173`
- Antes de desplegar a producción, cámbialo temporalmente a `https://zylen-beta.vercel.app`

Si principalmente usas producción:
- Deja el "Site URL" en Supabase como `https://zylen-beta.vercel.app`
- El código sobrescribe esto automáticamente en local con `window.location.origin`

### Puerto Fijo

El proyecto está configurado con puerto fijo `5173` en `vite.config.ts`:
```typescript
server: {
  port: 5173,
  strictPort: true, // Falla si el puerto está ocupado
}
```

Si el puerto 5173 está ocupado, el servidor NO cambiará automáticamente a 5174. Libera el puerto primero.

---

## 📖 Documentos Relacionados

- **Configuración completa de Google OAuth:** `docs/FIX_GOOGLE_OAUTH.md`
- **Configuración de OAuth en producción:** `docs/FIX_PRODUCTION_OAUTH.md`
- **Setup de Vercel:** `docs/VERCEL_ENV_SETUP.md`
- **Guía rápida de producción:** `ARREGLA_OAUTH_PRODUCCION.md`

---

**Última actualización:** 2025-11-16
**Puerto de desarrollo:** 5173 (fijo)
**Proyecto Supabase:** dpjtatyrikecynptytgn
**Proyecto Google Cloud:** zylen-478320
