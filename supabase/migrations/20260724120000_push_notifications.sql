-- ============================================================================
-- Push notifications — device tokens, arena invites y triggers de envío
--
-- Piezas:
--   1. push_tokens: tokens FCM por dispositivo (multi-device por usuario).
--   2. arena_invites: invitaciones dirigidas a la Arena entre aliados.
--   3. fn_notify_push: helper que encola un POST (pg_net) hacia la Edge
--      Function `send-push`. URL y secreto viven en Vault (push_fn_url,
--      push_trigger_secret) — si no están configurados, no hace nada, así
--      entornos locales/CI no fallan.
--   4. Triggers: solicitud de aliado enviada, solicitud aceptada e
--      invitación a la arena creada.
--
-- El texto de la notificación NO se compone aquí: la Edge Function localiza
-- el mensaje según push_tokens.locale. Los triggers solo mandan el evento.
-- ============================================================================

create extension if not exists pg_net;

-- ----------------------------------------------------------------------------
-- 1. push_tokens
-- ----------------------------------------------------------------------------

create table if not exists public.push_tokens (
  token       text primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  platform    text not null default 'android' check (platform in ('android', 'ios')),
  locale      text not null default 'es',
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_push_tokens_user on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_select_own" on public.push_tokens;
create policy "push_tokens_select_own" on public.push_tokens
  for select using (auth.uid() = user_id);

drop policy if exists "push_tokens_delete_own" on public.push_tokens;
create policy "push_tokens_delete_own" on public.push_tokens
  for delete using (auth.uid() = user_id);

-- Alta/rotación de token. SECURITY DEFINER porque un mismo dispositivo puede
-- cambiar de cuenta: hay que poder re-asignar un token que quedó registrado
-- a otro usuario, cosa que RLS no permitiría desde el cliente.
create or replace function public.register_push_token(
  p_token text,
  p_platform text default 'android',
  p_locale text default 'es'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_token is null or length(p_token) < 10 then
    raise exception 'Invalid token';
  end if;

  delete from push_tokens where token = p_token and user_id <> auth.uid();

  insert into push_tokens (token, user_id, platform, locale)
  values (p_token, auth.uid(), p_platform, coalesce(p_locale, 'es'))
  on conflict (token) do update
    set platform   = excluded.platform,
        locale     = excluded.locale,
        enabled    = true,
        updated_at = now();
end;
$$;

create or replace function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from push_tokens where token = p_token and user_id = auth.uid();
$$;

grant execute on function public.register_push_token(text, text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 2. arena_invites
-- ----------------------------------------------------------------------------

create table if not exists public.arena_invites (
  id           uuid primary key default gen_random_uuid(),
  inviter_id   uuid not null references public.profiles(id) on delete cascade,
  invitee_id   uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint no_self_invite check (inviter_id <> invitee_id)
);

create index if not exists idx_arena_invites_invitee
  on public.arena_invites(invitee_id, status);
-- Una sola invitación pendiente por par inviter→invitee
create unique index if not exists uq_arena_invites_pending
  on public.arena_invites(inviter_id, invitee_id) where (status = 'pending');

alter table public.arena_invites enable row level security;

drop policy if exists "arena_invites_select_participants" on public.arena_invites;
create policy "arena_invites_select_participants" on public.arena_invites
  for select using (auth.uid() in (inviter_id, invitee_id));
-- Escrituras solo vía RPCs SECURITY DEFINER.

-- Invitar a un aliado (requiere amistad aceptada). Devuelve JSONB:
--   { success: true,  invite_id: uuid }
--   { success: false, error: 'not_allies' | 'already_invited' }
create or replace function public.invite_to_arena(p_friend_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_invite_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from friendships
    where status = 'accepted'
      and ((user_id = v_uid and friend_id = p_friend_id)
        or (user_id = p_friend_id and friend_id = v_uid))
  ) then
    return jsonb_build_object('success', false, 'error', 'not_allies');
  end if;

  -- Throttle: una invitación pendiente reciente al mismo aliado no se repite
  if exists (
    select 1 from arena_invites
    where inviter_id = v_uid and invitee_id = p_friend_id
      and status = 'pending'
      and created_at > now() - interval '10 minutes'
  ) then
    return jsonb_build_object('success', false, 'error', 'already_invited');
  end if;

  -- Las pendientes viejas expiran para dejar lugar a la nueva
  update arena_invites set status = 'expired'
  where inviter_id = v_uid and invitee_id = p_friend_id and status = 'pending';

  insert into arena_invites (inviter_id, invitee_id)
  values (v_uid, p_friend_id)
  returning id into v_invite_id;

  return jsonb_build_object('success', true, 'invite_id', v_invite_id);
end;
$$;

create or replace function public.respond_arena_invite(p_invite_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  update arena_invites
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now()
  where id = p_invite_id and invitee_id = auth.uid() and status = 'pending';
  get diagnostics v_updated = row_count;
  return jsonb_build_object('success', v_updated > 0);
end;
$$;

create or replace function public.get_pending_arena_invites()
returns table (
  invite_id uuid,
  inviter_id uuid,
  inviter_username text,
  inviter_avatar_url text,
  inviter_level int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select ai.id, ai.inviter_id, p.username, p.avatar_url, p.level, ai.created_at
  from arena_invites ai
  join profiles p on p.id = ai.inviter_id
  where ai.invitee_id = auth.uid()
    and ai.status = 'pending'
    and ai.created_at > now() - interval '24 hours'
  order by ai.created_at desc;
$$;

grant execute on function public.invite_to_arena(uuid) to authenticated;
grant execute on function public.respond_arena_invite(uuid, boolean) to authenticated;
grant execute on function public.get_pending_arena_invites() to authenticated;

-- ----------------------------------------------------------------------------
-- 3. fn_notify_push — encola el POST hacia la Edge Function send-push
-- ----------------------------------------------------------------------------

create or replace function public.fn_notify_push(
  p_user_ids uuid[],
  p_type text,
  p_payload jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'push_fn_url';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'push_trigger_secret';

  if v_url is null or v_secret is null then
    return; -- push no configurado en este entorno
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_secret
    ),
    body := jsonb_build_object(
      'type', p_type,
      'user_ids', to_jsonb(p_user_ids),
      'payload', p_payload
    )
  );
exception when others then
  -- El push jamás debe romper la transacción que lo originó
  null;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Triggers de eventos sociales
-- ----------------------------------------------------------------------------

-- Solicitud de aliado enviada → notifica al receptor
create or replace function public.fn_push_on_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  select username into v_username from profiles where id = new.user_id;
  perform fn_notify_push(
    array[new.friend_id],
    'friend_request',
    jsonb_build_object('username', coalesce(v_username, '???'), 'friendship_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists trg_push_friend_request on public.friendships;
create trigger trg_push_friend_request
  after insert on public.friendships
  for each row
  when (new.status = 'pending')
  execute function public.fn_push_on_friend_request();

-- Solicitud aceptada → notifica a quien la envió originalmente
create or replace function public.fn_push_on_friend_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  select username into v_username from profiles where id = new.friend_id;
  perform fn_notify_push(
    array[new.user_id],
    'friend_accept',
    jsonb_build_object('username', coalesce(v_username, '???'), 'friendship_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists trg_push_friend_accept on public.friendships;
create trigger trg_push_friend_accept
  after update on public.friendships
  for each row
  when (old.status = 'pending' and new.status = 'accepted')
  execute function public.fn_push_on_friend_accept();

-- Invitación a la arena creada → notifica al invitado
create or replace function public.fn_push_on_arena_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  select username into v_username from profiles where id = new.inviter_id;
  perform fn_notify_push(
    array[new.invitee_id],
    'arena_invite',
    jsonb_build_object('username', coalesce(v_username, '???'), 'invite_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists trg_push_arena_invite on public.arena_invites;
create trigger trg_push_arena_invite
  after insert on public.arena_invites
  for each row
  execute function public.fn_push_on_arena_invite();
