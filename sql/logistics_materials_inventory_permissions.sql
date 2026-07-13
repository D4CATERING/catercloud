-- Permisos de inventario logistico para CaterCloud / DeCuatro.
-- Ejecutar en Supabase SQL Editor si el formulario permite abrir articulos,
-- pero al guardar no se actualizan las cantidades.

alter table public.logistics_materials enable row level security;

drop policy if exists "logistics_materials_select_team" on public.logistics_materials;
drop policy if exists "logistics_materials_insert_team" on public.logistics_materials;
drop policy if exists "logistics_materials_update_team" on public.logistics_materials;
drop policy if exists "logistics_materials_delete_admin" on public.logistics_materials;

create policy "logistics_materials_select_team"
on public.logistics_materials
for select
to authenticated
using (public.app_can_read());

create policy "logistics_materials_insert_team"
on public.logistics_materials
for insert
to authenticated
with check (public.app_can_write() or public.app_can_edit_logistics());

create policy "logistics_materials_update_team"
on public.logistics_materials
for update
to authenticated
using (public.app_can_write() or public.app_can_edit_logistics())
with check (public.app_can_write() or public.app_can_edit_logistics());

create policy "logistics_materials_delete_admin"
on public.logistics_materials
for delete
to authenticated
using (public.app_is_admin());
