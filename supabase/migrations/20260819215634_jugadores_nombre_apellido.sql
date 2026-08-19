-- Nombre y apellido como dos columnas.
--
-- El formulario pedia un solo `full_name` ("Nombre y apellido"). En Chile
-- conviene tratarlos aparte: el apellido es el que se busca en una lista y
-- el que se cruza con el RUT. Las filas que ya existan se parten por el
-- primer espacio; si no habia espacio, el mismo texto queda en los dos.

alter table public.players
  add column if not exists first_name text,
  add column if not exists last_name text;

update public.players
set
  first_name = split_part(trim(full_name), ' ', 1),
  last_name = coalesce(
    nullif(btrim(substring(trim(full_name) from ' +(.*)$')), ''),
    split_part(trim(full_name), ' ', 1)
  )
where first_name is null;

alter table public.players
  alter column first_name set not null,
  alter column last_name set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'players_first_name_check'
      and conrelid = 'public.players'::regclass
  ) then
    alter table public.players
      add constraint players_first_name_check
      check (length(trim(first_name)) > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'players_last_name_check'
      and conrelid = 'public.players'::regclass
  ) then
    alter table public.players
      add constraint players_last_name_check
      check (length(trim(last_name)) > 0);
  end if;
end $$;

comment on column public.players.first_name is
  'Nombre de pila. Campo propio, no se concatena al guardar.';
comment on column public.players.last_name is
  'Apellido. Distinto del campo trampa apellido_materno del formulario.';

alter table public.players drop column if exists full_name;
