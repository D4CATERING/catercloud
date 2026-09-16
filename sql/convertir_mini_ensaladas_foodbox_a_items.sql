-- Convierte las variantes de "Mini ensaladas" en items independientes
-- dentro de diy_bandejas_foodbox para poder asignar cantidades por cada una.
-- Ejecutar desde Supabase SQL Editor.

do $$
declare
  v_base_orden integer;
  v_parent_id uuid;
begin
  select id
    into v_parent_id
  from public.diy_bandejas_foodbox
  where activo = true
    and lower(nombre) like lower('Mini ensaladas%')
  order by orden asc
  limit 1;

  select coalesce(orden, 0)
    into v_base_orden
  from public.diy_bandejas_foodbox
  where id = v_parent_id;

  v_base_orden := coalesce(v_base_orden, (
    select coalesce(max(orden), 0) + 1
    from public.diy_bandejas_foodbox
    where tipo = 'salado'
  ));

  if v_parent_id is not null then
    update public.diy_bandejas_foodbox
    set activo = false
    where id = v_parent_id;

    update public.diy_bandejas_foodbox_variantes
    set activo = false
    where opcion_id = v_parent_id;
  end if;

  insert into public.diy_bandejas_foodbox (nombre, tipo, activo, orden)
  select nombre, 'salado', true, v_base_orden + offset_orden
  from (
    values
      ('Mini poke teriyaki', 0),
      ('Mini poke de salmón', 1),
      ('Mini ensalada toscana', 2),
      ('Mini ensalada de pasta-pesto', 3),
      ('Mini ensalada L.A', 4),
      ('Mini tabule de cuscús con garbanzo', 5),
      ('Mini ensalada griega', 6),
      ('Mini ensalada César', 7)
  ) as nuevas(nombre, offset_orden)
  where not exists (
    select 1
    from public.diy_bandejas_foodbox actual
    where lower(actual.nombre) = lower(nuevas.nombre)
      and actual.tipo = 'salado'
  );
end $$;
