# Configuración de OAuth para Zylen

## 📋 Información de tu Proyecto Supabase

- **Project ID:** `dpjtatyrikecynptytgn`
- **Project URL:** `https://dpjtatyrikecynptytgn.supabase.co`
- **Callback URL:** `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback`

---

## 🔵 PASO 1: Configurar Google OAuth

### 1.1 Ir a Google Cloud Console

1. Abre [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona o crea un proyecto

### 1.2 Configurar la Pantalla de Consentimiento (Solo la primera vez)

1. Ve a **APIs & Services > OAuth consent screen**
2. Selecciona **External** (usuarios externos)
3. Click en **CREATE**
4. Completa el formulario:
   - **App name:** `Zylen`
   - **User support email:** tu email
   - **Developer contact information:** tu email
5. Click **SAVE AND CONTINUE**
6. En **Scopes**, click **SAVE AND CONTINUE** (no necesitas agregar scopes)
7. En **Test users**, click **SAVE AND CONTINUE**
8. Click **BACK TO DASHBOARD**

### 1.3 Crear Credenciales OAuth

1. Ve a **APIs & Services > Credentials**
2. Click en **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Selecciona:
   - **Application type:** Web application
   - **Name:** `Zylen`

4. En **Authorized JavaScript origins**, agrega:
   ```
   http://localhost:5173
   https://dpjtatyrikecynptytgn.supabase.co
   ```

5. En **Authorized redirect URIs**, agrega:
   ```
   https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback
   ```

6. Click **CREATE**

7. **COPIA** el **Client ID** y **Client secret** que aparecen

### 1.4 Configurar en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/dpjtatyrikecynptytgn)
2. Click en **Authentication** (icono de llave en sidebar)
3. Click en **Providers**
4. Busca **Google**
5. Habilítalo (toggle ON)
6. Pega:
   - **Client ID:** (el que copiaste de Google)
   - **Client Secret:** (el que copiaste de Google)
7. Click **Save**

---

## 🐙 PASO 2: Configurar GitHub OAuth

### 2.1 Crear OAuth App en GitHub

1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. Click en **OAuth Apps**
3. Click en **New OAuth App**

### 2.2 Llenar el Formulario

1. Completa:
   - **Application name:** `Zylen`
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback`

2. Click **Register application**

### 2.3 Generar Client Secret

1. **COPIA** el **Client ID** que aparece
2. Click en **Generate a new client secret**
3. **COPIA** el **Client secret** (solo se muestra una vez)

### 2.4 Configurar en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/dpjtatyrikecynptytgn)
2. Click en **Authentication** > **Providers**
3. Busca **GitHub**
4. Habilítalo (toggle ON)
5. Pega:
   - **Client ID:** (el que copiaste de GitHub)
   - **Client Secret:** (el que copiaste de GitHub)
6. Click **Save**

---

## ✅ Verificación

Una vez configurados ambos providers:

1. Inicia el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```

2. Abre `http://localhost:5173`

3. Deberías ver:
   - Página de login automáticamente (no estás autenticado)
   - Botones "Continue with Google" y "Continue with GitHub"

4. Prueba hacer login con Google:
   - Click en "Continue with Google"
   - Selecciona tu cuenta
   - Acepta los permisos
   - Deberías ser redirigido a la app

5. Verifica en Supabase:
   - Ve a **Authentication > Users**
   - Deberías ver tu usuario
   - Ve a **Table Editor > profiles**
   - Deberías ver tu perfil creado automáticamente

---

## 🆘 Errores Comunes

### "redirect_uri_mismatch" (Error 400)
- **Causa:** La URL de callback no está autorizada en Google Cloud Console
- **Síntomas:** Google muestra "Error 400: redirect_uri_mismatch" o "This app sent an invalid request"
- **Solución Rápida:**
  1. Ve a [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
  2. Edita tu OAuth Client ID
  3. En "Authorized redirect URIs", agrega **EXACTAMENTE**: `https://dpjtatyrikecynptytgn.supabase.co/auth/v1/callback`
  4. Guarda y espera 2-3 minutos
- **Guía Detallada:** Ver `docs/FIX_GOOGLE_OAUTH.md` para instrucciones paso a paso con screenshots

### "OAuth not enabled"
- **Causa:** El provider no está habilitado en Supabase
- **Solución:** Ve a Authentication > Providers y habilita Google/GitHub

### "Invalid client credentials"
- **Causa:** Client ID o Secret incorrectos
- **Solución:** Verifica que copiaste correctamente las credenciales

### "App not verified" en Google
- **Causa:** App en modo desarrollo
- **Solución:** Durante desarrollo, puedes hacer clic en "Advanced" > "Go to Zylen (unsafe)"

---

## 📝 Checklist

- [ ] Google OAuth configurado en Google Cloud Console
- [ ] Google OAuth habilitado en Supabase
- [ ] GitHub OAuth configurado en GitHub
- [ ] GitHub OAuth habilitado en Supabase
- [ ] `pnpm run dev` funciona
- [ ] Página de login se muestra
- [ ] Login con Google funciona
- [ ] Login con GitHub funciona
- [ ] Usuario aparece en Authentication > Users
- [ ] Perfil se crea en tabla profiles

---

¡Una vez completados todos los pasos, estarás listo para empezar a usar Zylen! 🎉
