-- Numeracion centralizada de comandas.
-- Ejecutar en Supabase SQL Editor.
-- Regla:
-- - Los codigos guardados en public.orders nunca se reutilizan.
-- - Las reservas vencidas o canceladas se pueden reutilizar si no llegaron a orders.
-- - order_code_counters es un piso manual de seguridad; no sube al reservar.

create table if not exists public.order_code_counters (
  year integer primary key,
  last_number integer not null default 0,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.order_code_reservations (
  codigo text primary key,
  user_id uuid null references auth.users (id) on delete set null,
  reserved_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null default (now() + interval '2 hours')
);

create index if not exists order_code_reservations_expires_at_idx
on public.order_code_reservations (expires_at);

create or replace function public.next_order_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year integer := extract(year from timezone('Europe/Madrid', now()))::integer;
  prefix text := 'D4' || right(extract(year from timezone('Europe/Madrid', now()))::integer::text, 2);
  next_number integer;
  next_code text;
begin
  perform pg_advisory_xact_lock(hashtext('catercloud_order_code_' || current_year::text));

  delete from public.order_code_reservations r
  where r.expires_at < now()
     or exists (
       select 1
       from public.orders o
       where o.codigo = r.codigo
          or o.payload->>'codigo' = r.codigo
          or o.payload->>'codigo_comanda' = r.codigo
     );

  with used_numbers as (
    select substring(order_codes.codigo from 5)::integer as numero
    from (
      select o.codigo
      from public.orders o
      where o.codigo is not null and o.codigo <> ''

      union

      select o.payload->>'codigo' as codigo
      from public.orders o
      where o.payload->>'codigo' is not null and o.payload->>'codigo' <> ''

      union

      select o.payload->>'codigo_comanda' as codigo
      from public.orders o
      where o.payload->>'codigo_comanda' is not null and o.payload->>'codigo_comanda' <> ''
    ) order_codes
    where order_codes.codigo ~ ('^' || prefix || '[0-9]{4}$')

    union

    select substring(r.codigo from 5)::integer as numero
    from public.order_code_reservations r
    where r.codigo ~ ('^' || prefix || '[0-9]{4}$')
      and r.expires_at >= now()

    union

    select c.last_number as numero
    from public.order_code_counters c
    where c.year = current_year
  )
  select coalesce(max(numero), 0) + 1
  into next_number
  from used_numbers;

  if next_number > 9999 then
    raise exception 'No hay codigos disponibles para el año %', current_year;
  end if;

  next_code := prefix || lpad(next_number::text, 4, '0');

  insert into public.order_code_reservations (codigo, user_id, reserved_at, expires_at)
  values (next_code, auth.uid(), now(), now() + interval '2 hours')
  on conflict (codigo) do update
  set
    user_id = excluded.user_id,
    reserved_at = excluded.reserved_at,
    expires_at = excluded.expires_at;

  return next_code;
end;
$$;

create or replace function public.release_order_code(code_to_release text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.order_code_reservations r
  where r.codigo = code_to_release
    and not exists (
      select 1
      from public.orders o
      where o.codigo = code_to_release
         or o.payload->>'codigo' = code_to_release
         or o.payload->>'codigo_comanda' = code_to_release
    )
    and (
      r.user_id = auth.uid()
      or auth.uid() is null
      or exists (
        select 1
        from public.app_user_roles role_row
        where role_row.user_id = auth.uid()
          and role_row.role = 'admin'
          and role_row.active = true
      )
    );
end;
$$;

grant execute on function public.next_order_code() to authenticated;
grant execute on function public.release_order_code(text) to authenticated;

-- Verificacion:
-- select * from public.order_code_reservations order by reserved_at desc;
-- select codigo, estado, created_at from public.orders where codigo like 'D4%' order by codigo;
