/**
 * generate-avatar — Edge Function
 *
 * Secure Nano Banana (Gemini image) proxy that turns a user photo into the
 * app's chibi hero style. Two sequential generations on a solid magenta
 * chroma plate (Gemini can't output real alpha — the client keys it out):
 *
 *   1. Bust  (1:1)  — user photo + bust style reference
 *   2. Body  (2:3)  — generated bust + full-body style reference
 *
 * The client sends the style reference images (its own /avatars assets) so
 * the function stays asset-free and works against dev + prod frontends.
 * The function only authenticates, rate-limits (avatar_generations) and
 * calls Gemini with the server-side GEMINI_API_KEY. Storage upload and the
 * profiles update happen client-side (RLS: users write only their folder).
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Ordered fallback chain; first available model wins. Override the primary
// with the GEMINI_IMAGE_MODEL secret if a better Nano Banana ships.
const MODEL_CHAIN = [
  ...new Set(
    [
      Deno.env.get('GEMINI_IMAGE_MODEL'),
      'gemini-3-pro-image',
      'gemini-3.1-flash-image',
      'gemini-2.5-flash-image',
    ].filter(Boolean) as string[]
  ),
];

const MAX_GENERATIONS_PER_DAY = 5;

interface ImagePart {
  data: string; // base64, no data: prefix
  mimeType: string;
}

interface Payload {
  photo: ImagePart;
  styleBust: ImagePart;
  styleBody: ImagePart;
  gender?: string;
}

/** Shared style contract: solid magenta plate the client will key out. */
const MAGENTA_PLATE =
  'Background: one single flat solid magenta color (#FF00FF) covering every ' +
  'pixel behind the character — no gradients, no floor, no shadows cast on ' +
  'the background, no props, no text, no watermark.';

const STYLE =
  'glossy 3D chibi collectible-figurine render, Pixar-like, oversized head, ' +
  'huge expressive warm eyes, soft studio lighting';

function bustPrompt(): string {
  return (
    `Create a 3D chibi character portrait (head and shoulders bust) of the ` +
    `person in the first photo. EXACTLY match the art style of the second ` +
    `reference image: ${STYLE}. Preserve the person's real facial features ` +
    `so they are clearly recognizable: skin tone, face shape, hairstyle and ` +
    `hair color, facial hair, glasses and earrings if present. Friendly ` +
    `gentle smile, looking at the camera. Head and shoulders centered, ` +
    `filling most of the square canvas. ${MAGENTA_PLATE}`
  );
}

function bodyPrompt(): string {
  return (
    `Full body of the SAME character as the first image — identical face, ` +
    `hair, skin tone and glasses. EXACTLY match the art style and outfit ` +
    `language of the second reference image: ${STYLE}, dressed in ` +
    `ancient-fantasy garb (rustic tunic, leather straps and belt, weathered ` +
    `cloth, wrapped sandals) with a small glowing blue crystal amulet on ` +
    `the chest. Standing relaxed heroic pose, front view, gentle smile, ` +
    `whole body visible from the top of the head to the feet, feet flat on ` +
    `the ground, nothing cropped. ${MAGENTA_PLATE}`
  );
}

/** Call Gemini generateContent and return the first image part. */
async function generateImage(
  apiKey: string,
  prompt: string,
  refs: ImagePart[],
  aspectRatio: string
): Promise<{ image: ImagePart; model: string }> {
  let lastError = 'no model produced an image';

  for (const model of MODEL_CHAIN) {
    const parts = [
      ...refs.map((r) => ({
        inline_data: { mime_type: r.mimeType, data: r.data },
      })),
      { text: prompt },
    ];

    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio },
        },
      }),
    });

    if (!res.ok) {
      lastError = `${model}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`;
      continue; // fall through the model chain
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    for (const part of candidate?.content?.parts ?? []) {
      const inline = part.inlineData ?? part.inline_data;
      if (inline?.data) {
        return {
          image: {
            data: inline.data,
            mimeType: inline.mimeType ?? inline.mime_type ?? 'image/png',
          },
          model,
        };
      }
    }
    // No image part — usually a safety refusal; surface its text.
    const text = (candidate?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? '')
      .join(' ')
      .slice(0, 300);
    lastError = `${model}: no image (finishReason=${candidate?.finishReason ?? '?'}) ${text}`;
  }

  throw new Error(lastError);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return json({ error: 'missing_gemini_key' }, 500);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  // Identify the caller from their JWT.
  const authClient = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  );
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return json({ error: 'unauthorized' }, 401);
  }

  // Rate limit: N generations per user per (UTC) day.
  const admin = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from('avatar_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', dayStart.toISOString());
  if ((count ?? 0) >= MAX_GENERATIONS_PER_DAY) {
    return json({ error: 'daily_limit_reached' }, 429);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  for (const key of ['photo', 'styleBust', 'styleBody'] as const) {
    if (!payload[key]?.data || !payload[key]?.mimeType) {
      return json({ error: `missing_${key}` }, 400);
    }
  }

  // Count the generation before spending Gemini credits (fail-closed).
  await admin.from('avatar_generations').insert({ user_id: user.id });

  try {
    const bust = await generateImage(apiKey, bustPrompt(), [
      payload.photo,
      payload.styleBust,
    ], '1:1');

    // Anchor the body on the *stylized* bust so both share the same face.
    const body = await generateImage(apiKey, bodyPrompt(), [
      bust.image,
      payload.styleBody,
    ], '2:3');

    return json({ bust: bust.image, body: body.image, model: body.model });
  } catch (error) {
    console.error('generate-avatar failed:', error);
    return json(
      { error: 'generation_failed', detail: String(error).slice(0, 400) },
      502
    );
  }
});
