# ⚡ Habilitar OAuth Providers AHORA

## ❌ Errores Comunes

### Error 1: "Unsupported provider: provider is not enabled"
```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```
Este error significa que los providers de Google y GitHub **NO están habilitados** en Supabase.

### Error 2: "redirect_uri_mismatch" (Error 400)
```
Error 400: redirect_uri_mismatch
You can't sign in because this app sent an invalid request.
```
Este error significa que la URL de callback de Supabase **NO está autorizada** en Google Cloud Console.

**👉 Si tienes este error, ve a:** `docs/FIX_GOOGLE_OAUTH.md` para la solución completa paso a paso.

---

## ✅ Solución Rápida (5 minutos)

### Opción 1: Habilitar sin credenciales (Solo para testing)

Si solo quieres probar que la app funcione sin configurar OAuth completo:

1. **Abre tu Supabase Dashboard:**
   - https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/providers

2. **Busca "Google" en la lista**
   - Click en "Google" para expandir

3. **Habilítalo (toggle ON)**
   - Activa el switch "Enable Sign in with Google"
   - **IMPORTANTE:** Por ahora, deja los campos Client ID y Secret vacíos si solo quieres testing
   - Click **"Save"**

4. **Repite para GitHub:**
   - Busca "GitHub" en la lista
   - Click para expandir
   - Activa el switch "Enable Sign in with GitHub"
   - Click **"Save"**

⚠️ **NOTA:** Esto habilitará los providers pero aún necesitarás configurar las credenciales reales de Google/GitHub para que funcionen completamente.

---

### Opción 2: Configurar OAuth completo (recomendado)

Si quieres configurarlo todo de una vez:

#### Para Google:

1. **Ve a Google Cloud Console:**
   - https://console.cloud.google.com/apis/credentials

2. **Crea OAuth Client ID** (o usa uno existente)
   - Application type: Web application
   - Authorized redirect URIs: `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback`

3. **Copia Client ID y Client Secret**

4. **Ve a Supabase Dashboard:**
   - https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/providers

5. **Configura Google:**
   - Busca "Google" y expande
   - Activa "Enable Sign in with Google"
   - Pega **Client ID**
   - Pega **Client Secret**
   - Click **"Save"**

#### Para GitHub:

1. **Ve a GitHub OAuth Apps:**
   - https://github.com/settings/developers

2. **Click "New OAuth App"**
   - Application name: `Zylen`
   - Homepage URL: `http://localhost:5174`
   - Authorization callback URL: `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback`

3. **Copia Client ID y genera Client Secret**

4. **Ve a Supabase Dashboard:**
   - https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/providers

5. **Configura GitHub:**
   - Busca "GitHub" y expande
   - Activa "Enable Sign in with GitHub"
   - Pega **Client ID**
   - Pega **Client Secret**
   - Click **"Save"**

---

## 🧪 Verificar que Funciona

1. **Abre tu app:**
   ```
   http://localhost:5174/
   ```

2. **Deberías ver:**
   - Página de login
   - Botones de Google y GitHub

3. **Click en cualquier botón:**
   - Si configuraste las credenciales completas: Te redirigirá a Google/GitHub
   - Si solo habilitaste sin credenciales: Verás un error (pero diferente al anterior)

---

## 📝 Checklist Rápido

- [ ] Abrir https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/providers
- [ ] Habilitar Google provider (toggle ON)
- [ ] Habilitar GitHub provider (toggle ON)
- [ ] (Opcional) Configurar credenciales de Google
- [ ] (Opcional) Configurar credenciales de GitHub
- [ ] Click "Save" en cada provider
- [ ] Refrescar http://localhost:5174/
- [ ] Probar login

---

## 🔗 Links Directos

- **Supabase Providers:** https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/auth/providers
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **GitHub OAuth Apps:** https://github.com/settings/developers
- **Tu App Local:** http://localhost:5174/

---

**Tiempo estimado:** 2-5 minutos para habilitar | 15-20 minutos para configurar completo
