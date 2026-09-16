-- Carta general en Supabase para menús que antes estaban fijos en el código.
-- Ejecutar desde Supabase SQL Editor.

create table if not exists public.menu_menus (
  id uuid not null default gen_random_uuid(),
  legacy_id integer not null,
  category_id integer not null,
  effective_category_id integer null,
  name text not null,
  description text null,
  menu_type text null,
  service_category text null,
  items_gris_min integer not null default 0,
  items_gris_max integer not null default 0,
  items_rojo_min integer not null default 0,
  items_rojo_max integer not null default 0,
  items_salados_min integer not null default 0,
  items_salados_max integer not null default 0,
  items_postres_min integer not null default 0,
  items_postres_max integer not null default 0,
  mult_postres numeric not null default 1,
  omit_material_menu boolean not null default false,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint menu_menus_pkey primary key (id),
  constraint menu_menus_legacy_id_key unique (legacy_id)
);

create table if not exists public.menu_reference_items (
  id uuid not null default gen_random_uuid(),
  legacy_id text null,
  category_id integer not null,
  menu_legacy_id integer not null default 0,
  item_group text not null default 'gris',
  name text not null,
  quantity_type text not null default 'fijo',
  quantity numeric not null default 1,
  divisor integer null,
  unit text not null default 'ud',
  quantity_per_pax numeric null,
  selector_termo boolean not null default false,
  options jsonb null,
  pulguitas jsonb null,
  fixed_flavor text null,
  sandwiches_count integer null,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint menu_reference_items_pkey primary key (id),
  constraint menu_reference_items_unique_key unique (category_id, menu_legacy_id, item_group, name),
  constraint menu_reference_items_group_check check (item_group in ('gris', 'rojo', 'postre', 'desayuno')),
  constraint menu_reference_items_quantity_type_check check (quantity_type in ('fijo', 'porPax', 'cadaXpax', 'postre', 'termo', 'leche_especial', 'zumo', 'simple', 'bolleria', 'sandwich', 'sandwich_multiple', 'sandwich_o_pulguita', 'sandwich_fijo'))
);

alter table public.menu_reference_items
  alter column menu_legacy_id set default 0;

update public.menu_reference_items
set menu_legacy_id = 0
where menu_legacy_id is null;

alter table public.menu_reference_items
  alter column menu_legacy_id set not null;

alter table public.menu_menus enable row level security;
alter table public.menu_reference_items enable row level security;

drop policy if exists "menu_menus_read_authenticated" on public.menu_menus;
create policy "menu_menus_read_authenticated"
on public.menu_menus
for select
to authenticated
using (active = true);

drop policy if exists "menu_reference_items_read_authenticated" on public.menu_reference_items;
create policy "menu_reference_items_read_authenticated"
on public.menu_reference_items
for select
to authenticated
using (active = true);

insert into public.menu_menus
  (legacy_id, category_id, effective_category_id, name, description, menu_type, service_category,
   items_gris_min, items_gris_max, items_rojo_min, items_rojo_max, items_salados_min, items_salados_max,
   items_postres_min, items_postres_max, mult_postres, display_order, active)
values
  (17, 1, null, 'WELCOME COFFEE & COFFEE BREAK', 'Termo café + leche + 2 mini cookies o pastas de té + 1 mini bollería + agua mineral', null, null, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, true),
  (1, 1, null, 'HEALTHY', 'Termo café + leche + infusión + tostada aguacate y tomate + fruta + bollería + mini sándwich + zumo naranja', null, null, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, true),
  (2, 1, null, 'CLASSIC', 'Termo café + leche + infusión + 2 mini bollerías + 2 sándwiches + fruta preparada + zumo naranja', null, null, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, true),
  (3, 1, null, 'PREMIUM', 'Termo café + leche + infusión + cookie/muffin + bollería + 2 sándwiches ó 1 pulguita + fruta/yogur + smoothie', null, null, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, true),
  (4, 1, null, 'VEGGIE', 'Termo café + leche vegetal + infusión + cookie vegana + sándwich vegetal + sándwich aguacate-tomate + fruta + zumo naranja', null, null, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5, true),
  (18, 2, null, 'BASIC', '5 ref. grises + 1 ref. roja', null, null, 5, 5, 1, 1, 0, 0, 0, 0, 1, 1, true),
  (5, 2, null, 'ECONÓMICO', '5 ref. grises + 2 ref. rojas + 1 postre', null, null, 5, 5, 2, 2, 0, 0, 1, 1, 1, 2, true),
  (6, 2, null, 'MEDIO', '6 ref. grises + 4 ref. rojas + 2 postres', null, null, 6, 6, 4, 4, 0, 0, 2, 2, 1, 3, true),
  (7, 2, null, 'MUYTOP', '8 ref. grises + 7 ref. rojas + 3 postres', null, null, 8, 8, 7, 7, 0, 0, 3, 3, 0.75, 4, true),
  (8, 2, null, 'VEGGIE', '6 ref. grises sin rojas', null, null, 6, 6, 0, 0, 0, 0, 0, 0, 1, 5, true),
  (15, 4, null, 'FOODBOX LUNCH', 'Elige una ensalada o un sándwich + postre + bebida', 'foodbox_lunch', null, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, true),
  (16, 5, 5, 'DO IT YOURSELF DESAYUNOS', 'Bandejas de desayuno para montar', null, null, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, true),
  (6017, 5, 6, 'DO IT YOURSELF FOODBOX', 'Bandejas foodbox para montar', null, null, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, true),
  (301, 3, null, 'BRINDIS', 'Vino Español · selección de 4 ítems', null, 'vino', 0, 0, 0, 0, 4, 4, 0, 0, 1, 1, true),
  (302, 3, null, 'NETWORKING', 'Vino Español · selección de 6 ítems', null, 'vino', 0, 0, 0, 0, 6, 6, 0, 0, 1, 2, true),
  (303, 3, null, 'AFTERWORK', 'Vino Español · selección de 8 ítems', null, 'vino', 0, 0, 0, 0, 8, 8, 0, 0, 1, 3, true),
  (313, 3, null, 'ALUCINANCIA', '10 referencias saladas + 1 postre', null, 'cocteles', 0, 0, 0, 0, 10, 10, 1, 1, 1, 4, true),
  (312, 3, null, 'DECUATRO', '12 referencias saladas + 2 postres · postres 0.75/pax', null, 'cocteles', 0, 0, 0, 0, 12, 12, 2, 2, 0.75, 5, true),
  (314, 3, null, 'ATRACTIVIDAD', '14 referencias saladas + 3 postres · postres 0.5/pax', null, 'cocteles', 0, 0, 0, 0, 14, 14, 3, 3, 0.5, 6, true)
on conflict (legacy_id) do update set
  category_id = excluded.category_id,
  effective_category_id = excluded.effective_category_id,
  name = excluded.name,
  description = excluded.description,
  menu_type = excluded.menu_type,
  service_category = excluded.service_category,
  items_gris_min = excluded.items_gris_min,
  items_gris_max = excluded.items_gris_max,
  items_rojo_min = excluded.items_rojo_min,
  items_rojo_max = excluded.items_rojo_max,
  items_salados_min = excluded.items_salados_min,
  items_salados_max = excluded.items_salados_max,
  items_postres_min = excluded.items_postres_min,
  items_postres_max = excluded.items_postres_max,
  mult_postres = excluded.mult_postres,
  display_order = excluded.display_order,
  active = excluded.active,
  updated_at = now();
