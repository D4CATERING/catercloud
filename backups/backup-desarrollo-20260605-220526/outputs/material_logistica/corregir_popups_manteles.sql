-- Corrige la estructura de popups para Mantel Tablero y Mantel velador.
-- Ejecutar en Supabase SQL Editor.

begin;

-- 1) Asegurar padres
update public.logistics_materials
set tiene_subitems = true,
    parent_id = null,
    activo = true,
    updated_at = now()
where item_id in ('ext_mantel_tablero', 'ext_mantel_velador');

-- 2) Asegurar opciones de Mantel Tablero
update public.logistics_materials
set parent_id = (select id from public.logistics_materials where item_id = 'ext_mantel_tablero' limit 1),
    tiene_subitems = false,
    activo = true,
    updated_at = now()
where item_id in ('ext_mantel_algodon', 'ext_mantel_desechable');

-- 3) Asegurar opciones de Mantel velador
update public.logistics_materials
set parent_id = (select id from public.logistics_materials where item_id = 'ext_mantel_velador' limit 1),
    tiene_subitems = false,
    activo = true,
    updated_at = now()
where item_id in ('ext_mantel_algodon_mantel_velador', 'ext_mantel_cubre_velador');

commit;

-- Comprobacion:
-- select p.item_id as padre, p.nombre, p.tiene_subitems, h.item_id as opcion, h.nombre as opcion_nombre
-- from public.logistics_materials p
-- left join public.logistics_materials h on h.parent_id = p.id
-- where p.item_id in ('ext_mantel_tablero', 'ext_mantel_velador')
-- order by p.item_id, h.orden;
