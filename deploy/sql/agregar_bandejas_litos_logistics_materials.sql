-- Agrega Bandejas y Litos al catalogo maestro de logistica.
-- Quedan disponibles tanto para menus como para servicios.
-- Ejecutar desde Supabase SQL Editor.

alter table public.logistics_materials
  add column if not exists contexto_logistica text not null default 'menus',
  add column if not exists aplica_menus boolean not null default true,
  add column if not exists aplica_servicios boolean not null default false,
  add column if not exists unidad_comanda text,
  add column if not exists unidad_inventario text,
  add column if not exists contenido_por_unidad numeric,
  add column if not exists conversion_a_stock numeric not null default 1,
  add column if not exists cantidad_base numeric not null default 0,
  add column if not exists cantidad_por_pax numeric not null default 0,
  add column if not exists redondeo_a numeric not null default 1,
  add column if not exists auto_calcular boolean not null default false,
  add column if not exists presentacion text,
  add column if not exists descripcion text,
  add column if not exists subcategoria text,
  add column if not exists stock_total numeric not null default 0,
  add column if not exists unidad_comanda_servicio text,
  add column if not exists presentacion_servicio text,
  add column if not exists cantidad_base_servicios numeric not null default 0,
  add column if not exists cantidad_por_pax_servicios numeric not null default 0,
  add column if not exists redondeo_servicios numeric not null default 1,
  add column if not exists auto_calcular_servicios boolean not null default false,
  add column if not exists conversion_servicios numeric not null default 1,
  add column if not exists orden_servicios integer;

with nuevos as (
  select *
  from (
    values
      ('Bandejas', 'Servicio', 605),
      ('Litos', 'Textil', 606)
  ) as item(nombre, subcategoria, orden)
)
update public.logistics_materials lm
set
  tipo = 'extras',
  subcategoria = nuevos.subcategoria,
  unidad = 'ud',
  unidad_comanda = 'ud',
  unidad_inventario = 'ud',
  contenido_por_unidad = 1,
  conversion_a_stock = 1,
  presentacion = null,
  descripcion = null,
  cantidad_base = 0,
  cantidad_por_pax = 0,
  redondeo_a = 1,
  auto_calcular = false,
  contexto_logistica = 'ambos',
  aplica_menus = true,
  aplica_servicios = true,
  unidad_comanda_servicio = 'ud',
  presentacion_servicio = null,
  cantidad_base_servicios = 0,
  cantidad_por_pax_servicios = 0,
  redondeo_servicios = 1,
  auto_calcular_servicios = false,
  conversion_servicios = 1,
  orden = nuevos.orden,
  orden_servicios = nuevos.orden,
  activo = true
from nuevos
where lower(lm.nombre) = lower(nuevos.nombre);

with nuevos as (
  select *
  from (
    values
      ('Bandejas', 'Servicio', 605),
      ('Litos', 'Textil', 606)
  ) as item(nombre, subcategoria, orden)
)
insert into public.logistics_materials (
  tipo,
  nombre,
  subcategoria,
  unidad,
  unidad_comanda,
  unidad_inventario,
  contenido_por_unidad,
  conversion_a_stock,
  presentacion,
  descripcion,
  cantidad_base,
  cantidad_por_pax,
  redondeo_a,
  auto_calcular,
  stock_total,
  orden,
  activo,
  contexto_logistica,
  aplica_menus,
  aplica_servicios,
  unidad_comanda_servicio,
  presentacion_servicio,
  cantidad_base_servicios,
  cantidad_por_pax_servicios,
  redondeo_servicios,
  auto_calcular_servicios,
  conversion_servicios,
  orden_servicios
)
select
  'extras',
  nuevos.nombre,
  nuevos.subcategoria,
  'ud',
  'ud',
  'ud',
  1,
  1,
  null,
  null,
  0,
  0,
  1,
  false,
  0,
  nuevos.orden,
  true,
  'ambos',
  true,
  true,
  'ud',
  null,
  0,
  0,
  1,
  false,
  1,
  nuevos.orden
from nuevos
where not exists (
  select 1
  from public.logistics_materials lm
  where lower(lm.nombre) = lower(nuevos.nombre)
);

select
  nombre,
  tipo,
  subcategoria,
  contexto_logistica,
  aplica_menus,
  aplica_servicios,
  unidad_comanda,
  orden,
  activo
from public.logistics_materials
where lower(nombre) in (lower('Bandejas'), lower('Litos'))
order by orden;
