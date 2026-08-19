-- =============================================================================
-- Datos iniciales: las categorias de las noticias
-- =============================================================================
--
-- Idempotente: el upsert por slug actualiza en vez de duplicar.
-- Las bajadas (description) quedan vacias; se cargan desde el CMS cuando el
-- equipo las escriba.

insert into public.categories (name, slug, display_order)
values
  ('Novedades',     'novedades',     10),
  ('Institucional', 'institucional', 20)
on conflict (slug) do update
  set name          = excluded.name,
      display_order = excluded.display_order;
