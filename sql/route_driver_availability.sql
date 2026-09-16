-- Disponibilidad de conductores para el modulo de rutas.
-- Ejecutar en Supabase SQL Editor.

alter table public.route_drivers
add column if not exists work_start time without time zone not null default '08:00';

alter table public.route_drivers
add column if not exists work_end time without time zone not null default '18:00';

alter table public.route_drivers
add column if not exists unavailable_dates jsonb not null default '[]'::jsonb;

create index if not exists route_drivers_unavailable_dates_idx
on public.route_drivers using gin (unavailable_dates);

-- Verificacion:
-- select id, name, phone, active, work_start, work_end, unavailable_dates
-- from public.route_drivers
-- order by name;
