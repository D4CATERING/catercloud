-- Numeracion reutilizable de comandas.
-- Regla: si se elimina una comanda, su numero queda disponible otra vez.
-- Ejemplo: si existen D4260001 y D4260003, la siguiente reserva sera D4260002.

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
  year_prefix text := right(extract(year from timezone('Europe/Madrid', now()))::integer::text, 2);
  prefix text := 'D4' || right(extract(year from timezone('Europe/Madrid', now()))::integer::text, 2);
  next_number integer;
  next_code text;
begin
  perform pg_advisory_xact_lock(hashtext('catercloud_order_code_' || current_year::text));

  delete from public.order_code_reservations
  where expires_at < now()
     or exists (
       select 1
       from public.orders o
       where o.codigo = order_code_reservations.codigo
     );

  with used_numbers as (
    select substring(codigo from 5)::integer as numero
    from public.orders
    where codigo ~ ('^' || prefix || '[0-9]{4}$')

    union

    select substring(codigo from 5)::integer as numero
    from public.order_code_reservations
    where codigo ~ ('^' || prefix || '[0-9]{4}$')
      and expires_at >= now()
  )
  select serie.numero
  into next_number
  from generate_series(1, 9999) as serie(numero)
  left join used_numbers used on used.numero = serie.numero
  where used.numero is null
  order by serie.numero
  limit 1;

  if next_number is null then
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

  insert into public.order_code_counters (year, last_number, updated_at)
  values (current_year, next_number, now())
  on conflict (year) do update
  set
    last_number = greatest(public.order_code_counters.last_number, excluded.last_number),
    updated_at = now();

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
  delete from public.order_code_reservations
  where codigo = code_to_release
    and not exists (
      select 1
      from public.orders o
      where o.codigo = code_to_release
    )
    and (
      user_id = auth.uid()
      or auth.uid() is null
      or exists (
        select 1
        from public.app_user_roles r
        where r.user_id = auth.uid()
          and r.role = 'admin'
          and r.active = true
      )
    );
end;
$$;

grant execute on function public.next_order_code() to authenticated;
grant execute on function public.release_order_code(text) to authenticated;

-- Verificacion:
-- select * from public.order_code_reservations order by reserved_at desc;
-- select * from public.order_code_counters order by year desc;
