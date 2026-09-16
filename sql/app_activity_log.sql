-- Auditoria general de acciones realizadas dentro de la aplicacion.
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.app_activity_log (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    user_id uuid null references auth.users(id),
    user_email text null,
    user_name text null,
    action text not null,
    area text null,
    entity_type text not null default 'pedido',
    entity_code text null,
    entity_id uuid null,
    details jsonb not null default '{}'::jsonb
);

create index if not exists app_activity_log_created_at_idx
    on public.app_activity_log (created_at desc);

create index if not exists app_activity_log_entity_code_idx
    on public.app_activity_log (entity_code);

create index if not exists app_activity_log_user_id_idx
    on public.app_activity_log (user_id);

alter table public.app_activity_log enable row level security;

drop policy if exists "app_activity_log_select_authenticated" on public.app_activity_log;
create policy "app_activity_log_select_authenticated"
on public.app_activity_log
for select
to authenticated
using (true);

drop policy if exists "app_activity_log_insert_authenticated" on public.app_activity_log;
create policy "app_activity_log_insert_authenticated"
on public.app_activity_log
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace function public.register_app_activity(
    p_action text,
    p_area text default null,
    p_entity_type text default 'pedido',
    p_entity_code text default null,
    p_entity_id uuid default null,
    p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
    v_email text;
    v_name text;
begin
    if auth.uid() is null then
        raise exception 'Usuario no autenticado';
    end if;

    select
        u.email,
        coalesce(
            u.raw_user_meta_data->>'full_name',
            u.raw_user_meta_data->>'name',
            u.raw_user_meta_data->>'display_name',
            u.email
        )
    into v_email, v_name
    from auth.users u
    where u.id = auth.uid();

    insert into public.app_activity_log (
        user_id,
        user_email,
        user_name,
        action,
        area,
        entity_type,
        entity_code,
        entity_id,
        details
    )
    values (
        auth.uid(),
        coalesce(v_email, ''),
        coalesce(v_name, v_email, ''),
        p_action,
        p_area,
        coalesce(p_entity_type, 'pedido'),
        p_entity_code,
        p_entity_id,
        coalesce(p_details, '{}'::jsonb)
    )
    returning id into v_id;

    return v_id;
end;
$$;

create or replace view public.app_activity_report
with (security_invoker = true)
as
select
    l.id,
    l.created_at as accion_fecha,
    l.user_name as usuario,
    l.user_email as email,
    l.action as accion,
    l.area,
    l.entity_type as tipo_entidad,
    l.entity_code as codigo,
    coalesce(o.company_name, l.details->>'empresa') as empresa,
    o.fecha_evento,
    o.hora_salida,
    o.pax_total,
    o.estado as estado_pedido,
    l.details as detalle
from public.app_activity_log l
left join public.orders o
    on o.codigo = l.entity_code;

grant select, insert on public.app_activity_log to authenticated;
grant select on public.app_activity_report to authenticated;
grant execute on function public.register_app_activity(text, text, text, text, uuid, jsonb) to authenticated;

-- Consulta sugerida:
-- select *
-- from public.app_activity_report
-- order by accion_fecha desc;
