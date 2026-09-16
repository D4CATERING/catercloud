-- Mueve "Postres variados" a la primera página de postres.
-- Ejecutar desde Supabase SQL Editor.

insert into public.menu_reference_items
  (legacy_id, category_id, menu_legacy_id, item_group, name, quantity_type, quantity, divisor, unit, display_order, active)
select 'postre_209', 2, 0, 'postre', 'Postres variados', 'postre', 1, null, 'ud', 8, true
where not exists (
  select 1
  from public.menu_reference_items
  where category_id = 2
    and item_group = 'postre'
    and lower(name) = lower('Postres variados')
);

with ordenado as (
  select
    id,
    row_number() over (
      order by
        case
          when lower(name) = lower('Postres variados') then 8
          when display_order >= 8 then display_order + 1
          else display_order
        end,
        display_order,
        name
    ) as nuevo_orden
  from public.menu_reference_items
  where category_id = 2
    and item_group = 'postre'
    and active = true
)
update public.menu_reference_items item
set display_order = ordenado.nuevo_orden,
    updated_at = now()
from ordenado
where item.id = ordenado.id;

with ordenado as (
  select
    id,
    row_number() over (
      order by
        case
          when lower(nombre) = lower('Postres variados') then 8
          when orden >= 8 then orden + 1
          else orden
        end,
        orden,
        nombre
    ) as nuevo_orden
  from public.foodbox_opciones
  where tipo = 'postre'
    and activo = true
)
update public.foodbox_opciones item
set orden = ordenado.nuevo_orden
from ordenado
where item.id = ordenado.id;

with ordenado as (
  select
    id,
    row_number() over (
      order by
        case
          when lower(nombre) = lower('Postres variados') then 8
          when orden >= 8 then orden + 1
          else orden
        end,
        orden,
        nombre
    ) as nuevo_orden
  from public.diy_bandejas_foodbox
  where tipo = 'postre'
    and activo = true
)
update public.diy_bandejas_foodbox item
set orden = ordenado.nuevo_orden
from ordenado
where item.id = ordenado.id;
