-- Actualizacion de catalogo public.logistics_materials
-- Generado desde logistics_materials_editable.xlsx
-- Recomendacion: ejecuta primero en Supabase SQL Editor despues de hacer backup.
begin;

-- Necesario para gen_random_uuid() en filas nuevas sin id.
create extension if not exists pgcrypto;

-- Si esta tabla aun no tiene item_id unico, descomenta y ejecuta esta linea una vez:
-- create unique index if not exists logistics_materials_item_id_key on public.logistics_materials (item_id);

-- 1) Items principales
insert into public.logistics_materials
  (id, item_id, tipo, nombre, unidad, activo, orden, parent_id, tiene_subitems, solo_loza, solo_desechable)
values
  ('27632629-0f97-410a-91b1-ee349f546966'::uuid, 'beb_agua_gas', 'bebidas', 'Agua con Gas', 'botellas', true, 2, null, false, false, false),
  ('7a7fad24-8f3a-4384-a4ff-6c59f34872c9'::uuid, 'beb_agua', 'bebidas', 'Agua mineral', 'botellas', true, 1, null, false, false, false),
  ('33025607-faa4-47b7-82b5-889a8c3b2915'::uuid, 'beb_cava', 'bebidas', 'Cava', 'botellas', true, 22, null, false, false, false),
  ('2645e218-9adf-4938-a439-b35eb6ef1580'::uuid, 'beb_cerveza', 'bebidas', 'Cerveza', 'uds', true, 6, null, false, false, false),
  ('cc478657-669a-4f6c-a669-8da47c659a1d'::uuid, 'beb_refresco', 'bebidas', 'Refrescos', 'uds', true, 2, null, true, false, false),
  ('28700ad8-a88a-4919-a7f3-c5a3d93c1f17'::uuid, 'beb_refrescos_variados', 'bebidas', 'Refrescos Variados', 'uds', true, 10, null, false, false, false),
  ('aa69bd77-e01e-4332-8d96-c8c5602a8a70'::uuid, 'beb_vino_blanco', 'bebidas', 'Vino blanco', 'botellas', true, 21, null, false, false, false),
  ('a42af064-10cc-4578-83c0-43ee9e4a24c1'::uuid, 'beb_vino_tinto', 'bebidas', 'Vino tinto', 'botellas', true, 20, null, false, false, false),
  ('d447d5eb-886d-407d-a100-a153a74addf6'::uuid, 'beb_zumo_naranja', 'bebidas', 'Zumo de naranja', 'litros', true, 7, null, false, false, false),
  ('1346edde-d8b1-4dcf-813e-2dfb07bbd6a2'::uuid, 'ext_mesa_tablero', 'extras', 'Mesa tablero', 'uds', true, 1, null, false, false, false),
  ('e0db1fac-0ead-4f0f-8925-669fbe190618'::uuid, 'ext_mantel', 'extras', 'Mantel', 'uds', true, 2, null, true, false, false),
  ('0371751d-e733-4af6-81eb-ce60ff1111d6'::uuid, 'ext_alzadores', 'extras', 'Alzadores', 'uds', true, 3, null, false, false, false),
  ('cd2c862a-d87f-45b9-ad88-d4a99e38d9b3'::uuid, 'ext_flores', 'extras', 'Flores', 'uds', true, 4, null, false, false, false),
  ('0addbb1c-2284-43d3-9cd2-9d52155d01e8'::uuid, 'ext_hielo', 'extras', 'Hielo', 'bolsa', true, 5, null, false, false, false),
  (gen_random_uuid(), 'ext_mesa_velador', 'extras', 'Mesa velador', 'uds', true, 6, null, false, false, false),
  ('dbc563be-df56-4783-8dca-6f47e26e0e5d'::uuid, 'ext_pinzas', 'extras', 'Cubitera + Pinzas', 'uds', true, 7, null, false, false, false),
  ('36d183c2-b041-4c64-b7d2-3b76e52edfa3'::uuid, 'ext_guantes', 'extras', 'Guantes', 'cajas', true, 8, null, false, false, false),
  ('3a6e55f0-64ab-4c74-a19f-bdb4c85a31d8'::uuid, 'men_vasos_zumo', 'menaje', 'Vasos desechables zumo', 'uds', true, 1, null, false, false, false),
  ('548b2e15-1315-4673-ad3d-e5cd8102e816'::uuid, 'men_kit_cafe', 'menaje', 'Kit desechable para cafÃ©', 'uds', true, 2, null, false, false, false),
  ('a045fca2-d788-491d-a521-f731bc744e54'::uuid, 'men_servilletas', 'menaje', 'Servilletas', 'uds', true, 3, null, false, false, false),
  ('0a15752e-e167-401c-b72e-f3bb4645ccc0'::uuid, 'men_platos_desech', 'menaje', 'Platos desechables', 'uds', true, 4, null, false, false, true),
  ('ed0bb9db-e890-4bef-80d7-8cba47f1f965'::uuid, 'men_cubiertos', 'menaje', 'Cubiertos desechables', 'sets', true, 5, null, false, false, true),
  (gen_random_uuid(), 'ext_cristal', 'menaje', 'Cristal', 'uds', true, 6, null, true, false, false),
  ('f70eaa45-10ff-4a5e-9053-9cbbe3f06c03'::uuid, 'men_jarras', 'menaje', 'Botella de cristal', 'uds', true, 11, null, false, false, false),
  ('c4ffea2a-e6bb-4bb4-87e8-0929f73b67fc'::uuid, 'men_loza_cafe', 'menaje', 'Kit loza para café', 'uds', true, 12, null, false, true, false),
  ('7f00110a-5a84-4e9f-b42a-589a1ef793b1'::uuid, 'men_platos_postre', 'menaje', 'Platos Postre', 'uds', true, 13, null, false, true, false),
  ('d7b5de13-c4a2-4640-99af-6574301e5b72'::uuid, 'men_cubiertos_met', 'menaje', 'Cubiertos MetÃ¡licos', 'sets', true, 14, null, false, true, false),
  (gen_random_uuid(), 'ext_mantel_velador', 'extras', 'Mantel velador', 'uds', true, 9, null, true, false, false),
  (gen_random_uuid(), 'ext_bandeja_camarero', 'extras', 'Bandeja camarero + Lito', 'uds', true, 10, null, false, false, false),
  (gen_random_uuid(), 'ext_mandil', 'extras', 'Mandil', 'uds', true, 11, null, false, false, false)
on conflict (item_id) do update set
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

-- 2) Subitems / opciones
insert into public.logistics_materials
  (id, item_id, tipo, nombre, unidad, activo, orden, parent_id, tiene_subitems, solo_loza, solo_desechable)
values
  ('efa3cfb7-7e23-41b3-9329-fe9dc4dd20b2'::uuid, 'beb_ref_cocacola', 'bebidas', 'Coca-Cola', 'uds', true, 1, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('0b957e64-c6e0-4441-943b-3122d64e0523'::uuid, 'beb_ref_cocacola_zero', 'bebidas', 'Coca-Cola Zero', 'uds', true, 2, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('de6a3b39-94eb-4fde-88c5-3c281f25c8b2'::uuid, 'beb_ref_cocacola_light', 'bebidas', 'Coca-Cola Light', 'uds', true, 3, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('939f1fd5-653b-4953-b37b-6ba0d4026d02'::uuid, 'beb_ref_fanta_limon', 'bebidas', 'Fanta LimÃ³n', 'uds', true, 4, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('9a69e4bd-cf24-4c33-bf10-06536992e20d'::uuid, 'beb_ref_fanta_naranja', 'bebidas', 'Fanta Naranja', 'uds', true, 5, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('3d419c49-1776-46c3-93b2-0aa05a32a0ab'::uuid, 'beb_ref_aquarius_limon', 'bebidas', 'Aquarius LimÃ³n', 'uds', true, 6, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('3c77d015-dfb6-48ca-bf01-7f2968244115'::uuid, 'beb_ref_aquarius_naranja', 'bebidas', 'Aquarius Naranja', 'uds', true, 7, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('b5aaa8ab-c79a-443a-9efe-2be067bed73a'::uuid, 'beb_ref_sprite', 'bebidas', 'Sprite', 'uds', true, 8, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('6b54f2bb-89c1-44bc-baa7-f9e113c9a5eb'::uuid, 'beb_ref_nestea', 'bebidas', 'Nestea', 'uds', true, 9, (select id from public.logistics_materials where item_id = 'beb_refresco' limit 1), false, false, false),
  ('cb0f8c39-027e-4462-b271-ca623e723f29'::uuid, 'ext_mantel_algodon', 'extras', 'Mantel de AlgodÃ³n', 'uds', true, 1, (select id from public.logistics_materials where item_id = 'ext_mantel' limit 1), false, false, false),
  ('ac2b1bb2-a65a-4521-bfb5-9eb33e5003f4'::uuid, 'ext_mantel_desechable', 'extras', 'Mantel Desechable', 'uds', true, 2, (select id from public.logistics_materials where item_id = 'ext_mantel' limit 1), false, false, false),
  (gen_random_uuid(), 'men_vasos_bajos', 'menaje', 'Barca Vaso on the rock', 'uds', true, 1, (select id from public.logistics_materials where item_id = 'ext_cristal' limit 1), false, false, false),
  (gen_random_uuid(), 'men_vasos_altos', 'menaje', 'Barca Vaso alto', 'uds', true, 2, (select id from public.logistics_materials where item_id = 'ext_cristal' limit 1), false, false, false),
  ('a4152872-c26a-4405-a273-b99ac3d2d503'::uuid, 'men_copas_vino', 'menaje', 'Barca Copas de vino', 'uds', true, 3, (select id from public.logistics_materials where item_id = 'ext_cristal' limit 1), false, false, false),
  ('6bf4987d-0a4c-4e66-b768-6b531b80445b'::uuid, 'men_copas_cava', 'menaje', 'Barca Copas de cava', 'uds', true, 4, (select id from public.logistics_materials where item_id = 'ext_cristal' limit 1), false, false, false),
  (gen_random_uuid(), 'ext_mantel_algodon_mantel_velador', 'extras', 'Mantel de AlgodÃ³n', 'uds', true, 1, (select id from public.logistics_materials where item_id = 'ext_mantel_velador' limit 1), false, false, false),
  (gen_random_uuid(), 'ext_mantel_cubre_velador', 'extras', 'Mantel Desechable', 'uds', true, 2, (select id from public.logistics_materials where item_id = 'ext_mantel_velador' limit 1), false, false, false)
on conflict (item_id) do update set
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

commit;