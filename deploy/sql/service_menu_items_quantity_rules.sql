-- Reglas de cantidad para Servicios:
-- - Referencias saladas normales de Vino Español: 1.5 por persona.
-- - Referencias saladas normales de Cócteles: 1.2 por persona.
-- - Tablas: 15 grs por persona.
-- - Tortillas y dips: 1 cada 15 pax.
-- - Postres: se mantienen como 1 unidad.

update public.service_menu_items
set quantity_type = 'fijo',
    quantity = 1.5,
    divisor = null,
    unit = 'uds',
    updated_at = now()
where service_category = 'vino'
  and item_group = 'salado'
  and active = true;

update public.service_menu_items
set quantity_type = 'fijo',
    quantity = 1.2,
    divisor = null,
    unit = 'uds',
    updated_at = now()
where service_category = 'cocteles'
  and item_group = 'salado'
  and active = true;

update public.service_menu_items
set quantity_type = 'porPax',
    quantity = 15,
    divisor = null,
    unit = 'grs',
    updated_at = now()
where service_category in ('vino', 'cocteles')
  and item_group = 'salado'
  and active = true
  and name ilike '%tabla%';

update public.service_menu_items
set quantity_type = 'cadaXpax',
    quantity = 1,
    divisor = 15,
    unit = 'ud',
    updated_at = now()
where service_category in ('vino', 'cocteles')
  and item_group = 'salado'
  and active = true
  and (
    name ilike '%tortilla%'
    or name ilike '%dip %'
  );

update public.service_menu_items
set quantity_type = 'fijo',
    quantity = 1,
    divisor = null,
    unit = 'ud',
    updated_at = now()
where service_category = 'cocteles'
  and item_group = 'postre'
  and active = true;
