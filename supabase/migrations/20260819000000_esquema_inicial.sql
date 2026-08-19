-- =============================================================================
-- Liga Metropolitana - esquema inicial
-- =============================================================================
--
-- Consolida en una sola migracion el estado FINAL del esquema de la fuente
-- (Hablemos de Basquet, 15 migraciones), sin replicar su historia.
--
-- Cambios respecto de la fuente, decididos antes de escribir esto:
--   - Sin media_items ni newsletter_subscribers: nunca se usaron alla.
--   - Sin nav_label / show_in_navbar / show_in_home en categories: la barra
--     de este sitio es una lista fija en el codigo y no hay bloque "Otras
--     secciones" en la portada.
--   - Sin espacios de publicidad vendidos: sponsors pierde is_featured,
--     is_side_banner, banner_home_url, banner_side_url y sus dos indices
--     unicos, y posts pierde sponsor_id. Los sponsors son solo logos en la
--     landing.
--   - Se suma la tabla documents (PDFs institucionales) con sus 4 politicas.
--   - Se suma el bucket `documents` para los PDFs.
--   - La firma anonima es "Equipo Liga Metropolitana", no "Equipo HDB".
--
-- Lo que se conserva a proposito:
--   - La maquinaria de nota destacada: is_featured, su trigger SECURITY
--     DEFINER y su indice unico parcial. Ya esta probada en la fuente.
--   - Las cuatro politicas explicitas por tabla: con RLS activo y sin
--     politica el acceso es denegado, la ausencia nunca significa permiso,
--     pero se declaran igual para que el permiso sea legible.
--
-- Toda la migracion es idempotente: se puede correr N veces sin error.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Schema privado para helpers
-- -----------------------------------------------------------------------------
-- Los helpers de seguridad no viven en `public` para que no queden expuestos
-- por PostgREST como si fueran endpoints RPC.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 1. Tipos
-- -----------------------------------------------------------------------------
-- CREATE TYPE no acepta IF NOT EXISTS, de ahi el bloque.

do $$
begin
  create type public.user_role as enum ('admin', 'editor');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.post_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end
$$;


-- -----------------------------------------------------------------------------
-- 2. Tablas
-- -----------------------------------------------------------------------------

-- profiles: extiende auth.users. El id es el mismo uuid, no un id propio,
-- asi que no hace falta join extra para saber quien escribio que.
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null check (length(trim(full_name)) > 0),
  role          public.user_role not null default 'editor',
  bio           text,
  avatar_url    text,
  twitter_url   text,
  instagram_url text,
  show_in_team  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil publico de cada usuario del CMS. Se crea solo via trigger handle_new_user.';
comment on column public.profiles.role is
  'admin puede todo; editor solo sus propios posts. Un editor no puede cambiarse el rol (ver trigger guard_profile_role_change).';
comment on column public.profiles.show_in_team is
  'Reservada de la fuente. Este sitio no tiene pagina de equipo por ahora; la elige cada quien desde /admin/perfil si algun dia la hay.';


-- categories: las secciones de las noticias (Novedades, Institucional).
-- Sin columnas de navegacion: la barra de este sitio es una lista fija en el
-- codigo, porque sus enlaces son paginas (Historia, Documentos, Inscribete,
-- Contacto) y no categorias.
create table if not exists public.categories (
  id            bigint generated always as identity primary key,
  name          text not null unique check (length(trim(name)) > 0),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description   text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.categories.slug is
  'Identificador estable de la categoria. Solo minusculas, numeros y guiones.';


-- posts: la noticia. `content` guarda el JSON de TipTap, no HTML.
create table if not exists public.posts (
  id                   bigint generated always as identity primary key,
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title                text not null check (length(trim(title)) > 0),
  excerpt              text,
  content              jsonb not null default '{}'::jsonb,
  cover_image_url      text,
  cover_image_alt      text,
  category_id          bigint not null references public.categories (id) on delete restrict,
  author_id            uuid not null references public.profiles (id) on delete restrict,
  status               public.post_status not null default 'draft',
  reading_time_minutes integer check (reading_time_minutes is null or reading_time_minutes > 0),
  is_featured          boolean not null default false,
  is_anonymous         boolean not null default false,
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Un post publicado sin fecha no se podria ordenar ni filtrar en el feed
  -- publico, y la politica RLS de lectura lo dejaria invisible para siempre.
  constraint posts_published_needs_date
    check (status <> 'published' or published_at is not null)
);

comment on column public.posts.content is
  'Documento JSON de TipTap. No es HTML: se renderiza desde el JSON.';
comment on column public.posts.excerpt is
  'La bajada que se muestra bajo el H1 y en las tarjetas del feed.';
comment on column public.posts.is_featured is
  'Si es la nota principal de la portada (la foto grande). Solo una a la vez.';
comment on column public.posts.is_anonymous is
  'Si es true, la nota se firma como "Equipo Liga Metropolitana" en el sitio publico. author_id sigue apuntando al autor real, que es de quien dependen las politicas RLS.';
comment on column public.posts.published_at is
  'Puede ser futura: la lectura publica exige published_at <= now(), asi que sirve para programar.';


-- sponsors: solo logos en la landing. Sin espacios de publicidad vendidos:
-- la fuente tenia banners de portada y laterales (is_featured, is_side_banner
-- y sus artes) y este sitio decidio no venderlos. Si algun dia se venden, esas
-- columnas y sus indices unicos parciales estan documentados en la fuente.
create table if not exists public.sponsors (
  id            bigint generated always as identity primary key,
  name          text not null check (length(trim(name)) > 0),
  logo_url      text not null,
  website_url   text not null,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- documents: los PDFs institucionales de /documentos (bases, reglamentos,
-- formularios). El archivo vive en el bucket `documents`; aca van sus datos.
create table if not exists public.documents (
  id              bigint generated always as identity primary key,
  title           text not null check (length(trim(title)) > 0),
  description     text,
  file_url        text not null,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes > 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.documents is
  'PDFs descargables de /documentos. El buscador filtra sobre title y description.';
comment on column public.documents.file_size_bytes is
  'Peso del PDF, para mostrarlo junto al boton de descarga. Lo completa la subida.';
comment on column public.documents.is_active is
  'Ocultar un documento lo saca del sitio sin borrar el archivo.';


-- -----------------------------------------------------------------------------
-- 3. Indices
-- -----------------------------------------------------------------------------
-- Postgres no indexa las foreign keys automaticamente. Sin estos indices, un
-- borrado en la tabla referenciada hace seq scan, y las politicas RLS que
-- filtran por author_id tambien.

create index if not exists posts_category_id_idx on public.posts (category_id);
create index if not exists posts_author_id_idx   on public.posts (author_id);

-- El feed publico: siempre publicados, siempre ordenados por fecha
-- descendente. Indice parcial para que los borradores no ocupen lugar.
create index if not exists posts_published_feed_idx
  on public.posts (published_at desc)
  where status = 'published';

create index if not exists posts_category_published_idx
  on public.posts (category_id, published_at desc)
  where status = 'published';

create index if not exists posts_featured_idx
  on public.posts (published_at desc)
  where status = 'published' and is_featured;

create index if not exists sponsors_active_order_idx
  on public.sponsors (display_order, id)
  where is_active;

create index if not exists categories_display_order_idx
  on public.categories (display_order, id);

-- La consulta publica de /documentos: los activos, del mas reciente al mas
-- viejo. El buscador filtra en memoria sobre ese conjunto, que es chico.
create index if not exists documents_active_idx
  on public.documents (created_at desc)
  where is_active;


-- -----------------------------------------------------------------------------
-- 4. Helpers de seguridad
-- -----------------------------------------------------------------------------

-- Chequeo de rol admin.
--
-- Va en SECURITY DEFINER porque las politicas de `profiles` no pueden
-- consultar `profiles` sin recursion infinita de RLS. Es seguro porque no
-- toma parametros: solo puede responder sobre el usuario que la llama.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- anon tambien necesita EXECUTE: la politica SELECT de posts la evalua en
-- lecturas anonimas, donde simplemente devuelve false.
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;


-- updated_at automatico. No es SECURITY DEFINER: corre en el contexto del
-- trigger y no necesita privilegios extra.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;


-- Impide la escalada de privilegios.
--
-- Sin esto, la politica UPDATE de profiles (que deja a cada usuario editar su
-- propia fila) permitiria que un editor se pusiera role = 'admin' a si mismo.
-- RLS no puede comparar el valor viejo contra el nuevo; un trigger si.
--
-- La condicion `auth.uid() is not null` acota el guard a las peticiones hechas
-- por un usuario logueado, que es de donde puede venir la escalada. Sin esa
-- condicion el trigger tambien frena al SQL directo del dashboard, y entonces
-- el primer admin no se puede crear: no hay ningun admin todavia que pueda
-- promoverlo. Dejar afuera el contexto server-side no abre un agujero, porque
-- el rol anon no tiene politica de UPDATE sobre profiles.
--
-- Bootstrap del primer admin, desde el SQL Editor del dashboard:
--   update public.profiles set role = 'admin' where id = '<uuid del usuario>';
create or replace function private.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not private.is_admin()
  then
    raise exception 'Solo un admin puede cambiar el rol de un perfil'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_profile_role_change() from public, anon, authenticated;


-- Alta automatica del perfil al crearse el usuario.
--
-- IMPORTANTE: el registro publico debe estar DESHABILITADO en el dashboard de
-- Supabase (Authentication -> Sign In / Providers -> "Allow new users to sign
-- up" en off). Eso es configuracion de Auth y no se puede forzar desde SQL:
-- esta migracion no puede garantizarlo, solo dejarlo documentado.
-- Los editores se crean por invitacion o via Admin API.
--
-- El rol por defecto es 'editor'. Nunca 'admin': el primer admin se promueve a
-- mano con una sentencia UPDATE explicita.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;


-- Una sola nota destacada, con el intercambio en la base y no en la aplicacion.
--
-- `posts_update` exige ser el autor o admin, asi que un editor que destaca su
-- nota no puede apagar la destacada de otra persona: ese UPDATE previo se iria
-- filtrado por RLS sin error, devolviendo cero filas, y despues la escritura
-- chocaria contra el indice unico con un error crudo de clave duplicada.
--
-- SECURITY DEFINER es justamente para eso: el apagado del anterior corre con
-- privilegios de la funcion, mientras que la escritura de la propia nota sigue
-- pasando por RLS como siempre. No amplia lo que un editor puede editar; solo
-- le deja ceder la portada, que es la operacion que estaba pidiendo.
--
-- No hay recursion: el UPDATE de adentro pone `is_featured` en false, y para
-- esas filas la guarda de la primera linea no se cumple.
create or replace function private.una_sola_nota_destacada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_featured then
    update public.posts
    set is_featured = false
    where is_featured
      and id is distinct from new.id;
  end if;
  return new;
end;
$$;

revoke all on function private.una_sola_nota_destacada() from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 5. Triggers
-- -----------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function private.guard_profile_role_change();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function private.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function private.set_updated_at();

drop trigger if exists sponsors_set_updated_at on public.sponsors;
create trigger sponsors_set_updated_at
  before update on public.sponsors
  for each row execute function private.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function private.set_updated_at();

drop trigger if exists posts_una_sola_destacada on public.posts;
create trigger posts_una_sola_destacada
  before insert or update of is_featured on public.posts
  for each row
  execute function private.una_sola_nota_destacada();

-- La red del trigger, por si alguien toca la tabla a mano: un indice parcial
-- sobre una constante es la forma de decir "como mucho una fila cumple esta
-- condicion". Con el trigger puesto no deberia llegar a dispararse nunca.
create unique index if not exists posts_una_sola_destacada
  on public.posts ((true))
  where is_featured;


-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- -----------------------------------------------------------------------------
-- Las cinco tablas con sus cuatro politicas explicitas cada una: 20 politicas.
--
-- Nota sobre `(select auth.uid())`: el subquery hace que Postgres evalue la
-- funcion una sola vez por consulta en vez de una vez por fila.
--
-- Nota sobre los `true` de escritura: no son politicas abiertas. Estan
-- declaradas solo para el rol `authenticated`; `anon` no aparece en ninguna
-- politica de escritura, asi que un visitante sin sesion no pasa.

alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.posts      enable row level security;
alter table public.sponsors   enable row level security;
alter table public.documents  enable row level security;


-- ---- profiles ---------------------------------------------------------------
-- Lectura publica: las firmas de autor de las notas salen de aca.

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to anon, authenticated
  using (true);

-- El alta normal la hace el trigger handle_new_user, que al ser SECURITY
-- DEFINER no pasa por RLS. Esta politica cubre solo el alta manual.
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check ((select private.is_admin()));

-- Cada uno edita su perfil; el admin edita cualquiera. El cambio de `role`
-- lo bloquea el trigger profiles_guard_role, no esta politica.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using ((select private.is_admin()));


-- ---- categories -------------------------------------------------------------
-- Estructura del sitio: la maneja un admin. Un editor las usa, no las define.

drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
  for select to anon, authenticated
  using (true);

drop policy if exists categories_insert on public.categories;
create policy categories_insert on public.categories
  for insert to authenticated
  with check ((select private.is_admin()));

drop policy if exists categories_update on public.categories;
create policy categories_update on public.categories
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists categories_delete on public.categories;
create policy categories_delete on public.categories
  for delete to authenticated
  using ((select private.is_admin()));


-- ---- posts ------------------------------------------------------------------

-- Publico: solo publicados y con fecha ya cumplida.
-- Autenticado: ademas sus propios borradores; el admin ve todo.
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts
  for select to anon, authenticated
  using (
    (status = 'published' and published_at <= now())
    or author_id = (select auth.uid())
    or (select private.is_admin())
  );

-- Un editor no puede publicar a nombre de otro.
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    or (select private.is_admin())
  );

-- Un editor editando el post de otro autor debe fallar; un admin debe poder.
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts
  for update to authenticated
  using (
    author_id = (select auth.uid())
    or (select private.is_admin())
  )
  with check (
    author_id = (select auth.uid())
    or (select private.is_admin())
  );

drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or (select private.is_admin())
  );


-- ---- sponsors ---------------------------------------------------------------
-- Los administra todo el equipo, no solo el admin: en la practica cualquiera
-- carga un sponsor nuevo, y tener que pedirlo frena el trabajo. Corregir un
-- logo mal cargado es reversible, a diferencia de borrar la nota de otro.

drop policy if exists sponsors_select on public.sponsors;
create policy sponsors_select on public.sponsors
  for select to anon, authenticated
  using (is_active or (select auth.uid()) is not null);

drop policy if exists sponsors_insert on public.sponsors;
create policy sponsors_insert on public.sponsors
  for insert to authenticated
  with check (true);

drop policy if exists sponsors_update on public.sponsors;
create policy sponsors_update on public.sponsors
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists sponsors_delete on public.sponsors;
create policy sponsors_delete on public.sponsors
  for delete to authenticated
  using (true);


-- ---- documents --------------------------------------------------------------
-- Mismo reparto que sponsors: los administra todo el equipo. Borrar un
-- documento es reversible (se vuelve a subir el PDF), a diferencia de borrar
-- la nota publicada de otra persona.

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents
  for select to anon, authenticated
  using (is_active or (select auth.uid()) is not null);

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents
  for insert to authenticated
  with check (true);

drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents
  for delete to authenticated
  using (true);


-- -----------------------------------------------------------------------------
-- 7. Storage
-- -----------------------------------------------------------------------------
-- Cuatro buckets publicos en lectura: tres de imagenes del sitio (que igual
-- salen por CDN) y uno de PDFs descargables. La escritura queda para usuarios
-- autenticados.
--
-- Las cuatro politicas enumeran los buckets permitidos en un array, asi que
-- agregar un bucket obliga a reescribir las cuatro. Por eso las piezas nuevas
-- van en carpetas de un bucket existente cuando comparten dueno y permisos.

insert into storage.buckets (id, name, public)
values
  ('article-covers', 'article-covers', true),
  ('avatars',        'avatars',        true),
  ('sponsor-logos',  'sponsor-logos',  true),
  ('documents',      'documents',      true)
on conflict (id) do nothing;

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select to anon, authenticated
  using (
    bucket_id in ('article-covers', 'avatars', 'sponsor-logos', 'documents')
  );

drop policy if exists storage_authenticated_insert on storage.objects;
create policy storage_authenticated_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('article-covers', 'avatars', 'sponsor-logos', 'documents')
  );

drop policy if exists storage_authenticated_update on storage.objects;
create policy storage_authenticated_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('article-covers', 'avatars', 'sponsor-logos', 'documents')
  )
  with check (
    bucket_id in ('article-covers', 'avatars', 'sponsor-logos', 'documents')
  );

drop policy if exists storage_authenticated_delete on storage.objects;
create policy storage_authenticated_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('article-covers', 'avatars', 'sponsor-logos', 'documents')
  );
