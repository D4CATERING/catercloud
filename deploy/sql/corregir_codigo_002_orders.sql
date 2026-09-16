-- Corrige una comanda creada como D4260003 para dejarla como D4260002.
-- Ejecutar por bloques en Supabase SQL Editor.

-- 1) Diagnostico: verifica si el codigo 002 existe todavia.
select
  id,
  codigo,
  empresa,
  fecha_evento,
  created_at,
  updated_at
from public.orders
where codigo in ('D4260002', 'D4260003')
order by codigo, created_at desc;

-- 2) Si D4260002 NO aparece en el resultado anterior,
-- ejecuta este bloque para cambiar la ultima D4260003 a D4260002.
with ultima_003 as (
  select id
  from public.orders
  where codigo = 'D4260003'
  order by coalesce(updated_at, created_at) desc
  limit 1
),
puede_usar_002 as (
  select not exists (
    select 1
    from public.orders
    where codigo = 'D4260002'
  ) as ok
)
update public.orders o
set
  codigo = 'D4260002',
  updated_at = now()
from ultima_003 u, puede_usar_002 p
where o.id = u.id
  and p.ok
returning o.id, o.codigo, o.empresa, o.fecha_evento, o.updated_at;

-- 3) Deja el contador alineado.
-- Si ahora existe D4260002 y no quieres saltar a D4260004,
-- el contador debe quedar en 2 para que la siguiente comanda sea D4260003.
update public.order_code_counters
set
  last_number = 2,
  updated_at = now()
where year = 2026
  and exists (
    select 1
    from public.orders
    where codigo = 'D4260002'
  );

-- 4) Verificacion final.
select * from public.order_code_counters where year = 2026;

select
  codigo,
  count(*) as cantidad,
  array_agg(id order by created_at desc) as ids
from public.orders
where codigo in ('D4260002', 'D4260003')
group by codigo
order by codigo;
