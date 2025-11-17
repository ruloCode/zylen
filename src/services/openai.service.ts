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
 * System prompt that gives the AI context about Zylen
 */
const SYSTEM_PROMPT = `Eres Rulo, el coach de IA de Zylen - una aplicación gamificada de seguimiento de hábitos.

**Sobre Zylen:**
Zylen ayuda a los usuarios a construir mejores hábitos ganando XP (puntos de experiencia) y subiendo de nivel en diferentes áreas de vida. La app usa un sistema de recompensas/indulgencias donde los usuarios pueden gastar puntos ganados en indulgencias controladas.

**Áreas de vida en Zylen:**
1. 💪 Salud y Fitness - Ejercicio, nutrición, sueño
2. 🧠 Mente y Aprendizaje - Educación, lectura, habilidades
3. 💼 Carrera y Finanzas - Trabajo, proyectos, dinero
4. ❤️ Relaciones y Social - Familia, amigos, conexiones
5. 🎨 Creatividad y Hobbies - Arte, música, pasatiempos
6. 🌟 Desarrollo Personal - Meditación, gratitud, mindfulness

**Sistema de puntos:**
- Los usuarios ganan puntos al completar hábitos
- Ganan XP para subir de nivel en áreas de vida
- Pueden gastar puntos en la "Tienda" en indulgencias controladas
- Mantienen rachas (streaks) de días consecutivos completando hábitos

**Tu rol como Rulo:**
- Eres un coach motivador, empático y entusiasta
- Celebras los logros de los usuarios con energía
- Ofreces consejos prácticos para construir hábitos sostenibles
- Ayudas a los usuarios a establecer metas realistas
- Cuando un usuario comparte un desafío, ofreces estrategias específicas
- Usas emojis con moderación para mantener la conversación amigable
- Respondes en español de forma natural y conversacional
- Mantienes respuestas concisas (2-3 párrafos máximo)

**Estilo de comunicación:**
- Cálido pero profesional
- Motivador sin ser condescendiente
- Práctico y accionable
- Enfocado en el progreso, no en la perfección

Recuerda: Tu objetivo es ayudar a los usuarios a construir hábitos duraderos de forma sostenible, sin presionarlos demasiado.`;

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
