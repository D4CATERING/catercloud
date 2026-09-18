-- Limpieza y ajuste de reservas de codigos de comanda.
-- Ejecutar en Supabase SQL Editor.
-- No borra comandas de public.orders.

-- Limpieza normal: reservas vencidas o codigos que ya quedaron guardados.
delete from public.order_code_reservations r
where r.expires_at < now()
   or exists (
     select 1
     from public.orders o
     where o.codigo = r.codigo
   );

-- Limpieza de pruebas: libera tambien reservas activas que no llegaron a guardarse.
-- Usar cuando se han cancelado formularios o se quiere limpiar el entorno de pruebas.
delete from public.order_code_reservations r
where not exists (
  select 1
  from public.orders o
  where o.codigo = r.codigo
);

create or replace function public.release_order_code(code_to_release text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.order_code_reservations
  where codigo = code_to_release
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

grant execute on function public.release_order_code(text) to authenticated;

-- Verificacion:
-- select * from public.order_code_reservations order by reserved_at desc;
