# Integración del Chatbot con OpenAI

## Resumen

El chatbot de Zylen ahora está integrado con OpenAI GPT-4o-mini para proporcionar respuestas de IA reales en lugar de respuestas simuladas. El asistente de IA (Rulo) conoce todo sobre Zylen y puede ayudar a los usuarios con consejos personalizados sobre hábitos, motivación y más.

## Características

✅ **Streaming en tiempo real** - Las respuestas aparecen palabra por palabra mientras se generan
✅ **Contexto de Zylen** - El AI conoce todas las áreas de vida, sistema de puntos y características de la app
✅ **Personalidad de Coach** - Rulo es un coach motivador, empático y entusiasta
✅ **Manejo de errores** - Muestra mensajes de error claros si hay problemas
✅ **Optimizado para costos** - Usa GPT-4o-mini (modelo rápido y económico)

## Configuración

### 1. Obtener tu API Key de OpenAI

1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Haz clic en "Create new secret key"
4. Copia la clave (empieza con `sk-proj-...`)

### 2. Configurar la variable de entorno

Abre el archivo [.env.local](.env.local) y reemplaza:

```env
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

Con tu clave real:

```env
VITE_OPENAI_API_KEY=sk-proj-...tu-clave-aqui...
```

### 3. Reiniciar el servidor de desarrollo

Si el servidor está corriendo, detenlo (Ctrl+C) y vuelve a iniciarlo:

```bash
pnpm run dev
```

## Uso

1. Ve a la página de Chat en la aplicación
2. Escribe un mensaje y envíalo
3. Rulo responderá en tiempo real con streaming

### Ejemplos de preguntas que puedes hacer:

- "¿Cómo puedo mantener una racha de ejercicio?"
- "Dame consejos para levantarme temprano"
- "¿Qué hábitos debería agregar para mejorar mi salud?"
- "Me siento desmotivado, ¿qué me recomiendas?"
- "¿Cómo puedo equilibrar trabajo y vida personal?"

## Personalidad de Rulo (el Coach de IA)

**Rulo es:**
- Motivador pero no condescendiente
- Empático y entusiasta
- Práctico y accionable
- Enfocado en el progreso, no en la perfección
- Responde en español de forma natural
- Mantiene respuestas concisas (2-3 párrafos)

**Contexto que Rulo conoce:**
- Las 6 áreas de vida de Zylen
- Sistema de puntos y XP
- Rachas (streaks)
- Sistema de indulgencias
- Cómo funciona la gamificación

## Arquitectura Técnica

### Archivos modificados/creados:

1. **[src/services/openai.service.ts](src/services/openai.service.ts)**
   - Servicio que maneja la comunicación con OpenAI
   - Implementa streaming de respuestas
   - Define el prompt del sistema con contexto de Zylen

2. **[src/store/chatSlice.ts](src/store/chatSlice.ts)**
   - Actualizado para soportar streaming
   - Nuevas acciones: `startStreamingMessage`, `updateStreamingMessage`, `finishStreamingMessage`

3. **[src/pages/Chat.tsx](src/pages/Chat.tsx)**
   - Actualizado para usar OpenAI en lugar de respuestas simuladas
   - Implementa manejo de errores
   - Muestra mensajes de error al usuario

### Modelo utilizado:

**GPT-4o-mini**
- Modelo rápido y económico de OpenAI
- Excelente para aplicaciones de chat
- Costo aproximado: $0.15 por 1M de tokens de entrada, $0.60 por 1M de tokens de salida
- Límite de tokens por respuesta: 500 (para mantener respuestas concisas)

## Configuración de costos

### Configuración actual:
- `model: 'gpt-4o-mini'` - Modelo económico
- `temperature: 0.7` - Equilibrio entre creatividad y coherencia
- `max_tokens: 500` - Límite para mantener respuestas concisas

### Costos estimados:
Con un uso moderado (50 mensajes al día):
- ~15,000 mensajes al mes
- Costo aproximado: $5-10 USD/mes

**Nota:** Los costos varían según el uso. Monitorea tu uso en [platform.openai.com/usage](https://platform.openai.com/usage)

## Seguridad

⚠️ **IMPORTANTE:**
- La API key se usa en el cliente (`dangerouslyAllowBrowser: true`)
- Esto está bien para desarrollo/prototipos
- Para producción, considera usar un backend proxy para proteger tu API key

### Recomendación para producción:

Crear un endpoint backend que:
1. Reciba mensajes del cliente
2. Llame a OpenAI desde el servidor
3. Devuelva las respuestas al cliente

Esto protege tu API key y te permite:
- Implementar rate limiting
- Filtrar contenido
- Monitorear uso por usuario

## Solución de problemas

### Error: "OpenAI API key not configured"
- Verifica que agregaste la clave en `.env.local`
- Asegúrate de que la variable empieza con `VITE_`
- Reinicia el servidor de desarrollo

### Error de red o timeout
- Verifica tu conexión a internet
- Revisa el status de OpenAI en [status.openai.com](https://status.openai.com)

### Respuestas lentas
- GPT-4o-mini es rápido, pero depende de tu conexión
- El streaming debería mostrar texto mientras se genera

### Errores de límite de rate
- OpenAI tiene límites de uso por minuto
- Espera unos segundos antes de reintentar
- Considera implementar rate limiting en el cliente

## Próximos pasos (opcional)

### Mejoras sugeridas:

1. **Persistencia de conversaciones**
   - Guardar historial en localStorage o base de datos
   - Permitir múltiples conversaciones

2. **Contexto del usuario**
   - Pasar información de hábitos del usuario al AI
   - Sugerencias personalizadas basadas en progreso real

3. **Funciones adicionales**
   - Generación de planes de hábitos
   - Análisis de patrones de comportamiento
   - Recordatorios inteligentes

4. **Backend proxy** (producción)
   - Proteger API key
   - Implementar autenticación
   - Rate limiting por usuario

## Recursos

- [Documentación de OpenAI](https://platform.openai.com/docs)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [Guía de streaming](https://platform.openai.com/docs/guides/streaming)
- [Precios de OpenAI](https://openai.com/pricing)
