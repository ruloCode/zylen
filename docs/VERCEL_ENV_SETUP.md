# 🚀 Configuración de Variables de Entorno en Vercel

## Variables Necesarias para Producción

Para que OAuth funcione correctamente en producción, necesitas configurar estas variables de entorno en Vercel:

```bash
VITE_SUPABASE_URL=https://dpjtatyrikecynptytgn.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key-aquí>
```

---

## 🔑 Obtener el Anon Key

1. **Abre Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/settings/api
   ```

2. **Busca la sección "Project API keys"**

3. **Copia el "anon public" key:**
   - Empieza con: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Es largo (varios cientos de caracteres)
   - Es seguro compartirlo públicamente (está diseñado para ser público)

---

## ⚙️ Configurar en Vercel (Método 1: Dashboard)

### Paso 1: Acceder a Settings

1. Abre tu proyecto en Vercel:
   ```
   https://vercel.com/dashboard
   ```

2. Selecciona el proyecto "zylen" o "zylen-beta"

3. Ve a: **Settings** → **Environment Variables**

### Paso 2: Agregar Variables

Para cada variable:

1. Click en **"Add New"** o **"+ New Variable"**

2. **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://dpjtatyrikecynptytgn.supabase.co`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

3. **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `<pega-tu-anon-key-aquí>`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**

### Paso 3: Redesplegar

**Importante:** Vercel NO aplica automáticamente las variables a deployments existentes.

**Opción A - Desde Dashboard:**
1. Ve a: **Deployments**
2. Click en el deployment más reciente
3. Click en el botón `⋮` (tres puntos)
4. Click **"Redeploy"**
5. Click **"Redeploy"** de nuevo para confirmar

**Opción B - Desde Git:**
```bash
git commit --allow-empty -m "chore: trigger redeploy for env vars"
git push
```

---

## ⚙️ Configurar en Vercel (Método 2: CLI)

Si prefieres usar la CLI:

### Paso 1: Instalar Vercel CLI

```bash
npm i -g vercel
```

### Paso 2: Login

```bash
vercel login
```

### Paso 3: Link Project

```bash
cd /Users/camilosantana/Documents/Zylen
vercel link
```

### Paso 4: Agregar Variables

```bash
vercel env add VITE_SUPABASE_URL production
# Pega: https://dpjtatyrikecynptytgn.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Pega tu anon key
```

### Paso 5: Redesplegar

```bash
vercel --prod
```

---

## 📋 Checklist de Verificación

- [ ] `VITE_SUPABASE_URL` agregada en Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` agregada en Vercel
- [ ] Ambas aplicadas a "Production"
- [ ] Ambas aplicadas a "Preview" (opcional pero recomendado)
- [ ] Ambas aplicadas a "Development" (opcional)
- [ ] Redeploy completado
- [ ] Nueva versión desplegada con éxito

---

## 🔍 Verificar que Funcionó

### Método 1: Revisar en el Código Fuente

1. Abre tu app en producción:
   ```
   https://zylen-beta.vercel.app
   ```

2. Abre DevTools (F12)

3. Ve a la consola y ejecuta:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```

4. Debería mostrar:
   ```
   https://dpjtatyrikecynptytgn.supabase.co
   ```

5. Si muestra `undefined`, las variables NO se aplicaron correctamente

### Método 2: Revisar el Bundle

1. Abre tu app en producción:
   ```
   https://zylen-beta.vercel.app
   ```

2. Abre DevTools → Network

3. Busca un archivo `.js` del bundle

4. Abre el archivo y busca (Ctrl+F): `dpjtatyrikecynptytgn`

5. Si lo encuentras, las variables están correctamente aplicadas

---

## 🆘 Troubleshooting

### Las variables no se aplican

**Problema:** Después de agregarlas, siguen mostrando `undefined`

**Solución:**
1. Verifica que hiciste un **Redeploy** después de agregar las variables
2. Las variables NO se aplican retroactivamente a deployments existentes
3. Debes hacer un nuevo deploy o redeploy manual

### Error: "Invalid API key"

**Problema:** La app muestra error de API key inválida

**Solución:**
1. Verifica que copiaste el **anon key** completo (es muy largo)
2. No copies espacios al inicio o final
3. Debe empezar con `eyJ...`
4. Ve a Supabase Dashboard y copia el key de nuevo

### Las variables funcionan en Preview pero no en Production

**Problema:** Preview deployments funcionan pero Production no

**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que las variables tengan ✅ en "Production"
3. Si no, edita cada variable y marca "Production"
4. Haz un redeploy manual

---

## 📝 Desarrollo Local

Para desarrollo local, NO uses las variables de Vercel. En su lugar:

1. **Crea archivo `.env.local` en la raíz del proyecto:**
   ```bash
   cd /Users/camilosantana/Documents/Zylen
   touch .env.local
   ```

2. **Agrega las variables:**
   ```bash
   VITE_SUPABASE_URL=https://dpjtatyrikecynptytgn.supabase.co
   VITE_SUPABASE_ANON_KEY=<tu-anon-key-aquí>
   ```

3. **IMPORTANTE:** `.env.local` está en `.gitignore` y NO se sube a Git

4. **Reinicia el servidor de desarrollo:**
   ```bash
   pnpm run dev
   ```

---

## 🔒 Seguridad

### ¿Es seguro exponer el Anon Key?

**SÍ** ✅ - El anon key está diseñado para ser público:
- Se incluye en el código JavaScript del frontend
- Cualquiera puede verlo en el código fuente
- Supabase lo protege con Row Level Security (RLS)

### ¿Qué NO debes exponer?

**❌ Service Role Key:**
- Este key SÍ es secreto
- NUNCA lo agregues a variables de frontend
- Solo úsalo en backend/serverless functions

---

## 🔗 Links Útiles

- **Supabase API Settings:** https://supabase.com/dashboard/project/dpjtatyrikecynptytgn/settings/api
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs - Environment Variables:** https://vercel.com/docs/projects/environment-variables

---

Last Updated: 2025-11-15
Project: Zylen
Production URL: https://zylen-beta.vercel.app
