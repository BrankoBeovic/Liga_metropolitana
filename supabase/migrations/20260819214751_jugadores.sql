-- =============================================================================
-- Jugadores sin equipo
-- =============================================================================
--
-- `/inscribete` pedia un equipo. Ahora `/jugadores` es para quien quiere jugar
-- y no tiene club: deja nombre, edad, RUT, posicion, bio y como ubicarlo.
--
-- El alta NO pasa por RLS de `anon`. La Server Action inserta con la clave
-- secreta (bypassea RLS) despues de las trampas antispam. Si `anon` pudiera
-- insertar, un bot de catalogo publicaria filas directo contra el REST y se
-- saltaria el formulario. Las cuatro politicas se declaran igual, porque con
-- RLS activo la ausencia nunca significa permiso y el permiso tiene que ser
-- legible.
--
-- La tabla no es publica: el RUT y el correo no pueden salir al sitio. Solo
-- el equipo autenticado lee y borra.
-- =============================================================================

create table if not exists public.players (
  id         bigint generated always as identity primary key,
  full_name  text not null check (length(trim(full_name)) > 0),
  age        smallint not null check (age between 18 and 99),
  -- Canonico: sin puntos, con guion, DV en mayuscula. Ej: 12345678-9
  rut        text not null unique check (rut ~ '^[0-9]{7,8}-[0-9K]$'),
  position   text not null check (
    position in (
      'Base',
      'Escolta',
      'Alero',
      'Ala-pívot',
      'Pívot',
      'Varias'
    )
  ),
  bio        text not null check (length(trim(bio)) >= 20),
  email      text not null check (length(trim(email)) > 3),
  phone      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.players is
  'Jugadores que buscan equipo. El alta es por Server Action con clave secreta; el listado vive en /admin/jugadores.';
comment on column public.players.rut is
  'RUT chileno normalizado (sin puntos, DV mayuscula). Unico: una ficha por persona.';
comment on column public.players.bio is
  'Como juega y que experiencia trae. Minimo 20 caracteres.';
comment on column public.players.email is
  'Para contactarlo. El formulario publico lo exige aunque no estaba en el pedido original: sin correo la ficha no sirve.';

create index if not exists players_created_at_idx
  on public.players (created_at desc);

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
  before update on public.players
  for each row execute function private.set_updated_at();

alter table public.players enable row level security;

-- Lectura solo del equipo. anon no aparece: el REST publico no ve nada.
drop policy if exists players_select on public.players;
create policy players_select on public.players
  for select to authenticated
  using (true);

-- Nadie inserta por RLS. El alta lo hace la Server Action con la clave secreta.
drop policy if exists players_insert on public.players;
create policy players_insert on public.players
  for insert to authenticated
  with check (false);

drop policy if exists players_update on public.players;
create policy players_update on public.players
  for update to authenticated
  using (false)
  with check (false);

-- Borrar es reversible: el jugador puede volver a inscribirse.
drop policy if exists players_delete on public.players;
create policy players_delete on public.players
  for delete to authenticated
  using (true);

grant select, delete on table public.players to authenticated;
grant usage, select on sequence public.players_id_seq to authenticated;

-- anon no tiene nada que hacer aca: ni leer (RUT, correo) ni escribir.
revoke all on table public.players from anon;
