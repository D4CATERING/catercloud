-- Seguridad inicial para CaterCloud / DeCuatro
-- Ejecutar en Supabase SQL Editor.
-- Objetivo: datos y archivos privados por usuario autenticado.

-- 1) TABLAS: activar RLS

alter table public.orders enable row level security;
alter table public.companies enable row level security;
alter table public.clients enable row level security;

-- 2) ORDERS: cada usuario ve y modifica solo sus pedidos

drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_insert_own" on public.orders;
drop policy if exists "orders_update_own" on public.orders;
drop policy if exists "orders_delete_own" on public.orders;

create policy "orders_select_own"
on public.orders
for select
to authenticated
using (created_by = (select auth.uid()));

create policy "orders_insert_own"
on public.orders
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (updated_by is null or updated_by = (select auth.uid()))
);

create policy "orders_update_own"
on public.orders
for update
to authenticated
using (created_by = (select auth.uid()))
with check (
  created_by = (select auth.uid())
  and (updated_by is null or updated_by = (select auth.uid()))
);

create policy "orders_delete_own"
on public.orders
for delete
to authenticated
using (created_by = (select auth.uid()));

-- 3) COMPANIES: empresas privadas por usuario

drop policy if exists "companies_select_own" on public.companies;
drop policy if exists "companies_insert_own" on public.companies;
drop policy if exists "companies_update_own" on public.companies;
drop policy if exists "companies_delete_own" on public.companies;

create policy "companies_select_own"
on public.companies
for select
to authenticated
using (created_by = (select auth.uid()));

create policy "companies_insert_own"
on public.companies
for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "companies_update_own"
on public.companies
for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "companies_delete_own"
on public.companies
for delete
to authenticated
using (created_by = (select auth.uid()));

-- 4) CLIENTS: clientes/contactos privados por usuario

drop policy if exists "clients_select_own" on public.clients;
drop policy if exists "clients_insert_own" on public.clients;
drop policy if exists "clients_update_own" on public.clients;
drop policy if exists "clients_delete_own" on public.clients;

create policy "clients_select_own"
on public.clients
for select
to authenticated
using (created_by = (select auth.uid()));

create policy "clients_insert_own"
on public.clients
for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "clients_update_own"
on public.clients
for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "clients_delete_own"
on public.clients
for delete
to authenticated
using (created_by = (select auth.uid()));

-- 5) STORAGE: bucket privado para documentos y adjuntos

insert into storage.buckets (id, name, public)
values ('comandas', 'comandas', false)
on conflict (id) do update
set public = false;

drop policy if exists "comandas_storage_select_own_folder" on storage.objects;
drop policy if exists "comandas_storage_insert_own_folder" on storage.objects;
drop policy if exists "comandas_storage_update_own_folder" on storage.objects;
drop policy if exists "comandas_storage_delete_own_folder" on storage.objects;

create policy "comandas_storage_select_own_folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "comandas_storage_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "comandas_storage_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and (storage.foldername(name))[2] = (select auth.uid())::text
)
with check (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "comandas_storage_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'comandas'
  and (storage.foldername(name))[1] = 'orders'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
