-- =============================================================================
-- Nueva categoria de noticias: Otras Actividades
-- =============================================================================
--
-- Tercera categoria, junto a Novedades e Institucional, para cubrir otros
-- torneos en los que participa La Metro (nacionales, internacionales,
-- supercopas, campeones de liga). Se trata igual que las otras dos: mismo
-- estilo visual, se mezcla en el mismo feed de la portada y en /noticias,
-- sin pagina propia.

insert into public.categories (name, slug, display_order)
values
  ('Otras Actividades', 'otras-actividades', 30)
on conflict (slug) do update
  set name          = excluded.name,
      display_order = excluded.display_order;
