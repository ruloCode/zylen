import OpenAI from 'openai';
import type { Message } from '@/types';

/**
 * OpenAI Service
 * Provides AI-powered chat functionality using OpenAI's GPT models
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
  console.warn('⚠️ OpenAI API key not configured. Chat will not work properly.');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

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
function convertToOpenAIMessages(messages: Message[]): OpenAI.Chat.ChatCompletionMessageParam[] {
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
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env.local file.');
  }

  const openAIMessages = convertToOpenAIMessages(messages);

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Fast and cost-effective model
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...openAIMessages,
    ],
    stream: true,
    temperature: 0.7, // Balanced creativity
    max_tokens: 500, // Keep responses concise
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      onChunk(delta);
    }
  }
}

/**
 * OpenAI Service object
 */
export const OpenAIService = {
  streamChatCompletion,
  isConfigured: () => !!OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key-here',
};
