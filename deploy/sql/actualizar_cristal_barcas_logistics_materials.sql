-- Actualiza las opciones del popup "Cristal" en public.logistics_materials.
-- Ejecutar en Supabase SQL Editor.
--
-- Resultado esperado en la comanda:
-- - Barca Copas de vino - 36 uds | cantidad 1 | unidad barca
-- - Barca Vaso on the rock - 25 uds | cantidad 1 | unidad barca
-- - Barca Vaso alto - 25 uds | cantidad 1 | unidad barca
-- - Barca Copas de cava - 49 uds | cantidad 1 | unidad barca

alter table public.logistics_materials
  add column if not exists unidad_inventario text,
  add column if not exists conversion_a_stock numeric not null default 1;

update public.logistics_materials
set nombre = 'Barca Copas de vino - 36 uds',
    unidad = 'barca',
    unidad_inventario = 'uds',
    conversion_a_stock = 36,
    orden = 1
where item_id = 'men_copas_vino';

update public.logistics_materials
set nombre = 'Barca Vaso on the rock - 25 uds',
    unidad = 'barca',
    unidad_inventario = 'uds',
    conversion_a_stock = 25,
    orden = 2
where item_id = 'men_vasos_bajos';

update public.logistics_materials
set nombre = 'Barca Vaso alto - 25 uds',
    unidad = 'barca',
    unidad_inventario = 'uds',
    conversion_a_stock = 25,
    orden = 3
where item_id = 'men_vasos_altos';

update public.logistics_materials
set nombre = 'Barca Copas de cava - 49 uds',
    unidad = 'barca',
    unidad_inventario = 'uds',
    conversion_a_stock = 49,
    orden = 4
where item_id = 'men_copas_cava';

-- Verificacion
select item_id, nombre, unidad, unidad_inventario, conversion_a_stock, orden
from public.logistics_materials
where item_id in ('men_copas_vino', 'men_vasos_bajos', 'men_vasos_altos', 'men_copas_cava')
order by orden;
