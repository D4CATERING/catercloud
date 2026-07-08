-- Unifica el catalogo de logistica de servicios dentro de public.logistics_materials.
--
-- Objetivo:
-- - logistics_materials queda como catalogo/inventario maestro.
-- - service_logistics_materials queda solo como respaldo temporal.
-- - Las reglas automaticas de servicios se guardan en logistics_materials.
-- - El orden de service_logistics_materials pasa a ser el orden principal
--   para los materiales que existen en ambas tablas.

alter table public.logistics_materials
  add column if not exists contexto_logistica text not null default 'menus',
  add column if not exists aplica_menus boolean not null default true,
  add column if not exists aplica_servicios boolean not null default false,
  add column if not exists unidad_comanda_servicio text,
  add column if not exists presentacion_servicio text,
  add column if not exists cantidad_base_servicios numeric not null default 0,
  add column if not exists cantidad_por_pax_servicios numeric not null default 0,
  add column if not exists redondeo_servicios numeric not null default 1,
  add column if not exists auto_calcular_servicios boolean not null default false,
  add column if not exists conversion_servicios numeric not null default 1,
  add column if not exists orden_servicios integer;

update public.logistics_materials
set
  contexto_logistica = coalesce(nullif(contexto_logistica, ''), 'menus'),
  aplica_menus = coalesce(aplica_menus, true),
  aplica_servicios = coalesce(aplica_servicios, false),
  redondeo_servicios = coalesce(nullif(redondeo_servicios, 0), 1),
  conversion_servicios = coalesce(nullif(conversion_servicios, 0), nullif(conversion_a_stock, 0), 1);

-- Actualiza materiales que ya existen en logistics_materials con reglas de servicios.
with servicios as (
  select
    case when tipo = 'material' then 'extras' else tipo end as tipo_unificado,
    *
  from public.service_logistics_materials
  where activo = true
)
update public.logistics_materials lm
set
  aplica_servicios = true,
  contexto_logistica = case
    when coalesce(lm.aplica_menus, true) then 'ambos'
    else 'servicios'
  end,
  subcategoria = coalesce(nullif(lm.subcategoria, ''), servicios.subcategoria),
  unidad_comanda_servicio = servicios.unidad_comanda,
  presentacion_servicio = servicios.presentacion,
  cantidad_base_servicios = coalesce(servicios.cantidad_base, 0),
  cantidad_por_pax_servicios = coalesce(servicios.cantidad_por_pax, 0),
  redondeo_servicios = coalesce(nullif(servicios.redondeo_a, 0), 1),
  auto_calcular_servicios = coalesce(servicios.auto_calcular, false),
  conversion_servicios = coalesce(nullif(servicios.conversion_a_stock, 0), nullif(servicios.contenido_por_unidad, 0), 1),
  orden_servicios = servicios.orden,
  orden = servicios.orden,
  presentacion = coalesce(servicios.presentacion, lm.presentacion),
  unidad_comanda = coalesce(nullif(lm.unidad_comanda, ''), servicios.unidad_comanda),
  unidad_inventario = coalesce(nullif(lm.unidad_inventario, ''), servicios.unidad_inventario),
  conversion_a_stock = coalesce(nullif(lm.conversion_a_stock, 0), nullif(servicios.conversion_a_stock, 0), nullif(servicios.contenido_por_unidad, 0), 1),
  activo = true
from servicios
where lower(lm.nombre) = lower(servicios.nombre)
  and lm.tipo in (servicios.tipo_unificado, servicios.tipo);

-- Inserta en logistics_materials los materiales de servicios que aun no existen.
with servicios as (
  select
    case when tipo = 'material' then 'extras' else tipo end as tipo_unificado,
    *
  from public.service_logistics_materials
  where activo = true
)
insert into public.logistics_materials (
  tipo,
  nombre,
  subcategoria,
  presentacion,
  unidad,
  unidad_comanda,
  unidad_inventario,
  contenido_por_unidad,
  conversion_a_stock,
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
  servicios.tipo_unificado,
  servicios.nombre,
  servicios.subcategoria,
  servicios.presentacion,
  servicios.unidad_comanda,
  servicios.unidad_comanda,
  servicios.unidad_inventario,
  servicios.contenido_por_unidad,
  coalesce(nullif(servicios.conversion_a_stock, 0), nullif(servicios.contenido_por_unidad, 0), 1),
  coalesce(servicios.stock_total, 0),
  servicios.orden,
  true,
  'servicios',
  false,
  true,
  servicios.unidad_comanda,
  servicios.presentacion,
  coalesce(servicios.cantidad_base, 0),
  coalesce(servicios.cantidad_por_pax, 0),
  coalesce(nullif(servicios.redondeo_a, 0), 1),
  coalesce(servicios.auto_calcular, false),
  coalesce(nullif(servicios.conversion_a_stock, 0), nullif(servicios.contenido_por_unidad, 0), 1),
  servicios.orden
from servicios
where not exists (
  select 1
  from public.logistics_materials lm
  where lower(lm.nombre) = lower(servicios.nombre)
    and lm.tipo in (servicios.tipo_unificado, servicios.tipo)
);

create index if not exists logistics_materials_contexto_idx
  on public.logistics_materials (contexto_logistica, aplica_servicios, aplica_menus, tipo, orden);

create or replace view public.logistics_materials_unified_review as
select
  id,
  tipo,
  nombre,
  contexto_logistica,
  aplica_menus,
  aplica_servicios,
  unidad_comanda,
  unidad_comanda_servicio,
  unidad_inventario,
  conversion_a_stock,
  conversion_servicios,
  cantidad_por_pax_servicios,
  auto_calcular_servicios,
  stock_total,
  orden,
  orden_servicios,
  activo
from public.logistics_materials
order by tipo, coalesce(orden_servicios, orden), nombre;

select *
from public.logistics_materials_unified_review;
