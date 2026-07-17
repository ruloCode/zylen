/**
 * meshy.ts — thin adapter over the Meshy REST API (docs.meshy.ai, jul 2026).
 *
 * All hero-forge Meshy calls live here so the state machine in index.ts
 * never touches endpoints directly. Endpoints (all /openapi/v1/):
 *   POST /image-to-3d                  → { result: taskId }
 *   GET  /image-to-3d/:id              → status/progress/model_urls.glb
 *   POST /rigging                      → { result: taskId }
 *   GET  /rigging/:id                  → rigged_character_glb_url
 *   POST /animations                   → { result: taskId }
 *   GET  /animations/:id               → animation_glb_url
 *
 * Download URLs (assets.meshy.ai) are presigned and NOT CORS-open to
 * browsers — index.ts downloads them server-side and re-hosts in storage.
 */

const MESHY_BASE = 'https://api.meshy.ai/openapi/v1';

export type MeshyTaskKind = 'model' | 'rig' | 'anim';

export interface MeshyTask {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  progress: number;
  /** GLB download URL, present when SUCCEEDED. */
  glbUrl?: string;
  error?: string;
}

export type MeshyErrorCode = 'meshy_credits_exhausted' | 'meshy_request_failed';

export class MeshyError extends Error {
  constructor(public code: MeshyErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'MeshyError';
  }
}

/** Animation library actions for the hero clip set. Same ids the bundled
 * heroes (Rulo/Dani) were built with: 0=Idle, 16=RunFast,
 * 125=Charged_Spell_Cast (docs.meshy.ai/en/api/animation-library). */
export const FORGE_ANIMS = [
  { key: 'idle', actionId: 0, clipName: 'Idle' },
  { key: 'run', actionId: 16, clipName: 'Run' },
  { key: 'attack', actionId: 125, clipName: 'Attack' },
] as const;

export type ForgeAnimKey = (typeof FORGE_ANIMS)[number]['key'];

const KIND_PATH: Record<MeshyTaskKind, string> = {
  model: 'image-to-3d',
  rig: 'rigging',
  anim: 'animations',
};

async function meshyFetch(
  apiKey: string,
  path: string,
  init?: RequestInit
): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(`${MESHY_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    throw new MeshyError('meshy_request_failed', `fetch ${path}: ${String(e).slice(0, 200)}`);
  }
  if (res.status === 402) {
    throw new MeshyError('meshy_credits_exhausted');
  }
  if (!res.ok) {
    const text = (await res.text()).slice(0, 300);
    throw new MeshyError('meshy_request_failed', `${path}: HTTP ${res.status} ${text}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

/** Extract the created task id — Meshy returns { result: "<id>" }. */
function taskId(data: Record<string, unknown>): string {
  const id = (data.result ?? data.id) as string | undefined;
  if (!id) throw new MeshyError('meshy_request_failed', 'no task id in response');
  return String(id);
}

/** Start image-to-3D from the public rig-sheet URL. pose_mode 'a-pose'
 * re-poses the sculpt for clean auto-rigging even if Gemini's A-pose is
 * imperfect. Polycount matches the bundled heroes (20k). */
export async function meshyCreateModel(apiKey: string, imageUrl: string): Promise<string> {
  return taskId(
    await meshyFetch(apiKey, '/image-to-3d', {
      method: 'POST',
      body: JSON.stringify({
        image_url: imageUrl,
        ai_model: 'latest',
        should_texture: true,
        topology: 'triangle',
        target_polycount: 20000,
        pose_mode: 'a-pose',
      }),
    })
  );
}

/** Auto-rig the finished sculpt. height_meters 1.2 = chibi proportions
 * (same as the bundled heroes); the game re-measures bones anyway. */
export async function meshyCreateRig(apiKey: string, modelTaskId: string): Promise<string> {
  return taskId(
    await meshyFetch(apiKey, '/rigging', {
      method: 'POST',
      body: JSON.stringify({ input_task_id: modelTaskId, height_meters: 1.2 }),
    })
  );
}

/** Apply one animation-library action to a SUCCEEDED rig task. */
export async function meshyCreateAnim(
  apiKey: string,
  rigTaskId: string,
  actionId: number
): Promise<string> {
  return taskId(
    await meshyFetch(apiKey, '/animations', {
      method: 'POST',
      body: JSON.stringify({ rig_task_id: rigTaskId, action_id: actionId }),
    })
  );
}

/** Poll any task kind into the common MeshyTask shape. */
export async function meshyGetTask(
  apiKey: string,
  kind: MeshyTaskKind,
  id: string
): Promise<MeshyTask> {
  const data = await meshyFetch(apiKey, `/${KIND_PATH[kind]}/${id}`);
  const status = String(data.status ?? 'PENDING') as MeshyTask['status'];
  // GLB result field differs per task kind.
  const glbUrl =
    kind === 'model'
      ? (data.model_urls as Record<string, string> | undefined)?.glb
      : kind === 'rig'
        ? ((data.result as Record<string, unknown> | undefined)?.rigged_character_glb_url as
            | string
            | undefined) ?? (data.rigged_character_glb_url as string | undefined)
        : ((data.result as Record<string, unknown> | undefined)?.animation_glb_url as
            | string
            | undefined) ?? (data.animation_glb_url as string | undefined);
  const error = (data.task_error as { message?: string } | undefined)?.message;
  return {
    id,
    status,
    progress: Number(data.progress ?? 0),
    glbUrl,
    error: error || undefined,
  };
}
