-- Slice v2-23a: comunidad etapa 2 — conexiones y chat (solo datos).
-- Aditiva. No elimina ni modifica datos existentes. Sin policies de escritura
-- directa en community_connections: todo pasa por funciones SECURITY DEFINER.

create table if not exists community_connections (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

-- Un solo hilo por par, sin importar quien solicito.
create unique index if not exists community_connections_pair_idx
  on community_connections (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create table if not exists community_messages (
  id uuid primary key default uuid_generate_v4(),
  connection_id uuid not null references community_connections(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists community_messages_connection_idx
  on community_messages (connection_id, created_at desc);

alter table community_connections enable row level security;
alter table community_messages enable row level security;

-- Conexiones: cada parte ve sus hilos; nadie inserta/actualiza directo.
create policy "community connections parties select" on community_connections
  for select using (
    requester_id = auth.uid() or addressee_id = auth.uid()
  );

-- Bloqueo bidireccional. security definer para ver ambos sentidos pese al RLS
-- de community_blocks (que solo muestra los bloqueos propios).
create or replace function community_pair_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Solo responde a una de las dos partes (evita consultar bloqueos ajenos).
  select auth.uid() in (a, b) and exists (
    select 1 from community_blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- Mensajes: lectura/escritura solo en conexion aceptada y sin bloqueo.
create policy "community messages select" on community_messages
  for select using (
    exists (
      select 1 from community_connections c
      where c.id = community_messages.connection_id
        and c.status = 'accepted'
        and (c.requester_id = auth.uid() or c.addressee_id = auth.uid())
        and not community_pair_blocked(c.requester_id, c.addressee_id)
    )
  );

create policy "community messages insert" on community_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from community_connections c
      where c.id = community_messages.connection_id
        and c.status = 'accepted'
        and (c.requester_id = auth.uid() or c.addressee_id = auth.uid())
        and not community_pair_blocked(c.requester_id, c.addressee_id)
    )
  );

-- Sin policy de update: read_at se marca solo con mark_messages_read().

-- Solicitar conexion. Rechaza menores, perfiles no publicos, bloqueos,
-- hilos vigentes y mas de 20 solicitudes creadas en 24 h.
create or replace function request_connection(target uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing_id uuid;
  existing_status text;
  recent_count int;
  new_id uuid;
begin
  if me is null then
    raise exception 'unauthorized';
  end if;
  if target is null or target = me then
    raise exception 'invalid_target';
  end if;

  if not exists (
    select 1
    from community_profiles cp
    join profiles p on p.id = cp.user_id
    where cp.user_id = me
      and cp.is_public
      and coalesce(p.age, 0) >= 18
  ) then
    raise exception 'not_allowed';
  end if;

  if not exists (
    select 1
    from community_profiles cp
    join profiles p on p.id = cp.user_id
    where cp.user_id = target
      and cp.is_public
      and coalesce(p.age, 0) >= 18
  ) then
    raise exception 'target_not_available';
  end if;

  if community_pair_blocked(me, target) then
    raise exception 'blocked';
  end if;

  select id, status
    into existing_id, existing_status
  from community_connections
  where (requester_id = me and addressee_id = target)
     or (requester_id = target and addressee_id = me)
  limit 1;

  if existing_id is not null and existing_status in ('pending', 'accepted') then
    raise exception 'connection_exists';
  end if;

  select count(*)
    into recent_count
  from community_connections
  where requester_id = me
    and created_at > now() - interval '24 hours';

  if recent_count >= 20 then
    raise exception 'rate_limited';
  end if;

  if existing_id is not null then
    update community_connections
      set requester_id = me,
          addressee_id = target,
          status = 'pending',
          responded_at = null,
          created_at = now()
    where id = existing_id
    returning id into new_id;
  else
    insert into community_connections (requester_id, addressee_id, status)
      values (me, target, 'pending')
    returning id into new_id;
  end if;

  return new_id;
end;
$$;

-- Responder: solo el destinatario y solo si sigue pendiente.
create or replace function respond_connection(connection_id uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if not exists (
    select 1 from community_connections
    where id = connection_id
      and addressee_id = me
      and status = 'pending'
  ) then
    raise exception 'not_allowed';
  end if;

  update community_connections
    set status = case when accept then 'accepted' else 'declined' end,
        responded_at = now()
  where id = connection_id;
end;
$$;

-- Cancelar: el solicitante si esta pendiente; cualquiera si ya esta aceptada.
create or replace function cancel_connection(connection_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conn community_connections%rowtype;
begin
  select * into conn from community_connections where id = connection_id;

  if not found then
    raise exception 'not_found';
  end if;

  if (conn.requester_id = me and conn.status = 'pending')
     or (conn.status = 'accepted' and (conn.requester_id = me or conn.addressee_id = me)) then
    update community_connections
      set status = 'cancelled',
          responded_at = coalesce(responded_at, now())
    where id = connection_id;
  else
    raise exception 'not_allowed';
  end if;
end;
$$;

-- Marcar leidos los mensajes recibidos (nunca los propios ni el body).
create or replace function mark_messages_read(connection_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conn_id uuid := mark_messages_read.connection_id;
  updated int;
begin
  if not exists (
    select 1 from community_connections
    where id = conn_id
      and status = 'accepted'
      and (requester_id = me or addressee_id = me)
  ) then
    raise exception 'not_allowed';
  end if;

  update community_messages m
    set read_at = now()
  where m.connection_id = conn_id
    and m.sender_id <> me
    and m.read_at is null;

  get diagnostics updated = row_count;
  return updated;
end;
$$;

-- Un bloqueo cancela el hilo del par en cualquier estado vigente.
create or replace function cancel_connections_on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update community_connections
    set status = 'cancelled',
        responded_at = coalesce(responded_at, now())
  where status in ('pending', 'accepted')
    and (
      (requester_id = new.blocker_id and addressee_id = new.blocked_id)
      or (requester_id = new.blocked_id and addressee_id = new.blocker_id)
    );
  return new;
end;
$$;

create trigger community_connections_on_block
  after insert on community_blocks
  for each row execute function cancel_connections_on_block();

-- Tope de 30 mensajes por minuto y emisor.
create or replace function enforce_message_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from community_messages
    where sender_id = new.sender_id
      and created_at > now() - interval '1 minute'
  ) >= 30 then
    raise exception 'message_rate_limited';
  end if;
  return new;
end;
$$;

create trigger community_messages_rate
  before insert on community_messages
  for each row execute function enforce_message_rate();

-- Realtime idempotente para los mensajes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_messages'
  ) then
    execute 'alter publication supabase_realtime add table community_messages';
  end if;
end;
$$;

-- Permisos explicitos (ver 0006 y 0014): nada por defecto.
revoke execute on function community_pair_blocked(uuid, uuid) from public, anon;
revoke execute on function request_connection(uuid) from public, anon;
revoke execute on function respond_connection(uuid, boolean) from public, anon;
revoke execute on function cancel_connection(uuid) from public, anon;
revoke execute on function mark_messages_read(uuid) from public, anon;
revoke execute on function cancel_connections_on_block() from public, anon;
revoke execute on function enforce_message_rate() from public, anon;

grant execute on function community_pair_blocked(uuid, uuid) to authenticated;
grant execute on function request_connection(uuid) to authenticated;
grant execute on function respond_connection(uuid, boolean) to authenticated;
grant execute on function cancel_connection(uuid) to authenticated;
grant execute on function mark_messages_read(uuid) to authenticated;

grant select on table community_connections to authenticated;
grant select, insert on table community_messages to authenticated;
revoke all on table community_connections, community_messages from anon;
