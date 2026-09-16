-- Agrega "Postres variados" a las listas de postres gestionadas en Supabase.
-- Ejecutar desde Supabase SQL Editor.

insert into public.foodbox_opciones (nombre, tipo, activo, orden)
select 'Postres variados', 'postre', true,
       coalesce((select max(orden) + 1 from public.foodbox_opciones where tipo = 'postre'), 1)
where not exists (
  select 1
  from public.foodbox_opciones
  where lower(nombre) = lower('Postres variados')
    and tipo = 'postre'
);

insert into public.diy_bandejas_foodbox (nombre, tipo, activo, orden)
select 'Postres variados', 'postre', true,
       coalesce((select max(orden) + 1 from public.diy_bandejas_foodbox where tipo = 'postre'), 1)
where not exists (
  select 1
  from public.diy_bandejas_foodbox
  where lower(nombre) = lower('Postres variados')
    and tipo = 'postre'
);
