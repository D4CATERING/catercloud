-- Seguridad por equipo y roles para CaterCloud / DeCuatro
-- Ejecutar en Supabase SQL Editor.
--
-- Roles:
-- - admin: ve todo, crea, edita, elimina y gestiona roles.
-- - editor: ve todo, crea y edita. No elimina roles ni usuarios.
-- - viewer: ve dashboard, historial, comandas y archivos. No crea ni edita.
-- - cocina: ve la app y solo edita el modulo de cocina.
-- - logistica: ve la app y solo edita el modulo de logistica e inventario.

-- 1) Tabla de roles de la aplicacion

create table if not exists public.app_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'viewer', 'cocina', 'logistica')),
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

do $$
begin
  alter table public.app_user_roles
    drop constraint if exists app_user_roles_role_check;

  alter table public.app_user_roles
    add constraint app_user_roles_role_check
    check (role in ('admin', 'editor', 'viewer', 'cocina', 'logistica'));
end $$;

alter table public.app_user_roles enable row level security;

-- 2) Funciones de permisos
-- Usamos SECURITY DEFINER para que las politicas puedan consultar roles
-- sin entrar en recursiones de RLS.

create or replace function public.app_current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.app_user_roles
  where user_id = (select auth.uid())
    and active = true
  limit 1
$$;

create or replace function public.app_can_read()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.app_current_role() in ('admin', 'editor', 'viewer', 'cocina', 'logistica')
$$;

create or replace function public.app_can_write()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.app_current_role() in ('admin', 'editor')
$$;

create or replace function public.app_can_edit_kitchen()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.app_current_role() in ('admin', 'cocina')
$$;

create or replace function public.app_can_edit_logistics()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.app_current_role() in ('admin', 'logistica')
$$;

create or replace function public.app_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.app_current_role() = 'admin'
$$;

grant execute on function public.app_current_role() to authenticated;
grant execute on function public.app_can_read() to authenticated;
grant execute on function public.app_can_write() to authenticated;
grant execute on function public.app_can_edit_kitchen() to authenticated;
grant execute on function public.app_can_edit_logistics() to authenticated;
grant execute on function public.app_is_admin() to authenticated;

-- 3) IMPORTANTE: crear al menos un admin
-- Primero consulta tus usuarios:
--
-- select id, email from auth.users order by created_at;
--
-- Luego cambia el UUID y ejecuta una linea como esta:
--
-- insert into public.app_user_roles (user_id, role)
-- values ('PEGA_AQUI_EL_UUID_DEL_ADMIN', 'admin')
-- on conflict (user_id) do update
-- set role = excluded.role, active = true, updated_at = now();

-- 4) Politicas para app_user_roles

drop policy if exists "app_roles_select_own_or_admin" on public.app_user_roles;
drop policy if exists "app_roles_insert_admin" on public.app_user_roles;
drop policy if exists "app_roles_update_admin" on public.app_user_roles;
drop policy if exists "app_roles_delete_admin" on public.app_user_roles;

create policy "app_roles_select_own_or_admin"
on public.app_user_roles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.app_is_admin()
);

create policy "app_roles_insert_admin"
on public.app_user_roles
for insert
to authenticated
with check (public.app_is_admin());

create policy "app_roles_update_admin"
on public.app_user_roles
for update
to authenticated
using (public.app_is_admin())
with check (public.app_is_admin());

create policy "app_roles_delete_admin"
on public.app_user_roles
for delete
to authenticated
using (public.app_is_admin());

-- 5) Activar RLS en tablas sensibles

alter table public.orders enable row level security;
alter table public.companies enable row level security;
alter table public.clients enable row level security;

-- 6) Quitar politicas anteriores por propietario y crear politicas por rol

drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "orders_update_own" on public.orders;
drop policy if exists "orders_delete_own" on public.orders;
drop policy if exists "orders_select_team" on public.orders;
drop policy if exists "orders_insert_team" on public.orders;
drop policy if exists "orders_update_team" on public.orders;
drop policy if exists "orders_delete_admin" on public.orders;

create policy "orders_select_team"
on public.orders
for select
to authenticated
using (public.app_can_read());

create policy "orders_insert_team"
on public.orders
for insert
to authenticated
with check (
  public.app_can_write()
  and created_by = (select auth.uid())
);

create policy "orders_update_team"
on public.orders
for update
to authenticated
using (
  public.app_can_write()
  or public.app_can_edit_kitchen()
  or public.app_can_edit_logistics()
)
with check (
  public.app_can_write()
  or public.app_can_edit_kitchen()
  or public.app_can_edit_logistics()
);

create policy "orders_delete_admin"
on public.orders
for delete
to authenticated
using (public.app_is_admin());

drop policy if exists "companies_select_own" on public.companies;
drop policy if exists "companies_insert_own" on public.companies;
drop policy if exists "companies_update_own" on public.companies;
drop policy if exists "companies_delete_own" on public.companies;
drop policy if exists "companies_select_team" on public.companies;
drop policy if exists "companies_insert_team" on public.companies;
drop policy if exists "companies_update_team" on public.companies;
drop policy if exists "companies_delete_admin" on public.companies;

create policy "companies_select_team"
on public.companies
for select
to authenticated
using (public.app_can_read());

create policy "companies_insert_team"
on public.companies
for insert
to authenticated
with check (public.app_can_write());

create policy "companies_update_team"
on public.companies
for update
to authenticated
using (public.app_can_write())
with check (public.app_can_write());

create policy "companies_delete_admin"
on public.companies
for delete
to authenticated
using (public.app_is_admin());

drop policy if exists "clients_select_own" on public.clients;
drop policy if exists "clients_insert_own" on public.clients;
drop policy if exists "clients_update_own" on public.clients;
drop policy if exists "clients_delete_own" on public.clients;
drop policy if exists "clients_select_team" on public.clients;
drop policy if exists "clients_insert_team" on public.clients;
drop policy if exists "clients_update_team" on public.clients;
drop policy if exists "clients_delete_admin" on public.clients;

create policy "clients_select_team"
on public.clients
for select
to authenticated
using (public.app_can_read());

create policy "clients_insert_team"
on public.clients
for insert
to authenticated
with check (
  public.app_can_write()
  and (created_by is null or created_by = (select auth.uid()))
);

create policy "clients_update_team"
on public.clients
for update
to authenticated
using (public.app_can_write())
with check (public.app_can_write());

create policy "clients_delete_admin"
on public.clients
for delete
to authenticated
using (public.app_is_admin());

-- 7) Storage privado compartido por equipo

insert into storage.buckets (id, name, public)
values ('comandas', 'comandas', false)
on conflict (id) do update
set public = false;

drop policy if exists "comandas_storage_select_own_folder" on storage.objects;
drop policy if exists "comandas_storage_insert_own_folder" on storage.objects;
drop policy if exists "comandas_storage_update_own_folder" on storage.objects;
drop policy if exists "comandas_storage_delete_own_folder" on storage.objects;
drop policy if exists "comandas_storage_select_team" on storage.objects;
drop policy if exists "comandas_storage_insert_team" on storage.objects;
drop policy if exists "comandas_storage_update_team" on storage.objects;
drop policy if exists "comandas_storage_delete_admin" on storage.objects;

create policy "comandas_storage_select_team"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and public.app_can_read()
);

create policy "comandas_storage_insert_team"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and public.app_can_write()
);

create policy "comandas_storage_update_team"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and public.app_can_write()
)
with check (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and public.app_can_write()
);

create policy "comandas_storage_delete_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and public.app_is_admin()
);
