-- Agrega descripciones visibles para los kits de cafe en public.logistics_materials.
-- Ejecutar en Supabase SQL Editor.

alter table public.logistics_materials
  add column if not exists descripcion text;

update public.logistics_materials
set descripcion = 'Taza, Plato, Cucharilla, Caja Madera Azucarilla/infusiones'
where item_id = 'men_kit_loza_cafe'
   or id in (
       'f9f80ca6-a1c8-45f1-83ff-e112046afb4c',
       'c4ffea2a-e6bb-4bb4-87e8-0929f73b67fc'
   )
   or lower(nombre) like '%kit%loza%caf%';

update public.logistics_materials
set descripcion = 'Vaso, Removedores, Caja Azucarilla/Infusiones'
where item_id = 'men_kit_desechable_cafe'
   or id in (
       '231a78f5-36f1-4066-bca8-289cc3d2ee38',
       '548b2e15-1315-4673-ad3d-e5cd8102e816'
   )
   or lower(nombre) like '%kit%desechable%caf%';

-- Verificacion
select item_id, nombre, descripcion
from public.logistics_materials
where id in (
    'f9f80ca6-a1c8-45f1-83ff-e112046afb4c',
    '231a78f5-36f1-4066-bca8-289cc3d2ee38',
    'c4ffea2a-e6bb-4bb4-87e8-0929f73b67fc',
    '548b2e15-1315-4673-ad3d-e5cd8102e816'
)
or lower(nombre) like '%kit%loza%caf%'
or lower(nombre) like '%kit%desechable%caf%'
order by nombre;
