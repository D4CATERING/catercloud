-- Configura material base automatico para Logistica de Servicios.
-- Referencia: cantidades indicadas por Catalina para un servicio de 50 pax.
-- Ejecutar en Supabase SQL Editor.
--
-- La app recalcula con:
-- cantidad = ceil((pax * cantidad_por_pax) / redondeo_a) * redondeo_a
--
-- Ejemplo: Coca light 0.5 paq para 50 pax => cantidad_por_pax = 0.01

alter table public.service_logistics_materials
  add column if not exists cantidad_base numeric not null default 0,
  add column if not exists cantidad_por_pax numeric not null default 0,
  add column if not exists redondeo_a numeric not null default 1,
  add column if not exists auto_calcular boolean not null default false;

-- Todo lo que no este en la base queda manual, en 0.
update public.service_logistics_materials
set auto_calcular = false,
    cantidad_base = 0,
    cantidad_por_pax = 0,
    redondeo_a = 1
where activo = true;

-- Bebidas base
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 0.5 where lower(nombre) = 'coca normal';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 0.5 / 50, redondeo_a = 0.5 where lower(nombre) = 'coca light';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 2.0 / 50, redondeo_a = 0.5 where lower(nombre) = 'coca zero';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 0.5 where lower(nombre) in ('fanta limon', 'fanta limón');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 0.5 where lower(nombre) = 'fanta naranja';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 0.5 / 50, redondeo_a = 0.5 where lower(nombre) = 'sprite';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 0.5 / 50, redondeo_a = 0.5 where lower(nombre) = 'nestea';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 0.5 where lower(nombre) in ('acuarius limon', 'acuarius limón', 'aquarius limon', 'aquarius limón');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 0.5 / 50, redondeo_a = 0.5 where lower(nombre) in ('acuarius naranja', 'aquarius naranja');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 2.0 / 50, redondeo_a = 0.5 where lower(nombre) = 'agua con gas';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 3.0 / 50, redondeo_a = 1 where lower(nombre) in ('cervezas', 'cerveza');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) in ('cerveza sin alcohol', 'cerveza sin');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 6.0 / 50, redondeo_a = 1 where lower(nombre) = 'vino blanco';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 6.0 / 50, redondeo_a = 1 where lower(nombre) = 'vino tinto';

-- Menaje base
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 2.0 / 50, redondeo_a = 1 where lower(nombre) in ('vaso sidra', 'vasos sidra');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 2.0 / 50, redondeo_a = 1 where lower(nombre) in ('vaso on the rock', 'vasos on the rock', 'vaso corto');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) in ('copas vino', 'copa vino', 'copas de vino');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) = 'fuente de agua';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 3.0 / 50, redondeo_a = 1 where lower(nombre) in ('botellas cristal', 'botella cristal');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) in ('cucharitas postre', 'cucharitas de postre');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 10.0 / 50, redondeo_a = 1 where lower(nombre) in ('foodbox vacias', 'foodbox vacías');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 150.0 / 50, redondeo_a = 1 where lower(nombre) = 'servilletas' and tipo = 'menaje';

-- Material base
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 2.0 / 50, redondeo_a = 1 where lower(nombre) = 'mesa tablero';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 2.0 / 50, redondeo_a = 1 where lower(nombre) in ('manteles algodon', 'manteles algodón', 'mantel algodon', 'mantel algodón');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 3.0 / 50, redondeo_a = 1 where lower(nombre) = 'mesa velador';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 3.0 / 50, redondeo_a = 1 where lower(nombre) = 'cubre velador';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 20.0 / 50, redondeo_a = 1 where lower(nombre) = 'hielo';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 2.0 / 50, redondeo_a = 1 where lower(nombre) in ('cajon enfriador', 'cajón enfriador');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 2.0 / 50, redondeo_a = 1 where lower(nombre) = 'champaneras';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) = 'cubiteras';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 2.0 / 50, redondeo_a = 1 where lower(nombre) = 'pinzas hielo';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 3.0 / 50, redondeo_a = 1 where lower(nombre) in ('cuadros d4', 'cuadros de4');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 5.0 / 50, redondeo_a = 1 where lower(nombre) = 'servilleteros';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 6.0 / 50, redondeo_a = 1 where lower(nombre) = 'flores';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 3.0 / 50, redondeo_a = 1 where lower(nombre) = 'alzadores';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 3.0 / 50, redondeo_a = 1 where lower(nombre) = 'basuriles';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 3.0 / 50, redondeo_a = 1 where lower(nombre) = 'mandiles';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 3.0 / 50, redondeo_a = 1 where lower(nombre) = 'corbatas';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) = 'cubo basura';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) = 'cubo desbarase';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) = 'bolsas basura';
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) in ('rollo papel mecha', 'rollo papel');
update public.service_logistics_materials set auto_calcular = true, cantidad_por_pax = 1.0 / 50, redondeo_a = 1 where lower(nombre) = 'caja guantes';

-- Verificacion
select tipo, nombre, auto_calcular, cantidad_por_pax, redondeo_a
from public.service_logistics_materials
where auto_calcular = true
order by tipo, orden, nombre;
