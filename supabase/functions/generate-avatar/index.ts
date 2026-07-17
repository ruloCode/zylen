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
 *
 * Error contract (client maps these to i18n messages):
 *   401 unauthorized · 429 daily_limit_reached · 422 photo_rejected
 *   502 generation_failed · 4xx/5xx misc
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const BASE_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Fallback when the browser doesn't declare its headers. NOTE: the app's
// Supabase client attaches custom global headers (x-application-name), so
// the preflight MUST reflect Access-Control-Request-Headers — a static list
// silently rejected the preflight in the browser and the POST never left
// the device (server logs showed OPTIONS 200 with no POST after it).
const DEFAULT_ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-application-name';

function corsHeaders(req: Request): Record<string, string> {
  return {
    ...BASE_CORS,
    'Access-Control-Allow-Headers':
      req.headers.get('Access-Control-Request-Headers') ?? DEFAULT_ALLOW_HEADERS,
    Vary: 'Access-Control-Request-Headers',
  };
}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Ordered fallback chain; first available model wins. Override the primary
// with the GEMINI_IMAGE_MODEL secret. gemini-3.1-flash-image is the sweet
// spot (measured 2026-07-11): fast, accepts real identifiable faces, and
// actually honors the pure-magenta plate (border dist-to-#FF00FF ≈ 9).
// 2.5-flash blends the refs' dark bg into a maroon plate the client can't
// key; 3-pro is slow (~35s) and stricter with real faces.
const MODEL_CHAIN = [
  ...new Set(
    [
      Deno.env.get('GEMINI_IMAGE_MODEL'),
      'gemini-3.1-flash-image',
      'gemini-2.5-flash-image',
      'gemini-3-pro-image',
    ].filter(Boolean) as string[]
  ),
];

const MAX_GENERATIONS_PER_DAY = 5;
/** Per-Gemini-call budget; lets the chain fall through instead of the
 * platform killing the whole request (which strips CORS headers). */
const CALL_TIMEOUT_MS = 90_000;

/** finishReason values that mean "the input/output was refused", not "the
 * service failed" — surfaced to the user as photo_rejected. */
const SAFETY_REASONS = new Set([
  'SAFETY',
  'IMAGE_SAFETY',
  'PROHIBITED_CONTENT',
  'BLOCKLIST',
  'RECITATION',
]);

interface ImagePart {
  data: string; // base64, no data: prefix
  mimeType: string;
}

interface Payload {
  /** 'rig' renders the A-pose rig sheet for the 3D hero forge (one image);
   * default (absent) is the normal bust+body avatar generation. */
  mode?: 'rig';
  photo?: ImagePart;
  styleBust?: ImagePart;
  styleBody?: ImagePart;
  /** rig mode: the user's already-stylized bust (downloaded client-side). */
  bust?: ImagePart;
  gender?: string;
}

class GenerationError extends Error {
  constructor(public kind: 'rejected' | 'failed', message: string) {
    super(message);
  }
}

/** Shared style contract: solid magenta plate the client will key out.
 * Worded aggressively because flash models tend to blend the plate with the
 * reference images' implied dark backgrounds, producing maroon instead of
 * pure magenta (which the client-side chroma key cannot remove). */
const MAGENTA_PLATE =
  'CRITICAL BACKGROUND REQUIREMENT: the entire background must be one ' +
  'perfectly uniform, PURE, FULLY SATURATED, BRIGHT NEON MAGENTA ' +
  '(#FF00FF, rgb(255,0,255)) chroma-key plate from edge to edge — exactly ' +
  'like a greenscreen but magenta. NO vignette, NO gradient, NO texture, ' +
  'NO floor, NO shadows on the background, NO dark magenta, NO maroon, NO ' +
  'purple, no other shade. Completely ignore the background of the ' +
  'reference images. No props, no text, no watermark.';

const STYLE =
  'glossy 3D chibi collectible-figurine render, Pixar-like, oversized head, ' +
  'huge expressive warm eyes, soft studio lighting';

// The style refs picture a specific character who wears glasses — without
// the "different character / accessories only from the photo" firewall the
// model copies those glasses onto every user.
function bustPrompt(): string {
  return (
    `Create a 3D chibi character portrait (head and shoulders bust) of the ` +
    `person in the first photo. Use the second reference image ONLY for art ` +
    `style: ${STYLE}. The reference shows a DIFFERENT character — never copy ` +
    `that character's face, hairstyle, skin tone, facial hair, glasses or ` +
    `accessories. Faithfully preserve THIS person's real features from the ` +
    `photo so they are clearly recognizable: skin tone, face shape, ` +
    `hairstyle and hair color, and facial hair exactly as in the photo. ` +
    `Accessories rule: add glasses, earrings or headwear ONLY if the person ` +
    `is clearly wearing them in the photo; if they are not, the character ` +
    `must have NO glasses and NO accessories at all. Friendly gentle smile, ` +
    `looking at the camera. Head and shoulders centered, filling most of ` +
    `the square canvas. ${MAGENTA_PLATE}`
  );
}

function bodyPrompt(): string {
  return (
    `Full body of the SAME character as the first image — identical face, ` +
    `hair and skin tone. Keep glasses or accessories ONLY if the character ` +
    `in the first image has them; do not add any new ones. Use the second ` +
    `reference image ONLY for art style and outfit language: ${STYLE}, ` +
    `dressed in ancient-fantasy garb (rustic tunic, leather straps and ` +
    `belt, weathered cloth, wrapped sandals) with a small glowing blue ` +
    `crystal amulet on the chest. Standing relaxed heroic pose, front view, ` +
    `gentle smile, whole body visible from the top of the head to the feet, ` +
    `feet flat on the ground, nothing cropped. ${MAGENTA_PLATE}`
  );
}

/** Rig sheet for image-to-3D: strict A-pose, empty hands (the staff is
 * procedural in the game), clean silhouette for Meshy auto-rigging. */
function rigPrompt(): string {
  return (
    `Full body of the SAME character as the first image — identical face, ` +
    `hair, skin tone and glasses. EXACTLY match the art style and outfit ` +
    `language of the second reference image: ${STYLE}, dressed in ` +
    `ancient-fantasy garb (rustic tunic, leather straps and belt, weathered ` +
    `cloth, wrapped sandals) with a small glowing blue crystal amulet on ` +
    `the chest. POSE REQUIREMENT (critical, for 3D rigging): strict A-pose — ` +
    `standing perfectly straight facing the camera, both arms fully ` +
    `straight and raised about 45 degrees away from the torso (clearly ` +
    `separated from the body), palms open facing down, fingers together, ` +
    `legs straight and slightly apart, feet flat on the ground, neutral ` +
    `calm expression looking forward. HANDS COMPLETELY EMPTY — no staff, ` +
    `no weapon, nothing held, nothing attached to the hands. Whole body ` +
    `visible from the top of the head to the feet, nothing cropped, no ` +
    `overlapping limbs. ${MAGENTA_PLATE}`
  );
}

/** Call Gemini generateContent through the model chain; first image wins. */
async function generateImage(
  apiKey: string,
  prompt: string,
  refs: ImagePart[],
  aspectRatio: string
): Promise<{ image: ImagePart; model: string }> {
  let lastError = 'no model produced an image';
  let sawSafetyRefusal = false;

  for (const model of MODEL_CHAIN) {
    const parts = [
      ...refs.map((r) => ({
        inline_data: { mime_type: r.mimeType, data: r.data },
      })),
      { text: prompt },
    ];

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/${model}:generateContent`, {
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
        signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      });
    } catch (fetchError) {
      lastError = `${model}: ${String(fetchError).slice(0, 200)}`;
      continue; // timeout / network — try the next model
    }

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

    // No image part — usually a safety refusal; record why.
    const finishReason: string =
      candidate?.finishReason ?? data.promptFeedback?.blockReason ?? '?';
    if (SAFETY_REASONS.has(finishReason)) sawSafetyRefusal = true;
    const text = (candidate?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? '')
      .join(' ')
      .slice(0, 300);
    lastError = `${model}: no image (finishReason=${finishReason}) ${text}`;
  }

  throw new GenerationError(sawSafetyRefusal ? 'rejected' : 'failed', lastError);
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return json(req, { error: 'method_not_allowed' }, 405);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return json(req, { error: 'missing_gemini_key' }, 500);
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
    return json(req, { error: 'unauthorized' }, 401);
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
    return json(req, { error: 'daily_limit_reached' }, 429);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: 'invalid_json' }, 400);
  }
  const isRig = payload.mode === 'rig';
  const required = isRig
    ? (['bust', 'styleBody'] as const)
    : (['photo', 'styleBust', 'styleBody'] as const);
  for (const key of required) {
    if (!payload[key]?.data || !payload[key]?.mimeType) {
      return json(req, { error: `missing_${key}` }, 400);
    }
  }

  // Count the generation before spending Gemini credits (fail-closed), but
  // refund the slot if the whole generation fails — failed attempts must
  // not eat the user's daily quota.
  const { data: genRow } = await admin
    .from('avatar_generations')
    .insert({ user_id: user.id })
    .select('id')
    .single();

  try {
    if (isRig) {
      // One render: A-pose rig sheet anchored on the user's stylized bust.
      const rig = await generateImage(apiKey, rigPrompt(), [
        payload.bust!,
        payload.styleBody!,
      ], '2:3');
      return json(req, { rig: rig.image, model: rig.model });
    }

    const bust = await generateImage(apiKey, bustPrompt(), [
      payload.photo!,
      payload.styleBust!,
    ], '1:1');

    // Anchor the body on the *stylized* bust so both share the same face.
    const body = await generateImage(apiKey, bodyPrompt(), [
      bust.image,
      payload.styleBody!,
    ], '2:3');

    return json(req, { bust: bust.image, body: body.image, model: body.model });
  } catch (error) {
    console.error('generate-avatar failed:', error);
    if (genRow?.id) {
      await admin.from('avatar_generations').delete().eq('id', genRow.id);
    }
    const rejected = error instanceof GenerationError && error.kind === 'rejected';
    return json(
      req,
      {
        error: rejected ? 'photo_rejected' : 'generation_failed',
        detail: String(error).slice(0, 400),
      },
      rejected ? 422 : 502
    );
  }
});
