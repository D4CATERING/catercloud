-- Corrige la definicion del menu FOODBOX / COMIDA / ECONOMICO en Supabase.
-- La visibilidad de la seccion de postres depende de items_postres_max.

update public.menu_menus
set
  description = '5 ref. grises + 2 ref. rojas + 1 postre',
  items_gris_min = 5,
  items_gris_max = 5,
  items_rojo_min = 2,
  items_rojo_max = 2,
  items_salados_min = 0,
  items_salados_max = 0,
  items_postres_min = 1,
  items_postres_max = 1,
  mult_postres = 1,
  active = true
where category_id = 2
  and legacy_id = 5;

select
  legacy_id,
  category_id,
  name,
  items_gris_min,
  items_gris_max,
  items_rojo_min,
  items_rojo_max,
  items_postres_min,
  items_postres_max,
  mult_postres,
  active
from public.menu_menus
where category_id = 2
  and legacy_id = 5;
