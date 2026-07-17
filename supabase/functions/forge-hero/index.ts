/**
 * forge-hero — Edge Function
 *
 * Persisted state machine that turns a user's AI avatar into THEIR rigged,
 * animated 3D arena hero via the Meshy API. The client drives it by polling
 * (`advance`) — Edge Functions cannot wait out the ~10-20 min pipeline, and
 * the user may close the app and resume later.
 *
 *   rig_image    client generated the A-pose sheet (generate-avatar mode:rig),
 *                uploaded it, and advance(rigImagePath) starts image-to-3d
 *   meshy_model  polling image-to-3d → on success start rigging
 *   meshy_rig    polling rigging     → on success start the 3 animations
 *   meshy_anim   polling animations  → all done → downloading (same request)
 *   downloading  EF re-hosts base+idle+run+attack GLBs into the avatars
 *                bucket (Meshy URLs are presigned and not browser-CORS-open)
 *   merging      client merges the 4 GLBs into one multi-clip hero GLB in
 *                the browser, uploads it, advance(modelPath) finishes
 *   done         profiles.hero_model_url updated; forge assets cleaned up
 *   failed       error_code carries the i18n key; does NOT consume cooldown
 *
 * Limits (server-side): one active forge per user (partial unique index) and
 * a 7-day cooldown after a successful forge.
 *
 * Error contract: 401 unauthorized · 409 forge_active_exists/invalid_state ·
 * 412 no_avatar · 429 forge_cooldown (+retryAt) · 404 forge_not_found ·
 * 500 missing_meshy_key · 502 meshy_* / download_failed
 */

import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  FORGE_ANIMS,
  MeshyError,
  meshyCreateAnim,
  meshyCreateModel,
  meshyCreateRig,
  meshyGetTask,
} from './meshy.ts';

const BASE_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
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

const BUCKET = 'avatars';
const COOLDOWN_DAYS = 7;
const ORPHAN_HOURS = 24;
const POLL_THROTTLE_MS = 5_000;
const MAX_DOWNLOAD_ATTEMPTS = 5;
/** Client error codes accepted by the `fail` action. */
const CLIENT_FAIL_CODES = new Set(['merge_failed']);

interface ForgeRow {
  id: string;
  user_id: string;
  status: string;
  error_code: string | null;
  gender: string | null;
  rig_image_path: string | null;
  meshy_model_task: string | null;
  meshy_rig_task: string | null;
  meshy_anim_tasks: Record<string, string>;
  glb_paths: Record<string, string | number>;
  model_url: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function publicUrl(admin: SupabaseClient, path: string): string {
  return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function updateForge(
  admin: SupabaseClient,
  id: string,
  patch: Record<string, unknown>
): Promise<ForgeRow> {
  const { data, error } = await admin
    .from('hero_forges')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(`forge update failed: ${error.message}`);
  return data as ForgeRow;
}

async function failForge(
  admin: SupabaseClient,
  id: string,
  code: string
): Promise<ForgeRow> {
  return updateForge(admin, id, { status: 'failed', error_code: code });
}

/** Download one Meshy GLB and re-host it in the avatars bucket (idempotent:
 * skips if this forge already stored it). Returns the storage path. */
async function rehostGlb(
  admin: SupabaseClient,
  forge: ForgeRow,
  key: string,
  meshyUrl: string
): Promise<string> {
  const existing = forge.glb_paths[key];
  if (typeof existing === 'string' && existing) return existing;
  const path = `${forge.user_id}/forge/${forge.id}/${key}.glb`;
  const res = await fetch(meshyUrl, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`download ${key}: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const { error } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: 'model/gltf-binary',
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) throw new Error(`upload ${key}: ${error.message}`);
  return path;
}

/** downloading stage: re-host all 4 GLBs (fresh presigned URLs re-polled per
 * task — the ones seen earlier may have expired). Resumable per file. */
async function runDownloads(
  admin: SupabaseClient,
  apiKey: string,
  forge: ForgeRow
): Promise<ForgeRow> {
  const paths: Record<string, string | number> = { ...forge.glb_paths };
  const sources: Array<{ key: string; kind: 'rig' | 'anim'; taskId: string }> = [
    { key: 'base', kind: 'rig', taskId: forge.meshy_rig_task! },
    ...FORGE_ANIMS.map((a) => ({
      key: a.key as string,
      kind: 'anim' as const,
      taskId: forge.meshy_anim_tasks[a.key],
    })),
  ];
  try {
    for (const src of sources) {
      if (typeof paths[src.key] === 'string' && paths[src.key]) continue;
      const task = await meshyGetTask(apiKey, src.kind, src.taskId);
      if (!task.glbUrl) throw new Error(`no glb url for ${src.key} (${task.status})`);
      paths[src.key] = await rehostGlb(admin, { ...forge, glb_paths: paths }, src.key, task.glbUrl);
      // persist per-file so a timeout resumes instead of re-downloading
      forge = await updateForge(admin, forge.id, { glb_paths: paths });
    }
    return updateForge(admin, forge.id, { status: 'merging', glb_paths: paths });
  } catch (e) {
    const attempts = Number(paths._attempts ?? 0) + 1;
    console.error(`forge ${forge.id} download attempt ${attempts}:`, e);
    if (attempts >= MAX_DOWNLOAD_ATTEMPTS) {
      return failForge(admin, forge.id, 'download_failed');
    }
    return updateForge(admin, forge.id, {
      status: 'downloading',
      glb_paths: { ...paths, _attempts: attempts },
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return json(req, { error: 'method_not_allowed' }, 405);
  }

  const meshyKey = Deno.env.get('MESHY_API_KEY');
  if (!meshyKey) {
    return json(req, { error: 'missing_meshy_key' }, 500);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return json(req, { error: 'unauthorized' }, 401);
  }

  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let payload: {
    action?: string;
    forgeId?: string;
    rigImagePath?: string;
    modelPath?: string;
    code?: string;
    gender?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: 'invalid_json' }, 400);
  }

  // ---------------- start ----------------
  if (payload.action === 'start') {
    const { data: profile } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();
    if (!profile?.avatar_url) {
      return json(req, { error: 'no_avatar' }, 412);
    }

    // Reap orphaned forges (client vanished mid-pipeline) so the unique
    // index doesn't lock the user out forever.
    await admin
      .from('hero_forges')
      .update({ status: 'failed', error_code: 'forge_failed' })
      .eq('user_id', user.id)
      .not('status', 'in', '("done","failed")')
      .lt('updated_at', new Date(Date.now() - ORPHAN_HOURS * 3600_000).toISOString());

    // Weekly cooldown counted from the last successful forge.
    const { data: lastDone } = await admin
      .from('hero_forges')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastDone?.completed_at) {
      const retryAt = new Date(
        new Date(lastDone.completed_at).getTime() + COOLDOWN_DAYS * 86400_000
      );
      if (retryAt.getTime() > Date.now()) {
        return json(req, { error: 'forge_cooldown', retryAt: retryAt.toISOString() }, 429);
      }
    }

    const { data: created, error } = await admin
      .from('hero_forges')
      .insert({ user_id: user.id, gender: payload.gender ?? null })
      .select('*')
      .single();
    if (error) {
      // 23505 = unique violation on the partial index → an active forge
      // already exists; return it so the client resumes instead of erroring.
      if (error.code === '23505') {
        const { data: active } = await admin
          .from('hero_forges')
          .select('*')
          .eq('user_id', user.id)
          .not('status', 'in', '("done","failed")')
          .limit(1)
          .maybeSingle();
        return json(req, { error: 'forge_active_exists', forge: active }, 409);
      }
      return json(req, { error: 'forge_failed', detail: error.message }, 500);
    }
    return json(req, { forge: created });
  }

  // ---------------- advance / fail ----------------
  if (payload.action !== 'advance' && payload.action !== 'fail') {
    return json(req, { error: 'unknown_action' }, 400);
  }
  if (!payload.forgeId) {
    return json(req, { error: 'missing_forge_id' }, 400);
  }
  const { data: forgeData } = await admin
    .from('hero_forges')
    .select('*')
    .eq('id', payload.forgeId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!forgeData) {
    return json(req, { error: 'forge_not_found' }, 404);
  }
  let forge = forgeData as ForgeRow;

  if (payload.action === 'fail') {
    if (!CLIENT_FAIL_CODES.has(payload.code ?? '')) {
      return json(req, { error: 'invalid_code' }, 400);
    }
    if (forge.status === 'done' || forge.status === 'failed') {
      return json(req, { forge });
    }
    forge = await failForge(admin, forge.id, payload.code!);
    return json(req, { forge });
  }

  // Terminal states are idempotent.
  if (forge.status === 'done') return json(req, { forge, done: true });
  if (forge.status === 'failed') return json(req, { forge });

  try {
    switch (forge.status) {
      case 'rig_image': {
        const expected = `${user.id}/forge/${forge.id}/rig.png`;
        if (payload.rigImagePath !== expected) {
          return json(req, { forge, waiting: true }); // sheet not uploaded yet
        }
        const { data: files } = await admin.storage
          .from(BUCKET)
          .list(`${user.id}/forge/${forge.id}`);
        if (!files?.some((f) => f.name === 'rig.png')) {
          return json(req, { error: 'rig_image_missing' }, 400);
        }
        const taskId = await meshyCreateModel(meshyKey, publicUrl(admin, expected));
        forge = await updateForge(admin, forge.id, {
          status: 'meshy_model',
          rig_image_path: expected,
          meshy_model_task: taskId,
        });
        return json(req, { forge, waiting: true, progress: { stage: 'model', pct: 0 } });
      }

      case 'meshy_model': {
        if (Date.now() - new Date(forge.updated_at).getTime() < POLL_THROTTLE_MS) {
          return json(req, { forge, waiting: true, progress: { stage: 'model', pct: 0 } });
        }
        const task = await meshyGetTask(meshyKey, 'model', forge.meshy_model_task!);
        if (task.status === 'FAILED' || task.status === 'CANCELED') {
          forge = await failForge(admin, forge.id, 'meshy_model_failed');
          return json(req, { forge });
        }
        if (task.status !== 'SUCCEEDED') {
          forge = await updateForge(admin, forge.id, {}); // touch for throttle
          return json(req, {
            forge,
            waiting: true,
            progress: { stage: 'model', pct: task.progress },
          });
        }
        const rigId = await meshyCreateRig(meshyKey, forge.meshy_model_task!);
        forge = await updateForge(admin, forge.id, {
          status: 'meshy_rig',
          meshy_rig_task: rigId,
        });
        return json(req, { forge, waiting: true, progress: { stage: 'skeleton', pct: 0 } });
      }

      case 'meshy_rig': {
        if (Date.now() - new Date(forge.updated_at).getTime() < POLL_THROTTLE_MS) {
          return json(req, { forge, waiting: true, progress: { stage: 'skeleton', pct: 0 } });
        }
        const task = await meshyGetTask(meshyKey, 'rig', forge.meshy_rig_task!);
        if (task.status === 'FAILED' || task.status === 'CANCELED') {
          forge = await failForge(admin, forge.id, 'meshy_rig_failed');
          return json(req, { forge });
        }
        if (task.status !== 'SUCCEEDED') {
          forge = await updateForge(admin, forge.id, {});
          return json(req, {
            forge,
            waiting: true,
            progress: { stage: 'skeleton', pct: task.progress },
          });
        }
        const animTasks: Record<string, string> = {};
        for (const anim of FORGE_ANIMS) {
          animTasks[anim.key] = await meshyCreateAnim(
            meshyKey,
            forge.meshy_rig_task!,
            anim.actionId
          );
        }
        forge = await updateForge(admin, forge.id, {
          status: 'meshy_anim',
          meshy_anim_tasks: animTasks,
        });
        return json(req, { forge, waiting: true, progress: { stage: 'anims', pct: 0 } });
      }

      case 'meshy_anim': {
        if (Date.now() - new Date(forge.updated_at).getTime() < POLL_THROTTLE_MS) {
          return json(req, { forge, waiting: true, progress: { stage: 'anims', pct: 0 } });
        }
        let totalPct = 0;
        for (const anim of FORGE_ANIMS) {
          const task = await meshyGetTask(meshyKey, 'anim', forge.meshy_anim_tasks[anim.key]);
          if (task.status === 'FAILED' || task.status === 'CANCELED') {
            forge = await failForge(admin, forge.id, 'meshy_anim_failed');
            return json(req, { forge });
          }
          if (task.status !== 'SUCCEEDED') {
            forge = await updateForge(admin, forge.id, {});
            return json(req, {
              forge,
              waiting: true,
              progress: { stage: 'anims', pct: Math.round(totalPct / FORGE_ANIMS.length) },
            });
          }
          totalPct += 100;
        }
        // All clips ready — re-host everything now, in this same request.
        forge = await updateForge(admin, forge.id, { status: 'downloading' });
        forge = await runDownloads(admin, meshyKey, forge);
        if (forge.status === 'merging') {
          return json(req, { forge, waiting: false, urls: mergeUrls(admin, forge) });
        }
        return json(req, { forge, waiting: forge.status === 'downloading' });
      }

      case 'downloading': {
        forge = await runDownloads(admin, meshyKey, forge);
        if (forge.status === 'merging') {
          return json(req, { forge, waiting: false, urls: mergeUrls(admin, forge) });
        }
        return json(req, { forge, waiting: forge.status === 'downloading' });
      }

      case 'merging': {
        if (!payload.modelPath) {
          return json(req, { forge, waiting: false, urls: mergeUrls(admin, forge) });
        }
        const pattern = new RegExp(`^${user.id}/hero-\\d+\\.glb$`);
        if (!pattern.test(payload.modelPath)) {
          return json(req, { error: 'invalid_model_path' }, 400);
        }
        const { data: files } = await admin.storage.from(BUCKET).list(user.id);
        const fileName = payload.modelPath.slice(user.id.length + 1);
        if (!files?.some((f) => f.name === fileName)) {
          return json(req, { error: 'model_missing' }, 400);
        }
        const modelUrl = publicUrl(admin, payload.modelPath);
        forge = await updateForge(admin, forge.id, {
          status: 'done',
          model_url: modelUrl,
          completed_at: new Date().toISOString(),
        });
        await admin.from('profiles').update({ hero_model_url: modelUrl }).eq('id', user.id);

        // Best-effort cleanup: intermediate forge files + superseded heroes.
        try {
          const store = admin.storage.from(BUCKET);
          const { data: forgeFiles } = await store.list(`${user.id}/forge/${forge.id}`);
          const stale = (forgeFiles ?? []).map(
            (f) => `${user.id}/forge/${forge.id}/${f.name}`
          );
          const oldHeroes = (files ?? [])
            .filter((f) => /^hero-\d+\.glb$/.test(f.name) && f.name !== fileName)
            .map((f) => `${user.id}/${f.name}`);
          const all = [...stale, ...oldHeroes];
          if (all.length) await store.remove(all);
        } catch (cleanupErr) {
          console.warn('forge cleanup failed:', cleanupErr);
        }
        return json(req, { forge, done: true });
      }

      default:
        return json(req, { error: 'invalid_state' }, 409);
    }
  } catch (error) {
    console.error(`forge ${forge.id} advance failed:`, error);
    if (error instanceof MeshyError && error.code === 'meshy_credits_exhausted') {
      forge = await failForge(admin, forge.id, 'meshy_credits_exhausted');
      return json(req, { forge }, 502);
    }
    // Transient (network/Meshy hiccup): keep the state, let the client retry.
    return json(req, { forge, waiting: true, transient: String(error).slice(0, 200) });
  }
});

function mergeUrls(
  admin: SupabaseClient,
  forge: ForgeRow
): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const key of ['base', ...FORGE_ANIMS.map((a) => a.key)]) {
    const path = forge.glb_paths[key];
    if (typeof path === 'string') urls[key] = publicUrl(admin, path);
  }
  return urls;
}
