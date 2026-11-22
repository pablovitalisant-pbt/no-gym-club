-- Slice v2-22: comunidad etapa 1 (perfil publico + cerca de ti)
-- Solo aditiva. No elimina ni modifica datos existentes.
-- Privacidad: la ubicacion se guarda redondeada a 0.02 grados y las funciones
-- nunca devuelven lat/lng; solo comuna y distancia aproximada.

create table if not exists community_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  is_public boolean not null default false,
  bio text check (char_length(bio) <= 280),
  comuna text check (char_length(comuna) <= 60),
  show_photo boolean not null default true,
  show_level boolean not null default true,
  show_goal boolean not null default true,
  geo_lat numeric(5,2) check (geo_lat between -90 and 90),
  geo_lng numeric(5,2) check (geo_lng between -180 and 180),
  updated_at timestamptz not null default now()
);

create table if not exists community_blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists community_reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid not null references profiles(id) on delete cascade,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create trigger community_profiles_updated_at
  before update on community_profiles
  for each row execute function update_updated_at();

alter table community_profiles enable row level security;
alter table community_blocks enable row level security;
alter table community_reports enable row level security;

-- El dueno administra su fila. Ningun otro usuario puede leer la tabla directo.
create policy "community profiles own select" on community_profiles
  for select using (auth.uid() = user_id);
create policy "community profiles own insert" on community_profiles
  for insert with check (auth.uid() = user_id);
create policy "community profiles own update" on community_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "community blocks own insert" on community_blocks
  for insert with check (auth.uid() = blocker_id);
create policy "community blocks own select" on community_blocks
  for select using (auth.uid() = blocker_id);
create policy "community blocks own delete" on community_blocks
  for delete using (auth.uid() = blocker_id);

-- Reportes: solo inserta el reporter; no hay select para usuarios.
create policy "community reports own insert" on community_reports
  for insert with check (auth.uid() = reporter_id);

-- Perfiles publicos cercanos. Solo responde si quien llama es adulto con
-- perfil publico y con ubicacion aproximada. Excluye bloqueos en ambas
-- direcciones y devuelve distancia entera (minimo 1 km).
create or replace function nearby_community_profiles(radius_km int)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  level text,
  primary_goal text,
  focus_areas text[],
  comuna text,
  bio text,
  distance_km int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me_lat numeric;
  me_lng numeric;
begin
  select cp.geo_lat, cp.geo_lng
    into me_lat, me_lng
  from community_profiles cp
  join profiles p on p.id = cp.user_id
  where cp.user_id = auth.uid()
    and cp.is_public
    and coalesce(p.age, 0) >= 18;

  if not found then
    return;
  end if;

  if me_lat is null or me_lng is null then
    return;
  end if;

  return query
    select
      q.user_id,
      q.display_name,
      q.avatar_url,
      q.level,
      q.primary_goal,
      q.focus_areas,
      q.comuna,
      q.bio,
      greatest(1, round(q.raw_km))::int as distance_km
    from (
      select
        cp.user_id,
        p.display_name,
        case when cp.show_photo then p.avatar_url else null end as avatar_url,
        case when cp.show_level then tp.start_level else null end as level,
        case when cp.show_goal then p.primary_goal::text else null end as primary_goal,
        case when cp.show_goal then p.focus_areas else null end as focus_areas,
        cp.comuna,
        cp.bio,
        6371 * 2 * asin(sqrt(
          power(sin(radians(cp.geo_lat - me_lat) / 2), 2) +
          cos(radians(me_lat)) * cos(radians(cp.geo_lat)) *
          power(sin(radians(cp.geo_lng - me_lng) / 2), 2)
        )) as raw_km
      from community_profiles cp
      join profiles p on p.id = cp.user_id
      left join training_plans tp on tp.user_id = cp.user_id and tp.is_active
      where cp.user_id <> auth.uid()
        and cp.is_public
        and coalesce(p.age, 0) >= 18
        and cp.geo_lat is not null
        and cp.geo_lng is not null
        and not exists (
          select 1 from community_blocks b
          where (b.blocker_id = auth.uid() and b.blocked_id = cp.user_id)
             or (b.blocker_id = cp.user_id and b.blocked_id = auth.uid())
        )
    ) q
    where q.raw_km <= least(coalesce(radius_km, 5), 25)
    order by q.raw_km asc
    limit 50;
end;
$$;

-- Perfil publico individual, con las mismas reglas.
create or replace function community_profile(target uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  level text,
  primary_goal text,
  focus_areas text[],
  comuna text,
  bio text,
  distance_km int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  me_lat numeric;
  me_lng numeric;
begin
  select cp.geo_lat, cp.geo_lng
    into me_lat, me_lng
  from community_profiles cp
  join profiles p on p.id = cp.user_id
  where cp.user_id = auth.uid()
    and cp.is_public
    and coalesce(p.age, 0) >= 18;

  if not found then
    return;
  end if;

  return query
    select
      cp.user_id,
      p.display_name,
      case when cp.show_photo then p.avatar_url else null end,
      case when cp.show_level then tp.start_level else null end,
      case when cp.show_goal then p.primary_goal::text else null end,
      case when cp.show_goal then p.focus_areas else null end,
      cp.comuna,
      cp.bio,
      case
        when cp.geo_lat is not null and cp.geo_lng is not null
          and me_lat is not null and me_lng is not null
        then greatest(1, round(
          6371 * 2 * asin(sqrt(
            power(sin(radians(cp.geo_lat - me_lat) / 2), 2) +
            cos(radians(me_lat)) * cos(radians(cp.geo_lat)) *
            power(sin(radians(cp.geo_lng - me_lng) / 2), 2)
          ))
        ))::int
        else null
      end as distance_km
    from community_profiles cp
    join profiles p on p.id = cp.user_id
    left join training_plans tp on tp.user_id = cp.user_id and tp.is_active
    where cp.user_id = target
      and cp.user_id <> auth.uid()
      and cp.is_public
      and coalesce(p.age, 0) >= 18
      and not exists (
        select 1 from community_blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = cp.user_id)
           or (b.blocker_id = cp.user_id and b.blocked_id = auth.uid())
      )
    limit 1;
end;
$$;

revoke execute on function nearby_community_profiles(int) from public, anon;
grant execute on function nearby_community_profiles(int) to authenticated;
revoke execute on function community_profile(uuid) from public, anon;
grant execute on function community_profile(uuid) to authenticated;

-- GRANT explicitos (este proyecto no da privilegios por defecto a authenticated; ver 0006).
grant select, insert, update on table community_profiles to authenticated;
grant select, insert, delete on table community_blocks to authenticated;
grant insert on table community_reports to authenticated;
revoke all on table community_profiles, community_blocks, community_reports from anon;
