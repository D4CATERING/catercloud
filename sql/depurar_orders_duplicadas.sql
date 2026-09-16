-- Depurar comandas duplicadas en public.orders.
-- Ejecutar primero solo los SELECT de revision.
-- La limpieza conserva la fila mas reciente por codigo y archiva las demas.

-- 1) Revision de duplicados actuales.
select
  codigo,
  count(*) as cantidad,
  array_agg(id order by coalesce(updated_at, created_at) desc, created_at desc) as ids
from public.orders
where codigo is not null
group by codigo
having count(*) > 1
order by cantidad desc, codigo;

-- 2) Ver exactamente que fila se conservaria y cuales se archivarian.
with ranked as (
  select
    id,
    codigo,
    company_name,
    estado,
    created_at,
    updated_at,
    row_number() over (
      partition by codigo
      order by coalesce(updated_at, created_at) desc, created_at desc, id desc
    ) as rn
  from public.orders
  where codigo is not null
)
select
  codigo,
  (array_agg(id order by rn) filter (where rn = 1))[1] as id_conservado,
  array_agg(id order by rn) filter (where rn > 1) as ids_a_archivar,
  count(*) as cantidad
from ranked
group by codigo
having count(*) > 1
order by codigo;

-- 3) Crear tabla de archivo para no perder informacion.
create table if not exists public.orders_duplicates_archive (
  archived_id uuid primary key default gen_random_uuid(),
  archived_at timestamp with time zone not null default now(),
  archived_reason text not null default 'codigo duplicado',
  original_order_id uuid not null,
  kept_order_id uuid,
  order_row jsonb not null
);

create unique index if not exists orders_duplicates_archive_original_order_id_idx
on public.orders_duplicates_archive (original_order_id);

-- 4) Archivar las filas repetidas mas antiguas.
with ranked as (
  select
    o.*,
    first_value(id) over (
      partition by codigo
      order by coalesce(updated_at, created_at) desc, created_at desc, id desc
    ) as kept_order_id,
    row_number() over (
      partition by codigo
      order by coalesce(updated_at, created_at) desc, created_at desc, id desc
    ) as rn
  from public.orders o
  where codigo is not null
)
insert into public.orders_duplicates_archive (
  original_order_id,
  kept_order_id,
  order_row
)
select
  id,
  kept_order_id,
  to_jsonb(ranked)
from ranked
where rn > 1
  and not exists (
    select 1
    from public.orders_duplicates_archive archive
    where archive.original_order_id = ranked.id
  );

-- 5) Eliminar de orders las filas ya archivadas.
delete from public.orders o
using public.orders_duplicates_archive a
where o.id = a.original_order_id;

-- 6) Confirmar que ya no queden duplicados.
select
  codigo,
  count(*) as cantidad
from public.orders
where codigo is not null
group by codigo
having count(*) > 1
order by codigo;

-- 7) Ajustar el contador central al numero mas alto que exista en orders.
insert into public.order_code_counters (year, last_number)
select
  extract(year from timezone('Europe/Madrid', now()))::integer as year,
  coalesce(max(substring(codigo from 5)::integer), 0) as last_number
from public.orders
where codigo ~ ('^D4' || right(extract(year from timezone('Europe/Madrid', now()))::integer::text, 2) || '[0-9]{4}$')
on conflict (year) do update
set
  last_number = greatest(public.order_code_counters.last_number, excluded.last_number),
  updated_at = now();

-- 8) Activar proteccion para que no vuelvan a existir codigos duplicados.
create unique index if not exists orders_codigo_unique_idx
on public.orders (codigo)
where codigo is not null;
