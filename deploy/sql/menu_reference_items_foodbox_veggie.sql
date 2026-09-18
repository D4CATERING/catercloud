-- Catalogo especifico para Foodbox/Comida VEGGIE.
-- Mantiene una sola lista de 6 referencias saladas y habilita postre opcional.

update public.menu_menus
set
  description = '6 referencias + postre opcional',
  items_gris_min = 6,
  items_gris_max = 6,
  items_rojo_min = 0,
  items_rojo_max = 0,
  items_salados_min = 0,
  items_salados_max = 0,
  items_postres_min = 0,
  items_postres_max = 1,
  mult_postres = 1,
  updated_at = now()
where category_id = 2
  and legacy_id = 8;

with referencias as (
  select *
  from (values
    ('veggie_gris_1', 2, 8, 'gris', 'Brocheta capresse', 'fijo', 1::numeric, null::integer, 'ud', 1, true),
    ('veggie_gris_2', 2, 8, 'gris', 'Croquetas de boletus', 'fijo', 2::numeric, null::integer, 'uds', 2, true),
    ('veggie_gris_3', 2, 8, 'gris', 'Falafel con salsa de yogurt', 'fijo', 2::numeric, null::integer, 'uds', 3, true),
    ('veggie_gris_4', 2, 8, 'gris', 'Dip de hummus con naan', 'cadaXpax', 1::numeric, 10::integer, 'ud', 4, true),
    ('veggie_gris_5', 2, 8, 'gris', 'Pulguita de verduras asadas', 'fijo', 1::numeric, null::integer, 'ud', 5, true),
    ('veggie_gris_6', 2, 8, 'gris', 'Mini sándwich de crema de aguacate y tomate', 'fijo', 2::numeric, null::integer, 'uds', 6, true),
    ('veggie_gris_7', 2, 8, 'gris', 'Mini sándwich vegetal', 'fijo', 2::numeric, null::integer, 'uds', 7, true),
    ('veggie_gris_8', 2, 8, 'gris', 'Mini bagel de proteína vegetal', 'fijo', 1::numeric, null::integer, 'ud', 8, true),
    ('veggie_gris_9', 2, 8, 'gris', 'Mini ensalada toscana', 'fijo', 1::numeric, null::integer, 'ud', 9, true),
    ('veggie_gris_10', 2, 8, 'gris', 'Mini tabulé de cus cús y garbanzos', 'fijo', 1::numeric, null::integer, 'ud', 10, true),
    ('veggie_gris_11', 2, 8, 'gris', 'Mini ensalada griega', 'fijo', 1::numeric, null::integer, 'ud', 11, true),
    ('veggie_gris_12', 2, 8, 'gris', 'Mini quiche de tomate seco y verduras', 'fijo', 2::numeric, null::integer, 'uds', 12, true),
    ('veggie_gris_13', 2, 8, 'gris', 'Tortilla de patata', 'cadaXpax', 1::numeric, 10::integer, 'ud', 13, true),
    ('veggie_gris_14', 2, 8, 'gris', 'Tortilla de patata con padrón', 'cadaXpax', 1::numeric, 10::integer, 'ud', 14, true),
    ('veggie_gris_15', 2, 8, 'gris', 'Cheese rings con salsa BBQ', 'fijo', 2::numeric, null::integer, 'uds', 15, true),
    ('veggie_gris_16', 2, 8, 'gris', 'Empanadilla de espinaca y pasas', 'fijo', 2::numeric, null::integer, 'uds', 16, true),
    ('veggie_gris_17', 2, 8, 'gris', 'Mini sándwich de queso gorgonzola y nueces', 'fijo', 2::numeric, null::integer, 'uds', 17, true),
    ('veggie_gris_18', 2, 8, 'gris', 'Tabla de quesos internacionales con grissini, dátil y nueces', 'porPax', 15::numeric, null::integer, 'grs', 18, true),
    ('veggie_gris_19', 2, 8, 'gris', 'Pulguita de proteína vegetal', 'fijo', 1::numeric, null::integer, 'ud', 19, true),
    ('veggie_postre_201', 2, 8, 'postre', 'Brocheta de fruta', 'postre', 1::numeric, null::integer, 'ud', 1, true),
    ('veggie_postre_202', 2, 8, 'postre', 'Mini cheescake', 'postre', 1::numeric, null::integer, 'ud', 2, true),
    ('veggie_postre_203', 2, 8, 'postre', 'Mini brownie con crema inglesa', 'postre', 1::numeric, null::integer, 'ud', 3, true),
    ('veggie_postre_204', 2, 8, 'postre', 'Mini arroz con leche', 'postre', 1::numeric, null::integer, 'ud', 4, true),
    ('veggie_postre_205', 2, 8, 'postre', 'Mini natillas con galleta', 'postre', 1::numeric, null::integer, 'ud', 5, true),
    ('veggie_postre_206', 2, 8, 'postre', 'Mini oreo sweet', 'postre', 1::numeric, null::integer, 'ud', 6, true),
    ('veggie_postre_207', 2, 8, 'postre', 'Mini kitkat shot', 'postre', 1::numeric, null::integer, 'ud', 7, true),
    ('veggie_postre_208', 2, 8, 'postre', 'Mini tiramisú', 'postre', 1::numeric, null::integer, 'ud', 8, true),
    ('veggie_postre_209', 2, 8, 'postre', 'Postres variados', 'postre', 1::numeric, null::integer, 'ud', 9, true)
  ) as t(legacy_id, category_id, menu_legacy_id, item_group, name, quantity_type, quantity, divisor, unit, display_order, active)
),
upserted as (
  insert into public.menu_reference_items
    (legacy_id, category_id, menu_legacy_id, item_group, name, quantity_type, quantity, divisor, unit, display_order, active)
  select legacy_id, category_id, menu_legacy_id, item_group, name, quantity_type, quantity, divisor, unit, display_order, active
  from referencias
  on conflict (category_id, menu_legacy_id, item_group, name) do update set
    legacy_id = excluded.legacy_id,
    quantity_type = excluded.quantity_type,
    quantity = excluded.quantity,
    divisor = excluded.divisor,
    unit = excluded.unit,
    display_order = excluded.display_order,
    active = excluded.active,
    updated_at = now()
  returning name
)
update public.menu_reference_items existing
set active = false,
    updated_at = now()
where existing.category_id = 2
  and existing.menu_legacy_id = 8
  and not exists (
    select 1
    from referencias r
    where r.item_group = existing.item_group
      and r.name = existing.name
  );
