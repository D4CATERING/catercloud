-- Permisos para editar el inventario de logistica de servicios desde la app.
-- Ejecutar en Supabase SQL Editor si puedes ver los articulos,
-- pero al guardar aparece error de permisos o RLS.

alter table public.service_logistics_materials enable row level security;

drop policy if exists "service_logistics_materials_select_team" on public.service_logistics_materials;
drop policy if exists "service_logistics_materials_insert_team" on public.service_logistics_materials;
drop policy if exists "service_logistics_materials_update_team" on public.service_logistics_materials;
drop policy if exists "service_logistics_materials_delete_admin" on public.service_logistics_materials;
drop policy if exists "service logistics read" on public.service_logistics_materials;
drop policy if exists "service logistics admin write" on public.service_logistics_materials;

create policy "service_logistics_materials_select_team"
on public.service_logistics_materials
for select
to authenticated
using (public.app_can_read());

create policy "service_logistics_materials_insert_team"
on public.service_logistics_materials
for insert
to authenticated
with check (public.app_can_write());

create policy "service_logistics_materials_update_team"
on public.service_logistics_materials
for update
to authenticated
using (public.app_can_write())
with check (public.app_can_write());

create policy "service_logistics_materials_delete_admin"
on public.service_logistics_materials
for delete
to authenticated
using (public.app_is_admin());
