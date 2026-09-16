-- Reinicio total de comandas de prueba.
-- Usar solo si quieres borrar las comandas actuales y empezar de nuevo desde D4YY0001.
-- Recomendado: exporta public.orders antes de ejecutar si necesitas conservar evidencia.

begin;

-- Si has usado el modulo de rutas, limpia primero las paradas y rutas.
delete from public.route_stops;
delete from public.daily_routes;

-- Borra las comandas/pedidos guardados.
delete from public.orders;

-- Opcional: limpia el archivo de duplicados de pruebas.
delete from public.orders_duplicates_archive;

-- Opcional: limpia auditoria de acciones de pruebas.
-- Si quieres conservar la auditoria, deja esta linea comentada.
-- delete from public.app_activity_log;

-- Reinicia el contador del año actual para que la proxima comanda sea D4YY0001.
insert into public.order_code_counters (year, last_number)
values (extract(year from timezone('Europe/Madrid', now()))::integer, 0)
on conflict (year) do update
set
  last_number = 0,
  updated_at = now();

commit;

-- Verificacion.
select count(*) as orders_restantes from public.orders;
select * from public.order_code_counters order by year desc;
