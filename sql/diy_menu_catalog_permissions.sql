-- Permisos de lectura para catalogos DIY usados por la aplicacion.
-- Ejecutar en Supabase SQL Editor.
-- No modifica datos: solo asegura que usuarios autenticados puedan leer menus y variantes.

alter table public.diy_bandejas_desayunos enable row level security;
alter table public.diy_bandejas_desayunos_variantes enable row level security;
alter table public.diy_bandejas_foodbox enable row level security;
alter table public.diy_bandejas_foodbox_variantes enable row level security;

drop policy if exists "diy_bandejas_desayunos_read_authenticated" on public.diy_bandejas_desayunos;
create policy "diy_bandejas_desayunos_read_authenticated"
on public.diy_bandejas_desayunos
for select
to authenticated
using (true);

drop policy if exists "diy_bandejas_desayunos_variantes_read_authenticated" on public.diy_bandejas_desayunos_variantes;
create policy "diy_bandejas_desayunos_variantes_read_authenticated"
on public.diy_bandejas_desayunos_variantes
for select
to authenticated
using (true);

drop policy if exists "diy_bandejas_foodbox_read_authenticated" on public.diy_bandejas_foodbox;
create policy "diy_bandejas_foodbox_read_authenticated"
on public.diy_bandejas_foodbox
for select
to authenticated
using (true);

drop policy if exists "diy_bandejas_foodbox_variantes_read_authenticated" on public.diy_bandejas_foodbox_variantes;
create policy "diy_bandejas_foodbox_variantes_read_authenticated"
on public.diy_bandejas_foodbox_variantes
for select
to authenticated
using (true);
