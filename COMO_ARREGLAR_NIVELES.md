# 🔧 Cómo Arreglar Tu Nivel (3 Pasos Simples)

## ❌ Problema Actual
Estás en **Nivel 3** con solo **30 XP** (1 hábito completado).

**Esto está MAL.** Deberías estar en **Nivel 1**.

---

## ✅ Solución (5 minutos)

### Paso 1: Abrir Supabase SQL Editor

1. Ve a tu dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto de Zylen
3. En el menú lateral izquierdo, haz clic en el icono de **SQL Editor** (⚡)
4. Haz clic en **"+ New Query"**

### Paso 2: Copiar y Pegar el Fix

1. Abre el archivo: **`supabase/FIX_COMPLETO.sql`**
2. Selecciona TODO el contenido (Ctrl/Cmd + A)
3. Copia (Ctrl/Cmd + C)
4. Pega en el SQL Editor de Supabase (Ctrl/Cmd + V)

### Paso 3: Ejecutar

1. Haz clic en el botón **"RUN"** (o presiona Ctrl/Cmd + Enter)
2. Espera ~5 segundos
3. Verás al final del resultado una tabla que dice:

```
🎯 TU PERFIL ACTUALIZADO
XP Total: 30
Nivel Actual: 1
Estado: ✅ Correcto (Nivel 1 hasta 349 XP)
```

---

## 🎉 ¡Listo!

Tu nivel está corregido. Ahora:

- ✅ **Con 30 XP** → Estás en **Nivel 1** (correcto)
- ✅ **Necesitas 350 XP** para llegar a **Nivel 2** (aprox 12 hábitos)
- ✅ La progresión ahora es **realista y satisfactoria**

---

## 📊 Nueva Tabla de Progresión

| Nivel | XP Necesario | Hábitos* | Días** |
|-------|-------------|----------|--------|
| 1     | 0           | 0        | -      |
| 2     | 350         | 12       | 4      |
| 3     | 440         | 15       | 5      |
| 5     | 551         | 18       | 6      |
| 10    | 971         | 33       | 11     |
| 20    | 3,015       | 101      | 34     |
| 30    | 9,363       | 313      | 104    |

*Asumiendo 30 XP por hábito (valor por defecto)
**Asumiendo 3 hábitos por día

---

## ❓ Si Algo Sale Mal

### El script dio error
- Asegúrate de copiar el archivo COMPLETO
- Verifica que estás en el proyecto correcto de Supabase
- Intenta de nuevo

### Mi nivel sigue siendo 3
Ejecuta esta query en SQL Editor:

```sql
UPDATE public.profiles
SET level = public.calculate_user_level(total_xp_earned)
WHERE id = auth.uid();

SELECT total_xp_earned, level FROM public.profiles WHERE id = auth.uid();
```

Deberías ver: `total_xp_earned: 30, level: 1`

### Necesito ayuda
1. Revisa el archivo `supabase/DEPLOYMENT_GUIDE.md` para más detalles
2. Verifica que ejecutaste TODO el script `FIX_COMPLETO.sql`

---

## 🎯 Verificación Final

Completa un hábito en la app y verifica que:
1. Tu XP aumenta correctamente
2. Tu nivel se mantiene en 1 (hasta llegar a 350 XP)
3. No hay errores en la consola del navegador

---

## 💡 Por Qué Pasó Esto

El sistema de niveles tenía una **fórmula incorrecta** en la base de datos:
- **Antes**: 150 base XP, multiplicador 1.08 (con bug) → 30 XP = Nivel 3 ❌
- **Ahora**: 350 base XP, multiplicador 1.12 → 30 XP = Nivel 1 ✅

El fix:
1. ✅ Corrigió la fórmula
2. ✅ Recalculó todos los niveles
3. ✅ Ahora la progresión es realista
