-- Normaliza public.logistics_materials para que use la misma logica
-- de inventario que public.service_logistics_materials.
--
-- Idea:
-- - unidad_comanda: como se pide o se muestra en la comanda.
-- - unidad_inventario: unidad base real que se descuenta del stock.
-- - conversion_a_stock: cuantas unidades de inventario descuenta 1 unidad de comanda.
--
-- Ejemplos:
-- - Menu: Refrescos, 6 ud -> descuenta 6 ud.
-- - Servicio: Coca normal, 1 paq -> descuenta 24 ud.
-- - Cristal: Vaso alto, 1 barca -> descuenta 25 ud.

alter table public.logistics_materials
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
  add column if not exists stock_total numeric not null default 0;

update public.logistics_materials
set
  unidad_comanda = coalesce(nullif(unidad_comanda, ''), nullif(unidad, ''), 'ud'),
  unidad_inventario = coalesce(
    nullif(unidad_inventario, ''),
    case
      when lower(coalesce(nullif(unidad_comanda, ''), nullif(unidad, ''), 'ud')) in ('paq', 'paquete', 'pack', 'barca') then 'ud'
      else coalesce(nullif(unidad_comanda, ''), nullif(unidad, ''), 'ud')
    end
  ),
  conversion_a_stock = coalesce(nullif(conversion_a_stock, 0), nullif(contenido_por_unidad, 0), 1),
  contenido_por_unidad = coalesce(contenido_por_unidad, nullif(conversion_a_stock, 1)),
  redondeo_a = coalesce(nullif(redondeo_a, 0), 1),
  cantidad_base = coalesce(cantidad_base, 0),
  cantidad_por_pax = coalesce(cantidad_por_pax, 0),
  auto_calcular = coalesce(auto_calcular, false),
  stock_total = coalesce(stock_total, 0);

-- Nomenclatura recomendada para materiales habituales de menus.
-- Ajusta nombres si en tu tabla estan escritos diferente.

update public.logistics_materials
set unidad_comanda = 'litro',
    unidad_inventario = 'litro',
    conversion_a_stock = 1
where lower(nombre) in ('zumo natural', 'zumo de naranja natural');

update public.logistics_materials
set unidad_comanda = 'ud',
    unidad_inventario = 'ud',
    conversion_a_stock = 1
where lower(nombre) in (
  'vasos desechables zumo',
  'kit desechable para cafe',
  'kit desechable para café',
  'kit loza para cafe',
  'kit loza para café',
  'servilletas',
  'platos desechables',
  'cubiertos desechables',
  'mesa tablero',
  'mantel tablero',
  'mesa velador',
  'mantel velador',
  'alzadores',
  'flores',
  'bandeja camarero + lito',
  'mandil + corbata',
  'cubitera + pinzas',
  'guantes',
  'hielo'
);

update public.logistics_materials
set descripcion = '(Taza, Plato, Cucharilla, Caja Madera Azucarilla/infusiones)'
where lower(nombre) in ('kit loza para cafe', 'kit loza para café');

update public.logistics_materials
set descripcion = '(Vaso, Removedores, Caja Azucarilla/Infusiones)'
where lower(nombre) in ('kit desechable para cafe', 'kit desechable para café');

-- Opciones de cristal en barcas. La comanda muestra barca,
-- pero el inventario descuenta unidades de cristal.

update public.logistics_materials
set unidad_comanda = 'barca',
    unidad_inventario = 'ud',
    contenido_por_unidad = 36,
    conversion_a_stock = 36,
    presentacion = '36 uds'
where lower(nombre) in ('barca copas de vino', 'copas de vino', 'copa vino');

update public.logistics_materials
set unidad_comanda = 'barca',
    unidad_inventario = 'ud',
    contenido_por_unidad = 25,
    conversion_a_stock = 25,
    presentacion = '25 uds'
where lower(nombre) in ('barca vaso on the rock', 'vaso on the rock', 'vasos on the rock');

update public.logistics_materials
set unidad_comanda = 'barca',
    unidad_inventario = 'ud',
    contenido_por_unidad = 25,
    conversion_a_stock = 25,
    presentacion = '25 uds'
where lower(nombre) in ('barca vaso alto', 'vaso alto', 'vasos altos');

update public.logistics_materials
set unidad_comanda = 'barca',
    unidad_inventario = 'ud',
    contenido_por_unidad = 49,
    conversion_a_stock = 49,
    presentacion = '49 uds'
where lower(nombre) in ('barca copas de cava', 'copa cava', 'copas cava', 'copas de cava');

create index if not exists logistics_materials_tipo_orden_idx
  on public.logistics_materials (tipo, orden, nombre)
  where activo = true;

create or replace view public.logistics_materials_nomenclature_review as
select
  id,
  tipo,
  parent_id,
  nombre,
  unidad as unidad_original,
  unidad_comanda,
  unidad_inventario,
  contenido_por_unidad,
  conversion_a_stock,
  presentacion,
  descripcion,
  stock_total,
  orden,
  activo
from public.logistics_materials
order by tipo, parent_id nulls first, orden, nombre;

select *
from public.logistics_materials_nomenclature_review;
