-- Permisos para el modulo de rutas de logistica.
-- Ejecutar en Supabase SQL Editor si la app no muestra furgonetas o conductores,
-- o si no permite crear/editar rutas.

alter table public.route_vehicles enable row level security;
alter table public.route_drivers enable row level security;
alter table public.daily_routes enable row level security;
alter table public.route_stops enable row level security;

drop policy if exists "route_vehicles_select_team" on public.route_vehicles;
drop policy if exists "route_vehicles_write_logistics" on public.route_vehicles;
drop policy if exists "route_drivers_select_team" on public.route_drivers;
drop policy if exists "route_drivers_write_logistics" on public.route_drivers;
drop policy if exists "daily_routes_select_team" on public.daily_routes;
drop policy if exists "daily_routes_insert_logistics" on public.daily_routes;
drop policy if exists "daily_routes_update_logistics" on public.daily_routes;
drop policy if exists "daily_routes_delete_logistics" on public.daily_routes;
drop policy if exists "route_stops_select_team" on public.route_stops;
drop policy if exists "route_stops_insert_logistics" on public.route_stops;
drop policy if exists "route_stops_update_logistics" on public.route_stops;
drop policy if exists "route_stops_delete_logistics" on public.route_stops;

create policy "route_vehicles_select_team"
on public.route_vehicles
for select
to authenticated
using (public.app_can_read());

create policy "route_vehicles_write_logistics"
on public.route_vehicles
for all
to authenticated
using (public.app_is_admin() or public.app_can_edit_logistics())
with check (public.app_is_admin() or public.app_can_edit_logistics());

create policy "route_drivers_select_team"
on public.route_drivers
for select
to authenticated
using (public.app_can_read());

create policy "route_drivers_write_logistics"
on public.route_drivers
for all
to authenticated
using (public.app_is_admin() or public.app_can_edit_logistics())
with check (public.app_is_admin() or public.app_can_edit_logistics());

create policy "daily_routes_select_team"
on public.daily_routes
for select
to authenticated
using (public.app_can_read());

create policy "daily_routes_insert_logistics"
on public.daily_routes
for insert
to authenticated
with check (public.app_is_admin() or public.app_can_edit_logistics());

create policy "daily_routes_update_logistics"
on public.daily_routes
for update
to authenticated
using (public.app_is_admin() or public.app_can_edit_logistics())
with check (public.app_is_admin() or public.app_can_edit_logistics());

create policy "daily_routes_delete_logistics"
on public.daily_routes
for delete
to authenticated
using (public.app_is_admin() or public.app_can_edit_logistics());

create policy "route_stops_select_team"
on public.route_stops
for select
to authenticated
using (public.app_can_read());

create policy "route_stops_insert_logistics"
on public.route_stops
for insert
to authenticated
with check (public.app_is_admin() or public.app_can_edit_logistics());

create policy "route_stops_update_logistics"
on public.route_stops
for update
to authenticated
using (public.app_is_admin() or public.app_can_edit_logistics())
with check (public.app_is_admin() or public.app_can_edit_logistics());

create policy "route_stops_delete_logistics"
on public.route_stops
for delete
to authenticated
using (public.app_is_admin() or public.app_can_edit_logistics());

grant select on public.route_vehicles to authenticated;
grant select on public.route_drivers to authenticated;
grant select, insert, update, delete on public.daily_routes to authenticated;
grant select, insert, update, delete on public.route_stops to authenticated;
