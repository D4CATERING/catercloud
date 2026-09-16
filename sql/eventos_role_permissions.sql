-- Rol Eventos para CaterCloud.
-- Ejecutar en Supabase SQL Editor.
-- Cambia el email y el nombre en el bloque final antes de ejecutar.

alter table public.app_user_roles
  drop constraint if exists app_user_roles_role_check;

alter table public.app_user_roles
  add constraint app_user_roles_role_check
  check (role in ('admin', 'editor', 'eventos', 'viewer', 'cocina', 'logistica'));

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

grant execute on function public.app_can_read() to authenticated;
grant execute on function public.app_can_write() to authenticated;
grant execute on function public.app_can_create_orders() to authenticated;
grant execute on function public.app_can_edit_kitchen() to authenticated;
grant execute on function public.app_can_edit_logistics() to authenticated;

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

-- Configurar usuario Eventos.
-- Reemplaza estos valores:
--   eventos@decuatrocatering.com
--   Eventos
with usuario as (
  select id
  from auth.users
  where lower(email) = lower('eventos@decuatrocatering.com')
  limit 1
),
actualizar_roles_previos as (
  update public.app_user_roles r
  set role = 'eventos',
      active = true
  from usuario u
  where r.user_id = u.id
  returning r.user_id
),
insertar_rol as (
  insert into public.app_user_roles (user_id, role, active)
  select u.id, 'eventos', true
  from usuario u
  where not exists (
    select 1
    from actualizar_roles_previos a
    where a.user_id = u.id
  )
  returning user_id
)
update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'full_name', 'Eventos',
    'name', 'Eventos',
    'display_name', 'Eventos'
  )
where u.id in (select id from usuario);

select
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as nombre,
  r.role,
  r.active
from auth.users u
left join public.app_user_roles r on r.user_id = u.id
where lower(u.email) = lower('eventos@decuatrocatering.com');
