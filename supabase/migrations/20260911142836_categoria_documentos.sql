-- =============================================================================
-- Categoria de los documentos
-- =============================================================================
--
-- Cuatro categorias fijas, igual que las posiciones de jugador: Reglamentos,
-- Actas, Formularios y Tribunal. Esta ultima cubre lo que se hablo para un
-- futuro apartado de Tribunal (sanciones, resoluciones de arbitraje): en vez
-- de un tipo de contenido nuevo, un PDF de resolucion se sube a /documentos
-- categorizado como Tribunal. No reemplaza una lista de jugadores
-- sancionados si la Liga la termina pidiendo, pero cubre el caso de publicar
-- las resoluciones en si.
--
-- Se agrega con backfill porque la tabla ya tenia filas (documentos de
-- prueba): sin datos que clasificar de antemano, se infiere por el titulo y
-- se cae a 'Reglamentos' cuando no hay pista.
-- =============================================================================

alter table public.documents add column if not exists category text;

update public.documents
set category = case
  when title ilike '%sanci%' or title ilike '%falta%' or title ilike '%tribunal%'
    then 'Tribunal'
  when title ilike '%formulario%' or title ilike '%inscripci%'
    then 'Formularios'
  when title ilike '%acta%'
    then 'Actas'
  else 'Reglamentos'
end
where category is null;

alter table public.documents
  alter column category set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'documents_category_check'
      and conrelid = 'public.documents'::regclass
  ) then
    alter table public.documents
      add constraint documents_category_check
      check (category in ('Reglamentos', 'Actas', 'Formularios', 'Tribunal'));
  end if;
end $$;

comment on column public.documents.category is
  'Reglamentos, Actas, Formularios o Tribunal. Lista fija: lib/documentos.ts y este CHECK se corrigen juntos.';

create index if not exists documents_category_idx on public.documents (category);
