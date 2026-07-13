-- Actualiza roles operativos para CaterCloud.
-- Ejecutar en Supabase SQL Editor si app_user_roles ya existe.

alter table public.app_user_roles
  drop constraint if exists app_user_roles_role_check;

alter table public.app_user_roles
  add constraint app_user_roles_role_check
  check (role in ('admin', 'editor', 'viewer', 'cocina', 'logistica'));

create or replace function public.app_can_read()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.app_current_role() in ('admin', 'editor', 'viewer', 'cocina', 'logistica')
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

grant execute on function public.app_can_read() to authenticated;
grant execute on function public.app_can_edit_kitchen() to authenticated;
grant execute on function public.app_can_edit_logistics() to authenticated;

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
