-- Restaura las referencias grises generales de FOODBOX / COMIDA.
-- Estas referencias son generales: menu_legacy_id = 0.
-- No toca referencias especificas de menus como VEGGIE (menu_legacy_id = 8).

with referencias as (
  select *
  from (values
    ('gris_1', 2, 0, 'gris', 'Brocheta capresse', 'fijo', 1::numeric, null::integer, 'ud', 1, true),
    ('gris_2', 2, 0, 'gris', 'Rollito de primavera con salsa sweet chilli', 'fijo', 2::numeric, null::integer, 'uds', 2, true),
    ('gris_3', 2, 0, 'gris', 'Croquetas de jamón', 'fijo', 2::numeric, null::integer, 'uds', 3, true),
    ('gris_4', 2, 0, 'gris', 'Croquetas de boletus', 'fijo', 2::numeric, null::integer, 'uds', 4, true),
    ('gris_5', 2, 0, 'gris', 'Empanadilla de atún', 'fijo', 2::numeric, null::integer, 'uds', 5, true),
    ('gris_6', 2, 0, 'gris', 'Tabla de embutidos ibéricos con pan airbag (Lomo, salchichón, chorizo y fuet)', 'porPax', 15::numeric, null::integer, 'grs', 6, true),
    ('gris_7', 2, 0, 'gris', 'Falafel con salsa de yogurt', 'fijo', 2::numeric, null::integer, 'uds', 7, true),
    ('gris_8', 2, 0, 'gris', 'Wraps de mortadela trufada', 'fijo', 1::numeric, null::integer, 'ud', 8, true),
    ('gris_9', 2, 0, 'gris', 'Dip de hummus con pan naam', 'cadaXpax', 1::numeric, 10::integer, 'ud', 9, true),
    ('gris_10', 2, 0, 'gris', 'Tartaleta de nuestra ensaladilla rusa', 'fijo', 2::numeric, null::integer, 'uds', 10, true),
    ('gris_11', 2, 0, 'gris', 'Pulguita de tortilla de patata', 'fijo', 1::numeric, null::integer, 'ud', 11, true),
    ('gris_12', 2, 0, 'gris', 'Pulguita de verduras asadas', 'fijo', 1::numeric, null::integer, 'ud', 12, true),
    ('gris_13', 2, 0, 'gris', 'Pulguita de pollo al curry', 'fijo', 1::numeric, null::integer, 'ud', 13, true),
    ('gris_14', 2, 0, 'gris', 'Pulguita de aguacate y tomate', 'fijo', 1::numeric, null::integer, 'ud', 14, true),
    ('gris_15', 2, 0, 'gris', 'Quesadilla sincronizada', 'fijo', 2::numeric, null::integer, 'uds', 15, true),
    ('gris_16', 2, 0, 'gris', 'Gyozas con salsa de soja', 'fijo', 2::numeric, null::integer, 'uds', 16, true),
    ('gris_17', 2, 0, 'gris', 'Mini croissant mixto', 'fijo', 1::numeric, null::integer, 'ud', 17, true),
    ('gris_18', 2, 0, 'gris', 'Mini croissant de nuestra ensaladilla rusa', 'fijo', 1::numeric, null::integer, 'ud', 18, true),
    ('gris_19', 2, 0, 'gris', 'Mini sándwich de bacon y mayomostaza', 'fijo', 2::numeric, null::integer, 'uds', 19, true),
    ('gris_20', 2, 0, 'gris', 'Mini sándwich de tortilla de patata', 'fijo', 2::numeric, null::integer, 'uds', 20, true),
    ('gris_21', 2, 0, 'gris', 'Mini sándwich de crema de aguacate y tomate', 'fijo', 2::numeric, null::integer, 'uds', 21, true),
    ('gris_22', 2, 0, 'gris', 'Mini sándwich de pollo al curry', 'fijo', 2::numeric, null::integer, 'uds', 22, true),
    ('gris_23', 2, 0, 'gris', 'Mini sándwich vegetal', 'fijo', 2::numeric, null::integer, 'uds', 23, true),
    ('gris_24', 2, 0, 'gris', 'Mini sándwich de pechuga de pavo y queso edam', 'fijo', 2::numeric, null::integer, 'uds', 24, true),
    ('gris_25', 2, 0, 'gris', 'Mini bagel de proteína vegetal', 'fijo', 1::numeric, null::integer, 'ud', 25, true),
    ('gris_26', 2, 0, 'gris', 'Mini bagel de mortadela trufada', 'fijo', 1::numeric, null::integer, 'ud', 26, true),
    ('gris_27', 2, 0, 'gris', 'Mini bagel de salmón con crema de queso o aguacate', 'fijo', 1::numeric, null::integer, 'ud', 27, true),
    ('gris_28', 2, 0, 'gris', 'Mini bagel de pastrami y pepinillo agridulce', 'fijo', 1::numeric, null::integer, 'ud', 28, true),
    ('gris_29', 2, 0, 'gris', 'Mini bagel de roastbeef y cebolla confitada', 'fijo', 1::numeric, null::integer, 'ud', 29, true),
    ('gris_30', 2, 0, 'gris', 'Mini poke bowl de pollo teriyaki', 'fijo', 1::numeric, null::integer, 'ud', 30, true),
    ('gris_31', 2, 0, 'gris', 'Mini ensalada toscana', 'fijo', 1::numeric, null::integer, 'ud', 31, true),
    ('gris_32', 2, 0, 'gris', 'Mini Tabulé de cus cús y garbanzos', 'fijo', 1::numeric, null::integer, 'ud', 32, true),
    ('gris_33', 2, 0, 'gris', 'Mini Ensalada griega', 'fijo', 1::numeric, null::integer, 'ud', 33, true),
    ('gris_34', 2, 0, 'gris', 'Mini quiche lorraine tradicional (puerro y bacon)', 'fijo', 2::numeric, null::integer, 'uds', 34, true),
    ('gris_35', 2, 0, 'gris', 'Mini quiche de tomate seco y verduras', 'fijo', 2::numeric, null::integer, 'uds', 35, true),
    ('gris_36', 2, 0, 'gris', 'Bao de pulled pork', 'fijo', 1::numeric, null::integer, 'ud', 36, true),
    ('gris_37', 2, 0, 'gris', 'Tortilla de patata', 'cadaXpax', 1::numeric, 10::integer, 'ud', 37, true),
    ('gris_38', 2, 0, 'gris', 'Tortilla de patata con padrón', 'cadaXpax', 1::numeric, 10::integer, 'ud', 38, true),
    ('gris_39', 2, 0, 'gris', 'Cheese rings con salsa BBQ', 'fijo', 2::numeric, null::integer, 'uds', 39, true)
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
  and existing.menu_legacy_id = 0
  and existing.item_group = 'gris'
  and not exists (
    select 1
    from referencias r
    where r.name = existing.name
  );

select count(*) as grises_generales_activas
from public.menu_reference_items
where category_id = 2
  and menu_legacy_id = 0
  and item_group = 'gris'
  and active = true;
