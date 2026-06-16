create table if not exists public.service_menu_items (
  id uuid not null default gen_random_uuid(),
  service_category text not null,
  item_group text not null default 'salado',
  name text not null,
  quantity_type text not null default 'fijo',
  quantity numeric not null default 1,
  divisor integer null,
  unit text not null default 'ud',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint service_menu_items_pkey primary key (id)
);

alter table public.service_menu_items
add column if not exists item_group text not null default 'salado';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'service_menu_items_category_name_key'
  ) then
    alter table public.service_menu_items
    add constraint service_menu_items_category_name_key unique (service_category, name);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'service_menu_items_quantity_type_check'
  ) then
    alter table public.service_menu_items
    add constraint service_menu_items_quantity_type_check
    check (quantity_type in ('fijo', 'porPax', 'cadaXpax', 'postre'));
  end if;

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

alter table public.service_menu_items enable row level security;

drop policy if exists "service_menu_items_read_authenticated" on public.service_menu_items;
create policy "service_menu_items_read_authenticated"
on public.service_menu_items
for select
to authenticated
using (active = true);

delete from public.service_menu_items
where service_category in ('vino', 'cocteles');

insert into public.service_menu_items
  (service_category, item_group, name, quantity_type, quantity, divisor, unit, display_order, active)
values
  -- VINO ESPAÑOL
  ('vino', 'salado', 'Patatas fritas', 'fijo', 1, null, 'ud', 1, true),
  ('vino', 'salado', 'Encurtidos variados', 'fijo', 1, null, 'ud', 2, true),
  ('vino', 'salado', 'Dados de queso', 'fijo', 1, null, 'ud', 3, true),
  ('vino', 'salado', 'Tortilla de patata', 'fijo', 1, null, 'ud', 4, true),
  ('vino', 'salado', 'Tabla de paleta ibérica con picos y pan airbag', 'fijo', 1, null, 'ud', 5, true),
  ('vino', 'salado', 'Croquetas de jamón', 'fijo', 1, null, 'ud', 6, true),
  ('vino', 'salado', 'Mini bagel de mortadela', 'fijo', 1, null, 'ud', 7, true),
  ('vino', 'salado', 'Gilda', 'fijo', 1, null, 'ud', 8, true),
  ('vino', 'salado', 'Tabla de quesos internacionales con grissini, dátiles y nueces', 'fijo', 1, null, 'ud', 9, true),
  ('vino', 'salado', 'Pulguita de paleta ibérica con tomate', 'fijo', 1, null, 'ud', 10, true),
  ('vino', 'salado', 'Croquetas de pollo', 'fijo', 1, null, 'ud', 11, true),
  ('vino', 'salado', 'Empanadilla', 'fijo', 1, null, 'ud', 12, true),
  ('vino', 'salado', 'Mini wraps de pastrami', 'fijo', 1, null, 'ud', 13, true),
  ('vino', 'salado', 'Tortilla de patata con padrón', 'fijo', 1, null, 'ud', 14, true),
  ('vino', 'salado', 'Brocheta capresse', 'fijo', 1, null, 'ud', 15, true),
  ('vino', 'salado', 'Rollito de primavera con salsa sweet chili', 'fijo', 1, null, 'ud', 16, true),
  ('vino', 'salado', 'Croquetas de boletus', 'fijo', 1, null, 'ud', 17, true),
  ('vino', 'salado', 'Empanadilla de atún', 'fijo', 1, null, 'ud', 18, true),
  ('vino', 'salado', 'Tabla de embutidos ibéricos con pan airbag', 'fijo', 1, null, 'ud', 19, true),
  ('vino', 'salado', 'Falafel con salsa de yogurt', 'fijo', 1, null, 'ud', 20, true),
  ('vino', 'salado', 'Wraps de mortadela trufada', 'fijo', 1, null, 'ud', 21, true),
  ('vino', 'salado', 'Dip de hummus con pan naam', 'fijo', 1, null, 'ud', 22, true),
  ('vino', 'salado', 'Tartaleta de nuestra ensaladilla rusa', 'fijo', 1, null, 'ud', 23, true),
  ('vino', 'salado', 'Pulguita de tortilla de patata', 'fijo', 1, null, 'ud', 24, true),
  ('vino', 'salado', 'Pulguita de verduras asadas', 'fijo', 1, null, 'ud', 25, true),
  ('vino', 'salado', 'Quesadilla sincronizada', 'fijo', 1, null, 'ud', 26, true),
  ('vino', 'salado', 'Gyozas con salsa de soja', 'fijo', 1, null, 'ud', 27, true),
  ('vino', 'salado', 'Mini croissant mixto', 'fijo', 1, null, 'ud', 28, true),
  ('vino', 'salado', 'Mini croissant de nuestra ensaladilla rusa', 'fijo', 1, null, 'ud', 29, true),
  ('vino', 'salado', 'Mini sándwich de bacon y mayomostaza', 'fijo', 1, null, 'ud', 30, true),
  ('vino', 'salado', 'Mini sándwich de tortilla de patata', 'fijo', 1, null, 'ud', 31, true),
  ('vino', 'salado', 'Mini sándwich de crema de aguacate y tomate', 'fijo', 1, null, 'ud', 32, true),
  ('vino', 'salado', 'Mini sándwich de pollo al curry', 'fijo', 1, null, 'ud', 33, true),
  ('vino', 'salado', 'Mini sándwich vegetal', 'fijo', 1, null, 'ud', 34, true),
  ('vino', 'salado', 'Mini sándwich de pechuga de pavo y queso edam', 'fijo', 1, null, 'ud', 35, true),
  ('vino', 'salado', 'Mini bagel de roastbeef y cebolla confitada', 'fijo', 1, null, 'ud', 36, true),
  ('vino', 'salado', 'Mini poke bowl de pollo teriyaki', 'fijo', 1, null, 'ud', 37, true),
  ('vino', 'salado', 'Mini ensalada toscana', 'fijo', 1, null, 'ud', 38, true),
  ('vino', 'salado', 'Mini Tabulé de cus cús y garbanzos', 'fijo', 1, null, 'ud', 39, true),
  ('vino', 'salado', 'Mini Ensalada griega', 'fijo', 1, null, 'ud', 40, true),
  ('vino', 'salado', 'Mini quiche lorraine tradicional (puerro y bacon)', 'fijo', 1, null, 'ud', 41, true),
  ('vino', 'salado', 'Mini quiche de tomate seco y verduras', 'fijo', 1, null, 'ud', 42, true),
  ('vino', 'salado', 'Bao de pulled pork', 'fijo', 1, null, 'ud', 43, true),
  ('vino', 'salado', 'Cheese rings con salsa BBQ', 'fijo', 1, null, 'ud', 44, true),

  -- CÓCTELES: REFERENCIAS SALADAS
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

  -- CÓCTELES: POSTRES
  ('cocteles', 'postre', 'Brocheta de fruta', 'fijo', 1, null, 'ud', 1, true),
  ('cocteles', 'postre', 'Mini mochis de limoncello', 'fijo', 1, null, 'ud', 2, true),
  ('cocteles', 'postre', 'Mini mochis de frutos del bosque', 'fijo', 1, null, 'ud', 3, true),
  ('cocteles', 'postre', 'Trufas de chocolate', 'fijo', 1, null, 'ud', 4, true),
  ('cocteles', 'postre', 'Macaron de frutas', 'fijo', 1, null, 'ud', 5, true),
  ('cocteles', 'postre', 'Mini kit kat shot', 'fijo', 1, null, 'ud', 6, true),
  ('cocteles', 'postre', 'Mini oreo Sweet', 'fijo', 1, null, 'ud', 7, true),
  ('cocteles', 'postre', 'Mini tarta de queso', 'fijo', 1, null, 'ud', 8, true),
  ('cocteles', 'postre', 'Mini gofre con chocolate y frutos rojos', 'fijo', 1, null, 'ud', 9, true);

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
