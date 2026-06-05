-- Plantilla para crear/asignar roles de usuarios en CaterCloud
-- Ejecutar despues de crear/invitar usuarios en Supabase Auth.

-- 1) Ver usuarios existentes
-- Copia el id del usuario que quieres asignar.

select
  id,
  email,
  raw_user_meta_data ->> 'full_name' as nombre,
  created_at,
  last_sign_in_at
from auth.users
order by created_at desc;

-- 2) Asignar o cambiar rol
-- Roles permitidos: admin, editor, viewer
--
-- admin  = ve todo, crea, edita, elimina y administra roles
-- editor = ve todo, crea y edita
-- viewer = ve dashboard/historial/comandas/archivos, pero no crea ni edita

-- Ejemplo:
-- insert into public.app_user_roles (user_id, role, active)
-- values ('PEGA_AQUI_UUID_USUARIO', 'editor', true)
-- on conflict (user_id) do update
-- set role = excluded.role,
--     active = excluded.active,
--     updated_at = now();

-- 3) Ver usuarios con rol asignado

select
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'full_name' as nombre,
  r.role,
  r.active,
  r.updated_at
from auth.users u
left join public.app_user_roles r on r.user_id = u.id
order by u.created_at desc;

-- 4) Desactivar acceso de un usuario sin borrarlo de Auth

-- update public.app_user_roles
-- set active = false,
--     updated_at = now()
-- where user_id = 'PEGA_AQUI_UUID_USUARIO';
