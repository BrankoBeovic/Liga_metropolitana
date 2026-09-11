-- =============================================================================
-- Equipos que quieren sumarse a la Liga
-- =============================================================================
--
-- `/inscripciones` (antes `/jugadores`) suma una segunda alternativa ademas de
-- jugadores sueltos: equipos e instituciones. Pide lo basico para poder
-- contactarlos: nombre del equipo, cuantos jugadores son, desde cuando existen,
-- una bio corta y quien responde por el club.
--
-- Mismo circuito que `players`: el alta NO pasa por RLS de `anon`. La Server
-- Action inserta con la clave secreta (bypassea RLS) despues de las trampas
-- antispam. Si `anon` pudiera insertar, un bot de catalogo publicaria filas
-- directo contra el REST y se saltaria el formulario. Las cuatro politicas se
-- declaran igual, porque con RLS activo la ausencia nunca significa permiso y
-- el permiso tiene que ser legible.
--
-- La tabla no es publica: ni el correo de contacto puede salir al sitio. Solo
-- el equipo (de la Liga, no del maxibasquet) autenticado lee y borra.
-- =============================================================================

create table if not exists public.teams (
  id            bigint generated always as identity primary key,
  name          text not null check (length(trim(name)) > 0),
  player_count  smallint not null check (player_count between 5 and 30),
  -- Rango estatico y generoso a proposito: igual que `players.age`, no se
  -- compara contra el año actual en el CHECK. Que no sea futuro se valida en
  -- la Server Action, donde tener el año de hoy es trivial y no depende de la
  -- volatilidad de una funcion en un constraint.
  founded_year  smallint not null check (founded_year between 1900 and 2100),
  bio           text not null check (length(trim(bio)) >= 20),
  contact_name  text not null check (length(trim(contact_name)) > 0),
  email         text not null check (length(trim(email)) > 3),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.teams is
  'Equipos e instituciones que quieren sumarse a la Liga. El alta es por Server Action con clave secreta; el listado vive en /admin/equipos.';
comment on column public.teams.player_count is
  'Cuantos jugadores tiene el plantel hoy.';
comment on column public.teams.founded_year is
  'Año en que se fundo el equipo.';
comment on column public.teams.bio is
  'Una bio corta del equipo: historia, categoria en la que juegan, etc.';
comment on column public.teams.contact_name is
  'Quien responde por el equipo, para saber con quien se habla.';
comment on column public.teams.email is
  'Para contactar al equipo.';

create index if not exists teams_created_at_idx
  on public.teams (created_at desc);

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function private.set_updated_at();

alter table public.teams enable row level security;

-- Lectura solo del equipo de la Liga. anon no aparece: el REST publico no ve nada.
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
  for select to authenticated
  using (true);

-- Nadie inserta por RLS. El alta lo hace la Server Action con la clave secreta.
drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams
  for insert to authenticated
  with check (false);

drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams
  for update to authenticated
  using (false)
  with check (false);

-- Borrar es reversible: el equipo puede volver a inscribirse.
drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams
  for delete to authenticated
  using (true);

grant select, delete on table public.teams to authenticated;
grant usage, select on sequence public.teams_id_seq to authenticated;

-- anon no tiene nada que hacer aca: ni leer (correo) ni escribir.
revoke all on table public.teams from anon;
