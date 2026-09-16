-- Permisos compartidos para comandas/pedidos.
-- Ejecutar en Supabase SQL Editor.
-- Objetivo: que todos los usuarios activos puedan ver las comandas,
-- y que cada rol solo pueda modificar lo que le corresponde desde la app.

alter table public.orders enable row level security;

create or replace function public.app_current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select role
    from public.app_user_roles
    where user_id = auth.uid()
      and active = true
    limit 1
  ), 'viewer')
$$;

create or replace function public.app_can_read()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.app_current_role() in ('admin', 'editor', 'eventos', 'viewer', 'cocina', 'logistica')
$$;

create or replace function public.app_can_write()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.app_current_role() in ('admin', 'editor', 'eventos')
$$;

create or replace function public.app_can_create_orders()
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

grant execute on function public.app_current_role() to authenticated;
grant execute on function public.app_can_read() to authenticated;
grant execute on function public.app_can_write() to authenticated;
grant execute on function public.app_can_create_orders() to authenticated;
grant execute on function public.app_can_edit_kitchen() to authenticated;
grant execute on function public.app_can_edit_logistics() to authenticated;

drop policy if exists "orders_select_team" on public.orders;
create policy "orders_select_team"
on public.orders
for select
to authenticated
using (public.app_can_read());

drop policy if exists "orders_insert_editor" on public.orders;
create policy "orders_insert_editor"
on public.orders
for insert
to authenticated
with check (public.app_can_create_orders());

drop policy if exists "orders_update_team" on public.orders;
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

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin"
on public.orders
for delete
to authenticated
using (public.app_current_role() = 'admin');

grant select, insert, update, delete on public.orders to authenticated;
