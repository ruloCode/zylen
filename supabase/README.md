# Supabase Setup Guide for Zylen

Este directorio contiene todos los archivos necesarios para configurar la base de datos de Supabase para Zylen.

## 📋 Prerequisites

1. Una cuenta de Supabase (gratis en [supabase.com](https://supabase.com))
2. Un proyecto de Supabase creado

## 🚀 Setup Instructions

### Paso 1: Crear el proyecto en Supabase

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Haz clic en "New Project"
3. Elige un nombre para tu proyecto (ej: "zylen-prod")
4. Elige una región cercana a tus usuarios
5. Crea una contraseña segura para la base de datos (guárdala en un lugar seguro)
6. Espera a que el proyecto se inicialice (~2 minutos)

### Paso 2: Ejecutar el schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor** (icono de ⚡ en el sidebar)
2. Haz clic en **"+ New Query"**
3. Copia todo el contenido de `schema.sql` y pégalo en el editor
4. Haz clic en **"Run"** (o presiona Ctrl/Cmd + Enter)
5. Verifica que se ejecutó correctamente (deberías ver "Success. No rows returned")

**Qué hace este script:**
- Crea 8 tablas: profiles, life_areas, habits, habit_completions, streaks, shop_items, purchases, messages
- Configura Row Level Security (RLS) para proteger los datos de los usuarios
- Crea índices para mejorar el rendimiento de las queries
- Configura triggers para:
  - Auto-actualizar timestamps (updated_at)
  - Auto-calcular points desde xp
  - Auto-crear profile y streak cuando un usuario se registra
- Crea una vista helper para ver las completions de hoy

### Paso 3: Obtener las credenciales

1. Ve a **Project Settings** (⚙️ en el sidebar) > **API**
2. Copia los siguientes valores:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Actualiza tu archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 4: Configurar OAuth Providers

#### Google OAuth

1. Ve a **Authentication** > **Providers** > **Google**
2. Habilita el provider
3. **Obtener Client ID y Secret:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Crea un nuevo proyecto o selecciona uno existente
   - Ve a **APIs & Services** > **Credentials**
   - Clic en **"+ Create Credentials"** > **"OAuth 2.0 Client IDs"**
   - Tipo de aplicación: **Web application**
   - Nombre: "Zylen"
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (desarrollo)
     - `https://tu-dominio.com` (producción)
   - **Authorized redirect URIs**:
     - `https://xxx.supabase.co/auth/v1/callback` (reemplaza xxx con tu project ID)
   - Copia el **Client ID** y **Client Secret**
4. Pega las credenciales en Supabase
5. Haz clic en **Save**

#### GitHub OAuth

1. Ve a **Authentication** > **Providers** > **GitHub**
2. Habilita el provider
3. **Obtener Client ID y Secret:**
   - Ve a [GitHub Settings](https://github.com/settings/developers)
   - Clic en **"New OAuth App"**
   - **Application name**: "Zylen"
   - **Homepage URL**: `http://localhost:5173` (desarrollo) o tu dominio (producción)
   - **Authorization callback URL**: `https://xxx.supabase.co/auth/v1/callback`
   - Clic en **Register application**
   - Copia el **Client ID**
   - Genera un **Client Secret** y cópialo
4. Pega las credenciales en Supabase
5. Haz clic en **Save**

### Paso 5: Configurar Email Auth (Opcional)

Si quieres permitir registro con email/password:

1. Ve a **Authentication** > **Providers** > **Email**
2. Habilita **"Enable Email provider"**
3. Configura:
   - **Enable email confirmations**: Activado (recomendado para producción, desactivado para desarrollo)
   - **Secure email change**: Activado (recomendado)
4. Personaliza los email templates en **Authentication** > **Email Templates** (opcional)

### Paso 6: Verificar la configuración

1. Ve a **Table Editor** en el sidebar
2. Deberías ver todas las tablas creadas:
   - profiles
   - life_areas
   - habits
   - habit_completions
   - streaks
   - shop_items
   - purchases
   - messages

3. Verifica las políticas de RLS:
   - Ve a cada tabla > **"Policies"** tab
   - Deberías ver políticas como "Users can view own X"

## 🔢 Level System Setup (IMPORTANT!)

**Si ya tienes la base de datos funcionando, necesitas actualizar el sistema de niveles.**

El sistema de niveles fue corregido para usar una progresión moderada. Sigue esta guía:

### 📖 **Lee primero:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

Esta guía contiene:
- Instrucciones paso a paso de deployment
- Explicación del problema que se corrigió
- Queries de verificación
- Troubleshooting

### Archivos del Sistema de Niveles:

1. **`level_calculation.sql`** - Funciones compartidas para calcular niveles (DESPLEGAR PRIMERO)
2. **`functions.sql`** - Funciones RPC actualizadas
3. **`habits_functions.sql`** - Funciones de hábitos actualizadas
4. **`recalculate_levels_migration.sql`** - Migración para recalcular niveles existentes
5. **`verification_queries.sql`** - Queries para verificar que todo funcione

### Deployment Rápido:

```sql
-- 1. Desplegar funciones de nivel (PRIMERO)
-- Ejecuta: level_calculation.sql

-- 2. Desplegar funciones core (SEGUNDO)
-- Ejecuta: functions.sql

-- 3. Desplegar funciones de hábitos (TERCERO)
-- Ejecuta: habits_functions.sql

-- 4. Recalcular niveles existentes (CUARTO)
-- Ejecuta: recalculate_levels_migration.sql

-- 5. Verificar deployment (QUINTO)
-- Ejecuta queries de: verification_queries.sql
```

### ¿Por qué es importante?

- **Antes**: Con 30 XP → Nivel 3 ❌
- **Después**: Con 30 XP → Nivel 1 ✅

La progresión ahora es más realista:
- Nivel 2: ~350 XP (~5 días con 3 hábitos/día)
- Nivel 10: ~971 XP (~11 días con 3 hábitos/día)
- Nivel 20: ~3015 XP (~34 días con 3 hábitos/día)

## 🔒 Security Notes

- **RLS está habilitado**: Cada tabla tiene Row Level Security activado
- **Políticas configuradas**: Los usuarios solo pueden ver/modificar sus propios datos
- **anon key es segura**: La anon key puede exponerse en el frontend, está diseñada para eso
- **NUNCA expongas**: El service_role key (solo úsala en backend/edge functions)

## 🧪 Testing

Para verificar que todo funciona:

1. Ejecuta la app: `pnpm run dev`
2. Intenta hacer login con Google o GitHub
3. Verifica que se cree un profile en la tabla `profiles`
4. Intenta crear un hábito y verifica que aparezca en la tabla `habits`

## 📊 Database Diagram

```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles ← user_id
    ↓ (1:1)
streaks
    ↓ (1:many)
life_areas ← user_id
    ↓ (1:many)
habits ← life_area_id
    ↓ (1:many)
habit_completions ← habit_id

profiles
    ↓ (1:many)
shop_items ← user_id
    ↓ (1:many)
purchases ← shop_item_id

profiles
    ↓ (1:many)
messages ← user_id
```

## 🔧 Troubleshooting

### Error: "permission denied for table X"
- Verifica que las políticas de RLS estén configuradas correctamente
- Asegúrate de estar autenticado (auth.uid() debe existir)

### Error: "relation X does not exist"
- Ejecuta el schema.sql completo
- Verifica que estás en la base de datos correcta

### OAuth no funciona
- Verifica las redirect URIs en Google/GitHub
- Asegúrate de que las credenciales sean correctas
- Revisa los logs en Authentication > Logs

### No se crea el profile automáticamente
- Verifica que el trigger `on_auth_user_created` exista
- Revisa los logs en Database > Functions

## 📚 Next Steps

Después de completar este setup:

1. ✅ Implementar componentes de autenticación en React
2. ✅ Migrar servicios de localStorage a Supabase
3. ✅ Actualizar Zustand store
4. ✅ Implementar migración automática de datos locales

## 🆘 Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Zylen GitHub Issues](https://github.com/tu-usuario/zylen/issues)
