-- =============================================================================
-- Convenios y beneficios para clubes y jugadores
-- =============================================================================
--
-- `/convenios` publica el seguro medico de la Liga y los convenios que
-- consiga con terceros (descuentos, prestaciones). El seguro medico es
-- simplemente la primera fila, no un tipo de contenido aparte.
--
-- Calcada de `sponsors`, con dos diferencias: `description` es obligatoria
-- (un logo se explica solo, un convenio no) y `logo_url`/`link_url` son
-- OPCIONALES -a diferencia de sponsors, el seguro medico de la Liga no
-- necesariamente tiene un logo de partner ni un link externo propio.
-- Mismo reparto de permisos que sponsors y documents: lo administra todo el
-- equipo, no solo el admin.
-- =============================================================================

create table if not exists public.benefits (
  id            bigint generated always as identity primary key,
  name          text not null check (length(trim(name)) > 0),
  description   text not null check (length(trim(description)) > 0),
  link_url      text,
  logo_url      text,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.benefits is
  'Convenios y beneficios de /convenios: seguro medico y descuentos que consigue la Liga para clubes y jugadores.';
comment on column public.benefits.link_url is
  'Opcional: donde canjear o leer mas del convenio. Sin link, la tarjeta se muestra sin boton.';
comment on column public.benefits.logo_url is
  'Opcional: logo del partner del convenio. El seguro medico de la Liga puede no tener uno.';

create index if not exists benefits_active_order_idx
  on public.benefits (display_order, id)
  where is_active;

drop trigger if exists benefits_set_updated_at on public.benefits;
create trigger benefits_set_updated_at
  before update on public.benefits
  for each row execute function private.set_updated_at();

alter table public.benefits enable row level security;

-- Mismo criterio que sponsors: lo administra todo el equipo, no solo el
-- admin. Corregir un convenio mal cargado es reversible.

drop policy if exists benefits_select on public.benefits;
create policy benefits_select on public.benefits
  for select to anon, authenticated
  using (is_active or (select auth.uid()) is not null);

drop policy if exists benefits_insert on public.benefits;
create policy benefits_insert on public.benefits
  for insert to authenticated
  with check (true);

drop policy if exists benefits_update on public.benefits;
create policy benefits_update on public.benefits
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists benefits_delete on public.benefits;
create policy benefits_delete on public.benefits
  for delete to authenticated
  using (true);
