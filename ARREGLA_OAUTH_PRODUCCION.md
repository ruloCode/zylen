# ⚠️ ARREGLA OAUTH EN PRODUCCIÓN (2 MINUTOS)

## 🚨 PROBLEMA
Te redirige a `localhost:3000` en vez de `https://zylen-beta.vercel.app`

## ✅ SOLUCIÓN RÁPIDA (Sigue en orden)

### 1️⃣ SUPABASE: Configurar URLs (30 segundos)
```
https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/url-configuration
```

- **Site URL:** `https://zylen-beta.vercel.app`
- **Redirect URLs:** (una por línea)
  ```
  http://localhost:5174/auth/callback
  https://zylen-beta.vercel.app/auth/callback
  ```
- Click **"Save"**

---

### 2️⃣ GOOGLE CLOUD: Agregar URL de Producción (1 minuto)
```
https://console.cloud.google.com/apis/credentials
```

- Proyecto: `zylen-478320`
- Abre tu OAuth Client ID
- **Authorized JavaScript origins** → Agregar:
  ```
  https://zylen-beta.vercel.app
  ```
- Click **"SAVE"**

---

### 3️⃣ VERCEL: Variables de Entorno (30 segundos)
```
https://vercel.com/dashboard
```

- Settings → Environment Variables
- Verificar que existan:
  ```
  VITE_SUPABASE_URL = https://dpjtatyrikecynptytgn.supabase.co
  VITE_SUPABASE_ANON_KEY = (tu key de Supabase)
  ```
- Si faltan, agrégalas desde:
  ```
  https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/settings/api
  ```

---

### 4️⃣ REDESPLEGAR (30 segundos)

**Opción A - Dashboard:**
- Deployments → Latest → `⋮` → Redeploy

**Opción B - Git:**
```bash
git commit --allow-empty -m "Redeploy"
git push
```

---

### 5️⃣ PROBAR (30 segundos)

```
https://zylen-beta.vercel.app/login
```

- Click "Continue with Google"
- Verifica que redirige a: `https://zylen-beta.vercel.app/...`
- NO debe redirigir a: `localhost:3000/...`

---

## 📋 CHECKLIST COMPLETO

- [ ] Supabase Site URL = `https://zylen-beta.vercel.app`
- [ ] Supabase Redirect URLs incluye localhost Y producción
- [ ] Google Cloud tiene `https://zylen-beta.vercel.app` en origins
- [ ] Vercel tiene `VITE_SUPABASE_URL` configurada
- [ ] Vercel tiene `VITE_SUPABASE_ANON_KEY` configurada
- [ ] Redeploy completado
- [ ] Login en producción funciona correctamente

---

## 📖 Guías Detalladas

- **Paso a paso completo:** `docs/FIX_PRODUCTION_OAUTH.md`
- **Configuración de Vercel:** `docs/VERCEL_ENV_SETUP.md`
- **Configuración de Google OAuth:** `docs/FIX_GOOGLE_OAUTH.md`

---

## 🎯 RESULTADO ESPERADO

**ANTES:**
```
http://localhost:3000/#access_token=...
```

**DESPUÉS:**
```
https://zylen-beta.vercel.app/#access_token=...
```

---

**Tiempo Total:** 2-3 minutos
**Dificultad:** Muy fácil
**Cambios de Código:** NINGUNO (tu código ya es correcto)

---

Last Updated: 2025-11-15
