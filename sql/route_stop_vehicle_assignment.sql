-- Furgoneta asignada por parada/pedido en rutas logisticas.
-- Ejecutar en Supabase SQL Editor.

alter table public.route_stops
add column if not exists vehicle_id uuid;

alter table public.route_stops
drop constraint if exists route_stops_vehicle_id_fkey;

alter table public.route_stops
add constraint route_stops_vehicle_id_fkey
foreign key (vehicle_id)
references public.route_vehicles(id)
on delete set null;

update public.route_stops rs
set vehicle_id = dr.vehicle_id
from public.daily_routes dr
where rs.route_id = dr.id
  and rs.vehicle_id is null;

create index if not exists route_stops_vehicle_id_idx
on public.route_stops(vehicle_id);

-- Verificacion:
-- select rs.id, rs.company_name, rs.vehicle_id, rv.plate
-- from public.route_stops rs
-- left join public.route_vehicles rv on rv.id = rs.vehicle_id
-- order by rs.created_at desc
-- limit 20;
