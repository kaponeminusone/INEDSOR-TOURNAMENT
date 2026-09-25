-- Torneo INEDSOR · esquema de Supabase
-- Ejecutar una vez en Supabase → SQL Editor. Es seguro volver a ejecutarlo.

-- ─────────────────────────────────────────────
-- Organizadores (quién puede modificar datos)
-- ─────────────────────────────────────────────
create table if not exists public.organizers (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_organizer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.organizers where user_id = auth.uid());
$$;

-- ─────────────────────────────────────────────
-- Tablas
-- ─────────────────────────────────────────────
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initials text not null default '',
  coach text not null default '',
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  format text not null,
  rules text not null default '',
  start_time text not null default 'Por definir',
  team_size int not null default 1,
  group_size int,
  sort_order int not null default 0
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null default '',
  whatsapp text not null default '',
  grade text not null default '',
  institution_id uuid references public.institutions on delete set null,
  attended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.robots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  participant_id uuid references public.participants on delete set null,
  category_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  caption text not null default '' check (char_length(caption) <= 500),
  storage_path text not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.gallery_photos add column if not exists like_count int not null default 0;

-- Un "me gusta" por dispositivo y foto. Solo se modifica mediante set_photo_like().
create table if not exists public.gallery_likes (
  photo_id uuid not null references public.gallery_photos on delete cascade,
  device_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (photo_id, device_id)
);

create or replace function public.set_photo_like(p_photo uuid, p_device uuid, p_liked boolean)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  changed int;
  total int;
begin
  if p_liked then
    insert into gallery_likes (photo_id, device_id) values (p_photo, p_device) on conflict do nothing;
    get diagnostics changed = row_count;
    if changed > 0 then update gallery_photos set like_count = like_count + 1 where id = p_photo; end if;
  else
    delete from gallery_likes where photo_id = p_photo and device_id = p_device;
    get diagnostics changed = row_count;
    if changed > 0 then update gallery_photos set like_count = greatest(like_count - 1, 0) where id = p_photo; end if;
  end if;
  select like_count into total from gallery_photos where id = p_photo;
  return coalesce(total, 0);
end;
$$;

revoke all on function public.set_photo_like(uuid, uuid, boolean) from public;
grant execute on function public.set_photo_like(uuid, uuid, boolean) to anon, authenticated;

create index if not exists gallery_photos_created_at_idx on public.gallery_photos (created_at desc);
create index if not exists participants_institution_idx on public.participants (institution_id);
create index if not exists robots_participant_idx on public.robots (participant_id);

-- ─────────────────────────────────────────────
-- Competencia: llaves, series, contrarreloj y resultado directo
-- ─────────────────────────────────────────────
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references public.categories on delete cascade,
  kind text not null check (kind in ('elimination', 'heats', 'timed', 'direct')),
  settings jsonb not null default '{}',
  entrants jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft', 'revealed', 'finished')),
  estimate_minutes int,
  revealed_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- Cada lado (source_a/source_b) o entrada de serie (sources) apunta a un sembrado, a un bye
-- o al ganador/perdedor/puesto de otro encuentro; los participantes se calculan en la app.
create table if not exists public.competition_matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions on delete cascade,
  stage text not null,
  round int not null,
  position int not null,
  source_a jsonb,
  source_b jsonb,
  sources jsonb not null default '[]',
  winner_key text,
  placements jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending', 'active', 'done')),
  locked boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.competition_runs (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions on delete cascade,
  entrant_key text not null,
  phase text not null default 'main' check (phase in ('main', 'final')),
  attempt int not null default 1,
  status text not null check (status in ('done', 'dnf', 'absent')),
  time_ms int,
  splits jsonb not null default '[]',
  checkpoints int not null default 0,
  locked boolean not null default true,
  created_at timestamptz not null default now(),
  unique (competition_id, entrant_key, phase, attempt)
);

-- Podio final de cada categoría: places = claves de participante (robot o equipo "id+id") en orden.
create table if not exists public.category_results (
  category_id uuid primary key references public.categories on delete cascade,
  places jsonb not null default '[]',
  locked boolean not null default true,
  recorded_at timestamptz not null default now()
);

create index if not exists competition_matches_idx on public.competition_matches (competition_id, stage, round, position);
create index if not exists competition_runs_idx on public.competition_runs (competition_id, entrant_key);

-- ─────────────────────────────────────────────
-- Streaming en vivo: una transmisión de YouTube por categoría.
-- ─────────────────────────────────────────────
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references public.categories on delete cascade,
  label text not null default '',
  youtube_url text not null default '',
  video_id text,
  is_live boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Modo edición: los resultados guardados quedan bloqueados; cambiarlos exige el código de edición.
-- ─────────────────────────────────────────────
create table if not exists public.admin_secrets (
  name text primary key,
  salt text not null,
  hash text not null
);

create table if not exists public.edit_sessions (
  user_id uuid primary key,
  expires_at timestamptz not null
);

create or replace function public.edit_mode_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is null
      or exists (select 1 from public.edit_sessions where user_id = auth.uid() and expires_at > now());
$$;

create or replace function public.start_edit_session(p_code text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  secret record;
  expires timestamptz := now() + interval '15 minutes';
begin
  if not public.is_organizer() then
    raise exception 'Solo los organizadores pueden activar el modo edición.' using errcode = '42501';
  end if;
  select * into secret from public.admin_secrets where name = 'edit_code';
  if not found or encode(sha256(convert_to(secret.salt || p_code, 'UTF8')), 'hex') <> secret.hash then
    raise exception 'Código de edición incorrecto.' using errcode = '28P01';
  end if;
  insert into public.edit_sessions (user_id, expires_at) values (auth.uid(), expires)
  on conflict (user_id) do update set expires_at = excluded.expires_at;
  return expires;
end;
$$;

create or replace function public.end_edit_session()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.edit_sessions where user_id = auth.uid();
$$;

-- Solo desde el SQL Editor (sin sesión de usuario): select public.set_edit_code('nuevo-codigo');
create or replace function public.set_edit_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_salt text := md5(random()::text || clock_timestamp()::text);
begin
  if auth.uid() is not null then
    raise exception 'El código de edición solo se cambia desde el SQL Editor de Supabase.' using errcode = '42501';
  end if;
  insert into public.admin_secrets (name, salt, hash)
  values ('edit_code', new_salt, encode(sha256(convert_to(new_salt || p_code, 'UTF8')), 'hex'))
  on conflict (name) do update set salt = excluded.salt, hash = excluded.hash;
end;
$$;

-- Supabase concede ejecución a anon y authenticated por defecto: se retira explícitamente.
revoke all on function public.start_edit_session(text) from public, anon, authenticated;
revoke all on function public.end_edit_session() from public, anon, authenticated;
revoke all on function public.set_edit_code(text) from public, anon, authenticated;
grant execute on function public.start_edit_session(text) to authenticated;
grant execute on function public.end_edit_session() to authenticated;

create or replace function public.guard_locked_row()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if OLD.locked and not public.edit_mode_active() then
    raise exception 'Resultado bloqueado. Activa el modo edición para modificarlo.' using errcode = 'P0001', hint = 'locked';
  end if;
  return case when TG_OP = 'DELETE' then OLD else NEW end;
end;
$$;

create or replace function public.guard_competition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if OLD.status <> 'draft' and not public.edit_mode_active() and (
       TG_OP = 'DELETE'
       or NEW.entrants is distinct from OLD.entrants
       or NEW.settings is distinct from OLD.settings
       or NEW.kind is distinct from OLD.kind
       or (OLD.status = 'finished' and NEW.status <> 'finished')) then
    raise exception 'La competencia ya fue revelada. Activa el modo edición para modificarla.' using errcode = 'P0001', hint = 'locked';
  end if;
  return case when TG_OP = 'DELETE' then OLD else NEW end;
end;
$$;

drop trigger if exists guard_locked on public.competition_matches;
create trigger guard_locked before update or delete on public.competition_matches
  for each row execute function public.guard_locked_row();
drop trigger if exists guard_locked on public.competition_runs;
create trigger guard_locked before update or delete on public.competition_runs
  for each row execute function public.guard_locked_row();
drop trigger if exists guard_locked on public.category_results;
create trigger guard_locked before update or delete on public.category_results
  for each row execute function public.guard_locked_row();
drop trigger if exists guard_competition on public.competitions;
create trigger guard_competition before update or delete on public.competitions
  for each row execute function public.guard_competition();

-- ─────────────────────────────────────────────
-- Seguridad a nivel de fila (RLS)
-- Lectura pública; escritura solo para organizadores.
-- ─────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['institutions', 'categories', 'participants', 'robots', 'competitions', 'competition_matches', 'competition_runs', 'category_results', 'gallery_photos', 'gallery_likes', 'organizers', 'admin_secrets', 'edit_sessions', 'live_streams']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  foreach t in array array['institutions', 'categories', 'robots', 'category_results', 'gallery_photos', 'live_streams']
  loop
    execute format('drop policy if exists "lectura publica" on public.%I', t);
    execute format('create policy "lectura publica" on public.%I for select to anon, authenticated using (true)', t);
  end loop;

  foreach t in array array['institutions', 'categories', 'participants', 'robots', 'competitions', 'competition_matches', 'competition_runs', 'category_results', 'gallery_photos', 'live_streams']
  loop
    execute format('drop policy if exists "organizadores escriben" on public.%I', t);
    execute format('create policy "organizadores escriben" on public.%I for all to authenticated using (public.is_organizer()) with check (public.is_organizer())', t);
  end loop;
end $$;

-- Participantes: el público solo ve columnas no sensibles (sin correo ni WhatsApp).
drop policy if exists "lectura publica limitada" on public.participants;
create policy "lectura publica limitada" on public.participants for select to anon using (true);
drop policy if exists "organizadores leen" on public.participants;
create policy "organizadores leen" on public.participants for select to authenticated using (public.is_organizer());
revoke select on public.participants from anon;
grant select (id, institution_id, attended_at, created_at) on public.participants to anon;

-- Competencia: el público no ve los borradores (se muestran al revelarlos).
drop policy if exists "lectura publica revelada" on public.competitions;
create policy "lectura publica revelada" on public.competitions for select to anon, authenticated
  using (status <> 'draft' or public.is_organizer());
drop policy if exists "lectura publica revelada" on public.competition_matches;
create policy "lectura publica revelada" on public.competition_matches for select to anon, authenticated
  using (exists (select 1 from public.competitions c where c.id = competition_id and (c.status <> 'draft' or public.is_organizer())));
drop policy if exists "lectura publica revelada" on public.competition_runs;
create policy "lectura publica revelada" on public.competition_runs for select to anon, authenticated
  using (exists (select 1 from public.competitions c where c.id = competition_id and (c.status <> 'draft' or public.is_organizer())));

drop policy if exists "cada quien ve su sesion" on public.edit_sessions;
create policy "cada quien ve su sesion" on public.edit_sessions for select to authenticated using (user_id = auth.uid());

drop policy if exists "cada quien ve su rol" on public.organizers;
create policy "cada quien ve su rol" on public.organizers for select to authenticated using (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- Almacenamiento de imágenes (fotos de la galería y logos)
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Borrar o reemplazar archivos requiere también permiso de lectura sobre ellos.
drop policy if exists "organizadores leen media" on storage.objects;
create policy "organizadores leen media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_organizer());
drop policy if exists "organizadores suben media" on storage.objects;
create policy "organizadores suben media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_organizer());
drop policy if exists "organizadores editan media" on storage.objects;
create policy "organizadores editan media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_organizer());
drop policy if exists "organizadores borran media" on storage.objects;
create policy "organizadores borran media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_organizer());

-- ─────────────────────────────────────────────
-- Tiempo real (participantes queda fuera para no difundir datos personales)
-- ─────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['institutions', 'categories', 'robots', 'competitions', 'competition_matches', 'competition_runs', 'category_results', 'gallery_photos', 'live_streams']
  loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ─────────────────────────────────────────────
-- Categorías oficiales (Reglamento 2026). Los horarios no están en el reglamento: quedan "Por definir".
-- format = mecánica: elimination (llaves), heats (series), timed (contrarreloj), direct (resultado directo).
-- ─────────────────────────────────────────────
alter table public.categories drop constraint if exists categories_format_check;

insert into public.categories (slug, name, format, rules, start_time, team_size, sort_order) values
  ('minisumo', 'Minisumo Autónomo', 'elimination', 'Dos robots autónomos se enfrentan en el dojo. Gana quien saque al rival del área de combate.', 'Por definir', 1, 1),
  ('sumo', 'Sumo Autónomo', 'elimination', 'Robots autónomos de mayor tamaño se enfrentan en el dojo. Gana quien saque al rival del área.', 'Por definir', 1, 2),
  ('sumo-rc', 'Sumo RC', 'elimination', 'Robots radiocontrolados se enfrentan en el dojo. Gana quien saque al rival del área de combate.', 'Por definir', 1, 3),
  ('futbolito', 'Futbolito', 'elimination', 'Robots radiocontrolados juegan fútbol con una pelota pequeña. Gana quien anote más goles.', 'Por definir', 2, 4),
  ('seguidor-de-linea', 'Seguidor de Línea', 'timed', 'Recorrer la pista siguiendo la línea negra en el menor tiempo posible.', 'Por definir', 1, 5),
  ('laberinto-rc', 'Laberinto RC', 'timed', 'Pilotar el robot de la entrada a la salida del laberinto en el menor tiempo.', 'Por definir', 1, 6),
  ('circuito-dron', 'Circuito de Dron', 'timed', 'Cada piloto vuela solo el circuito. Gana quien lo complete más rápido dentro del tiempo límite.', 'Por definir', 1, 7),
  ('carrera-rc', 'Carrera de RC''s', 'heats', 'Varios robots radiocontrolados compiten en la pista. Gana quien completa las 3 vueltas primero.', 'Por definir', 1, 8),
  ('explotaglobos', 'ExplotaGlobos', 'direct', 'Robots radiocontrolados intentan explotar los globos del rival y proteger los propios.', 'Por definir', 1, 9)
on conflict (slug) do update set name = excluded.name, format = excluded.format, rules = excluded.rules, team_size = excluded.team_size, sort_order = excluded.sort_order;

alter table public.categories add constraint categories_format_check check (format in ('elimination', 'heats', 'timed', 'direct'));
