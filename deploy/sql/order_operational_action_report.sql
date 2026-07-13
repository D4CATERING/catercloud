-- Vista para reporte/exportacion de acciones operativas de cocina y logistica.
-- Ejecutar en Supabase SQL Editor.

create or replace view public.order_operational_action_report
with (security_invoker = true)
as
select
    o.id as order_id,
    o.codigo,
    o.company_name as empresa,
    o.responsable_name as responsable,
    o.fecha_evento,
    o.hora_salida,
    o.pax_total,
    o.estado as estado_pedido,
    'cocina'::text as area,
    nullif(action_item->>'at', '')::timestamptz as accion_fecha,
    action_item->>'by' as accion_usuario,
    action_item->>'action' as accion,
    action_item->>'detail' as detalle,
    o.payload->>'kitchen_status' as estado_area,
    nullif(o.payload->>'kitchen_completed_confirmed_at', '')::timestamptz as completado_confirmado_fecha,
    o.payload->>'kitchen_completed_confirmed_by' as completado_confirmado_por,
    o.created_at,
    o.updated_at
from public.orders o
cross join lateral jsonb_array_elements(coalesce(o.payload->'kitchen_action_log', '[]'::jsonb)) as action_item

union all

select
    o.id as order_id,
    o.codigo,
    o.company_name as empresa,
    o.responsable_name as responsable,
    o.fecha_evento,
    o.hora_salida,
    o.pax_total,
    o.estado as estado_pedido,
    'logistica'::text as area,
    nullif(action_item->>'at', '')::timestamptz as accion_fecha,
    action_item->>'by' as accion_usuario,
    action_item->>'action' as accion,
    action_item->>'detail' as detalle,
    o.payload->>'logistics_status' as estado_area,
    nullif(o.payload->>'logistics_completed_confirmed_at', '')::timestamptz as completado_confirmado_fecha,
    o.payload->>'logistics_completed_confirmed_by' as completado_confirmado_por,
    o.created_at,
    o.updated_at
from public.orders o
cross join lateral jsonb_array_elements(coalesce(o.payload->'logistics_action_log', '[]'::jsonb)) as action_item;

grant select on public.order_operational_action_report to authenticated;

-- Consulta sugerida para revisar/exportar:
-- select *
-- from public.order_operational_action_report
-- order by accion_fecha desc nulls last;
