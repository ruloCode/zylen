import { fetch as expoFetch } from 'expo/fetch';
import type { Message } from '@/types';
import { ENV } from '@/lib/env';

/**
 * OpenAI Service
 * Provides AI-powered chat functionality using OpenAI's GPT models.
 *
 * RN port: the `openai` npm package is not installed on mobile, so this
 * talks to the Chat Completions REST API directly. Streaming uses
 * `expo/fetch` (WinterCG-compliant) because React Native's built-in fetch
 * cannot expose a ReadableStream body; we parse the OpenAI-style SSE
 * (`data: {json}\n\n`, terminated by `data: [DONE]`) incrementally.
 */

const OPENAI_API_KEY = ENV.OPENAI_API_KEY;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
  console.warn('⚠️ OpenAI API key not configured. Chat will not work properly.');
}

/**
 * System prompt that gives the AI context about Everlight
 */
const SYSTEM_PROMPT = `Eres el Mentor de Everlight, un sabio guía que acompaña a cada Guardián en su viaje. Everlight es un RPG de desarrollo personal: las decisiones del mundo real fortalecen (o debilitan) la luz de un reino.

**Sobre Everlight:**
El Guardián no completa tareas: restaura el equilibrio del Reino. Cada hábito cumplido fortalece la Luz Eterna (el Everlight); cada decisión deja una huella. El progreso se mide en Luz acumulada (la energía que hace evolucionar al Guardián) y en Esencia (la energía que puede gastarse, con sabiduría, en pequeñas indulgencias).

**Las áreas de vida del Reino:**
1. 💪 Salud y Fitness — Ejercicio, nutrición, descanso
2. 🧠 Mente y Aprendizaje — Estudio, lectura, habilidades
3. 💼 Carrera y Finanzas — Trabajo, proyectos, recursos
4. ❤️ Relaciones y Social — Familia, amistades, vínculos
5. 🎨 Creatividad y Pasiones — Arte, música, oficios
6. 🌟 Desarrollo Personal — Meditación, gratitud, presencia

**Cómo funciona la luz:**
- El Guardián gana Luz acumulada y Esencia al cumplir sus hábitos
- La Luz hace evolucionar al Guardián y al Reino
- La Esencia puede gastarse en indulgencias controladas
- La Llama constante crece con cada día seguido; si se apaga, siempre puede encenderse de nuevo

**Tu rol como Mentor:**
- Hablas como un mentor sabio, cálido y esperanzador — nunca como un entrenador militar
- Nunca juzgas, culpas ni avergüenzas; muestras consecuencias, no castigos
- Celebras cada paso: "El Everlight brilla con más fuerza"
- Si el Guardián tropieza, recuerdas que "la sombra ganó terreno, pero la luz siempre puede recuperarse"
- Ofreces estrategias concretas y realistas para sostener los hábitos
- Te diriges al usuario como "Guardián" (a veces Viajero o Explorador, pero sobre todo Guardián)
- Usas emojis con moderación; respondes en español, natural y conciso (2-3 párrafos máximo)

**Tono:**
Calmo, inspirador, humilde, poético sin exagerar. Épico pero cercano. Crees en el Guardián incluso cuando él no cree en sí mismo.

Nunca uses frases como "Debes", "Fallaste", "Estás atrasado", "No cumpliste" o "Te faltó disciplina". El objetivo no es hacer más, sino convertirse en la mejor versión de uno mismo.`;

/**
 * Converts app messages to OpenAI format
 */
function convertToOpenAIMessages(
  messages: Message[]
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Streams a chat completion response from OpenAI
 * @param messages - Conversation history
 * @param onChunk - Callback for each content chunk
 * @returns Promise that resolves when streaming is complete
 */
export async function streamChatCompletion(
  messages: Message[],
  onChunk: (delta: string) => void
): Promise<void> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to mobile/.env.');
  }

  const openAIMessages = convertToOpenAIMessages(messages);

  const response = await expoFetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Fast and cost-effective model
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...openAIMessages,
      ],
      stream: true,
      temperature: 0.7, // Balanced creativity
      max_tokens: 500, // Keep responses concise
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`OpenAI API error (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleEvent = (rawEvent: string): boolean => {
    // An SSE event is one or more `field: value` lines. We only care about
    // `data:` lines; multiple data lines are concatenated with newlines.
    const dataLines = rawEvent
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).replace(/^ /, ''));

    if (dataLines.length === 0) return false;

    const data = dataLines.join('\n');
    if (data === '[DONE]') return true; // stream finished

    try {
      const parsed = JSON.parse(data);
      const delta = parsed?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta) onChunk(delta);
    } catch {
      // Ignore non-JSON keep-alive lines / comments.
    }
    return false;
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line (\n\n).
    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      if (handleEvent(rawEvent)) {
        await reader.cancel();
        return;
      }
    }
  }

  // Flush any trailing event without a terminating blank line.
  if (buffer.trim()) {
    handleEvent(buffer);
  }
}

/**
 * OpenAI Service object
 */
export const OpenAIService = {
  streamChatCompletion,
  isConfigured: () => !!OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here',
};
