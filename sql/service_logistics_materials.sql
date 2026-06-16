create table if not exists public.service_logistics_materials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tipo text not null check (tipo in ('bebidas', 'menaje', 'material')),
  nombre text not null,
  subcategoria text null,
  presentacion text null,
  unidad_comanda text not null default 'ud',
  unidad_inventario text not null default 'ud',
  contenido_por_unidad numeric null,
  cantidad_base numeric not null default 0,
  cantidad_por_pax numeric not null default 0,
  redondeo_a numeric not null default 1,
  auto_calcular boolean not null default false,
  stock_total numeric not null default 0,
  orden integer not null default 0,
  activo boolean not null default true,
  notas text null
);

alter table public.service_logistics_materials
  add column if not exists cantidad_base numeric not null default 0,
  add column if not exists cantidad_por_pax numeric not null default 0,
  add column if not exists redondeo_a numeric not null default 1,
  add column if not exists auto_calcular boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'service_logistics_materials_tipo_nombre_key'
  ) then
    alter table public.service_logistics_materials
      add constraint service_logistics_materials_tipo_nombre_key unique (tipo, nombre);
  end if;
end $$;

create index if not exists service_logistics_materials_tipo_idx
  on public.service_logistics_materials (tipo, orden, nombre)
  where activo = true;

alter table public.service_logistics_materials enable row level security;

drop policy if exists "service logistics read" on public.service_logistics_materials;
create policy "service logistics read"
  on public.service_logistics_materials
  for select
  to authenticated
  using (true);

drop policy if exists "service logistics admin write" on public.service_logistics_materials;
create policy "service logistics admin write"
  on public.service_logistics_materials
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

insert into public.service_logistics_materials
  (tipo, nombre, subcategoria, presentacion, unidad_comanda, unidad_inventario, contenido_por_unidad, cantidad_base, cantidad_por_pax, redondeo_a, auto_calcular, stock_total, orden)
values
  ('bebidas', 'Refrescos variados', 'Refrescos', 'Paquete', 'paquete', 'botella/lata', null, 0, 0.10, 1, true, 0, 10),
  ('bebidas', 'Agua mineral', 'Agua', 'Paquete', 'paquete', 'botella', null, 0, 0.10, 1, true, 0, 20),
  ('bebidas', 'Cerveza', 'Alcohol', 'Pack', 'pack', 'botella/lata', null, 0, 0.08, 1, true, 0, 30),
  ('bebidas', 'Vino blanco', 'Vino', 'Botella', 'botella', 'botella', 1, 0, 0.05, 1, true, 0, 40),
  ('bebidas', 'Vino tinto', 'Vino', 'Botella', 'botella', 'botella', 1, 0, 0.05, 1, true, 0, 50),
  ('menaje', 'Cristaleria', 'Cristaleria', 'Barca', 'barca', 'barca', null, 0, 0.025, 1, true, 0, 10),
  ('menaje', 'Vasos', 'Cristaleria', 'Barca', 'barca', 'barca', null, 0, 0.025, 1, true, 0, 20),
  ('menaje', 'Copas de vino', 'Cristaleria', 'Barca', 'barca', 'barca', null, 0, 0.025, 1, true, 0, 30),
  ('menaje', 'Platos', 'Vajilla', 'Caja', 'caja', 'caja', null, 0, 0, 1, false, 0, 40),
  ('menaje', 'Cubiertos', 'Vajilla', 'Pack', 'pack', 'pack', null, 0, 0, 1, false, 0, 50),
  ('material', 'Mesa tablero', 'Mobiliario', 'Unidad', 'ud', 'ud', 1, 0, 0.04, 1, true, 0, 10),
  ('material', 'Mesa velador', 'Mobiliario', 'Unidad', 'ud', 'ud', 1, 0, 0.04, 1, true, 0, 20),
  ('material', 'Mantel', 'Textil', 'Unidad', 'ud', 'ud', 1, 0, 0.04, 1, true, 0, 30),
  ('material', 'Flores', 'Decoracion', 'Unidad', 'ud', 'ud', 1, 0, 0, 1, false, 0, 40),
  ('material', 'Alzadores', 'Presentacion', 'Unidad', 'ud', 'ud', 1, 0, 0, 1, false, 0, 50)
on conflict (tipo, nombre) do update set
  subcategoria = excluded.subcategoria,
  presentacion = excluded.presentacion,
  unidad_comanda = excluded.unidad_comanda,
  unidad_inventario = excluded.unidad_inventario,
  contenido_por_unidad = excluded.contenido_por_unidad,
  cantidad_base = excluded.cantidad_base,
  cantidad_por_pax = excluded.cantidad_por_pax,
  redondeo_a = excluded.redondeo_a,
  auto_calcular = excluded.auto_calcular,
  orden = excluded.orden,
  activo = true,
  updated_at = now();
