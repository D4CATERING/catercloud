-- Unidades por contexto dentro de public.logistics_materials.
-- Ejecutar en Supabase SQL Editor.
--
-- Regla:
-- - unidad_comanda: unidad visible para logistica de menus.
-- - unidad_comanda_servicio: unidad visible para logistica de servicios.
-- - cantidad_por_pax / cantidad_base / redondeo_a: calculo para menus.
-- - cantidad_por_pax_servicios / cantidad_base_servicios / redondeo_servicios:
--   calculo para servicios.

alter table public.logistics_materials
  add column if not exists contexto_logistica text not null default 'menus',
  add column if not exists aplica_menus boolean not null default true,
  add column if not exists aplica_servicios boolean not null default false,
  add column if not exists unidad_comanda text,
  add column if not exists unidad_comanda_servicio text,
  add column if not exists unidad_inventario text,
  add column if not exists contenido_por_unidad numeric,
  add column if not exists conversion_a_stock numeric not null default 1,
  add column if not exists conversion_servicios numeric not null default 1,
  add column if not exists cantidad_base numeric not null default 0,
  add column if not exists cantidad_por_pax numeric not null default 0,
  add column if not exists cantidad_base_servicios numeric not null default 0,
  add column if not exists cantidad_por_pax_servicios numeric not null default 0,
  add column if not exists redondeo_a numeric not null default 1,
  add column if not exists redondeo_servicios numeric not null default 1,
  add column if not exists auto_calcular boolean not null default false,
  add column if not exists auto_calcular_servicios boolean not null default false;

update public.logistics_materials
set
  unidad_comanda = coalesce(nullif(unidad_comanda, ''), nullif(unidad, ''), 'ud'),
  unidad_comanda_servicio = coalesce(nullif(unidad_comanda_servicio, ''), nullif(unidad_comanda, ''), nullif(unidad, ''), 'ud'),
  unidad_inventario = coalesce(nullif(unidad_inventario, ''), 'ud'),
  conversion_a_stock = coalesce(nullif(conversion_a_stock, 0), nullif(contenido_por_unidad, 0), 1),
  conversion_servicios = coalesce(nullif(conversion_servicios, 0), nullif(conversion_a_stock, 0), nullif(contenido_por_unidad, 0), 1),
  redondeo_a = coalesce(nullif(redondeo_a, 0), 1),
  redondeo_servicios = coalesce(nullif(redondeo_servicios, 0), 1),
  contexto_logistica = case
    when aplica_menus is true and aplica_servicios is true then 'ambos'
    when aplica_servicios is true then 'servicios'
    else 'menus'
  end;

-- Ejemplo: Agua en menus como unidades, pero en servicios como paquetes.
-- Ajusta el where si en tu catalogo el nombre exacto es distinto.
update public.logistics_materials
set
  aplica_menus = true,
  aplica_servicios = true,
  contexto_logistica = 'ambos',
  unidad_comanda = 'ud',
  unidad_comanda_servicio = 'paq',
  unidad_inventario = 'ud',
  contenido_por_unidad = coalesce(nullif(contenido_por_unidad, 0), 6),
  conversion_a_stock = 1,
  conversion_servicios = coalesce(nullif(conversion_servicios, 0), nullif(contenido_por_unidad, 0), 6)
where lower(nombre) in ('agua', 'agua mineral');

select
  nombre,
  tipo,
  aplica_menus,
  aplica_servicios,
  unidad_comanda as unidad_menus,
  unidad_comanda_servicio as unidad_servicios,
  unidad_inventario,
  conversion_a_stock,
  conversion_servicios
from public.logistics_materials
where lower(nombre) in ('agua', 'agua mineral')
order by nombre;
