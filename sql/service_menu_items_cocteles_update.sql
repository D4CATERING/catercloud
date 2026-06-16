alter table public.service_menu_items
add column if not exists item_group text not null default 'salado';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'service_menu_items_item_group_check'
  ) then
    alter table public.service_menu_items
    add constraint service_menu_items_item_group_check
    check (item_group in ('salado', 'postre'));
  end if;
end $$;

update public.service_menu_items
set active = false,
    updated_at = now()
where service_category = 'cocteles';

insert into public.service_menu_items
  (service_category, item_group, name, quantity_type, quantity, divisor, unit, display_order, active)
values
  ('cocteles', 'salado', 'Tabla de embutidos ibéricos con pan airbag y picos', 'fijo', 1, null, 'ud', 1, true),
  ('cocteles', 'salado', 'Tabla de paleta ibérica con pan airbag y picos', 'fijo', 1, null, 'ud', 2, true),
  ('cocteles', 'salado', 'Tabla de quesos internacionales con grissini, dátil y nueces', 'fijo', 1, null, 'ud', 3, true),
  ('cocteles', 'salado', 'Dip de hummus de remolacha con crudites de verduras', 'fijo', 1, null, 'ud', 4, true),
  ('cocteles', 'salado', 'Totopos con guacamole', 'fijo', 1, null, 'ud', 5, true),
  ('cocteles', 'salado', 'Brocheta de gilda', 'fijo', 1, null, 'ud', 6, true),
  ('cocteles', 'salado', 'Brocheta capresse', 'fijo', 1, null, 'ud', 7, true),
  ('cocteles', 'salado', 'Blinis con salmón crema agría y huevas', 'fijo', 1, null, 'ud', 8, true),
  ('cocteles', 'salado', 'Rollito de primavera con salsa agridulce', 'fijo', 1, null, 'ud', 9, true),
  ('cocteles', 'salado', 'Tartaletas fritas con tartar de salmón y aguacate', 'fijo', 1, null, 'ud', 10, true),
  ('cocteles', 'salado', 'Croquetas de jamón', 'fijo', 1, null, 'ud', 11, true),
  ('cocteles', 'salado', 'Croquetas de pollo', 'fijo', 1, null, 'ud', 12, true),
  ('cocteles', 'salado', 'Croquetas de boletus', 'fijo', 1, null, 'ud', 13, true),
  ('cocteles', 'salado', 'Buñuelos de bacalao', 'fijo', 1, null, 'ud', 14, true),
  ('cocteles', 'salado', 'Marinera de nuestra ensaladilla rusa con anchoa', 'fijo', 1, null, 'ud', 15, true),
  ('cocteles', 'salado', 'Mini canelón de boletus con bechamel de trufa', 'fijo', 1, null, 'ud', 16, true),
  ('cocteles', 'salado', 'Mini quiche Lorraine tradicional (puerro y bacon)', 'fijo', 1, null, 'ud', 17, true),
  ('cocteles', 'salado', 'Mini quiche de tomate seco y verduras', 'fijo', 1, null, 'ud', 18, true),
  ('cocteles', 'salado', 'Mini quiche de bacalao con cebolla caramelizada', 'fijo', 1, null, 'ud', 19, true),
  ('cocteles', 'salado', 'Empanadilla de calabaza y bacon', 'fijo', 1, null, 'ud', 20, true),
  ('cocteles', 'salado', 'Empanadilla de espinacas y pasas', 'fijo', 1, null, 'ud', 21, true),
  ('cocteles', 'salado', 'Empanadilla criolla', 'fijo', 1, null, 'ud', 22, true),
  ('cocteles', 'salado', 'Mini burger decuatro', 'fijo', 1, null, 'ud', 23, true),
  ('cocteles', 'salado', 'Vichisoisse', 'fijo', 1, null, 'ud', 24, true),
  ('cocteles', 'salado', 'Crema de calabaza', 'fijo', 1, null, 'ud', 25, true),
  ('cocteles', 'salado', 'Gazpacho', 'fijo', 1, null, 'ud', 26, true),
  ('cocteles', 'salado', 'Mini tartaleta de crema de salmón', 'fijo', 1, null, 'ud', 27, true),
  ('cocteles', 'salado', 'Mini tartaleta de nuestra ensaladilla rusa', 'fijo', 1, null, 'ud', 28, true),
  ('cocteles', 'salado', 'Pulguita de tortilla de patata', 'fijo', 1, null, 'ud', 29, true),
  ('cocteles', 'salado', 'Pulguita de verduras asadas', 'fijo', 1, null, 'ud', 30, true),
  ('cocteles', 'salado', 'Pulguita de pollo al curry', 'fijo', 1, null, 'ud', 31, true),
  ('cocteles', 'salado', 'Pulguita de paleta ibérica con tomate', 'fijo', 1, null, 'ud', 32, true),
  ('cocteles', 'salado', 'Pulguita de lomo y pimiento', 'fijo', 1, null, 'ud', 33, true),
  ('cocteles', 'salado', 'Gofre de patata bravioli', 'fijo', 1, null, 'ud', 34, true),
  ('cocteles', 'salado', 'Tortilla de patata', 'fijo', 1, null, 'ud', 35, true),
  ('cocteles', 'salado', 'Tortilla de patata con pimientos de padrón', 'fijo', 1, null, 'ud', 36, true),
  ('cocteles', 'salado', 'Tortilla de patata con chistorra', 'fijo', 1, null, 'ud', 37, true),
  ('cocteles', 'salado', 'Tortilla rellena de morcilla y pimientos', 'fijo', 1, null, 'ud', 38, true),
  ('cocteles', 'salado', 'Tortilla rellena de ensalada de langostinos', 'fijo', 1, null, 'ud', 39, true),
  ('cocteles', 'salado', 'Tortilla rellena de sobrasada y queso brie', 'fijo', 1, null, 'ud', 40, true),
  ('cocteles', 'salado', 'Mini brioche de calamares', 'fijo', 1, null, 'ud', 41, true),
  ('cocteles', 'salado', 'Mini brioche steak tartar', 'fijo', 1, null, 'ud', 42, true),
  ('cocteles', 'salado', 'Hojaldre caramelizado con foie', 'fijo', 1, null, 'ud', 43, true),
  ('cocteles', 'salado', 'Bao de langostino crujiente', 'fijo', 1, null, 'ud', 44, true),
  ('cocteles', 'salado', 'Brocheta de pollo teriyaki', 'fijo', 1, null, 'ud', 45, true),
  ('cocteles', 'salado', 'Brocheta de rape y langostino', 'fijo', 1, null, 'ud', 46, true),
  ('cocteles', 'salado', 'Brocheta de presa ibérica a la mostaza', 'fijo', 1, null, 'ud', 47, true),
  ('cocteles', 'salado', 'Cazuelita de carrilleras con cus cus', 'fijo', 1, null, 'ud', 48, true),
  ('cocteles', 'salado', 'Cazuelita de risotto de setas y crema tartufada', 'fijo', 1, null, 'ud', 49, true),
  ('cocteles', 'salado', 'Cazuelita de gulas al ajillo y gambón', 'fijo', 1, null, 'ud', 50, true),
  ('cocteles', 'salado', 'Brocheta de solomillo de ternera con padrón', 'fijo', 1, null, 'ud', 51, true),
  ('cocteles', 'postre', 'Brocheta de fruta', 'fijo', 1, null, 'ud', 1, true),
  ('cocteles', 'postre', 'Mini mochis de limoncello', 'fijo', 1, null, 'ud', 2, true),
  ('cocteles', 'postre', 'Mini mochis de frutos del bosque', 'fijo', 1, null, 'ud', 3, true),
  ('cocteles', 'postre', 'Trufas de chocolate', 'fijo', 1, null, 'ud', 4, true),
  ('cocteles', 'postre', 'Macaron de frutas', 'fijo', 1, null, 'ud', 5, true),
  ('cocteles', 'postre', 'Mini kit kat shot', 'fijo', 1, null, 'ud', 6, true),
  ('cocteles', 'postre', 'Mini oreo Sweet', 'fijo', 1, null, 'ud', 7, true),
  ('cocteles', 'postre', 'Mini tarta de queso', 'fijo', 1, null, 'ud', 8, true),
  ('cocteles', 'postre', 'Mini gofre con chocolate y frutos rojos', 'fijo', 1, null, 'ud', 9, true)
on conflict (service_category, name) do update set
  item_group = excluded.item_group,
  quantity_type = excluded.quantity_type,
  quantity = excluded.quantity,
  divisor = excluded.divisor,
  unit = excluded.unit,
  display_order = excluded.display_order,
  active = excluded.active,
  updated_at = now();
