-- SINCRONIZACION COMPLETA de public.logistics_materials desde Excel
-- Conserva solo los item_id presentes en logistics_materials_supabase_actual.xlsx / Material actual.
-- ATENCION: elimina materiales que no esten en el Excel y sus relaciones en menu_materials.
begin;

create extension if not exists pgcrypto;
create unique index if not exists logistics_materials_item_id_key on public.logistics_materials (item_id);

create temporary table tmp_keep_logistics_materials (item_id text primary key) on commit drop;
insert into tmp_keep_logistics_materials (item_id) values
  ('beb_agua'),
  ('beb_agua_gas'),
  ('beb_cava'),
  ('beb_cerveza'),
  ('beb_ref_aquarius_limon'),
  ('beb_ref_aquarius_naranja'),
  ('beb_ref_cocacola'),
  ('beb_ref_cocacola_light'),
  ('beb_ref_cocacola_zero'),
  ('beb_ref_fanta_limon'),
  ('beb_ref_fanta_naranja'),
  ('beb_ref_nestea'),
  ('beb_ref_sprite'),
  ('beb_ref_variados'),
  ('beb_refresco'),
  ('beb_vino_blanco'),
  ('beb_vino_tinto'),
  ('ext_alzadores'),
  ('ext_bandeja_camarero'),
  ('ext_cristal'),
  ('ext_flores'),
  ('ext_guantes'),
  ('ext_hielo'),
  ('ext_mandil'),
  ('ext_mantel_algodon'),
  ('ext_mantel_algodon_mantel_velador'),
  ('ext_mantel_cubre_velador'),
  ('ext_mantel_desechable'),
  ('ext_mantel_tablero'),
  ('ext_mantel_velador'),
  ('ext_mesa_tablero'),
  ('ext_mesa_velador'),
  ('ext_pinzas'),
  ('men_calientaplatos'),
  ('men_copas_cava'),
  ('men_copas_vino'),
  ('men_cubiertos'),
  ('men_cubiertos_met'),
  ('men_cucharas_cafe'),
  ('men_jarras'),
  ('men_kit_cafe'),
  ('men_loza_cafe'),
  ('men_platos_cafe'),
  ('men_platos_desech'),
  ('men_platos_postre'),
  ('men_servilletas'),
  ('men_vasos_altos'),
  ('men_vasos_bajos'),
  ('men_vasos_zumo');

-- 1) Actualizar filas existentes que tienen id
insert into public.logistics_materials
  (id, item_id, tipo, nombre, unidad, activo, orden, parent_id, tiene_subitems, solo_loza, solo_desechable)
values
  ('27632629-0f97-410a-91b1-ee349f546966'::uuid, 'beb_agua_gas', 'bebidas', 'Agua con Gas', 'botellas', true, 2, null, false, false, false),
  ('7a7fad24-8f3a-4384-a4ff-6c59f34872c9'::uuid, 'beb_agua', 'bebidas', 'Agua mineral', 'botellas', true, 1, null, false, false, false),
  ('33025607-faa4-47b7-82b5-889a8c3b2915'::uuid, 'beb_cava', 'bebidas', 'Cava', 'botellas', true, 7, null, false, false, false),
  ('2645e218-9adf-4938-a439-b35eb6ef1580'::uuid, 'beb_cerveza', 'bebidas', 'Cerveza', 'uds', true, 4, null, false, false, false),
  ('cc478657-669a-4f6c-a669-8da47c659a1d'::uuid, 'beb_refresco', 'bebidas', 'Refrescos', 'uds', true, 3, null, true, false, false),
  ('efa3cfb7-7e23-41b3-9329-fe9dc4dd20b2'::uuid, 'beb_ref_cocacola', 'bebidas', 'Coca-Cola', 'uds', true, 2, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('0b957e64-c6e0-4441-943b-3122d64e0523'::uuid, 'beb_ref_cocacola_zero', 'bebidas', 'Coca-Cola Zero', 'uds', true, 3, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('de6a3b39-94eb-4fde-88c5-3c281f25c8b2'::uuid, 'beb_ref_cocacola_light', 'bebidas', 'Coca-Cola Light', 'uds', true, 4, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('939f1fd5-653b-4953-b37b-6ba0d4026d02'::uuid, 'beb_ref_fanta_limon', 'bebidas', 'Fanta Limón', 'uds', true, 5, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('9a69e4bd-cf24-4c33-bf10-06536992e20d'::uuid, 'beb_ref_fanta_naranja', 'bebidas', 'Fanta Naranja', 'uds', true, 6, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('3d419c49-1776-46c3-93b2-0aa05a32a0ab'::uuid, 'beb_ref_aquarius_limon', 'bebidas', 'Aquarius Limón', 'uds', true, 7, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('3c77d015-dfb6-48ca-bf01-7f2968244115'::uuid, 'beb_ref_aquarius_naranja', 'bebidas', 'Aquarius Naranja', 'uds', true, 8, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('b5aaa8ab-c79a-443a-9efe-2be067bed73a'::uuid, 'beb_ref_sprite', 'bebidas', 'Sprite', 'uds', true, 9, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('6b54f2bb-89c1-44bc-baa7-f9e113c9a5eb'::uuid, 'beb_ref_nestea', 'bebidas', 'Nestea', 'uds', true, 10, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('28700ad8-a88a-4919-a7f3-c5a3d93c1f17'::uuid, 'beb_ref_variados', 'bebidas', 'Refrescos Variados', 'uds', true, 1, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('aa69bd77-e01e-4332-8d96-c8c5602a8a70'::uuid, 'beb_vino_blanco', 'bebidas', 'Vino blanco', 'botellas', true, 5, null, false, false, false),
  ('a42af064-10cc-4578-83c0-43ee9e4a24c1'::uuid, 'beb_vino_tinto', 'bebidas', 'Vino tinto', 'botellas', true, 6, null, false, false, false),
  ('0371751d-e733-4af6-81eb-ce60ff1111d6'::uuid, 'ext_alzadores', 'extras', 'Alzadores', 'uds', true, 5, null, false, false, false),
  ('99709ffb-80c3-42bb-af27-85c448010d1b'::uuid, 'ext_bandeja_camarero', 'extras', 'Bandeja camarero + Lito', 'uds', true, 7, null, false, false, false),
  ('dbc563be-df56-4783-8dca-6f47e26e0e5d'::uuid, 'ext_pinzas', 'extras', 'Cubitera + Pinzas', 'uds', true, 9, null, false, false, false),
  ('cd2c862a-d87f-45b9-ad88-d4a99e38d9b3'::uuid, 'ext_flores', 'extras', 'Flores', 'uds', true, 6, null, false, false, false),
  ('36d183c2-b041-4c64-b7d2-3b76e52edfa3'::uuid, 'ext_guantes', 'extras', 'Guantes', 'cajas', true, 10, null, false, false, false),
  ('0addbb1c-2284-43d3-9cd2-9d52155d01e8'::uuid, 'ext_hielo', 'extras', 'Hielo', 'bolsa', true, 11, null, false, false, false),
  ('66502f78-28cb-4324-8b90-796f62911fc1'::uuid, 'ext_mandil', 'extras', 'Mandil', 'uds', true, 8, null, false, false, false),
  ('e0db1fac-0ead-4f0f-8925-669fbe190618'::uuid, 'ext_mantel_tablero', 'extras', 'Mantel Tablero', 'uds', true, 2, null, true, false, false),
  ('cb0f8c39-027e-4462-b271-ca623e723f29'::uuid, 'ext_mantel_algodon', 'extras', 'Mantel de Algodón', 'uds', true, 1, (select id from public.logistics_materials where item_id = 'ext_mantel_tablero' limit 1), false, false, false),
  ('ac2b1bb2-a65a-4521-bfb5-9eb33e5003f4'::uuid, 'ext_mantel_desechable', 'extras', 'Mantel Desechable', 'uds', true, 2, (select id from public.logistics_materials where item_id = 'ext_mantel_tablero' limit 1), false, false, false),
  ('97fce65d-d11a-4885-be82-1b05b92c4cb0'::uuid, 'ext_mantel_velador', 'extras', 'Mantel velador', 'uds', true, 4, null, true, false, false),
  ('a61cc4e6-edab-48f4-9925-46813270742e'::uuid, 'ext_mantel_algodon_mantel_velador', 'extras', 'Mantel de Algodón', 'uds', true, 1, (select id from public.logistics_materials where item_id = 'ext_mantel_velador' limit 1), false, false, false),
  ('dc2bed93-ce38-4f0c-8cd8-c8b7ed26867c'::uuid, 'ext_mantel_cubre_velador', 'extras', 'Cubre Velador', 'uds', true, 2, (select id from public.logistics_materials where item_id = 'ext_mantel_velador' limit 1), false, false, false),
  ('1346edde-d8b1-4dcf-813e-2dfb07bbd6a2'::uuid, 'ext_mesa_tablero', 'extras', 'Mesa tablero', 'uds', true, 1, null, false, false, false),
  ('a4b579ab-0cdf-4f6f-abd9-26e93a651d99'::uuid, 'ext_mesa_velador', 'extras', 'Mesa velador', 'uds', true, 3, null, false, false, false),
  ('f70eaa45-10ff-4a5e-9053-9cbbe3f06c03'::uuid, 'men_jarras', 'menaje', 'Botella de cristal', 'uds', true, 10, null, false, false, false),
  ('e5df71de-6869-44cb-99d5-2d7be1d21c82'::uuid, 'men_calientaplatos', 'menaje', 'Calientaplatos', 'uds', true, 11, null, false, false, false),
  ('3410a638-a160-4c37-87f2-3897c0dccb64'::uuid, 'ext_cristal', 'menaje', 'Cristal', 'uds', true, 9, null, true, false, false),
  ('7dcc6aaa-e2b9-409d-bb31-fccd744b5797'::uuid, 'men_vasos_bajos', 'menaje', 'Barca Vaso on the rock', 'uds', true, 1, (select id from public.logistics_materials where item_id = 'ext_cristal' limit 1), false, false, false),
  ('15673926-827c-457a-97c5-89da5f78ae2d'::uuid, 'men_vasos_altos', 'menaje', 'Barca Vaso alto', 'uds', true, 2, (select id from public.logistics_materials where item_id = 'ext_cristal' limit 1), false, false, false),
  ('a4152872-c26a-4405-a273-b99ac3d2d503'::uuid, 'men_copas_vino', 'menaje', 'Barca Copas de vino', 'uds', true, 3, (select id from public.logistics_materials where item_id = 'ext_cristal' limit 1), false, false, false),
  ('6bf4987d-0a4c-4e66-b768-6b531b80445b'::uuid, 'men_copas_cava', 'menaje', 'Barca Copas de cava', 'uds', true, 4, (select id from public.logistics_materials where item_id = 'ext_cristal' limit 1), false, false, false),
  ('d7b5de13-c4a2-4640-99af-6574301e5b72'::uuid, 'men_cubiertos_met', 'menaje', 'Cubiertos Metalicos', 'sets', true, 8, null, false, true, false),
  ('ed0bb9db-e890-4bef-80d7-8cba47f1f965'::uuid, 'men_cubiertos', 'menaje', 'Cubiertos desechables', 'sets', true, 5, null, false, false, true),
  ('de685c9a-d994-4ac5-bf85-7f8e7547ea98'::uuid, 'men_cucharas_cafe', 'menaje', 'Cucharas para café', 'uds', true, 13, null, false, true, false),
  ('548b2e15-1315-4673-ad3d-e5cd8102e816'::uuid, 'men_kit_cafe', 'menaje', 'Kit desechable para café', 'uds', true, 2, null, false, false, false),
  ('c4ffea2a-e6bb-4bb4-87e8-0929f73b67fc'::uuid, 'men_loza_cafe', 'menaje', 'Kit loza para café', 'uds', true, 6, null, false, true, false),
  ('7f00110a-5a84-4e9f-b42a-589a1ef793b1'::uuid, 'men_platos_postre', 'menaje', 'Platos Postre', 'uds', true, 7, null, false, true, false),
  ('0a15752e-e167-401c-b72e-f3bb4645ccc0'::uuid, 'men_platos_desech', 'menaje', 'Platos desechables', 'uds', true, 4, null, false, false, true),
  ('ac6d2bd2-2e8d-47e1-9378-37d60d2cf26c'::uuid, 'men_platos_cafe', 'menaje', 'Platos para café', 'uds', true, 12, null, false, true, false),
  ('a045fca2-d788-491d-a521-f731bc744e54'::uuid, 'men_servilletas', 'menaje', 'Servilletas', 'uds', true, 3, null, false, false, false),
  ('3a6e55f0-64ab-4c74-a19f-bdb4c85a31d8'::uuid, 'men_vasos_zumo', 'menaje', 'Vasos desechables zumo', 'uds', true, 1, null, false, false, false)
on conflict (id) do update set
  item_id = excluded.item_id,
  tipo = excluded.tipo,
  nombre = excluded.nombre,
  unidad = excluded.unidad,
  activo = excluded.activo,
  orden = excluded.orden,
  parent_id = excluded.parent_id,
  tiene_subitems = excluded.tiene_subitems,
  solo_loza = excluded.solo_loza,
  solo_desechable = excluded.solo_desechable,
  updated_at = now();

-- 3) Eliminar relaciones de menu_materials para materiales que ya no estan en el Excel
delete from public.menu_materials mm
using public.logistics_materials lm
where mm.material_id = lm.id
  and not exists (select 1 from tmp_keep_logistics_materials k where k.item_id = lm.item_id);

-- 4) Eliminar primero subitems/opciones que ya no estan en el Excel
delete from public.logistics_materials lm
where lm.parent_id is not null
  and not exists (select 1 from tmp_keep_logistics_materials k where k.item_id = lm.item_id);

-- 5) Eliminar items principales que ya no estan en el Excel
delete from public.logistics_materials lm
where lm.parent_id is null
  and not exists (select 1 from tmp_keep_logistics_materials k where k.item_id = lm.item_id);

commit;

-- Comprobacion sugerida despues de ejecutar:
-- select tipo, count(*) from public.logistics_materials group by tipo order by tipo;