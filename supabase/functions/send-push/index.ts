/**
 * send-push — Edge Function
 *
 * Único emisor de notificaciones push de Zylen. Lo invocan los triggers de
 * base de datos (pg_net → fn_notify_push) cuando ocurre un evento social:
 *
 *   friend_request  → "@user quiere ser tu aliado"        → abre /social
 *   friend_accept   → "@user aceptó tu solicitud"          → abre /social
 *   arena_invite    → "@user te reta en la Arena"          → abre /arena (con
 *                     &room= del invitador para entrar a SU sala)
 *   chat_message    → "@user: <snippet>"                    → abre /messages/{id}
 *   post_reaction   → "@user reaccionó a tu progreso"       → abre /leaderboard
 *   test            → payload.title/body tal cual           → abre payload.url
 *
 * Envía DIRECTO por FCM HTTP v1 (sin Expo Push Service): el cliente registra
 * el token nativo del dispositivo (getDevicePushTokenAsync) en push_tokens y
 * aquí se firma un JWT del service account (secret FCM_SERVICE_ACCOUNT) para
 * obtener el access token de Google. El texto se localiza con
 * push_tokens.locale (es/en). Tokens muertos (UNREGISTERED) se eliminan.
 *
 * Seguridad: se despliega con --no-verify-jwt (la llama Postgres, no un
 * usuario); exige el header x-push-secret == secret PUSH_TRIGGER_SECRET.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

type PushType =
  | 'friend_request'
  | 'friend_accept'
  | 'arena_invite'
  | 'chat_message'
  | 'post_reaction'
  | 'post_verified'
  | 'test';

interface PushRequest {
  type: PushType;
  user_ids?: string[];
  payload?: Record<string, unknown>;
  /** Directo a tokens concretos (pruebas), saltando la consulta a push_tokens */
  tokens?: { token: string; locale?: string }[];
}

interface TokenRow {
  token: string;
  user_id: string;
  locale: string;
}

// --- Plantillas localizadas -------------------------------------------------

interface Message {
  title: string;
  body: string;
  url: string;
  channelId: 'social' | 'arena' | 'coach';
  /** FCM collapse tag: mensajes de la misma conversación reemplazan al anterior */
  tag?: string;
}

/** Misma sanitización de sala que Arena.tsx (web y mobile). */
function arenaRoomFor(userId: string): string {
  return `el-${userId.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()}`;
}

const REACTION_EMOJI: Record<string, string> = {
  fire: '🔥',
  flex: '💪',
  clap: '👏',
  heart: '💛',
};

function buildMessage(
  type: PushType,
  locale: string,
  payload: Record<string, unknown>
): Message {
  const es = !locale.toLowerCase().startsWith('en');
  const username = String(payload.username ?? '???');

  switch (type) {
    case 'friend_request':
      return {
        title: es ? '⚔️ Nueva solicitud de alianza' : '⚔️ New ally request',
        body: es
          ? `@${username} quiere unir fuerzas contigo. Entra y responde a su llamado.`
          : `@${username} wants to join forces with you. Open Zylen to answer the call.`,
        url: '/social',
        channelId: 'social',
      };
    case 'friend_accept':
      return {
        title: es ? '🤝 ¡Alianza forjada!' : '🤝 Alliance forged!',
        body: es
          ? `@${username} aceptó tu solicitud. Ya luchan del mismo lado.`
          : `@${username} accepted your request. You now fight side by side.`,
        url: '/social',
        channelId: 'social',
      };
    case 'arena_invite': {
      // Con inviter_id armamos la sala del invitador; sin él el deep link
      // cae a la sala propia (comportamiento previo).
      const room = payload.inviter_id
        ? `&room=${arenaRoomFor(String(payload.inviter_id))}`
        : '';
      return {
        title: es ? '🏟️ Te retan en la Arena' : '🏟️ Arena challenge!',
        body: es
          ? `@${username} te invita al Templo del Desorden. ¿Aceptas el desafío?`
          : `@${username} invites you to the Temple of Disorder. Do you accept?`,
        url: `/arena?invite=${String(payload.invite_id ?? '')}${room}`,
        channelId: 'arena',
      };
    }
    case 'chat_message': {
      const isImage = payload.kind === 'image';
      const snippet = String(payload.snippet ?? '').trim();
      return {
        title: `💬 @${username}`,
        body: isImage
          ? (es ? '📷 Te envió una foto' : '📷 Sent you a photo')
          : snippet || (es ? 'Nuevo mensaje' : 'New message'),
        url: `/messages/${String(payload.conversation_id ?? '')}`,
        channelId: 'social',
        tag: String(payload.conversation_id ?? ''),
      };
    }
    case 'post_reaction': {
      const emoji = REACTION_EMOJI[String(payload.reaction ?? '')] ?? '🔥';
      return {
        title: es ? `${emoji} Tu progreso inspira` : `${emoji} Your progress inspires`,
        body: es
          ? `@${username} reaccionó ${emoji} a tu foto de progreso.`
          : `@${username} reacted ${emoji} to your progress photo.`,
        url: '/leaderboard?tab=social',
        channelId: 'social',
      };
    }
    case 'post_verified': {
      const xp = Number(payload.bonus_xp ?? 0);
      return {
        title: es ? '✅ Evidencia verificada' : '✅ Evidence verified',
        body: es
          ? `@${username} verificó tu evidencia. +${xp} de Luz para tu leyenda.`
          : `@${username} verified your evidence. +${xp} Light for your legend.`,
        url: '/leaderboard?tab=social',
        channelId: 'social',
      };
    }
    case 'test':
      return {
        title: String(payload.title ?? 'Zylen'),
        body: String(payload.body ?? 'Test'),
        url: String(payload.url ?? '/'),
        channelId: 'coach',
      };
  }
}

// --- OAuth2 del service account (WebCrypto RS256) ---------------------------

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function b64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const raw = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const der = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer as ArrayBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: sa.token_uri,
      iat: now,
      exp: now + 3600,
    })
  );
  const key = await importPrivateKey(sa.private_key);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(`${header}.${claims}`)
  );
  const jwt = `${header}.${claims}.${b64url(new Uint8Array(signature))}`;

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`OAuth token exchange failed: ${JSON.stringify(json)}`);
  }
  cachedToken = { value: json.access_token, expiresAt: now + 3600 };
  return json.access_token;
}

// --- Envío FCM v1 -----------------------------------------------------------

/** @returns 'ok' | 'dead' (token inválido, borrarlo) | 'error' */
async function sendFcm(
  sa: ServiceAccount,
  accessToken: string,
  token: string,
  msg: Message,
  type: PushType
): Promise<'ok' | 'dead' | 'error'> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: msg.title, body: msg.body },
          android: {
            priority: 'HIGH',
            notification: {
              channel_id: msg.channelId,
              sound: 'default',
              notification_count: 1,
              // mensajes de la misma conversación colapsan en UNA notificación
              ...(msg.tag ? { tag: msg.tag } : {}),
            },
          },
          // expo-notifications expone esto en response.notification.request.content.data
          data: { url: msg.url, type },
        },
      }),
    }
  );
  if (res.ok) return 'ok';

  const body = await res.text();
  const unregistered =
    res.status === 404 ||
    body.includes('UNREGISTERED') ||
    (res.status === 400 && body.includes('not a valid FCM registration token'));
  console.error(`FCM ${res.status} for token ${token.slice(0, 12)}…: ${body.slice(0, 300)}`);
  return unregistered ? 'dead' : 'error';
}

// --- Handler ----------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const secret = Deno.env.get('PUSH_TRIGGER_SECRET') ?? '';
  if (!secret || req.headers.get('x-push-secret') !== secret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT');
  if (!saRaw) {
    return new Response(JSON.stringify({ error: 'FCM_SERVICE_ACCOUNT not set' }), {
      status: 500,
    });
  }
  const sa: ServiceAccount = JSON.parse(saRaw);

  let body: PushRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });
  }
  const { type, user_ids: userIds = [], payload = {} } = body;
  if (!type) {
    return new Response(JSON.stringify({ error: 'type required' }), { status: 400 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Compat: invitaciones del trigger previo no traen inviter_id — se resuelve
  // aquí para poder armar la sala del invitador en el deep link.
  if (type === 'arena_invite' && !payload.inviter_id && payload.invite_id) {
    const { data: invite } = await admin
      .from('arena_invites')
      .select('inviter_id')
      .eq('id', payload.invite_id)
      .maybeSingle();
    if (invite?.inviter_id) payload.inviter_id = invite.inviter_id;
  }

  let rows: TokenRow[];
  if (body.tokens?.length) {
    rows = body.tokens.map((t) => ({ token: t.token, user_id: '', locale: t.locale ?? 'es' }));
  } else {
    if (!userIds.length) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no user_ids' }), { status: 200 });
    }
    const { data, error } = await admin
      .from('push_tokens')
      .select('token, user_id, locale')
      .in('user_id', userIds)
      .eq('enabled', true);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    rows = data ?? [];
  }

  if (!rows.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no tokens' }), { status: 200 });
  }

  const accessToken = await getAccessToken(sa);
  let sent = 0;
  const dead: string[] = [];

  await Promise.all(
    rows.map(async (row) => {
      const msg = buildMessage(type, row.locale, payload);
      const result = await sendFcm(sa, accessToken, row.token, msg, type);
      if (result === 'ok') sent++;
      else if (result === 'dead') dead.push(row.token);
    })
  );

  if (dead.length) {
    await admin.from('push_tokens').delete().in('token', dead);
  }

  return new Response(
    JSON.stringify({ sent, dead: dead.length, total: rows.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
