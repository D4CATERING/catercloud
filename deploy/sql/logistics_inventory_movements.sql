alter table public.logistics_materials
  add column if not exists unidad_inventario text,
  add column if not exists conversion_a_stock numeric not null default 1;

comment on column public.logistics_materials.unidad_inventario is
  'Unidad base del inventario. Ejemplo: ud, barca, caja.';

comment on column public.logistics_materials.conversion_a_stock is
  'Cantidad de unidades de inventario que descuenta 1 unidad de comanda. Ejemplo: menu refresco 1 ud = 1 ud.';

alter table public.service_logistics_materials
  add column if not exists conversion_a_stock numeric not null default 1;

comment on column public.service_logistics_materials.conversion_a_stock is
  'Cantidad de unidades de inventario que descuenta 1 unidad de comanda. Ejemplo: 1 paquete de refrescos = 24 uds.';

create table if not exists public.logistics_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_code text not null,
  logistics_code text null,
  source_table text not null check (source_table in ('logistics_materials', 'service_logistics_materials')),
  material_id uuid not null,
  material_name text not null,
  movement_type text not null check (movement_type in ('salida', 'entrada', 'ajuste')),
  quantity_order numeric not null default 0,
  unit_order text not null default 'ud',
  conversion_to_stock numeric not null default 1,
  quantity_stock numeric not null default 0,
  unit_stock text not null default 'ud',
  reason text null,
  created_by uuid null references auth.users (id)
);

create index if not exists logistics_inventory_movements_order_idx
  on public.logistics_inventory_movements (order_code, logistics_code);

create index if not exists logistics_inventory_movements_material_idx
  on public.logistics_inventory_movements (source_table, material_id);

alter table public.logistics_inventory_movements enable row level security;

drop policy if exists "inventory movements read" on public.logistics_inventory_movements;
create policy "inventory movements read"
  on public.logistics_inventory_movements
  for select
  to authenticated
  using (true);

drop policy if exists "inventory movements admin write" on public.logistics_inventory_movements;
create policy "inventory movements admin write"
  on public.logistics_inventory_movements
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.register_logistics_inventory_movement(
  p_order_code text,
  p_logistics_code text,
  p_source_table text,
  p_material_id uuid,
  p_material_name text,
  p_movement_type text,
  p_quantity_order numeric,
  p_unit_order text,
  p_conversion_to_stock numeric,
  p_unit_stock text,
  p_reason text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quantity_stock numeric;
begin
  v_quantity_stock := coalesce(p_quantity_order, 0) * coalesce(nullif(p_conversion_to_stock, 0), 1);

  insert into public.logistics_inventory_movements (
    order_code,
    logistics_code,
    source_table,
    material_id,
    material_name,
    movement_type,
    quantity_order,
    unit_order,
    conversion_to_stock,
    quantity_stock,
    unit_stock,
    reason,
    created_by
  ) values (
    p_order_code,
    p_logistics_code,
    p_source_table,
    p_material_id,
    p_material_name,
    p_movement_type,
    coalesce(p_quantity_order, 0),
    coalesce(p_unit_order, 'ud'),
    coalesce(nullif(p_conversion_to_stock, 0), 1),
    v_quantity_stock,
    coalesce(p_unit_stock, 'ud'),
    p_reason,
    auth.uid()
  );

  if p_source_table = 'logistics_materials' then
    update public.logistics_materials
      set stock_total = greatest(0, coalesce(stock_total, 0) +
        case when p_movement_type = 'salida' then -v_quantity_stock else v_quantity_stock end)
      where id = p_material_id;
  elsif p_source_table = 'service_logistics_materials' then
    update public.service_logistics_materials
      set stock_total = greatest(0, coalesce(stock_total, 0) +
        case when p_movement_type = 'salida' then -v_quantity_stock else v_quantity_stock end),
          updated_at = now()
      where id = p_material_id;
  end if;
end;
$$;

grant execute on function public.register_logistics_inventory_movement(
  text, text, text, uuid, text, text, numeric, text, numeric, text, text
) to authenticated;

update public.service_logistics_materials
set conversion_a_stock = 24,
    unidad_inventario = coalesce(unidad_inventario, 'ud')
where lower(nombre) like '%refresco%'
   or lower(nombre) like '%agua%'
   or lower(nombre) like '%cerveza%';
