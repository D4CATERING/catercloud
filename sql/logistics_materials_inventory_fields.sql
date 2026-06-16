alter table public.logistics_materials
  add column if not exists subcategoria text,
  add column if not exists stock_total numeric not null default 0;

comment on column public.logistics_materials.subcategoria is
  'Grupo interno para ordenar el inventario, por ejemplo Vajilla, Textil o Cristaleria.';

comment on column public.logistics_materials.stock_total is
  'Cantidad disponible en inventario para control logistico.';
