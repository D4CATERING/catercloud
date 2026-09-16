-- Estados operativos de paradas en rutas.
-- Ejecutar en Supabase SQL Editor.

alter table public.route_stops
add column if not exists actual_departure timestamp with time zone;

alter table public.route_stops
add column if not exists actual_arrival timestamp with time zone;

alter table public.route_stops
add column if not exists updated_at timestamp with time zone;

alter table public.route_stops
drop constraint if exists route_stops_status_check;

alter table public.route_stops
add constraint route_stops_status_check
check (status in ('pending', 'in_route', 'delivered'));

update public.route_stops
set status = 'pending'
where status is null;

alter table public.route_stops
alter column status set default 'pending';

-- Valores esperados para status:
-- pending   = pendiente
-- in_route  = en ruta
-- delivered = entregado

-- Verificacion:
-- select id, stop_type, company_name, status, actual_departure, actual_arrival
-- from public.route_stops
-- order by created_at desc
-- limit 20;
